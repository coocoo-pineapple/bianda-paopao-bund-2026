// 人格分享卡：纸雕背景图 + 浏览器现画的信息条 + 站点二维码，合成 1024x1536 PNG
// 调用方（mbti.js）自己算好数据传进来，本文件不持有 TYPES，避免文案出现第二份真源：
//   personaCard({ code, nm, st, fo, foNm, ax:[{d:'话',p:'拍',v:4}, ...4项] })
(function () {
  'use strict';

  var SITE = 'https://bianda-paopao.yiwang2457.workers.dev/';
  var W = 1024, H = 1536, ART = 1024;
  var KRAFT = '#C9A876', INK = '#221E1A', DIM = '#6B5A44', CODE = '#6B4A2F', GLOW = '#F5C56B';

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

  function panel(ctx, o) {
    var L = 64, top = ART, y;
    ctx.fillStyle = KRAFT;
    ctx.fillRect(0, top, W, H - top);

    ctx.fillStyle = CODE;
    ctx.font = '700 32px Consolas, "Courier New", monospace';
    ctx.textBaseline = 'alphabetic';
    var cs = o.code.split('');
    for (var i = 0; i < cs.length; i++) ctx.fillText(cs[i], L + i * 28, top + 74);

    ctx.fillStyle = INK;
    ctx.font = '700 62px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(o.nm, L, top + 148);

    y = top + 202;
    var BW = 28, BH = 16, BG = 7;
    for (i = 0; i < o.ax.length; i++) {
      var a = o.ax[i];
      ctx.font = '500 23px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillStyle = DIM;
      ctx.fillText(a.d, L, y + 16);
      ctx.fillStyle = INK;
      ctx.fillText(a.p, L + 42, y + 16);
      for (var k = 0; k < 4; k++) {
        ctx.fillStyle = k < a.v ? GLOW : 'rgba(34,30,26,.16)';
        ctx.fillRect(L + 148 + k * (BW + BG), y + 3, BW, BH);
      }
      ctx.fillStyle = DIM;
      ctx.font = '500 20px Consolas, monospace';
      ctx.fillText(a.v + '/4', L + 148 + 4 * (BW + BG) + 14, y + 16);
      y += 36;
    }

    var grid = qrMatrix(SITE);
    var box = 5, side = (grid.length + 8) * box;
    var qx = W - 64 - side, qy = H - 60 - side;

    y += 20;
    ctx.font = '400 21px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillStyle = DIM;
    var wide = W - L - 64;
    var ln = wrap(ctx, '建议工位　' + o.st, wide);
    for (i = 0; i < ln.length && i < 2; i++) { ctx.fillText(ln[i], L, y); y += 30; }
    ctx.fillText('天敌型号　' + o.fo + '「' + o.foNm + '」', L, y);

    drawQR(ctx, grid, qx, qy, box);
    ctx.fillStyle = INK;
    ctx.font = '700 24px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('变大泡泡 · 职场型号盘点', L, qy + side - 46);
    ctx.fillStyle = DIM;
    ctx.font = '400 20px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText('扫右边的码，测你自己的', L, qy + side - 12);
  }

  function build(o, cb) {
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0, ART, ART);
      panel(ctx, o);
      cb(cv);
    };
    img.onerror = function () {
      ctx.fillStyle = '#1B2436';
      ctx.fillRect(0, 0, W, ART);
      panel(ctx, o);
      cb(cv);
    };
    img.src = 'assets/persona/' + o.code + '.png';
  }

  window.personaCardPreview = build;

  window.personaCard = function (o, done) {
    build(o, function (cv) {
      var name = '变大泡泡-' + o.code + '-' + o.nm + '.png';
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
