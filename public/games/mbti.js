// 职场 MBTI · Outlook「人才盘点问卷 + 投票按钮」
// 真 Outlook 的 Vote 功能就是「一封邮件两个投票按钮，投完跳下一封」——问卷和它是同一个控件。
// 左边四个文件夹 = 四个维度，阅读窗格底部的跟踪条边答边滑。
(function () {
  'use strict';
  var K = window.BPKit;
  if (!K) return;

  // ---- 四维：话 / 卷 / 锅 / 饼。正极在右，负极在左 ----
  var AX = [
    { fold: '话术评估', pos: 'P', neg: 'Y', pn: '拍', nn: '隐' },
    { fold: '投入度评估', pos: 'J', neg: 'T', pn: '卷', nn: '躺' },
    { fold: '责任归属', pos: 'B', neg: 'S', pn: '背', nn: '甩' },
    { fold: '愿景对齐', pos: 'H', neg: 'C', pn: '造饼', nn: '信饼' }
  ];

  // ---- 16 封投票邮件，四维交替出，四根条一起滑 ----
  // pa = 选 A 的人占比（真 Outlook 投票邮件投完就能看统计，这里的百分比本身就是包袱）
  var Q = [
    { ax: 0, fr: '王总', sj: '关于本周部门例会发言安排', n: 412, pa: 38,
      bd: '例会还有 12 分钟，议题是上季度复盘。你手上那个项目跑赢目标 30%，但从头到尾没在任何一场会上出现过。',
      a: '我改一页 PPT，会上讲五分钟', b: '数据都在系统里，有心的人查得到' },
    { ax: 1, fr: '产品组', sj: '本周需求排期确认（今天下班前回复）', n: 388, pa: 57,
      bd: '这版排期排到周五。按你的手速，周三就能收工。确认后同步全组，改不了了。',
      a: '把周四周五填满，多做一个优化', b: '就按周五，多出来的两天是我的' },
    { ax: 2, fr: '质量部', sj: '[P0] 线上事故复盘 - 需明确责任人', n: 401, pa: 44,
      bd: '昨晚线上炸了，起因是一行配置写错。提交记录显示这周有三个人动过它，其中一个是你。',
      a: '先说是我，查清楚了再补充', b: '先把三次提交记录贴到群里' },
    { ax: 3, fr: '王总', sj: '关于明年组织架构调整的一点设想', n: 376, pa: 41,
      bd: '明年可能拆一个新组出来。王总说「做得好的人有机会带」，然后就没有然后了。',
      a: '连夜写一份新组规划发给他', b: '记下来，这半年好好干' },

    { ax: 0, fr: '张工', sj: 'Re: 方案 v3 的一处逻辑问题', n: 395, pa: 46,
      bd: '张工说你方案 v3 的逻辑有问题，可能得推翻重来。这封邮件抄送了全组、王总，以及不知道为什么抄送的 HR。',
      a: '回复全体，把来龙去脉讲清楚', b: '私聊他讲明白，群里一个字不回' },
    { ax: 1, fr: '考勤系统', sj: '[系统自动] 你的打卡记录 - 上周', n: 430, pa: 63,
      bd: '上周你平均 19:42 走，部门平均 20:15。本邮件由系统自动发送，抄送直属上级，无需回复。',
      a: '这周把这 33 分钟补回来', b: '很好，下周争取 18:30 走' },
    { ax: 2, fr: '客户成功部', sj: 'Re: 客户投诉交付延期两周', n: 383, pa: 52,
      bd: '客户投诉交付晚了两周。实际上是他们改了三次需求，三份变更单都躺在你邮箱里，签字齐全。',
      a: '我先跟客户道个歉，责任回头再算', b: '把三份变更单原样转给客户' },
    { ax: 3, fr: '行政部', sj: '[全员] 公司三年愿景发布会 - 周三 15:00', n: 447, pa: 29,
      bd: '周三下午三点全员参加，公布未来三年战略目标。去年那场的三年战略，今年已经没人提了。',
      a: '准备两个问题，会上举手', b: '认真听，认真记，认真鼓掌' },

    { ax: 0, fr: 'HR 李姐', sj: '周六团建活动报名（自愿，不强制）', n: 421, pa: 51,
      bd: '本周六爬山，自愿报名，不强制。补充两句：王总也去，HR 会在群里发合影。',
      a: '报名，并在群里回一句期待', b: '已读不回，周六睡到十一点' },
    { ax: 1, fr: '王总', sj: '周末有个紧急上线，需要一位同学顶一下', n: 399, pa: 34,
      bd: '客户那边催得很急，周末得有人守着。群里发了两遍，二十六个人，无人应答，已经过去四十分钟。',
      a: '我来，顺手把这块彻底理清', b: '再等十分钟，总有人先举手' },
    { ax: 2, fr: '同组小李', sj: '你带的那个实习生出事了', n: 368, pa: 58,
      bd: '你带的实习生把测试库删了。他现在坐在工位上，一动不动，已经四十分钟没说过话。',
      a: '我没交代清楚，算我的', b: '权限是运维给的，先找运维' },
    { ax: 3, fr: 'HR 李姐', sj: 'Re: 关于今年的涨薪窗口', n: 436, pa: 36,
      bd: '今年窗口比较紧，整体幅度不会大。「但表现特别突出的，公司会特殊考虑。」这句话她说得很轻。',
      a: '做一份价值说明，主动约谈', b: '那我等年底评估' },

    { ax: 0, fr: '同组小李', sj: '你的方案刚在会上被点名了', n: 372, pa: 43,
      bd: '刚才开会老板说这个思路不错，问是谁做的。我说是你。他「哦」了一声，翻到了下一页。',
      a: '会后发封邮件，同步细节和进展', b: '他记得最好，不记得也就算了' },
    { ax: 1, fr: 'HR 李姐', sj: '下月内部技术分享会讲师招募', n: 390, pa: 47,
      bd: '还缺一位讲师。不强制，但「计入年度积极性评估」这八个字是加粗的。',
      a: '报名，顺便把三年积累整理成体系', b: '坐第一排听，听众也是参与' },
    { ax: 2, fr: 'HR 李姐', sj: '季度目标未达成说明（周五前提交）', n: 408, pa: 39,
      bd: '目标没达成，需要交一页说明，周五前，存入个人档案，永久保存，本人签字。',
      a: '写自己执行上的三个问题', b: '写资源不足与外部环境变化' },
    { ax: 3, fr: '产品组', sj: '新项目立项评审 - 请确认是否接手', n: 361, pa: 45,
      bd: '这个项目做成了是公司级战果。会上也明确说了：资源自己找，不额外配人，不额外给钱。',
      a: '先讲清它能长成什么样，资源自然会来', b: '有资源我就做，没资源我不吹' }
  ];

  // ---- 16 型：外号 / 刻薄评语 / 适合的工位 / 天敌型号 ----
  var TYPES = {
    PJBH: { nm: '卷王发动机', cm: '你不是在工作，你是在给整层楼制造 KPI。别人加班是被逼的，你加班是自愿的，这是你最可怕的地方。', st: '正对老板办公室的玻璃门，光线充足，随时可被看见。', fo: 'YTSC' },
    PJBC: { nm: '靠谱接盘侠', cm: '老板画的每张饼你都信，还主动帮他把面粉买了。会说、会做、还背锅，唯一的问题是没人告诉过你这样很亏。', st: '会议室隔壁，方便随叫随到。', fo: 'PJSH' },
    PJSH: { nm: '甩锅演说家', cm: '你的 PPT 比你的产出漂亮十倍，你的锅比你的功劳跑得快十倍。开会时你是主角，出事时你是观众。', st: '茶水间旁边，全公司信息流通最快的位置。', fo: 'YJBC' },
    PJSC: { nm: '向上管理专家', cm: '你信老板的饼，也让老板信你的饼，锅从来只在别人手上。你不是在打工，你是在演一部关于打工的连续剧。', st: '老板工位斜后方两米，听得见电话但不用接。', fo: 'YTSH' },
    PTBH: { nm: '嘴强王者', cm: '方案你能讲三小时，正文一行没写。你画的饼确实很香，可惜香味全部来自你自己的想象。', st: '靠窗，风景好，适合思考人生和下一份工作。', fo: 'YJBC' },
    PTBC: { nm: '热心老实人', cm: '谁都能使唤你，谁都不记得你。你相信公司说的一切，包括年会抽奖是随机的。', st: '打印机旁边，方便帮所有人取文件。', fo: 'PJSH' },
    PTSH: { nm: 'PPT 艺术家', cm: '一年做了 87 页 PPT，落地 0 个。但你的动画转场是全公司最好的，这一点没有人否认。', st: '正对会议室大屏，随时可以投屏。', fo: 'YJBC' },
    PTSC: { nm: '会议室常驻民', cm: '你的日历满得像春运车票，可没有一件事是你在做。你在每个群里都说话，在每个项目里都不担责。', st: '会议室最里面那张椅子，进出都要绕过你。', fo: 'YJBH' },
    YJBH: { nm: '沉默造饼人', cm: '你不吭声，但你的方案总能改变方向。别人抢话的时候你在改文档，最后大家用的是你的版本。', st: '角落双屏位，背后是墙，谁都看不见你的屏幕。', fo: 'PJSH' },
    YJBC: { nm: '老黄牛', cm: '全公司最靠得住的人，也是涨薪最慢的人。你以为苦劳会被看见，可惜看见的人正忙着写自己的述职报告。', st: '储物柜和消防栓之间，位置固定，十年没变过。', fo: 'PTSH' },
    YJSH: { nm: '暗线操盘手', cm: '话不多，事全成，锅永远在别人那里。你从不争，但你想要的从来都拿到了。', st: '靠近财务那一排，能听见预算的动静。', fo: 'YJBH' },
    YJSC: { nm: '闷头执行者', cm: '你是最标准的那颗螺丝钉：不问为什么，只问什么时候交。你的问题不是能力，是从不为自己说一句话。', st: '工位号最靠后那个，网线是全公司最长的。', fo: 'PJSH' },
    YTBH: { nm: '隐形设计师', cm: '你有想法，但懒得推。你的好点子最后都出现在别人的述职报告里，连标题都没改。', st: '楼梯间旁边，安静，方便随时下楼。', fo: 'PTSH' },
    YTBC: { nm: '工位隐身人', cm: '你什么都不说、什么都不争，却总是出现在背锅名单上。你不是低调，你是不设防。', st: '消防通道尽头，Wi-Fi 最弱，但一整天没人来。', fo: 'PJSH' },
    YTSH: { nm: '摸鱼哲学家', cm: '你早就看穿了这一切：饼是假的，KPI 是编的，团建是加班。你只是懒得说破而已。', st: '绿植后面，摄像头照不到的那半格。', fo: 'PJBH' },
    YTSC: { nm: '带薪呼吸大师', cm: '不卷、不争、不背、不信。你把上班这件事还原成了它本来的样子：一段有工资的时间。', st: '任何工位。你在哪都一样。', fo: 'PJBH' }
  };

  // 每维答满四题时，盘点专员在批注栏说一句（前半句是评语，后半句是翻译）
  var REMARK = [
    ['HR 李姐', '会上发言积极，沟通意愿强。（翻译：话有点多。）', 'HR 李姐', '沉稳内敛，不争不抢。（翻译：散会后没人记得你来过。）'],
    ['王总', '主动性突出，值得重点培养。（翻译：还能再压一点。）', '王总', '节奏平稳，作息规律。（翻译：不会主动加班。）'],
    ['质量部', '责任心强，勇于担当。（翻译：以后出事先找你。）', '质量部', '边界意识清晰。（翻译：锅甩得比谁都快。）'],
    ['战略部', '有大局观，善于规划。（翻译：你也学会画饼了。）', '战略部', '执行导向明确。（翻译：领导说什么你信什么。）']
  ];

  // 发件人头像：真 Outlook 就是一个带首字的彩色圆
  var AVA = {
    '王总': '#B5564A', 'HR 李姐': '#8B5CA8', '张工': '#2F6B8F', '同组小李': '#3C8C4E',
    '产品组': '#0F6CBD', '质量部': '#C77D2E', '客户成功部': '#1F7A6E',
    '行政部': '#6E7B87', '考勤系统': '#4A4A52'
  };

  // 画像道具：四维各出一件，四个开关组合出 16 张不同的证件照，零图片
  var PROP = [
    ['右上一朵说话气泡', '嘴上一条封条'],
    ['手边一杯冒热气的咖啡', '脑袋上飘着两个 z'],
    ['背后背着一口锅', '锅正飞出画面'],
    ['头顶一张发光的大饼', '眼前吊着一张小饼']
  ];

  K.ready(function () {
    if (typeof registerGame !== 'function') return;

    registerGame({
      id: 'winMBTI', app: 'mail', go: 'mbti',
      title: '人才盘点问卷 - zhuangzhou@paopao.work - Outlook',
      style: 'left:190px;top:84px;width:900px;height:566px',
      tile: ['格', '职场MBTI', '四维盘点', '#0F6CBD', 'icons/it-mbti.png'],
      hall: { nm: '职场MBTI', by: '官方', tip: 64, ic: 'it-mbti' }
    });

    var h = K.shell({
      win: 'winMBTI',
      title: '人才盘点问卷 - zhuangzhou@paopao.work - Outlook',
      crumb: false, side: true, save: 'mbti'
    });
    if (!h) return;

    var sv = h.save, hud = h.hud, sfx = h.sfx, fx = h.fx;
    var ans = [], idx = 0, st = 'intro';

    h.css(
      '&{--word-blue:#0F6CBD}' +
      '.dwb{padding:0;background:#fff}' +
      '.k-stage{padding:0;display:flex;flex-direction:column}' +
      '.k-st{flex:1;min-height:0}' +
      '.k-st.on{display:flex;flex-direction:column}' +
      '.k-side{background:#FAFAFA}' +
      '.k-note.good{border-left-color:#0F6CBD}' +
      '.dwt .rbtn[disabled]{opacity:.45;cursor:default}' +

      // 左侧文件夹树：抄 #olFold 的观感，但作用域私有
      '.mb-grid{flex:1;min-height:0;display:grid;grid-template-columns:172px 1fr}' +
      '.mb-fold{background:#F5F5F5;border-right:1px solid var(--rule-2,#E1DFDD);padding:8px 0;overflow:auto}' +
      '.mb-fold .gp{font-size:10.5px;color:var(--ink-3,#8A8A8A);padding:10px 14px 4px;letter-spacing:1px}' +
      '.mb-fold b{font-weight:400;font-size:12px;color:var(--ink-2,#555);padding:6px 14px;display:flex;' +
      '  align-items:center;border-left:3px solid transparent}' +
      '.mb-fold b.on{background:#E1EDF9;border-left-color:#0F6CBD;color:#0F6CBD;font-weight:600}' +
      '.mb-fold b i{margin-left:auto;font-style:normal;font-size:10.5px;color:#0F6CBD;font-weight:700}' +
      '.mb-fold b.done i{color:#3C8C4E}' +

      // 阅读窗格
      '.mb-read{display:flex;flex-direction:column;min-width:0;overflow:auto}' +
      '.mb-hd{padding:14px 24px 11px;border-bottom:1px solid var(--rule,#EDEBE9);display:flex;gap:12px}' +
      '.mb-hd .av{width:34px;height:34px;border-radius:50%;flex:none;margin-top:3px;color:#fff;' +
      '  display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}' +
      '.mb-hd .tx{flex:1;min-width:0}' +
      '.mb-hd .h1{font-size:16px;color:var(--ink,#222);margin-bottom:7px}' +
      '.mb-hd .mt{font-size:11.5px;color:var(--ink-3,#8A8A8A);line-height:1.9}' +
      '.mb-hd .mt b{color:var(--ink-2,#555);font-weight:600}' +
      // InfoBar：真 Outlook 投票邮件顶部就是这么一条
      '.mb-info{background:#FFF4CE;border-bottom:1px solid #F0DFA0;padding:7px 24px;font-size:11.5px;color:#6B5A20}' +
      '.mb-info.vd{background:#DFF6E4;border-bottom-color:#B4E0BE;color:#2F6B3C}' +
      '.mb-body{padding:16px 24px;font-size:13.5px;line-height:2.05;color:var(--ink,#222);font-family:var(--serif)}' +
      '.mb-vote{display:flex;flex-direction:column;gap:8px;padding:2px 24px 10px}' +
      '.mb-op{display:block;width:100%;text-align:left;font-size:13px;line-height:1.6;cursor:pointer;' +
      '  padding:10px 13px;border-radius:3px;font-family:var(--ui,inherit);color:var(--ink,#222);' +
      '  background:#fff;border:1px solid #C9CDD4;position:relative;overflow:hidden}' +
      '.mb-op:hover{border-color:#0F6CBD;background:#F3F8FD}' +
      '.mb-op.pick{border-color:#0F6CBD;background:#E1EDF9;color:#0F6CBD;font-weight:600}' +
      '.mb-op em{font-style:normal;font-family:var(--mono,monospace);font-size:11px;color:#8A8A8A;margin-right:8px}' +
      '.mb-op.pick em{color:#0F6CBD}' +
      // 投完票才露出的横向占比条，铺在选项底色上：真 Outlook 的投票统计就长这样
      '.mb-op i{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(15,108,189,.12);' +
      '  transition:width .5s cubic-bezier(.2,.8,.3,1);z-index:0}' +
      '.mb-op em,.mb-op span{position:relative;z-index:1}' +
      '.mb-op .pc{float:right;font-family:var(--mono,monospace);font-size:11.5px;color:#0F6CBD;opacity:0;' +
      '  transition:opacity .3s}' +
      '.mb-op.rev .pc{opacity:1}' +
      '.mb-stat{padding:0 24px 14px;font-size:11px;color:var(--ink-3,#8A8A8A);min-height:16px}' +
      '.mb-stat b{color:#0F6CBD;font-weight:600}' +

      // 跟踪：投票统计条，中线锚定，左右两极
      '.mb-track{margin-top:auto;border-top:1px solid var(--rule,#EDEBE9);background:#FAFAFA;padding:9px 24px 11px}' +
      '.mb-track .tt{font-size:10.5px;color:var(--ink-3,#8A8A8A);letter-spacing:1px;margin-bottom:6px}' +
      '.mb-tk{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--ink-3,#8A8A8A);margin-bottom:5px}' +
      '.mb-tk u{text-decoration:none;width:34px;text-align:right;flex:none}' +
      '.mb-tk s{text-decoration:none;width:34px;flex:none}' +
      '.mb-tk .tb{flex:1;position:relative;height:7px;border-radius:4px;background:#E6E6E6;overflow:hidden}' +
      '.mb-tk .tb::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:#C4C4C4}' +
      '.mb-tk .tb b{position:absolute;top:0;bottom:0;width:0;background:#0F6CBD;border-radius:4px;' +
      '  transition:left .34s cubic-bezier(.2,.8,.3,1),width .34s cubic-bezier(.2,.8,.3,1)}' +

      // intro / over 共用的邮件版面
      '.mb-pane{flex:1;min-height:0;overflow:auto;padding:20px 26px 24px;position:relative}' +
      '.mb-pane .h1{font-size:17px;color:var(--ink,#222);margin-bottom:8px}' +
      '.mb-pane .mt{font-size:11.5px;color:var(--ink-3,#8A8A8A);line-height:1.9;padding-bottom:10px;' +
      '  border-bottom:1px solid var(--rule,#EDEBE9);margin-bottom:14px}' +
      '.mb-pane .mt b{color:var(--ink-2,#555);font-weight:600}' +
      '.mb-p{font-size:13.5px;line-height:2.05;color:var(--ink,#222);font-family:var(--serif);margin-bottom:10px}' +
      '.mb-p b{color:#0F6CBD;font-weight:700}' +
      '.mb-code{font-family:var(--mono,monospace);font-size:30px;letter-spacing:8px;color:#0F6CBD;font-weight:700}' +
      '.mb-row{display:flex;gap:18px;align-items:flex-start;margin:6px 0 14px}' +
      '.mb-kv{flex:1;min-width:0;font-size:12.5px;line-height:2.1;color:var(--ink-2,#555)}' +
      '.mb-kv span{color:var(--ink-3,#8A8A8A);display:inline-block;width:74px}' +

      // 附件「你的人格画像.png」= CSS 画的证件照，零图片
      '.mb-att{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--rule,#EDEBE9);' +
      '  border-radius:3px;padding:5px 11px;font-size:11.5px;color:var(--ink-2,#555);background:#fff;cursor:pointer}' +
      '.mb-att:hover{border-color:#0F6CBD;color:#0F6CBD}' +
      '.mb-att i{width:14px;height:16px;border:1px solid #A9B4C0;border-radius:1px;background:' +
      '  linear-gradient(#DDEAF6,#BFD6EC);flex:none}' +

      // ---- 证件照：底板 + 纸人 + 四件道具，四维各控一件，16 型 16 张脸 ----
      '.mb-photo{width:150px;height:196px;border:1px solid #C9CDD4;position:relative;overflow:hidden;flex:none;' +
      '  background:linear-gradient(#E3EEF8,#B9D2EA);box-shadow:0 2px 8px rgba(0,0,0,.16)}' +
      // 背景那圈公司蓝晕，暗示影棚打光
      '.mb-photo::before{content:"";position:absolute;left:50%;top:44px;width:132px;height:132px;' +
      '  transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.75),transparent 66%)}' +
      '.mb-photo .fig{position:absolute;top:40px;left:50%;transform:translateX(-50%);width:44px;height:44px;' +
      '  border-radius:50%;background:#3A4450;z-index:2}' +
      '.mb-photo .fig::after{content:"";position:absolute;top:42px;left:50%;transform:translateX(-50%);' +
      '  width:94px;height:74px;border-radius:32px 32px 0 0;background:#3A4450}' +
      // 衬衫领口：两片白三角，纸人立刻变成"穿正装的人"
      '.mb-photo .col{position:absolute;left:50%;top:82px;transform:translateX(-50%);width:34px;height:22px;z-index:3}' +
      '.mb-photo .col::before,.mb-photo .col::after{content:"";position:absolute;top:0;' +
      '  border-top:16px solid #F2F4F7;border-bottom:6px solid transparent}' +
      '.mb-photo .col::before{left:0;border-right:11px solid transparent}' +
      '.mb-photo .col::after{right:0;border-left:11px solid transparent}' +
      // 工牌挂绳 + 牌子
      '.mb-photo .bdg{position:absolute;left:50%;top:96px;transform:translateX(-50%);width:20px;height:26px;' +
      '  border-radius:2px;background:#F0F2F5;border:1px solid #C3CBD5;z-index:4}' +
      '.mb-photo .bdg::before{content:"";position:absolute;left:50%;top:-11px;transform:translateX(-50%);' +
      '  width:1px;height:11px;background:#8A93A0}' +
      '.mb-photo .bdg::after{content:"";position:absolute;left:3px;right:3px;top:5px;height:2px;' +
      '  background:#0F6CBD;box-shadow:0 4px 0 #C3CBD5,0 8px 0 #C3CBD5}' +
      '.mb-photo .cd{position:absolute;left:0;right:0;bottom:0;background:rgba(15,108,189,.94);color:#fff;' +
      '  font-family:var(--mono,monospace);font-size:13px;letter-spacing:4px;text-align:center;padding:4px 0;z-index:6}' +
      '.mb-photo .pp{position:absolute;z-index:5}' +

      // 话·拍：说话气泡，里面三个点在动
      '.mb-photo .p-P{right:8px;top:26px;background:#fff;border:1px solid #C3CBD5;border-radius:9px;' +
      '  padding:4px 6px;display:flex;gap:3px}' +
      '.mb-photo .p-P::after{content:"";position:absolute;left:7px;bottom:-5px;border-top:6px solid #fff;' +
      '  border-right:7px solid transparent}' +
      '.mb-photo .p-P s{width:4px;height:4px;border-radius:50%;background:#0F6CBD;text-decoration:none;' +
      '  animation:mb-talk 1.3s infinite}' +
      '.mb-photo .p-P s:nth-child(2){animation-delay:.18s}.mb-photo .p-P s:nth-child(3){animation-delay:.36s}' +
      '@keyframes mb-talk{0%,100%{opacity:.28}50%{opacity:1}}' +
      // 话·隐：嘴上一条封条
      '.mb-photo .p-Y{left:50%;top:60px;transform:translateX(-50%) rotate(-7deg);width:40px;height:9px;' +
      '  background:repeating-linear-gradient(45deg,#D8C48A,#D8C48A 4px,#C6AF6E 4px,#C6AF6E 8px);' +
      '  border:1px solid #A9905A;border-radius:1px}' +
      // 卷·卷：一杯冒热气的咖啡
      '.mb-photo .p-J{left:9px;bottom:34px;width:20px;height:22px;background:#F2F4F7;border:1px solid #A9B4C0;' +
      '  border-radius:2px 2px 6px 6px}' +
      '.mb-photo .p-J::before{content:"";position:absolute;right:-6px;top:5px;width:7px;height:9px;' +
      '  border:1px solid #A9B4C0;border-left:0;border-radius:0 6px 6px 0}' +
      '.mb-photo .p-J::after{content:"";position:absolute;left:6px;top:-13px;width:2px;height:11px;' +
      '  background:linear-gradient(#B9C3CE,transparent);border-radius:1px;animation:mb-steam 2s ease-in-out infinite}' +
      '@keyframes mb-steam{0%,100%{opacity:.25;transform:translateY(2px)}50%{opacity:.9;transform:translateY(-3px)}}' +
      // 卷·躺：两个 z 往上飘
      '.mb-photo .p-T{left:12px;top:34px;font-family:var(--mono,monospace);font-size:15px;font-weight:700;' +
      '  color:#5C6B7C;line-height:1;animation:mb-zz 2.6s ease-in-out infinite}' +
      '.mb-photo .p-T em{font-style:normal;font-size:10px;display:block;margin-left:9px;opacity:.7}' +
      '@keyframes mb-zz{0%,100%{transform:translateY(0);opacity:.55}50%{transform:translateY(-5px);opacity:1}}' +
      // 锅·背：背上一口锅（锅体 + 锅把）
      '.mb-photo .p-B{right:14px;bottom:40px;width:32px;height:17px;background:#2E3238;' +
      '  border-radius:0 0 17px 17px;border:1px solid #1E2126}' +
      '.mb-photo .p-B::after{content:"";position:absolute;right:-14px;top:1px;width:15px;height:4px;' +
      '  background:#2E3238;border-radius:2px}' +
      // 锅·甩：同一口锅，飞出画外
      '.mb-photo .p-S{right:-4px;bottom:62px;width:28px;height:15px;background:#2E3238;' +
      '  border-radius:0 0 15px 15px;border:1px solid #1E2126;transform:rotate(28deg);' +
      '  animation:mb-toss 2.4s ease-in-out infinite}' +
      '.mb-photo .p-S::after{content:"";position:absolute;left:-13px;top:1px;width:14px;height:4px;' +
      '  background:#2E3238;border-radius:2px}' +
      '@keyframes mb-toss{0%,100%{transform:rotate(24deg) translate(0,0);opacity:.85}' +
      '  50%{transform:rotate(40deg) translate(7px,-6px);opacity:1}}' +
      // 饼·造饼：头顶一张发光的大饼
      '.mb-photo .p-H{left:50%;top:12px;transform:translateX(-50%);width:52px;height:20px;border-radius:50%;' +
      '  background:radial-gradient(ellipse at 40% 35%,#FFE9A8,#D9A93C);border:1px solid #B98F2C;' +
      '  animation:mb-halo 2.8s ease-in-out infinite}' +
      '@keyframes mb-halo{0%,100%{box-shadow:0 0 0 0 rgba(217,169,60,0)}50%{box-shadow:0 0 12px 3px rgba(217,169,60,.55)}}' +
      // 饼·信饼：眼前吊着一张小饼，钓着你往前
      '.mb-photo .p-C{right:16px;top:34px;width:22px;height:22px;border-radius:50%;' +
      '  background:radial-gradient(circle at 38% 34%,#FFE9A8,#D9A93C);border:1px solid #B98F2C;' +
      '  animation:mb-dangle 2.2s ease-in-out infinite;transform-origin:50% -22px}' +
      '.mb-photo .p-C::before{content:"";position:absolute;left:50%;top:-22px;width:1px;height:22px;background:#9AA3AE}' +
      '@keyframes mb-dangle{0%,100%{transform:rotate(-11deg)}50%{transform:rotate(11deg)}}' +

      '.mb-cap{font-size:11px;color:var(--ink-3,#8A8A8A);line-height:1.8;margin-top:7px;width:150px}' +
      '.mb-act{display:flex;gap:8px;align-items:center;padding-top:6px}' +
      '.mb-act .hint{font-size:11.5px;color:var(--ink-3,#8A8A8A)}'
    );

    // ---------- 计分 ----------
    function axVal(a) {
      var v = 0;
      for (var i = 0; i < Q.length; i++) {
        if (Q[i].ax === a && ans[i]) v += ans[i] === 'a' ? 1 : -1;
      }
      return v;
    }
    function axDone(a) {
      var n = 0;
      for (var i = 0; i < Q.length; i++) if (Q[i].ax === a && ans[i]) n++;
      return n;
    }
    function answered() {
      var n = 0;
      for (var i = 0; i < Q.length; i++) if (ans[i]) n++;
      return n;
    }
    // 未答满的维度用 ? 占位 —— 状态栏能看着型号一位位定下来
    function code(partial) {
      return AX.map(function (x, a) {
        if (partial && axDone(a) < 4) return '?';
        return axVal(a) > 0 ? x.pos : x.neg;
      }).join('');
    }

    // ---------- HUD ----------
    function paintTool() {
      if (st === 'intro') return hud.tool('<button class="rbtn gold mb-start">开始填写</button>', '共 16 项 · 约两分钟');
      if (st === 'over') return hud.tool(
        '<button class="rbtn gold mb-bub">转成泡泡</button>' +
        '<button class="rbtn mb-again">重新盘点</button>' +
        '<button class="rbtn mb-back">回看答卷</button>', '本次盘点已归档');
      hud.tool(
        '<button class="rbtn mb-prev"' + (idx === 0 ? ' disabled' : '') + '>← 上一封</button>' +
        '<button class="rbtn mb-next"' + (idx >= Q.length - 1 ? ' disabled' : '') + '>下一封 →</button>' +
        '<button class="rbtn mb-fin"' + (answered() < Q.length ? ' disabled' : '') + '>出盘点结论</button>',
        '第 ' + (idx + 1) + '/' + Q.length + ' 项 · ' + AX[Q[idx].ax].fold);
    }
    function paintFoot() {
      var done = answered();
      if (st === 'intro') return hud.foot(['共 ' + Q.length + ' 项', '四个维度：话 / 卷 / 锅 / 饼'], '未开始');
      if (st === 'over') {
        var c = code(false);
        hud.foot(['盘点完成', '型号 ' + c, TYPES[c].nm], '已归档');
        return hud.bar(100);
      }
      hud.foot(['第 ' + (idx + 1) + '/' + Q.length + ' 项', '已答 ' + done + ' 项', '当前型号 ' + code(true)],
        '盘点进度 ' + Math.round(done / Q.length * 100) + '%');
      hud.bar(done / Q.length * 100);
    }
    function paintTitle() {
      var done = answered();
      hud.title(st === 'over' ? code(false) + '「' + TYPES[code(false)].nm + '」' : done ? '已填 ' + done + '/' + Q.length : '未填写',
        st === 'play' && done > 0);
    }
    function paintAll() { paintTool(); paintFoot(); paintTitle(); }

    // ---------- 跟踪条 ----------
    function paintTrack() {
      var box = h.states.play.querySelector('.mb-track');
      if (!box) return;
      AX.forEach(function (x, a) {
        var b = box.querySelector('[data-tk="' + a + '"] b');
        if (!b) return;
        var v = axVal(a), w = Math.abs(v) / 4 * 50;
        b.style.left = (v >= 0 ? 50 : 50 - w) + '%';
        b.style.width = w + '%';
      });
    }
    function paintFold() {
      var box = h.states.play.querySelector('.mb-fold');
      if (!box) return;
      AX.forEach(function (x, a) {
        var b = box.querySelector('[data-ax="' + a + '"]');
        if (!b) return;
        var n = axDone(a);
        b.classList.toggle('on', Q[idx].ax === a);
        b.classList.toggle('done', n === 4);
        b.querySelector('i').textContent = n + '/4';
      });
    }

    // ---------- 一封投票邮件 ----------
    function shellPlay() {
      h.states.play.innerHTML =
        '<div class="mb-grid">' +
        '<div class="mb-fold"><div class="gp">人才盘点 2026Q3</div>' +
        AX.map(function (x, a) {
          return '<b data-ax="' + a + '">' + K.esc(x.fold) + '<i>0/4</i></b>';
        }).join('') +
        '<div class="gp">说明</div><b style="color:#8A8A8A">未投票的不归档</b></div>' +
        '<div class="mb-read">' +
        '<div class="mb-info"></div>' +
        '<div class="mb-hd"><div class="av"></div><div class="tx"><div class="h1"></div><div class="mt"></div></div></div>' +
        '<div class="mb-body"></div>' +
        '<div class="mb-vote"></div>' +
        '<div class="mb-stat"></div>' +
        '<div class="mb-track"><div class="tt">跟踪 · 投票统计</div>' +
        AX.map(function (x, a) {
          return '<div class="mb-tk" data-tk="' + a + '"><u>' + K.esc(x.nn) + '</u>' +
            '<i class="tb"><b></b></i><s>' + K.esc(x.pn) + '</s></div>';
        }).join('') + '</div>' +
        '</div></div>';
    }

    function ask(silent) {
      var q = Q[idx], read = h.states.play.querySelector('.mb-read');
      var picked = ans[idx];
      h.states.play.querySelector('.mb-info').className = 'mb-info' + (picked ? ' vd' : '');
      h.states.play.querySelector('.mb-info').textContent = picked
        ? '你在 ' + stamp() + ' 投了「' + (picked === 'a' ? q.a : q.b) + '」票。可以重新选择。'
        : '请单击下面的一项进行投票。你的答复将计入本维度统计。';
      var av = h.states.play.querySelector('.mb-hd .av');
      av.style.background = AVA[q.fr] || '#6E7B87';
      av.textContent = q.fr.replace(/^HR /, '').charAt(0);
      h.states.play.querySelector('.mb-hd .h1').textContent = q.sj;
      h.states.play.querySelector('.mb-hd .mt').innerHTML =
        '<b>' + K.esc(q.fr) + '</b>　发送时间：2026/8/10（周一） 9:' + (12 + idx) + '<br>' +
        '收件人：<b>庄周</b>　　维度：' + K.esc(AX[q.ax].fold) + '　　重要性：高';
      h.states.play.querySelector('.mb-body').textContent = q.bd;
      h.states.play.querySelector('.mb-vote').innerHTML =
        '<button class="mb-op" data-o="a"><i></i><em>投票 A</em><span>' + K.esc(q.a) + '</span><span class="pc"></span></button>' +
        '<button class="mb-op" data-o="b"><i></i><em>投票 B</em><span>' + K.esc(q.b) + '</span><span class="pc"></span></button>';
      if (read) read.scrollTop = 0;
      if (picked) reveal(picked, true);
      else h.states.play.querySelector('.mb-stat').textContent = '';
      paintFold(); paintTrack(); paintAll();
      if (!silent) {
        sfx.play('mail');
        fx.deal(h.states.play.querySelectorAll('.mb-op'), { step: 0.05, sound: false });
      }
    }

    // 投完票揭晓占比：真 Outlook 的投票统计就是投完才看得到，"有多少人和你一样"本身就是包袱
    function reveal(o, silent) {
      var q = Q[idx];
      K.qa('.mb-op', h.states.play).forEach(function (b) {
        var isA = b.dataset.o === 'a', pct = isA ? q.pa : 100 - q.pa;
        b.classList.toggle('pick', b.dataset.o === o);
        b.classList.add('rev');
        b.querySelector('.pc').textContent = pct + '%';
        if (silent) b.querySelector('i').style.transition = 'none';
        b.querySelector('i').style.width = pct + '%';
        if (silent) void b.offsetWidth, b.querySelector('i').style.transition = '';
      });
      var mine = o === 'a' ? q.pa : 100 - q.pa;
      h.states.play.querySelector('.mb-stat').innerHTML =
        '共 ' + q.n + ' 人已投票。和你投了同一项的有 <b>' + mine + '%</b>。' +
        (mine >= 55 ? '（你和大多数人一样。）' : mine <= 42 ? '（你是少数派。）' : '（这题全公司都在犹豫。）');
    }

    function stamp() {
      var d = new Date();
      return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
        d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2);
    }

    // ---------- 投票 ----------
    function vote(o) {
      var q = Q[idx], first = !ans[idx];
      ans[idx] = o;
      sv.set('ans', ans);
      sfx.play('click');
      reveal(o);
      h.states.play.querySelector('.mb-info').className = 'mb-info vd';
      h.states.play.querySelector('.mb-info').textContent =
        '你在 ' + stamp() + ' 投了「' + (o === 'a' ? q.a : q.b) + '」票。可以重新选择。';
      paintFold(); paintTrack(); paintAll();

      if (first && axDone(q.ax) === 4) {
        var r = REMARK[q.ax], up = axVal(q.ax) > 0;
        hud.note(up ? r[0] : r[2], up ? r[1] : r[3], 'good');
      }
      if (answered() >= Q.length) return setTimeout(function () { if (st === 'play') end(); }, 900);

      // 自动跳下一封未投票的：真 Outlook 投完票就是这个行为。留够看统计的时间
      setTimeout(function () {
        if (st !== 'play') return;
        var n = -1, i;
        for (i = idx + 1; i < Q.length; i++) if (!ans[i]) { n = i; break; }
        if (n < 0) for (i = 0; i < Q.length; i++) if (!ans[i]) { n = i; break; }
        if (n < 0) return;
        idx = n;
        ask();
      }, 900);
    }

    function nav(d) {
      var n = idx + d;
      if (n < 0 || n >= Q.length) return;
      idx = n;
      sfx.play('click');
      ask(true);
    }

    // ---------- 人格画像：四维各挂一件道具，16 型 16 张脸，零图片 ----------
    function photo(c) {
      var props = c.split('').map(function (ch) { return '<div class="pp p-' + ch + '">' + (ch === 'P' ? '<s></s><s></s><s></s>' : ch === 'T' ? 'Z<em>z</em>' : '') + '</div>'; }).join('');
      return '<div class="mb-photo">' + props +
        '<div class="fig"></div><div class="col"></div><div class="bdg"></div>' +
        '<div class="cd">' + c + '</div></div>';
    }
    // 画像说明：把四件道具翻译成人话，评委一眼看懂这张图为什么长这样
    function caption(c) {
      return c.split('').map(function (ch, a) {
        return PROP[a][ch === AX[a].pos ? 0 : 1];
      }).join('，') + '。';
    }

    // ---------- 盘点结论 ----------
    function end() {
      st = 'over';
      var c = code(false), t = TYPES[c];
      var rows = AX.map(function (x, a) {
        var v = axVal(a), up = v > 0;
        return '<div><span>' + K.esc(x.fold) + '</span>倾向 <b>' + (up ? x.pn : x.nn) + '</b>（' + (up ? x.pos : x.neg) +
          '）　强度 ' + Math.abs(v) + '/4</div>';
      }).join('');
      h.states.over.innerHTML =
        '<div class="mb-pane" id="mbOver">' +
        '<div class="h1">Re: 2026 Q3 人才盘点问卷 - 盘点结论</div>' +
        '<div class="mt"><b>人才发展部 · 盘点系统</b>　发送时间：' + stamp() + '<br>' +
        '收件人：<b>庄周</b>　　抄送：直属上级　　附件：1 项</div>' +
        '<p class="mb-p">16 项投票已全部收到。经四维测算，你的职场型号为：</p>' +
        '<div class="mb-row"><div class="mb-kv"><div class="mb-code">' + c + '</div>' +
        '<div style="font-size:15px;color:#222;font-weight:700;margin:4px 0 10px">' + K.esc(t.nm) + '</div>' +
        rows +
        '<div><span>建议工位</span>' + K.esc(t.st) + '</div>' +
        '<div><span>天敌型号</span><b>' + t.fo + '</b>「' + K.esc(TYPES[t.fo].nm) + '」，不建议与其组成二人小组</div>' +
        '</div>' +
        '<div><div id="mbPic">' + photo(c) + '</div><div class="mb-cap">' + K.esc(caption(c)) + '</div></div></div>' +
        '<p class="mb-p">' + K.esc(t.cm) + '</p>' +
        '<div style="padding:6px 0 12px"><span class="mb-att" id="mbAtt"><i></i>你的人格画像.png（48 KB）</span></div>' +
        '<div class="mb-act"><button class="rbtn gold mb-bub">转成泡泡，发到水面</button>' +
        '<button class="rbtn mb-again">重新盘点</button>' +
        '<span class="hint">同型号的人会来戳你。</span></div>' +
        '</div>';
      h.go('over');
      paintAll();
      sfx.play('printer');
      fx.stamp(h.states.over.querySelector('#mbOver'), '已归档');
      hud.note('盘点系统', '结论已归档：' + c + '「' + t.nm + '」。本结论将保留至下一次盘点。', 'good');
      sv.set('code', c);
    }

    function intro() {
      st = 'intro';
      var last = sv.get('code', '');
      h.states.intro.innerHTML =
        '<div class="mb-pane">' +
        '<div class="h1">[需处理] 2026 Q3 人才盘点问卷 - 请于本周内完成</div>' +
        '<div class="mt"><b>HR 李姐</b>　发送时间：2026/8/10（周一） 9:05<br>' +
        '收件人：<b>全体员工</b>　　重要性：高　　需要答复：是</div>' +
        '<p class="mb-p">各位同事：</p>' +
        '<p class="mb-p">附上本季度人才盘点问卷，共 <b>16 项</b>，每项两个选项，' +
        '直接点邮件里的投票按钮即可，投完自动跳下一封。全部完成后系统会自动出结论。</p>' +
        '<p class="mb-p">本次盘点覆盖四个维度：<b>话</b>（说不说）、<b>卷</b>（拼不拼）、' +
        '<b>锅</b>（背不背）、<b>饼</b>（信不信），组合为 16 种职场型号。</p>' +
        '<p class="mb-p">问卷结果<b>仅用于人才发展参考</b>，不与绩效挂钩。' +
        '（这句话每一封盘点邮件里都有，你可以自行判断它的含金量。）</p>' +
        '<div class="mb-row"><div class="mb-kv">' +
        '<p class="mb-p" style="margin:0 0 8px">' + (last
          ? '上次盘点结论：<b>' + last + '「' + K.esc((TYPES[last] || {}).nm || '') + '」</b>。这次会重新出一张。'
          : '完成后，系统会自动为你生成一张<b>人格画像</b>作为附件。') + '</p>' +
        '<div class="mb-cap" style="width:auto">画像上的道具由你的四个维度决定：说得多的人有说话气泡，' +
        '不说的人嘴上贴封条；卷的人手边有咖啡，躺的人头上飘着 z；背锅的人背上有锅，' +
        '甩锅的人锅正飞出画面；造饼的人头顶有大饼，信饼的人眼前吊着一张小饼。共 16 种组合。</div>' +
        '</div>' +
        '<div><div id="mbPicDemo">' + photo(last && TYPES[last] ? last : 'PJBH') + '</div>' +
        '<div class="mb-cap">' + (last && TYPES[last] ? '上次的画像' : '示例：PJBH「卷王发动机」') + '</div></div></div>' +
        '<div class="mb-act"><button class="rbtn gold mb-start">开始填写</button>' +
        '<span class="hint">中途可用工具栏「← 上一封」回去改。</span></div>' +
        '</div>';
      h.go('intro');
      paintAll();
    }

    function start(keep) {
      st = 'play';
      if (!keep) { ans = []; sv.set('ans', ans); hud.clearNotes(); }
      idx = 0;
      for (var i = 0; i < Q.length; i++) if (!ans[i]) { idx = i; break; }
      hud.note('盘点系统', '共 ' + Q.length + ' 项，投完自动跳下一封。左侧四个文件夹是四个维度，右下角跟踪条会跟着你的选择滑动。', '');
      shellPlay();
      h.go('play');
      ask();
    }

    // ---------- 唯一的委托监听：工具条和正文一起管 ----------
    h.win.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button,.mb-att') : null;
      if (!t || !h.win.contains(t) || t.disabled) return;
      if (t.classList.contains('mb-start')) { sfx.play('enter'); return start(false); }
      if (t.classList.contains('mb-again')) { sfx.play('click'); ans = []; sv.set('ans', ans); hud.clearNotes(); return start(false); }
      if (t.classList.contains('mb-back')) { sfx.play('click'); return start(true); }
      if (t.classList.contains('mb-prev')) return nav(-1);
      if (t.classList.contains('mb-next')) return nav(1);
      if (t.classList.contains('mb-fin')) { sfx.play('click'); return end(); }
      if (t.classList.contains('mb-op')) return vote(t.dataset.o);
      if (t.id === 'mbAtt') {
        sfx.play('stamp');
        fx.pop(h.states.over.querySelector('.mb-photo'));
        hud.toast('人格画像.png 已保存到「图片」', 'mbti');
        return;
      }      if (t.classList.contains('mb-bub')) {
        var c = code(false), ty = TYPES[c];
        if (typeof mk === 'function') {
          mk('测出来我的职场型号是 ' + c + '「' + ty.nm + '」：' + ty.cm.slice(0, 24) + '…', 'fun', 12, 'user', '职场MBTI');
          if (typeof sync === 'function') sync();
        }
        sfx.play('coin');
        K.swagger.add(4);
        hud.toast('已经飘到水面上了。同型号的人会来戳你。', 'home');
        paintAll();
      }
    });

    h.win.__game = {
      state: function () { return st; },
      idx: function () { return idx; },
      answered: function () { return answered(); },
      code: function (p) { return code(!!p); },
      ax: function (a) { return axVal(a); },
      vote: function (o) { vote(o); }
    };

    var saved = sv.get('ans', null);
    if (saved && saved.length) ans = saved.slice(0, Q.length);
    intro();
  });
})();
