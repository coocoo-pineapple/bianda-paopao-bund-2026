// 对齐会 · 会中界面验收：宫格 / 控制栏 / 共享收条
// 跑法：node tools/probe-dreamroom-room.cjs [url]
const { launch } = require('./cdp.cjs');
const URL = process.argv[2] || 'http://localhost:3457/app.html';
const OUT = 'D:/bianda-paopao/output/playwright';
const W = '#winDreamRoom';

(async () => {
  const pg = await launch({ width: 1440, height: 900 });
  await pg.goto(URL);
  await pg.sleep(1800);
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('button,.rbtn,a')].find(x => /直接假装上班/.test(x.textContent || ''));
    if (b) b.click();
  });
  await pg.sleep(1400);
  await pg.evaluate(() => goFeature('dreamroom'));
  await pg.sleep(800);

  const R = {};
  const room = () => pg.evaluate(w => {
    const win = document.querySelector(w);
    const st = win.querySelector('.k-st[data-k=play]');
    const g = win.querySelector('.dr-grid');
    const ctl = win.querySelector('.dr-ctl');
    const sh = win.querySelector('.dr-share2');
    const cards = [...win.querySelectorAll('.dr-c')].map(c => {
      const r = c.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const stage = win.querySelector('.k-stage');
    const rc = ctl ? ctl.getBoundingClientRect() : null;
    const rs = sh ? sh.getBoundingClientRect() : null;
    const rst = st ? st.getBoundingClientRect() : null;
    return {
      skin: win.dataset.skin,
      dataSt: win.dataset.st,
      stageBg: stage ? getComputedStyle(stage).backgroundColor : '(无)',
      shared: st ? st.classList.contains('dr-share') : null,
      gridCols: g ? getComputedStyle(g).gridTemplateColumns : '(无)',
      cards,
      // 宫格必须在控制栏之上，控制栏必须贴在窗口内容底部
      ctl: rc ? { y: Math.round(rc.top), h: Math.round(rc.height), bg: getComputedStyle(ctl).backgroundColor } : null,
      ctlBtns: ctl ? [...ctl.querySelectorAll('u')].map(u => u.textContent.trim()) : [],
      ctlEnd: ctl ? (ctl.querySelector('.end') || {}).textContent : null,
      endBg: ctl && ctl.querySelector('.end') ? getComputedStyle(ctl.querySelector('.end')).backgroundColor : null,
      share: rs ? { y: Math.round(rs.top), h: Math.round(rs.height), vis: getComputedStyle(sh).display } : null,
      shareHead: sh ? (sh.querySelector('.shh') || {}).textContent || '' : '',
      stBottom: rst ? Math.round(rst.bottom) : null,
      winBottom: Math.round(win.getBoundingClientRect().bottom),
      meta: (win.querySelector('.dr-meta') || {}).textContent || ''
    };
  }, W);

  // 没后端时四次调用是瞬间失败的，会中界面一眨眼就切到共享态。
  // 想看清「四个人还在想」那一屏，得把 /api/ask 拖慢——这只影响探针，不改产品代码
  await pg.evaluate(() => {
    const of = window.fetch;
    window.fetch = function (u) {
      if (String(u).includes('/api/ask')) {
        return new Promise(r => setTimeout(() => r(of.apply(this, arguments)), 4000));
      }
      return of.apply(this, arguments);
    };
  });
  await pg.evaluate(w => document.querySelector(w + ' [data-dr="go"]').click(), W);
  await pg.sleep(1500);
  R.thinking = await room();            // 还没出结论：宫格该是 2×2 大格子，没共享
  await pg.shot(OUT + '/dreamroom-room-thinking.png');

  await pg.sleep(7000);

  await pg.sleep(9000);
  R.shared = await room();              // 出结论后：共享打开，宫格收成顶部一条
  await pg.shot(OUT + '/dreamroom-room-teams.png');

  await pg.evaluate(w => {
    document.querySelector(w + ' .dr-ctl u.more').click();
  }, W);
  await pg.sleep(300);
  await pg.evaluate(w => document.querySelector(w + ' .dr-menu [data-sk="tm"]').click(), W);
  await pg.sleep(700);
  R.sharedTm = await room();            // 换皮后控制栏要跟着换
  await pg.shot(OUT + '/dreamroom-room-tm.png');

  // 挂断 = 回立案
  await pg.evaluate(w => document.querySelector(w + ' .dr-ctl .end').click(), W);
  await pg.sleep(600);
  R.afterEnd = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return { dataSt: win.dataset.st, introOn: !!win.querySelector('.k-st[data-k=intro]').classList.contains('on') };
  }, W);

  R.errs = pg.clean();
  console.log(JSON.stringify(R, null, 1));
  await pg.close();
})();
