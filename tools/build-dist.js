// 纯拼接构建 dist/变大泡泡-单机版.html
// 不用 String.replace 塞脚本内容（会吞 $$），全部数组 join。
const fs = require('fs');
const path = require('path');
const pub = path.join(__dirname, '..', 'public');
const dist = path.join(__dirname, '..', 'dist');

const html = fs.readFileSync(path.join(pub, 'app.html'), 'utf8');
const shells = fs.readFileSync(path.join(pub, 'shells.js'), 'utf8');
const os = fs.readFileSync(path.join(pub, 'os.js'), 'utf8');

// 找到外链 script 标签所在位置，替换为内联。用 indexOf + slice 拼接，绝不用 replace。
const tagShells = '<script src="shells.js"></script>';
const tagOs = '<script src="os.js"></script>';
const i1 = html.indexOf(tagShells);
const i2 = html.indexOf(tagOs);
if (i1 < 0 || i2 < 0) { console.error('外链 script 标签没找到，app.html 结构变了？'); process.exit(1); }

const out = [
  html.slice(0, i1),
  '<script>\n', shells, '\n</script>',
  html.slice(i1 + tagShells.length, i2),
  '<script>\n', os, '\n</script>',
  html.slice(i2 + tagOs.length)
].join('');

if (!fs.existsSync(dist)) fs.mkdirSync(dist);
const outFile = path.join(dist, '变大泡泡-单机版.html');
fs.writeFileSync(outFile, out);

// 自检：public 里的 $$ 数量必须与 dist 一致
const cnt = (s) => (s.match(/\$\$/g) || []).length;
const want = cnt(html) + cnt(shells) + cnt(os);
const got = cnt(out);
console.log(`dist 已生成：${outFile}`);
console.log(`$$ 自检：public=${want} dist=${got} ${want === got ? 'OK' : '!! 不一致'}`);
if (want !== got) process.exit(1);
