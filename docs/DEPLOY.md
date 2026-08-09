# 变大泡泡 · 服务器购买与部署教程

> 落点：**香港轻量应用服务器**（免备案，可绑域名上 HTTPS）
> 总耗时约 1 小时，其中等待占一半。**今晚就办，别拖到 08-08。**

---

## 顺序很重要：先买域名

域名解析生效有延迟，而且**大陆注册商买域名要实名认证，审核几小时到一个工作日** —— 这是整条链路上唯一可能卡到你的一步。所以先办它。

### 方案 A（推荐）：国外注册商，免实名，即买即用

| 注册商 | 特点 |
|---|---|
| **Namecheap** | 支持支付宝，`.com` 约 $10-15/年，注册完立即可解析 |
| **Cloudflare Registrar** | 按成本价卖，但要先注册 Cloudflare 账号，需信用卡 |

买一个便宜后缀就行，`.xyz` / `.top` / `.fun` 首年常在 $2-5。**这是个 demo，域名好不好听不影响评分。**

### 方案 B：阿里云/腾讯云买域名

**必须实名认证**，未实名会被停止解析。审核几小时到一个工作日。
**如果你已经有实名过的账号和域名，直接挂个二级域名即可，是最省事的做法**（比如 `paopao.你的域名.com`）。

### DNS 解析怎么配

推荐把域名的 NS 指到 **Cloudflare**（免费、生效快、面板清楚）：

1. Cloudflare 添加站点 → 按提示把注册商的 NS 改成 Cloudflare 给的两条
2. 添加一条 **A 记录**：`@` 或 `paopao` → 服务器公网 IP
3. **代理状态必须选「仅 DNS」（灰色云朵），不要开橙色云朵**

> 橙色云朵 = 流量绕 Cloudflare CDN，大陆访问慢且不稳。我们要的是直连香港。

---

## 第一步 · 买香港轻量（10 分钟）

阿里云和腾讯云都行，操作几乎一样。

### 阿里云

控制台 → 搜索「轻量应用服务器」→ 立即购买

| 选项 | 选什么 | 说明 |
|---|---|---|
| **地域** | **中国香港** | **这一项选错就白干**，选了大陆就要备案 |
| 镜像 | **系统镜像 → Ubuntu 24.04** | 不要选宝塔/WordPress 这类应用镜像 |
| 套餐 | 2核2G 起 | 1核1G 也能跑，但 Node + Caddy 同时在，2G 稳妥 |
| 时长 | **1 个月** | 比赛用，别买年付 |

价格大致每月几十元，具体以下单页为准。

### 腾讯云

控制台 → 轻量应用服务器 → 新建，地域选**中国香港**，镜像选 Ubuntu Server 24.04，其余同上。

### 买完立刻做两件事

1. **重置 root 密码**（控制台里有按钮），记下来
2. **防火墙放行端口**：控制台 → 防火墙 → 确认 `22`（SSH）、`80`（HTTP）、`443`（HTTPS）都开着
   **3000 端口不要对外开** —— Node 只在本机监听，由 Caddy 反代

---

## 第二步 · 连上去装环境（15 分钟）

Windows 上直接用 Git Bash 或 PowerShell：

```bash
ssh root@你的服务器公网IP
```

首次连接问 `yes/no`，输 `yes`，然后输密码。

连上后逐段粘贴：

```bash
# 更新系统
apt update && apt upgrade -y

# 装 Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v          # 应该输出 v22.x

# 装 pm2（进程守护，崩了自动拉起）
npm i -g pm2

# 装 Caddy（自动申请 HTTPS 证书，比 Nginx 少一半配置）
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
caddy version    # 有输出就成了
```

---

## 第三步 · 配 Caddy（5 分钟）

```bash
nano /etc/caddy/Caddyfile
```

**整个文件删光**，换成这三行（域名换成你自己的）：

```
paopao.你的域名.com {
    reverse_proxy localhost:3000
}
```

`Ctrl+O` 回车保存，`Ctrl+X` 退出。然后：

```bash
systemctl reload caddy
systemctl status caddy    # 看到 active (running) 就对了
```

**Caddy 会自动去 Let's Encrypt 申请证书**，不用你做任何事。前提是域名已经解析到这台机器的 IP —— 没解析好会报错，等解析生效再 reload 一次。

验证解析是否生效：

```bash
dig +short paopao.你的域名.com    # 应该输出你的服务器 IP
```

---

## 第四步 · 部署代码（10 分钟）

### 上传

本机（Windows Git Bash）执行：

```bash
cd /d/bianda-paopao
tar --exclude=node_modules --exclude=.git -czf /tmp/paopao.tar.gz .
scp /tmp/paopao.tar.gz root@你的IP:/root/
```

服务器上：

```bash
mkdir -p /opt/paopao && cd /opt/paopao
tar xzf /root/paopao.tar.gz
npm i --omit=dev
```

### 配 API key

```bash
nano /opt/paopao/.env
```

写入（阶段 2 才用得上，先建好）：

```
AI_API_KEY=你的key
AI_STYLE=openai
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode
AI_MODEL=qwen3.8-max
PORT=3000
```

```bash
chmod 600 /opt/paopao/.env    # 只有 root 能读
```

### 起服务

```bash
cd /opt/paopao
pm2 start server/index.js --name paopao
pm2 save
pm2 startup    # 它会打印一行命令，把那行复制出来再执行一次
```

### 验收

```bash
curl -s localhost:3000/api/health     # 服务器本机：{"ok":true,...}
```

浏览器打开 `https://paopao.你的域名.com` —— **地址栏应该是绿锁**。

---

## 第五步 · 三条必测（不测就是裸奔）

| # | 测什么 | 怎么测 | 为什么关键 |
|---|---|---|---|
| 1 | **微信里能不能开** | 链接发到微信「文件传输助手」，点开 | **评委多半从微信点进来**。这条比绿锁更重要 |
| 2 | 手机 4G 能不能开 | 关 WiFi 用流量打开 | 排除只有你家网络能通 |
| 3 | 崩了能不能自愈 | `pm2 stop paopao` 再 `pm2 start paopao`；重启服务器看是否自动起 | 比赛期间你不可能一直盯着 |

---

## 后续更新代码怎么办

```bash
# 本机
cd /d/bianda-paopao
tar --exclude=node_modules --exclude=.git -czf /tmp/paopao.tar.gz .
scp /tmp/paopao.tar.gz root@你的IP:/root/

# 服务器
cd /opt/paopao && tar xzf /root/paopao.tar.gz && npm i --omit=dev
pm2 restart paopao
```

**08-08 深夜之后不要再执行这段。** 冻结就是冻结。

---

## 常见卡点

| 现象 | 原因 | 解法 |
|---|---|---|
| Caddy 报证书申请失败 | 域名还没解析到这台机器 | `dig +short 域名` 确认，等生效后 `systemctl reload caddy` |
| 浏览器打不开但 `curl localhost:3000` 正常 | 防火墙没放行 80/443 | 云控制台防火墙里加规则 |
| 域名解析不生效 | Cloudflare 开了橙色云朵，或 NS 还没切换完 | 改成灰色云朵；NS 切换最长 24 小时 |
| `npm i` 卡住 | 香港机器拉 npm 有时慢 | `npm config set registry https://registry.npmmirror.com` |
| 微信里打不开 | 极少见（香港免备案+HTTPS 通常没问题） | 换个域名后缀试；`.top`/`.xyz` 偶尔被风控 |

---

## 三条运维红线

- **API key 只在 `.env`，权限 600**，不进仓库、不进前端、不发给任何人
- **每日额度熔断**，超了自动降级到脚本。公开链接不设限，一晚上能烧掉几百块
- **08-08 深夜冻结后不碰生产**，只看不改

---

*2026-08-07 · 配套 ARCHITECTURE.md 第六节*
