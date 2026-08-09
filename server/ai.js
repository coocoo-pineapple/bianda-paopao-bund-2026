/* ============================================================
   变大泡泡 · AI 网关
   规则：key 只在服务端；无 key / 超时 / 超额 一律降级，前端标注「脚本模拟」。
   熔断：每日总量 AI_DAILY_LIMIT，单 IP 每小时 AI_PER_HOUR。
   ============================================================ */
'use strict';

const KEY = process.env.AI_API_KEY || '';
const STYLE = (process.env.AI_STYLE || 'anthropic').toLowerCase();
const BASE = (process.env.AI_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
const MODEL = process.env.AI_MODEL || 'claude-sonnet-5';
const DAILY = +(process.env.AI_DAILY_LIMIT || 300);
const HOURLY = +(process.env.AI_PER_HOUR || 20);

let dayKey = '', dayCount = 0;
const buckets = new Map();   // ip -> { n, t }

// 返回 null = 放行；返回字符串 = 拒绝原因（前端拿它降级）
function gate(ip) {
  const today = new Date().toISOString().slice(0, 10);
  if (dayKey !== today) { dayKey = today; dayCount = 0; buckets.clear(); }
  if (dayCount >= DAILY) return '今日 AI 额度已熔断';
  const b = buckets.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - b.t > 3600e3) { b.n = 0; b.t = Date.now(); }
  if (b.n >= HOURLY) return '这个马甲这小时问得太勤了';
  b.n++; buckets.set(ip, b);
  dayCount++;
  return null;
}

async function ask(system, user) {
  const ac = AbortSignal.timeout(15000);
  if (STYLE === 'openai') {
    const res = await fetch(BASE + '/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + KEY },
      body: JSON.stringify({
        model: MODEL, max_tokens: 400, temperature: 0.7,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
      }),
      signal: ac
    });
    if (!res.ok) throw new Error('upstream ' + res.status);
    const j = await res.json();
    return ((j.choices || [])[0] || {}).message?.content || '';
  }
  // anthropic 风格
  const res = await fetch(BASE + '/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 400, system,
      messages: [{ role: 'user', content: user }]
    }),
    signal: ac
  });
  if (!res.ok) throw new Error('upstream ' + res.status);
  const j = await res.json();
  return (j.content || []).map(c => c.text || '').join('');
}

module.exports = { hasKey: () => !!KEY, gate, ask, MODEL };
