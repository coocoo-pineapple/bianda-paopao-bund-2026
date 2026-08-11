// 纯拼接构建 dist/变大泡泡-单机版.html
// 不用 String.replace 塞脚本内容（会吞 $$），全部数组 join。
const fs = require('fs');
const path = require('path');
const pub = path.join(__dirname, '..', 'public');
const dist = path.join(__dirname, '..', 'dist');

const html = fs.readFileSync(path.join(pub, 'app.html'), 'utf8');

// 外链脚本表：顺序即执行顺序，defer 的也要内联，否则单机版打开是空窗
// （历史坑：这里原本只有 shells/os，games/*.js 在 file:// 下全 404，单机版一个游戏都没有）
const TAGS = [
  '<script src="games/kit.js"></script>',
  '<script src="shells.js"></script>',
  '<script src="os.js"></script>',
  '<script src="games/gomoku.js" defer></script>',
  '<script src="games/hide.js" defer></script>',
  '<script src="games/word.js" defer></script>',
  '<script src="games/mbti.js" defer></script>',
  '<script src="games/dreamroom.js" defer></script>'
];
const FILE = {
  '<script src="games/kit.js"></script>': 'games/kit.js',
  '<script src="shells.js"></script>': 'shells.js',
  '<script src="os.js"></script>': 'os.js',
  '<script src="games/gomoku.js" defer></script>': 'games/gomoku.js',
  '<script src="games/hide.js" defer></script>': 'games/hide.js',
  '<script src="games/word.js" defer></script>': 'games/word.js',
  '<script src="games/mbti.js" defer></script>': 'games/mbti.js',
  '<script src="games/dreamroom.js" defer></script>': 'games/dreamroom.js'
};

// 找到每个标签的位置，按出现顺序内联。用 indexOf + slice 拼接，绝不用 replace。
const hits = [];
for (const tag of TAGS) {
  const i = html.indexOf(tag);
  if (i < 0) { console.error(`外链 script 标签没找到，app.html 结构变了？\n  ${tag}`); process.exit(1); }
  if (html.indexOf(tag, i + 1) >= 0) { console.error(`标签重复出现，无法定位：${tag}`); process.exit(1); }
  hits.push({ tag, i, src: FILE[tag] });
}
hits.sort((a, b) => a.i - b.i);

const parts = [];
const sources = [];
let cur = 0;
for (const h of hits) {
  const code = fs.readFileSync(path.join(pub, h.src), 'utf8');
  sources.push(code);
  parts.push(html.slice(cur, h.i), '<script>\n', code, '\n</script>');
  cur = h.i + h.tag.length;
}
parts.push(html.slice(cur));
const out = parts.join('');

if (!fs.existsSync(dist)) fs.mkdirSync(dist);
const outFile = path.join(dist, '变大泡泡-单机版.html');
fs.writeFileSync(outFile, out);

// 自检 1：public 里的 $$ 数量必须与 dist 一致（防 replace 吞字符）
const cnt = (s) => (s.match(/\$\$/g) || []).length;
const want = cnt(html) + sources.reduce((n, s) => n + cnt(s), 0);
const got = cnt(out);
// 自检 2：不能有残留的外链 script（残留 = 单机版打开就 404）
const left = out.match(/<script src="[^"]+"/g) || [];

console.log(`dist 已生成：${outFile}`);
console.log(`内联脚本：${hits.length} 个 · ${(out.length / 1024).toFixed(0)}KB`);
console.log(`$$ 自检：public=${want} dist=${got} ${want === got ? 'OK' : '!! 不一致'}`);
console.log(`外链残留自检：${left.length === 0 ? 'OK（无残留）' : '!! ' + left.join(' ')}`);
if (want !== got || left.length) process.exit(1);
