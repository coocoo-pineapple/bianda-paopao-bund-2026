/* ============================================================
   变大泡泡 · 伪装壳系统
   一份内容，四个壳。只换画框，不动内容。
   依赖 app.html 内联脚本里的全局：$ $$ go S esc buildDesktop
   本文件不碰泡泡物理、不碰 S 状态、不重建任何模块 DOM。
   ============================================================ */
'use strict';

const XL_RIBBON = `
  <div class="rgrp"><span class="rlab">剪贴板</span><button class="rbtn">粘贴</button></div>
  <div class="rgrp"><span class="rlab">字体</span><button class="rbtn">宋体</button><button class="rbtn">11</button></div>
  <div class="rgrp"><span class="rlab">数字</span><button class="rbtn">常规</button><button class="rbtn">%</button></div>
  <div class="rgrp"><span class="rlab">单元格</span><button class="rbtn">格式</button></div>
  <div class="rgrp"><span class="rlab">编辑</span><button class="rbtn">求和</button><button class="rbtn">筛选</button></div>`;

const PPT_RIBBON = `
  <div class="rgrp"><span class="rlab">幻灯片</span><button class="rbtn">新建</button><button class="rbtn">版式</button></div>
  <div class="rgrp"><span class="rlab">字体</span><button class="rbtn">等线</button><button class="rbtn">28</button></div>
  <div class="rgrp"><span class="rlab">绘图</span><button class="rbtn">排列</button></div>
  <div class="rgrp"><span class="rlab">放映</span><button class="rbtn pri" id="pptPlay">从头开始</button></div>`;

const WORD_TABS = ['开始', '插入', '绘图', '引用', '审阅', '视图'];

const MAIL_RIBBON = `
  <div class="rgrp"><span class="rlab">新建</span><button class="rbtn pri">新建邮件</button></div>
  <div class="rgrp"><span class="rlab">删除</span><button class="rbtn">存档</button><button class="rbtn">删除</button></div>
  <div class="rgrp"><span class="rlab">响应</span><button class="rbtn" id="mailReply">答复</button><button class="rbtn">转发</button></div>
  <div class="rgrp"><span class="rlab">咨询</span><button class="rbtn" id="mailQuote">报价</button><button class="rbtn" id="mailClose">结案</button></div>
  <div class="rgrp"><span class="rlab">导出</span><button class="rbtn">另存为 Word</button></div>`;

const CHAT_RIBBON = `
  <div class="rgrp"><span class="rlab">会话</span><button class="rbtn">发起群聊</button><button class="rbtn">会议</button></div>
  <div class="rgrp"><span class="rlab">机器人</span><button class="rbtn pri" id="chatHire">放进水域</button><button class="rbtn" id="chatReap">收菜</button></div>
  <div class="rgrp"><span class="rlab">工具</span><button class="rbtn">日程</button><button class="rbtn">审批</button></div>`;

const BI_RIBBON = `
  <div class="rgrp"><span class="rlab">时间</span><button class="rbtn">今日</button><button class="rbtn pri">近 7 天</button><button class="rbtn">近 30 天</button></div>
  <div class="rgrp"><span class="rlab">维度</span><button class="rbtn">按分区</button><button class="rbtn">按马甲</button></div>
  <div class="rgrp"><span class="rlab">操作</span><button class="rbtn">刷新</button><button class="rbtn">导出 Excel</button></div>`;

const SHELLS = [
  { id: 'word',  title: '2026年度第三季度工作述职报告.docx - Word',
    tabs: WORD_TABS, ribbon: null, view: null },
  { id: 'excel', title: '2026年度预算表.xlsx - Excel',
    tabs: ['开始', '插入', '页面布局', '公式', '数据', '审阅'], ribbon: XL_RIBBON, view: 'home' },
  { id: 'ppt',   title: '组织架构调整_说明.pptx - PowerPoint',
    tabs: ['开始', '插入', '设计', '切换', '动画', '幻灯片放映'], ribbon: PPT_RIBBON, view: 'review' },
  { id: 'mail',  title: '收件箱 - zhuangzhou@paopao.work - Outlook',
    tabs: ['开始', '发送/接收', '文件夹', '视图', '帮助'], ribbon: MAIL_RIBBON, view: 'mail' },
  { id: 'chat',  title: '钉钉 - 产品二部',
    tabs: ['消息', '通讯录', '工作台', '文档', '会议'], ribbon: CHAT_RIBBON, view: 'chat' },
  { id: 'bi',    title: '经营分析看板 - 数据平台',
    tabs: ['概览', '报表', '指标', '预警', '导出'], ribbon: BI_RIBBON, view: 'ops' },
  { id: 'desk',  title: null, tabs: WORD_TABS, ribbon: null, view: null }
];

/* ---------- 功能表：功能带着壳走，顺序就是转化漏斗 ----------
   钩子（八卦把人拉进来）→ 趣味（玩住了）→ 干货（学到了）→ 变现（付钱了）。
   ` 键顺着按一圈，走的就是这条漏斗。 */
const FEATURES = [
  { v: 'home',   nm: '泡泡广场',   shell: 'word',  stg: '钩子' },
  { v: 'insert', nm: '吹泡泡',     shell: 'word',  stg: '钩子' },
  { v: 'draw',   nm: '拼豆',       shell: 'excel', stg: '趣味' },
  { v: 'review', nm: '梦蝶局',     shell: 'ppt',   stg: '趣味' },
  { v: 'chat',   nm: '机器人放养', shell: 'chat',  stg: '趣味' },
  { v: 'desk',   nm: '桌面 · 电视', shell: 'desk', stg: '趣味' },
  { v: 'salary', nm: '薪资情报',   shell: 'excel', stg: '干货' },
  { v: 'jobs',   nm: '岗位机会',   shell: 'excel', stg: '干货' },
  { v: 'ref',    nm: '干货区',     shell: 'word',  stg: '干货' },
  { v: 'mail',   nm: '付费咨询',   shell: 'mail',  stg: '变现' },
  { v: 'ops',    nm: '运营后台',   shell: 'bi',    stg: '变现' },
  { v: 'task',   nm: '监视器',     shell: 'word',  stg: '钩子' },
  { v: 'trash',  nm: '回收站',     shell: 'word',  stg: '钩子' },
  { v: 'phone',  nm: '捡手机',     shell: 'word',  stg: '趣味' }
];
const STG_COL = { '钩子': '#C0503F', '趣味': '#3E8F82', '干货': '#3F72A4', '变现': '#C9962E', '证据': '#9B7FD4', '闭环': '#2B579A' };

const IX = id => SHELLS.findIndex(s => s.id === id);

// 唯一入口：定功能，壳自己跟上
function goFeature(v) {
  const f = FEATURES.find(x => x.v === v);
  if (!f) return go(v);
  wearShell(IX(f.shell), f.v);
}

let shellIx = 0;        // 当前壳
let curView = 'home';   // 当前功能
let xlSheet = 'draw';   // Excel 当前工作表

/* ---------- 换壳：硬切，零动画 ---------- */
function wearShell(i, view) {
  const s = SHELLS[i];
  shellIx = i;

  restoreAll();                       // 先把上一个壳借走的模块还回原位
  document.body.dataset.shell = s.id;
  if (s.title) $('#tbTitle').textContent = s.title;

  const tabEls = $$('.tabs .t:not(.file)');
  s.tabs.forEach((label, k) => { if (tabEls[k]) tabEls[k].textContent = label; });
  if ($('#pgno')) $('#pgno').textContent = STATUS[s.id] || '第 1 页，共 8 页';

  // 桌面壳复用已有的 desktopMask，但不置 maskOn —— 水面必须继续跑
  $('#desktopMask').classList.toggle('on', s.id === 'desk');

  const v = view || s.view || 'home';
  curView = s.id === 'desk' ? 'desk' : v;

  if (s.id === 'excel') { buildExcelGrid(); buildGameHall(); buildSkinShop(); xlSheet = v; markSheet(); shellGo(v); }
  else if (s.id === 'ppt') { buildRail(); shellGo(v); }
  else if (s.id === 'mail') { buildMail(); lend('mail'); shellGo(v); }
  else if (s.id === 'chat') { buildChat(); lend('chat'); shellGo(v); }
  else if (s.id === 'bi') { buildBI(); shellGo(v); }
  else if (s.id === 'desk') { buildDesk(); }
  else { go(v); markTabs(v); }
  markSwitcher();
}

// 循环走的是功能，不是壳 —— 顺着按一圈正好把十个功能七个界面都过一遍
function nextShell() {
  const i = FEATURES.findIndex(f => f.v === curView);
  goFeature(FEATURES[(i + 1) % FEATURES.length].v);
}

const STATUS = {
  word: '第 1 页，共 8 页', excel: '就绪',
  mail: '项目: 47　未读: 12', chat: '在线　产品二部 · 38 人',
  bi: '数据截至 09:12　自动刷新: 开'
};

function currentView() {
  const v = $$('.view').find(x => x.classList.contains('on'));
  return v ? v.id.slice(2) : 'home';
}

// Word 壳：六个选项卡对应六个板块，点了要高亮
function markTabs(v) {
  const map = { home: 0, insert: 1, draw: 2, ref: 3, review: 4, ops: 5 };
  const k = map[v];
  $$('.tabs .t:not(.file)').forEach((t, i) => t.classList.toggle('on', i === k));
}

// 非 Word 壳里，顶部选项卡是装饰，功能区由壳自己定
function shellGo(v) {
  go(v);
  const r = SHELLS[shellIx].ribbon;
  if (r != null) $('#ribbon').innerHTML = r;
  $$('.tabs .t:not(.file)').forEach((t, k) => t.classList.toggle('on', k === 0));
}

/* ---------- Excel 壳 ---------- */
const XL_COL_W = 108;

function buildExcelGrid() {
  const cols = $('#xlCols');
  if (!cols.dataset.built) {
    let h = '<i></i>';
    for (let k = 0; k < 26; k++) h += `<i style="width:${XL_COL_W}px">${String.fromCharCode(65 + k)}</i>`;
    cols.innerHTML = h;
    let r = '';
    for (let k = 1; k <= 60; k++) r += `<i>${k}</i>`;
    $('#xlRows').innerHTML = r;
    cols.dataset.built = '1';
    buildSalary();
    buildJobs();
    $('#xlTabs').addEventListener('click', e => {
      const b = e.target.closest('b'); if (!b || !b.dataset.v) return;
      goFeature(b.dataset.v);
      setFormula(b.textContent.split('·')[1].trim(), 'A1');
    });
  }
  syncRowScroll();
}

function markSheet() {
  $$('#xlTabs b').forEach(x => x.classList.toggle('on', x.dataset.v === xlSheet));
}

// 行号跟着内容一起滚，不然一眼假
function syncRowScroll() {
  const dw = $('.docwrap'), rows = $('#xlRows');
  if (dw.dataset.xlbound) return;
  dw.addEventListener('scroll', () => {
    if (document.body.dataset.shell === 'excel') rows.scrollTop = dw.scrollTop;
  });
  dw.dataset.xlbound = '1';
}

function setFormula(text, ref) {
  $('#nameBox').textContent = ref || 'A1';
  $('#formulaIn').textContent = text || '';
}

/* 薪资情报表：行业泡泡沉淀下来的资讯库。演示数据，UI 上已标注。
   公司用影射式写法，和水面泡泡同一套世界观。最炸的数字放第一行。 */
const SALARY = [
  ['某宗厂 · 杭州',   '技术 · P7',  '55k × 16',  '面试 offer',   '3 人作保'],
  ['某宗厂 · 杭州',   '技术 · P6',  '38k × 16',  '望洋兴叹的 offer', '3 人作保'],
  ['某鹅系 · 深圳',   '技术 · 3-1', '52k × 16',  '面试 offer',   '2 人作保'],
  ['某跳动 · 北京',   '产品 · 2-1', '32k × 15',  '内推群截图',   '待验证'],
  ['某跳动 · 北京',   '运营 · 2-2', '41k × 15',  '同岗位跳槽',   '4 人作保'],
  ['某新势力车企',    '算法 · P7',  '48k × 14',  '猎头报价',     '3 人作保'],
  ['某泥厂 · 上海',   '科技岗 · 三级', '21k × 18', '入职半年',   '5 人作保'],
  ['某外企 · 上海',   'Sr. Eng',    '46k × 13',  '内部调薪',     '2 人作保'],
  ['某 SaaS · 北京',  '销售 · M1',  '25k + 提成', '公开 JD',     '待验证'],
  ['某菊厂 · 深圳',   '硬件 · 14 级', '36k × 15', '前同事酒后说的',    '3 人作保']
];

/* 剧本人物穿透：Excel 来源列里他的名字是个真链接，点了跳去他那封信 */
function openStoryMail() {
  mailFolder = 'ask';
  mailIx = Math.max(0, MAILS.ask.findIndex(m => m.fr === '望洋兴叹'));
  buildMail(); renderMailList();
  $$('#olFold b').forEach(x => x.classList.toggle('on', x.dataset.f === 'ask'));
  goFeature('mail');
}

function buildSalary() {
  const head = ['公司', '职级', '包裹', '来源', 'offer 作保'];
  let h = '<tr class="xlh"><th class="rn"></th>' + head.map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('') + '</tr>';
  h += '<tr><th class="rn">1</th>' + head.map(x => `<th>${x}</th>`).join('') + '</tr>';
  SALARY.forEach((r, k) => {
    h += `<tr><th class="rn">${k + 2}</th>` + r.map((c, i) =>
      `<td class="${i === 2 ? 'n' : ''}${i >= 3 ? ' cf' : ''}">${esc(c)}</td>`).join('') + '</tr>';
  });
  $('#salTab').innerHTML = h;
  $$('#salTab td').forEach(td => { if (td.textContent.includes('望洋兴叹')) td.classList.add('lk'); });
  $('#salTab').addEventListener('click', e => {
    const td = e.target.closest('td'); if (!td) return;
    if (td.classList.contains('lk')) return openStoryMail();   // 点他的名字，跳去他那封信
    $$('#salTab td.sel').forEach(x => x.classList.remove('sel'));
    td.classList.add('sel');          // 绿框 + 填充柄，Excel 的选中态
    const col = String.fromCharCode(64 + td.cellIndex);
    setFormula(td.textContent, col + (td.parentNode.rowIndex));
  });
}

/* 岗位机会表：来源列写明是机器人扒的还是网友分享的 */
const JOBS = [
  ['产品经理 · 中台',  '某鹅系 · 深圳', '35-55k · 15薪', '机器人抓取 · 官网',    '在招'],
  ['算法工程师',       '某新势力 · 上海', '45-70k · 14薪', '机器人抓取 · 猎头站',  '在招'],
  ['运营专家',         '某跳动 · 北京', '30-45k · 15薪', '守株待兔 · 内推',      '内推位 +2'],
  ['前端工程师',       '某 SaaS · 远程', '30k · 双休不打卡', '井底之蛙 · 内推',   '已收到 9 份简历'],
  ['数据分析',         '某宗厂 · 杭州', '28-40k · 16薪', '机器人抓取 · JD 比对', '今日新增'],
  ['HRBP',             '某菊厂 · 东莞', '25-35k · 14薪', '鼓盆而歌 · 分享',      '在招'],
  ['测试开发',         '某泥厂 · 上海', '26-38k · 18薪', '机器人抓取 · 官网',    '缩编中'],
  ['解决方案架构师',   '某外企 · 北京', '55-75k · 13薪', '机器人抓取 · 领英',    '在招']
];

function buildJobs() {
  const head = ['岗位', '公司', '包裹', '来源', '状态'];
  let h = '<tr class="xlh"><th class="rn"></th>' + head.map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('') + '</tr>';
  h += '<tr><th class="rn">1</th>' + head.map(x => `<th>${x}</th>`).join('') + '</tr>';
  JOBS.forEach((r, k) => {
    h += `<tr><th class="rn">${k + 2}</th>` + r.map((c, i) =>
      `<td class="${i === 2 ? 'n' : ''}${i >= 3 ? ' cf' : ''}">${esc(c)}</td>`).join('') + '</tr>';
  });
  $('#jobTab').innerHTML = h;
  if ($('#jobTab').dataset.bound) return;
  $('#jobTab').dataset.bound = '1';
  $('#jobTab').addEventListener('click', e => {
    const td = e.target.closest('td'); if (!td) return;
    $$('#jobTab td.sel, #salTab td.sel').forEach(x => x.classList.remove('sel'));
    td.classList.add('sel');
    setFormula(td.textContent, String.fromCharCode(64 + td.cellIndex) + td.parentNode.rowIndex);
  });
}

/* ---------- PPT 壳 ---------- */
const SLIDES = [
  { t: '化蝶 · 梦蝶局', n: '这一页是入口。四个 AI 各拿一张身份卡，只看得到公开发言，看不到彼此的卡。' },
  { t: '开局 · 身份分发', n: '破绽通常出现在第二轮：有人会引用一句自己不该知道的话。' },
  { t: '试探 · 第一轮发言', n: '注意谁在抢着定义议题——先立框架的人往往心里有鬼。' },
  { t: '押注 · 投票页', n: '押注不消耗热度，但押错会掉马甲信誉。' },
  { t: '揭底 · 总结页', n: '揭底后破绽逐条回放。这是整局唯一有教育价值的部分。' },
  { t: '博主机器人 · 人格 DNA', n: '他是谁、在意什么、绝不说什么。第三项最难写，也最值钱。' },
  { t: '博主机器人 · 框架库', n: '他遇事先掏哪把尺子。没有尺子的人，答什么都像安慰。' },
  { t: '博主机器人 · 固定动作', n: '先复述、再判断、最后给一个今天就能做的动作。少一步就变鸡汤。' },
  { t: '博主机器人 · 禁区', n: '不承诺结果、不做投资建议、不替你决定。写清楚了他才敢说话。' },
  { t: '收菜 · 一键 Word', n: '把这一局的收获导出成述职报告的一段。玩出来的东西，也是产出。' }
];

function buildRail() {
  const rail = $('#pptRail');
  if (rail.dataset.built) return;
  rail.innerHTML = SLIDES.map((s, i) =>
    `<div class="sl${i === 0 ? ' on' : ''}" data-i="${i}"><div class="no">${i + 1}</div><div class="th">${esc(s.t)}</div></div>`
  ).join('');
  rail.addEventListener('click', e => {
    const sl = e.target.closest('.sl'); if (!sl) return;
    pickSlide(+sl.dataset.i);
  });
  rail.dataset.built = '1';
  pickSlide(0);
}

function pickSlide(i) {
  $$('#pptRail .sl').forEach(x => x.classList.toggle('on', +x.dataset.i === i));
  $('#pptNote').textContent = SLIDES[i].n;
  $('#slideTitle').textContent = SLIDES[i].t;
  $('#slideSub').textContent = `组织架构调整 · 第 ${i + 1} 节 · 共 ${SLIDES.length} 节`;
  const pc = $('#pptCnt'); if (pc) pc.textContent = `幻灯片 ${i + 1}/${SLIDES.length}　中文(中国)`;
}

/* ---------- 模块租借：搬家不重建 ----------
   事件监听、定时器、内部状态全部保留，所以图片查看器里的水面还在跑，
   换回 Word 壳时一个泡泡都不少。 */

const LOANS = {
  mail: [['#workshop', '#mailBody']],
  chat: [['#farmPanel', '#imBody', 1]],
  desk: [['#stage', '#photoBody'], ['#dreamGame', '#videoBody'], ['#phoneStories', '#phoneBody']]
};

const HOMES = new Map();   // sel -> { el, parent, next }
let zTop = 10;

// 视图隐藏时 clientWidth 为 0，量到 0 会把泡泡全挤到左上角
function safeSize(){ const s = $('#stage'); if (s && s.clientWidth > 40 && s.clientHeight > 40) size(); }

// whole=1 时连整张卡片一起搬（要带标题的场合），否则只搬内容体
function lend(shellId) {
  (LOANS[shellId] || []).forEach(([src, dst, whole]) => {
    const el = whole ? ($(src).closest('.card') || $(src)) : $(src);
    if (!HOMES.has(src)) HOMES.set(src, { el, parent: el.parentNode, next: el.nextSibling });
    $(dst).appendChild(el);
  });
  requestAnimationFrame(safeSize);
}

function restoreAll() {
  if (!HOMES.size) return;
  HOMES.forEach(h => h.parent.insertBefore(h.el, h.next));
  requestAnimationFrame(safeSize);
}

/* ---------- Outlook 壳 · 蒸馏问答与付费咨询 ---------- */
const MAILS = {
  ask: [
    { fr: '接单参谋', tm: '11:20', sj: '本周接单建议',
      pv: '水面这周就三个词：绩效、offer、约谈。价格建议已经想好了，你只需要挂出去。', un: 1,
      body: '本周水面热度榜前三，都不是新鲜事——不新鲜才好接。\n第一，绩效打包。「全组绩效打包送给了空降领导」这条还在飘，问的人一多，答案其实都差不多：先要一份书面认定，再谈别的。这种题机器人接得住，挂 99。\n第二，offer 比价。「P7 offer 55k×16」和「涨 20% 但要去外地」两条都在对标表里躺着，问的人数字都算好了，缺的是判断——这种题建议直接上真人档，599。\n第三，试用期约谈。这条不用去水面找，你自己收件箱里就有一封——呆若木鸡那句「试用期最后一周被约谈了」。机器人先接，接不住的部分转真人，别自己白答。\n三条选题，两个价位，别都用 99 打发，也别都甩给匠石。加急插队 +100，这周已经有人为这个多付过钱。' },
    { fr: '井底之蛙', tm: '09:41', sj: '三年经验，现在跳槽是不是自杀', pv: '组里刚裁完一轮，我手上项目黄了一半。想跑但看招聘信息又都在缩编，怕跳出去更难受。', un: 1 },
    { fr: '守株待兔', tm: '09:22', sj: '被安排背锅了，要不要撕', pv: '线上事故复盘把我写成第一责任人，实际改配置的是隔壁组。撕了得罪人，不撕进档案。', un: 1 },
    { fr: '鼓盆而歌', tm: '08:57', sj: '35 岁转管理还是继续写代码', pv: '技术线看得到天花板，管理岗又要重新攒人脉。两条路都在关门的感觉。', un: 1 },
    { fr: '望洋兴叹', tm: '昨天', sj: 'offer 涨 20% 但要去外地，值吗', pv: '包裹从 32 到 38，但对象在本地，来回一年机票就小两万。',
      body: '老庖：\n包裹从 32 涨到 38，某宗厂杭州，P6。但对象在本地，来回一年机票就小两万。\n这事我先发到水面上了（就是今天飘着的那颗），也把数字填进了对标表——Sheet2 第 3 行 38k×16 那行就是我，敢写就敢被验证。\n三个不同公司的人给我作了保，现在就差一个判断：这 6k 是机会的价格，还是异地的赔偿金？\n预算 99，超了转匠石也行。\n—— 望洋兴叹（某宗厂 · 互联网 P6）' },
    { fr: '呆若木鸡', tm: '昨天', sj: '试用期最后一周被约谈了', pv: 'HR 说"再看看"，主管说"没问题"。两个人说法不一样，我该信谁。' }
  ],
  paid: [
    { fr: '老庖 · 机器人顾问', tm: '10:02', sj: 'Re: 三年经验，现在跳槽是不是自杀', pv: '先说结论：现在跳不是自杀，裸辞才是。你手上黄了一半的项目，在面试里能变成资产，我教你怎么讲。', pay: '机器人咨询 · 99 元 · 已支付', un: 1,
      body: '先复述：你问的不是跳不跳，是跳了会不会更惨。\n判断：项目黄了一半是你的止损信号，不是你的罪证。市场缩编不代表你贬值，代表议价窗口变窄——窄不等于关。\n可执行动作：这周只做一件事，把你负责那半个项目的三个数字写进简历——上线时间、成本、留下来的人数。有数字的三年和没数字的八年，在筛简历的人眼里一样长。\n（本单 99 元机器人档。超出我边界的部分——比如要不要为了对象留在这座城市——我不接，会原价转给真人。）' },
    { fr: '匠石 · 真人专家', tm: '09:15', sj: 'Re: 35 岁转管理还是继续写代码', pv: '真人深度咨询：你的问题我拆成三问回你：一、你要的是 title 还是决策权；二、你现在的技术深度能不能撑到 40；三、你团队里有没有人愿意跟你走。', pay: '真人深度咨询 · 599 元 · 已支付', un: 1,
      body: '真人深度咨询，先把你的问题拆成三问。\n一、你要的是 title 还是决策权。管理岗给你的如果只是背更多锅的资格，那不叫上升通道。\n二、你现在的技术深度，够不够撑到 40 岁——不是你还能不能写，是别人还愿不愿意为你的判断付钱。\n三、你团队里有没有人愿意跟你走。有，说明你已经在做管理了，差的只是名分；没有，先别急着要名分。\n把三个答案写下来发我，48 小时内回你完整方案。\n运斤成风的前提，是有个敢站着不动的人——你得先告诉我，你的郢人是谁。\n—— 匠石（真人档 · 599）' },
    { fr: '结算中心', tm: '08:30', sj: '本月咨询分成结算单', pv: '本月完成咨询 14 单（机器人 9 单 / 真人 5 单），总额 4,186 元，社区抽成 20%，实发 3,348.80 元。明细见附件。', pay: '账单 · 已出账', un: 1,
      body: '本月完成咨询 14 单：机器人 9 单 × 99 元 = 891 元，真人 5 单 × 599 元 = 2,995 元，加急插队 3 次 × 100 元 = 300 元，合计 4,186 元。\n社区抽成 20%，实发 3,348.80 元。\n本月退款 0 单。有一位用户申请退款，理由是「你说的我都知道」。我们回复「知道和做到之间那 599 块，是您自己欠的」，对方撤回了申请。' }
  ],
  sent: [{ fr: '我', tm: '09:50', sj: 'Re: 被安排背锅了，要不要撕', pv: '先别撕。你现在要做的是把改配置的时间线截图存下来，这是你唯一的资产。' }],
  draft: [{ fr: '草稿', tm: '—', sj: '（无主题）', pv: '本来想问问要不要去创业公司，写到一半觉得自己已经知道答案了。' }],
  done: [{ fr: '井底之蛙', tm: '07-31', sj: '已结案 · 谢谢，我留下来了', pv: '按你说的先把手上的事做完整，两周后主管主动找我谈了加薪。', pay: '已结案 · 好评' }],
  bill: [{ fr: '结算中心', tm: '07-31', sj: '7 月咨询分成结算单', pv: '7 月完成咨询 21 单，总额 6,890 元，实发 5,512 元。', pay: '账单 · 已到账' }]
};

let mailFolder = 'ask', mailIx = 0;
function mailUnreadSync() {
  $$('#olFold b[data-f]').forEach(b => {
    const i = b.querySelector('i'); if (!i) return;
    const n = (MAILS[b.dataset.f] || []).filter(m => m.un).length;
    i.textContent = n || ''; i.style.display = n ? '' : 'none';
  });
}

function buildMail() {
  if (!$('#olFold').dataset.built) {
    // 创作者工作台：伪装 Outlook，实际管自己的顾问业务
    const FOLD_LABEL = { ask: '待接单', paid: '进行中订单', done: '已交付', bill: '结算' };
    $$('#olFold b[data-f]').forEach(b => {
      const lbl = FOLD_LABEL[b.dataset.f];
      if (!lbl) return;
      const i = b.querySelector('i');
      b.textContent = lbl;
      if (i) b.appendChild(i);
    });
    if ($('#mailHd')) $('#mailHd').insertAdjacentHTML('beforebegin',
      '<div class="zz" style="padding:8px 26px 0;margin:0"><span class="zq">「自夫子之死也，吾无以为质矣」——《庄子 · 徐无鬼》匠石运斤</span><span class="zh">手艺值钱，是因为有人识货。你司没有质，江湖上有</span></div>' +
      '<div id="mailRateCard"><b>我的接单价</b>' +
      '<span>基础问答 <em>¥99</em><span class="rc-sub">（机器人代答，我复核）</span></span>' +
      '<span>深度咨询 <em>¥599</em><span class="rc-sub">（真人 48h）</span></span>' +
      '<span>加急 <em>+¥100</em></span></div>');
    $('#olFold').addEventListener('click', e => {
      const b = e.target.closest('b'); if (!b) return;
      $$('#olFold b').forEach(x => x.classList.toggle('on', x === b));
      mailFolder = b.dataset.f; mailIx = 0; renderMailList();
    });
    $('#olList').addEventListener('click', e => {
      const m = e.target.closest('.ml'); if (!m || m.dataset.i == null) return;
      mailIx = +m.dataset.i;
      const mail = (MAILS[mailFolder] || [])[mailIx];
      if (mail && mail.un) delete mail.un;
      mailUnreadSync(); renderMailList();
    });
    $('#olFold').dataset.built = '1';
  }
  renderMailList();
}

function renderMailList() {
  const list = MAILS[mailFolder] || [];
  $('#olList').innerHTML = list.map((m, i) => `
    <div class="ml${i === mailIx ? ' on' : ''}${m.un ? ' un' : ''}" data-i="${i}">
      <div class="fr">${esc(m.fr)}<span>${esc(m.tm)}</span></div>
      <div class="sj">${esc(m.sj)}</div>
      <div class="pv">${esc(m.pv)}</div>
      ${m.pay ? `<div class="pay">${esc(m.pay)}</div>` : ''}
    </div>`).join('') || '<div class="ml"><div class="pv">此文件夹为空</div></div>';

  const m = list[mailIx];
  if (!m) return;
  $('#mailSubj').textContent = m.sj;
  $('#mailBody') && ($('#mailBody').innerHTML =
    '<div class="mbd">' + esc(m.body || m.pv).replace(/\n/g, '<br>') + '</div>' +
    '<div class="mops"><button class="rbtn" data-mop="reply">答复</button><button class="rbtn" data-mop="fwd">转发</button><button class="rbtn" data-mop="word">另存为 Word</button></div>');
  $('#mailMeta').innerHTML = `<b>${esc(m.fr)}</b>　${esc(m.tm)}<br>收件人：zhuangzhou@paopao.work` +
    (m.pay ? `<br>咨询状态：<b>${esc(m.pay)}</b>` : '');
}

/* 邮件正文三按钮：答复进草稿箱、转发有回执、另存为 Word 直接接一键述职 */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mop]'); if (!b) return;
  const m = (MAILS[mailFolder] || [])[mailIx]; if (!m) return;
  const op = b.dataset.mop;
  if (op === 'reply') {
    MAILS.draft.unshift({ fr: '草稿', tm: '刚刚', sj: 'Re: ' + m.sj, pv: '（答复草稿已创建，还没想好第一句）' });
    if (typeof osToast === 'function') osToast('答复草稿已存入草稿箱');
  } else if (op === 'fwd') {
    if (typeof osToast === 'function') osToast('已转发到个人邮箱 · 化名与价格已自动脱敏');
  } else if (op === 'word') {
    if (typeof osToast === 'function') osToast('正在把这单咨询翻译成述职话术…');
    if (typeof harvestToWord === 'function') harvestToWord();
  }
});

/* ---------- 企业微信壳 · 机器人在群里上班 ---------- */
const CONVS = [
  { av: '产', nm: '产品二部（38）', ls: '老庖机器人：这条我按框架拆一下…', rd: 3, on: 1 },
  { av: '摸', nm: '摸鱼互助小群', ls: '井底之蛙：水面又涨了', rd: 12 },
  { av: '庖', nm: '老庖 · 十年 HRD', ls: '你的深度咨询已排到第 2 位', rd: 1 },
  { av: '石', nm: '匠石 · 前大厂 P8', ls: '[图片]', rd: 0 },
  { av: '种', nm: '我的机器人 · 放养群', ls: '今日已互动 47 次，3 条待收', rd: 3 },
  { av: '运', nm: '运营通知', ls: '本周热点：调休、裁员补偿、offer 比价', rd: 0 }
];

const CHAT_MSGS = [
  { who: '井底之蛙', av: '井', tx: '问一下，试用期最后一周被约谈，HR 说再看看，主管说没问题，我该信谁' },
  { who: '老庖 · 十年 HRD（机器人）', av: '庖', bot: 1, tx: '先复述：你要判断的不是谁说的对，是公司内部有没有形成一致意见。<br>判断：HR 说"再看看"通常意味着流程上还没走完，不等于结论；主管说"没问题"是业务口的态度，但转正签字权在 HR。<br>可执行动作：明天主动找主管要一句书面的——邮件或企微都行——"转正评估这边没问题"。有这句话，HR 那边的模糊就变成了他们内部的事。' },
  { who: '井底之蛙', av: '井', tx: '这么直接要，会不会显得我不信任他' },
  { who: '老庖 · 十年 HRD（机器人）', av: '庖', bot: 1, tx: '不会。把它包装成"我想确认下转正材料还需要我补什么"，你要的那句话会自然出现在回复里。<br><b>禁区提醒：</b>我不承诺结果，也不替你判断这家公司值不值得留。这两件事只有你有信息。' },
  { who: '守株待兔', av: '守', tx: '插一句，我上次也是这样，主动要了邮件确认，后来真派上用场了' },
  { who: '系统', av: '系', tx: '本轮为剧本回放 · 免费 3 问，问完老庖按 99 一单报价，接不住的转匠石 599' }
];

function buildChat() {
  if ($('#imList').dataset.built) return;
  $('#imList').innerHTML = '<div class="srch">搜索</div>' + CONVS.map((c, i) => `
    <div class="cv${c.on ? ' on' : ''}" data-i="${i}">
      <div class="av">${esc(c.av)}</div>
      <div class="tx">
        <div class="nm">${esc(c.nm)}${c.rd ? `<i class="rd">${c.rd}</i>` : ''}<i>${['09:41', '09:22', '08:57', '昨天', '昨天', '周一'][i]}</i></div>
        <div class="ls">${esc(c.ls)}</div>
      </div>
    </div>`).join('');
  $('#imStream').innerHTML = CHAT_MSGS.map(m => `
    <div class="imsg${m.bot ? ' bot' : ''}">
      <div class="av">${esc(m.av)}</div>
      <div><div class="who">${esc(m.who)}</div><div class="bb">${m.tx}</div></div>
    </div>`).join('');
  $('#imList').addEventListener('click', e => {
    const c = e.target.closest('.cv'); if (!c) return;
    $$('#imList .cv').forEach(x => x.classList.toggle('on', x === c));
    const rd = c.querySelector('.rd'); if (rd) rd.remove();
  });
  $('#imList').dataset.built = '1';
}

/* ---------- 数据看板壳 · 转化概况 ----------
   评委第一眼看的页：收入 → 全链转化率 → 漏斗 → 收入构成 → 近7日付费。
   漏斗四色按 OKLab 六项校验过（深底、色弱、正常视觉均可辨），
   数字全部直接标在条上，账目环环相扣：漏斗尾数 = 付费单数 = 周付费之和。 */
const FUNNEL_COL = ['#CC4F3A', '#1F9B7E', '#4E8CD0', '#B58022'];

function buildBI() {
  const kpi = [
    ['本月流水', () => '¥4,186', '+18.2%'],
    ['围观 → 付费 全链转化', () => '1.09%', '+0.21pt'],
    ['付费咨询单数', () => 14, '+3 单'],
    ['今日吹气数', () => (S.blows + 1284).toLocaleString(), '+12.4%']
  ];
  const funnel = [
    ['钩子 · 围观', 1284], ['趣味 · 玩起来', 312], ['干货 · 学到了', 96], ['变现 · 付了钱', 14]
  ];
  const rev = [
    ['付费咨询', 2340], ['技能市场', 1036], ['皮肤打赏', 476], ['商业泡泡', 334]
  ];
  const week = [['一', 1], ['二', 2], ['三', 1], ['四', 3], ['五', 2], ['六', 2], ['日', 3]];
  const wkMax = Math.max(...week.map(w => w[1]));
  const revMax = rev[0][1];

  $('#biKpi').innerHTML = kpi.map(([lb, fn, dt, dn]) =>
    `<div class="k"><div class="lb">${lb}</div><div class="vl">${fn()}</div><div class="dt${dn ? ' dn' : ''}">${dt} 环比</div></div>`
  ).join('') +
  `<div class="fun4">` + funnel.map(([lb, n], i) => {
    const nx = funnel[i + 1];
    const conv = nx ? (nx[1] / n * 100).toFixed(1) + '%' : '';
    return `<div class="fs" style="--fc:${FUNNEL_COL[i]};border-top-color:${FUNNEL_COL[i]};--w:${Math.max(6, Math.round(n / funnel[0][1] * 100))}%"` +
      ` title="${lb}：${n.toLocaleString()} 人${nx ? `，其中 ${conv} 走到「${nx[0]}」` : '，漏斗走完'}">` +
      `<b>${n.toLocaleString()}</b>${lb}${nx ? `<span>${conv} →</span>` : ''}</div>`;
  }).join('') + `</div>` +
  `<div class="birow"><div class="bicard"><div class="bt">收入构成 · 本月 ¥4,186</div>` +
    rev.map(([lb, n]) =>
      `<div class="revr" title="${lb}：¥${n.toLocaleString()}，占 ${(n / 4186 * 100).toFixed(1)}%"><em>${lb}</em>` +
      `<i class="rb" style="width:${Math.round(n / revMax * 100)}%"></i><b>¥${n.toLocaleString()}</b></div>`
    ).join('') +
  `</div><div class="bicard"><div class="bt">近 7 日付费单数 · 合计 14 单</div><div class="wkbars">` +
    week.map(([d, n]) =>
      `<div class="wkb" title="周${d}：${n} 单">${n === wkMax ? `<u>${n}</u>` : ''}<i style="height:${Math.round(n / wkMax * 100)}%"></i><em>${d}</em></div>`
    ).join('') +
  `</div></div></div>` +
  `<div class="bisample">今日转化样本 · <b>望洋兴叹</b>（某宗厂）：09:41 水面发泡 → 10:12 查对标表 → 14:00 付费咨询 · 全链 4 小时 19 分。围观到掏钱，一条链走完。</div>`;
}

/* ---------- 游戏工坊：趣味区是玩家的游戏平台，不是官方游戏合集 ----------
   官方带头做几个，玩家自己上传，别人玩了可以打赏 —— 趣味区自己就能变现。 */
const GAMES = [
  { nm: '爽文背单词',  by: '官方',            tip: 128, go: 'wordgame', ic: 'it-word' },
  { nm: '捡手机文学',  by: '玩家 · 鼓盆而歌', tip: 86,  go: 'phone',    ic: 'it-phone' },
  { nm: '职场五子棋',  by: '玩家 · 井底之蛙', tip: 28,  go: 'gomoku',   ic: 'it-gomoku' },
  { nm: '工位躲猫猫',  by: '玩家 · 呆若木鸡', tip: 12,  go: 'hide',     ic: 'it-hide' }
];

function buildGameHall() {
  const el = $('#gameHall');
  if (!el) return;
  el.innerHTML = GAMES.map((g, i) => `
    <div class="ghrow">
      <span class="ghic" style="background-image:url(assets/icons/${g.ic}.png)"></span>
      <div style="flex:1;min-width:0"><b style="font-size:12.5px">${esc(g.nm)}</b>
        <div class="muted" style="font-size:10.5px">${esc(g.by)} · 已获打赏 ¥<span data-tipn="${i}">${tipOf(g)}</span></div></div>
      ${g.go ? `<button class="rbtn pri" data-play="${g.go}" style="padding:4px 10px;font-size:11px">去玩</button>` : ''}
      <button class="rbtn" data-tip="${i}" style="padding:4px 8px;font-size:11px">赏 ¥1</button>
    </div>`).join('') +
    '<div class="muted" style="margin-top:6px;font-size:10.5px">小游戏、皮肤、小工具。谁的点子有人玩，谁收钱。九成归他，一成归平台——平台也要吃饭。</div>';
  // 监听只绑一次，重画不重绑（dataset.built 以前把监听和渲染绑在一起，重画就双触发）
  if (!el.dataset.built) {
    el.addEventListener('click', e => {
      const p = e.target.closest('[data-play]');
      if (p) return goFeature(p.dataset.play);
      const t = e.target.closest('[data-tip]');
      if (t) {
        const g = GAMES[+t.dataset.tip];
        if (window.BPKit) BPKit.tip.add(g.go, 1); else g.tip += 1;
        $(`[data-tipn="${t.dataset.tip}"]`).textContent = tipOf(g);
      }
    });
    el.dataset.built = '1';
  }
}
// 打赏数字唯一真源：初始值 + 本地累计。各游戏窗底栏读同一个函数，不再各写各的
function tipOf(g) { return window.BPKit ? BPKit.tip.total(g.go, g.tip) : g.tip; }
function rebuildGameHall() { buildGameHall(); }

/* ---------- 皮肤商城：玩家做皮肤卖，试穿立即生效 ----------
   皮肤是套在水面上的滤镜，买完直接跳回广场看效果。 */
const SKINS = [
  { nm: '默认水色', by: '官方',            price: 0, sold: '—', f: '' },
  { nm: '深海',     by: '玩家 · 望洋兴叹', price: 6, sold: 214, f: 'hue-rotate(185deg) saturate(1.35) brightness(.82)' },
  { nm: '凌晨两点',     by: '玩家 · 井底之蛙', price: 6, sold: 167, f: 'hue-rotate(205deg) saturate(.5) brightness(.6)' },
  { nm: '黄昏',     by: '玩家 · 守株待兔', price: 3, sold: 98,  f: 'hue-rotate(-20deg) saturate(1.45) brightness(1.08)' }
];

function buildSkinShop() {
  const el = $('#skinShop');
  if (!el || el.dataset.built) return;
  el.innerHTML = SKINS.map((k, i) => `
    <div class="ghrow">
      <span class="skprev" style="filter:${k.f || 'none'}"></span>
      <div style="flex:1;min-width:0"><b style="font-size:12.5px">${esc(k.nm)}</b>
        <div class="muted" style="font-size:10.5px">${esc(k.by)}${k.price ? ` · ¥${k.price} · 已售 <span data-soldn="${i}">${k.sold}</span> 份` : ' · 免费'}</div></div>
      <button class="rbtn" data-wear="${i}" style="padding:4px 10px;font-size:11px">试穿</button>
      ${k.price ? `<button class="rbtn" data-buy="${i}" style="padding:4px 8px;font-size:11px">买</button>` : ''}
    </div>`).join('') +
    '<div class="muted" id="skinTip" style="margin-top:6px;font-size:10.5px">你调的色，别人穿在自己那片水上。皮肤跟马甲走，不跟人走。</div>';
  el.addEventListener('click', e => {
    const w = e.target.closest('[data-wear]'), b = e.target.closest('[data-buy]');
    if (!w && !b) return;
    const i = +(w || b).dataset[w ? 'wear' : 'buy'];
    if (b) { SKINS[i].sold += 1; $(`[data-soldn="${i}"]`).textContent = SKINS[i].sold; }
    $('#stage').style.filter = SKINS[i].f;   // 桌面水面立刻换肤，不用跳转
    const tip = $('#skinTip');
    if (tip) tip.textContent = `「${SKINS[i].nm}」已套在整片水面上 · 缩小窗口看效果`;
  });
  el.dataset.built = '1';
}

/* ---------- 桌面壳 · 三个窗口 ---------- */
const WINS = [
  { id: 'winPhoto', file: '团建照片_西溪_047.jpg', ext: 'jpg' },
  { id: 'winVideo', file: '新人培训录像_第2讲.mp4', ext: 'mp4' },
  { id: 'winPhone', file: '手机投屏.lnk',           ext: 'lnk' },
  { id: 'tvWin',    file: '客厅电视.lnk',           ext: 'tv'  }
];

function openWin(id) {
  const w = $('#' + id);
  w.classList.add('on');
  w.style.zIndex = ++zTop;
}

function buildDesk() {
  buildDesktop();   // 复用原型的文件图标生成
  $('#dicons').insertAdjacentHTML('afterbegin', WINS.map(w => {
    const [tag, col] = { jpg: ['J', '#7A5AA8'], mp4: ['V', '#C43E1C'], lnk: ['L', '#2B579A'], tv: ['TV', '#1F6F5C'] }[w.ext];
    return `<div class="dicon" data-win="${w.id}"><div class="ic" data-x="${tag}" style="--tag:${col}"></div>${esc(w.file)}</div>`;
  }).join(''));
  lend('desk');
  WINS.forEach(w => openWin(w.id));
  openWin('tvWin');   // 电视放最上层，开机就在播宣传片
  if (!filmOn) playFilm();
}

/* 图标双击 / 窗口关闭 / 拖动 —— 一次绑定，委托到 desktopMask */
(function deskBind() {
  const dm = $('#desktopMask');
  if (!dm) return;

  dm.addEventListener('dblclick', e => {
    const ic = e.target.closest('[data-win]');
    if (ic) openWin(ic.dataset.win);
  });

  dm.addEventListener('mousedown', e => {
    const win = e.target.closest('.dwin');
    if (win) win.style.zIndex = ++zTop;

    if (e.target.closest('[data-close]')) { win.classList.remove('on'); return; }

    const h = e.target.closest('.dwh');
    if (!h || e.target.closest('.wb')) return;
    const r = win.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    win.style.right = 'auto';
    const move = ev => {
      win.style.left = Math.max(0, ev.clientX - ox) + 'px';
      win.style.top = Math.max(0, ev.clientY - oy) + 'px';
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  // 看图工具栏：缩放改的是水面视觉密度，不是贴图
  let zoom = 100;
  dm.addEventListener('click', e => {
    const z = e.target.closest('[data-zm]');
    if (z) {
      zoom = Math.max(50, Math.min(200, zoom + (z.dataset.zm === '+' ? 25 : -25)));
      $('#phZoom').textContent = zoom + '%';
      $('#photoBody').style.padding = Math.round(14 * (200 - zoom) / 100 + 4) + 'px';
      requestAnimationFrame(safeSize);
      return;
    }
    const p = e.target.closest('[data-ph]');
    if (p) {
      const n = Math.max(1, Math.min(128, +$('#phIdx').textContent + (+p.dataset.ph)));
      $('#phIdx').textContent = n;
      $('#phExif').textContent = `拍摄时间 2026:07:18 ${19 + (n % 3)}:${String(10 + n % 50).padStart(2, '0')}:0${n % 10} · 3024×4032 · f/1.8 · 1/60s · ISO ${200 + n} · 未添加位置信息`;
      return;
    }
    const bar = e.target.closest('#vBar');
    if (bar) seekVideo((e.clientX - bar.getBoundingClientRect().left) / bar.clientWidth);
  });
})();

/* 视频进度条：拖到哪儿就跳到梦蝶局的哪一行 */
const V_LEN = 276;   // 04:36
function seekVideo(f) {
  f = Math.max(0, Math.min(1, f));
  $('#vBar i').style.width = (f * 100) + '%';
  const s = Math.round(f * V_LEN);
  $('#vTime').textContent = `${mmss(s)} / ${mmss(V_LEN)}`;
  const lines = $$('#videoBody #dreamGame > *');
  if (!lines.length) return;
  const i = Math.min(lines.length - 1, Math.floor(f * lines.length));
  lines[i].scrollIntoView({ block: 'center' });
  lines.forEach((l, k) => l.style.opacity = k <= i ? '1' : '.32');
}
const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

/* ---------- 桌面电视 · 贴链接就播 ----------
   安全：只认白名单站点，从链接里正则提取视频 ID，再用 ID 拼官方 embed 地址。
   原始 URL 绝不直接进 iframe.src —— 否则等于给页面开了任意站点注入口。 */

const TV_SRC = [
  { re: /bilibili\.com\/video\/(BV[0-9A-Za-z]{10})/i,
    url: id => `//player.bilibili.com/player.html?bvid=${id}&autoplay=0&danmaku=0`, nm: 'B 站' },
  { re: /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([0-9A-Za-z_-]{11})/,
    url: id => `https://www.youtube.com/embed/${id}`, nm: 'YouTube' },
  { re: /ixigua\.com\/(\d{15,22})/,
    url: id => `https://www.ixigua.com/iframe/${id}?autoplay=0`, nm: '西瓜视频' }
];

function tvPlay(raw) {
  const url = (raw || '').trim();
  const scr = $('#tvScr'), off = $('#tvOff');
  if (!url) return;
  stopFilm();   // 换台先停宣传片

  // b23.tv 短链跳不动（跨域拿不到重定向），提示用户换长链
  if (/b23\.tv/i.test(url) && !/BV[0-9A-Za-z]{10}/.test(url))
    return tvMsg('b23.tv 短链需要跳转才能拿到 BV 号<br>请在 B 站页面复制完整链接，或直接粘 BV 号');

  const bv = url.match(/\b(BV[0-9A-Za-z]{10})\b/);
  let embed = null, nm = '';
  if (bv) { embed = TV_SRC[0].url(bv[1]); nm = 'B 站'; }
  else for (const s of TV_SRC) {
    const m = url.match(s.re);
    if (m) { embed = s.url(m[1]); nm = s.nm; break; }
  }

  if (!embed && /^https?:\/\/[^\s"'<>]+\.(mp4|webm|ogg)(\?[^\s"'<>]*)?$/i.test(url)) {
    scr.innerHTML = '';
    const v = document.createElement('video');
    v.controls = true; v.autoplay = true; v.src = url;
    scr.appendChild(v);
    tvTitle('直链视频');
    return;
  }

  if (!embed) return tvMsg('没认出这个链接<br>支持 B 站 / YouTube / 西瓜视频 / .mp4 直链');

  scr.innerHTML = '';
  const f = document.createElement('iframe');
  f.setAttribute('allowfullscreen', '');
  f.setAttribute('referrerpolicy', 'no-referrer');
  f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups');
  f.src = embed;
  scr.appendChild(f);
  tvTitle(nm);
}

function tvTitle(nm) {
  $('#tvWin .dwh').firstChild.textContent = `客厅电视 - 正在播放（${nm}）`;
}

function tvMsg(html) {
  $('#tvScr').innerHTML = `<div class="tvoff"><b>无信号</b>${html}</div>`;
  $('#tvWin .dwh').firstChild.textContent = '客厅电视 - 投屏';
}

(function tvBind() {
  const go = () => tvPlay($('#tvUrl').value);
  $('#tvPlay').addEventListener('click', go);
  $('#tvUrl').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  $('#tvOffBtn').addEventListener('click', () => {
    stopFilm();
    $('#tvUrl').value = '';
    tvMsg('把 B 站 / YouTube / 西瓜 的视频链接贴到下面<br>摸鱼的时候，电视得开着');
  });
})();

/* ---------- 一键 Word：社区里的收获写回述职 ----------
   闭环：开头是述职报告，结尾写回述职报告。数据全部取自真实 S 状态，
   翻译得越正经越好笑。重复点击是重新生成，不是追加。 */

let hvToken = 0;
function harvestToWord() {
  const myToken = ++hvToken;
  const top = S.bubbles.slice().sort((a, b) => b.heat - a.heat)[0];
  const drawn = $$('#sheet .cell').filter(c => c.style.background).length;
  const bot = typeof F !== 'undefined'
    ? `智能助理（分身）代理执行：在水域完成互动 ${F.acted || 47} 次，回收行业情报 ${(F.ripe && F.ripe.length) || 3} 条，机器人顾问代答基础咨询 3 单。以上为分身产出，已按平台规则单独标注，不与本人贡献混算。`
    : null;

  const secInfo = [
    `本周期内，本人完成跨部门信息同步 ${(S.blows + 1284).toLocaleString()} 次，覆盖热点议题 ${S.bubbles.length} 项，其中 ${S.hall.length} 项已形成阶段性结论并完成归档。`,
    top ? `重点跟踪「${top.text.slice(0, 18)}」专项，全周期保持在部门优先级清单 P0 档，相关讨论沉淀为可复用材料 ${S.lib.length} 份。` : null,
    `完成竞对薪酬与岗位体系专项调研，覆盖标的公司 ${typeof SALARY !== 'undefined' ? SALARY.length : 10} 家、在招岗位 ${typeof JOBS !== 'undefined' ? JOBS.length : 8} 个，数据经多人交叉验证。`
  ].filter(Boolean);

  const secTeam = [
    drawn ? `推进数据可视化面板建设，累计完成像素级单元格填充 ${drawn} 格，预计下周期交付整体视觉稿。` : `启动数据可视化面板预研，已完成色板选型与网格框架搭建。`,
    `组织跨角色信息交叉验证工作坊 1 场，识别并记录信息失真点 3 处，复盘纪要已同步至汇报材料第 4 至第 7 页。`
  ];

  const secBiz = [
    `委外专家咨询 3 人次（标准档 2 人次 / 深度档 1 人次），合计 797 元，人均 265.67 元，低于年初核定单价。`,
    bot
  ].filter(Boolean);

  const tail = [
    `本周期在岗时长饱和度 100%，无异常离席记录。`,
    `存在不足：本周期个人产出与分身产出的边界界定仍不够清晰，下周期将建立更明确的归因口径。`,
    `以上数据来源见附件《2026Q3 跨部门信息同步明细表.xlsx》，附录一为参考资料索引。`
  ];

  const items = [
    { type: 'h', text: '（一）信息与知识类产出' },
    ...secInfo.map(text => ({ type: 'p', text })),
    { type: 'h', text: '（二）团队活力类产出' },
    ...secTeam.map(text => ({ type: 'p', text })),
    { type: 'h', text: '（三）经营类产出' },
    ...secBiz.map(text => ({ type: 'p', text })),
    ...tail.map(text => ({ type: 'p', text }))
  ];

  const el = $('#harvestDoc');
  el.innerHTML = `<div class="ht">三、本周期重点工作进展及个人思考</div>`;
  el.classList.add('on');

  let ii = 0;
  (function typeItem() {
    if (ii >= items.length) {
      el.insertAdjacentHTML('beforeend',
        `<div class="zz"><span class="zq">「人皆知有用之用，而莫知无用之用也」——《庄子 · 人间世》</span><span class="zh">木匠的尺子量不出的那些事，这里句句有价</span></div><div class="hnote">本节由今日水面数据自动生成 · 人吹的气与机器人吹的气分开记账 · 演示用，未调用模型</div>`);
      const cl = $('#cmtLive');
      if (cl) cl.innerHTML = '<div class="cmt"><div class="who"><b>王慧</b> · 刚刚</div>这版数据挺全的，就按这个发。</div>';
      S.words += items.map(x => x.text).join('').length;
      const wcE = $('#wc'); if (wcE) wcE.textContent = S.words.toLocaleString();
      return;
    }
    const item = items[ii++];
    const node = document.createElement(item.type === 'h' ? 'div' : 'p');
    if (item.type === 'h') node.className = 'hh';
    el.appendChild(node);
    const txt = item.text;
    let ci = 0;
    const iv = setInterval(() => {
      if (myToken !== hvToken) return clearInterval(iv);
      ci += 3;
      node.textContent = txt.slice(0, ci);
      if (ci >= txt.length) { clearInterval(iv); node.textContent = txt; typeItem(); }
    }, 16);
  })();

  goFeature('report');
  requestAnimationFrame(() => el.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  if (typeof osAlert === 'function') osAlert('Microsoft Word', '已将本周期工作进展写入<br><b>2026年度第三季度工作述职报告.docx</b>');
}

/* ---------- 剧情模式：一个打工人的一天 ----------
   叙事就是走廊：九拍，每拍自动切到对应界面，一句旁白说清它为什么存在。
   结尾落在一键述职 —— 你以为他在写述职报告，他真的在写述职报告。 */

const TOUR = [
  { t: '09:00', h: '上班', v: 'home', k: '钩子',
    tx: '屏幕上飘着一堆泡泡，跟 2003 年那个气泡屏保一模一样。领导从背后走过，只会觉得你忘了锁屏。他不会低头看——那颗最大的上面写着他的名字。' },
  { t: '09:12', h: '隔着公司围墙点赞', v: 'home', k: '钩子', act: () => {
      const b = S.bubbles.slice().sort((a, c) => c.heat - a.heat)[0];
      if (b && typeof blow === 'function') blow(b, 2);
    },
    tx: '你点了一下，它浮起来半寸。泡泡上挂着公司名：某鹅系的、某宗厂的、你司的——同事群里不敢说的话，隔着公司围墙的人在替它吹气。' },
  { t: '10:15', h: '老板走过来了', v: 'draw', k: '趣味',
    tx: '老板从你身后经过，看见你在填 Excel，很满意。他看不出这些格子拼的是一条鱼——鱼还差小半条，拼另一半那位是某泥厂的，去开周会了。' },
  { t: '10:40', h: 'Sheet2 才是正事', v: 'salary', k: '干货',
    tx: '还是这张 Excel，点一下工作表标签，玩的变成正事。第一行 55k×16，三个不同公司的人拿自己的 offer 作过保——这种表，一家公司内部永远做不出来。' },
  { t: '12:30', h: '午休 · 梦蝶局', v: 'review', k: '趣味',
    tx: '四个机器人各拿一张身份卡坐下，其中一个是假猎头。点「从头开始放映」或按 F5——它们是四个打工人放出来的分身，替各自的主人练识人。' },
  { t: '14:00', h: '咨询邮件到了', v: 'mail', k: '变现', act: () => {
      if (typeof mailFolder !== 'undefined') { mailFolder = 'paid'; mailIx = 0; renderMailList();
        $$('#olFold b').forEach(x => x.classList.toggle('on', x.dataset.f === 'paid')); }
    },
    tx: '收件箱里躺着别的公司的人的下午。老庖是机器人，99 一单；匠石是真人，599 一单。都有人付——你的经验对你司不值钱，对隔壁厂值钱。' },
  { t: '15:30', h: '机器人替你上班', v: 'chat', k: '变现',
    tx: '你养的那只机器人正在群里替你说话，回答的是某菊厂那位的问题。它今天替你回了三条，你一条都没看——下班一起收。在输入框打一句试试，它真的会接。' },
  { t: '16:45', h: '转化的收据', v: 'ops', k: '证据',
    tx: '一千二百八十四个人围观，三百一十二个玩起来，九十六个学到东西，十四个真掏了钱。看板上这排收窄的数字，去邮箱翻结算单，一分不差。' },
  { t: '18:00', h: '下班前，一键述职', v: 'home', k: '闭环', act: () => harvestToWord(),
    tx: '按一下。今天攒下的对表、接单、翻资料，全部换算成「跨部门信息同步 1,284 次」。字数真的涨了。你以为他在写述职报告——他真的在写述职报告。' }
];

let tourIx = -1;

const tourDone = new Set();
function tourGo(i) {
  tourIx = Math.max(0, Math.min(TOUR.length - 1, i));
  const st = TOUR[tourIx], el = $('#tour');
  el.classList.remove('invite');
  el.classList.add('on');
  $('#tourTm').textContent = st.t;
  $('#tourTh').textContent = st.h;
  $('#tourStg').textContent = st.k || '';
  $('#tourStg').style.background = STG_COL[st.k] || '#1F1F1F';
  $('#tourTx').textContent = st.tx;
  $('#tourDots').innerHTML = TOUR.map((_, k) => `<i${k <= tourIx ? ' class="on"' : ''}></i>`).join('');
  $('#tourPrev').style.visibility = tourIx === 0 ? 'hidden' : 'visible';
  $('#tourNext').textContent = tourIx === TOUR.length - 1 ? '再看一遍' : '下一幕';
  goFeature(st.v);
  if (st.act && !tourDone.has(tourIx)) { tourDone.add(tourIx); setTimeout(st.act, 400); }
}

function tourInvite() {
  const el = $('#tour');
  el.classList.add('on', 'invite');
  $('#tourTm').textContent = '▶';
  $('#tourTh').textContent = '一个打工人的一天';
  $('#tourStg').textContent = '';
  $('#tourTx').innerHTML = '九拍，三分钟，从上班摸到下班，从围观摸到有人付钱。也可以关掉，自己逛。' +
    '<div class="hl3"><b data-hl="film">▶ 90 秒宣传片</b><b data-hl="boss">老板键 Ctrl+空格</b><b data-hl="harvest">一键述职</b></div>';
  $('#tourDots').innerHTML = '';
  $('#tourPrev').style.visibility = 'hidden';
  $('#tourNext').textContent = '开始';
}

function endTour() { tourIx = -1; $('#tour').classList.remove('on', 'invite'); }

(function tourBind() {
  $('#tourNext').addEventListener('click', () => {
    if (tourIx >= TOUR.length - 1) { tourDone.clear(); tourGo(0); }
    else tourGo(tourIx + 1);
  });
  $('#tourPrev').addEventListener('click', () => tourGo(tourIx - 1));
  $('#tourEnd').addEventListener('click', endTour);
  $('#tour').addEventListener('click', e => {
    const h = e.target.closest('[data-hl]');
    if (!h) return;
    const k = h.dataset.hl;
    if (k === 'boss' && typeof cycleMask === 'function') cycleMask();
    else if (k === 'film') { const f = document.querySelector('#deskFilm'); if (f) f.click(); endTour(); }
    else if (k === 'harvest') { endTour(); harvestToWord(); }
  });
  document.addEventListener('keydown', e => {
    if (tourIx < 0 || !$('#tour').classList.contains('on')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); tourGo(tourIx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); tourGo(tourIx - 1); }
  });
})();

/* ---------- 电视宣传片：不用视频文件，字卡片就是片子 ----------
   核心价值在这 20 来秒里讲完。桌面壳一打开电视就在播。 */
const FILM = [
  ['上班八小时\n你连低头的权利都没有', 2800],
  ['公司屏蔽了所有社区\n除了它自己发的那几个软件', 2600],
  ['变大泡泡', 2200, '不同公司的打工人，和他们的机器人'],
  ['有人在 Excel 里拼一条鱼\n有人靠卖配色收了 214 份钱', 2800],
  ['隔壁厂给多少钱，表里写着\n想不明白的，99 块有人替你想', 2800],
  ['荒唐是荒唐\n钱是真收到了', 2800],
  ['接下来是 CAD、是 IDE、是财务系统', 2600, '每个行业都有自己的班要上'],
  ['子非鱼，安知鱼之乐', 3200, '子非我，安知我不是在工作　▶ 重播']
];

let filmTimer = null, filmOn = false;

function playFilm() {
  clearTimeout(filmTimer);
  filmOn = true;
  const scr = $('#tvScr');
  let i = 0, elapsed = 0;
  const total = FILM.reduce((a, f) => a + f[1], 0);
  const show = () => {
    if (!filmOn) return;
    const [tx, ms, sub] = FILM[i];
    scr.innerHTML = `<div class="film"><div class="ftx">${esc(tx).replace(/\n/g, '<br>')}</div>` +
      (sub ? `<div class="fsub">${esc(sub)}</div>` : '') +
      `<div class="fbar"><i style="width:${(elapsed / total * 100).toFixed(1)}%"></i></div></div>`;
    elapsed += ms;
    if (i < FILM.length - 1) { i++; filmTimer = setTimeout(show, ms); }
    else { filmOn = false; scr.querySelector('.film').addEventListener('click', playFilm); }
  };
  show();
  tvTitle('宣传片');
}

function stopFilm() { filmOn = false; clearTimeout(filmTimer); }

/* ---------- PPT 放映：观察梦蝶局引擎，不重建它 ----------
   对局每推进一句，幻灯片标题/备注/缩略图跟着走。
   破绽（tell）在揭底页逐条进备注区 —— SHELLS.md 验收 3。 */
function pptSync() {
  if (!document.querySelector('#winPPT.on')) return;
  if (typeof DREAM_PLAYS === 'undefined') return;
  const p = DREAM_PLAYS[dreamIndex], total = p.lines.length;
  let title, note, slide;
  if (dreamShown <= 0) {
    title = '梦蝶局 · ' + p.title; note = SLIDES[0].n; slide = 0;
  } else if (dreamBetAsked && !dreamBet) {
    title = '押注 · 谁在撒谎'; note = '放映暂停。押注不消耗热度，但押错会掉马甲信誉。'; slide = 3;
  } else if (dreamShown >= total) {
    const tells = p.lines.filter(l => l.tell);
    title = '揭底 · ' + p.liar + ' 在撒谎';
    note = '破绽回放：' + tells.map((l, i) => `${i + 1}. ${l.tell}`).join('　');
    slide = 4;
  } else {
    const cur = p.lines[dreamShown - 1];
    title = cur.who + '（' + p.cast[cur.who] + '）';
    note = `第 ${dreamShown} / ${total} 句` + (cur.tell ? ' · 这句有破绽，揭底后回放' : ' · 注意谁在抢着定义议题');
    slide = dreamShown < Math.ceil(total / 2) ? 2 : 3;
  }
  $('#slideTitle').textContent = title;
  $('#slideSub').textContent = `组织架构调整 · 放映中 · 第 ${Math.min(slide + 1, SLIDES.length)}/${SLIDES.length} 页 · 第 ${Math.min(dreamShown, total)}/${total} 句`;
  $('#pptNote').textContent = note;
  $$('#pptRail .sl').forEach(x => x.classList.toggle('on', +x.dataset.i === slide));
  const w = document.querySelector('#winPPT');
  if (w) w.classList.toggle('playing', dreamShown > 0);   // 放映时窗口暗场
}

// 包一层：引擎每次重画，放映台跟着同步
if (typeof dreamRender === 'function') {
  const _dreamRender = dreamRender;
  dreamRender = function () { _dreamRender(); pptSync(); };
}

// 「从头开始」按钮 + F5（PPT 壳里拦下浏览器刷新，给放映）
document.addEventListener('click', e => {
  if (e.target.id === 'pptPlay' && typeof dreamStart === 'function') {
    if (dreamTimer) { clearInterval(dreamTimer); dreamTimer = null; }
    dreamShown = 0; dreamBet = ''; dreamBetAsked = false; dreamPaused = false;
    dreamStart();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'F5' && document.querySelector('#winPPT.on')) {
    e.preventDefault();
    $('#pptPlay') && $('#pptPlay').click();
  }
});

/* ---------- 可见切换器：按功能列，角标告诉你会变成哪个软件 ---------- */
const BADGE = {
  word: ['W', '#2B579A'], excel: ['X', '#217346'], ppt: ['P', '#C43E1C'],
  mail: ['O', '#0F6CBD'], chat: ['钉', '#0089FF'], bi: ['BI', '#3B2E58'], desk: ['⊞', '#1B3B5A']
};

function buildSwitcher() {
  const bar = $('#swBar');
  let lastStg = '';
  bar.innerHTML = '<b data-act="tour"><i style="background:#1F1F1F">▶</i>剧情</b>' +
  FEATURES.map(f => {
    const [tag, col] = BADGE[f.shell];
    const stg = f.stg !== lastStg ? `<span class="stg" style="color:${STG_COL[f.stg]}">${f.stg}</span>` : '';
    lastStg = f.stg;
    return stg + `<b data-v="${f.v}"${f.v === curView ? ' class="on"' : ''}><i style="background:${col}">${tag}</i>${f.nm}</b>`;
  }).join('') + '<b class="hv" data-act="harvest"><i>W</i>一键述职</b>' +
  '<span class="kb">Ctrl+空格 老板键</span>';
  bar.addEventListener('click', e => {
    const a = e.target.closest('b[data-act]');
    if (a) return a.dataset.act === 'tour' ? tourGo(0) : harvestToWord();
    const b = e.target.closest('b[data-v]');
    if (b) goFeature(b.dataset.v);
  });
}

function markSwitcher() {
  $$('#swBar b[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === curView));
}

/* ---------- 开机画面：点「开机」直接全屏进桌面 ---------- */
(function splash() {
  const sp = $('#splash'), bar = $('#splashBar'), btn = $('#splashGo');
  if (!sp) return;
  let p = 0;
  const t = setInterval(() => {
    p = Math.min(100, p + 22 + Math.random() * 10);
    bar.style.width = p + '%';
    if (p >= 100) clearInterval(t);
  }, 130);
  btn.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen)
      document.documentElement.requestFullscreen().catch(() => {});
    sp.classList.add('off');
  });
})();

/* ---------- 起手：拼豆预置半条鱼（子非鱼），窗口系统由 os.js 接管 ---------- */
if (typeof drawPaint === 'function' && typeof DRAW_TEMPLATES !== 'undefined') {
  const fish = DRAW_TEMPLATES[0].cells;
  drawTemplateIndex = 0;
  drawPaint(fish.slice(0, Math.floor(fish.length * 0.55)), '#3F72A4');
  if (typeof drawRender === 'function') drawRender();
  const ms = $('#mateState');
  if (ms) ms.textContent = '搭子拼到一半，去开会了 · 剩下的归你';
}
