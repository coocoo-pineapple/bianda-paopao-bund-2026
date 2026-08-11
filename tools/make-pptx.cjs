// 生成真 PPT：docs/变大泡泡-产品介绍.pptx
// 图片全部取 docs/shots 的 AI 原始 PNG（1920x1080 或 1536x1024），整页铺满
// 文案唯一源：tools/pitch-data.json（PDF 与本脚本共用，不许再抄一份）
const fs = require('fs');
const path = require('path');
const Pptx = require('pptxgenjs');

const SHOTS = path.join(__dirname, '..', 'docs', 'shots');
const OUT = path.join(__dirname, '..', 'docs', '变大泡泡-产品介绍.pptx');

const GOLD = 'E8C87E', CREAM = 'F7F0DD', SOFT = 'EDE3C8', DIM = 'C9BFA4';

const SLIDES = JSON.parse(fs.readFileSync(path.join(__dirname, 'pitch-data.json'), 'utf8'));

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
