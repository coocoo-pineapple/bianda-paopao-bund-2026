// 人格名片：一张 PNG，上下两联，正面是立绘，背面是人格报告，背面右下带站点二维码
// 立绘由 assets/mbti/paper/{型号}-{m|f}.png 提供（另一个窗口负责出图），是 512 方图，
// 所以名片按 90x54mm 横版排：右半张 648x648 正好等于卡高，方图零裁切零留白。
// 调用：personaCard({ code, nm, fo, foNm, bd, bdNm, mb, st, sex, rt, rr, tg:[三个标签],
//        sk 超能力, bg 致命bug, sy 口头禅, ax:[{d:'话',p:'拍',v:4,mx:4}, ...4项] })
(function () {
  'use strict';

  var SITE = 'https://bianda-paopao.yiwang2457.workers.dev/';
  var KRAFT = '#C9A876', INK = '#221E1A', DIM = '#6B5A44', CODE = '#6B4A2F', GLOW = '#F5C56B';

  // 名片 90x54mm，1080x648 就是它的整数倍。ART 既是右半张的宽也是卡的高——方图正好铺满
  var CW = 1080, CH = 648, ART = 648, PAD = 40, GAP = 34, R = 18;
  var UI = '"Microsoft YaHei", "PingFang SC", sans-serif';
  var MONO = 'Consolas, "Courier New", monospace';

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
    // 格式信息占位。第二份在 8 列上只占 size-1 到 size-7 这 7 格，
    // 第 size-8 格是那颗固定黑模块——所以黑模块必须等占位跑完再放，否则会被抹掉
    for (i = 0; i < 9; i++) { if (m[8][i] === null) set(8, i, 0); if (m[i][8] === null) set(i, 8, 0); }
    for (i = 0; i < 8; i++) { set(8, size - 1 - i, 0); if (i < 7) set(size - 1 - i, 8, 0); }
    set(4 * ver + 9, 8, 1);

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
      // 15 位格式信息，低位在先。第一份沿 8 列往下再拐到 8 行往左；
      // 第二份低 8 位铺在 8 行右端、高 7 位铺在 8 列下端。两份的走向是反的，不能照抄
      for (k = 0; k < 15; k++) {
        var b2 = (f >> k) & 1;
        if (k < 6) g[k][8] = b2;
        else if (k === 6) g[7][8] = b2;
        else if (k === 7) g[8][8] = b2;
        else if (k === 8) g[8][7] = b2;
        else g[8][14 - k] = b2;
        if (k < 8) g[8][size - 1 - k] = b2;
        else g[size - 15 + k][8] = b2;
      }
      var sc = penalty(g);
      if (sc < bestScore) { bestScore = sc; best = g; bestMask = mk; }
    }
    return best;
  }

  /* ---------- 画布小工具 ---------- */
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

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 字距只能自己摆：canvas 没有 letter-spacing
  function track(ctx, s, x, y, gap) {
    for (var i = 0; i < s.length; i++) {
      ctx.fillText(s[i], x, y);
      x += ctx.measureText(s[i]).width + gap;
    }
  }

  // 卡片底板：先投影再填白，之后正反面各自 clip 进去画
  function plate(ctx, x, y) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#0C0F14';
    rrect(ctx, x, y, CW, CH, R);
    ctx.fill();
    ctx.restore();
  }

  /* ---------- 正面：左边报名号，右边整张立绘 ---------- */
  function front(ctx, o, img, x, y) {
    plate(ctx, x, y);
    ctx.save();
    rrect(ctx, x, y, CW, CH, R);
    ctx.clip();

    var g = ctx.createLinearGradient(x, y, x + CW, y + CH);
    g.addColorStop(0, '#26324B');
    g.addColorStop(1, '#111823');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, CW, CH);

    // 立绘是 512 方图，右半张正好也是正方形：整张贴进去，不裁不留白。
    // 图本身是透明底，压在渐变上就没有接缝，不用再罩一层过渡（罩了反而多一道竖边）
    if (img) ctx.drawImage(img, x + CW - ART, y, ART, ART);

    var L = x + 56;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = GLOW;
    ctx.font = '700 30px ' + MONO;
    track(ctx, o.code, L, y + 242, 12);

    ctx.fillStyle = '#F6EEDD';
    ctx.font = '700 54px ' + UI;
    ctx.fillText(o.nm, L, y + 318);

    ctx.fillStyle = 'rgba(245,197,107,.75)';
    ctx.fillRect(L, y + 350, 88, 3);

    ctx.fillStyle = 'rgba(233,222,200,.62)';
    ctx.font = '400 21px ' + UI;
    ctx.fillText('变大泡泡 · 话卷锅饼测试', L, y + 400);
    ctx.fillStyle = 'rgba(233,222,200,.4)';
    ctx.font = '400 18px ' + UI;
    ctx.fillText('背面是你的人格报告', L, y + 432);

    ctx.restore();
    edge(ctx, x, y, 'rgba(245,197,107,.28)');
  }

  /* ---------- 背面：人格报告 ---------- */
  function back(ctx, o, x, y) {
    plate(ctx, x, y);
    ctx.save();
    rrect(ctx, x, y, CW, CH, R);
    ctx.clip();
    ctx.fillStyle = KRAFT;
    ctx.fillRect(x, y, CW, CH);
    ctx.textBaseline = 'alphabetic';

    var L = x + 56;

    // 二维码钉在右下，正文列一律避开它。右上那条窄边留给出场率和落款。
    // box=5 是发到手机上还扫得动的下限，再小每个模块不到半毫米
    var grid = qrMatrix(SITE), box = 5, side = (grid.length + 8) * box;
    var qx = x + CW - 56 - side, qy = y + CH - 52 - side;
    drawQR(ctx, grid, qx, qy, box);
    ctx.fillStyle = DIM;
    ctx.font = '400 17px ' + UI;
    ctx.fillText('扫码测你自己的', qx, qy - 16);
    var TW = qx - L - 40;

    if (o.rt != null) {
      ctx.fillStyle = DIM;
      ctx.font = '400 17px ' + UI;
      ctx.fillText('出场率', qx, y + 92);
      ctx.fillStyle = CODE;
      ctx.font = '700 42px ' + MONO;
      ctx.fillText(o.rt + '%', qx, y + 140);
      ctx.fillStyle = DIM;
      ctx.font = '400 17px ' + UI;
      ctx.fillText(o.rr || '', qx, y + 170);
    }
    ctx.fillStyle = CODE;
    ctx.font = '700 21px ' + UI;
    ctx.fillText('变大泡泡', qx, y + 296);
    ctx.fillText('话卷锅饼测试', qx, y + 324);

    ctx.fillStyle = CODE;
    ctx.font = '700 26px ' + MONO;
    track(ctx, o.code, L, y + 78, 11);

    ctx.fillStyle = INK;
    ctx.font = '700 44px ' + UI;
    ctx.fillText(o.nm, L, y + 132);

    tags(ctx, o.tg || [], L, y + 152);

    ctx.fillStyle = 'rgba(34,30,26,.22)';
    ctx.fillRect(L, y + 204, TW, 2);

    axes(ctx, o, L, y + 220);

    ctx.fillStyle = INK;
    ctx.font = '500 27px ' + UI;
    var ln = wrap(ctx, o.meme || MEME[o.code] || '', TW), yy = y + 306;
    for (var i = 0; i < ln.length && i < 2; i++) { ctx.fillText(ln[i], L, yy); yy += 36; }

    ctx.font = '400 20px ' + UI;
    spec(ctx, '#3C8C4E', '超能力', o.sk || '', L, y + 392, TW);
    spec(ctx, '#B5564A', '致命 bug', o.bg || '', L, y + 432, TW);
    spec(ctx, '#8A6A3A', '口头禅', o.sy ? '「' + o.sy + '」' : '', L, y + 472, TW);

    kv(ctx, '对照 MBTI', o.mb || '', L, y + 520, TW);
    kv(ctx, '搭子·天敌',
      (o.bd ? o.bd + '「' + o.bdNm + '」' : '') + (o.fo ? '　克 ' + o.fo + '「' + o.foNm + '」' : ''),
      L, y + 556, TW);
    kv(ctx, '建议工位', o.st || '', L, y + 592, TW);

    ctx.restore();
    edge(ctx, x, y, 'rgba(107,74,47,.3)');
  }

  // 三个人格标签，一排小签
  function tags(ctx, list, x, y) {
    var H = 32;
    ctx.font = '500 19px ' + UI;
    for (var i = 0; i < list.length; i++) {
      var w = ctx.measureText(list[i]).width + 26;
      ctx.fillStyle = 'rgba(107,74,47,.13)';
      rrect(ctx, x, y, w, H, H / 2);
      ctx.fill();
      ctx.fillStyle = CODE;
      ctx.fillText(list[i], x + 13, y + 22);
      x += w + 9;
    }
  }

  // 一行「· 标签　正文」，左边一个小圆点分正负
  function spec(ctx, dot, k, v, x, y, max) {
    if (!v) return;
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(x + 5, y - 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = DIM;
    ctx.fillText(k, x + 22, y);
    ctx.fillStyle = INK;
    var vx = x + 134, room = max - 134, s = v;
    while (s && ctx.measureText(s).width > room) s = s.slice(0, -1);
    if (s !== v) s = s.slice(0, -1) + '…';
    ctx.fillText(s, vx, y);
  }

  // 一行「标签　内容」，内容超宽就截断加省略号，绝不压到二维码上。标签列宽与 spec 对齐
  function kv(ctx, k, v, x, y, max) {
    ctx.fillStyle = DIM;
    ctx.fillText(k, x, y);
    ctx.fillStyle = INK;
    var vx = x + 134, room = max - 134, s = v;
    while (s && ctx.measureText(s).width > room) s = s.slice(0, -1);
    if (s !== v) s = s.slice(0, -1) + '…';
    ctx.fillText(s, vx, y);
  }

  // 四维横着排成一行标签。mx = 该维度的题量，一维一题时没有强弱可言，只留结论
  function axes(ctx, o, L, y) {
    var H = 44, x = L;
    for (var i = 0; i < o.ax.length; i++) {
      var a = o.ax[i], mx = a.mx == null ? 4 : a.mx;
      var tail = mx > 1 ? ' ' + a.v + '/' + mx : '';
      ctx.font = '500 23px ' + UI;
      var w = ctx.measureText(a.d + ' · ' + a.p + tail).width + 34;
      ctx.fillStyle = 'rgba(255,252,244,.34)';
      rrect(ctx, x, y, w, H, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(34,30,26,.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      var tx = x + 17, ty = y + 31;
      ctx.fillStyle = DIM;
      ctx.fillText(a.d + ' · ', tx, ty);
      tx += ctx.measureText(a.d + ' · ').width;
      ctx.fillStyle = INK;
      ctx.fillText(a.p, tx, ty);
      if (tail) {
        tx += ctx.measureText(a.p).width;
        ctx.fillStyle = DIM;
        ctx.font = '500 19px ' + MONO;
        ctx.fillText(tail, tx, ty);
      }
      x += w + 14;
    }
    return y + H;
  }

  function edge(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    rrect(ctx, x + 1, y + 1, CW - 2, CH - 2, R - 1);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 合图：正反两联叠在一张纸上 ---------- */
  function build(o, cb) {
    var lay = o.layout === 'front' || o.layout === 'back' ? o.layout : 'both';
    var both = lay === 'both';
    var w = CW + PAD * 2, hgt = both ? CH * 2 + GAP + PAD * 2 : CH + PAD * 2;
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = hgt;
    var ctx = cv.getContext('2d');
    var img = new Image();

    function draw(ok) {
      var bg = ctx.createLinearGradient(0, 0, 0, hgt);
      bg.addColorStop(0, '#221C15');
      bg.addColorStop(1, '#141019');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, hgt);
      if (both) {
        front(ctx, o, ok ? img : null, PAD, PAD);
        back(ctx, o, PAD, PAD + CH + GAP);
      } else if (lay === 'front') {
        front(ctx, o, ok ? img : null, PAD, PAD);
      } else {
        back(ctx, o, PAD, PAD);
      }
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
      var sfx = o.layout === 'front' ? '-正面' : o.layout === 'back' ? '-背面' : '-名片';
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
