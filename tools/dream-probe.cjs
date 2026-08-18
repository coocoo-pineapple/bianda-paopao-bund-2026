const PW = 'C:/Users/admin/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core';
const { chromium } = require(PW);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:3457/app.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelector('#splash').classList.add('off'));
  await p.waitForTimeout(600);
  await p.evaluate(() => goFeature('review'));
  await p.waitForTimeout(600);
  const probe = () => p.evaluate(() => {
    const q = s => document.querySelector(s);
    const box = e => e ? { h: Math.round(e.getBoundingClientRect().height), sh: e.scrollHeight, ch: e.clientHeight } : null;
    const g = q('#dreamGame');
    return {
      paper2: box(q('#winPPT .paper2')),
      dwb: box(q('#winPPT .dwb')),
      game: box(g),
      kids: g ? [...g.children].map(c => c.className + ':' + Math.round(c.getBoundingClientRect().height)) : []
    };
  });
  console.log('script idle', JSON.stringify(await probe(), null, 1));
  await p.click('#dreamGame [data-dmode="ai"]');
  await p.waitForTimeout(400);
  console.log('ai setup', JSON.stringify(await probe(), null, 1));
  await b.close();
})();
