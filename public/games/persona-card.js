// 人格分享卡：型号插画 + 浏览器现画的信息条 + 站点二维码，合成 1024x1536 PNG
// 插画由 assets/mbti/paper/{型号}.png 提供（另一个窗口负责出图），本层不挑风格：
// 深色纸雕、白底卡通、黑白涂鸦都能吃，整图等比放进画面区，四周用取自图角的底色补齐。
// 调用：personaCard({ code, nm, fo, foNm, ax:[{d:'话',p:'拍',v:4}, ...4项] })
(function () {
  'use strict';

  var SITE = 'https://bianda-paopao.yiwang2457.workers.dev/';
  var KRAFT = '#C9A876', INK = '#221E1A', DIM = '#6B5A44', CODE = '#6B4A2F', GLOW = '#F5C56B';

  // 四种版式，各占一个传播位。尺寸不同是因为落地的地方不同，不是为了好看：
  //   full  1024x1536  朋友圈/小红书竖图，信息最全，默认
  //   card  1024x1024  微信聊天窗、微博配图，方图不会被裁头（省掉天敌行和品牌副行）
  //   strip 1080x608   群聊/公众号头图，横条，一眼看完
  //   badge 640x640    头像挂件/贴纸，只有型号和外号，最省地方
  // sub: 2=全套 1=省掉天敌行和副标 0=只有型号外号
  var LAYOUT = {
    full:  { w: 1024, h: 1536, art: 896,  qr: 5, name: 66, sub: 2 },
    card:  { w: 1024, h: 1024, art: 496,  qr: 4, name: 56, sub: 1 },
    strip: { w: 1080, h: 608,  art: 0,    qr: 4, name: 60, sub: 2 },
    badge: { w: 640,  h: 640,  art: 428,  qr: 3, name: 44, sub: 0 }
  };

  // 分享卡上的一句话。站内 mbti.js 那份评语是「盘点系统的口吻」，偏刻薄；
  // 发到社交平台的是这份，玩梗自嘲，不冲着人去。两份各归各用，不互相覆盖。
  var MEME = {
    PJBH: '你一个人，卷出了全组的进度条。',
    PJBC: '老板画的饼你都信，还顺手帮他买了面粉。',
    PJSH: '你的 PPT 跑得比锅还快。',
    PJSC: '你信老板的饼，老板信你的饼，双向奔赴。',
    PTBH: '方案能讲三小时，正文还停在第一行。',
    PTBC: '全公司都能使唤你，你还挺开心。',
    PTSH: '一年 87 页 PPT，转场动画全公司第一。',
    PTSC: '日历满得像春运，人是清闲的。',
    YJBH: '你不吭声，但最后大家用的是你那一版。',
    YJBC: '最靠得住的那个，也是最容易被漏写进述职的那个。',
    YJSH: '话不多，事全成，你想要的从来都拿到了。',
    YJSC: '不问为什么，只问什么时候交。',
    YTBH: '你的好点子，在别人的述职报告里过得很好。',
    YTBC: '你不是低调，你是懒得设防。',
    YTSH: '你早看穿了：饼是假的，摸鱼是真的。',
    YTSC: '上班的本质被你还原了——一段有工资的时间。'
  };

  /* ---------- GF(256) ---------- */
  var GEXP = [], GLOG = [];
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { GEXP[i] = x; GLOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
    for (var j = 255; j < 512; j++) GEXP[j] = GEXP[j - 255];
  })();

  function rsPoly(n) {
    var p = [1];
    for (var i = 0; i < n; i++) {
      var np = [];
      for (var k = 0; k <= p.length; k++) np[k] = 0;
      for (var j = 0; j < p.length; j++) {
        np[j] ^= p[j];
        np[j + 1] ^= GEXP[(GLOG[p[j]] + i) % 255];
      }
      p = np;
    }
    return p;
  }

  function rsEncode(data, ecLen) {
    var gen = rsPoly(ecLen), res = data.slice(), i, j;
    for (i = 0; i < ecLen; i++) res.push(0);
    for (i = 0; i < data.length; i++) {
      var f = res[i];
      if (!f) continue;
      var lf = GLOG[f];
      for (j = 0; j < gen.length; j++) res[i + j] ^= GEXP[(GLOG[gen[j]] + lf) % 255];
    }
    return res.slice(data.length);
  }

  /* ---------- QR：byte 模式，纠错 M，版本 1-6（版本 7 起才需版本信息区，用不到） ---------- */
  // 版本: [每块纠错码字, 块数, 每块数据码字]
  var EC = { 1: [10, 1, 16], 2: [16, 1, 28], 3: [26, 1, 44], 4: [18, 2, 32], 5: [24, 2, 43], 6: [16, 4, 27] };
  var ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };

  function utf8(s) {
    var b = [], i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 0x80) b.push(c);
      else if (c < 0x800) b.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else b.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return b;
  }

  function qrMatrix(text) {
    var data = utf8(text), ver = 0, v;
    for (v = 1; v <= 6; v++) if (EC[v][1] * EC[v][2] * 8 - 12 >= data.length * 8) { ver = v; break; }
    if (!ver) return null;

    var ecLen = EC[ver][0], nb = EC[ver][1], dlen = EC[ver][2], total = nb * dlen;
    var bits = [], i, j, k;
    function put(val, n) { for (var b = n - 1; b >= 0; b--) bits.push((val >> b) & 1); }
    put(4, 4); put(data.length, 8);
    for (i = 0; i < data.length; i++) put(data[i], 8);
    var cap = total * 8;
    put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    var pad = [0xEC, 0x11], pi = 0;
    while (bits.length < cap) put(pad[pi++ & 1], 8);

    var bytes = [];
    for (i = 0; i < bits.length; i += 8) {
      var b8 = 0;
      for (j = 0; j < 8; j++) b8 = (b8 << 1) | bits[i + j];
      bytes.push(b8);
    }

    var blocks = [], ecs = [];
    for (i = 0; i < nb; i++) {
      var blk = bytes.slice(i * dlen, (i + 1) * dlen);
      blocks.push(blk); ecs.push(rsEncode(blk, ecLen));
    }
    var out = [];
    for (i = 0; i < dlen; i++) for (j = 0; j < nb; j++) out.push(blocks[j][i]);
    for (i = 0; i < ecLen; i++) for (j = 0; j < nb; j++) out.push(ecs[j][i]);

    var size = 17 + 4 * ver;
    var m = [], fixed = [];
    for (i = 0; i < size; i++) { m.push([]); fixed.push([]); for (j = 0; j < size; j++) { m[i].push(null); fixed[i].push(false); } }
    function set(r, c, val) { if (r >= 0 && r < size && c >= 0 && c < size) { m[r][c] = val; fixed[r][c] = true; } }

    function finder(r, c) {
      for (var dr = -1; dr <= 7; dr++) for (var dc = -1; dc <= 7; dc++) {
        var inner = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        var on = inner && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
        set(r + dr, c + dc, on ? 1 : 0);
      }
    }
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

    for (i = 8; i < size - 8; i++) { set(6, i, i % 2 ? 0 : 1); set(i, 6, i % 2 ? 0 : 1); }

    var ap = ALIGN[ver];
    for (i = 0; i < ap.length; i++) for (j = 0; j < ap.length; j++) {
      var ar = ap[i], ac = ap[j];
      if ((ar === 6 && ac === 6) || (ar === 6 && ac === size - 7) || (ar === size - 7 && ac === 6)) continue;
      for (var dr2 = -2; dr2 <= 2; dr2++) for (var dc2 = -2; dc2 <= 2; dc2++) {
        var e = Math.max(Math.abs(dr2), Math.abs(dc2));
        set(ar + dr2, ac + dc2, e === 1 ? 0 : 1);
      }
    }
    set(4 * ver + 9, 8, 1);

    for (i = 0; i < 9; i++) { if (m[8][i] === null) set(8, i, 0); if (m[i][8] === null) set(i, 8, 0); }
    for (i = 0; i < 8; i++) { set(8, size - 1 - i, 0); set(size - 1 - i, 8, 0); }

    var dir = -1, row = size - 1, bi = 0;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (;;) {
        for (k = 0; k < 2; k++) {
          var cc = col - k;
          if (m[row][cc] === null) {
            var bit = 0;
            if (bi < out.length * 8) bit = (out[bi >> 3] >> (7 - (bi & 7))) & 1;
            bi++;
            m[row][cc] = bit;
          }
        }
        row += dir;
        if (row < 0 || row >= size) { row -= dir; dir = -dir; break; }
      }
    }

    var MASK = [
      function (r, c) { return (r + c) % 2 === 0; },
      function (r) { return r % 2 === 0; },
      function (r, c) { return c % 3 === 0; },
      function (r, c) { return (r + c) % 3 === 0; },
      function (r, c) { return ((r / 2 | 0) + (c / 3 | 0)) % 2 === 0; },
      function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; },
      function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; },
      function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }
    ];

    function penalty(g) {
      var s = 0, r, c, n, run, dark = 0;
      for (r = 0; r < size; r++) {
        run = 1;
        for (c = 1; c < size; c++) {
          if (g[r][c] === g[r][c - 1]) run++; else { if (run >= 5) s += 3 + run - 5; run = 1; }
        }
        if (run >= 5) s += 3 + run - 5;
      }
      for (c = 0; c < size; c++) {
        run = 1;
        for (r = 1; r < size; r++) {
          if (g[r][c] === g[r - 1][c]) run++; else { if (run >= 5) s += 3 + run - 5; run = 1; }
        }
        if (run >= 5) s += 3 + run - 5;
      }
      for (r = 0; r < size - 1; r++) for (c = 0; c < size - 1; c++) {
        var q = g[r][c];
        if (q === g[r][c + 1] && q === g[r + 1][c] && q === g[r + 1][c + 1]) s += 3;
      }
      var P1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], P2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
      function hit(get, len) {
        var t = 0, i2, j2, a, b;
        for (i2 = 0; i2 + 11 <= len; i2++) {
          a = true; b = true;
          for (j2 = 0; j2 < 11; j2++) { var vv = get(i2 + j2); if (vv !== P1[j2]) a = false; if (vv !== P2[j2]) b = false; }
          if (a) t += 40; if (b) t += 40;
        }
        return t;
      }
      for (r = 0; r < size; r++) s += hit((function (rr) { return function (x) { return g[rr][x]; }; })(r), size);
      for (c = 0; c < size; c++) s += hit((function (ccc) { return function (x) { return g[x][ccc]; }; })(c), size);
      for (r = 0; r < size; r++) for (c = 0; c < size; c++) if (g[r][c]) dark++;
      n = Math.abs(dark * 100 / (size * size) - 50) / 5 | 0;
      return s + n * 10;
    }

    function fmt(mask) {
      var d = mask, val = d << 10, i2;
      for (i2 = 4; i2 >= 0; i2--) if (val & (1 << (i2 + 10))) val ^= 0x537 << i2;
      return (((d << 10) | val) ^ 0x5412);
    }

    var best = null, bestScore = Infinity, bestMask = 0;
    for (var mk = 0; mk < 8; mk++) {
      var g = [];
      for (i = 0; i < size; i++) { g.push([]); for (j = 0; j < size; j++) g[i].push(fixed[i][j] ? m[i][j] : (m[i][j] ^ (MASK[mk](i, j) ? 1 : 0))); }
      var f = fmt(mk);
      for (k = 0; k < 15; k++) {
        var b2 = (f >> k) & 1;
        if (k < 6) g[8][k] = b2;
        else if (k === 6) g[8][7] = b2;
        else if (k === 7) g[8][8] = b2;
        else if (k === 8) g[7][8] = b2;
        else g[14 - k][8] = b2;
        if (k < 7) g[size - 1 - k][8] = b2;
        else g[8][size - 15 + k] = b2;
      }
      var sc = penalty(g);
      if (sc < bestScore) { bestScore = sc; best = g; bestMask = mk; }
    }
    return best;
  }

  /* ---------- 画布 ---------- */
  function drawQR(ctx, grid, x, y, box) {
    var n = grid.length, q = 4, side = (n + q * 2) * box;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, side, side);
    ctx.fillStyle = '#1A1613';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (grid[r][c]) ctx.fillRect(x + (c + q) * box, y + (r + q) * box, box, box);
    }
    return side;
  }

  function wrap(ctx, text, max) {
    var out = [], line = '';
    for (var i = 0; i < text.length; i++) {
      var t = line + text[i];
      if (ctx.measureText(t).width > max && line) { out.push(line); line = text[i]; }
      else line = t;
    }
    if (line) out.push(line);
    return out;
  }

  // 竖排信息条：full / card / badge 共用，插画在上、纸条在下
  function panel(ctx, o, T) {
    var L = T.w >= 1024 ? 64 : 44, top = T.art, y, i;
    ctx.fillStyle = KRAFT;
    ctx.fillRect(0, top, T.w, T.h - top);
    ctx.textBaseline = 'alphabetic';

    var grid = qrMatrix(SITE);
    var box = T.qr, side = (grid.length + 8) * box;
    var pad = T.w >= 1024 ? 56 : 36;
    var qx = T.w - L - side, qy = T.h - pad - side;
    drawQR(ctx, grid, qx, qy, box);

    // 信息条左栏宽度：始终避开二维码
    var CW = qx - L - 40;

    y = top + (T.sub ? 88 : 78);
    ctx.fillStyle = CODE;
    ctx.font = '700 ' + (T.sub ? 34 : 28) + 'px Consolas, "Courier New", monospace';
    var cs = o.code.split('');
    for (i = 0; i < cs.length; i++) ctx.fillText(cs[i], L + i * (T.sub ? 30 : 25), y);

    y += T.name + 16;
    ctx.fillStyle = INK;
    ctx.font = '700 ' + T.name + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(o.nm, L, y);

    // badge 只留型号和外号，不排四轴和评语——它是挂件，不是读物
    if (!T.sub) {
      ctx.fillStyle = DIM;
      ctx.font = '400 19px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText('变大泡泡 · 扫码测你的', L, y + 34);
      return;
    }

    y += 66;
    y = axes(ctx, o, L, y);

    y += 24;
    ctx.font = '500 27px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillStyle = INK;
    var ln = wrap(ctx, o.meme || MEME[o.code] || '', CW);
    for (i = 0; i < ln.length && i < 3; i++) { ctx.fillText(ln[i], L, y); y += 38; }

    // card 版纸条矮，天敌行和品牌副行会顶出卡外，只留品牌一行
    if (T.sub < 2) {
      ctx.fillStyle = INK;
      ctx.font = '700 24px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText('变大泡泡 · 话卷锅饼测试', L, qy + side - 4);
      return;
    }

    y += 4;
    ctx.font = '400 21px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillStyle = DIM;
    ctx.fillText('天敌型号　' + o.fo + '「' + o.foNm + '」', L, y);

    y = qy + side - 58;
    ctx.fillStyle = INK;
    ctx.font = '700 26px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('变大泡泡 · 话卷锅饼测试', L, y);
    y += 36;
    ctx.fillStyle = DIM;
    ctx.font = '400 21px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('扫右边的码，测你自己的', L, y);
  }

  // 四根维度条，返回画完之后的 y
  function axes(ctx, o, L, y) {
    var BW = 30, BH = 17, BG = 8;
    for (var i = 0; i < o.ax.length; i++) {
      var a = o.ax[i];
      ctx.font = '500 24px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillStyle = DIM;
      ctx.fillText(a.d, L, y);
      ctx.fillStyle = INK;
      ctx.fillText(a.p, L + 44, y);
      for (var k = 0; k < 4; k++) {
        ctx.fillStyle = k < a.v ? GLOW : 'rgba(34,30,26,.16)';
        ctx.fillRect(L + 156 + k * (BW + BG), y - 15, BW, BH);
      }
      ctx.fillStyle = DIM;
      ctx.font = '500 21px Consolas, monospace';
      ctx.fillText(a.v + '/4', L + 156 + 4 * (BW + BG) + 16, y);
      y += 42;
    }
    return y;
  }

  // 横条：左边立绘，右边文字，给群聊和公众号头图用
  function strip(ctx, o, img, T) {
    var gr = ctx.createLinearGradient(0, 0, 0, T.h);
    gr.addColorStop(0, '#D7BA90');
    gr.addColorStop(1, '#C0A06C');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, T.w, T.h);
    ctx.textBaseline = 'alphabetic';

    var AW = 420;
    if (img) {
      var k = Math.min(AW / img.width, (T.h - 24) / img.height);
      var dw = img.width * k, dh = img.height * k;
      ctx.drawImage(img, (AW - dw) / 2, T.h - dh - 12, dw, dh);
    }

    var L = AW + 28, y;
    var grid = qrMatrix(SITE);
    var box = T.qr, side = (grid.length + 8) * box;
    var qx = T.w - 44 - side, qy = (T.h - side) / 2;
    drawQR(ctx, grid, qx, qy, box);
    var CW = qx - L - 36;

    y = 92;
    ctx.fillStyle = CODE;
    ctx.font = '700 30px Consolas, "Courier New", monospace';
    var cs = o.code.split('');
    for (var i = 0; i < cs.length; i++) ctx.fillText(cs[i], L + i * 27, y);

    y += T.name + 14;
    ctx.fillStyle = INK;
    ctx.font = '700 ' + T.name + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(o.nm, L, y);

    y += 54;
    y = axes(ctx, o, L, y);

    y += 20;
    ctx.font = '500 25px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillStyle = INK;
    var ln = wrap(ctx, o.meme || MEME[o.code] || '', CW);
    for (i = 0; i < ln.length && i < 2; i++) { ctx.fillText(ln[i], L, y); y += 34; }

    ctx.fillStyle = DIM;
    ctx.font = '400 20px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('变大泡泡 · 话卷锅饼测试　扫码测你自己的', L, T.h - 40);
  }

  // 插画区底色：透明底的立绘（paper/ 那批）取角只会读到全 0，铺深色纸背；
  // 白底卡通、深色纸雕这类不透明图则取四角均色补边，主体一律等比放进去不裁。
  function artBg(ctx, img, T) {
    var p = document.createElement('canvas');
    p.width = img.width; p.height = img.height;
    var pc = p.getContext('2d', { willReadFrequently: true });
    pc.drawImage(img, 0, 0);
    var r = 0, g = 0, b = 0, a = 0, n = 0, s = Math.max(2, Math.min(img.width, img.height) >> 5);
    var spots = [[0, 0], [img.width - s, 0], [0, img.height - s], [img.width - s, img.height - s]];
    for (var i = 0; i < spots.length; i++) {
      var d = pc.getImageData(spots[i][0], spots[i][1], s, s).data;
      for (var j = 0; j < d.length; j += 4) { r += d[j]; g += d[j + 1]; b += d[j + 2]; a += d[j + 3]; n++; }
    }
    if (a / n < 24) {   // 四角基本透明 = 抠好的立绘
      var gr = ctx.createLinearGradient(0, 0, 0, T.art);
      gr.addColorStop(0, '#243049');
      gr.addColorStop(1, '#141B2A');
      ctx.fillStyle = gr;
    } else {
      ctx.fillStyle = 'rgb(' + (r / n | 0) + ',' + (g / n | 0) + ',' + (b / n | 0) + ')';
    }
    ctx.fillRect(0, 0, T.w, T.art);
  }

  function art(ctx, img, T) {
    artBg(ctx, img, T);
    var k = Math.min(T.w / img.width, T.art / img.height);
    var dw = img.width * k, dh = img.height * k;
    ctx.drawImage(img, (T.w - dw) / 2, (T.art - dh) / 2, dw, dh);
  }

  function build(o, cb) {
    var T = LAYOUT[o.layout] || LAYOUT.full;
    var cv = document.createElement('canvas');
    cv.width = T.w; cv.height = T.h;
    var ctx = cv.getContext('2d');
    var img = new Image();
    function draw(ok) {
      if (T.art === 0) { strip(ctx, o, ok ? img : null, T); }
      else if (ok) { art(ctx, img, T); panel(ctx, o, T); }
      else { ctx.fillStyle = '#1B2436'; ctx.fillRect(0, 0, T.w, T.art); panel(ctx, o, T); }
      cb(cv);
    }
    img.onload = function () { draw(true); };
    img.onerror = function () { draw(false); };
    // 性别版本由 mbti.js 传进来，保证卡上的人和站内画像是同一个；单独调用时兜底 m
    img.src = 'assets/mbti/paper/' + o.code + '-' + (o.sex === 'f' ? 'f' : 'm') + '.png';
  }

  window.personaCardPreview = build;

  window.personaCard = function (o, done) {
    build(o, function (cv) {
      var sfx = o.layout && o.layout !== 'full' ? '-' + o.layout : '';
      var name = '变大泡泡-' + o.code + '-' + o.nm + sfx + '.png';
      function save(url) {
        var a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        if (done) done(name);
      }
      try {
        cv.toBlob(function (b) {
          var u = URL.createObjectURL(b);
          save(u);
          setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
        }, 'image/png');
      } catch (e) {
        save(cv.toDataURL('image/png'));
      }
    });
  };
})();
