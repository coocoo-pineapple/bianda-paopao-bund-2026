// 对齐会 · 一场四个人的线上会（Teams / 企鹅会议 两套皮）
// 伪装选会议软件不是随便挑的：一场四个人的会、2×2 的画面宫格、底下一条控制栏，
// 语音输入在这里是原生控件，不是硬塞的炫技。
// 皮肤两套是因为「跨公司」是这产品的地基——你司用哪家会议软件，这扇窗就该长成哪家。
//
// 和「梦蝶局」的分工：那边是一局有输赢的牌——AI 的信誉考场，战绩会攒下来。
// 这边不是游戏，是工具：你把想不通的事摆上桌，雇 AI 去演那几个当事人，看他们各自在意什么。
// 两个各走各的门，互不套壳。
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

  // ---- 三行定式：模型和脚本走同一个结构，界面不用分两套 ----
  // 「你」那一座换一套标题：同一个结构，但第三行问的是他在等谁，不是他被谁踩到
  var FIELD = [
    { k: 'open', nm: '他明面上要的', me: '你自己以为你要的' },
    { k: 'fear', nm: '他底下真正怕的', me: '你不肯承认自己怕的' },
    { k: 'line', nm: '你踩到他哪根线', me: '你其实在等谁开这个口' }
  ];

  function parse4(txt) {
    var o = { open: '', fear: '', line: '', say: '' };
    String(txt || '').split(/\r?\n/).forEach(function (raw) {
      var s = clean(raw);
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
      var s = clean(raw);
      if (/^反应/.test(s)) o.re = tail(s);
      else if (/^心里/.test(s)) o.in_ = tail(s);
    });
    return o;
  }
  // 模型爱加编号、加粗、加引号，一律先剥干净再认前缀（"1. 反应：…" 只剥掉数字是认不出来的）
  function clean(s) { return String(s).replace(/[*#`]/g, '').replace(/^[\s\d.、)）\-]+/, '').trim(); }
  function tail(s) {
    return s.replace(/^[^：:]*[：:]\s*/, '')
      .replace(/^[（("'「『“]+|[）)"'」』”]+$/g, '').trim();
  }
  function full(o) { return o.open && o.fear && o.line; }

  // ---- 脚本兜底：调不通时也得是一局像样的戏，但必须挂「脚」 ----
  // 三张卡吐一模一样的话，读起来像坏了。按关系里的关键词分几路，认不出来的按序号轮，
  // 至少每个人不一样；用户自己填的「在意什么」也搬进来——这不是分析，是把他的话还给他。
  var FB = [
    { re: /领导|上级|老板|总监|组长|经理|主管|老大/, o: {
      open: '我要的是这事有个说得过去的结论。',
      fear: '怕上面觉得我压不住组里的人。',
      line: '你把它摆上桌，就等于逼我当场表态。',
      say: '这事我们会后单独聊，别在会上说。' } },
    { re: /HR|人事|HRBP|李姐/i, o: {
      open: '我要流程上挑不出毛病。',
      fear: '怕这事闹到我这儿变成一桩投诉。',
      line: '你越过流程直接讲情绪，我接不住。',
      say: '你的诉求我记下来，走正常渠道我们看看。' } },
    { re: /同事|同组|同学|搭档|队友|小李|小王/, o: {
      open: '我要的是别把我卷进去。',
      fear: '怕站了你这边，回头没人替我说话。',
      line: '你一提这事，我就得选一边站。',
      say: '我懂你的意思，但我说了也不算。' } },
    { re: /客户|甲方|乙方|供应商/, o: {
      open: '我要的是东西按时交到我手上。',
      fear: '怕你们内部的账最后算到我头上。',
      line: '你把内部的事摆到我面前来了。',
      say: '你们内部怎么分我不管，交付别耽误。' } }
  ];
  var FB_ANY = [
    { open: '我要的是这页翻过去，别再提。', fear: '怕这事翻出来牵到我身上。',
      line: '你旧事重提，就是不肯让它过去。', say: '这都过去多久了，还提它干嘛。' },
    { open: '我要一个明确的说法，别含糊。', fear: '怕自己成了那个被推出去的人。',
      line: '你让所有人都得重新表一次态。', say: '要不咱们先把话说清楚。' },
    { open: '我要的是少一事不如多一事。', fear: '怕这口气一开，后面收不住。',
      line: '你动的是大家默认不动的那块。', say: '这事真要掰扯，谁都不好看。' },
    { open: '我要的是自己那份别被算错。', fear: '怕轮到分的时候没我。',
      line: '你先开口，就把顺序改了。', say: '你说的这个，我也得算算我的。' }
  ];
  function fbRole(r, i) {
    var key = (r.nm || '') + ' ' + (r.rel || '');
    var hit = null;
    for (var k = 0; k < FB.length; k++) if (FB[k].re.test(key)) { hit = FB[k].o; break; }
    var o = hit || FB_ANY[i % FB_ANY.length];
    o = { open: o.open, fear: o.fear, line: o.line, say: o.say };
    // 用户猜他在意什么，就先按他猜的说——猜错了也是他自己的猜，这张卡挂着「脚」
    if (r.care) o.open = String(r.care).slice(0, 22);
    return o;
  }
  function fbMe() {
    return {
      open: '我要一句公道话，把我的名字说出来。',
      fear: '怕开了这个口，被看成计较的人。',
      line: '你其实在等有人替你说，而不是自己说。',
      say: '算了，也没那么重要。'
    };
  }
  var FB_RE = [
    { re: '你这话我听见了，我回头想想。', in_: '他这是有备而来。' },
    { re: '行，那你先说说你想怎么办。', in_: '别把我先绕进去。' },
    { re: '这个我得再确认一下才好答你。', in_: '现在接了就是我的事了。' },
    { re: '我理解，但这不是我一个人能定的。', in_: '这话得让别人先说。' },
    { re: '你要真这么想，那我们摊开讲。', in_: '他今天不打算算了。' }
  ];
  function fbReact(r, i) { return FB_RE[i % FB_RE.length]; }

  // ================================================================
  // 两套皮肤：同一个会议，换一家厂商的壳
  // 不是换配色玩——「跨公司」是这个产品的地基，用哪家会议软件本来就是各公司自己的事。
  // 你司用企鹅会议，那这扇窗就该长成企鹅会议。皮肤记在 localStorage，下次打开还是它。
  //
  // 排布照着真会中界面来：上面一格一个人的画面（2×2 宫格），下面一条控制栏，
  // 分析出来之后自动"开始共享"——画面收成顶部一条，内容占主区。真开会就是这个顺序。
  // ================================================================
  var SKIN = {
    teams: {
      nm: 'Teams', vendor: 'Microsoft Teams',
      title: '项目复盘 · 对齐会（4 人）- Microsoft Teams',
      c: '#6264A7', c2: '#464775',
      joinN: '与会 %n 人', tag: '会议',
      // 控制栏：真 Teams 是居中一排圆角按钮，挂断在最右边红的
      ctl: [['🎤', '静音'], ['📹', '摄像头'], ['🖥', '共享'], ['💬', '聊天'], ['👥', '参与者'], ['⋯', '更多']],
      leave: '离开',
      meta: function (n) { return '会议进行中 · ' + n + ' 位参与者'; }
    },
    tm: {
      nm: '企鹅会议', vendor: '企鹅会议',
      title: '项目复盘对齐会 - 企鹅会议',
      c: '#2B7FFF', c2: '#1A6BE8',
      joinN: '%n 人在会议中', tag: '会议中',
      // 企鹅会议的底栏按钮更多、文案更长，最右是「结束会议」
      ctl: [['🎤', '静音'], ['📹', '停止视频'], ['🖥', '共享屏幕'], ['👥', '成员'], ['💬', '聊天'], ['✉', '邀请'], ['⋯', '更多']],
      leave: '结束会议',
      meta: function (n) { return '会议 ID：872 145 339 · ' + n + ' 人'; }
    }
  };
  var SKIN_ORDER = ['teams', 'tm'];

  K.ready(function () {
    if (typeof registerGame !== 'function') return;

    registerGame({
      id: 'winDreamRoom', app: 'chat', go: 'dreamroom',
      title: '项目复盘 · 对齐会（4 人）- Microsoft Teams',
      style: 'left:150px;top:64px;width:940px;height:598px',
      hall: { nm: '对齐会', by: '官方', tip: 88 }
    });

    // 桌面 C 位就是它唯一的入口，不再进趣味游戏文件夹——正门只留一扇
    // 名字继续伪装成一场会——老板瞟一眼是在开会，不是在玩
    (function deskEntry() {
      if (document.querySelector('#deskRoom')) return;
      var d = document.createElement('div');
      d.id = 'deskRoom';
      d.className = 'dski';
      d.innerHTML = '<span class="ic page" data-x="TM" style="--tag:#6264A7"></span><em>项目复盘对齐会_周四.lnk</em>';
      document.body.appendChild(d);
      var st = document.createElement('style');
      st.textContent =
        '#deskRoom{position:fixed;left:46%;top:26%;transform:translate(-50%,-50%);z-index:2;width:130px}' +
        'body:not(.os) #deskRoom{display:none}' +
        '#deskRoom .ic.page::after{font-size:8px;letter-spacing:0}';
      document.head.appendChild(st);
      d.addEventListener('click', function () { if (typeof goFeature === 'function') goFeature('dreamroom'); });
      // 生成图标就位即换装，没图就用 CSS 画的那张纸
      var im = new Image();
      im.onload = function () {
        var e = d.querySelector('.ic');
        if (e) { e.className = 'ic pic'; e.removeAttribute('data-x'); e.style.backgroundImage = 'url(assets/icons/it-room.png)'; }
      };
      im.src = 'assets/icons/it-room.png';
    })();

    var h = K.shell({
      win: 'winDreamRoom',
      title: '项目复盘 · 对齐会（4 人）- Microsoft Teams',
      side: true, crumb: false, save: 'dreamroom'
    });
    if (!h) return;
    var hud = h.hud, fx = h.fx, sfx = h.sfx, sv = h.save;

    // 皮肤全走 CSS 变量：换皮只改窗口上的 data-skin，一条规则都不用重写
    // 会中区是深色的——两家的会中界面都是深底，浅色只出现在「立案」那一步（还没进会）
    h.css(
      // Teams 紫：#6264A7 是功能主色，#464775 是更深的那档
      '&{--c:#6264A7;--c2:#464775;--bg:#F5F5F5;--sd:#EDEBE9;--rl:#E1DFDD;--dm:#605E5C;--rd:5px;--fa:50%;' +
      '  --st:#1F1F23;--tile:#2A2A31;--tl2:#33333C;--tx:#EAEAEE;--tx2:#9A9AA2;--tr:#3D3D42}' +
      '&[data-skin=teams] .dwh{background:#464775}' +
      // 企鹅会议蓝：会中界面比 Teams 更黑一点，圆角更大，按钮是方的
      '&[data-skin=tm]{--c:#2B7FFF;--c2:#1A6BE8;--bg:#F2F3F5;--sd:#F7F8FA;--rl:#E5E6EB;--dm:#4E5969;--rd:6px;--fa:6px;' +
      '  --st:#17181C;--tile:#232529;--tl2:#2B2E33;--tx:#F2F3F5;--tx2:#86909C;--tr:#2E3238}' +
      '&[data-skin=tm] .dwh{background:#1D2129}' +
      // kit 给文档窗配的工具条在这儿是多余的一层壳——会议客户端没有这条，整条不要
      '.k-tool{display:none}' +
      '.dwb{background:var(--st)}' +
      '.k-side{width:222px;background:var(--sd);border-left:1px solid var(--rl)}' +
      // ---- 加入会议前那一屏 ----
      // 真客户端进会前是一张深色预览页：左边摄像头画面，右边选设备，底下一个蓝色「加入」。
      // 这场会没有摄像头，那块黑框就放你要摆上桌的那件事——加入之前你看见的本来就该是你自己。
      '&[data-st=intro] .k-stage{padding:0;background:var(--st);overflow:hidden}' +
      '&[data-st=intro] .k-side{display:none}' +          // 会前没有聊天面板，进了会才有
      '&[data-st=intro] .k-st[data-k=intro]{height:100%;box-sizing:border-box;padding:13px 15px}' +
      '.dr-pre{display:flex;gap:15px;height:100%;box-sizing:border-box;color:var(--tx)}' +
      '.dr-pvw{width:330px;flex:none;display:flex;flex-direction:column;min-height:0}' +
      '.dr-pv{flex:1;min-height:0;display:flex;flex-direction:column;background:#0C0C0F;' +
      '  border:1px solid var(--tr);border-radius:8px;padding:11px 12px}' +
      '.dr-pvh{font-size:10.5px;color:var(--tx2);letter-spacing:.3px;margin-bottom:7px}' +
      '.dr-q{flex:1;min-height:0;width:100%;box-sizing:border-box;padding:0;border:0;background:none;' +
      '  color:var(--tx);font:13px/1.75 inherit;resize:none}' +
      '.dr-q:focus{outline:0}' +
      '.dr-q::placeholder{color:#63636B}' +
      '.dr-pvc{display:flex;align-items:center;gap:9px;margin-top:11px;flex-wrap:wrap}' +
      '.dr-mic{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border:1px solid var(--tr);' +
      '  background:var(--tile);color:var(--tx);border-radius:16px;cursor:pointer;font:12px inherit}' +
      '.dr-mic:hover{background:var(--tl2)}' +
      '.dr-mic i{width:8px;height:8px;border-radius:50%;background:var(--tx2);display:inline-block}' +
      '.dr-mic[disabled]{opacity:.45;cursor:not-allowed}' +
      '.dr-mic.rec{border-color:#D74F4F;color:#F2A0A0}' +
      '.dr-mic.rec i{background:#D74F4F;animation:k-glow 1.2s infinite}' +
      '.dr-ex{font-size:12px;color:#9AA6E0;cursor:pointer;text-decoration:underline dotted}' +
      '.dr-why{font-size:11px;color:var(--tx2)}' +
      // 右半边＝真客户端的「加入前设置」。那儿选的是麦克风和摄像头，这儿选的是这场会有谁
      '.dr-pj{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}' +
      '.dr-pj h4{margin:0 0 3px;font-size:13px;color:var(--tx);font-weight:600}' +
      '.dr-h{font-size:11.5px;color:var(--tx2);margin:0 0 8px;line-height:1.65}' +
      '.dr-h b{color:var(--tx);font-weight:400}' +
      '.dr-tbw{flex:1;min-height:0;overflow:auto}' +
      '.dr-tb{width:100%;border-collapse:collapse;font-size:12px}' +
      '.dr-tb th{font-weight:400;color:var(--tx2);text-align:left;padding:0 6px 5px 0;font-size:10.5px}' +
      '.dr-tb td{padding:3px 6px 3px 0;vertical-align:middle}' +
      '.dr-tb input,.dr-tb select{width:100%;box-sizing:border-box;padding:5px 7px;border:1px solid var(--tr);' +
      '  border-radius:4px;background:var(--tile);color:var(--tx);font:12px inherit}' +
      '.dr-tb input:focus,.dr-tb select:focus{outline:0;border-color:var(--c)}' +
      '.dr-tb input::placeholder{color:#63636B}' +
      '.dr-tb tr.me td{color:var(--tx2);font-size:11.5px;padding-top:6px}' +
      '.dr-tb tr.me b{color:var(--tx);font-weight:400}' +
      '.dr-x{border:0;background:none;color:var(--tx2);cursor:pointer;font-size:15px;line-height:1}' +
      '.dr-x:hover{color:#F2A0A0}' +
      '.dr-warn{font-size:11px;color:var(--tx2);line-height:1.7;margin-top:8px}' +
      '.dr-warn b{color:var(--tx);font-weight:400}' +
      // 加入那一排：选哪家客户端 + 蓝色大按钮，位置跟真客户端一样在右下
      '.dr-join{flex:0 0 auto;display:flex;align-items:center;gap:9px;margin-top:11px;' +
      '  padding-top:11px;border-top:1px solid var(--tr)}' +
      '.dr-cl{font-size:11px;color:var(--tx2)}' +
      '.dr-sk{display:flex;border:1px solid var(--tr);border-radius:13px;overflow:hidden;background:var(--tile)}' +
      '.dr-sk b{font-weight:400;font-size:11px;padding:3px 10px;cursor:pointer;color:var(--tx2)}' +
      '.dr-sk b.on{background:var(--c);color:#fff}' +
      '.dr-bar{display:flex;align-items:center;gap:6px;margin:7px 0 0;flex-wrap:wrap}' +
      // .dr-b 基准色给共享出来的那份白底内容用；预览页是深色的，单独压一层
      '.dr-b{padding:5px 14px;border:1px solid var(--rl);background:#fff;border-radius:var(--rd);cursor:pointer;font:12px inherit}' +
      '.dr-b:hover{background:var(--sd)}' +
      '.dr-b.pri{background:var(--c);border-color:var(--c);color:#fff}' +
      '.dr-b.pri:hover{background:var(--c2)}' +
      '.dr-b[disabled]{opacity:.5;cursor:not-allowed}' +
      '.dr-pre .dr-b{background:var(--tile);border-color:var(--tr);color:var(--tx)}' +
      '.dr-pre .dr-b:hover{background:var(--tl2)}' +
      '.dr-pre .dr-b.pri{margin-left:auto;padding:7px 22px;font-size:13px;background:var(--c);border-color:var(--c);color:#fff}' +
      '.dr-pre .dr-b.pri:hover{background:var(--c2)}' +
      // ---- 会中：整块深色，上面宫格下面控制栏 ----
      // kit 的 .k-stage 默认是白底带内边距的文档区，进会后整个让位给会议界面
      '&[data-st=play] .k-stage{padding:0;background:var(--st);display:flex;flex-direction:column;overflow:hidden}' +
      '&[data-st=play] .k-st[data-k=play]{flex:1;min-height:0;display:flex;flex-direction:column}' +
      '&[data-st=play] .k-side{background:var(--st);border-left-color:var(--tr);color:var(--tx)}' +
      '&[data-st=play] .k-side .cmt{background:var(--tile);border-radius:6px;padding:7px 9px;color:var(--tx)}' +
      '&[data-st=play] .k-side .cmt .who b{color:var(--tx)}' +
      '&[data-st=play] .k-side .dr-note .in{color:var(--tx2)}' +
      '.dr-meta{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:7px 12px;color:var(--tx2);font-size:11px}' +
      '.dr-meta .rec{color:#F2A0A0}' +
      '.dr-meta .rec:before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;' +
      '  background:#D74F4F;margin-right:5px;vertical-align:middle;animation:k-glow 1.8s infinite}' +
      // 宫格：4 人是 2×2，真会议软件的默认画廊就是这个
      '.dr-grid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 12px 8px}' +
      // 共享开始后画面收成顶部一条：内容占主区，这是真开会共享屏幕时的样子
      '.dr-share .dr-grid{flex:0 0 auto;grid-template-columns:repeat(4,1fr);gap:6px;overflow:visible}' +
      '.dr-share .dr-c{min-height:56px;padding:7px 9px;justify-content:center}' +
      '.dr-share .dr-f,.dr-share .dr-say,.dr-share .dr-c .rel{display:none}' +
      '.dr-c{background:var(--tile);border-radius:var(--rd);padding:9px 11px;position:relative;' +
      '  min-height:132px;display:flex;flex-direction:column;overflow:hidden}' +
      // 「你」那一格描边：真会议里正在发言的人就是这么被框住的
      '.dr-c.me{box-shadow:inset 0 0 0 2px var(--c)}' +
      '.dr-c h4{margin:0;font-size:12.5px;color:var(--tx);display:flex;align-items:center;gap:7px;font-weight:400}' +
      // 与会人头像：Teams 是圆的，企鹅会议是圆角方的——就靠 --fa 一个变量分开
      '.dr-av{width:26px;height:26px;border-radius:var(--fa);flex:none;color:#fff;font-size:12px;' +
      '  display:inline-flex;align-items:center;justify-content:center;background:var(--c)}' +
      '.dr-share .dr-av{width:20px;height:20px;font-size:10px}' +
      '.dr-c .rel{font-size:10.5px;color:var(--tx2);margin:3px 0 8px 33px}' +
      '.dr-f{margin-bottom:6px}' +
      '.dr-f b{display:block;font-size:9.5px;color:var(--tx2);font-weight:400;letter-spacing:.4px}' +
      '.dr-f span{font-size:12px;line-height:1.55;color:var(--tx)}' +
      '.dr-f.fear span{color:#F2A0A0}' +
      '.dr-say{margin-top:auto;padding:6px 9px;background:var(--tl2);border-radius:4px;' +
      '  font-size:11.5px;line-height:1.55;color:#D6D6DC}' +
      '.dr-bg{position:absolute;right:8px;top:8px;font-size:9.5px;padding:0 6px;border-radius:8px;line-height:16px}' +
      '.dr-bg.real{background:#2F6B4A;color:#CDF0DB}' +
      '.dr-bg.scr{background:#6B3A3A;color:#F3D3D3}' +
      '.dr-bg.wait{background:var(--tl2);color:var(--tx2)}' +
      // 共享出来的「内容」：分析结论在真会议里就该是被共享的那份东西
      '.dr-share2{flex:1;min-height:0;overflow:auto;margin:0 12px 8px;background:#fff;' +
      '  border-radius:var(--rd);padding:11px 13px}' +
      '.dr-share2:empty{display:none}' +
      '.dr-share2 .shh{font-size:10px;color:var(--dm);margin-bottom:8px;letter-spacing:.3px}' +
      '.dr-share2 .shh b{color:var(--c2);font-weight:600}' +
      '.dr-share2 .dr-h{color:var(--dm)}' +          // 共享出来的是白底那份，说明文字得跟着变深
      // 控制栏：两家都是居中一排，挂断在最右边且是红的
      '.dr-ctl{position:relative;flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:4px;' +
      '  padding:7px 12px;border-top:1px solid var(--tr);background:var(--st)}' +
      '.dr-ctl u{text-decoration:none;display:inline-flex;flex-direction:column;align-items:center;gap:3px;' +
      '  padding:4px 10px;border-radius:var(--rd);color:var(--tx2);font-size:9.5px;cursor:default;line-height:1.2}' +
      '.dr-ctl u i{font-style:normal;font-size:14px;line-height:1;filter:grayscale(1) brightness(1.7)}' +
      '.dr-ctl u:hover{background:var(--tl2)}' +
      '.dr-ctl u.more{cursor:pointer}' +
      '.dr-ctl u.more.on{background:var(--tl2);color:var(--tx)}' +
      '.dr-ctl .end{background:#C0503F;color:#fff;padding:7px 15px;border-radius:var(--rd);font-size:11px;' +
      '  cursor:pointer;border:0;margin-left:12px}' +
      '.dr-ctl .end:hover{background:#D4604E}' +
      // 「更多」是真能点开的：换会议客户端本来就该藏在这儿，而不是另起一条工具条
      // 左右位置在 JS 里按按钮算，写死 right 会飘到别处——两家的按钮数不一样，「更多」不在同一个 x 上
      '.dr-menu{position:absolute;left:0;bottom:52px;min-width:176px;background:var(--tile);' +
      '  border:1px solid var(--tr);border-radius:var(--rd);padding:5px;box-shadow:0 10px 28px rgba(0,0,0,.55);z-index:6}' +
      '.dr-menu .mh{font-size:10px;color:var(--tx2);padding:4px 8px 6px}' +
      '.dr-menu b{display:block;font-weight:400;font-size:12px;color:var(--tx);padding:6px 8px;' +
      '  border-radius:4px;cursor:pointer}' +
      '.dr-menu b:hover{background:var(--tl2)}' +
      '.dr-menu b.on:after{content:"　✓";color:var(--c)}' +
      '.dr-cmp h4{margin:0 0 2px;font-size:12px}' +
      '.dr-cmp .dr-h{margin-bottom:7px}' +
      '.dr-cmp li{font-size:12px;line-height:1.75;list-style:none}' +
      '.dr-cmp li b{color:#C43E1C;font-weight:600}' +
      '.dr-cmp li em{font-style:normal;color:var(--dm)}' +
      '.dr-say2{display:flex;gap:6px;margin-top:11px}' +
      '.dr-say2 input{flex:1;padding:6px 9px;border:1px solid var(--rl);border-radius:var(--rd);font:13px inherit}' +
      '.dr-say2 input:focus{outline:0;border-color:var(--c)}' +
      '.dr-note{font-size:12px}' +
      '.dr-note .re{line-height:1.6}' +
      '.dr-note .in{color:#8A8886;margin-top:3px;line-height:1.5}' +
      '.dr-note .in:before{content:"（心里）"}'
    );

    // ---------------- 状态 ----------------
    var G = { q: '', roles: [], out: {}, src: {}, calls: 0, real: 0, turns: 0 };
    var rec = null, recOn = false;
    var skin = SKIN[sv.get('skin', 'teams')] ? sv.get('skin', 'teams') : 'teams';

    function sk() { return SKIN[skin]; }
    function setSkin(k, quiet) {
      if (!SKIN[k]) return;
      skin = k;
      sv.set('skin', k);
      h.win.setAttribute('data-skin', k);
      if (!quiet) { sfx.play('click'); hud.toast('已换成' + SKIN[k].nm + '的皮'); }
      var b = h.win.querySelector('.dr-sk');
      if (b) b.querySelectorAll('b').forEach(function (x) { x.classList.toggle('on', x.dataset.sk === k); });
      // 会中那一屏得跟着换：两家的控制栏按钮不一样，会议信息那行也不一样
      var ctl = h.states.play.querySelector('.dr-ctl');
      if (ctl) ctl.outerHTML = ctlBar();
      var meta = h.states.play.querySelector('.dr-meta span:last-child');
      if (meta) meta.textContent = sk().meta(seats().length);
      title();
      foot();
    }
    function skBar() {
      return '<span class="dr-sk">' + SKIN_ORDER.map(function (k) {
        return '<b data-sk="' + k + '"' + (k === skin ? ' class="on"' : '') + '>' + SKIN[k].nm + '</b>';
      }).join('') + '</span>';
    }

    function seats() {
      // 「你」永远是最后一位：AI 也演一个你，这样这一局才不是你自己的回声
      return G.roles.concat([{ nm: '「你」', rel: '当事人本人，由 AI 扮演', care: '', from: '', me: true }]);
    }

    // 标题栏归我自己写：kit 的 baseTitle 在建窗时就定死了，换皮换不动它
    var step = '';
    function title(sub) {
      if (typeof sub === 'string') step = sub;
      var head = h.win.querySelector('.dwh');
      if (!head) return;
      var wb = head.querySelector('.wb');
      head.textContent = sk().title + (step ? ' — ' + step : '');
      if (wb) head.appendChild(wb);
    }

    function foot() {
      hud.foot([sk().joinN.replace('%n', seats().length), '独立调用 ' + G.calls + ' 次'],
        G.calls ? ('真 ' + G.real + ' · 脚 ' + (G.calls - G.real)) : '尚未调用');
    }

    // ---------------- 加入会议前 ----------------
    function intro() {
      G.roles = DEMO.roles.map(function (r) { return { nm: r.nm, rel: r.rel, care: r.care, from: '' }; });
      G.out = {}; G.src = {}; G.calls = 0; G.real = 0; G.turns = 0;
      title('');
      hud.clearNotes();

      var s = h.states.intro;
      s.innerHTML =
        '<div class="dr-pre">' +
        '<div class="dr-pvw">' +
        '  <div class="dr-pv">' +
        '    <div class="dr-pvh">摄像头已关闭 · 这场会你要摆上桌的那件事</div>' +
        '    <textarea class="dr-q" id="drQ" placeholder="讲得越具体，等会儿这几个人越像人。&#10;比如：我做的项目跑赢目标 30%，复盘会上功劳被组长一句话带过……"></textarea>' +
        '  </div>' +
        '  <div class="dr-pvc">' +
        '    <button class="dr-mic" data-dr="mic"><i></i><span>点一下说话</span></button>' +
        '    <span class="dr-ex" data-dr="demo">用这个例子填上</span>' +
        '    <span class="dr-why" id="drMicWhy"></span>' +
        '  </div>' +
        '</div>' +
        '<div class="dr-pj">' +
        '  <h4>这场会里有谁</h4>' +
        '  <p class="dr-h">「你猜他在意什么」可以留空——留空就让他自己说，你猜的那一栏他有权推翻。' +
        '  最后一位固定是「你」，也由 AI 来演：<b>让 AI 也演一个你，这一局才不是你自己的回声。</b></p>' +
        '  <div class="dr-tbw"><table class="dr-tb"><thead><tr>' +
        '    <th style="width:92px">谁</th><th style="width:31%">和你什么关系</th>' +
        '    <th>你猜他在意什么</th><th style="width:98px">谁来演</th><th style="width:18px"></th>' +
        '  </tr></thead><tbody id="drRows"></tbody></table>' +
        '  <div class="dr-bar"><button class="dr-b" data-dr="add">＋ 再加一个人</button></div>' +
        '  <div class="dr-warn" id="drWarn"></div></div>' +
        '  <div class="dr-join"><span class="dr-cl">用哪家客户端加入</span>' + skBar() +
        '    <button class="dr-b pri" data-dr="go">加入会议</button></div>' +
        '</div></div>';

      var w = micWhy();
      var mic = s.querySelector('[data-dr="mic"]');
      if (w) { mic.setAttribute('disabled', ''); s.querySelector('#drMicWhy').textContent = w; }
      s.querySelector('#drQ').value = DEMO.q;
      G.q = DEMO.q;
      rows();
      warn();
      goStep('intro');
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
        '<tr class="me"><td><b>「你」</b></td><td colspan="2">当事人本人 · 由 AI 扮演，它不替你说话</td>' +
        '<td>平台 AI</td><td></td></tr>';
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

    // 调通了但格式没对上，一样算脚本兜底——「真」只挂给真正拿到可用内容的那一次
    async function callSeat(r, sys, parse, need) {
      G.calls++;
      var j;
      try {
        j = (typeof askAI === 'function')
          ? await askAI('对齐会 · ' + r.nm, sys, '开始。')
          : { ok: false };
      } catch (e) { j = { ok: false }; }
      var o = (j && j.ok) ? parse(j.text) : null;
      var ok = !!(o && need(o));
      if (ok) G.real++;
      return { ok: ok, out: o };
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
      title('');
      hud.clearNotes();
      h.hud.note(sk().tag, '开局：' + list.length + ' 个座位同时发言，各说各的。', 'k-note');

      var s = h.states.play;
      // 会中界面的三层：上面一行会议信息，中间宫格，底下控制栏。
      // 共享出来的内容先空着——分析没出来之前没什么可共享的，这跟真开会一个顺序。
      s.innerHTML =
        '<div class="dr-meta"><span class="rec">录制中</span><span>' + K.esc(sk().meta(list.length)) + '</span></div>' +
        '<div class="dr-grid" id="drGrid">' + list.map(function (r, i) {
          return '<div class="dr-c' + (r.me ? ' me' : '') + '" data-c="' + i + '">' +
            '<span class="dr-bg wait">…</span><h4>' + av(r) + K.esc(r.nm) + '</h4>' +
            '<div class="rel">' + K.esc(r.rel || '同事') + '</div>' +
            '<div style="color:var(--tx2);font-size:12px">' + fx.dots() + ' 正在想</div></div>';
        }).join('') + '</div>' +
        '<div class="dr-share2" id="drAfter"></div>' + ctlBar();
      s.classList.remove('dr-share');
      goStep('play');
      foot();

      fx.deal(s.querySelectorAll('.dr-c'), { step: 0.06 });

      // 四次调用并发发出，谁先回来谁先落卡——快的不用等慢的
      await Promise.all(list.map(function (r, i) {
        return callSeat(r, sysRole(r, r.me), parse4, full).then(function (res) {
          var o = res.ok ? res.out : (r.me ? fbMe() : fbRole(r, i));
          G.out[i] = o; G.src[i] = res.ok;
          paint(i, r, o, res.ok);
          foot();
        });
      }));

      after();
      sfx.play('ok');
    }

    // 与会人头像：真会议软件就是取名字第一个字。「你」那一座取「你」
    function av(r) {
      var ch = r.me ? '你' : (String(r.nm).replace(/[「」\s]/g, '').charAt(0) || '人');
      return '<span class="dr-av">' + K.esc(ch) + '</span>';
    }

    // 控制栏按哪家的来：两家的按钮不是同一排，Teams 六个，企鹅会议七个还多一个「邀请」。
    // 这排按钮只有最右两个是真的——「更多」能点开，「离开会议」回到加入前那一屏。
    // 别的按钮点了什么都不该发生，因为这场会本来也没有麦克风和摄像头。
    function ctlBar() {
      var c = sk().ctl;
      return '<div class="dr-ctl">' + c.map(function (b, i) {
        var more = i === c.length - 1;
        return '<u' + (more ? ' class="more" data-dr="more"' : '') + '><i>' + b[0] + '</i>' + K.esc(b[1]) + '</u>';
      }).join('') + '<button class="end" data-dr="back">' + K.esc(sk().leave) + '</button></div>';
    }

    // 换会议客户端藏在「更多」里：真客户端的设置就在这个位置，不该另起一条工具条
    function more() {
      var ctl = h.states.play.querySelector('.dr-ctl');
      if (!ctl) return;
      var old = ctl.querySelector('.dr-menu');
      var btn = ctl.querySelector('u.more');
      if (old) { old.remove(); if (btn) btn.classList.remove('on'); return; }
      var m = document.createElement('div');
      m.className = 'dr-menu';
      m.innerHTML = '<div class="mh">切换会议客户端</div>' + SKIN_ORDER.map(function (k) {
        return '<b data-sk="' + k + '"' + (k === skin ? ' class="on"' : '') + '>' + SKIN[k].nm + '</b>';
      }).join('');
      ctl.appendChild(m);
      // 弹在「更多」正上方，再夹回控制栏里边——真客户端的菜单就是从这个按钮长出来的
      var x = btn ? (btn.offsetLeft + btn.offsetWidth / 2 - m.offsetWidth / 2) : 0;
      m.style.left = Math.max(8, Math.min(x, ctl.clientWidth - m.offsetWidth - 8)) + 'px';
      if (btn) btn.classList.add('on');
    }

    // 状态切换顺带把 data-st 写到窗口上：会中那一屏要整块变深色，
    // 而 kit 的 .k-stage 是白底文档区，只能靠窗口上的属性把它整个改掉
    function goStep(k) {
      h.win.setAttribute('data-st', k);
      h.go(k);
    }

    function paint(i, r, o, ok) {
      var c = h.states.play.querySelector('[data-c="' + i + '"]');
      if (!c) return;
      c.innerHTML = '<span class="dr-bg ' + (ok ? 'real">真' : 'scr">脚') + '</span>' +
        '<h4>' + av(r) + K.esc(r.nm) + '</h4><div class="rel">' + K.esc(r.rel || '同事') + '</div>' +
        FIELD.map(function (f) {
          return '<div class="dr-f ' + f.k + '"><b>' + ((r.me && f.me) ? f.me : f.nm) + '</b><span>' + K.esc(o[f.k]) + '</span></div>';
        }).join('') +
        (o.say ? '<div class="dr-say">「' + K.esc(o.say) + '」</div>' : '');
      fx.rise(c);
    }

    // ---------------- 横向对照 + 推演 ----------------
    // 四个人都说完了，才有东西可共享——所以这一步做的是「开始共享屏幕」：
    // 上面的画面收成顶部一条，结论占住主区。真开会共享的那一刻，界面就是这么变的。
    function after() {
      var list = seats();
      var box = h.states.play.querySelector('#drAfter');
      if (!box) return;
      box.innerHTML =
        '<div class="shh"><b>「你」正在共享屏幕</b> · 定位分析.txt</div>' +
        '<div class="dr-cmp"><h4>把四个人怕的东西并排放</h4>' +
        '<p class="dr-h">这一栏是上面每张卡的第二行，原样搬下来，没有另做一次分析。' +
        '真正卡住你的，一般不是他们要的东西不一样，是他们怕的东西不一样。</p><ul>' +
        list.map(function (r, i) {
          var o = G.out[i] || {};
          return '<li>' + K.esc(r.nm) + '　怕 <b>' + K.esc(o.fear || '—') + '</b>' +
            (o.line ? '　<em>· ' + (r.me ? '你在等的是：' : '你踩的是：') + K.esc(o.line) + '</em>' : '') + '</li>';
        }).join('') + '</ul></div>' +
        '<div class="dr-say2"><input id="drLine" placeholder="你打算当面说的那一句，写在这儿，看他们各自怎么接">' +
        '<button class="dr-b pri" data-dr="react">推演这一句</button></div>' +
        '<div class="dr-bar" style="margin-top:11px">' +
        '<button class="dr-b" data-dr="file">把这一局存进资讯库</button>' +
        '<span style="font-size:11px;color:#8A8886;margin-left:auto">本局至此 ' + G.calls + ' 次独立调用</span></div>';
      h.states.play.classList.add('dr-share');
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
      await Promise.all(list.map(function (r, i) {
        return callSeat(r, sysReact(r, r.me, line), parse2, function (o) { return !!o.re; }).then(function (res) {
          var o = res.ok ? res.out : fbReact(r, i + G.turns);
          var n = hud.note(r.nm, '', '');
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
      var txt = '【对齐会】' + G.q.replace(/\s+/g, ' ').slice(0, 34) +
        '　→ 摆上桌才看清：' + (worst ? worst.r.nm + '怕的是「' + worst.o.fear + '」' : '每个人怕的都不是同一件事');
      if (typeof mk === 'function') {
        mk(txt, 'boss', 9, 'news', '对齐会', '互联网');
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
      else if (k === 'more') more();
      else if (k === 'back') intro();
    });

    // 皮肤开关有两处：加入前那一屏的一排，和会中「更多」里的一项，都是 [data-sk]
    h.on('[data-sk]', function (t) { setSkin(t.dataset.sk); });

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

    setSkin(skin, true);
    intro();
  });
})();
