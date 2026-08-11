// 生成真 PPT：docs/变大泡泡-产品介绍.pptx
// 图片全部取 docs/shots 的 AI 原始 PNG（1920x1080 或 1536x1024），整页铺满
const path = require('path');
const Pptx = require('pptxgenjs');

const SHOTS = path.join(__dirname, '..', 'docs', 'shots');
const OUT = path.join(__dirname, '..', 'docs', '变大泡泡-产品介绍.pptx');

const GOLD = 'E8C87E', CREAM = 'F7F0DD', SOFT = 'EDE3C8', DIM = 'C9BFA4';

const SLIDES = [
  { img: 'D9.png', tag: '变大泡泡 · 产品叙', t: '变大泡泡', cover: true,
    b: ['一个做给打工人的地方，藏在一台假 Windows 里', '子非鱼，安知鱼之乐'],
    n: '开场白：在假 Windows 里，用假 PowerPoint，讲一个真产品。' },
  { img: 'E1.png', tag: '壹 · 井', t: '我们都上过这样的班',
    b: ['会的东西比岗位说明书多，被看见的只有周报那三行', '不是不想发光，是考核表上没有那一格', '做这个产品不是教人偷懒——是想让被浪费的那部分，有地方去'],
    n: '庄子笑井蛙不可语海。我们不笑，我们就是那只蛙——所以想给井里的人修一条到海的路。' },
  { img: 'P1-desktop.png', tag: '贰 · 壳', t: '为什么要做成假 Windows？',
    b: ['因为白天说真话，需要一层壳', 'Word、Excel、企业微信，像素级仿真，经得起老板从身后走过', '这层看起来最没用的伪装，是所有功能的地基'],
    n: '庄子讲无用之用。这台假电脑就是无用之用——诸位现在看到的，就是它本身。' },
  { img: 'P2-bosskey.png', tag: '叁 · 键', t: '老板键，不是心虚，是边界',
    b: ['Ctrl + 空格：一秒回到办公，上班演好上班', '一键述职：井下的收获，也能写进汇报里', '先有安全感，人才敢说真话'],
    n: '庖丁的刀用了十九年，刃如新发——因为他只走缝隙。老板键就是那道缝隙。' },
  { img: 'E2.png', tag: '肆 · 水面', t: '先让人玩起来，再谈别的',
    b: ['上层是游戏、放映、拼豆——进来先图个乐', '玩家还能上传自制小游戏，连游戏创意都能在点子集市卖钱', '围观 → 玩起来 → 签下名 → 收到钱，不催，等人自己往深处走'],
    n: '鲦鱼出游从容，是鱼之乐也。先有乐，才有一切。' },
  { img: 'B2.png', tag: '伍 · 梦蝶', t: '把你正在经历的困境，做成一局游戏',
    b: ['四个 AI 演一局身份局，人心的破绽逐轮显形', '你在局外看得清清楚楚——因为局里演的就是你的处境', '在梦里栽跟头，醒来就免疫'],
    n: '不知周之梦为胡蝶与，胡蝶之梦为周与。梦蝶局的名字，就从这里来。' },
  { img: 'B3-txt.png', tag: '陆 · 真言', t: '匿名让人敢说，签名让话可信',
    b: ['情报分三级：真、存疑、假——条条有人担保', '说错了掉信誉：化名保护人，签名保护真', '办公室里没人负责的话，在这里字字有主'],
    n: '《渔父》：真者，精诚之至也；不精不诚，不能动人。这里的规矩只有一条——话要真。' },
  { img: 'P4-skill.png', tag: '柒 · 集市', t: '你那些「没用」的本事，在这里有用',
    b: ['卖技能、卖工具、发悬赏', '考核表量不到的能力，市场量得到'],
    n: '人皆知有用之用，而莫知无用之用。集市干的就是这件事：给无用之用标个价。' },
  { img: 'C1-txt.png', tag: '捌 · 对表', t: '谈薪那一刻的孤独，我们都经历过',
    b: ['同岗薪资，三个同行签名互保，对出真实行情', '信息差是职场最重的一道税——这里退税'],
    n: '相濡以沫，不如相忘于江湖。可要先相濡以沫过，才有力气游向江湖。' },
  { img: 'A3.png', tag: '玖 · 分身', t: '你睡着了，分身替你醒着',
    b: ['人格 DNA、框架库、禁区——三样东西，教出一个像你的分身', '它替你接单回答，收益归你'],
    n: '分身是蝶还是周，不必辩。单子是真的，就好。' },
  { img: 'A4-txt.png', tag: '拾 · 见证', t: '量尺已经造好',
    b: ['转化漏斗看板：围观 → 参与 → 签名 → 交易，实时可查', '演示环境以模拟数据运行，未接入真实支付——这句也是真话', '先把量尺做好，等真实用户来刻度'],
    n: '真诚也包括不夸大：数据是演示的，漏斗是真的。' },
  { img: 'P3-truefake.png', tag: '拾壹 · 倒影', t: '究竟哪一边，是真的？',
    b: ['办公室是真的，人人在演', '这里是假的——本事换到真钱，真话得到签名'],
    n: '真地方演假戏，假地方来真的。全篇题眼，请放慢。' },
  { img: 'E3.png', tag: '终 · 梦醒', t: '梦醒了，手里的东西还在',
    b: ['子非鱼，安知鱼之乐', '现在就试：Ctrl + 空格，按一下老板键'],
    n: '到底哪一边才是梦？停一拍，不必作答。' }
];

const p = new Pptx();
p.defineLayout({ name: 'W', width: 13.33, height: 7.5 });
p.layout = 'W';

for (const s of SLIDES) {
  const sl = p.addSlide();
  sl.background = { color: '0A1522' };
  // 整页铺图（16:9 原图正好；1536x1024 的图按高铺满、居中裁边）
  sl.addImage({ path: path.join(SHOTS, s.img), x: 0, y: 0, w: 13.33, h: 7.5, sizing: { type: 'cover', w: 13.33, h: 7.5 } });

  if (s.cover) {
    // 封面：中央大字
    sl.addShape('rect', { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: '0A1522', transparency: 55 } });
    sl.addText(s.tag, { x: 0, y: 2.1, w: 13.33, h: 0.5, align: 'center', fontFace: '楷体', fontSize: 16, color: GOLD, charSpacing: 8 });
    sl.addText(s.t, { x: 0, y: 2.6, w: 13.33, h: 1.6, align: 'center', fontFace: '楷体', bold: true, fontSize: 66, color: CREAM, charSpacing: 20, shadow: { type: 'outer', blur: 12, offset: 3, angle: 90, color: '000000', opacity: .7 } });
    s.b.forEach((t, i) => sl.addText(t, { x: 0, y: 4.35 + i * 0.55, w: 13.33, h: 0.5, align: 'center', fontFace: '楷体', fontSize: 17, color: SOFT, charSpacing: 4 }));
  } else {
    // 内页：底部渐变字条
    sl.addShape('rect', { x: 0, y: 4.9, w: 13.33, h: 2.6, fill: { type: 'gradient', stops: [{ color: '0A101A', position: 0, transparency: 100 }, { color: '0A101A', position: 45, transparency: 30 }, { color: '070C14', position: 100, transparency: 4 }], angle: 90 } });
    sl.addText(s.tag, { x: 0.75, y: 5.12, w: 4, h: 0.4, fontFace: '楷体', fontSize: 13, color: GOLD, charSpacing: 6 });
    sl.addText(s.t, { x: 0.72, y: 5.5, w: 11.9, h: 0.68, fontFace: '楷体', bold: true, fontSize: 30, color: CREAM, charSpacing: 3, shadow: { type: 'outer', blur: 8, offset: 2, angle: 90, color: '000000', opacity: .8 } });
    sl.addText(s.b.map(t => ({ text: t, options: { bullet: { characterCode: '25AA', indent: 18 }, color: SOFT, fontSize: 14.5, fontFace: '微软雅黑', paraSpaceAfter: 6, charSpacing: 1 } })),
      { x: 0.78, y: 6.2, w: 11.9, h: 1.2, valign: 'top' });
    // 页码
    const no = SLIDES.indexOf(s);
    sl.addText(no + ' / ' + (SLIDES.length - 1), { x: 12.2, y: 0.25, w: 0.95, h: 0.35, align: 'right', fontSize: 11, color: DIM, fontFace: '微软雅黑' });
  }
  sl.addNotes(s.n);
}

p.writeFile({ fileName: OUT }).then(() => console.log('生成完成: ' + OUT));
