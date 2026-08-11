// 阶段 1 pilot 验收：爽文背单词 · Word 拼写和语法检查壳
// 跑法：node tools/probe-word.cjs [url]
const { launch, KEY } = require('./cdp.cjs');
const URL = process.argv[2] || 'http://localhost:3457/app.html';
const OUT = 'D:/bianda-paopao/output/playwright';
const W = '#winWordGame';

const enter = async (pg) => {
  await pg.goto(URL);
  await pg.sleep(1800);
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('button,.rbtn,a')].find(x => /直接假装上班/.test(x.textContent || ''));
    if (b) b.click();
  });
  await pg.sleep(1500);
  await pg.evaluate(() => window.osOpen && osOpen('winWordGame'));
  await pg.sleep(600);
};

(async () => {
  const pg = await launch({ width: 1440, height: 900 });
  const R = {};
  await enter(pg);

  // ---- intro 段 ----
  R.intro = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      on: !!win && win.classList.contains('on'),
      state: win.__game && win.__game.state(),
      introOn: !!win.querySelector('.k-st[data-k=intro].on'),
      tool: (win.querySelector('.dwt') || {}).textContent || '',
      side: !!win.querySelector('.k-side'),
      title: (win.querySelector('.dwh') || {}).textContent || ''
    };
  }, W);
  await pg.shot(OUT + '/word-intro.png');

  // ---- 开始校对 → play 段 ----
  await pg.evaluate(w => document.querySelector(w + ' .wg-start').click(), W);
  await pg.sleep(700);
  R.play = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      state: win.__game.state(),
      playOn: !!win.querySelector('.k-st[data-k=play].on'),
      levels: [...win.querySelectorAll('.dwt button[data-lv]')].map(b => b.textContent),
      foot: (win.querySelector('.dwf') || {}).textContent || '',
      ops: win.querySelectorAll('.wg-op').length,
      wavy: !!win.querySelector('.wg-ctx em'),
      notes: win.querySelectorAll('.k-side .k-note').length,
      remain: win.__game.remain()
    };
  }, W);
  await pg.shot(OUT + '/word-play.png');

  // ---- 故意答错一题：讲评必须落到右侧批注栏 ----
  await pg.evaluate(w => document.querySelector(w + ' .wg-op[data-k="0"]').click(), W);
  await pg.sleep(500);
  R.wrongNote = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      notes: win.querySelectorAll('.k-side .k-note').length,
      lastNote: (win.querySelector('.k-side .k-note:last-child') || {}).textContent || '',
      inlineFb: win.querySelectorAll('.wg-fb').length,   // 旧的内嵌红框应为 0
      nextBtn: !!win.querySelector('.wg-next')
    };
  }, W);
  await pg.shot(OUT + '/word-note.png');

  // ---- bug1 回归：关窗 3.5 秒再开，剩余时间不许走 ----
  await pg.evaluate(w => document.querySelector(w + ' .wg-next').click(), W);
  await pg.sleep(400);
  const before = await pg.evaluate(w => document.querySelector(w).__game.remain(), W);
  await pg.evaluate(() => document.querySelector('#winWordGame').classList.remove('on'));
  await pg.sleep(3500);
  await pg.evaluate(() => osOpen('winWordGame'));
  await pg.sleep(300);
  const after = await pg.evaluate(w => document.querySelector(w).__game.remain(), W);
  R.bug1 = { before: +before.toFixed(2), after: +after.toFixed(2), pass: after > 5 };

  // ---- 老板键回归：Ctrl+Space 3 秒，剩余时间不许走 ----
  const b0 = await pg.evaluate(w => document.querySelector(w).__game.remain(), W);
  await pg.key(KEY.space, 2);
  await pg.sleep(3000);
  const bMid = await pg.evaluate(() => ({
    mask: !!document.querySelector('#desktopMask.on'),
    remain: document.querySelector('#winWordGame').__game.remain()
  }));
  await pg.key(KEY.space, 2);
  await pg.sleep(400);
  R.boss = { before: +b0.toFixed(2), during: +bMid.remain.toFixed(2), mask: bMid.mask, pass: bMid.remain > b0 - 1 };

  // ---- 走完全局 → over 段 + 盖戳 ----
  R.over = await pg.evaluate(async w => {
    const win = document.querySelector(w);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 40; i++) {
      if (win.__game.state() !== 'play') break;
      const ok = win.querySelector('.wg-op[data-k="1"]:not([disabled])');
      const nx = win.querySelector('.wg-next');
      if (ok) ok.click(); else if (nx) nx.click();
      await sleep(280);
    }
    return {
      state: win.__game.state(),
      overOn: !!win.querySelector('.k-st[data-k=over].on'),
      stamp: (win.querySelector('.k-stamp') || {}).textContent || '',
      text: (win.querySelector('.wg-pane') || {}).textContent || '',
      foot: (win.querySelector('.dwf') || {}).textContent || '',
      restart: !!win.querySelector('.wg-start')
    };
  }, W);
  await pg.shot(OUT + '/word-over.png');

  R.errs = pg.clean();
  await pg.close();

  // ---- 减动效跑一遍：结算页仍要出得来（fx 的 then 回调不能被降级吞掉）----
  const pg2 = await launch({ width: 1440, height: 900, reduced: true });
  await enter(pg2);
  R.reduced = await pg2.evaluate(async w => {
    const win = document.querySelector(w);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    win.querySelector('.wg-start').click();
    await sleep(400);
    for (let i = 0; i < 40; i++) {
      if (win.__game.state() !== 'play') break;
      const ok = win.querySelector('.wg-op[data-k="1"]:not([disabled])');
      const nx = win.querySelector('.wg-next');
      if (ok) ok.click(); else if (nx) nx.click();
      await sleep(260);
    }
    return { state: win.__game.state(), stamp: !!win.querySelector('.k-stamp') };
  }, W);
  R.reducedErrs = pg2.clean();
  await pg2.close();

  console.log(JSON.stringify(R, null, 2));
  const bad = R.errs.length || R.reducedErrs.length
    || R.intro.state !== 'intro' || !R.intro.introOn || !R.intro.side
    || R.play.levels.length !== 3 || R.play.ops !== 3 || !R.play.wavy
    || !/第 .*处/.test(R.play.foot) || !/连击/.test(R.play.foot)
    || R.wrongNote.notes < 2 || R.wrongNote.inlineFb !== 0
    || !R.bug1.pass || !R.boss.pass
    || R.over.state !== 'over' || !R.over.overOn || !R.over.stamp
    || R.reduced.state !== 'over' || !R.reduced.stamp;
  console.log(bad ? '\n!! 验收未过' : '\n验收通过');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('probe 崩了:', e.message); process.exit(1); });
