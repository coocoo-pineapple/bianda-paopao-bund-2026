<p align="center">
  <img src="docs/images/readme/readme-hero-count-text-v1.png" alt="变大泡泡：真的场景，假装上班；假的场景，真的赚钱" width="100%">
</p>

<h1 align="center">变大泡泡</h1>

<p align="center"><strong>真的场景，假装上班；假的场景，真的赚钱。</strong></p>

<p align="center">
  <a href="https://bianda-paopao.yiwang2457.workers.dev/">正式 Demo</a>
  ·
  <a href="https://bianda-paopao-bund-2026.vercel.app/">Vercel 备用 Demo</a>
  ·
  <a href="docs/变大泡泡-45s-终版.mp4">观看 45 秒视频</a>
  ·
  <a href="docs/变大泡泡-产品介绍-v2.pdf">下载产品介绍 PDF</a>
</p>

## 45 秒看懂它

<p align="center">
  <img src="docs/images/readme/teaser.gif" alt="变大泡泡 13 秒动态预览" width="72%">
</p>

<p align="center"><em>上面是宣传片前 13 秒。完整版本：<a href="docs/变大泡泡-45s-终版.mp4">打开 MP4</a>，或直接进入 <a href="https://bianda-paopao.yiwang2457.workers.dev/">在线 Demo</a>。</em></p>

## 一层假 Windows，一片真水域

「变大泡泡」的外壳是一台以假乱真的 Windows：Word、Excel、企业微信全是伪装，老板从背后走过看到的是述职报告。按下 `Ctrl+空格`（老板键）才知道，壳下面藏着一片水域。

为什么要做成假 Windows？因为白天说真话，需要一层壳。

## 泡泡就是这里的全部秘密

水域里飘的就是泡泡。每条内容都是一颗泡泡：一句吐槽、一条情报、一个技能，或者一个游戏点子。

别人觉得有价值，就朝它吹一口气，泡泡变大、浮得更久；没人理会就慢慢沉底。沉底不是删除，有人想捞，随时可以捞回来。

热度是浮力，认可是氧气。一颗泡泡的大小，就是一次微型的集体投票。

产品名「变大泡泡」说的就是这件事：让那些考核表看不见的价值，被吹大、被看见。

## 四层水路：从围观到价值

泡泡沿着四层水路越沉越值钱：

- **趣味：把人引进来** —— 梦蝶局把职场困境做成 AI 身份推理局，先在游戏里踩一遍坑，看清自己的处境。玩家还能上传自制小游戏，游戏创意也能在点子集市标价成交。
- **资讯：让人听到风声** —— 泡泡广场飘着最新鲜的行业风声与八卦：谁的年终被砍、哪个项目黄了。先热闹起来，仅供围观。
- **干货：让风声变成知识** —— 资讯要沉淀为干货，必须过签名关。情报分为「真 / 存疑 / 假」三级，发言签名担保，说错会掉信誉；薪资对表由三位同行签名互保，对出真实行情。
- **价值：让知识变成真金白银** —— 技能集市可以卖技能、发悬赏、接付费咨询；你的 AI 分身还能在机器人工坊替你接单。考核表量不到的能力，市场量得到。

**趣味把人引进来，资讯让人留下来，干货让人信得过，价值让人赚到钱。**

围观 → 玩起来 → 签下名 → 收到钱，每一层的载体，都是同一颗泡泡。

## 真实产品切片

<table>
  <tr>
    <td width="50%"><img src="docs/images/readme/01-office-shell.png" alt="办公软件伪装壳"><br><strong>老板键：办公壳与真实水域切换</strong></td>
    <td width="50%"><img src="docs/images/readme/02-ai-avatar.png" alt="AI 分身与机器人工坊"><br><strong>机器人工坊：让 AI 分身替你接单</strong></td>
  </tr>
  <tr>
    <td><img src="docs/images/readme/03-game-skill-market.png" alt="游戏大厅与技能集市"><br><strong>游戏大厅与技能集市：先玩起来，再把能力标价</strong></td>
    <td><img src="docs/images/readme/04-dream-butterfly.png" alt="梦蝶局"><br><strong>梦蝶局：在 AI 身份推理里先踩一遍职场的坑</strong></td>
  </tr>
  <tr>
    <td><img src="docs/images/readme/05-salary-benchmark.png" alt="薪资对表"><br><strong>薪资对表：匿名信息经过同行签名互保</strong></td>
    <td><img src="docs/images/readme/06-value-settlement.png" alt="价值结算"><br><strong>价值结算：让考核表量不到的能力进入市场</strong></td>
  </tr>
</table>

## 参赛版重点

- 泡泡广场：把点赞变成“给内容续命”，热度会自然衰减。
- 梦蝶局：多个带虚构身份的机器人互相试探，揭底时标出典型职场话术。
- 游戏大厅与点子集市：玩家上传小游戏，也可以让游戏创意进入交易。
- 签名与信誉：用「真 / 存疑 / 假」和同行互保，让匿名内容逐步沉淀为可信干货。
- 技能集市与机器人工坊：把技能、悬赏、咨询和 AI 分身接单连起来。
- 老板键：社区、述职报告和桌面伪装三态切换。
- AI 降级：模型不可用、超时或额度触顶时，明确回退到脚本模拟，不把模拟结果冒充真实调用。

## 本地运行

要求 Node.js 20 或更高版本。

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

打开 `http://localhost:3000`。

## 百炼配置

Key 只放在服务端环境变量，不写进前端、不提交到 Git：

```text
AI_API_KEY=你的百炼Key
AI_STYLE=openai
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode
AI_MODEL=qwen3.8-max
AI_DAILY_LIMIT=300
AI_PER_HOUR=20
PORT=3000
```

服务端通过 `/api/ask` 调用模型；前端只收到模型文本或明确的脚本降级状态。线上是否接通模型，以对应部署的 `/api/health` 返回为准。

## 部署

- Cloudflare Worker：<https://bianda-paopao.yiwang2457.workers.dev/>
- Vercel 备用部署：<https://bianda-paopao-bund-2026.vercel.app/>
- GitHub 推送到 `main` 后，Vercel 项目会自动触发部署。

完整版本需要长期运行的 Node 服务；部署时把 `AI_API_KEY` 配到平台的加密环境变量，不能写进 GitHub。

## 工具说明

早期原型阶段使用过其他 AI 工具辅助，如视频/图片的生成使用了在线网站 [9vc.ai](https://www.9vc.ai/)；本参赛版本使用阿里云百炼完成关键能力接入、真实调用验证和部署准备，产品代码、产品判断与最终交付由项目作者及项目共同方负责。

## 版权与商业使用

本仓库公开是为了产品展示、学习交流和比赛评审，不代表授予开源或商业授权。项目名称、产品创意、交互机制、视觉方案、文字内容和代码均受适用的著作权及其他知识产权保护。

未经版权所有者书面许可，任何人不得将本项目或其衍生版本用于商业使用、售卖、二次商业部署、收费服务或衍生产品运营。项目共同方之间的内部合作不受本声明影响。

详见 [LICENSE](LICENSE)。
