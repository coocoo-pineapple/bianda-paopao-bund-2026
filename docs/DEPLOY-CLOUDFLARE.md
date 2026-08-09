# 变大泡泡 · 部署到 Cloudflare Workers

和 `DEPLOY.md`（香港轻量 + PM2 + Caddy）是两条并行的路，代码同一份：

| | 轻量服务器 | Cloudflare Workers |
|---|---|---|
| 跑什么 | `server/index.js`（Express） | `src/index.js`（Worker） |
| 静态资源 | `express.static(public/)` | Workers Static Assets（`public/` 上传到边缘） |
| 熔断计数 | 进程内 Map | Durable Object（`src/ai-gate.js`） |
| 费用 | 按月付服务器 | 免费额度内 0 元 |
| 大陆访问 | 直连香港，快 | 走 Cloudflare 边缘，可能不稳 |

> **选哪条**：评委在大陆现场访问，`DEPLOY.md` 的香港直连更稳；要一个随时能开、不花钱、不用运维的公开链接，用这条。

---

## 一次性准备

```bash
npm install
npx wrangler login          # 浏览器里授权，需要交互式终端
```

## 配 Key

非机密配置已经写在 `wrangler.jsonc` 的 `vars` 里（`AI_STYLE` / `AI_BASE_URL` / `AI_MODEL` / 限额），
改这些直接改文件重新部署即可。**Key 是 secret，不进仓库**：

```bash
npx wrangler secret put AI_API_KEY     # 粘贴百炼 Key，回车
```

本地调试用 `.dev.vars`（已在 `.gitignore`）：

```bash
cp .dev.vars.example .dev.vars         # 填入 AI_API_KEY
npm run cf:dev                         # http://127.0.0.1:8787
```

## 部署

```bash
npm run cf:deploy
```

输出里会给一个 `https://bianda-paopao.<你的子域>.workers.dev`，打开就是产品。

自检：

```bash
curl https://bianda-paopao.<你的子域>.workers.dev/api/health
# {"ok":true,"stage":2,"ai":"ready","model":"qwen3.8-max","colo":"...","quota":{...}}
```

`ai` 必须是 `ready`；如果是 `no-key`，说明 secret 没设上，前端会一路走脚本降级。

看实时日志：`npm run cf:tail`

## 绑自己的域名

Workers → `bianda-paopao` → Settings → Domains & Routes → Add Custom Domain。
域名的 NS 要先托管在 Cloudflare（`DEPLOY.md` 里那一步已经讲过），证书 Cloudflare 自动签。

---

## 架构上有意为之的几处

**熔断计数为什么要用 Durable Object。**
`server/ai.js` 用进程内 `Map` 计数，因为只有一个 Node 进程。Worker 不是——它在全球多个边缘节点上各跑各的 isolate，
进程内计数各数各的，`AI_DAILY_LIMIT=300` 会变成「每个节点每天 300」，公开链接照样能烧钱。
所以计数搬进 `src/ai-gate.js` 的单例 DO：所有节点都路由到同一个实例串行结算，日额度和 IP 小时额度才是准的。
存储用 SQLite 后端，这也是 Workers 免费版唯一可用的 DO 存储。

**降级语义一个字没改。**
无 key / 超额 / 上游超时或报错，一律 `{ ok:false, mode:'script', why:... }`，前端照旧如实标注「脚本模拟」。
`/api/ask` 的上游请求体和 `server/ai.js` 逐字段一致，百炼那边看到的调用没有区别。

**入口是 `app.html` 不是 `index.html`。**
`public/` 里没有 `index.html`，所以 `/` 不会命中静态资源，落到 Worker，由它取 `/app.html` 回给浏览器。
其余路径先匹配静态资源，命中就不进 Worker，也就不算 Worker 调用次数。

**宣传片被重新压过。**
Workers Static Assets 单文件上限 25 MiB，原片 39.7 MB 传不上去。
`public/media/宣传片.mp4` 现在是 CRF 24 重压的 22.2 MB 版本（SSIM 0.987 / PSNR 43.9 dB，肉眼看不出差别）。
**原片没丢**，还在 `dist/media/宣传片.mp4` 和 `docs/变大泡泡-45s-终版.mp4`。
想上原片就得把视频放 R2 或 Cloudflare Stream，用外链引，`public/` 里不再放它。

## 免费额度够不够

| | 免费额度 | 这个项目 |
|---|---|---|
| Worker 请求 | 10 万次/天 | 只有 `/api/*` 算，静态资源不算 |
| DO 请求 | 10 万次/天 | 每次 `/api/ask` 一次 |
| DO 写入 | 10 万行/天 | 每次 `/api/ask` 几行 |

比赛期间的量远够。真正的成本闸门是 `AI_DAILY_LIMIT`，那是模型钱，不是 Cloudflare 钱。

## 已知待办

- **CSP 没配**。`app.html` 大量内联 `<script>` 和内联样式，直接上 CSP 会把页面打死；
  要配得先给内联脚本上 nonce（可以在 Worker 里用 `HTMLRewriter` 注入）。这次没动，避免临场把 demo 弄挂。
- **`public/assets/icons/*.png` 偏大**（单个 0.6–2 MB，共 7.2 MB），压一遍能明显改善首屏。这次没动，不属于部署范围。
- **Range 请求**（视频拖进度条）本地 `wrangler dev` 返回 200 不是 206，线上行为要部署后实测。
