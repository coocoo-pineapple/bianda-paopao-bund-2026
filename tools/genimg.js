/* ============================================================
   变大泡泡 · 定帧图批量生成脚本
   用法：node tools/genimg.js          全部 11 帧
         node tools/genimg.js A1 B2   只生指定帧
   服务：Pollinations（免 key，Flux）。如有 OpenAI 生图 key，
         设环境变量 IMG_KEY + IMG_BASE 自动切到 /v1/images/generations。
   产出：docs/shots/<帧号>.jpg
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const STYLE = 'Layered paper-cut diorama, handcrafted cardboard papercraft scene, torn deep navy blue paper waves with visible ripped edges, kraft cardboard gears and mechanical contraptions, dark paper silhouette figures in office clothes, orange ribbon paths with wooden beads, miniature stage with dramatic warm spotlight, rich tactile paper texture, cinematic depth, empty blank plaque signs reserved for text, 16:9, no letters, no watermark. ';

const SHOTS = {
  A1: 'an office worker sitting back-to-back with their own robot double, both wearing ties, a queue of tiny paper envelopes floating toward them, each envelope glowing faintly like a coin, the robot catches small envelopes, the human catches one large envelope, accent color gold',
  A2: 'a giant hand placing a tiny glowing spreadsheet formula onto a market stall shelf, other stalls sell a slide deck and a resume, small figures queuing with coins, street market composition but everything made of office paper, accent color vermilion red',
  A3: 'an alchemy distillation flask: a sleeping office worker silhouette drips golden droplets through glass tubes into a small robot figure below, the robot answering a phone, coins flowing back up the tube toward the sleeper, accent color amber',
  A4: 'a funnel made of four descending water basins, crowds of tiny figures swimming downward, each basin smaller and fewer figures, the last basin holds fourteen figures each holding a coin, side-view infographic composition, accent color violet',
  B1: 'over-the-shoulder view of a boss walking past an employee desk, the monitor shows glassy soap bubbles floating over a spreadsheet, the boss sees nothing wrong, the bubbles secretly contain tiny speech marks inside, accent color glass iridescent blue',
  B2: 'four butterflies sitting around a mahjong-style square table, each butterfly casting a human office-worker shadow on the table, one shadow is a wolf, dramatic top-down lighting like a poker game, accent color burnt orange',
  B3: 'a tiny robot farmer harvesting glowing cabbages in a grid field shaped like spreadsheet cells, each cabbage has a tag stamp green check yellow question gray cross, one untagged cabbage rotting red in a basket, accent color leaf green with one poison red',
  C1: 'three office workers from three different company buildings each placing a signed paper card into the same glass table, the table surface is a glowing spreadsheet grid, city skyline of distinct buildings behind them, accent color teal',
  C2: 'a small robot fishing bubbles out of a sea with a net, handing them to an editor at a tiny newspaper desk who stamps some and discards others, newspaper front page floating up like a kite, accent color navy',
  D0: 'one office worker at a desk in a vast empty open-plan office, giant wall clock above, a phone locked inside a glass bell jar on the desk, monitor glowing as the only exit, lonely cinematic wide shot, accent color cold gray-blue with warm monitor glow',
  D9: 'an office worker asleep on a desk, a butterfly rising from their head carrying a tiny briefcase, below the desk is water with glass soap bubbles floating up, the worker reflection in the water is a fish wearing a tie, dreamlike, accent color soft gold on ink blue'
};

const OUT = path.join(__dirname, '..', 'docs', 'shots');
fs.mkdirSync(OUT, { recursive: true });

async function viaPollinations(id, prompt) {
  const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) +
    '?width=1280&height=720&nologo=true&model=flux&seed=' + (id.charCodeAt(0) * 100 + +id.slice(1));
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20000) throw new Error('图太小疑似失败 ' + buf.length + 'B');
  fs.writeFileSync(path.join(OUT, id + '.jpg'), buf);
  return buf.length;
}

async function viaOpenAI(id, prompt) {
  const res = await fetch((process.env.IMG_BASE || 'https://api.openai.com') + '/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.IMG_KEY },
    body: JSON.stringify({ model: process.env.IMG_MODEL || 'dall-e-3', prompt, size: '1792x1024', response_format: 'b64_json' }),
    signal: AbortSignal.timeout(180000)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 120));
  const j = await res.json();
  const buf = Buffer.from(j.data[0].b64_json, 'base64');
  fs.writeFileSync(path.join(OUT, id + '.jpg'), buf);
  return buf.length;
}

(async () => {
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
  const useKey = !!process.env.IMG_KEY;
  console.log('引擎:', useKey ? 'OpenAI 兼容 (' + (process.env.IMG_MODEL || 'dall-e-3') + ')' : 'Pollinations flux（免 key）');
  for (const id of want) {
    if (!SHOTS[id]) { console.log(id, '未知帧号，跳过'); continue; }
    const prompt = STYLE + SHOTS[id];
    process.stdout.write(id + ' 生成中… ');
    try {
      const n = await (useKey ? viaOpenAI(id, prompt) : viaPollinations(id, prompt));
      console.log('OK', Math.round(n / 1024) + 'KB → docs/shots/' + id + '.jpg');
    } catch (e) {
      console.log('失败:', e.message);
    }
  }
})();
