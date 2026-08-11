// 阶段 0 地基验收：BPKit 就位 + token 生效 + 零 pageerror + 老板键静音
// 跑法：node tools/probe-kit.cjs [url]
const { launch, KEY } = require('./cdp.cjs');
const URL = process.argv[2] || 'http://localhost:3457/app.html';
const OUT = 'D:/bianda-paopao/output/playwright';

(async () => {
  const pg = await launch({ width: 1440, height: 900 });
  await pg.goto(URL);
  await pg.sleep(2000);

  // 进桌面
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('button,.rbtn,a')].find(x => /直接假装上班/.test(x.textContent || ''));
    if (b) b.click();
  });
  await pg.sleep(1800);
  await pg.shot(OUT + '/kit-desktop.png');

  const r = await pg.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const K = window.BPKit || {};
    return {
      kit: typeof window.BPKit,
      missing: ['shell', 'fx', 'sfx', 'pause', 'save', 'ranks', 'swagger', 'tip', 'sandbox', 'timer']
        .filter(k => typeof K[k] === 'undefined'),
      css: !!document.querySelector('#bpkit-css'),
      r2: cs.getPropertyValue('--r2').trim(),
      s3: cs.getPropertyValue('--s3').trim(),
      g2: cs.getPropertyValue('--g-2').trim(),
      eOut: cs.getPropertyValue('--e-out').trim(),
      mono: cs.getPropertyValue('--mono').trim(),
      rank0: K.RANK && K.RANK.swagger(0),
      rank100: K.RANK && K.RANK.swagger(100),
      saveOk: (() => { try { const s = K.save('probe'); s.set('a', 1); return s.get('a') === 1; } catch (e) { return 'ERR:' + e.message; } })(),
      timerOk: (() => { try { const t = K.timer(null, { sec: 5 }); t.start(5); const n = t.remain(); t.stop(); return n > 4.5 && n <= 5; } catch (e) { return 'ERR:' + e.message; } })(),
      nosfxSwitch: !!document.querySelector('#dNote .sw[data-k="nosfx"]'),
      mask: !!document.querySelector('#desktopMask'),
      wins: document.querySelectorAll('.dwin').length,
      goldBtn: (() => {
        const b = document.createElement('button'); b.className = 'rbtn gold';
        document.body.appendChild(b); const bg = getComputedStyle(b).backgroundImage;
        b.remove(); return /gradient/.test(bg);
      })()
    };
  });

  // 老板键：遮罩上来 + BPKit 全局暂停 + 强制静音
  await pg.key(KEY.space, 2);
  await pg.sleep(700);
  const boss = await pg.evaluate(() => ({
    maskOn: !!document.querySelector('#desktopMask.on'),
    paused: window.BPKit ? window.BPKit.pause.isPaused(document.querySelector('.dwin')) : null
  }));
  await pg.shot(OUT + '/kit-bosskey.png');
  await pg.key(KEY.space, 2);
  await pg.sleep(400);

  const errs = pg.clean();
  await pg.close();
  console.log(JSON.stringify({ r, boss, errs }, null, 2));
  const bad = errs.length || r.missing.length || r.kit !== 'object' || !r.css || !r.nosfxSwitch;
  console.log(bad ? '\n!! 验收未过' : '\n验收通过');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('probe 崩了:', e.message); process.exit(1); });
