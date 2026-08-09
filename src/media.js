/* ============================================================
   变大泡泡 · 大文件走 R2
   宣传片 39.7 MB，超过 Workers Static Assets 单文件 25 MiB 上限，
   进不了静态资源（public/.assetsignore 已把 media/ 排除）。
   改由 Worker 从 R2 读回来，URL 仍然是 /media/宣传片.mp4，
   前端 os.js 里的 v.src 一个字都不用改。

   拖进度条要 206，所以 Range 和条件请求都得自己接，不能整段吐回去。
   ============================================================ */

const PREFIX = 'media/';
const CACHE_CONTROL = 'public, max-age=604800';

/** R2 里没存 content-type 时的兜底，浏览器认不出类型就不给播 */
const FALLBACK_TYPES = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4'
};

/**
 * 返回 Response = 由 R2 接管；返回 null = 这儿伺候不了，
 * 调用方回退到静态资源（比如没绑 R2、或对象还没上传）。
 * @returns {Promise<Response | null>}
 */
export async function serveMedia(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  }

  if (!env.MEDIA) return null;

  const hit = await lookup(request, env, mediaKeys(request.url));
  if (!hit) return null;
  const { object, key } = hit;

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.get('content-type')) headers.set('content-type', guessType(key));
  headers.set('etag', object.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', CACHE_CONTROL);

  if (request.method === 'HEAD') {
    headers.set('content-length', String(object.size));
    return new Response(null, { headers });
  }

  // onlyIf 没通过：浏览器手上那份还新鲜
  if (!('body' in object)) return new Response(null, { status: 304, headers });

  const span = servedSpan(object, request);
  if (!span) {
    headers.set('content-length', String(object.size));
    return new Response(object.body, { headers });
  }

  headers.set('content-range', `bytes ${span.start}-${span.end}/${object.size}`);
  headers.set('content-length', String(span.end - span.start + 1));
  return new Response(object.body, { status: 206, headers });
}

/**
 * 按顺序试 key，命中即止。命中的 key 要一起带回去 —— R2 里没存
 * content-type 时得靠它的扩展名兜底。
 * @returns {Promise<{ object: R2Object, key: string } | null>}
 */
async function lookup(request, env, keys) {
  for (const key of keys) {
    const object = request.method === 'HEAD'
      ? await env.MEDIA.head(key)
      : await env.MEDIA.get(key, { onlyIf: request.headers, range: request.headers });
    if (object) return { object, key };
  }
  return null;
}

/**
 * 中文文件名在 R2 里到底存成什么样，取决于谁传的：
 * `wrangler r2 object put` 存的是 media/%E5%AE%A3...（浏览器请求也是这个形态），
 * 而 dashboard、rclone 之类存的是原样 UTF-8。两种都试一遍，省得为编码问题排查半天。
 * @returns {string[]} 候选 key，已去重；路径不合法时为空
 */
function mediaKeys(rawUrl) {
  const raw = new URL(rawUrl).pathname.replace(/^\/+/, '');
  let canonical = raw;
  try {
    canonical = decodeURIComponent(raw);
  } catch {
    /* 坏的百分号编码，就按原样当 key 用 */
  }
  if (!canonical.startsWith(PREFIX) || canonical.includes('..')) return [];
  return [...new Set([encodeURI(canonical), canonical])];
}

/**
 * 整段返回时给 null；只有真的切了片才需要 206。
 * 注意别用 `'suffix' in range` 判分支：R2Range 三个字段都在，只是值可能是
 * undefined，`in` 一律为真，会把 offset/length 的情形错认成 suffix，
 * 算出 `bytes NaN-...` 的 Content-Range，浏览器就拖不动进度条了。
 */
function servedSpan(object, request) {
  if (!request.headers.has('range') || !object.range) return null;
  const { offset, length, suffix } = object.range;
  if (suffix !== undefined) {
    return { start: object.size - suffix, end: object.size - 1 };
  }
  const start = offset ?? 0;
  return { start, end: start + (length ?? object.size - start) - 1 };
}

const guessType = (key) =>
  FALLBACK_TYPES[key.split('.').pop().toLowerCase()] || 'application/octet-stream';
