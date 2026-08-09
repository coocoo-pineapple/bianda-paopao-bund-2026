/* ============================================================
   变大泡泡 · Cloudflare Worker 入口
   静态资源交给 Workers Static Assets（public/ 直接上传到边缘），
   Worker 只管两件事：/api/health 和 /api/ask。
   行为与 server/index.js 对齐：无 key / 超额 / 超时 一律 mode:script，
   前端自己降级并如实标注，不把脚本模拟冒充真实调用。
   ============================================================ */
import { ask, hasKey, model } from './ai.js';
import { GATE_SINGLETON } from './ai-gate.js';
import { serveMedia } from './media.js';

export { AiGate } from './ai-gate.js';

const ENTRY_HTML = '/app.html';        // public/ 里没有 index.html，入口是 app.html
const MEDIA_PREFIX = '/media/';        // 超过 25 MiB 的大文件，走 R2 不走静态资源
const MAX_BODY = 64 * 1024;            // 对齐 express.json({ limit: '64kb' })
const MAX_SYSTEM = 2000;
const MAX_QUESTION = 500;
const MAX_ANSWER = 1200;

const DEFAULT_DAILY = 300;
const DEFAULT_HOURLY = 20;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') return health(request, env);
    if (url.pathname === '/api/ask') return handleAsk(request, env);

    if (url.pathname.startsWith(MEDIA_PREFIX)) {
      const fromR2 = await serveMedia(request, env);
      if (fromR2) return fromR2;       // R2 没有就往下走，静态资源里还有就还能顶上
    }

    if (url.pathname === '/') {
      return env.ASSETS.fetch(new URL(ENTRY_HTML, url));
    }
    return env.ASSETS.fetch(request);
  }
};

/** 部署后用它确认服务活着，顺带看今天烧了多少额度 */
async function health(request, env) {
  return json({
    ok: true,
    stage: 2,
    ai: hasKey(env) ? 'ready' : 'no-key',
    model: hasKey(env) ? model(env) : null,
    colo: request.cf?.colo ?? null,
    quota: { ...(await gate(env).stats()), dailyLimit: limit(env.AI_DAILY_LIMIT, DEFAULT_DAILY) }
  });
}

async function handleAsk(request, env) {
  if (request.method !== 'POST') return json({ ok: false, mode: 'script', why: '方法不支持' }, 405);
  if (!hasKey(env)) return json({ ok: false, mode: 'script', why: '未配置模型 key' });

  const body = await readJson(request);
  if (!body) return json({ ok: false, mode: 'script', why: '请求体过大或不是 JSON' });

  const blocked = await gate(env).check(
    clientIp(request),
    limit(env.AI_DAILY_LIMIT, DEFAULT_DAILY),
    limit(env.AI_PER_HOUR, DEFAULT_HOURLY)
  );
  if (blocked) return json({ ok: false, mode: 'script', why: blocked });

  try {
    const text = await ask(
      env,
      String(body.system || '').slice(0, MAX_SYSTEM),
      String(body.q || '').slice(0, MAX_QUESTION)
    );
    if (!text.trim()) throw new Error('empty');
    return json({ ok: true, mode: 'model', model: model(env), text: text.slice(0, MAX_ANSWER) });
  } catch {
    return json({ ok: false, mode: 'script', why: '模型超时或出错' });
  }
}

/** 熔断器是单例：所有边缘节点都路由到同一个 DO 实例，计数才是一份 */
const gate = (env) => env.AI_GATE.get(env.AI_GATE.idFromName(GATE_SINGLETON));

const clientIp = (request) => request.headers.get('cf-connecting-ip') || 'unknown';

const limit = (raw, fallback) => {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/**
 * 先看 content-length 再读体，避免把超大 body 读进内存。
 * 解析失败或超限返回 null，调用方统一降级。
 */
async function readJson(request) {
  const len = Number(request.headers.get('content-length'));
  if (!Number.isFinite(len) || len <= 0 || len > MAX_BODY) return null;
  try {
    const parsed = JSON.parse(await request.text());
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
