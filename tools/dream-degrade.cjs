/* 逐座位降级验证：两个座位假装模型成功、两个失败，
   四张牌的角标必须一张一张各自标，不许整局一刀切 */
const PW = 'C:/Users/admin/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core';
const { chromium } = require(PW);
const path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'shots-dream');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  await p.goto('http://localhost:3457/app.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelector('#splash').classList.add('off'));
  await p.waitForTimeout(500);
  await p.evaluate(() => goFeature('teams'));
  await p.waitForTimeout(400);

  // 前两个座位真、后两个座位假
  await p.evaluate(() => {
    let n = 0;
    window.askAI = async (src, system, q) => {
      const mine = n++;
      if (mine >= 2) return { ok: false, mode: 'script', why: '测试注入的失败' };
      return { ok: true, mode: 'model', text: '这事我说了算，别多问。\n数字是 47，写在纪要里。\n我上周说的就是这个。\n这张表我认。' };
    };
  });

  await p.click('#dreamGame [data-dmode="ai"]');
  await p.waitForTimeout(300);
  await p.click('[data-ad="start"]');
  await p.waitForFunction(() => AD.st === 'play', null, { timeout: 30000 });
  await p.waitForTimeout(600);

  console.log('srcOf:', JSON.stringify(await p.evaluate(() => AD.srcOf)));
  const badges = await p.evaluate(() => [...document.querySelectorAll('#dreamGame .idcard')].map(c => {
    const s = c.querySelector('.csrc');
    return c.querySelector('b').textContent + '=' + (s ? (s.classList.contains('real') ? '真' : '脚') : '无');
  }));
  console.log('per-card badges:', badges.join('  '));
  const real = badges.filter(x => x.endsWith('真')).length;
  console.log(real === 2 ? 'OK 逐座位标注（2 真 2 脚），没有一刀切' : 'FAIL 标注被一刀切了');
  console.log('开局四维各一条（都应是软）:', await p.evaluate(() =>
    DIMS.map(d => d.k + ':' + (AD.slots[d.k] || []).length + (adHard(d.k) ? '硬' : '软')).join(' ')));
  await p.screenshot({ path: path.join(OUT, '09-mixed-degrade.png') });

  // 跨座位质问时现场调用也失败：那一条必须自己标「脚」，不许蹭发起方的「真」
  await p.waitForFunction(() => AD.phase === 'act', null, { timeout: 30000 });
  const pair = await p.evaluate(() => ({ by: AD.roles[0][0], tg: AD.roles[1][0], dim: AD.roles[1][1] }));
  await p.click(`#dreamHand [data-q="${pair.by}"]`);
  await p.waitForTimeout(150);
  await p.click(`#dreamGame [data-aim="${pair.tg}"]`);
  await p.waitForFunction(() => AD.phase === 'act', null, { timeout: 30000 });
  await p.waitForTimeout(300);
  const cell = await p.evaluate(k => {
    const a = AD.slots[k] || [];
    return a[a.length - 1] || null;
  }, pair.dim);
  console.log('现场调用失败那一条:', JSON.stringify(cell));
  const honest = !!cell && cell.src === 'script';
  console.log(honest ? 'OK 现场降级照实标「脚」' : 'FAIL 降级的那条被标成了模型生成');

  console.log('errors:', errs.length, errs.slice(0, 5));
  await b.close();
  process.exit(real === 2 && honest && !errs.length ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
