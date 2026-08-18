// 对齐会 · 桌面入口 + 双皮肤验收
// 跑法：node tools/probe-dreamroom-skin.cjs [url]
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
  await pg.sleep(1600);

  const R = {};

  // 1 桌面图标：在不在、写什么、有没有压住别的图标、点得动吗
  R.desk = await pg.evaluate(() => {
    const d = document.querySelector('#deskRoom');
    if (!d) return { on: false };
    const r = d.getBoundingClientRect();
    const mine = { x: r.left, y: r.top, w: r.width, h: r.height, text: (d.querySelector('em') || {}).textContent };
    const hit = [];
    document.querySelectorAll('.dski, #deskIcons .dski').forEach(o => {
      if (o === d) return;
      const b = o.getBoundingClientRect();
      if (r.left < b.right && b.left < r.right && r.top < b.bottom && b.top < r.bottom) {
        hit.push(((o.querySelector('em') || {}).textContent || o.id || '?').trim());
      }
    });
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    return { on: true, ...mine, overlap: hit, clickable: !!(top && d.contains(top)), vis: getComputedStyle(d).display };
  });

  // 2 点桌面图标开窗
  await pg.evaluate(() => document.querySelector('#deskRoom').click());
  await pg.sleep(900);
  R.opened = await pg.evaluate(w => {
    const win = document.querySelector(w);
    return { on: !!win && win.classList.contains('on'), skin: win && win.dataset.skin };
  }, W);

  const look = () => pg.evaluate(w => {
    const win = document.querySelector(w);
    const head = win.querySelector('.dwh');
    const av = win.querySelector('.dr-av');
    const cs = getComputedStyle(win);
    return {
      skin: win.dataset.skin,
      title: (head.textContent || '').trim(),
      headBg: getComputedStyle(head).backgroundColor,
      c: cs.getPropertyValue('--c').trim(),
      fa: cs.getPropertyValue('--fa').trim(),
      avRadius: av ? getComputedStyle(av).borderRadius : '(无)',
      foot: (win.querySelector('.k-foot') || {}).textContent || '',
      pills: [...win.querySelectorAll('.dr-sk b')].map(b => b.textContent + (b.classList.contains('on') ? '*' : ''))
    };
  }, W);

  R.teams = await look();
  await pg.shot(OUT + '/dreamroom-skin-teams.png');

  // 3 切腾讯会议
  await pg.evaluate(w => document.querySelector(w + ' [data-sk="tm"]').click(), W);
  await pg.sleep(700);
  R.tm = await look();
  await pg.shot(OUT + '/dreamroom-skin-tm.png');

  // 4 皮肤记不记得住：落盘了没有
  R.saved = await pg.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('bp-dreamroom') || '{}').skin || '(空)'; }
    catch (e) { return '(读不出)'; }
  });

  // 5 进对局：头像形状和卡面配色只有开局后才看得到
  await pg.evaluate(w => document.querySelector(w + ' [data-dr="go"]').click(), W);
  await pg.sleep(9000);
  const play = () => pg.evaluate(w => {
    const win = document.querySelector(w);
    const av = win.querySelector('.dr-av');
    const tool = win.querySelector('.k-tool');
    return {
      skin: win.dataset.skin,
      title: (win.querySelector('.dwh').textContent || '').trim(),
      avRadius: av ? getComputedStyle(av).borderRadius : '(无)',
      avBg: av ? getComputedStyle(av).backgroundColor : '(无)',
      avs: [...win.querySelectorAll('.dr-av')].map(a => a.textContent),
      cards: [...win.querySelectorAll('.dr-c h4')].map(x => x.textContent.trim()),
      foot: (win.querySelector('.k-foot') || {}).textContent || '',
      // 壳套壳自检：kit 那条文档工具条必须整条不可见，会议客户端上面不该再压一层
      toolVis: tool ? getComputedStyle(tool).display : '(无)'
    };
  }, W);
  R.playTm = await play();
  await pg.shot(OUT + '/dreamroom-skin-tm-play.png');

  // 6 会中换皮只能走控制栏的「更多」——工具条已经拆掉，皮肤按钮不该再浮在界面上
  R.moreBefore = await pg.evaluate(w => ({
    menu: !!document.querySelector(w + ' .dr-menu'),
    // 只数看得见的：加入前那一排还留在 DOM 里，但整屏是隐藏的，不算浮在会议界面上
    visiblePills: [...document.querySelectorAll(w + ' [data-sk]')].filter(b => b.offsetParent).length
  }), W);
  await pg.evaluate(w => document.querySelector(w + ' .dr-ctl u.more').click(), W);
  await pg.sleep(400);
  R.moreOpen = await pg.evaluate(w => {
    const m = document.querySelector(w + ' .dr-menu');
    if (!m) return { on: false };
    const r = m.getBoundingClientRect();
    const wr = document.querySelector(w).getBoundingClientRect();
    return {
      on: true, items: [...m.querySelectorAll('b')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')),
      inside: r.right <= wr.right + 1 && r.bottom <= wr.bottom + 1 && r.top >= wr.top,
      btnOn: !!document.querySelector(w + ' .dr-ctl u.more.on')
    };
  }, W);
  await pg.shot(OUT + '/dreamroom-skin-more.png');

  await pg.evaluate(w => document.querySelector(w + ' .dr-menu [data-sk="teams"]').click(), W);
  await pg.sleep(700);
  R.playTeams = await play();
  R.menuClosed = await pg.evaluate(w => !document.querySelector(w + ' .dr-menu'), W);
  await pg.shot(OUT + '/dreamroom-skin-teams-play.png');

  R.errs = pg.clean();
  console.log(JSON.stringify(R, null, 1));
  await pg.close();
})();
