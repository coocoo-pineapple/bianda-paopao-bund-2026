/* 工位躲猫猫 2.0 —— 真·猫鼠游戏版
   接管 os.js 里的 #winHide：呆若木鸡每次扑空后会溜到相邻工位，
   甚至溜回你查过的地方（上一格下回合自动关上，这就是笑点）。 */
(function () {
  var win = document.querySelector('#winHide');
  if (!win) return;
  var b = win.querySelector('.dwb');
  if (!b) return;

  /* 窗口稍微加高，装下 4×5 的格子 */
  win.style.width = '440px';
  win.style.height = '565px';

  /* ---------- 样式（全部锁在 #winHide 里） ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#winHide .dwb{background:#F5F6F7;padding:10px 12px;display:flex;flex-direction:column;overflow:auto}' +
    '#winHide.hasoffice .dwb{background:linear-gradient(rgba(245,246,247,.88),rgba(245,246,247,.92)),url(assets/hide-office.jpg) center/cover no-repeat}' +
    '#winHide .hd-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px}' +
    '#winHide .hd-sc{font-size:11px;color:#8A939C;white-space:nowrap}' +
    '#winHide .hd-st{font-size:12px;color:#3A4048;line-height:1.6;min-height:38px;margin:4px 0 6px}' +
    '#winHide .hd-df{display:flex;gap:6px;margin-bottom:8px}' +
    '#winHide .hd-df b{font-weight:400;font-size:11px;padding:3px 10px;border:1px solid #D5DAE0;border-radius:10px;background:#fff;color:#6B7480;cursor:pointer}' +
    '#winHide .hd-df b:active{transform:scale(.95)}' +
    '#winHide .hd-df b.on{background:#2B579A;border-color:#2B579A;color:#fff}' +
    '#winHide .hd-gd{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}' +
    '#winHide .hcell{perspective:300px;cursor:pointer}' +
    '#winHide .hin{position:relative;height:66px;transform-style:preserve-3d;transition:transform .3s}' +
    '#winHide .hcell.open .hin{transform:rotateY(180deg)}' +
    '#winHide .hcell:not(.open):active .hin{transform:scale(.93)}' +
    '#winHide .hf,#winHide .hb{position:absolute;inset:0;backface-visibility:hidden;border:1px solid #D5DAE0;border-radius:5px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}' +
    '#winHide .hb{transform:rotateY(180deg);background:#F0F3F6}' +
    '#winHide .hcell i{font-style:normal;font-size:21px;line-height:1}' +
    '#winHide .hcell em{font-style:normal;font-size:10px;color:#8A939C}' +
    '#winHide .hcell.found .hb{background:#E8F5E9;border-color:#7CB98B}' +
    '#winHide .hcell.fin .hb{background:#FDF0EF;border-color:#E0A8A2}' +
    /* 温度脉冲：开格后按远近闪一下 */
    '#winHide .tp1 .hb{animation:hkp1 .9s ease 2}' +
    '#winHide .tp2 .hb{animation:hkp2 .9s ease 2}' +
    '#winHide .tp3 .hb{animation:hkp3 .9s ease 2}' +
    '#winHide .tp4 .hb{animation:hkp4 .9s ease 2}' +
    '@keyframes hkp1{50%{box-shadow:0 0 0 4px rgba(214,69,53,.45)}}' +
    '@keyframes hkp2{50%{box-shadow:0 0 0 4px rgba(224,138,54,.4)}}' +
    '@keyframes hkp3{50%{box-shadow:0 0 0 4px rgba(74,144,196,.35)}}' +
    '@keyframes hkp4{50%{box-shadow:0 0 0 4px rgba(150,158,168,.3)}}' +
    /* 抓到时的碎纸屑 */
    '#winHide .hcf{position:absolute;left:50%;top:50%;width:6px;height:6px;border-radius:1px;pointer-events:none;background:var(--c);animation:hkcf .7s ease-out forwards}' +
    '@keyframes hkcf{to{transform:translate(var(--dx),var(--dy)) rotate(540deg);opacity:0}}' +
    '#winHide .hd-ft{display:flex;justify-content:space-between;align-items:center;margin-top:8px}';
  b.innerHTML = '';   // 清掉 os.js 里旧版占位游戏，接管整个窗体
  b.appendChild(css);

  /* ---------- 骨架 ---------- */
  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<div class="hd-top"><span style="font-size:12px;color:#3A4048">呆若木鸡藏进了 20 个工位</span><span class="hd-sc" id="hdSc"></span></div>' +
    '<div class="hd-st" id="hdSt"></div>' +
    '<div class="hd-df" id="hdDf"><b data-d="8">摸鱼版 · 8 步</b><b data-d="6" class="on">标准 · 6 步</b><b data-d="4">卷王 · 4 步</b></div>' +
    '<div class="hd-gd" id="hdGd"></div>' +
    '<div class="hd-ft"><button class="rbtn" data-act="re">再玩一局</button><span class="muted">玩家 · 呆若木鸡 自制 · 已获打赏 ¥12</span></div>';
  b.appendChild(wrap);

  var gd = b.querySelector('#hdGd'), st = b.querySelector('#hdSt'), sc = b.querySelector('#hdSc');
  var W = 4, H = 5, N = 20;
  var PROPS = ['🖥️', '💺', '📠', '🪴', '📚', '☕', '🗄️', '📦'];
  var MISS = [
    '工牌挂在椅背上，人不在', '屏幕开着 Excel，键盘上有灰', '椅子还带着体温，人刚溜',
    '外套在，水杯在，就是人没影', '桌上三杯没喝完的咖啡', '便签写着「马上回」，字迹已泛黄',
    '耳机还在播客里放着，主人失联', '鼠标垫下压着一张请假条草稿'
  ];
  var pos = 0, max = 6, used = 0, over = false, seen = {};

  /* ---------- 存档 ---------- */
  function loadS() { try { return JSON.parse(localStorage.getItem('bp-hide')) || {}; } catch (e) { return {}; } }
  function saveS(s) { try { localStorage.setItem('bp-hide', JSON.stringify(s)); } catch (e) {} }
  function drawSc() {
    var s = loadS();
    sc.textContent = '战绩 ' + (s.win | 0) + ' 胜 ' + (s.lose | 0) + ' 负' + (s.best ? ' · 最快 ' + s.best + ' 步' : '');
  }

  /* ---------- 工具 ---------- */
  function dist(a, c) { return Math.abs(a % W - c % W) + Math.abs(((a / W) | 0) - ((c / W) | 0)); }
  /* 扑空后他溜一格：上下左右任选，唯独不进你这回合刚开的格子；查过的旧格子照溜不误 */
  function sneak(avoid) {
    var x = pos % W, y = (pos / W) | 0, opts = [];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      var nx = x + d[0], ny = y + d[1];
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) { var k = ny * W + nx; if (k !== avoid) opts.push(k); }
    });
    pos = opts[(Math.random() * opts.length) | 0];
  }
  function hint(d) {
    if (d <= 1) return ['键盘还是热的！', 'tp1'];
    if (d <= 2) return ['附近有咖啡味。', 'tp2'];
    if (d <= 4) return ['隐约听到摸鱼的笑声。', 'tp3'];
    return ['这一片安静得像在开会。', 'tp4'];
  }
  function burst(cell) {
    var cols = ['#D64535', '#E0A82E', '#4A90C4', '#7CB98B', '#8A6FC0'];
    for (var i = 0; i < 10; i++) {
      var s = document.createElement('span');
      s.className = 'hcf';
      var a = Math.random() * 6.28, r = 28 + Math.random() * 34;
      s.style.cssText = '--dx:' + (Math.cos(a) * r).toFixed(0) + 'px;--dy:' + (Math.sin(a) * r).toFixed(0) + 'px;--c:' + cols[i % 5];
      s.addEventListener('animationend', function () { this.remove(); });
      cell.appendChild(s);
    }
    setTimeout(function () { cell.querySelectorAll('.hcf').forEach(function (x) { x.remove(); }); }, 1200); // 兜底清理
  }

  /* ---------- 一局 ---------- */
  function reset() {
    pos = (Math.random() * N) | 0; used = 0; over = false; seen = {};
    gd.innerHTML = '';
    for (var i = 0; i < N; i++) {
      var c = document.createElement('div');
      c.className = 'hcell'; c.dataset.i = i;
      c.innerHTML = '<div class="hin"><div class="hf"><i>' + PROPS[(Math.random() * PROPS.length) | 0] +
        '</i><em>工位 ' + (i + 1) + '</em></div><div class="hb"></div></div>';
      gd.appendChild(c);
    }
    st.textContent = '他就藏在其中一格。注意：每次扑空，他都会溜到隔壁工位——包括你查过的。共 ' + max + ' 步。';
    drawSc();
  }

  /* ---------- 唯一的点击监听 ---------- */
  b.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act],[data-d],.hcell');
    if (!t) return;
    if (t.dataset.act === 're') return reset();
    if (t.dataset.d) {
      max = +t.dataset.d;
      b.querySelectorAll('#hdDf b').forEach(function (x) { x.classList.toggle('on', x === t); });
      return reset();
    }
    if (over || t.classList.contains('open')) return;

    /* 你转身的工夫，上一个开过的格子悄悄关上了 */
    var prev = gd.querySelector('.hcell.open');
    if (prev) { prev.classList.remove('open', 'tp1', 'tp2', 'tp3', 'tp4'); }

    var i = +t.dataset.i, back = t.querySelector('.hb');
    used++;
    if (i === pos) { /* 抓到 */
      over = true;
      back.innerHTML = '<i>🙇</i><em>被抓到了</em>';
      t.classList.add('open', 'found');
      burst(t);
      st.textContent = used + ' 步抓到！他说他「刚去接水」，手里却拿着羽毛球拍。';
      var s = loadS(); s.win = (s.win | 0) + 1;
      if (!s.best || used < s.best) s.best = used;
      saveS(s); drawSc();
      if (typeof osToast === 'function') osToast('抓到呆若木鸡 · 用时 ' + used + ' 步');
      return;
    }
    /* 扑空：他先溜，再给你温度提示 */
    var wasSeen = seen[i]; seen[i] = 1;
    sneak(i);
    back.innerHTML = '<i>💨</i><em>扑空</em>';
    t.classList.add('open');
    if (used >= max) { /* 步数用完，摊牌 */
      over = true;
      var h = gd.querySelector('[data-i="' + pos + '"]');
      if (h) { h.querySelector('.hb').innerHTML = '<i>😏</i><em>他在这</em>'; h.classList.add('open', 'fin'); }
      st.textContent = max + ' 步用完。他躲过了你，就像躲过了周报。';
      var s2 = loadS(); s2.lose = (s2.lose | 0) + 1; saveS(s2); drawSc();
      return;
    }
    var hn = hint(dist(i, pos));
    t.classList.add(hn[1]);
    var extra = (seen[pos] && Math.random() < 0.6) ? '（他好像溜回了你查过的地方…）' : (wasSeen ? '（这格你查过，他又没回来）' : '');
    st.textContent = MISS[(Math.random() * MISS.length) | 0] + '。' + hn[0] + extra + ' 还剩 ' + (max - used) + ' 步。';
  });

  reset();
})();
