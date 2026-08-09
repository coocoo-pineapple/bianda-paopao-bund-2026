/* ============================================================
   变大泡泡 · AI 网关（Cloudflare Workers 版）
   规则不变：key 只在服务端 secret；无 key / 超时 / 超额 一律降级，
   前端拿到 mode:script 后如实标注「脚本模拟」，不冒充真实调用。
   与 server/ai.js 的差别：配置从 env 读（Workers 没有 process.env），
   熔断计数搬进 Durable Object（见 ai-gate.js）。
   ============================================================ */

const TIMEOUT_MS = 15000;
const MAX_TOKENS = 400;
const TEMPERATURE = 0.7;
const ANTHROPIC_VERSION = '2023-06-01';

const DEFAULT_STYLE = 'anthropic';
const DEFAULT_BASE = 'https://api.anthropic.com';
const DEFAULT_MODEL = 'claude-sonnet-5';

export const hasKey = (env) => !!env.AI_API_KEY;

export const model = (env) => env.AI_MODEL || DEFAULT_MODEL;

const style = (env) => (env.AI_STYLE || DEFAULT_STYLE).toLowerCase();
const base = (env) => (env.AI_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');

/**
 * 调模型。超时或上游非 2xx 都抛错，交给调用方降级。
 * @param {{ AI_API_KEY?: string, AI_STYLE?: string, AI_BASE_URL?: string, AI_MODEL?: string }} env
 * @param {string} system
 * @param {string} user
 * @returns {Promise<string>}
 */
export async function ask(env, system, user) {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  return style(env) === 'openai'
    ? askOpenAi(env, system, user, signal)
    : askAnthropic(env, system, user, signal);
}

async function askOpenAi(env, system, user, signal) {
  const json = await post(base(env) + '/v1/chat/completions', {
    'content-type': 'application/json',
    authorization: 'Bearer ' + env.AI_API_KEY
  }, {
    model: model(env),
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
  }, signal);
  return ((json.choices || [])[0] || {}).message?.content || '';
}

async function askAnthropic(env, system, user, signal) {
  const json = await post(base(env) + '/v1/messages', {
    'content-type': 'application/json',
    'x-api-key': env.AI_API_KEY,
    'anthropic-version': ANTHROPIC_VERSION
  }, {
    model: model(env),
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: user }]
  }, signal);
  return (json.content || []).map((c) => c.text || '').join('');
}

async function post(url, headers, body, signal) {
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
  if (!res.ok) throw new Error('upstream ' + res.status);
  return res.json();
}
