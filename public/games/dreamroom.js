// 梦蝶议事厅 · Teams「会议 + 与会人 + 麦克风」
// 伪装选 Teams 不是随便挑的：一场四个人的会、左边一列与会人、下面一个麦克风按钮，
// 语音输入在这里是原生控件，不是硬塞的炫技。
//
// 和隔壁「梦蝶局卡牌」的分工：那边是 AI 的信誉考场（有输赢、有战绩）；
// 这边是人的议事厅——你把想不通的事摆上桌，雇 AI 去演那几个当事人，看他们各自在意什么。
// 两个入口并存，这边当正门。
//
// 一条红线：每个座位一次独立 askAI，system 互不包含别人的设定；
// 谁调通了谁挂「真」，调不通挂「脚」，逐座位标，不整局一刀切。
(function () {
  'use strict';
  var K = window.BPKit;
  if (!K) return;

  var MAXR = 4;              // 除「你」之外最多四个人：开局调用数 = 人数 + 1，封住成本
  var HIRE = '¥29';

  // 默认这一局：判决权最模糊、每个人的利害最不一样的那类事
  var DEMO = {
    q: '我带的项目跑赢目标 30%。上周复盘会，组长一句「团队协作的结果」就带过去了，我的名字一次没出现。\n我要不要争？争了会怎样？',
    roles: [
      { nm: '组长', rel: '我的直属上级，这个项目挂在他名下', care: '他要的是稳，不想组里出头的人太扎眼' },
      { nm: '小李', rel: '同组，项目里跟我配合的人', care: '' },
      { nm: 'HRBP 李姐', rel: '管我们组绩效的 HR', care: '' }
    ]
  };

  var SEATS = [
    { v: '', nm: '平台 AI', tip: '社区自带' },
    { v: 'mine', nm: '我的机器人', tip: '用你在工坊填的人格' },
    { v: 'hire', nm: '雇来的分身', tip: HIRE + ' · 演示计价' }
  ];

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function micWhy() {
    if (location.protocol === 'file:') return '单机版打不开语音，直接打字';
    if (!SR) return '这个浏览器不支持语音，直接打字';
    return '';
  }

  // ---- 四行定式：模型和脚本走同一个结构，界面不用分两套 ----
  var FIELD = [
    { k: 'open', pre: '明面', nm: '他明面上要的' },
    { k: 'fear', pre: '底下', nm: '他底下真正怕的' },
    { k: 'line', pre: '那根线', nm: '你踩到他哪根线' }
  ];

  function parse4(txt) {
    var o = { open: '', fear: '', line: '', say: '' };
    String(txt || '').split(/\r?\n/).forEach(function (raw) {
      var s = raw.trim().replace(/^[-*\d.、]\s*/, '');
      if (/^明面/.test(s)) o.open = tail(s);
      else if (/^底下/.test(s)) o.fear = tail(s);
      else if (/^那根线/.test(s)) o.line = tail(s);
      else if (/^原话/.test(s)) o.say = tail(s);
    });
    return o;
  }
  function parse2(txt) {
    var o = { re: '', in_: '' };
    String(txt || '').split(/\r?\n/).forEach(function (raw) {
      var s = raw.trim().replace(/^[-*\d.、]\s*/, '');
      if (/^反应/.test(s)) o.re = tail(s);
      else if (/^心里/.test(s)) o.in_ = tail(s);
    });
    return o;
  }
  function tail(s) { return s.replace(/^[^：:]*[：:]\s*/, '').replace(/^[（(]|[）)]$/g, '').trim(); }
  function full(o) { return o.open && o.fear && o.line; }

  // ---- 脚本兜底：调不通时也得是一局像样的戏，但必须挂「脚」 ----
  function fbRole(r) {
    return {
      open: '我要的是这事有个说得过去的结论。',
      fear: '怕这口锅最后落在我头上。',
      line: '你把它摆上桌，就等于逼我表态。',
      say: '这事我们私下再对一下，别在会上聊。'
    };
  }
  function fbMe() {
    return {
      open: '我要一句公道话，把我的名字说出来。',
      fear: '怕开了这个口，被看成计较的人。',
      line: '你其实在等有人替你说，而不是自己说。',
      say: '算了，也没那么重要。'
    };
  }
  function fbReact(r) {
    return { re: '你这话我听见了，我回头想想。', in_: '他这是要摊牌了。' };
  }

  K.ready(function () {
    if (typeof registerGame !== 'function') return;

    registerGame({
      id: 'winDreamRoom', app: 'chat', go: 'dreamroom',
      title: '项目复盘 · 对齐会（4 人）- Microsoft Teams',
      style: 'left:150px;top:64px;width:940px;height:598px',
      tile: ['议', '梦蝶议事厅', '想不通的事，摆上桌', '#0089FF'],
      hall: { nm: '梦蝶议事厅', by: '官方', tip: 88 }
    });

    var h = K.shell({
      win: 'winDreamRoom',
      title: '项目复盘 · 对齐会（4 人）- Microsoft Teams',
      side: true, crumb: false, save: 'dreamroom'
    });
    if (!h) return;
    var hud = h.hud, fx = h.fx, sfx = h.sfx, sv = h.save;

    h.css(
      '.dwb{background:#F5F5F5}' +
      '.k-side{width:222px;background:#EDEBE9}' +
      '.dr-h{font-size:12px;color:#605E5C;margin:0 0 6px}' +
      '.dr-q{width:100%;min-height:84px;box-sizing:border-box;padding:8px 9px;border:1px solid #C8C6C4;' +
      '  border-radius:4px;font:13px/1.65 inherit;resize:vertical;background:#fff}' +
      '.dr-q:focus{outline:0;border-color:#0089FF;box-shadow:0 0 0 1px #0089FF}' +
      '.dr-bar{display:flex;align-items:center;gap:6px;margin:6px 0 12px;flex-wrap:wrap}' +
      '.dr-mic{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border:1px solid #C8C6C4;' +
      '  background:#fff;border-radius:14px;cursor:pointer;font-size:12px}' +
      '.dr-mic i{width:8px;height:8px;border-radius:50%;background:#8A8886;display:inline-block}' +
      '.dr-mic[disabled]{opacity:.55;cursor:not-allowed}' +
      '.dr-mic.rec{border-color:#C43E1C;color:#C43E1C}' +
      '.dr-mic.rec i{background:#C43E1C;animation:k-glow 1.2s infinite}' +
      '.dr-ex{font-size:12px;color:#0F6CBD;cursor:pointer;text-decoration:underline dotted}' +
      '.dr-tb{width:100%;border-collapse:collapse;font-size:12px;background:#fff;border:1px solid #E1DFDD}' +
      '.dr-tb th{background:#FAF9F8;font-weight:600;color:#605E5C;text-align:left;padding:5px 7px;border-bottom:1px solid #E1DFDD}' +
      '.dr-tb td{padding:4px 6px;border-bottom:1px solid #F0EFEE;vertical-align:middle}' +
      '.dr-tb input{width:100%;box-sizing:border-box;padding:4px 5px;border:1px solid #DDD;border-radius:3px;font:12px inherit}' +
      '.dr-tb input:focus{outline:0;border-color:#0089FF}' +
      '.dr-tb select{padding:3px;border:1px solid #DDD;border-radius:3px;font:12px inherit;background:#fff}' +
      '.dr-tb tr.me td{background:#F3F9FF}' +
      '.dr-x{border:0;background:none;color:#A19F9D;cursor:pointer;font-size:14px;line-height:1}' +
      '.dr-x:hover{color:#C43E1C}' +
      '.dr-b{padding:5px 14px;border:1px solid #C8C6C4;background:#fff;border-radius:3px;cursor:pointer;font:12px inherit}' +
      '.dr-b:hover{background:#F3F2F1}' +
      '.dr-b.pri{background:#0089FF;border-color:#0089FF;color:#fff}' +
      '.dr-b.pri:hover{background:#0078D4}' +
      '.dr-b[disabled]{opacity:.5;cursor:not-allowed}' +
      '.dr-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(228px,1fr));gap:9px;margin-top:4px}' +
      '.dr-c{background:#fff;border:1px solid #E1DFDD;border-radius:5px;padding:9px 10px;position:relative}' +
      '.dr-c.me{border-color:#0089FF;box-shadow:inset 3px 0 0 #0089FF}' +
      '.dr-c h4{margin:0 0 1px;font-size:13px}' +
      '.dr-c .rel{font-size:11px;color:#8A8886;margin-bottom:7px}' +
      '.dr-f{margin-bottom:6px}' +
      '.dr-f b{display:block;font-size:10px;color:#8A8886;font-weight:600;letter-spacing:.4px}' +
      '.dr-f span{font-size:12px;line-height:1.55}' +
      '.dr-f.fear span{color:#C43E1C}' +
      '.dr-say{margin-top:7px;padding:6px 8px;background:#F5F5F5;border-radius:3px;border-left:2px solid #C8C6C4;' +
      '  font-size:12px;line-height:1.55;color:#3B3A39}' +
      '.dr-bg{position:absolute;right:7px;top:7px;font-size:10px;padding:0 5px;border-radius:8px;line-height:15px}' +
      '.dr-bg.real{background:#DFF6DD;color:#0B6A0B}' +
      '.dr-bg.scr{background:#FDE7E9;color:#A4262C}' +
      '.dr-bg.wait{background:#F0EFEE;color:#8A8886}' +
      '.dr-cmp{margin-top:12px;background:#fff;border:1px solid #E1DFDD;border-radius:5px;padding:9px 11px}' +
      '.dr-cmp h4{margin:0 0 2px;font-size:12px}' +
      '.dr-cmp .dr-h{margin-bottom:7px}' +
      '.dr-cmp li{font-size:12px;line-height:1.75;list-style:none}' +
      '.dr-cmp li b{color:#C43E1C;font-weight:600}' +
      '.dr-cmp li em{font-style:normal;color:#605E5C}' +
      '.dr-say2{display:flex;gap:6px;margin-top:11px}' +
      '.dr-say2 input{flex:1;padding:6px 9px;border:1px solid #C8C6C4;border-radius:3px;font:13px inherit}' +
      '.dr-say2 input:focus{outline:0;border-color:#0089FF}' +
      '.dr-note{font-size:12px}' +
      '.dr-note .re{line-height:1.6}' +
      '.dr-note .in{color:#8A8886;margin-top:3px;line-height:1.5}' +
      '.dr-note .in:before{content:"（心里）"}' +
      '.dr-warn{font-size:11px;color:#8A8886;margin-top:9px;line-height:1.7}'
    );

    // ---------------- 状态 ----------------
    var G = { q: '', roles: [], out: {}, src: {}, calls: 0, real: 0, turns: 0 };
    var rec = null, recOn = false;

    function seats() {
      // 「你」永远是最后一位：AI 也演一个你，这样这一局才不是你自己的回声
      return G.roles.concat([{ nm: '「你」', rel: '当事人本人，由 AI 扮演', care: '', from: '', me: true }]);
    }

    function foot() {
      hud.foot(['与会 ' + seats().length + ' 人', '独立调用 ' + G.calls + ' 次'],
        G.calls ? ('真 ' + G.real + ' · 脚 ' + (G.calls - G.real)) : '尚未调用');
    }

    // ---------------- 立案 ----------------
    function intro() {
      G.roles = DEMO.roles.map(function (r) { return { nm: r.nm, rel: r.rel, care: r.care, from: '' }; });
      G.out = {}; G.src = {}; G.calls = 0; G.real = 0; G.turns = 0;
      hud.title('立案');
      hud.tool('<b style="font-size:12px">梦蝶议事厅</b>' +
        '<span style="font-size:11px;color:#605E5C">你说事，AI 演人，看各自在意什么</span>', '第 1 步 / 共 2 步');
      hud.clearNotes();
      h.side.innerHTML = '<div class="dr-h" style="padding:2px">这里会显示每个人的现场反应。<br><br>' +
        '先在左边把事情说清楚，再把这件事里的人写上。<br><br>' +
        '最后一位固定是「你」——也由 AI 来演。<b>让 AI 也演一个你，是为了防止这一局变成你自己的回声。</b></div>';

      var s = h.states.intro;
      s.innerHTML =
        '<p class="dr-h">把想不通的那件事讲出来，讲得越具体，等会儿这几个人越像人。</p>' +
        '<textarea class="dr-q" id="drQ" placeholder="比如：我做的项目跑赢目标 30%，复盘会上功劳被组长一句话带过……"></textarea>' +
        '<div class="dr-bar">' +
        '  <button class="dr-mic" data-dr="mic"><i></i><span>按住不用，点一下说话</span></button>' +
        '  <span class="dr-ex" data-dr="demo">用这个例子填上</span>' +
        '  <span style="font-size:11px;color:#8A8886" id="drMicWhy"></span>' +
        '</div>' +
        '<p class="dr-h">这件事里有谁。<b>他在意什么可以留空</b>——留空就让他自己说，你猜的那一栏他有权推翻。</p>' +
        '<table class="dr-tb"><thead><tr><th style="width:96px">谁</th><th style="width:34%">和你什么关系</th>' +
        '<th>你猜他在意什么</th><th style="width:104px">谁来演</th><th style="width:20px"></th></tr></thead>' +
        '<tbody id="drRows"></tbody></table>' +
        '<div class="dr-bar" style="margin-top:9px">' +
        '  <button class="dr-b" data-dr="add">＋ 再加一个人</button>' +
        '  <button class="dr-b pri" data-dr="go" style="margin-left:auto">开局 · 让他们各自说话</button>' +
        '</div>' +
        '<div class="dr-warn" id="drWarn"></div>';

      var w = micWhy();
      var mic = s.querySelector('[data-dr="mic"]');
      if (w) { mic.setAttribute('disabled', ''); s.querySelector('#drMicWhy').textContent = w; }
      s.querySelector('#drQ').value = DEMO.q;
      G.q = DEMO.q;
      rows();
      warn();
      h.go('intro');
      foot();
    }

    function rows() {
      var tb = h.states.intro.querySelector('#drRows');
      if (!tb) return;
      var opt = function (from) {
        return SEATS.map(function (o) {
          return '<option value="' + o.v + '"' + (o.v === from ? ' selected' : '') + '>' + o.nm + '</option>';
        }).join('');
      };
      tb.innerHTML = G.roles.map(function (r, i) {
        return '<tr><td><input data-f="nm" data-i="' + i + '" value="' + K.esc(r.nm) + '" placeholder="组长"></td>' +
          '<td><input data-f="rel" data-i="' + i + '" value="' + K.esc(r.rel) + '" placeholder="我的直属上级"></td>' +
          '<td><input data-f="care" data-i="' + i + '" value="' + K.esc(r.care) + '" placeholder="（可留空）"></td>' +
          '<td><select data-f="from" data-i="' + i + '">' + opt(r.from) + '</select></td>' +
          '<td><button class="dr-x" data-dr="del" data-i="' + i + '" title="去掉这个人">×</button></td></tr>';
      }).join('') +
        '<tr class="me"><td><b>「你」</b></td><td colspan="2" style="color:#605E5C">当事人本人 · 由 AI 扮演，它不替你说话</td>' +
        '<td style="color:#8A8886">平台 AI</td><td></td></tr>';
    }

    function warn() {
      var n = seats().length;
      var el = h.states.intro.querySelector('#drWarn');
      if (!el) return;
      var hire = G.roles.filter(function (r) { return r.from === 'hire'; }).length;
      el.innerHTML = '开局会发出 <b>' + n + ' 次互相独立的调用</b>——每个人只拿到这件事和他自己那一栏，' +
        '看不到别人的设定，也不知道别人怎么想。<br>' +
        '谁调通了谁的卡片上挂「真」，调不通挂「脚」，逐个标，不整局一刀切。' +
        (hire ? '<br>雇了 ' + hire + ' 个分身 · 合计 ¥' + (hire * 29) + '（演示计价，未接入真实支付）' : '');
    }

    // ---------------- 每个座位一次独立调用 ----------------
    function sysRole(r, me) {
      var p;
      if (me) {
        p = '你在一场四个人的职场议事里，扮演当事人本人。你不是他的同盟，也不是他的辩护人。'
          + '他把事情讲成这样：' + G.q + '。'
          + '这是他自己的说法，里面一定有他没说出口的部分——你的任务就是把那部分说出来。'
          + '不要安慰他，不要顺着他，不要复述他的委屈。';
      } else {
        p = '你在一场四个人的职场议事里，扮演一个真实的人：' + r.nm + '。'
          + '你和当事人的关系：' + (r.rel || '同事') + '。'
          + (r.care ? '当事人猜你在意的是「' + r.care + '」——这只是他的猜测，你可以推翻它。' : '')
          + '当事人把事情讲成这样，这是他的一面之词：' + G.q + '。'
          + '你只知道自己的处境，看不见这件事里其他人的设定，也不知道他们各自怎么想。'
          + '你不替当事人说话，也不刻意站他的对立面，你只按自己的利害说话。';
      }
      if (r.from === 'mine') {
        var b = (typeof botProfile === 'function') ? botProfile() : null;
        if (b) p += '你的说话方式：' + String(b.dna).replace(/\n/g, '；').slice(0, 60) + '。';
      } else if (r.from === 'hire') {
        p += '你是别人训练出来的分身，语气比在场所有人都更像老手，句子短、带判断。';
      }
      p += '严格输出 4 行，每行一句，用下面的前缀开头，不要编号、不要引号、不要多余的话：'
        + (me
          ? '明面：（他自己以为他要的，≤22 字）底下：（他不肯承认自己怕的，≤22 字）'
          + '那根线：（他其实在等谁的一句话，≤22 字）原话：（这场对话里他嘴上会说的一句，≤24 字）'
          : '明面：（你会公开承认自己想要什么，≤22 字）底下：（你真正怕的，这句你绝不当面说，≤22 字）'
          + '那根线：（当事人这次的做法踩到你哪一处，≤22 字）原话：（这场对话里你会当面说的一句，≤24 字）');
      return p.slice(0, 1900);
    }

    function sysReact(r, me, line) {
      var p = sysRole(r, me).replace(/严格输出 4 行[\s\S]*$/, '');
      p += '当事人当着你的面说了这句话：「' + line + '」。'
        + '严格输出 2 行，用下面的前缀开头，不要编号、不要引号：'
        + '反应：（你当场会说出口的一句，≤24 字）心里：（你同时心里闪过的一句，≤20 字）';
      return p.slice(0, 1900);
    }

    async function callSeat(r, me, sys, fb) {
      G.calls++;
      var j;
      try {
        j = (typeof askAI === 'function')
          ? await askAI('梦蝶议事厅 · ' + r.nm, sys, '开始。')
          : { ok: false };
      } catch (e) { j = { ok: false }; }
      if (j && j.ok) G.real++;
      return { ok: !!(j && j.ok), text: (j && j.text) || '' };
    }

    // ---------------- 定位分析 ----------------
    async function start() {
      var t = h.states.intro.querySelector('#drQ');
      G.q = (t ? t.value : '').trim();
      if (G.q.length < 8) { hud.toast('先把事情说清楚，至少说一句完整的'); fx.shake(t); return; }
      G.roles = G.roles.filter(function (r) { return r.nm.trim(); });
      if (!G.roles.length) { hud.toast('至少写一个人进来'); return; }
      G.calls = 0; G.real = 0; G.turns = 0; G.out = {}; G.src = {};

      var list = seats();
      hud.title('定位分析');
      hud.tool('<b style="font-size:12px">' + K.esc(G.q.slice(0, 26)) + (G.q.length > 26 ? '…' : '') + '</b>' +
        '<button class="dr-b" data-dr="back">重新立案</button>', '第 2 步 / 共 2 步');
      hud.clearNotes();
      h.hud.note('会议', '开局：' + list.length + ' 个座位同时发言，各说各的。', 'k-note');

      var s = h.states.play;
      s.innerHTML = '<div class="dr-cards" id="drCards">' + list.map(function (r, i) {
        return '<div class="dr-c' + (r.me ? ' me' : '') + '" data-c="' + i + '">' +
          '<span class="dr-bg wait">…</span><h4>' + K.esc(r.nm) + '</h4>' +
          '<div class="rel">' + K.esc(r.rel || '同事') + '</div>' +
          '<div style="color:#8A8886;font-size:12px">' + fx.dots() + ' 正在想</div></div>';
      }).join('') + '</div><div id="drAfter"></div>';
      h.go('play');
      foot();

      fx.deal(s.querySelectorAll('.dr-c'), { step: 0.06 });

      // 四次调用并发发出，谁先回来谁先落卡——快的不用等慢的
      await Promise.all(list.map(function (r, i) {
        return callSeat(r, r.me, sysRole(r, r.me)).then(function (res) {
          var o = res.ok ? parse4(res.text) : null;
          if (!o || !full(o)) { o = r.me ? fbMe() : fbRole(r); res.ok = false; }
          G.out[i] = o; G.src[i] = res.ok;
          paint(i, r, o, res.ok);
          foot();
        });
      }));

      after();
      sfx.play('ok');
    }

    function paint(i, r, o, ok) {
      var c = h.states.play.querySelector('[data-c="' + i + '"]');
      if (!c) return;
      c.innerHTML = '<span class="dr-bg ' + (ok ? 'real">真' : 'scr">脚') + '</span>' +
        '<h4>' + K.esc(r.nm) + '</h4><div class="rel">' + K.esc(r.rel || '同事') + '</div>' +
        FIELD.map(function (f) {
          return '<div class="dr-f ' + f.k + '"><b>' + f.nm + '</b><span>' + K.esc(o[f.k]) + '</span></div>';
        }).join('') +
        (o.say ? '<div class="dr-say">「' + K.esc(o.say) + '」</div>' : '');
      fx.rise(c);
    }

    // ---------------- 横向对照 + 推演 ----------------
    function after() {
      var list = seats();
      var box = h.states.play.querySelector('#drAfter');
      if (!box) return;
      box.innerHTML =
        '<div class="dr-cmp"><h4>把四个人怕的东西并排放</h4>' +
        '<p class="dr-h">这一栏是上面每张卡的第二行，原样搬下来，没有另做一次分析。' +
        '真正卡住你的，一般不是他们要的东西不一样，是他们怕的东西不一样。</p><ul>' +
        list.map(function (r, i) {
          var o = G.out[i] || {};
          return '<li>' + K.esc(r.nm) + '　怕 <b>' + K.esc(o.fear || '—') + '</b>' +
            (o.line ? '　<em>· 你踩的是：' + K.esc(o.line) + '</em>' : '') + '</li>';
        }).join('') + '</ul></div>' +
        '<div class="dr-say2"><input id="drLine" placeholder="你打算当面说的那一句，写在这儿，看他们各自怎么接">' +
        '<button class="dr-b pri" data-dr="react">推演这一句</button></div>' +
        '<div class="dr-bar" style="margin-top:11px">' +
        '<button class="dr-b" data-dr="file">把这一局存进资讯库</button>' +
        '<button class="dr-b" data-dr="back">换一件事</button>' +
        '<span style="font-size:11px;color:#8A8886;margin-left:auto">本局至此 ' + G.calls + ' 次独立调用</span></div>';
    }

    async function react() {
      var inp = h.states.play.querySelector('#drLine');
      var line = (inp ? inp.value : '').trim();
      if (line.length < 2) { fx.shake(inp); hud.toast('写一句你真会说出口的话'); return; }
      var btn = h.states.play.querySelector('[data-dr="react"]');
      if (btn) btn.setAttribute('disabled', '');
      G.turns++;
      hud.note('你', line, '');

      var list = seats();
      await Promise.all(list.map(function (r) {
        return callSeat(r, r.me, sysReact(r, r.me, line)).then(function (res) {
          var o = res.ok ? parse2(res.text) : null;
          if (!o || !o.re) { o = fbReact(r); res.ok = false; }
          var n = hud.note(r.nm + (res.ok ? ' · 真' : ' · 脚'), '', '');
          if (n) {
            n.innerHTML = '<div class="who"><b>' + K.esc(r.nm) + '</b> ' +
              '<span class="dr-bg ' + (res.ok ? 'real">真' : 'scr">脚') + '</span></div>' +
              '<div class="dr-note"><div class="re">' + K.esc(o.re) + '</div>' +
              (o.in_ ? '<div class="in">' + K.esc(o.in_) + '</div>' : '') + '</div>';
            n.style.position = 'relative';
          }
          foot();
        });
      }));

      if (btn) btn.removeAttribute('disabled');
      if (inp) inp.value = '';
      var tail = h.states.play.querySelector('[data-dr="react"]');
      if (tail && tail.parentNode.nextElementSibling) {
        var sp = tail.parentNode.nextElementSibling.querySelector('span');
        if (sp) sp.textContent = '本局至此 ' + G.calls + ' 次独立调用';
      }
      sfx.play('mail');
    }

    // ---------------- 存卷：这一局本身就是一颗泡泡 ----------------
    function file() {
      var list = seats();
      var worst = null;
      list.forEach(function (r, i) { if (!worst && !r.me && G.out[i]) worst = { r: r, o: G.out[i] }; });
      var txt = '【梦蝶议事厅】' + G.q.replace(/\s+/g, ' ').slice(0, 34) +
        '　→ 摆上桌才看清：' + (worst ? worst.r.nm + '怕的是「' + worst.o.fear + '」' : '每个人怕的都不是同一件事');
      if (typeof mk === 'function') {
        mk(txt, 'boss', 9, 'news', '梦蝶议事厅', '互联网');
        if (typeof sync === 'function') sync();
        hud.toast('已存进水面 · 能被吹大也能沉底', 'home');
        sfx.play('coin');
      } else {
        hud.toast('资讯库没就绪，这一局没存上');
      }
    }

    // ---------------- 语音：只在点了才要麦克风，不支持就照实说 ----------------
    function mic(btn) {
      if (recOn) { try { rec.stop(); } catch (e) {} return; }
      if (micWhy()) return;
      var t = h.states.intro.querySelector('#drQ');
      try { rec = new SR(); } catch (e) { fail('这台机器起不来语音，直接打字'); return; }
      rec.lang = 'zh-CN'; rec.interimResults = true; rec.continuous = false;
      var base = t.value;
      rec.onstart = function () {
        recOn = true;
        btn.classList.add('rec');
        btn.querySelector('span').textContent = '在听 · 再点一下停';
      };
      rec.onresult = function (e) {
        var s = '';
        for (var i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
        t.value = (base ? base + (/\s$/.test(base) ? '' : '\n') : '') + s;
      };
      rec.onerror = function (e) {
        fail(e && e.error === 'not-allowed' ? '麦克风没授权，直接打字' : '语音没接上，直接打字');
      };
      rec.onend = function () { recOn = false; btn.classList.remove('rec'); btn.querySelector('span').textContent = '点一下说话'; };
      try { rec.start(); } catch (e) { fail('语音没起来，直接打字'); }

      function fail(why) {
        recOn = false;
        btn.classList.remove('rec');
        btn.querySelector('span').textContent = '点一下说话';
        var w = h.states.intro.querySelector('#drMicWhy');
        if (w) w.textContent = why;
      }
    }

    // ---------------- 事件：一个窗口一个监听器 ----------------
    h.on('[data-dr]', function (t) {
      var k = t.dataset.dr;
      if (k === 'mic') mic(t);
      else if (k === 'demo') {
        h.states.intro.querySelector('#drQ').value = DEMO.q;
        G.roles = DEMO.roles.map(function (r) { return { nm: r.nm, rel: r.rel, care: r.care, from: '' }; });
        rows(); warn();
      } else if (k === 'add') {
        if (G.roles.length >= MAXR) { hud.toast('最多四个人——再多，调用数和你的耐心都撑不住'); return; }
        G.roles.push({ nm: '', rel: '', care: '', from: '' });
        rows(); warn(); foot();
      } else if (k === 'del') {
        G.roles.splice(+t.dataset.i, 1);
        rows(); warn(); foot();
      } else if (k === 'go') { t.setAttribute('disabled', ''); start(); }
      else if (k === 'react') react();
      else if (k === 'file') file();
      else if (k === 'back') intro();
    });

    h.on('[data-f]', function (t) {
      var r = G.roles[+t.dataset.i];
      if (!r) return;
      r[t.dataset.f] = t.value;
      if (t.dataset.f === 'from') warn();
    }, 'change');
    h.on('[data-f]', function (t) {
      var r = G.roles[+t.dataset.i];
      if (r) r[t.dataset.f] = t.value;
    }, 'input');

    intro();
  });
})();
