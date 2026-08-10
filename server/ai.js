/* ============================================================
   变大泡泡 · AI 网关
   规则：key 只在服务端；无 key / 超时 / 超额 一律降级，前端标注「脚本模拟」。
   熔断：每日总量 AI_DAILY_LIMIT，单 IP 每小时 AI_PER_HOUR。
   ============================================================ */
'use strict';

const KEY = process.env.AI_API_KEY || '';
const STYLE = (process.env.AI_STYLE || 'openai').toLowerCase();
const BASE = (process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode').replace(/\/$/, '');
const MODEL = process.env.AI_MODEL || 'qwen3.8-max';
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

function tokenCount(value) {
  return Number.isFinite(value) ? value : null;
}

function normalizeUsage(raw, style) {
  const inputTokens = tokenCount(style === 'openai'
    ? raw.prompt_tokens ?? raw.input_tokens
    : raw.input_tokens ?? raw.prompt_tokens);
  const outputTokens = tokenCount(style === 'openai'
    ? raw.completion_tokens ?? raw.output_tokens
    : raw.output_tokens ?? raw.completion_tokens);
  const totalTokens = tokenCount(raw.total_tokens) ??
    (inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null);
  return { inputTokens, outputTokens, totalTokens };
}

async function askWithUsage(system, user) {
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
    return {
      text: ((j.choices || [])[0] || {}).message?.content || '',
      usage: normalizeUsage(j.usage || {}, 'openai')
    };
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
  return {
    text: (j.content || []).map(c => c.text || '').join(''),
    usage: normalizeUsage(j.usage || {}, 'anthropic')
  };
}

async function ask(system, user) {
  return (await askWithUsage(system, user)).text;
}

module.exports = {
  hasKey: () => !!KEY,
  isQwen: () => /^qwen/i.test(MODEL),
  gate,
  ask,
  askWithUsage,
  MODEL
};
