// 参赛 README 截图：真实打开应用，摆多窗口工作场景（模仿真人使用状态）
const { chromium } = require('playwright');
const path = require('path');
const OUT = 'D:/bianda-paopao/docs/readme-bund/shots';
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
  const pg = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.goto('http://localhost:3000/app.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(2500);

  // S1 封面：吹一颗真话泡 + 按 B 吹八卦 + 大鱼小鱼在场
  await pg.fill('#spIn', '这个需求评审，其实我压根没听');
  await pg.click('#spBlow');
  await pg.waitForTimeout(1200);
  await pg.keyboard.press('b');
  await pg.waitForTimeout(3200);
  await pg.screenshot({ path: OUT + '/s1-cover.png' });

  // 进场
  await pg.click('#splashGo');
  await pg.waitForTimeout(3000);

  // S2 办公+视频同开：Word 写述职（AI 生成）+ 视频停靠海底银幕 + 钉钉群
  await pg.evaluate(() => { goFeature('report'); });
  await pg.waitForTimeout(600);
  await pg.evaluate(() => { const b = document.querySelector('#rptGo'); if (b) b.click(); });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => { const f = document.querySelector('#deskFilm'); if (f) f.click(); });
  await pg.waitForTimeout(1800);
  await pg.evaluate(() => { const v = document.querySelector('#tvScr video'); if (v) v.currentTime = 21; });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { if (window.tvMiniToggle) tvMiniToggle(); });
  await pg.waitForTimeout(600);
  await pg.evaluate(() => { goFeature('chat'); });
  await pg.waitForTimeout(2400);
  await pg.evaluate(() => { const w = document.querySelector('#winWord'); if (w) w.style.zIndex = 9999; });
  await pg.waitForTimeout(3500);
  await pg.screenshot({ path: OUT + '/s2-office-video.png' });

  // S3 梦蝶局放映 + Outlook 付费咨询
  await pg.evaluate(() => {
    ['winWord', 'winChat'].forEach(id => { const w = document.getElementById(id); if (w) w.classList.remove('on'); });
  });
  await pg.evaluate(() => { goFeature('review'); });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { const b = document.querySelector('#pptPlay'); if (b) b.click(); });
  await pg.waitForTimeout(5200);
  await pg.evaluate(() => { goFeature('mail'); });
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: OUT + '/s3-dream-mail.png' });

  // S4 薪资情报线：Excel 对表 + 工资条 + 一键述职完成的 Word
  await pg.evaluate(() => {
    ['winPPT', 'winMail'].forEach(id => { const w = document.getElementById(id); if (w) w.classList.remove('on'); });
    if (typeof dreamStop === 'function') try { dreamStop(); } catch (e) {}
  });
  await pg.evaluate(() => { goFeature('salary'); });
  await pg.waitForTimeout(1400);
  await pg.evaluate(() => { goFeature('me'); });
  await pg.waitForTimeout(1800);
  await pg.screenshot({ path: OUT + '/s4-salary.png' });

  // S5 老板键：一键切回"普通电脑"
  await pg.keyboard.press('Control+Space');
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: OUT + '/s5-bosskey.png' });
  await pg.keyboard.press('Control+Space');
  await pg.waitForTimeout(600);

  // S6 社区一屏：泡泡广场 + 吹泡泡 + 手机
  await pg.evaluate(() => {
    ['winExcel', 'winMe'].forEach(id => { const w = document.getElementById(id); if (w) w.classList.remove('on'); });
  });
  await pg.evaluate(() => { goFeature('home'); });
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { goFeature('insert'); });
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { goFeature('phone'); });
  await pg.waitForTimeout(1800);
  await pg.screenshot({ path: OUT + '/s6-square.png' });

  await br.close();
  console.log('6 张截图完成 → ' + OUT);
})();
