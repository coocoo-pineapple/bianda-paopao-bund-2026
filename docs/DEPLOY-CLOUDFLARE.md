# 变大泡泡 · 部署到 Cloudflare Workers

和 `DEPLOY.md`（香港轻量 + PM2 + Caddy）是两条并行的路，代码同一份：

| | 轻量服务器 | Cloudflare Workers |
|---|---|---|
| 跑什么 | `server/index.js`（Express） | `src/index.js`（Worker） |
| 静态资源 | `express.static(public/)` | Workers Static Assets（`public/` 上传到边缘） |
| 宣传片（39.7 MB） | 直接从磁盘读 | R2（超过单文件 25 MiB 上限，见 `src/media.js`） |
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

### 建 R2 桶并把宣传片传上去

宣传片 39.7 MB，超过 Workers Static Assets **单文件 25 MiB** 上限，传不进静态资源，
必须放 R2。`public/.assetsignore` 已经把 `media/` 排除，Worker 从 R2 读它。

> R2 要先在 Dashboard 里开通（Cloudflare 会要求账号绑定支付方式，免费额度内不扣费：
> 10 GB 存储、每月 100 万次 Class A、1000 万次 Class B，**流量出站不要钱**）。

```bash
npx wrangler r2 bucket create bianda-paopao-media
npm run cf:media            # 等价于下面这条，省得漏参数
# npx wrangler r2 object put "bianda-paopao-media/media/宣传片.mp4" \
#   --file "public/media/宣传片.mp4" --content-type video/mp4 --remote
```

`--content-type` 别漏，漏了浏览器认不出类型就不给播（代码里有按扩展名兜底，但别指望它）。

桶名要和 `wrangler.jsonc` 里 `r2_buckets` 的 `bucket_name` 一致；想换名字两处一起改。

> **中文文件名的坑**：`wrangler r2 object put` 存进去的 key 是百分号编码的
> `media/%E5%AE%A3%E4%BC%A0%E7%89%87.mp4`，而 `wrangler r2 object get` 查的是原样 UTF-8，
> 用 CLI 自己取会报 "The specified key does not exist"——是 CLI 两头不一致，不是没传上去。
> `src/media.js` 两种形态都试，所以不管你用 CLI、Dashboard 还是 rclone 传，都能读到。

本地调试时把 `--remote` 换成 `--local`，对象会落在 `.wrangler/state` 里。

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

自检三条：

```bash
H=https://bianda-paopao.<你的子域>.workers.dev

curl $H/api/health
# {"ok":true,"stage":2,"ai":"ready","model":"qwen3.8-max","colo":"...","quota":{...}}

# 宣传片能整段拿到（期望 200 / video/mp4 / 39750953）
curl -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' "$H/media/宣传片.mp4"

# 拖进度条能拿到片段（期望 206 + Content-Range）
curl -o /dev/null -D - -H 'Range: bytes=0-1023' "$H/media/宣传片.mp4" | grep -i '206\|content-range'
```

`ai` 必须是 `ready`；如果是 `no-key`，说明 secret 没设上，前端会一路走脚本降级。
视频那两条如果 404，多半是 R2 对象没传或桶名对不上，不是 Worker 的问题。

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

**宣传片走 R2，原片一帧没动。**
Workers Static Assets 单文件上限 25 MiB，39.7 MB 的原片进不去，所以 `public/.assetsignore`
把 `media/` 整个排除，改由 `src/media.js` 从 R2 读。

URL 还是 `/media/宣传片.mp4`，**前端 `os.js` 一个字都没改**——这是选「Worker 读 R2」而不是
「公开桶 + 外链」的原因：不用改前端、不用管 CORS、桶可以保持私有，也不用 `r2.dev` 那个有限流的域名。

`media/` 排除的只是「上传到边缘」这件事，文件本身还留在仓库里，
`server/index.js` 那条 Express 路线照旧从磁盘 `public/media/` 读它，两条路线都能放片。

拖进度条要 `206 Partial Content`，所以 Range 和条件请求都是自己接的：
`Range: bytes=0-1023` / `bytes=39750000-` / `bytes=-500` 三种形态、`If-None-Match` 的 304、
`HEAD` 都验过，切出来的字节和原文件逐字节一致。

## 免费额度够不够

| | 免费额度 | 这个项目 |
|---|---|---|
| Worker 请求 | 10 万次/天 | `/api/*` 和 `/media/*` 算，其余静态资源不算 |
| DO 请求 | 10 万次/天 | 每次 `/api/ask` 一次 |
| DO 写入 | 10 万行/天 | 每次 `/api/ask` 几行 |
| R2 存储 | 10 GB | 宣传片 39.7 MB |
| R2 Class B（读） | 1000 万次/月 | 每次拖进度条几十次 |
| R2 出站流量 | 不计费 | —— |

比赛期间的量远够。真正的成本闸门是 `AI_DAILY_LIMIT`，那是模型钱，不是 Cloudflare 钱。

## 已知待办

- **CSP 没配**。`app.html` 大量内联 `<script>` 和内联样式，直接上 CSP 会把页面打死；
  要配得先给内联脚本上 nonce（可以在 Worker 里用 `HTMLRewriter` 注入）。这次没动，避免临场把 demo 弄挂。
- **`public/assets/icons/*.png` 偏大**（单个 0.6–2 MB，共 7.2 MB），压一遍能明显改善首屏。这次没动，不属于部署范围。
- **视频没走边缘缓存**。Worker 返回的响应不会自动进边缘 cache，每次播放都实打实读 R2。
  免费额度扛得住，真火了再在 `src/media.js` 前面加一层 Cache API。
- **嫌 39.7 MB 太沉**可以换回压过的版本，画质肉眼无差（SSIM 0.987 / PSNR 43.9 dB）：
  ```bash
  ffmpeg -i "public/media/宣传片.mp4" -c:v libx264 -preset slow -crf 24 \
    -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart /tmp/promo.mp4   # 22.2 MB
  npx wrangler r2 object put "bianda-paopao-media/media/宣传片.mp4" \
    --file /tmp/promo.mp4 --content-type video/mp4 --remote
  ```
  压到 25 MiB 以下后也可以删掉 `public/.assetsignore` 改回静态资源，但没必要——R2 这条路更省事。
