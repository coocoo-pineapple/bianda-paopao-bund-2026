/* 职场五子棋 2.0 —— 人机对战版
   接管 os.js 里的 #winGomoku：白=你，黑=老板。
   老板先手，中心开局——他是老板，当然他先走。 */
(function () {
  var win = document.querySelector('#winGomoku');
  if (!win) return;
  var b = win.querySelector('.dwb');
  if (!b) return;

  /* 窗口略加高，装下战绩条和底栏 */
  win.style.width = '420px';
  win.style.height = '545px';
  b.innerHTML = '';

  /* ---------- 样式（全部锁在 #winGomoku 里） ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#winGomoku .gk{flex:1;display:flex;flex-direction:column;padding:10px 12px;min-height:0}' +
    '#winGomoku .gk-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:11px;color:#8A939C}' +
    '#winGomoku .gk-top b{font-weight:400;color:#3A4048;font-size:12px}' +
    '#winGomoku .gk-st{font-size:12px;color:#3A4048;line-height:1.6;min-height:38px;margin:4px 0 6px}' +
    '#winGomoku .gk-bd{align-self:center;width:100%;max-width:390px;aspect-ratio:1;display:grid;' +
    'grid-template-columns:repeat(13,1fr);grid-template-rows:repeat(13,1fr);' +
    'padding:5px;border:1px solid #B8935C;border-radius:4px;background:#D9B278;box-shadow:inset 0 0 12px rgba(120,80,30,.25)}' +
    /* 场景图就绪时：木纹当棋盘背景，压一层暖色保证棋路可读；没图就用素色 #D9B278 */
    '#winGomoku.haswood .gk-bd{background:linear-gradient(rgba(217,178,120,.5),rgba(217,178,120,.6)),url(assets/gomoku-wood.jpg) center/cover no-repeat}' +
    /* 棋路：每格画一个十字 */
    '#winGomoku .gk-bd span{position:relative;cursor:pointer;' +
    'background:linear-gradient(rgba(90,58,20,.55),rgba(90,58,20,.55)) center/100% 1px no-repeat,' +
    'linear-gradient(rgba(90,58,20,.55),rgba(90,58,20,.55)) center/1px 100% no-repeat}' +
    '#winGomoku .gk-bd span.star{background:radial-gradient(circle,rgba(60,38,10,.6) 0 2px,transparent 2.6px) center/8px 8px no-repeat,' +
    'linear-gradient(rgba(90,58,20,.55),rgba(90,58,20,.55)) center/100% 1px no-repeat,' +
    'linear-gradient(rgba(90,58,20,.55),rgba(90,58,20,.55)) center/1px 100% no-repeat}' +
    /* 空位悬停提示点（老板思考或终局时锁盘，不给点） */
    '#winGomoku .gk-bd:not(.lock) span:not([data-s]):hover::after{content:"";position:absolute;inset:24%;border-radius:50%;background:rgba(0,0,0,.16)}' +
    '#winGomoku .gk-bd.lock span{cursor:default}' +
    /* 棋子 + 落子动画（缩放淡入，纯 CSS） */
    '#winGomoku .gk-bd span[data-s]::before{content:"";position:absolute;inset:9%;border-radius:50%;' +
    'box-shadow:0 2px 4px rgba(0,0,0,.45),inset 0 -2px 3px rgba(0,0,0,.25);animation:gkdrop .25s ease}' +
    '#winGomoku .gk-bd span[data-s="1"]::before{background:radial-gradient(circle at 32% 28%,#5A5A5A,#111)}' +
    '#winGomoku .gk-bd span[data-s="2"]::before{background:radial-gradient(circle at 32% 28%,#FFF,#C8C8C8)}' +
    '@keyframes gkdrop{from{transform:scale(1.7);opacity:0}}' +
    /* 最近一手的小红点 */
    '#winGomoku .gk-bd span.last::after{content:"";position:absolute;left:50%;top:50%;width:4px;height:4px;' +
    'margin:-2px 0 0 -2px;border-radius:50%;background:#D64535}' +
    /* 连五的五颗子：金色呼吸光 */
    '#winGomoku .gk-bd span.winln::before{animation:gkwin .7s ease-in-out infinite alternate}' +
    '@keyframes gkwin{from{box-shadow:0 0 3px 1px rgba(255,204,64,.5)}to{box-shadow:0 0 10px 4px rgba(255,204,64,.95)}}' +
    '#winGomoku .gk-ft{display:flex;align-items:center;gap:8px;margin-top:8px}' +
    '#winGomoku .gk-ft .rbtn:active{transform:scale(.94)}' +
    '#winGomoku .gk-ft .muted{margin-left:auto}';
  b.appendChild(css);

  /* ---------- 骨架 ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'gk';
  wrap.innerHTML =
    '<div class="gk-top"><b>黑=老板 · 白=你 · 老板先手</b><span id="gkSc"></span></div>' +
    '<div class="gk-st" id="gkSt"></div>' +
    '<div class="gk-bd" id="gkBd"></div>' +
    '<div class="gk-ft"><button class="rbtn" data-act="re">再来一局</button>' +
    '<button class="rbtn" data-act="gg">认输</button>' +
    '<span class="muted">玩家 · 井底之蛙 自制 · 已获打赏 ¥28</span></div>';
  b.appendChild(wrap);

  var bd = wrap.querySelector('#gkBd'), st = wrap.querySelector('#gkSt'), sc = wrap.querySelector('#gkSc');
  var N = 13, BOSS = 1, YOU = 2;
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  var STARS = [3 * N + 3, 3 * N + 9, 9 * N + 3, 9 * N + 9, 6 * N + 6];
  var cells, over = false, busy = false;

  /* ---------- 战绩存档 ---------- */
  function loadS() { try { return JSON.parse(localStorage.getItem('bp-gomoku')) || {}; } catch (e) { return {}; } }
  function saveS(s) { try { localStorage.setItem('bp-gomoku', JSON.stringify(s)); } catch (e) {} }
  function drawSc() {
    var s = loadS();
    sc.textContent = '战绩：你 ' + (s.win | 0) + ' 胜 · 老板 ' + (s.lose | 0) + ' 胜' + ((s.draw | 0) ? ' · 平 ' + s.draw : '');
  }
  function record(k, msg) {
    var s = loadS(); s[k] = (s[k] | 0) + 1; saveS(s); drawSc();
    if (msg && typeof osToast === 'function') osToast(msg);
  }

  /* ---------- 棋型估分 ----------
     在 i 点落 c 子，四个方向各数一条线：连子数 n + 两端空口数 open。
     牌型分：连五 1e6 / 活四 1e5 / 冲四 1e4 / 活三 5e3 / 眠三 500 / 活二 50 / 眠二 10 */
  function pat(n, open) {
    if (n >= 5) return 1e6;
    if (!open) return 0;
    if (n === 4) return open === 2 ? 1e5 : 1e4;
    if (n === 3) return open === 2 ? 5e3 : 500;
    if (n === 2) return open === 2 ? 50 : 10;
    return open === 2 ? 3 : 1;
  }
  function lineVal(i, c) {
    var x = i % N, y = (i / N) | 0, total = 0;
    for (var d = 0; d < 4; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1], n = 1, open = 0;
      for (var s = -1; s <= 1; s += 2) {
        var cx = x + dx * s, cy = y + dy * s;
        while (cx >= 0 && cx < N && cy >= 0 && cy < N && cells[cy * N + cx] === c) { n++; cx += dx * s; cy += dy * s; }
        if (cx >= 0 && cx < N && cy >= 0 && cy < N && !cells[cy * N + cx]) open++;
      }
      total += pat(n, open);
    }
    return total;
  }
  /* 这手是否摆出了冲四/活四（用于「老板皱了皱眉」） */
  function madeFour(i, c) {
    var x = i % N, y = (i / N) | 0;
    for (var d = 0; d < 4; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1], n = 1, open = 0;
      for (var s = -1; s <= 1; s += 2) {
        var cx = x + dx * s, cy = y + dy * s;
        while (cx >= 0 && cx < N && cy >= 0 && cy < N && cells[cy * N + cx] === c) { n++; cx += dx * s; cy += dy * s; }
        if (cx >= 0 && cx < N && cy >= 0 && cy < N && !cells[cy * N + cx]) open++;
      }
      if (n === 4 && open) return true;
    }
    return false;
  }
  /* 连五则返回成线的格子下标，否则 null */
  function winLine(i) {
    var x = i % N, y = (i / N) | 0, c = cells[i];
    for (var d = 0; d < 4; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1], arr = [i];
      for (var s = -1; s <= 1; s += 2) {
        var cx = x + dx * s, cy = y + dy * s;
        while (cx >= 0 && cx < N && cy >= 0 && cy < N && cells[cy * N + cx] === c) { arr.push(cy * N + cx); cx += dx * s; cy += dy * s; }
      }
      if (arr.length >= 5) return arr;
    }
    return null;
  }

  /* ---------- 落子与终局 ---------- */
  function place(i, c) {
    cells[i] = c;
    var el = bd.children[i];
    el.dataset.s = c;
    var prev = bd.querySelector('span.last'); if (prev) prev.classList.remove('last');
    el.classList.add('last');
    return winLine(i);
  }
  function finish(line, who) {
    over = true;
    bd.classList.add('lock');
    if (line) line.forEach(function (k) { bd.children[k].classList.add('winln'); });
    if (who === YOU) { st.textContent = '你赢了老板。明天记得早点到。'; record('win', '赢了老板一局 · 棋盘上的事棋盘上算'); }
    else if (who === BOSS) { st.textContent = '老板赢了。像话。回去加班。'; record('lose'); }
    else { st.textContent = '平局。棋盘摆满了，谁也没赢——很像这份工作。'; record('draw'); }
  }
  function full() { return cells.every(function (v) { return v; }); }

  /* ---------- 老板 AI：只看有子两格以内的空位，攻防各估一遍取大 ---------- */
  function aiMove() {
    var best = 84, bs = -1, cand = [], i, x, y;
    for (i = 0; i < N * N; i++) {
      if (cells[i]) continue;
      x = i % N; y = (i / N) | 0;
      var near = false;
      for (var yy = Math.max(0, y - 2); yy <= Math.min(N - 1, y + 2) && !near; yy++)
        for (var xx = Math.max(0, x - 2); xx <= Math.min(N - 1, x + 2); xx++)
          if (cells[yy * N + xx]) { near = true; break; }
      if (near) cand.push(i);
    }
    for (var k = 0; k < cand.length; k++) {
      i = cand[k];
      var atk = lineVal(i, BOSS), def = lineVal(i, YOU);
      var v = Math.max(atk * 1.1, def) + Math.random() * 8;   // 进攻略优先 + 微小随机避免走成复读机
      if (v > bs) { bs = v; best = i; }
    }
    var line = place(best, BOSS);
    busy = false;
    bd.classList.remove('lock');
    if (line) return finish(line, BOSS);
    if (full()) return finish(null, 0);
    st.textContent = madeFour(best, BOSS) ? '老板皱了皱眉。他摆出了四连——再不堵就散会了。' : '该你了。白子，想清楚再落。';
  }
  function bossThink(fn) {
    busy = true;
    bd.classList.add('lock');
    st.textContent = '老板正在思考（假装看报表）…';
    setTimeout(fn, 300);   // 让 UI 先喘口气
  }

  /* ---------- 一局 ---------- */
  function reset() {
    cells = new Array(N * N).fill(0); over = false;
    bd.classList.remove('lock');
    bd.innerHTML = '';
    for (var i = 0; i < N * N; i++) {
      var c = document.createElement('span');
      c.dataset.i = i;
      if (STARS.indexOf(i) > -1) c.classList.add('star');
      bd.appendChild(c);
    }
    drawSc();
    /* 老板先手：直接落天元。他是老板，开局都不用想 */
    bossThink(function () {
      place(84, BOSS);
      busy = false;
      bd.classList.remove('lock');
      st.textContent = '老板占了天元。轮到你了，先连成五个的说了算。';
    });
  }

  /* ---------- 唯一的点击监听（格子 + 按钮全走这里） ---------- */
  wrap.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act],span[data-i]');
    if (!t) return;
    if (t.dataset.act === 're') return reset();
    if (t.dataset.act === 'gg') {
      if (over || busy) return;
      finish(null, BOSS);
      st.textContent = '你把这局让给了老板。懂事。';
      return;
    }
    if (over || busy) return;
    var i = +t.dataset.i;
    if (cells[i]) return;
    var line = place(i, YOU);
    if (line) return finish(line, YOU);
    if (full()) return finish(null, 0);
    bossThink(aiMove);
  });

  reset();
})();
