/* 梦蝶局 · 四片叶子买代价 E2E —— 用全局 playwright-core + 已装的 chromium */
const path = require('path');
const PW = 'C:/Users/admin/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core';
const { chromium } = require(PW);
const OUT = path.join(__dirname, '..', 'docs', 'shots-dream');
require('fs').mkdirSync(OUT, { recursive: true });

const errs = [];
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.png') });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('response', r => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()); });
  // 抓 /api/ask：验证每座位一次独立调用、四个 system 只含自己那一维
  const asks = [];
  p.on('request', r => {
    if (r.url().includes('/api/ask') && r.method() === 'POST') {
      try { asks.push(JSON.parse(r.postData() || '{}')); } catch (e) {}
    }
  });

  await p.goto('http://localhost:3457/app.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const s = document.querySelector('#splash'); if (s) s.classList.add('off'); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { if (typeof goFeature === 'function') goFeature('teams'); });
  await p.waitForTimeout(800);
  await shot(p, '01-ppt');

  // 切到 AI 卡牌局
  await p.click('#dreamGame [data-dmode="ai"]');
  await p.waitForTimeout(400);
  console.log('setup form:', await p.locator('#adSc').count(), 'preset cases:', await p.locator('#adCase option').count(),
              'fixed dims:', await p.locator('.adrow .adim').count(), 'adv:', await p.locator('#adAdv').count());
  console.log('任务栏 Teams 入口:', await p.locator('#osbar [data-go="teams"]').count(),
              '| 开窗后点亮:', await p.locator('#osbar [data-go="teams"].on').count(),
              '| PPT 窗里已无牌桌:', await p.locator('#winPPT #dreamGame').count() === 0 ? 'YES' : 'NO');
  // 会议窗是自由高度的 .dwin：舞台不许内滚，手牌不许被托盘切掉
  const geoOf = () => p.evaluate(() => {
    const s = document.querySelector('#tmStage');
    if (!s) return null;
    const tray = document.querySelector('#tmTray'), cards = [...document.querySelectorAll('#dreamHand .qcard')];
    let handOK = true;
    if (tray && cards.length && tray.offsetParent){
      const tr = tray.getBoundingClientRect();
      handOK = [cards[0], cards[cards.length - 1]].every(c => {
        const r = c.getBoundingClientRect();
        return r.top >= tr.top - 1 && r.bottom <= tr.bottom + 1;
      });
    }
    return { over: s.scrollHeight - s.clientHeight, handOK };
  });
  const H = {};
  H.setup = await geoOf();
  console.log('setup 舞台:', JSON.stringify(H.setup));
  await shot(p, '02-setup');

  // 雇一个座位 + 一个军师 → 应弹收银台
  await p.selectOption('#adFr1', 'hire');
  await p.selectOption('#adAdv', '0');
  await p.click('[data-ad="start"]');
  await p.waitForTimeout(400);
  const payOn = await p.locator('[data-py]').count();
  console.log('payDlg shown:', payOn);
  if (payOn) await p.click('[data-py]');

  // 等开局四次调用 + 第一轮四句
  await p.waitForFunction(() => AD.st === 'play' && AD.phase === 'act', null, { timeout: 45000 });
  await p.waitForTimeout(500);
  console.log('round', await p.evaluate(() => AD.round), 'min', await p.evaluate(() => AD.min),
              'calls', await p.evaluate(() => AD.calls), 'srcOf', JSON.stringify(await p.evaluate(() => AD.srcOf)));
  // 开局每一维各有一条自己说的 = 软
  console.log('opening cells:', await p.evaluate(() =>
    DIMS.map(d => d.k + ':' + (AD.slots[d.k] || []).length + (adHard(d.k) ? '硬' : '软')).join(' ')));
  console.log('agent hand cards:', await p.locator('#dreamHand .qcard').count(),
              'dreamcards class:', await p.evaluate(() => document.body.classList.contains('dreamcards')));
  await shot(p, '03-round1-hand');
  H.play = await geoOf();
  console.log('play 舞台:', JSON.stringify(H.play));

  // 屏幕上的调用计数 == 实际抓到的请求数
  const badge = await p.locator('#dreamGame .acount').first().textContent();
  console.log('acount badge:', badge.trim(), '| real requests so far:', asks.length);

  // 老板键：分钟必须停住
  await p.keyboard.down('Control'); await p.keyboard.press('Space'); await p.keyboard.up('Control');
  await p.waitForTimeout(1500);
  const m1 = await p.evaluate(() => AD.min);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  console.log('boss key: maskOn paused, min held at', m1);

  // ===== A2A：派 A 去质问 B，抓那一次调用的 q 里有没有 B 的原话 =====
  const pair = await p.evaluate(() => {
    const by = AD.roles[0][0], tg = AD.roles[1][0];
    return { by, tg, tgLast: AD.last[tg] || '' };
  });
  const n0 = asks.length;
  await p.click(`#dreamHand [data-q="${pair.by}"]`);
  await p.waitForTimeout(200);
  await p.click(`#dreamGame [data-aim="${pair.tg}"]`);
  await p.waitForFunction(() => AD.phase === 'act', null, { timeout: 30000 });
  await p.waitForTimeout(400);
  const fresh = asks.slice(n0);
  const carried = fresh.some(a => pair.tgLast && (a.q || '').includes(pair.tgLast.slice(0, 12)));
  console.log('A2A:', pair.by, '→', pair.tg, '| new calls:', fresh.length,
              '| 目标原话进了发起方的 q:', carried ? 'YES' : 'NO');
  console.log('after 跨座位质问 · cells:', await p.evaluate(() =>
    DIMS.map(d => d.k + ':' + (AD.slots[d.k] || []).length + (adHard(d.k) ? '硬' : '软')).join(' ')));
  await shot(p, '04-a2a');

  // 同座位深挖：不调用、仍是软
  const selfDim = await p.evaluate(() => AD.roles[2][1]);
  const self = await p.evaluate(() => AD.roles[2][0]);
  const n1 = asks.length;
  if (await p.evaluate(() => AD.phase === 'act' && AD.min >= 1)) {
    await p.click(`#dreamHand [data-q="${self}"]`);
    await p.waitForTimeout(150);
    await p.click(`#dreamGame [data-aim="${self}"]`);
    await p.waitForTimeout(900);
    console.log('同座位深挖:', self, '| 新增调用:', asks.length - n1, '(应为 0)',
                '| 那一格:', await p.evaluate(k => (AD.slots[k] || []).length + (adHard(k) ? '硬' : '软'), selfDim));
  }

  // 取证：切 Excel 点一行 → 亮证据直接算硬
  if (await p.locator('#dreamHand [data-q="getevi"]').count()) {
    await p.click('#dreamHand [data-q="getevi"]');
    await p.waitForTimeout(200);
    await p.evaluate(() => goFeature('salary'));
    await p.waitForTimeout(700);
    await p.click('#salTab tr:nth-child(4) td:nth-child(2)');
    await p.waitForTimeout(300);
    console.log('evidence:', JSON.stringify(await p.evaluate(() => AD.evi)));
    await p.evaluate(() => goFeature('teams'));
    await p.waitForTimeout(500);
    await shot(p, '05-evidence');
  }

  // 军师私聊 + 红点
  console.log('chat msgs from advisor:', await p.locator('#imStream .imsg .who:has-text("军师")').count(),
              'red dot:', await p.locator('#imList .cv .rd').count());

  // 跑完剩下的轮次：能买就买跨座位
  for (let i = 0; i < 40 && await p.evaluate(() => AD.st !== 'done' && AD.phase !== 'sign'); i++) {
    const ph = await p.evaluate(() => AD.phase);
    if (ph !== 'act') { await p.waitForTimeout(800); continue; }
    const mv = await p.evaluate(() => {
      if (AD.min < 2) return null;
      const miss = DIMS.filter(d => !adHard(d.k));
      if (!miss.length) return null;
      const tg = adNameOf(miss[0].k);
      const by = (AD.roles.find(r => r[0] !== tg) || [])[0];
      return by && tg ? { by, tg } : null;
    });
    if (mv) {
      await p.click(`#dreamHand [data-q="${mv.by}"]`);
      await p.waitForTimeout(150);
      await p.click(`#dreamGame [data-aim="${mv.tg}"]`);
      await p.waitForTimeout(2500);
    } else {
      await p.click('#dreamHand [data-q="pass"]');
      await p.waitForTimeout(1200);
    }
  }

  // 签字
  await p.waitForFunction(() => AD.phase === 'sign', null, { timeout: 40000 });
  await p.waitForTimeout(400);
  console.log('sign screen · hard cells:', await p.evaluate(() => adHardN()));
  await shot(p, '05b-sign');
  await p.click('#dreamGame [data-sign="不做"]');
  await p.waitForFunction(() => AD.st === 'done', null, { timeout: 20000 });
  await p.waitForTimeout(600);
  console.log('RESULT', JSON.stringify(await p.evaluate(() => AD.res)));
  console.log('lib top:', await p.evaluate(() => S.lib.slice(0, 3).map(x => x.text)));
  console.log('卷宗 bubble in square:', await p.evaluate(() =>
    S.bubbles.filter(b => /卷宗/.test(b.text)).length));
  console.log('records:', JSON.stringify(await p.evaluate(() => AREC)));
  await shot(p, '06-decision');
  H.done = await geoOf();
  console.log('done 舞台:', JSON.stringify(H.done));

  // 卷宗架
  await p.click('[data-ad="files"]');
  await p.waitForTimeout(400);
  console.log('卷宗架 entries:', await p.locator('.adfiles .fi').count());
  H.files = await geoOf();
  console.log('files 舞台:', JSON.stringify(H.files));
  await shot(p, '06b-files');
  await p.click('[data-ad="reset"]');
  await p.waitForTimeout(300);
  await p.evaluate(() => { AD.st = 'done'; aiDreamRender(); });
  await p.waitForTimeout(300);

  // 完整决定书进 Outlook
  await p.click('[data-ad="bill"]');
  await p.waitForTimeout(800);
  const mail = await p.evaluate(() => MAILS.draft[0] || {});
  console.log('draft subject:', mail.sj);
  console.log('决定书含四维:', ['只算钱', '只算人', '只算时机', '只算最坏'].filter(k => (mail.body || '').includes(k)).length, '/4');
  console.log('未买的格标注:', /这一格你没买/.test(mail.body || '') ? '有' : '（四格都买齐了，无此行）');
  await shot(p, '07-bill');

  // 剧本局回归
  await p.evaluate(() => goFeature('teams'));
  await p.waitForTimeout(300);
  await p.click('#dreamGame [data-dmode="script"]');
  await p.waitForTimeout(400);
  await p.click('#dreamGame [data-dream-start]');
  await p.waitForTimeout(4500);
  console.log('script mode shown:', await p.evaluate(() => dreamShown), 'betAsked:', await p.evaluate(() => dreamBetAsked));
  await shot(p, '08-script');

  console.log('\n=== /api/ask 视野隔离 ===');
  console.log('total calls:', asks.length, '(一局应 4~8 次)');
  const sys = asks.map(a => a.system || '');
  console.log('distinct systems:', new Set(sys).size, '/', sys.length);
  const DIMWORDS = ['数字、补偿、成本、系数', '关系、印象、谁记着谁', '时间窗口、先后顺序', '兜底、现金流、退路'];
  console.log('每个 system 只含一维:',
    sys.every(s => DIMWORDS.filter(w => s.includes(w)).length === 1) ? 'YES' : 'NO');
  console.log('维度分布:', DIMWORDS.map((w, i) => ['钱', '人', '时机', '最坏'][i] + '×' + sys.filter(s => s.includes(w)).length).join(' '));

  console.log('\n=== 会议窗自检（舞台不许内滚 · 手牌不许被托盘切掉）===');
  Object.entries(H).forEach(([k, g]) => console.log(' ', k,
    g && ('溢出 ' + g.over + 'px · 手牌 ' + (g.handOK ? 'OK' : 'CLIPPED')),
    g && g.over <= 2 && g.handOK ? 'OK' : 'FAIL'));

  console.log('\n=== ERRORS (' + errs.length + ') ===');
  errs.slice(0, 20).forEach(e => console.log(' ', e));
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
