// 直接生成 PDF 版产品介绍：AI 原图整页铺底 + 楷体金字排版（不依赖 Office）
const fs = require('fs'); const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const sharpless = null;

const SHOTS = path.join(__dirname, '..', 'docs', 'shots');
const OUT = process.argv[2] || path.join(__dirname, '..', 'docs', '变大泡泡-产品介绍.pdf');
const KAI = 'C:/Windows/Fonts/STKAITI.TTF';

const GOLD = rgb(0.91, 0.78, 0.49), CREAM = rgb(0.97, 0.94, 0.87), SOFT = rgb(0.93, 0.89, 0.78);

const SLIDES = JSON.parse(fs.readFileSync(path.join(__dirname, 'pitch-data.json'), 'utf8'));

(async () => {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const kai = await doc.embedFont(fs.readFileSync(KAI), { subset: true });
  const W = 1280, H = 720;

  for (const s of SLIDES) {
    const pg = doc.addPage([W, H]);
    const img = await doc.embedPng(fs.readFileSync(path.join(SHOTS, s.img)));
    // cover 铺满：按比例放大裁边
    const sc = Math.max(W / img.width, H / img.height);
    const iw = img.width * sc, ih = img.height * sc;
    pg.drawImage(img, { x: (W - iw) / 2, y: (H - ih) / 2, width: iw, height: ih });

    if (s.cover) {
      pg.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.04, 0.08, 0.13), opacity: 0.45 });
      const t1 = s.tag; const w1 = kai.widthOfTextAtSize(t1, 20);
      pg.drawText(t1, { x: (W - w1) / 2, y: H - 250, size: 20, font: kai, color: GOLD });
      const title = s.t.split('').join('　');
      const wt = kai.widthOfTextAtSize(title, 76);
      pg.drawText(title, { x: (W - wt) / 2, y: H - 360, size: 76, font: kai, color: CREAM });
      s.b.forEach((b, i) => {
        const wb = kai.widthOfTextAtSize(b, 21);
        pg.drawText(b, { x: (W - wb) / 2, y: H - 440 - i * 40, size: 21, font: kai, color: SOFT });
      });
    } else {
      // 底部渐变暗条（叠三层半透明模拟渐变）
      pg.drawRectangle({ x: 0, y: 0, width: W, height: 205, color: rgb(0.028, 0.047, 0.078), opacity: 0.55 });
      pg.drawRectangle({ x: 0, y: 0, width: W, height: 150, color: rgb(0.028, 0.047, 0.078), opacity: 0.6 });
      pg.drawRectangle({ x: 0, y: 0, width: W, height: 90, color: rgb(0.02, 0.035, 0.06), opacity: 0.7 });
      pg.drawText(s.tag, { x: 72, y: 172, size: 15, font: kai, color: GOLD });
      pg.drawText(s.t, { x: 70, y: 128, size: 34, font: kai, color: CREAM });
      s.b.forEach((b, i) => {
        pg.drawText('◆ ' + b, { x: 74, y: 92 - i * 28, size: 15.5, font: kai, color: SOFT });
      });
      const no = SLIDES.indexOf(s) + ' / ' + (SLIDES.length - 1);
      pg.drawText(no, { x: W - 86, y: H - 40, size: 13, font: kai, color: SOFT, opacity: 0.75 });
    }
  }
  fs.writeFileSync(OUT, await doc.save());
  console.log('PDF 生成完成: ' + OUT);
})();
