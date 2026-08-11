// 梦蝶议事厅 · 真模型路径验收：桩掉 /api/ask 返回 ok:true，验证四行解析和「真」角标
// 跑法：node tools/probe-dreamroom-model.cjs [url]
const { launch } = require('./cdp.cjs');
const URL = process.argv[2] || 'http://localhost:3457/app.html';
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

  // 桩：模仿真模型会吐的几种脏格式（带编号、带引号、带空行、前缀后跟冒号）
  await pg.evaluate(() => {
    window.__n = 0;
    window.fetch = function (u, o) {
      if (!String(u).includes('/api/ask')) return Promise.reject(new Error('x'));
      const sys = JSON.parse(o.body).system;
      const two = /严格输出 2 行/.test(sys);
      const i = window.__n++;
      const body = two
        ? `1. 反应：“行，我记一下，回头看看怎么写。”\n\n2. 心里：他今天是有备而来。`
        : `明面：我要这季度的复盘能顺利收口\n\n底下：怕上面觉得我压不住组里的人${i}\n那根线：你越过我，直接把功劳摆到台面上\n原话：“这事我们会后单独聊。”`;
      return Promise.resolve({ json: () => Promise.resolve({ ok: true, mode: 'model', model: 'stub', text: body, ms: 120 }) });
    };
  });

  await pg.evaluate(() => goFeature('dreamroom'));
  await pg.sleep(600);
  await pg.evaluate(() => document.querySelector('[data-dr="go"]').click());
  await pg.sleep(2500);

  const R = {};
  R.cards = await pg.evaluate(w => [...document.querySelectorAll(w + ' .dr-c')].map(c => ({
    nm: (c.querySelector('h4') || {}).textContent,
    bg: (c.querySelector('.dr-bg') || {}).textContent,
    f: [...c.querySelectorAll('.dr-f span')].map(s => s.textContent),
    say: (c.querySelector('.dr-say') || {}).textContent || ''
  })), W);
  R.foot = await pg.evaluate(w => (document.querySelector(w + ' .k-foot') || {}).textContent, W);

  await pg.evaluate(() => {
    document.querySelector('#drLine').value = '我希望纪要里写上我的名字。';
    document.querySelector('[data-dr="react"]').click();
  });
  await pg.sleep(2500);
  R.notes = await pg.evaluate(w => [...document.querySelectorAll(w + ' .k-side .cmt')].map(n => n.textContent.trim()), W);
  R.foot2 = await pg.evaluate(w => (document.querySelector(w + ' .k-foot') || {}).textContent, W);
  R.aiLog = await pg.evaluate(() => (typeof AILOG !== 'undefined' ? AILOG.filter(x => /议事厅/.test(x.src)).length : -1));
  R.errs = pg.clean();

  console.log(JSON.stringify(R, null, 1));
  await pg.close();
})();
