# 职场 MBTI · 16 型美术映射表

> 锁定用。改这张表 = 改代码 + 重生图，动之前先想清楚。
> 生图脚本：`powershell -File "C:\Users\admin\Documents\New project\generate_image_openai.ps1" -Model "gpt-image-2-count"`
> 切图脚本：`powershell -File tools\slice_grid.ps1 -In 网格.png -Out 目录 -Names "a,b,c,d"`

---

## 一、四维 ↔ 真 MBTI（双射）

| 我们的维度 | 真 MBTI |
|---|---|
| 话：拍 P / 隐 Y | E 外向 / I 内向 |
| 卷：卷 J / 躺 T | J 判断 / P 感知 |
| 锅：背 B / 甩 S | F 情感 / T 思考 |
| 饼：造饼 H / 信饼 C | N 直觉 / S 实感 |

代号四位固定顺序 **话-卷-锅-饼**，转 MBTI 时按 **话-饼-锅-卷** 重排。

## 二、八件道具的固定画法（16 型共用，一个字都不许改）

| 位 | 道具英文（写进 prompt） |
|---|---|
| P 拍 | `a big speech bubble popping out beside the head, mouth open talking` |
| Y 隐 | `a strip of tape sealing the mouth shut` |
| J 卷 | `holding a steaming coffee cup in the right hand` |
| T 躺 | `two big letter Z shapes floating above the head` |
| B 背 | `a big black cast iron frying pan strapped on the back, visible over the shoulder` |
| S 甩 | `a black frying pan flying away behind with motion streaks` |
| H 造饼 | `a large glowing golden pie disc floating above the head like a halo` |
| C 信饼 | `a small golden pie dangling on a string in front of the face, just out of reach` |

**手部红线**：每条 prompt 必须显式写 `exactly two arms: the right hand {…}, the left arm {…}, anatomically correct with only two arms and two hands`。不写就会长出第三只手（已踩，见 `_rej-INTJ-3arms.png`）。

## 三、16 型总表

**每型男女各一张**，文件名 `{代号}-m.png` / `{代号}-f.png`。人设与左右手两性共用，只换发型和着装（`M` 衬衫长裤 / `W` 衬衫裙子）。

| 代号 | MBTI | 外号 | 人物设定（写进 prompt 的一句） | 左右手 |
|---|---|---|---|---|
| PJBH | ENFJ 主人公 | 卷王发动机 | 亢奋到发光的领头人，眼睛瞪大，身体前倾 | 右手咖啡，左手握拳举起 |
| PJBC | ESFJ 执政官 | 靠谱接盘侠 | 热心过头的老好人，笑得太用力 | 右手咖啡，左手抱一摞文件 |
| PJSH | ENTJ 指挥官 | 甩锅演说家 | 意气风发的演讲者，下巴抬高 | 右手咖啡，左手向前指 |
| PJSC | ESTJ 总经理 | 向上管理专家 | 精明的中层，笑容标准得像模板 | 右手咖啡，左手插兜 |
| PTBH | ENFP 竞选者 | 嘴强王者 | 眉飞色舞的空想家，手舞足蹈 | 右手张开比划，左手叉腰 |
| PTBC | ESFP 表演者 | 热心老实人 | 傻乐的社牛，咧嘴大笑 | 右手挥手打招呼，左手垂下 |
| PTSH | ENTP 辩论家 | PPT 艺术家 | 得意的杠精，挑眉斜嘴 | 右手举一支激光笔，左手垂下 |
| PTSC | ESTP 企业家 | 会议室常驻民 | 油滑的会议动物，眯眼笑 | 右手比大拇指，左手插兜 |
| YJBH | INFJ 提倡者 | 沉默造饼人 | 安静的谋士，垂眼盯着文件 | 右手咖啡，左手抱笔记本 |
| YJBC | ISFJ 守卫者 | 老黄牛 | 疲惫的老实人，肩膀塌下去 | 右手咖啡，左手扶着后腰 |
| YJSH | INTJ 建筑师 | 暗线操盘手 | 金丝圆眼镜，斜眼冷笑 | 右手咖啡，左手自然垂下 |
| YJSC | ISTJ 物流师 | 闷头执行者 | 面无表情的螺丝钉，目视前方 | 右手咖啡，左手夹一块板夹 |
| YTBH | INFP 调停者 | 隐形设计师 | 神游的文艺青年，眼神飘向别处 | 右手托腮，左手垂下 |
| YTBC | ISFP 探险家 | 工位隐身人 | 缩着肩往后躲，眼神闪避 | 双手抱在胸前 |
| YTSH | INTP 逻辑学家 | 摸鱼哲学家 | 看穿一切的懒散哲人，半眯眼 | 右手撑着下巴，左手垂下 |
| YTSC | ISTP 鉴赏家 | 带薪呼吸大师 | 彻底躺平，翘着二郎腿仰头 | 双手枕在脑后 |

**性别红线**：疲惫 / 躲闪 / 躺平这几型不许只出女版，男女必须成对。缺一张就是没做完。

**生成方式：单张生成，一型一性别一次调用（共 32 张）。** 2×2 网格路线在这条线已废弃（半身、白底、动势弱，见 `grid-paper-G1.png`）。
规格对齐 `paper/YJSH-m.png` 与 `paper/YJBC-f.png`：**全身站姿 + 透明底 + 有动势**。

刻薄评语 / 建议工位 / 天敌型号已在 `public/games/mbti.js` 的 `TYPES` 表里，不重复。

## 四、四张风格线

| 线 | 用途 | 目录 | 命名 | 生成脚本 |
|---|---|---|---|---|
| **纸雕人物** | 官方 16 型画像（结算页） | `assets/mbti/paper/` | `{代号}-m.png` `{代号}-f.png` | `tools/gen_mbti_paper.sh` |
| **糊猫** | 用户可选皮肤 / 分享卡 | `assets/mbti/cat/` | `{代号}.png` | `tools/gen_mbti_cat.sh` |
| **纸雕生物** | 用户可选皮肤（一型一只动物） | `assets/mbti/spec/` | `{代号}.png` | `tools/gen_mbti_spec.sh` |
| **熊猫头** | 备选皮肤 | `assets/mbti/panda/` | — | 样板 `meme-pan.png` `meme-YTSC.png` |

猫和纸雕生物走 2×2 网格：一次调用出 4 张，脚本内自动调 `slice_grid.ps1` 切开，4 次调用铺满 16 型。

## 五、网格分组（猫 / 纸雕生物用，一次生 4 张，共 4 次调用/线）

按前两位分组，同格共享「嘴 + 精力」两件道具，只有锅和饼变。

| 网格 | 左上 | 右上 | 左下 | 右下 | 共享道具 |
|---|---|---|---|---|---|
| **G1** | PJBH | PJBC | PJSH | PJSC | 说话气泡 + 咖啡 |
| **G2** | PTBH | PTBC | PTSH | PTSC | 说话气泡 + z |
| **G3** | YJBH | YJBC | YJSH | YJSC | 封条 + 咖啡 |
| **G4** | YTBH | YTBC | YTSH | YTSC | 封条 + z |

纸雕生物每型对应一只动物：G1 公鸡/金毛/孔雀/狐狸 · G2 鹦鹉/柯基/猴子/浣熊 · G3 猫头鹰/老黄牛/乌鸦/蚂蚁 · G4 水母/刺猬/树懒/咸鱼。

切图命名直接用代号：`-Names "PJBH,PJBC,PJSH,PJSC"`（脚本已内置，不用手敲）

## 六、prompt 模板（材质词打头，禁止写场景）

**纸雕人物**（已验证，`mb-INTJ.png` 出自此模板）：
```
A 2x2 grid of four separate square panels divided by clean thin white gutters.
Handmade layered papercraft paper sculpture figurines, cut kraft paper and deep navy
paper with gold foil accents, visible torn paper edges, soft drop shadows, stop-motion
diorama craft, each figure isolated on a plain white panel. All four wear a cream paper
shirt with a navy paper lanyard and gold foil badge, exactly two arms each,
anatomically correct with only two arms and two hands.
Top left: {设定}, {四道具}, {左右手}.
Top right: ...
Bottom left: ...
Bottom right: ...
No text, no watermark, high detail
```

**糊猫**（已验证，`grid-cat-1.png` 出自此模板）：
```
A 2x2 grid of four separate square panels divided by clean thin white gutters, each
panel contains one cursed low resolution internet cat meme sticker on a plain white
background. All four are the same chubby round grey tabby kitten with big glossy black
eyes, heavily compressed blurry jpeg look, standing upright on stubby hind legs,
wearing a tiny white office shirt collar and a small blue lanyard ID badge.
Top left: {四道具 + 表情}. ...
No text, no watermark
```

**熊猫头**：`Chinese doutu meme sticker, crude grainy black and white photocopy-look cartoon panda head with {表情}, on a simple hand-drawn human body wearing a white office shirt with a blue lanyard ID badge, {四道具}, thick rough black marker outlines, low quality internet meme aesthetic, only the lanyard is blue, plain white background, no text`

**纸雕生物**（彩蛋，不做 16 张，只做 4 只）：仓鼠跑轮 = 卷王 / 咸鱼躺桌 = 躺平 / 老黄牛 = 背锅 / 鸵鸟埋头 = 甩锅。

## 七、生成后必做

1. 切图：`slice_grid.ps1`，命名用代号
2. 压缩：`powershell -File tools\shrink_assets.ps1`，图标 256px、画像 512px
3. 接探测加载：图在就换图，404 退回现有 CSS 剪影（单机版 dist 走兜底）
4. 结算页加一行「YJSH 暗线操盘手 ≈ INTJ 建筑师」

## 八、验收

- 16 张纸雕人物每张手数 = 2，四道具与代号一一对应
- 同格四张材质、配色、工牌一致
- 猫 16 张同一只猫
- 图全删掉，游戏仍能跑完一局（兜底不裂）
