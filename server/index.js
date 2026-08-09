/* ============================================================
   变大泡泡 · 服务端入口
   阶段 0：只做静态托管。WS / AI 在阶段 2、3 挂进来。
   单进程、零构建。node server/index.js 直接起。
   ============================================================ */
'use strict';

const path = require('path');
const fs = require('fs');

// 零依赖 .env 加载：key 只进环境变量，不进代码
try {
  fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).forEach(l => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  });
} catch (e) { /* 没有 .env 就走降级 */ }

const express = require('express');
const ai = require('./ai');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();

app.use(express.json({ limit: '64kb' }));

// 静态资源：app.html 是唯一的前端文件
app.use(express.static(PUBLIC_DIR, {
  index: 'app.html',
  extensions: ['html'],
  setHeaders(res, filePath) {
    // 开发期不缓存，改完刷新就生效
    if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// 健康检查：部署后用它确认服务活着
app.get('/api/health', (req, res) => {
  res.json({ ok: true, stage: 2, ai: ai.hasKey() ? 'ready' : 'no-key', uptime: Math.round(process.uptime()) });
});

// AI 问答：无 key / 超额 / 超时 一律返回 mode:script，前端自己降级并如实标注
app.post('/api/ask', async (req, res) => {
  const { system, q } = req.body || {};
  if (!ai.hasKey()) return res.json({ ok: false, mode: 'script', why: '未配置模型 key' });
  const blocked = ai.gate(req.ip || 'x');
  if (blocked) return res.json({ ok: false, mode: 'script', why: blocked });
  try {
    const text = await ai.ask(String(system || '').slice(0, 2000), String(q || '').slice(0, 500));
    if (!text.trim()) throw new Error('empty');
    res.json({ ok: true, mode: 'model', model: ai.MODEL, text: text.slice(0, 1200) });
  } catch (e) {
    res.json({ ok: false, mode: 'script', why: '模型超时或出错' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`[变大泡泡] http://localhost:${PORT}`);
  console.log(`[变大泡泡] 静态目录 ${PUBLIC_DIR}`);
});

// 阶段 3 会在这里挂 WebSocket：
//   const { attachWater } = require('./water');
//   attachWater(server);

process.on('SIGINT', () => {
  console.log('\n[变大泡泡] 收到 SIGINT，关闭中');
  server.close(() => process.exit(0));
});

module.exports = { app, server };
