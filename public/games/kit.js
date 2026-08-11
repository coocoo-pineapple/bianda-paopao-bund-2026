// BPKit · 小游戏公共地基
// 设计前提：办公控件 = 游戏 HUD。标题栏放段位、状态栏放分数、批注栏放旁白、失焦放回合。
// 约束：classic script，加载期不碰 DOM（走 BPKit.ready），不依赖 $ / $$ / esc / osToast。
(function (root) {
  'use strict';

  // ---------- 私有小工具：不借外部的 $ / esc，游戏文件先于 os.js 跑也不炸 ----------
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else setTimeout(fn, 0);
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}

  // ================================================================
  // 存档：localStorage 全程 try/catch（隐私模式会抛），失败退回内存
  // ================================================================
  var memStore = {};
  function lsGet(k) {
    try { var v = localStorage.getItem(k); if (v != null) return v; } catch (e) {}
    return memStore[k];
  }
  function lsSet(k, v) {
    memStore[k] = v;
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  function save(ns) {
    var key = 'bp-' + ns;
    function all() {
      var raw = lsGet(key);
      if (!raw) return {};
      try { var o = JSON.parse(raw); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; }
    }
    return {
      all: all,
      get: function (k, dft) { var v = all()[k]; return v === undefined ? dft : v; },
      set: function (k, v) { var o = all(); o[k] = v; lsSet(key, JSON.stringify(o)); return v; },
      patch: function (obj) { var o = all(); for (var k in obj) o[k] = obj[k]; lsSet(key, JSON.stringify(o)); return o; },
      inc: function (k, by) { var o = all(), n = (+o[k] || 0) + (by === undefined ? 1 : by); o[k] = n; lsSet(key, JSON.stringify(o)); return n; },
      max: function (k, v) { var o = all(); if (!(o[k] >= v)) { o[k] = v; lsSet(key, JSON.stringify(o)); } return o[k]; },
      clear: function () { lsSet(key, '{}'); }
    };
  }

  // ================================================================
  // 段位：唯一真源。表按门槛从高到低，rank(n) 返回第一个够得着的
  // ================================================================
  function ranks(table) {
    return function (n) {
      for (var i = 0; i < table.length; i++) if (n >= table[i][0]) return table[i][1];
      return table[table.length - 1][1];
    };
  }
  var RANK = {
    // 爽文背单词沿用的那套，全站统一走这张表（弃用 app.html 的"练气→化神"）
    swagger: ranks([[100, '庄周'], [60, '装逼宗师'], [30, '黑话十级'], [10, '会话嘴替'], [0, '职场小白']]),
    chess: ranks([[20, '棋圣'], [10, '常务副总'], [5, '会议钉子户'], [1, '陪练'], [0, '新人']]),
    admin: ranks([[15, '首席巡检官'], [8, '行政主管'], [3, '工位侦探'], [0, '实习生']])
  };

  // ---------- 可订阅的数值：装逼值 / 打赏 共用一套 ----------
  function counter(key, initial) {
    var subs = [];
    var val = parseInt(lsGet(key), 10);
    if (!(val >= 0)) val = initial || 0;
    function emit() { for (var i = 0; i < subs.length; i++) { try { subs[i](val); } catch (e) {} } }
    return {
      get: function () { return val; },
      set: function (n) { val = n | 0; lsSet(key, String(val)); emit(); return val; },
      add: function (n) { return this.set(val + (n | 0)); },
      on: function (fn) { subs.push(fn); try { fn(val); } catch (e) {} return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; }
    };
  }
  var swagger = counter('bp-swagger', 0);
  swagger.rankName = function () { return RANK.swagger(swagger.get()); };

  // 打赏：按游戏 go 名分别计数，界面多处订阅同一个数字
  var tipSubs = [];
  var tip = {
    get: function (go) { return parseInt(lsGet('bp-tip-' + go), 10) || 0; },
    add: function (go, n) {
      var v = this.get(go) + (n === undefined ? 1 : n | 0);
      lsSet('bp-tip-' + go, String(v));
      for (var i = 0; i < tipSubs.length; i++) { try { tipSubs[i](go, v); } catch (e) {} }
      return v;
    },
    // base 是 GAMES 数组里的初始值，展示数 = 初始 + 本地累计
    total: function (go, base) { return (base || 0) + this.get(go); },
    on: function (fn) { tipSubs.push(fn); return function () { var i = tipSubs.indexOf(fn); if (i >= 0) tipSubs.splice(i, 1); }; }
  };

  // ================================================================
  // 暂停总线：四个信号任一为真即暂停
  //   1) 窗口没开 / 最小化   2) 老板键遮罩   3) 标签页切走   4) body.k-halt（截图闸）
  // 关键：os.js 关窗走的是 classList.remove('on')，不是 style.display —— 判 style 永远不成立
  // 全局只建 2 个 MutationObserver，且必须 attributeFilter:['class']
  //   （拖窗时 style 每帧都变，带上 'style' 会每帧触发回调）
  // ================================================================
  var pauseSubs = [];      // {win, fn, last}
  var pauseGlobal = false; // 老板键 / 标签页 / 手动闸 的合并态

  function winPaused(win) {
    if (pauseGlobal) return true;
    if (!win) return false;
    return !win.classList.contains('on') || win.classList.contains('min');
  }
  function pumpAll() {
    for (var i = 0; i < pauseSubs.length; i++) {
      var s = pauseSubs[i], now = winPaused(s.win);
      if (now !== s.last) { s.last = now; try { s.fn(now); } catch (e) {} }
    }
  }
  function recalcGlobal() {
    var mask = q('#desktopMask');
    var g = (!!mask && mask.classList.contains('on')) ||
            document.hidden ||
            document.body.classList.contains('k-halt');
    if (g !== pauseGlobal) {
      pauseGlobal = g;
      if (g) sfx.duck(true); else sfx.duck(false);   // 老板走过来听见游戏音效就穿帮了
    }
    pumpAll();
  }

  var pauseWired = false;
  function wirePause() {
    if (pauseWired || !window.MutationObserver) return;
    pauseWired = true;
    // 1) 全局：body 的 class（k-halt）+ 遮罩的 class（老板键）
    new MutationObserver(recalcGlobal).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    var mask = q('#desktopMask');
    if (mask) new MutationObserver(recalcGlobal).observe(mask, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', recalcGlobal);
    recalcGlobal();
  }

  // 每扇窗一个观察者，但只观察 class，且窗口数量有限（10 个游戏）
  var winObs = {};
  var pause = {
    watch: function (win, fn) {
      wirePause();
      var s = { win: win, fn: fn, last: winPaused(win) };
      pauseSubs.push(s);
      if (win && win.id && !winObs[win.id] && window.MutationObserver) {
        winObs[win.id] = new MutationObserver(pumpAll);
        winObs[win.id].observe(win, { attributes: true, attributeFilter: ['class'] });
      }
      try { fn(s.last); } catch (e) {}
      return function () { var i = pauseSubs.indexOf(s); if (i >= 0) pauseSubs.splice(i, 1); };
    },
    isPaused: winPaused,
    // 给 playwright：截图前挂闸，动画和计时全停
    halt: function (on) { document.body.classList.toggle('k-halt', on !== false); }
  };

  // ================================================================
  // 音效：纯 Web Audio 合成，零音频文件
  // 两个私有工厂 + 一张参数表，不是 10 段独立代码
  // ================================================================
  var AC = null, master = null, audioDead = false, muted = false, ducked = false;

  function ctx() {
    if (audioDead) return null;
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) { audioDead = true; return null; }
      try {
        AC = new C();
        master = AC.createGain();
        master.gain.value = 0.18;
        master.connect(AC.destination);
      } catch (e) { audioDead = true; return null; }
    }
    if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }

  // 噪声源：白噪 buffer，走 bandpass 出"敲击/走纸"质感
  function mkNoise(dur, freq, Q, gain, when) {
    var c = ctx(); if (!c) return;
    var n = Math.max(1, (c.sampleRate * dur) | 0);
    var buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource(); src.buffer = buf;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = Q || 1;
    var g = c.createGain();
    var t = when || c.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
    src.onended = function () { try { src.disconnect(); bp.disconnect(); g.disconnect(); } catch (e) {} };
  }

  // 音高源：正弦/方波/锯齿 + 指数衰减包络
  function mkTone(freq, dur, type, gain, when, slideTo) {
    var c = ctx(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    var t = when || c.currentTime;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.012, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
    o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) {} };
  }

  // 办公音色表：每个都是"办公室真会响的声音"
  var VOICE = {
    // 机械键盘：白噪敲击 + 低频 click 体。rate 每次随机 ±6%，连打不复读
    key: function () {
      var r = 1 + (Math.random() - 0.5) * 0.12;
      mkNoise(0.008, 2200 * r, 1.2, 0.5);
      mkTone(180 * r, 0.03, 'triangle', 0.14);
    },
    enter: function () { mkNoise(0.012, 1500, 1.0, 0.55); mkTone(120, 0.05, 'triangle', 0.2); },
    click: function () { mkNoise(0.006, 3000, 2.0, 0.35); },
    // 打印机：锯齿被方波 LFO 门控 = 步进走纸；结尾滑音 = 停纸
    printer: function () {
      var c = ctx(); if (!c) return;
      var t = c.currentTime, o = c.createOscillator(), lfo = c.createOscillator(),
          lg = c.createGain(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.5);
      lfo.type = 'square'; lfo.frequency.value = 55;
      lg.gain.value = 0.5;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(master);
      o.start(t); lfo.start(t); o.stop(t + 0.58); lfo.stop(t + 0.58);
      o.onended = function () { try { o.disconnect(); lfo.disconnect(); lg.disconnect(); g.disconnect(); } catch (e) {} };
    },
    // 新邮件：E5-G5-C6 三音琶音
    mail: function () {
      var c = ctx(); if (!c) return;
      var t = c.currentTime;
      mkTone(659.25, 0.12, 'sine', 0.16, t);
      mkTone(783.99, 0.12, 'sine', 0.16, t + 0.07);
      mkTone(1046.5, 0.22, 'sine', 0.18, t + 0.14);
    },
    // Windows 错误音：622+466 双音，方波，响两下
    err: function () {
      var c = ctx(); if (!c) return;
      var t = c.currentTime;
      mkTone(622.25, 0.13, 'square', 0.09, t);
      mkTone(466.16, 0.13, 'square', 0.09, t);
      mkTone(622.25, 0.13, 'square', 0.09, t + 0.17);
      mkTone(466.16, 0.13, 'square', 0.09, t + 0.17);
    },
    coin: function () {
      var c = ctx(); if (!c) return;
      var t = c.currentTime;
      mkTone(987.77, 0.07, 'square', 0.11, t);
      mkTone(1318.5, 0.18, 'square', 0.11, t + 0.06);
    },
    stamp: function () { mkNoise(0.05, 260, 0.7, 0.6); mkTone(90, 0.09, 'sine', 0.25); },
    deal: function () { mkNoise(0.035, 1800, 0.9, 0.3); },
    flip: function () { mkNoise(0.045, 900, 0.8, 0.28); mkTone(320, 0.05, 'triangle', 0.08); },
    ok: function () {
      var c = ctx(); if (!c) return;
      var t = c.currentTime;
      mkTone(880, 0.09, 'sine', 0.14, t);
      mkTone(1174.7, 0.16, 'sine', 0.14, t + 0.08);
    }
  };

  var sfx = {
    play: function (name) {
      if (muted || ducked || audioDead) return;
      var v = VOICE[name];
      if (v) { try { v(); } catch (e) {} }
    },
    seq: function (names, gap) {
      var i = 0, g = gap || 90;
      (function step() {
        if (i >= names.length) return;
        sfx.play(names[i++]);
        setTimeout(step, g);
      })();
    },
    mute: function (on) {
      muted = on !== false;
      if (master) { try { master.gain.setTargetAtTime(muted ? 0 : 0.18, AC.currentTime, 0.02); } catch (e) {} }
      return muted;
    },
    isMuted: function () { return muted; },
    // 老板键：不是可选项，遮罩一上就压到 0
    duck: function (on) {
      ducked = !!on;
      if (master && AC) { try { master.gain.setTargetAtTime((ducked || muted) ? 0 : 0.18, AC.currentTime, 0.02); } catch (e) {} }
    },
    // 浏览器要求用户手势后才能出声，首个 pointerdown/keydown 上解锁
    arm: function () {
      var go = function () { ctx(); };
      document.addEventListener('pointerdown', go, { once: true, capture: true });
      document.addEventListener('keydown', go, { once: true, capture: true });
    }
  };

  // ================================================================
  // 动效原语：复用 app.html 里已有的 keyframes，净新增只有 k-pop/k-shake/k-flash
  // reduced 下粒子类直接 return 不建 DOM；但 then 回调必须同步触发，否则结算页出不来
  // ================================================================
  function done(node, cb, ms) {
    var fired = false;
    function go() { if (fired) return; fired = true; try { node && node.remove(); } catch (e) {} if (cb) cb(); }
    if (node) node.addEventListener('animationend', go, { once: true });
    setTimeout(go, ms || 900);   // 双保险：animationend 丢了也能清
  }

  var fx = {
    // 错峰入场（梦蝶局三步法：设 --dd → 强制回流 → rAF 加类）
    deal: function (nodes, opt) {
      opt = opt || {};
      var step = opt.step === undefined ? 0.07 : opt.step;
      var cls = opt.cls || 'k-in';
      nodes = Array.prototype.slice.call(nodes);
      nodes.forEach(function (n, i) { n.style.setProperty('--dd', (i * step) + 's'); });
      if (reduced) { nodes.forEach(function (n) { n.classList.add(cls); }); if (opt.then) opt.then(); return; }
      if (nodes[0]) void nodes[0].offsetWidth;
      requestAnimationFrame(function () {
        nodes.forEach(function (n) { n.classList.add(cls); });
        if (opt.then) setTimeout(opt.then, (nodes.length * step + 0.5) * 1000);
      });
      if (opt.sound !== false) sfx.play('deal');
    },
    flip: function (elm, then) {
      if (!elm) return then && then();
      elm.classList.add('k-flip');
      sfx.play('flip');
      if (reduced) return then && then();
      setTimeout(function () { then && then(); }, 380);
    },
    // 盖戳：复用 @keyframes stampin
    stamp: function (box, txt, opt) {
      opt = opt || {};
      if (!box) return opt.then && opt.then();
      var s = el('div', 'k-stamp' + (opt.cls ? ' ' + opt.cls : ''), esc(txt));
      box.appendChild(s);
      sfx.play('stamp');
      if (reduced) { if (opt.then) opt.then(); return s; }
      if (opt.then) setTimeout(opt.then, 620);
      return s;
    },
    // 粒子：复用 bfxfl/bfxr/bfxd 的 --dx/--dy 约定。n 上限 16，同容器并发 ≤3
    burst: function (box, opt) {
      if (reduced || !box) return;
      if ((+box.dataset.kb || 0) >= 3) return;
      box.dataset.kb = (+box.dataset.kb || 0) + 1;
      opt = opt || {};
      var n = clamp(opt.n || 10, 1, 16);
      var wrap = el('div', 'k-burst');
      for (var i = 0; i < n; i++) {
        var p = el('i', 'k-p'), a = Math.PI * 2 * i / n + Math.random();
        var d = 26 + Math.random() * 30;
        p.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
        p.style.setProperty('--dy', (Math.sin(a) * d).toFixed(1) + 'px');
        if (opt.color) p.style.background = opt.color;
        p.style.animationDelay = (Math.random() * 0.08).toFixed(2) + 's';
        wrap.appendChild(p);
      }
      box.appendChild(wrap);
      done(wrap, function () { box.dataset.kb = Math.max(0, (+box.dataset.kb || 1) - 1); }, 900);
    },
    // 飘字 +N（复用 @keyframes petup 的语义）
    float: function (box, txt, opt) {
      if (!box) return;
      opt = opt || {};
      var f = el('span', 'k-float' + (opt.cls ? ' ' + opt.cls : ''), esc(txt));
      box.appendChild(f);
      done(f, null, 1100);
    },
    reveal: function (elm, then) {
      if (!elm) return then && then();
      if (reduced) { elm.classList.add('k-shown'); return then && then(); }
      elm.classList.add('k-reveal');
      setTimeout(function () { elm.classList.add('k-shown'); then && then(); }, 520);
    },
    rise: function (elm) { if (elm && !reduced) elm.classList.add('k-rise'); },
    ripple: function (box, ev) {
      if (reduced || !box) return;
      var r = box.getBoundingClientRect();
      var d = el('span', 'k-rip');
      var sz = Math.max(r.width, r.height);
      d.style.width = d.style.height = sz + 'px';
      d.style.left = ((ev ? ev.clientX - r.left : r.width / 2) - sz / 2) + 'px';
      d.style.top = ((ev ? ev.clientY - r.top : r.height / 2) - sz / 2) + 'px';
      box.appendChild(d);
      done(d, null, 700);
    },
    dots: function () { return '<span class="k-dots"><i></i><i></i><i></i></span>'; },
    glow: function (elm, on) { if (elm) elm.classList.toggle('k-glow', on !== false); },
    spotlight: function (box, on) { if (box) box.classList.toggle('k-spot', on !== false); },
    // 金币入账：掉落 + 飘字 + coin 音（不把金币塞进单元格数值）
    coin: function (box, n) {
      if (!box) return;
      sfx.play('coin');
      fx.float(box, '+' + n, { cls: 'k-gold' });
      if (reduced) return;
      var c = el('i', 'k-coin');
      box.appendChild(c);
      done(c, null, 900);
    },
    pop: function (elm) { if (elm && !reduced) { elm.classList.remove('k-pop'); void elm.offsetWidth; elm.classList.add('k-pop'); } },
    shake: function (elm) { if (elm && !reduced) { elm.classList.remove('k-shake'); void elm.offsetWidth; elm.classList.add('k-shake'); } }
  };

  // ================================================================
  // 计时器：CSS transition + 单个 setTimeout，全程零 setInterval
  // ================================================================
  function mkTimer(bar, cfg) {
    cfg = cfg || {};
    var dur = cfg.sec || 10, t0 = 0, left = dur, tid = 0, running = false, onEnd = cfg.onEnd;

    function paint(sec, animate) {
      if (!bar) return;
      bar.style.transition = 'none';
      bar.style.width = (sec / dur * 100) + '%';
      if (animate) {
        void bar.offsetWidth;
        bar.style.transition = 'width ' + sec + 's linear';
        bar.style.width = '0%';
      }
    }
    var api = {
      start: function (sec) {
        api.stop();
        dur = sec || cfg.sec || 10;
        left = dur;
        running = true;
        t0 = Date.now();
        paint(dur, true);
        tid = setTimeout(function () { running = false; left = 0; if (onEnd) onEnd(); }, dur * 1000);
        return api;
      },
      // 冻结：读回当前宽度再断开 transition，条停在原地不回弹
      freeze: function () {
        if (!running) return api;
        running = false;
        clearTimeout(tid);
        left = Math.max(0, dur - (Date.now() - t0) / 1000);
        if (bar) { bar.style.width = getComputedStyle(bar).width; bar.style.transition = 'none'; }
        return api;
      },
      pause: function () { return api.freeze(); },
      resume: function () {
        if (running || left <= 0) return api;
        running = true;
        t0 = Date.now() - (dur - left) * 1000;
        paint(left, true);
        tid = setTimeout(function () { running = false; left = 0; if (onEnd) onEnd(); }, left * 1000);
        return api;
      },
      stop: function () { running = false; clearTimeout(tid); return api; },
      reset: function () { api.stop(); left = dur; paint(dur, false); return api; },
      remain: function () { return running ? Math.max(0, dur - (Date.now() - t0) / 1000) : left; },
      running: function () { return running; },
      onEnd: function (fn) { onEnd = fn; return api; }
    };
    return api;
  }

  // ================================================================
  // UGC 沙箱：绝不给 allow-same-origin（给了就能读父页和 localStorage）
  // ================================================================
  function sandbox(cfg) {
    cfg = cfg || {};
    var shim = '<script>(function(){var P=function(t,v){parent.postMessage({__bp:1,type:t,val:v},"*")};' +
      'window.BP={score:function(n){P("score",+n||0)},end:function(n){P("end",+n||0)},' +
      'toast:function(t){P("toast",String(t).slice(0,80))}};' +
      'window.onerror=function(m){P("err",String(m).slice(0,200))};' +
      'P("ready",1)})()<\/script>';
    var doc = '<!DOCTYPE html><meta charset="utf-8"><style>html,body{margin:0;height:100%;' +
      'font-family:"Microsoft YaHei",sans-serif;background:#fff;overflow:hidden}</style>' +
      shim + (cfg.code || '');

    var f = el('iframe', 'k-sbx');
    f.setAttribute('sandbox', 'allow-scripts');       // 故意不给 allow-same-origin
    f.setAttribute('referrerpolicy', 'no-referrer');
    f.srcdoc = doc;
    if (cfg.mount) cfg.mount.appendChild(f);

    var alive = false;
    var guard = setTimeout(function () { if (!alive && cfg.onFail) cfg.onFail('脚本没有响应（5 秒内未就绪）'); }, 5000);

    function onMsg(e) {
      // 校验来源身份，不校验 origin —— opaque origin 的 e.origin 是字符串 "null"，校验它没意义
      if (e.source !== f.contentWindow) return;
      var d = e.data;
      if (!d || d.__bp !== 1) return;
      if (d.type === 'ready') { alive = true; clearTimeout(guard); if (cfg.onReady) cfg.onReady(); return; }
      if (d.type === 'score' && cfg.onScore) return cfg.onScore(+d.val || 0);
      if (d.type === 'end' && cfg.onEnd) return cfg.onEnd(+d.val || 0);
      if (d.type === 'toast' && cfg.onToast) return cfg.onToast(String(d.val || '').slice(0, 80));
      if (d.type === 'err' && cfg.onFail) return cfg.onFail(String(d.val || '').slice(0, 200));
    }
    window.addEventListener('message', onMsg);

    return {
      el: f,
      destroy: function () {
        clearTimeout(guard);
        window.removeEventListener('message', onMsg);
        try { f.remove(); } catch (e) {}
      }
    };
  }

  // ================================================================
  // shell：统一骨架。三段式 intro / play / over
  // 样式注进 .dwb 内部（b.innerHTML='' 会连样式一起清掉，天然幂等）
  // ================================================================
  function shell(cfg) {
    var win = q('#' + cfg.win);
    if (!win) return null;
    var body = win.querySelector('.dwb');
    if (!body) return null;

    if (cfg.size) win.setAttribute('style', (win.getAttribute('style') || '') + ';' + cfg.size);
    body.innerHTML = '';

    var head = win.querySelector('.dwh');
    var baseTitle = cfg.title || (head ? head.firstChild && head.firstChild.nodeValue : '') || '';

    // 工具条：ribbon 语义 = 切换处理这份文档的模式
    var tool = null;
    if (cfg.tool !== false) {
      tool = el('div', 'dwt k-tool');
      if (head) head.insertAdjacentElement('afterend', tool);
    }
    // 面包屑：路径即关卡
    var crumb = null;
    if (cfg.crumb) {
      crumb = el('div', 'fbar2 k-crumb');
      (tool || head).insertAdjacentElement('afterend', crumb);
    }
    // 状态栏：主 HUD。Office 状态栏和游戏 HUD 是同一个控件
    var foot = null;
    if (cfg.foot !== false) {
      foot = el('div', 'dwf k-foot');
      win.appendChild(foot);
    }

    var wrap = el('div', 'k-wrap');
    var stage = el('div', 'k-stage');
    var side = null;
    if (cfg.side) {
      side = el('div', 'k-side');
      wrap.appendChild(stage); wrap.appendChild(side);
      wrap.classList.add('has-side');
    } else {
      wrap.appendChild(stage);
    }
    body.appendChild(wrap);

    var states = {};
    ['intro', 'play', 'over'].forEach(function (k) {
      var s = el('div', 'k-st');
      s.dataset.k = k;
      stage.appendChild(s);
      states[k] = s;
    });

    var cssEl = null;
    var h = {
      win: win, body: body, head: head, tool: tool, foot: foot, crumb: crumb, side: side,
      stage: stage, states: states,
      sfx: sfx, fx: fx, save: cfg.save ? save(cfg.save) : null,

      // 样式自动加 #winXXX 前缀，注进 .dwb 内部
      css: function (text) {
        if (!cssEl) { cssEl = document.createElement('style'); body.insertBefore(cssEl, body.firstChild); }
        var pre = '#' + cfg.win + ' ';
        cssEl.textContent += String(text).replace(/(^|\})([^{}]*)\{/g, function (m, brace, sel) {
          // at-rule（@keyframes/@media）和 keyframes 内部的 from/to/百分比，都不加前缀。
          // 注意要先 trim 再判 @：'\n@keyframes' 的首字符是换行，漏判会把整条动画前缀掉且不报错
          if (/^\s*@/.test(sel) || /^\s*(from|to|[\d.]+%)/.test(sel)) return m;
          var out = sel.split(',').map(function (s) {
            s = s.trim();
            if (!s) return s;
            if (s.charAt(0) === '&') return s.slice(1).replace(/^\s*/, '') ? '#' + cfg.win + s.slice(1) : '#' + cfg.win;
            return pre + s;
          }).join(',');
          return brace + out + '{';
        });
        return h;
      },

      // 单一事件委托，一个游戏一个监听器
      on: function (sel, fn, evt) {
        body.addEventListener(evt || 'click', function (e) {
          var t = e.target.closest ? e.target.closest(sel) : null;
          if (t && body.contains(t)) fn(t, e);
        });
        return h;
      },

      go: function (k) {
        for (var n in states) states[n].classList.toggle('on', n === k);
        var s = states[k];
        if (s && !reduced) { s.classList.remove('k-rise'); void s.offsetWidth; s.classList.add('k-rise'); }
        return h;
      },
      timer: function (bar, tcfg) { return mkTimer(bar, tcfg); },
      rank: cfg.rank || RANK.swagger,
      destroy: function () { body.innerHTML = ''; }
    };

    // ---------- HUD：一节那张映射表的落地 API ----------
    h.hud = {
      // 标题栏：段位 / 关卡 / 局数 + Office 的未保存 * 标记
      title: function (sub, dirty) {
        if (!head) return;
        var wb = head.querySelector('.wb');
        var txt = (dirty ? '*' : '') + baseTitle + (sub ? ' — ' + sub : '');
        head.textContent = txt;
        if (wb) head.appendChild(wb);
      },
      // 状态栏：slots 是 ['第 3 题','连击 x2']，right 是右下角
      foot: function (slots, right) {
        if (!foot) return;
        var l = (slots || []).map(function (s) { return '<b>' + esc(s) + '</b>'; }).join('　');
        foot.innerHTML = l + (right ? '<span class="k-fr">' + esc(right) + '</span>' : '');
      },
      // 工具条：难度 / 道具 / 主行动。tip 是右侧灰字（真 Office 放"幻灯片 1/10"）
      tool: function (html, tip) {
        if (!tool) return;
        tool.innerHTML = html + (tip ? '<span class="sp">' + esc(tip) + '</span>' : '');
      },
      // 批注栏：旁白 / 对手台词 / 结算点评。领导在你文档上批注，比红框疼十倍
      note: function (who, text, kind) {
        if (!side) return;
        var c = el('div', 'cmt k-note' + (kind ? ' ' + kind : ''),
          '<div class="who"><b>' + esc(who) + '</b></div>' + esc(text));
        side.appendChild(c);
        side.scrollTop = side.scrollHeight;
        if (!reduced) { void c.offsetWidth; c.classList.add('k-rise'); }
        return c;
      },
      clearNotes: function () { if (side) side.innerHTML = ''; },
      crumb: function (parts, right) {
        if (!crumb) return;
        crumb.innerHTML = '<span class="k-path">' + (parts || []).map(function (p, i) {
          return '<b data-cr="' + i + '">' + esc(p) + '</b>';
        }).join('<i>›</i>') + '</span>' + (right ? '<span class="k-fr">' + esc(right) + '</span>' : '');
      },
      // 进度条：状态栏右侧缩放条位。不复用 #xlFoot .zoombar（那个 s 是滑块把手不是填充）
      bar: function (pct) {
        if (!foot) return;
        var b = foot.querySelector('.k-bar i');
        if (!b) {
          foot.insertAdjacentHTML('beforeend', '<span class="k-bar"><i></i></span>');
          b = foot.querySelector('.k-bar i');
        }
        b.style.width = clamp(pct, 0, 100) + '%';
      },
      // 回合归属：焦点=输入归属，回合=输入归属，同一件事。白嫖已有的标题栏去饱和
      focusTurn: function (mine) { win.classList.toggle('focus', !!mine); },
      toast: function (txt, go) {
        if (typeof osToast === 'function') osToast(txt, go);
      }
    };

    // 暂停总线接上（关窗/最小化/老板键/切标签，任一为真都算暂停）
    if (cfg.onPause) pause.watch(win, cfg.onPause);

    return h;
  }

  // ================================================================
  // 公共样式：只注一次，全部 .k- 前缀。keyframes 一律 k- 前缀（全局作用域，重名会静默覆盖全站）
  // ================================================================
  var CSS = [
    '.k-wrap{display:flex;height:100%;min-height:0}',
    '.k-wrap.has-side .k-stage{flex:1;min-width:0}',
    '.k-stage{flex:1;min-width:0;overflow:auto;padding:10px 12px}',
    '.k-side{width:186px;flex:none;overflow:auto;padding:8px;border-left:1px solid var(--rule,#E1DFDD);background:#FAFAFA}',
    '.k-st{display:none}',
    '.k-st.on{display:block}',
    '.k-tool{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
    '.k-tool .sp{margin-left:auto;color:var(--ink-3,#8A8A8A);font-size:11px}',
    '.k-crumb{display:flex;align-items:center;gap:4px}',
    '.k-crumb .k-path b{cursor:pointer;padding:1px 4px;border-radius:2px}',
    '.k-crumb .k-path b:hover{background:rgba(43,87,154,.1);color:var(--word-blue,#2B579A)}',
    '.k-crumb .k-path i{font-style:normal;color:var(--ink-3,#8A8A8A);margin:0 2px}',
    '.k-foot{display:flex;align-items:center;gap:10px}',
    '.k-foot .k-fr{margin-left:auto;color:var(--ink-3,#8A8A8A)}',
    '.k-bar{display:inline-block;width:74px;height:5px;border-radius:3px;background:rgba(0,0,0,.12);overflow:hidden;vertical-align:middle}',
    '.k-bar i{display:block;height:100%;width:0;background:var(--word-blue,#2B579A);transition:width .3s ease}',
    '.k-note{margin-bottom:7px;opacity:0}',
    '.k-note.k-rise{opacity:1}',
    // 入场 / 错峰
    '.k-in{animation:k-rise .34s cubic-bezier(.2,.8,.3,1) both;animation-delay:var(--dd,0s)}',
    '.k-rise{animation:k-rise .3s cubic-bezier(.2,.8,.3,1) both}',
    '@keyframes k-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    // 翻牌
    '.k-flip{animation:k-flip .38s cubic-bezier(.3,.9,.4,1) both}',
    '@keyframes k-flip{0%{transform:rotateY(0)}100%{transform:rotateY(180deg)}}',
    '.k-reveal{animation:k-reveal .52s cubic-bezier(.3,.9,.4,1) both}',
    '@keyframes k-reveal{0%{transform:rotateY(0)}100%{transform:rotateY(360deg)}}',
    // 盖戳：复刻 stampin 的手感
    '.k-stamp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-16deg);',
    '  padding:5px 16px;border:3px solid #C43E1C;color:#C43E1C;border-radius:5px;',
    '  font-size:20px;font-weight:700;letter-spacing:3px;pointer-events:none;z-index:6;',
    '  animation:k-stamp .55s cubic-bezier(.3,1.6,.5,1) both}',
    '@keyframes k-stamp{0%{transform:translate(-50%,-50%) rotate(-30deg) scale(2.6);opacity:0}',
    '  60%{opacity:1}100%{transform:translate(-50%,-50%) rotate(-16deg) scale(1);opacity:1}}',
    // 粒子
    '.k-burst{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:7}',
    '.k-burst .k-p{position:absolute;width:6px;height:6px;border-radius:50%;background:var(--glow,#F5C56B);',
    '  animation:k-burst .62s ease-out forwards}',
    '@keyframes k-burst{from{transform:translate(0,0) scale(1);opacity:1}',
    '  to{transform:translate(var(--dx,0),var(--dy,0)) scale(.3);opacity:0}}',
    // 飘字
    '.k-float{position:absolute;left:50%;top:8px;transform:translateX(-50%);pointer-events:none;z-index:7;',
    '  font-size:15px;font-weight:700;color:var(--word-blue,#2B579A);animation:k-float 1s ease-out forwards}',
    '.k-float.k-gold{color:#C9962E}',
    '@keyframes k-float{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-26px)}}',
    // 金币
    '.k-coin{position:absolute;left:50%;top:-8px;width:12px;height:12px;border-radius:50%;',
    '  background:radial-gradient(circle at 38% 34%,#FFE9A8,#C9962E);pointer-events:none;z-index:7;',
    '  animation:k-coin .8s ease-in forwards}',
    '@keyframes k-coin{0%{top:-8px;opacity:0}18%{opacity:1}100%{top:36px;opacity:0}}',
    // 涟漪
    '.k-rip{position:absolute;border-radius:50%;background:rgba(43,87,154,.22);pointer-events:none;',
    '  transform:scale(0);animation:k-rip .6s ease-out forwards}',
    '@keyframes k-rip{to{transform:scale(2.1);opacity:0}}',
    // 三点加载
    '.k-dots i{display:inline-block;width:4px;height:4px;margin:0 1px;border-radius:50%;',
    '  background:currentColor;animation:k-dots 1.2s infinite}',
    '.k-dots i:nth-child(2){animation-delay:.2s}.k-dots i:nth-child(3){animation-delay:.4s}',
    '@keyframes k-dots{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}',
    // 金环呼吸 / 聚光
    '.k-glow{animation:k-glow 1.6s ease-in-out infinite}',
    '@keyframes k-glow{0%,100%{box-shadow:0 0 0 0 rgba(245,197,107,0)}',
    '  50%{box-shadow:0 0 0 2px rgba(245,197,107,.6),0 0 14px rgba(245,197,107,.4)}}',
    '.k-spot{filter:brightness(.8)}',
    // 反馈
    '.k-pop{animation:k-pop .45s}',
    '@keyframes k-pop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}',
    '.k-shake{animation:k-shake .4s}',
    '@keyframes k-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}',
    '.k-flash{animation:k-flash 1s forwards}',
    '@keyframes k-flash{0%{opacity:0;transform:translateY(8px) scale(.7)}25%{opacity:1;transform:none}',
    '  75%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}',
    // 沙箱
    '.k-sbx{width:100%;height:100%;border:0;background:#fff;display:block}',
    // 减动效：一次性全站降级
    '@media (prefers-reduced-motion:reduce){',
    '  .k-in,.k-rise,.k-flip,.k-reveal,.k-stamp,.k-pop,.k-shake,.k-flash,.k-glow{animation:none!important}',
    '  .k-note{opacity:1}}'
  ].join('');

  function injectCSS() {
    if (q('#bpkit-css')) return;
    var s = document.createElement('style');
    s.id = 'bpkit-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---------- 启动：只在 DOM 就绪后碰 DOM ----------
  ready(function () {
    injectCSS();
    wirePause();
    sfx.arm();
    // 设置面板的 nosfx 开关（os.js 那边写 body class，这里只读）
    if (document.body.classList.contains('nosfx')) sfx.mute(true);
    if (window.MutationObserver) {
      new MutationObserver(function () {
        sfx.mute(document.body.classList.contains('nosfx'));
      }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  });

  root.BPKit = {
    ready: ready, shell: shell, fx: fx, sfx: sfx, pause: pause,
    save: save, ranks: ranks, RANK: RANK, swagger: swagger, tip: tip,
    sandbox: sandbox, timer: mkTimer,
    reduced: reduced, shuffle: shuffle, clamp: clamp, esc: esc, el: el, q: q, qa: qa
  };
})(window);
