// 对齐会验收：会议壳 + 每座位独立调用 + 逐座位真/脚 + 推演
// 跑法：node tools/probe-dreamroom.cjs [url]
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

  const R = {};

  // 抓住每次 /api/ask 的 system，验证互不包含对方设定
  await pg.evaluate(() => {
    window.__sys = [];
    const of = window.fetch;
    window.fetch = function (u, o) {
      try { if (String(u).includes('/api/ask')) window.__sys.push(JSON.parse(o.body).system); } catch (e) {}
      return of.apply(this, arguments);
    };
  });

  R.reg = await pg.evaluate(() => ({
    go: !!(window.OS_GO && OS_GO.dreamroom),
    tile: [...document.querySelectorAll('#winFolder .fgi em')].map(e => e.textContent),
    hall: typeof GAMES !== 'undefined' ? GAMES.map(g => g.nm) : []
  }));

  await pg.evaluate(() => goFeature('dreamroom'));
  await pg.sleep(700);

  R.intro = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      on: !!win && win.classList.contains('on'),
      app: win && win.dataset.app,
      q: (document.querySelector('#drQ') || {}).value || '',
      rows: document.querySelectorAll('#drRows tr').length,
      micWhy: (document.querySelector('#drMicWhy') || {}).textContent || '',
      warn: (document.querySelector('#drWarn') || {}).textContent || '',
      foot: (win.querySelector('.k-foot') || {}).textContent || ''
    };
  }, W);

  // 开局
  await pg.evaluate(() => document.querySelector('[data-dr="go"]').click());
  await pg.sleep(9000);

  R.play = await pg.evaluate(w => {
    const win = document.querySelector(w);
    const cards = [...win.querySelectorAll('.dr-c')].map(c => ({
      nm: (c.querySelector('h4') || {}).textContent,
      bg: (c.querySelector('.dr-bg') || {}).textContent,
      fields: [...c.querySelectorAll('.dr-f span')].map(s => s.textContent),
      say: (c.querySelector('.dr-say') || {}).textContent || ''
    }));
    return {
      cards,
      cmp: [...win.querySelectorAll('.dr-cmp li')].map(l => l.textContent.trim()),
      foot: (win.querySelector('.k-foot') || {}).textContent || ''
    };
  }, W);

  R.sysA = await pg.evaluate(() => window.__sys.slice());

  // 推演一句话
  await pg.evaluate(() => {
    document.querySelector('#drLine').value = '这个项目的结果，我希望复盘纪要里写上我的名字。';
    document.querySelector('[data-dr="react"]').click();
  });
  await pg.sleep(9000);

  R.react = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      notes: [...win.querySelectorAll('.k-side .cmt')].map(n => n.textContent.trim().slice(0, 60)),
      foot: (win.querySelector('.k-foot') || {}).textContent || ''
    };
  }, W);

  R.calls = await pg.evaluate(() => window.__sys.length);
  R.aiLog = await pg.evaluate(() => (typeof AILOG !== 'undefined' ? AILOG.filter(x => /对齐会/.test(x.src)).length : -1));

  // 存卷
  const before = await pg.evaluate(() => S.bubbles.length);
  await pg.evaluate(() => document.querySelector('[data-dr="file"]').click());
  await pg.sleep(600);
  R.file = await pg.evaluate(b => ({
    grew: S.bubbles.length > b,
    last: (S.bubbles.find(x => x.author === '对齐会') || {}).text || ''
  }), before);

  R.errs = pg.clean();

  await pg.shot(OUT + '/dreamroom-play.png');
  console.log(JSON.stringify(R, null, 1));
  await pg.close();
})();
