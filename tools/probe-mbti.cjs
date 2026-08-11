// 职场 MBTI 验收：Outlook 人才盘点问卷壳
// 跑法：node tools/probe-mbti.cjs [url]
const { launch } = require('./cdp.cjs');
const URL = process.argv[2] || 'http://localhost:3457/app.html';
const OUT = 'D:/bianda-paopao/output/playwright';
const W = '#winMBTI';

const enter = async (pg) => {
  await pg.goto(URL);
  await pg.sleep(1800);
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('button,.rbtn,a')].find(x => /直接假装上班/.test(x.textContent || ''));
    if (b) b.click();
  });
  await pg.sleep(1500);
};

(async () => {
  const pg = await launch({ width: 1440, height: 900 });
  const R = {};
  await enter(pg);

  // ---- registerGame：磁贴进「趣味游戏」、条目进「点子集市」、路由进 OS_GO ----
  R.reg = await pg.evaluate(() => ({
    go: !!(window.goFeature && OS_GO && OS_GO.mbti),
    tile: [...document.querySelectorAll('#winFolder .fgi em')].map(e => e.textContent),
    cnt: (document.querySelector('#winFolder .fcnt') || {}).textContent || '',
    hall: typeof GAMES !== 'undefined' ? GAMES.map(g => g.nm) : [],
    hallDom: [...document.querySelectorAll('#gameHall [data-play]')].map(b => b.dataset.play)
  }));

  await pg.evaluate(() => goFeature('mbti'));
  await pg.sleep(700);

  // ---- intro 段 ----
  R.intro = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      on: !!win && win.classList.contains('on'),
      state: win.__game && win.__game.state(),
      introOn: !!win.querySelector('.k-st[data-k=intro].on'),
      title: (win.querySelector('.dwh') || {}).textContent || '',
      tool: (win.querySelector('.dwt') || {}).textContent || '',
      foot: (win.querySelector('.dwf') || {}).textContent || '',
      side: !!win.querySelector('.k-side'),
      demoPic: (win.querySelector('#mbPicDemo .mb-photo') || {}).className || '',
      demoProps: [...win.querySelectorAll('#mbPicDemo .pp')].map(p => p.className.replace('pp p-', ''))
    };
  }, W);
  await pg.shot(OUT + '/mbti-intro.png');

  // ---- 开始填写 → play 段 ----
  await pg.evaluate(w => document.querySelector(w + ' .mb-start').click(), W);
  await pg.sleep(700);
  R.play = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      state: win.__game.state(),
      playOn: !!win.querySelector('.k-st[data-k=play].on'),
      folds: [...win.querySelectorAll('.mb-fold b[data-ax]')].map(b => b.textContent),
      tracks: win.querySelectorAll('.mb-tk[data-tk]').length,
      ops: win.querySelectorAll('.mb-op').length,
      ava: (win.querySelector('.mb-hd .av') || {}).textContent || '',
      avaBg: (win.querySelector('.mb-hd .av') || { style: {} }).style.background || '',
      revBefore: win.querySelectorAll('.mb-op.rev').length,   // 未投票不许提前露占比
      statBefore: (win.querySelector('.mb-stat') || {}).textContent || '',
      info: (win.querySelector('.mb-info') || {}).textContent || '',
      subject: (win.querySelector('.mb-hd .h1') || {}).textContent || '',
      foot: (win.querySelector('.dwf') || {}).textContent || '',
      toolTip: (win.querySelector('.dwt .sp') || {}).textContent || ''
    };
  }, W);
  await pg.shot(OUT + '/mbti-play.png');

  // ---- 投一票：跟踪条要动、文件夹计数要走、InfoBar 变成已投票 ----
  const t0 = await pg.evaluate(w => document.querySelector(w + ' .mb-tk[data-tk="0"] b').style.width, W);
  await pg.evaluate(w => document.querySelector(w + ' .mb-op[data-o="a"]').click(), W);
  await pg.sleep(500);
  // 跳走之前先抓一次：占比条和统计句只在当前这封上存在
  R.reveal = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      rev: win.querySelectorAll('.mb-op.rev').length,
      pcts: [...win.querySelectorAll('.mb-op .pc')].map(e => e.textContent),
      widths: [...win.querySelectorAll('.mb-op i')].map(e => e.style.width),
      stat: (win.querySelector('.mb-stat') || {}).textContent || ''
    };
  }, W);
  await pg.sleep(700);
  R.vote = await pg.evaluate((w, t0) => {
    const win = document.querySelector(w);
    return {
      barBefore: t0,
      barAfter: win.querySelector('.mb-tk[data-tk="0"] b').style.width,
      ax0: win.__game.ax(0),
      answered: win.__game.answered(),
      jumped: win.__game.idx(),
      fold0: (win.querySelector('.mb-fold b[data-ax="0"] i') || {}).textContent || '',
      foot: (win.querySelector('.dwf') || {}).textContent || '',
      dirty: /^\*/.test((win.querySelector('.dwh') || {}).textContent || '')
    };
  }, W, t0);

  // ---- 上一封回看：已投的那封要显示「你在 … 投了 … 票」且选项高亮 ----
  await pg.evaluate(w => { const win = document.querySelector(w); while (win.__game.idx() > 0) win.querySelector('.mb-prev').click(); }, W);
  await pg.sleep(400);
  R.revisit = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return {
      idx: win.__game.idx(),
      info: (win.querySelector('.mb-info') || {}).textContent || '',
      voted: win.querySelector('.mb-info').classList.contains('vd'),
      pick: win.querySelectorAll('.mb-op.pick').length,
      rev: win.querySelectorAll('.mb-op.rev').length,        // 回看已投的封，占比要一直在
      stat: (win.querySelector('.mb-stat') || {}).textContent || '',
      prevDisabled: !!win.querySelector('.mb-prev[disabled]')
    };
  }, W);
  await pg.shot(OUT + '/mbti-vote.png');

  // ---- 改票：同一题改投 B，第一维分值必须跟着反向 ----
  await pg.evaluate(w => document.querySelector(w + ' .mb-op[data-o="b"]').click(), W);
  await pg.sleep(900);
  R.change = await pg.evaluate(w => ({
    ax0: document.querySelector(w).__game.ax(0),
    answered: document.querySelector(w).__game.answered()
  }), W);

  // ---- 答完 16 题 → over 段 ----
  R.over = await pg.evaluate(async w => {
    const win = document.querySelector(w);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 40 && win.__game.state() === 'play'; i++) {
      const op = win.querySelector('.mb-op[data-o="' + (i % 2 ? 'b' : 'a') + '"]');
      if (op) op.click();
      await sleep(1000);
    }
    return {
      state: win.__game.state(),
      overOn: !!win.querySelector('.k-st[data-k=over].on'),
      code: win.__game.code(false),
      shown: (win.querySelector('.mb-code') || {}).textContent || '',
      photo: !!win.querySelector('.mb-photo'),
      props: [...win.querySelectorAll('#mbPic .pp')].map(p => p.className.replace('pp p-', '')),
      cap: (win.querySelector('#mbPic + .mb-cap') || {}).textContent || '',
      badge: !!win.querySelector('.mb-photo .bdg'),
      collar: !!win.querySelector('.mb-photo .col'),
      att: win.querySelectorAll('.mb-att').length,
      stamp: (win.querySelector('.k-stamp') || {}).textContent || '',
      notes: win.querySelectorAll('.k-side .k-note').length,
      foot: (win.querySelector('.dwf') || {}).textContent || '',
      title: (win.querySelector('.dwh') || {}).textContent || '',
      text: (win.querySelector('#mbOver') || {}).textContent || ''
    };
  }, W);
  await pg.shot(OUT + '/mbti-over.png');

  // ---- 转成泡泡：水面必须多一个 ----
  R.bub = await pg.evaluate(w => {
    const n0 = typeof S !== 'undefined' && S.bubbles ? S.bubbles.length : -1;
    document.querySelector(w + ' .mb-bub').click();
    return { before: n0, after: typeof S !== 'undefined' && S.bubbles ? S.bubbles.length : -1 };
  }, W);
  await pg.sleep(400);

  R.errs = pg.clean();
  await pg.close();

  // ---- 减动效跑一遍：结算页仍要出得来 ----
  const pg2 = await launch({ width: 1440, height: 900, reduced: true });
  await enter(pg2);
  await pg2.evaluate(() => goFeature('mbti'));
  await pg2.sleep(600);
  R.reduced = await pg2.evaluate(async w => {
    const win = document.querySelector(w);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    win.querySelector('.mb-start').click();
    await sleep(400);
    for (let i = 0; i < 40 && win.__game.state() === 'play'; i++) {
      const op = win.querySelector('.mb-op[data-o="a"]');
      if (op) op.click();
      await sleep(1000);
    }
    return { state: win.__game.state(), code: win.__game.code(false), photo: !!win.querySelector('.mb-photo'),
             props: [...win.querySelectorAll('#mbPic .pp')].map(p => p.className.replace('pp p-', '')) };
  }, W);
  R.reducedErrs = pg2.clean();
  await pg2.close();

  console.log(JSON.stringify(R, null, 2));
  const bad = R.errs.length || R.reducedErrs.length
    || !R.reg.go || !R.reg.tile.includes('话卷锅饼测试') || !R.reg.hall.includes('话卷锅饼测试')
    || !R.reg.hallDom.includes('mbti') || !/9 个项目/.test(R.reg.cnt)
    || R.intro.state !== 'intro' || !R.intro.introOn || !R.intro.side
    || R.intro.demoProps.join('') !== 'PJBH'
    || R.play.state !== 'play' || R.play.folds.length !== 4 || R.play.tracks !== 4 || R.play.ops !== 2
    || !R.play.ava || !R.play.avaBg || R.play.revBefore !== 0 || R.play.statBefore !== ''
    || !/请单击/.test(R.play.info) || !/第 1\/16 项/.test(R.play.foot)
    || R.reveal.rev !== 2 || R.reveal.pcts.join('/') !== '38%/62%' || R.reveal.widths.join('/') !== '38%/62%'
    || !/共 412 人已投票/.test(R.reveal.stat) || !/38%/.test(R.reveal.stat)
    || R.vote.ax0 !== 1 || R.vote.answered !== 1 || R.vote.jumped !== 1
    || R.vote.barAfter === R.vote.barBefore || !R.vote.dirty || !/1\/4/.test(R.vote.fold0)
    || R.revisit.idx !== 0 || !R.revisit.voted || R.revisit.pick !== 1 || R.revisit.rev !== 2
    || !/同一项的有/.test(R.revisit.stat) || !R.revisit.prevDisabled
    || R.change.ax0 !== -1 || R.change.answered !== 1
    || R.over.state !== 'over' || !R.over.overOn || R.over.code.length !== 4
    || R.over.shown !== R.over.code || !R.over.photo || R.over.att !== 4
    || R.over.props.join('') !== R.over.code || !R.over.badge || !R.over.collar || R.over.cap.length < 12
    || !R.over.stamp || R.over.notes < 5 || !/已归档/.test(R.over.foot)
    || R.bub.after !== R.bub.before + 1
    || R.reduced.state !== 'over' || !R.reduced.photo || R.reduced.props.join('') !== R.reduced.code;
  console.log(bad ? '\n!! 验收未过' : '\n验收通过');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('probe 崩了:', e.message); process.exit(1); });
