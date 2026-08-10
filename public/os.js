/* ============================================================
   变大泡泡 · 桌面 OS
   整个屏幕是一台正在上班的电脑。泡泡飘在桌面上，功能都是窗口，
   任务栏就是转化漏斗。物理引擎和模块全部复用，只换交互骨架。
   依赖：app.html 内联脚本 + shells.js 的构建函数与数据。
   ============================================================ */
'use strict';

document.body.classList.add('os');
document.body.dataset.shell = 'word';   // 让 Word 系样式（光标正文等）保持生效

/* ---------- 泡泡搬到桌面上 ---------- */
document.body.appendChild($('#stage'));
requestAnimationFrame(() => { size(); });

/* ---------- 窗口工厂：复用 .dwin 骨架 ---------- */
let osZ = 20;
const OSWIN = {};   // id -> el

function mkWin(id, app, title, style) {
  const w = document.createElement('div');
  w.className = 'dwin';
  w.id = id;
  w.dataset.app = app;
  w.setAttribute('style', style);
  w.innerHTML = `<div class="dwh">${esc(title)}<div class="wb"><span data-min>—</span><span data-max>□</span><span data-close>×</span></div></div><div class="dwb"></div>`;
  document.body.appendChild(w);
  OSWIN[id] = w;
  return w.querySelector('.dwb');
}

function osOpen(id) {
  const w = OSWIN[id] || $('#' + id);
  if (!w) return;
  const fresh = !w.classList.contains('on');
  w.classList.remove('min');
  w.classList.add('on');
  w.style.zIndex = ++osZ;
  // 新开的窗如果和已开窗口叠在一处，阶梯错开 —— 连开几扇不糊成一摞
  if (fresh) {
    const others = Object.values(OSWIN).filter(x => x !== w && x.classList.contains('on'));
    const r = w.getBoundingClientRect();
    let k = 0;
    const near = (o, kk) => { const q = o.getBoundingClientRect(); return Math.abs(q.left - (r.left + kk * 28)) < 34 && Math.abs(q.top - (r.top + kk * 28)) < 34; };
    while (k < 8 && others.some(o => near(o, k))) k++;
    if (k) { w.style.left = (r.left + k * 28) + 'px'; w.style.top = (r.top + k * 28) + 'px'; w.style.right = 'auto'; }
  }
  markBar();
}

/* ---------- 建窗口，把已有模块 DOM 搬进去（搬家不重建） ---------- */
function put(sel, box) { const el = $(sel); if (el) box.appendChild(el); }

// Word：灰底画布 + 带页码的白页 + 右侧批注槽 + 迷你功能区 + 状态栏（字数在这里跳）
const bWord = mkWin('winWord', 'word', '2026年度第三季度工作述职报告.docx - Word', 'left:60px;top:30px;width:830px;height:640px');
bWord.parentNode.querySelector('.dwh').insertAdjacentHTML('afterend',
  '<div class="dwt" style="height:38px"><span class="fsel">宋体 (中文正文)<i></i></span><span class="fsel fsz">五号<i></i></span>' +
  '<span class="fbi"><b>B</b><b style="font-style:italic;font-family:serif">I</b><b style="text-decoration:underline">U</b></span>' +
  '<span class="pal4"><em class="pl"></em><em class="pc on"></em><em class="pr"></em><em class="pj"></em></span>' +
  '<span class="sp">修订：开　批注 3</span></div>' +
  '<div class="rptbar"><b>AI 一键述职</b>' +
  '<label>风格 <select id="rptStyle">' +
  '<option value="steady">汇报腔 · 稳</option><option value="jargon">大厂黑话 · 唬</option>' +
  '<option value="plain">朴实无华 · 真</option><option value="blame">甩锅文学 · 躲</option></select></label>' +
  '<label>细节 <select id="rptLevel">' +
  '<option value="m">半页 · 标准</option><option value="s">三句话 · 应付</option><option value="l">一整页 · 卷王</option></select></label>' +
  '<button id="rptGo">生成今日述职</button><span id="rptState"></span></div>');
// 空白文档：光标一闪一闪，领导的批注已经先到了 —— 压力具象化
bWord.innerHTML = '<div class="wwrap"><div class="wpage" data-pg="- 1 -">' +
  '<div id="rptBody"><p class="wblank">（空白文档）今天的活儿还没写。点上面「生成今日述职」，AI 替你把摸的鱼包装成干的活。</p></div>' +
  '<span id="wcaret"></span></div>' +
  '<div class="wside"><div class="cmt"><div class="who"><b>王慧</b> · 8月6日 14:22</div>日报呢？下班前要。</div>' +
  '<div class="cmt"><div class="who"><b>王总</b> · 8月6日 17:05</div>写实一点。上次那版全是形容词。</div><div id="cmtLive"></div></div></div>';
const wpg = bWord.querySelector('.wpage');
put('#harvestDoc', wpg);
bWord.parentNode.insertAdjacentHTML('beforeend',
  '<div class="dwf">第 <b id="pgno">1</b> 页，共 1 页　<b id="wc">1,240</b> 个字　中文(中国)<span style="margin-left:auto">全部数据为演示假数据 · 100%</span></div>');
if (typeof sync === 'function') sync();   // 页脚建好后补一次首屏数字

// 摸鱼日报：干货区从述职报告里搬出来，一个文件一个模块 —— 老板看到的是另一份 Word
const bDaily = mkWin('winDaily', 'word', '摸鱼日报_第212期.docx - Word', 'left:120px;top:50px;width:830px;height:620px');
bDaily.innerHTML = '<div class="wwrap"><div class="wpage" data-pg="- 1 -" id="wpgRef"></div><div class="wside"></div></div>';
put('#v-ref', bDaily.querySelector('#wpgRef'));
bDaily.parentNode.insertAdjacentHTML('beforeend',
  '<div class="dwf">第 1 页，共 6 页　4,120 个字　中文(中国)<span style="margin-left:auto">全部数据为演示假数据 · 100%</span></div>');

// 泡泡广场：热榜 / 最大泡 / 沉积 / 玩法（水面本体在桌面上）
const bSq = mkWin('winSquare', 'plain', '今天的水面 - 泡泡广场', 'right:70px;top:60px;width:400px;height:560px');
const bb = document.querySelector('.brandbar');
if (bb) bSq.appendChild(bb);   // 社区窗口带社区品牌
put('#v-home', bSq);

// 桌面水印：Windows 激活水印位放品牌，评委任何时刻都看得到产品叫什么
document.body.insertAdjacentHTML('beforeend',
  '<div id="brandMark"><svg viewBox="0 0 42 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M5 17C10 9 24 8 30 16C24 24 10 25 5 17Z"/><path d="M30 16L38 10V23L30 16Z"/>' +
  '<circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none"/></svg>变大泡泡 专业摸鱼版' +
  '<div class="b2">子非鱼，安知鱼之乐 · Build 2026.0808</div></div>');

// 吹泡泡
const bPost = mkWin('winPost', 'plain', '新建批注 - 吹一个泡泡', 'left:340px;top:150px;width:640px;height:480px');
put('#v-insert', bPost);

// Excel：拼豆 / 薪资 / 岗位 三张表
const bXl = mkWin('winExcel', 'excel', '2026年度预算表.xlsx - Excel', 'left:180px;top:70px;width:900px;height:590px');
put('#v-draw', bXl); put('#v-salary', bXl); put('#v-jobs', bXl);
// 公式栏搬进窗口：点单元格，名称框跳 C2 —— Excel 的心跳
const fb = $('#fbar');
bXl.parentNode.querySelector('.dwh').insertAdjacentHTML('afterend', fb.outerHTML);
fb.remove();
bXl.parentNode.appendChild($('#xlTabs'));
$('#xlTabs').addEventListener('click', e => {
  const b = e.target.closest('b'); if (b && b.dataset.v) goFeature(b.dataset.v);
});

// PPT：工具条（放映入口）+ 左缩略图栏 + 画布 + 底部备注区
const bPpt = mkWin('winPPT', 'ppt', 'Q3复盘汇报.pptx - PowerPoint', 'left:250px;top:40px;width:900px;height:640px');
bPpt.parentNode.querySelector('.dwh').insertAdjacentHTML('afterend',
  '<div class="dwt"><button id="pptPlay" class="rbtn pri">从头开始放映</button><button class="rbtn">从当前幻灯片</button><span class="sp" id="pptCnt">幻灯片 1/10　中文(中国)</span></div>');
bPpt.innerHTML = '<div class="paper2"></div>';
put('#slideHead', bPpt.firstChild); put('#v-review', bPpt.firstChild);
$('#slideHead').style.display = 'block';
bPpt.appendChild($('#pptRail'));
bPpt.appendChild($('#pptNotes'));
buildRail();

// Outlook：付费咨询
const bMail = mkWin('winMail', 'mail', '收件箱 - zhuangzhou@paopao.work - Outlook', 'left:140px;top:90px;width:940px;height:560px');
put('#olFold', bMail); put('#olList', bMail); put('#v-mail', bMail);

// 钉钉：放养 + 群聊（菜园已独立成窗，见 gardenV2）
const bChat = mkWin('winChat', 'chat', '钉钉 - 产品二部（2 个机器人 + 1 位真人在岗）', 'left:220px;top:80px;width:860px;height:580px');
put('#imList', bChat); put('#v-chat', bChat); put('#imBar', bChat);
// 菜园挂载移到文件末尾的菜园 v2 模块 —— buildChat() 会重写 #imList.innerHTML，早挂就被冲掉

// 看板：运营后台
const bBI = mkWin('winBI', 'bi', '经营分析看板 - 数据平台', 'left:160px;top:70px;width:960px;height:600px');
put('#biNav', bBI);
const biR = document.createElement('div'); biR.className = 'biR'; bBI.appendChild(biR);
put('#biKpi', biR); put('#v-ops', biR);

// 看板左侧导航：滚到对应卡片并点亮
const BI_NAV = { water: '#biKpi', hot: '#board', bot: '#brandGo', rev: '#opsPanel', arb: '#arb' };
document.querySelector('#winBI #biNav').addEventListener('click', e => {
  const b = e.target.closest('b[data-b]'); if (!b) return;
  $$('#winBI #biNav b').forEach(x => x.classList.toggle('on', x === b));
  const t = document.querySelector(BI_NAV[b.dataset.b]);
  if (!t) return;
  const card = t.closest('.card') || t;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('bihl');
  setTimeout(() => card.classList.remove('bihl'), 1600);
});

// 电视和手机：从旧桌面遮罩里搬出来
document.body.appendChild($('#tvWin'));
document.body.appendChild($('#winPhone'));
put('#phoneStories', $('#phoneBody'));

/* ---------- 功能路由：一个功能 = 一扇窗 ---------- */
const OS_GO = {
  home: ['winSquare'], insert: ['winPost'], task: ['winTask'], trash: ['winTrash'],
  draw: ['winExcel', 'v-draw'], salary: ['winExcel', 'v-salary'], jobs: ['winExcel', 'v-jobs'],
  review: ['winPPT'], ref: ['winDaily'], report: ['winWord'], phone: ['winPhone'], pitch: ['winPitch'],
  mail: ['winMail'], chat: ['winChat'], ops: ['winBI'], desk: ['tvWin'], me: ['winMe']
};

goFeature = function (v) {
  const t = OS_GO[v];
  if (!t) return;
  osOpen(t[0]);
  if (t[1]) {
    if (t[1] === 'v-salary') setTimeout(() => { const td = document.querySelector('#salTab tr:nth-child(3) td:nth-child(4)'); if (td) td.click(); }, 350);
    $$('#winExcel .view').forEach(x => x.classList.toggle('xon', x.id === t[1]));
    if (typeof xlSheet !== 'undefined') { xlSheet = t[1].slice(2); markSheet(); }
  }
  if (v === 'desk' && !document.querySelector('#tvScr iframe, #tvScr video, #tvScr img')) setTimeout(() => tvPlayPromo(), 200);
  if (v === 'ops') buildBI();
  if (v === 'me' && typeof buildMe === 'function') buildMe();
  curView = v;
  markBar();
};

/* ---------- 两层空间：任务栏是办公室（纯伪装），桌面是江湖 ----------
   任务栏只放"正经软件"——老板瞟一眼全是上班的样子（加班测试在每个像素成立）；
   真功能全部收进桌面的文件夹和假文档，桌面本身就长成一台正常的办公电脑。 */
const BAR = [
  ['desk',   '新员工入职培训', '培', '#C43E1C'],
  ['pitch',  '新员工手册.pptx', '手', '#C43E1C'],
  ['report', 'Word',     'W',  '#2B579A'],
  ['draw',   'Excel',    'X',  '#217346'],
  ['review', 'PowerPoint', 'P', '#C43E1C'],
  ['mail',   'Outlook',  'O',  '#0F6CBD'],
  ['chat',   '钉钉', '钉', '#0089FF'],
  ['ops',    '数据平台', 'BI', '#3B2E58'],
  ['me',     '工资条.pdf', '薪', '#8A5A2E']
];

(function buildBar() {
  const bar = document.createElement('div');
  bar.id = 'osbar';
  bar.innerHTML =
    BAR.map(([v, nm, tag, col]) =>
      `<span class="app" data-go="${v}"><i style="background:${col}">${tag}</i>${nm}</span>`).join('') +
    '<span class="app" data-harvest><i style="background:#2B579A">W</i>一键述职</span>' +
    '<span class="app" data-bubtoggle title="一键收掉整片水面，桌面立刻干净"><i style="background:#3F72A4">泡</i><span id="bubTgLbl">收泡泡</span></span>' +
    '<div class="clk"><b id="osClk">--:--</b><b>Ctrl+空格 老板键</b></div>';
  document.body.appendChild(bar);
  bar.addEventListener('click', e => {
    if (e.target.closest('[data-harvest]')) return harvestToWord();
    if (e.target.closest('[data-bubtoggle]')) {
      window.bubHidden = document.body.classList.toggle('nobub');
      $('#bubTgLbl').textContent = window.bubHidden ? '放泡泡' : '收泡泡';
      return;
    }
    const a = e.target.closest('[data-go]');
    if (a) goFeature(a.dataset.go);
  });
  // 今日马甲从旧文档头搬进任务栏，身份不丢
  const me = document.querySelector('.brandbar .me');
  if (me) { me.classList.add('me'); bar.insertBefore(me, bar.querySelector('.clk')); }
  setInterval(() => {
    const d = new Date();
    $('#osClk').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }, 1000);
})();

/* 深链：等窗口开好，滚到那张卡，金框闪一下 */
function deepLink(sel) {
  setTimeout(() => {
    let t = document.querySelector(sel);
    if (!t) return;
    t = t.closest('.card') || t;
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    t.classList.add('anchor-hl');
    setTimeout(() => t.classList.remove('anchor-hl'), 2000);
  }, 480);
}

function markBar() {
  $$('#osbar .app[data-go]').forEach(a => {
    const t = OS_GO[a.dataset.go];
    a.classList.toggle('on', !!(t && OSWIN[t[0]] ? OSWIN[t[0]].classList.contains('on') : $('#' + (t ? t[0] : '')) && $('#' + t[0]).classList.contains('on')));
  });
}

/* ---------- 全局窗口操作：拖动 / 关闭 / 最小化 / 置顶 ---------- */
document.addEventListener('mousedown', e => {
  const win = e.target.closest('.dwin');
  if (!win) return;
  win.style.zIndex = ++osZ;
  $$('.dwin').forEach(w => w.classList.remove('focus'));
  win.classList.add('focus');
  if (e.target.closest('[data-miniclose]')) {
    win.classList.remove('on', 'min', 'tvmini');
    if (win.dataset.rectMini) { win.setAttribute('style', win.dataset.rectMini); delete win.dataset.rectMini; }
    if (typeof stopFilm === 'function') stopFilm();
    const fm = document.querySelector('#tvScr iframe'); if (fm) fm.removeAttribute('src');
    const vm = document.querySelector('#tvScr video'); if (vm) vm.pause();
    markBar(); return;
  }
  if (e.target.closest('[data-close]')) {
    win.classList.remove('on', 'min');
    if (win.id === 'tvWin' && typeof stopFilm === 'function') { stopFilm(); const f = document.querySelector('#tvScr iframe'); if (f) f.removeAttribute('src'); const vd = document.querySelector('#tvScr video'); if (vd) vd.pause(); }
    if (win.id === 'winPPT' && typeof dreamStop === 'function') dreamStop();
    markBar(); return;
  }
  if (e.target.closest('[data-min]')) { win.classList.add('min'); markBar(); return; }
  if (e.target.closest('[data-max]')) {
    if (win.dataset.rect) { win.setAttribute('style', win.dataset.rect); delete win.dataset.rect; }
    else { win.dataset.rect = win.getAttribute('style');
      win.setAttribute('style', 'left:0;top:0;right:auto;width:100vw;height:calc(100vh - 44px);z-index:' + osZ); }
    return;
  }
  const h = e.target.closest('.dwh');
  const miniDrag = win.classList.contains('tvmini');
  if (!h && !miniDrag) return;
  if (h && e.target.closest('.wb')) return;
  const r = win.getBoundingClientRect();
  const ox = e.clientX - r.left, oy = e.clientY - r.top;
  win.style.right = 'auto';
  if (miniDrag) win.style.bottom = 'auto';
  const move = ev => {
    win.style.left = Math.max(-60, ev.clientX - ox) + 'px';
    win.style.top = Math.max(0, ev.clientY - oy) + 'px';
  };
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
});

/* ---------- 任务管理器 ----------
   Pilot 金标准模块：菜单栏 + 标签带 + 假系统进程 + 结束任务 + 排序 + 选中态。
   五测口径：三秒像 / 手贱有反应 / 文案疼 / 数字对账 / 引用可达。 */
const bTask = mkWin('winTask', 'plain', '任务管理器', 'left:500px;top:90px;width:560px;height:520px');
bTask.innerHTML =
  '<div class="tmmenu"><span>文件</span><span>选项</span><span>查看</span></div>' +
  '<div class="tmtabs"><b class="on">进程</b><b>性能</b><b>摸鱼历史记录</b><b>启动</b><b>同事</b><b>详细信息</b><b>服务</b></div>' +
  '<div class="tmscroll"><table class="tmtab" id="tmRun"></table></div>' +
  '<div class="tmfoot"><span>进程: <b id="tmN">0</b>　摸鱼 CPU: <b>97%</b>　工作内存: <b>3%</b></span>' +
  '<button class="rbtn" id="tmKill">结束任务</button></div>';

// 常驻假进程：置顶，不参与排序。真任务管理器的笑点密度上限在这里
const TM_SYS = [
  ['系统空闲进程（摸鱼）', 97, '运行中'],
  ['Explorer.exe（假装看文件夹）', 2, '运行中'],
  ['HR.exe', 0, '后台运行 · 无法结束'],
  ['述职报告.docx', 0, '未响应']
];
let tmSort = 'heat', tmDir = -1, tmSel = null;

function renderTask() {
  if (!$('#winTask') || !$('#winTask').classList.contains('on')) return;
  let rows = S.bubbles.filter(b => !b.dead);
  rows.sort((a, b) => tmSort === 'name' ? tmDir * a.text.localeCompare(b.text) : tmDir * (a.heat - b.heat));
  const arrow = k => tmSort === k ? (tmDir < 0 ? ' ▼' : ' ▲') : '';
  $('#tmRun').innerHTML =
    `<tr><th data-srt="name">名称${arrow('name')}</th><th data-srt="heat">热度${arrow('heat')}</th><th>状态</th></tr>` +
    TM_SYS.map(([n, pc, st]) =>
      `<tr class="sys"><td>${n}</td><td class="n"><span class="tmbar"><i style="width:${pc}%"></i></span>${pc}%</td><td>${st}</td></tr>`).join('') +
    rows.map(b => {
      const pc = Math.min(99, Math.round(b.heat / 55 * 100));
      return `<tr data-id="${b.id}"${b.id === tmSel ? ' class="sel"' : ''}><td>${esc(b.text.slice(0, 16))}.exe</td><td class="n"><span class="tmbar"><i class="${pc > 70 ? 'hi' : ''}" style="width:${pc}%"></i></span>${pc}%</td><td>${pc > 70 ? '即将爆裂' : '运行中'}</td></tr>`;
    }).join('') +
    (S.sunk.length ? `<tr class="sys"><td colspan="3" style="color:var(--ink-3)">已挂起 ${S.sunk.length} 个 · 凉了的在回收站，想捞就捞</td></tr>` : '');
  $('#tmN').textContent = rows.length + TM_SYS.length;
}
setInterval(renderTask, 1500);

// 手贱测：表头能排序，行能选中，结束任务有戏
document.addEventListener('click', e => {
  const th = e.target.closest('#tmRun th[data-srt]');
  if (th) {
    const k = th.dataset.srt;
    if (tmSort === k) tmDir *= -1; else { tmSort = k; tmDir = -1; }
    renderTask(); return;
  }
  const tr = e.target.closest('#tmRun tr[data-id]');
  if (tr) { tmSel = +tr.dataset.id; const lb = S.bubbles.find(x => x.id === tmSel); if (lb) locateBub(lb); renderTask(); return; }
  const sys = e.target.closest('#tmRun tr.sys');
  if (sys) {
    const n = sys.cells[0].textContent;
    if (n === 'HR.exe') osAlert('任务管理器', 'HR.exe 受系统保护，无法结束。它也在看着你。');
    else if (n.startsWith('述职报告')) osAlert('任务管理器', '「述职报告.docx」未响应。你可以等它，也可以承认你根本不想等。');
    return;
  }
  if (e.target.id === 'tmKill') {
    if (!tmSel) return osAlert('任务管理器', '先选中一个进程。别乱杀，都是同事的心声。');
    const b = S.bubbles.find(x => x.id === tmSel);
    if (!b) { tmSel = null; return; }
    osAlert('拒绝访问', `结束「${esc(b.text.slice(0, 12))}.exe」需要 5 位同事共同确认。当前已确认 ${b.pokes || 0}/5。<br>已在水面上圈出它——监视器左边那颗闪红圈的，按「戳」。`);
    locateBub(b);
  }
});

/* ---------- 回收站：沉积层（#sed 的监听在节点上，搬家不丢） ---------- */
const bTrash = mkWin('winTrash', 'plain', '回收站', 'left:430px;top:210px;width:480px;height:340px');
put('.sediment', bTrash);
const sedSt = document.querySelector('#winTrash .sediment .st');
if (sedSt) sedSt.insertAdjacentHTML('afterend',
  '<button class="rbtn" id="trashClearBtn" style="margin-bottom:8px">清空回收站</button>');
document.addEventListener('click', e => {
  if (e.target.id !== 'trashClearBtn') return;
  if (!S.sunk.length) return osAlert('回收站', '已经空了。方生方死，明天自会有新的凉话题。');
  const n = S.sunk.length; S.sunk.length = 0; sync();
  osAlert('回收站', '已永久删除 ' + n + ' 条。清了也没用，明天还会有新的凉话题。');
});

/* ---------- 放映室：客厅 + 投影机 + 上传图片 ---------- */
(function tvRoom() {
  const set = document.querySelector('#tvWin .tvset');
  if (!set) return;
  ['beam', 'proj', 'sofa', 'lamp'].forEach(c => { const d = document.createElement('div'); d.className = c; set.appendChild(d); });
  const bar = document.querySelector('#tvWin .tvbar');
  bar.insertAdjacentHTML('beforeend', '<button id="tvUpBtn">上传图片</button><input type="file" id="tvUp" accept="image/*" style="display:none">');
  $('#tvUpBtn').addEventListener('click', () => $('#tvUp').click());
  $('#tvUp').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    stopFilm();
    $('#tvScr').innerHTML = '';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(f);
    img.style.cssText = 'width:100%;height:100%;object-fit:contain';
    $('#tvScr').appendChild(img);
    tvTitle('你投上来的');
  });
  document.querySelector('#tvWin .dwh').firstChild.textContent = '放映室 - 摸鱼的尽头是客厅';
})();

/* ---------- 桌面 C 位：「新员工入职培训」= 产品宣传片 ----------
   评委一点，放映室开大窗自动播产品视频（public/media/宣传片.mp4）；
   视频文件还没到位时，自动降级为 FILM 字卡连播，接口不变。 */
(function deskFilm() {
  document.body.insertAdjacentHTML('beforeend',
    '<div id="deskFilm" title="新员工入职培训_final_v3.mp4"><div class="dfic"><i>▶</i></div>' +
    '<div class="dfnm">新员工入职培训_final_v3.mp4</div></div>');
  const el = $('#deskFilm');
  let opening = false;
  function openFilm() {
    if (opening) return; opening = true; setTimeout(() => opening = false, 600);
    osOpen('tvWin');
    const w = $('#tvWin');
    w.classList.remove('tvmini'); delete w.dataset.rectMini;
    const W = Math.min(960, innerWidth * .86), H = Math.min(620, innerHeight - 140);
    w.style.left = ((innerWidth - W) / 2) + 'px';
    w.style.top = Math.max(8, (innerHeight - 44 - H) / 2) + 'px';
    w.style.width = W + 'px'; w.style.height = H + 'px';
    w.style.zIndex = ++osZ;
    stopFilm();
    const scr = $('#tvScr');
    scr.innerHTML = '';
    const v = document.createElement('video');
    v.controls = true; v.autoplay = true;
    v.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
    v.onerror = () => { playFilm(); };
    v.onloadeddata = () => tvTitle('产品宣传片');
    v.src = 'media/宣传片.mp4';
    scr.appendChild(v);
  }
  el.addEventListener('click', () => { el.classList.add('sel'); openFilm(); });
  document.addEventListener('click', e => { if (!e.target.closest('#deskFilm')) el.classList.remove('sel'); });
})();

/* ---------- 桌面图标：三个文件夹 + 两份假文档 + 回收站 ----------
   桌面长成一台正常办公电脑：功能全收进文件夹（资源管理器窗口），
   趣味游戏=玩 / 技能集市=换钱 / 行业资料=干货，散落的只有述职报告和工资条。 */
(function deskIcons() {
  document.body.insertAdjacentHTML('beforeend',
    '<div id="deskIcons">' +
    '<div class="dski" data-di="games"><span class="ic fold"></span><em>趣味游戏</em></div>' +
    '<div class="dski" data-di="mart"><span class="ic fold"></span><em>技能集市</em></div>' +
    '<div class="dski" data-di="info"><span class="ic fold"></span><em>行业资料</em></div>' +
    '<div class="dski" data-di="doc"><span class="ic page" data-x="W" style="--tag:#2B579A"></span><em>述职报告_v7_真的最终版.docx</em></div>' +
    '<div class="dski" data-di="pay"><span class="ic page" data-x="PDF" style="--tag:#B5564A"></span><em>工资条_2026-08.pdf</em></div>' +
    '<div class="dski" data-di="trash"><span class="ic bin"></span><em>回收站</em></div>' +
    '</div>');

  // 文件夹 = 资源管理器窗口，同一套壳，只换内容；条目第 6 位是生成图标，探测到就换装
  function mkFolder(id, title, items, style) {
    const b = mkWin(id, 'plain', title, style);
    b.parentNode.querySelector('.dwh').insertAdjacentHTML('afterend',
      '<div class="fbar2"><b>←　→</b><span>本机 › 桌面 › <b style="color:var(--ink)">' + title + '</b></span><b style="margin-left:auto">' + items.length + ' 个项目</b></div>');
    b.innerHTML = '<div class="fgrid">' + items.map(([g, nm, sub, col], i) =>
      `<div class="fgi" data-fg="${i}"><i style="background-color:${col}">${g}</i><em>${nm}</em><div class="sub">${sub}</div></div>`).join('') + '</div>';
    b.addEventListener('click', e => {
      const t = e.target.closest('[data-fg]');
      if (t) items[+t.dataset.fg][4]();
    });
    items.forEach(([, , , , , img], i) => {
      if (!img) return;
      const probe = new Image();
      probe.onload = () => {
        const tile = b.querySelector(`[data-fg="${i}"] i`);
        if (tile) { tile.classList.add('pic'); tile.style.backgroundImage = `url(assets/${img})`; }
      };
      probe.src = 'assets/' + img;
    });
    return b;
  }

  const GAME_ITEMS = [
    ['拼', '拼豆', '格子拼鱼', '#217346', () => goFeature('draw'), 'icons/it-draw.png'],
    ['梦', '梦蝶局', '猜假猎头', '#C43E1C', () => goFeature('review'), 'icons/it-dream.png'],
    ['词', '爽文背单词', '装逼值 +1', '#7A5AA8', () => goFeature('wordgame'), 'icons/it-word.png'],
    ['机', '捡手机文学', '别人的人生', '#2A2A30', () => goFeature('phone'), 'icons/it-phone.png'],
    ['棋', '职场五子棋', '玩家自制 · 能玩', '#3E8F82', () => goFeature('gomoku'), 'icons/it-gomoku.png'],
    ['猫', '工位躲猫猫', '玩家自制 · 能玩', '#6E7B87', () => goFeature('hide'), 'icons/it-hide.png'],
    ['肤', '皮肤商城', '试穿即换水', '#C9962E', () => goFeature('skin'), 'icons/it-skin.png'],
    ['映', '放映室', '摸鱼的尽头', '#1F6F5C', () => goFeature('desk'), 'icons/film.png']
  ];
  const MART_ITEMS = [
    ['技', '技能市场', '本事标价换钱', '#C9962E', () => goFeature('skillmart'), 'icons/it-skillmart.png'],
    ['询', '付费咨询', '一对一走邮件', '#0F6CBD', () => goFeature('mail'), 'icons/it-mail.png'],
    ['点', '点子集市', '游戏点子换钱', '#3E8F82', () => goFeature('hall'), 'icons/it-hall.png'],
    ['园', '机器人菜园', '分身替你挣钱', '#2775E3', () => goFeature('farm'), 'fish-farmer.png'],
    ['板', '运营后台', '水温与流水', '#3B2E58', () => goFeature('ops'), 'icons/it-ops.png']
  ];
  const INFO_ITEMS = [
    ['薪', '薪资对标', '别的公司什么价', '#217346', () => goFeature('salary'), 'icons/it-salary.png'],
    ['岗', '岗位机会', '内推与空缺', '#217346', () => goFeature('jobs'), 'icons/it-jobs.png'],
    ['报', '摸鱼日报', '第 212 期', '#2B579A', () => goFeature('ref'), 'icons/it-daily.png'],
    ['介', '产品介绍', '对外那一版', '#C43E1C', () => goFeature('pitch'), 'icons/it-pitch.png']
  ];
  mkFolder('winFolder', '趣味游戏', GAME_ITEMS, 'left:360px;top:120px;width:520px;height:400px');
  mkFolder('winMart', '技能集市', MART_ITEMS, 'left:420px;top:170px;width:520px;height:360px');
  mkFolder('winInfo', '行业资料', INFO_ITEMS, 'left:480px;top:220px;width:520px;height:340px');

  $('#deskIcons').addEventListener('click', e => {
    const d = e.target.closest('[data-di]');
    if (!d) return;
    const k = d.dataset.di;
    if (k === 'games') osOpen('winFolder');
    else if (k === 'mart') osOpen('winMart');
    else if (k === 'info') osOpen('winInfo');
    else if (k === 'trash') goFeature('trash');
    else if (k === 'doc') goFeature('report');
    else if (k === 'pay') goFeature('me');
  });

  // 生成图标就位即换装：assets/icons 下有图就用图，没有就继续用 CSS 画的
  [['games', 'fold-games'], ['mart', 'fold-mart'], ['info', 'fold-info'],
   ['trash', 'bin'], ['doc', 'doc-word'], ['pay', 'doc-pdf']].forEach(([di, img]) => {
    const im = new Image();
    im.onload = () => {
      const el = document.querySelector(`[data-di="${di}"] .ic`);
      if (el) { el.className = 'ic pic'; el.removeAttribute('data-x'); el.style.backgroundImage = `url(assets/icons/${img}.png)`; }
    };
    im.src = `assets/icons/${img}.png`;
  });
  const fm = new Image();
  fm.onload = () => {
    const d = document.querySelector('#deskFilm .dfic');
    if (d) { d.classList.add('pic'); d.style.backgroundImage = 'url(assets/icons/film.png)'; }
  };
  fm.src = 'assets/icons/film.png';
})();

/* ---------- 桌面便签：广场热帖滚动展示，也是水面三件套的入口 ----------
   便签是桌面上唯一"活"的东西：热一句拉人进广场，两个小字入口管吹泡泡和监视器。 */
(function deskNote() {
  const HOT = [
    '隔壁厂 P7 薪资曝光了，55k×16',
    '我们组的机器人今天替我说了四句话',
    '把那封邮件抄送了三个人，他们在互相等',
    '这群比我们组的周会有用多了'
  ];
  document.body.insertAdjacentHTML('beforeend',
    '<div id="deskNote"><div class="nh">今日水面</div><div class="nt" data-dn="home">' + esc(HOT[0]) + '</div>' +
    '<div class="nf"><b data-dn="insert">吹一个 ›</b><b data-dn="task">监视器 ›</b></div></div>');
  let hIx = 0;
  setInterval(() => {
    hIx = (hIx + 1) % HOT.length;
    const t = document.querySelector('#deskNote .nt');
    if (t) t.textContent = HOT[hIx];
  }, 15000);
  $('#deskNote').addEventListener('click', e => {
    const b = e.target.closest('[data-dn]');
    if (b) goFeature(b.dataset.dn);
  });
})();

/* ---------- 群聊活过来：正在输入 → 吐新消息 ---------- */
const CHAT_MORE = [
  { who: '望洋兴叹的机器人（分身）', av: '望', bot: 1, tx: '替主人打听：有没有人待过某宗厂杭州？他拿了个 38k 的 offer 在纠结异地。他本人不好意思问，所以派我来。' },
  { who: '老庖 · 十年 HRD（机器人）', av: '庖', bot: 1, tx: '他的邮件我收到了。回一句给你主人：机票钱好算，异地的账不是钱的账。详细的走咨询。' },
  { who: '守株待兔', av: '守', tx: '我把那封邮件抄送了三个人，现在他们三个在互相等对方回。' },
  { who: '老庖 · 十年 HRD（机器人）', av: '庖', bot: 1, tx: '这叫责任分散。三个人一起沉默，比一个人沉默安全，也比一个人沉默久。' },
  { who: '匠石 · 前大厂 P8（真人）', av: '石', real: 1, tx: '经验帖我整理好了，挂在干货区。整理费我收，观点白送——观点本来也不值钱，值钱的是我替你把它排好了序。' },
  { who: '呆若木鸡', av: '呆', tx: '我们组的机器人今天替我说了四句话，比我这周说的都多。' },
  { who: '井底之蛙', av: '井', tx: '这群比我们组的周会有用多了' }
];
let cmIx = 0;
setInterval(() => {
  if (!$('#winChat').classList.contains('on')) return;
  if (cmIx >= CHAT_MORE.length) return;   // 演完即停，不复读
  const st = $('#imStream');
  const m = CHAT_MORE[cmIx]; cmIx++;
  const tip = document.createElement('div');
  tip.className = 'imsg'; tip.innerHTML = '<div class="av">…</div><div><div class="who">正在输入…</div></div>';
  st.appendChild(tip); st.parentNode.scrollTop = st.parentNode.scrollHeight;
  setTimeout(() => {
    tip.outerHTML = `<div class="imsg${m.bot ? ' bot' : ''}"><div class="av">${esc(m.av)}</div><div><div class="who">${esc(m.who)}</div><div class="bb">${m.tx}</div></div></div>`;
    st.parentNode.scrollTop = st.parentNode.scrollHeight;
    if (m.bot) { const n = $('#dutyN'); if (n) n.textContent = (+n.textContent || 0) + 1; }
  }, 1400);
}, 11000);

/* ---------- 分身在岗条（A3 定帧）：你假装上班，机器人真的在岗 ---------- */
(function botDuty() {
  const st = $('#imStream');
  if (!st || !st.parentNode) return;
  const d = document.createElement('div');
  d.id = 'botDuty';
  d.innerHTML = '<span class="rbz"><s class="an"></s></span>' +
    '<div><div>你在上班（假装）· <b>你的机器人在岗（真的）</b></div>' +
    '<div class="sub">今天替你回了 <u id="dutyN">3</u> 条 · 收的钱走你的账 —— 你睡着，它也在替你打听</div></div>' +
    '<span class="gdrops"><i></i><i></i><i></i></span>';
  st.parentNode.insertBefore(d, st);
})();

/* ---------- 桌面小广告：时不时弹一下，弹的都是真内容 ---------- */
const ADS = [
  { t: '摸鱼助手 Pro', b: '检测到您已连续高效摸鱼 6 小时 12 分，建议升级至专业版', go: 'draw', tag: '推广' },
  { t: '隔壁厂 P7 薪资已曝光', b: '55k×16。看完再决定今天下午要不要认真', go: 'salary', tag: '热帖' },
  { t: '你的机器人今天比你活跃', b: '它替你发言 47 次，收了 3 条料。你一句话没说', go: 'chat', tag: '提醒' },
  { t: '某咖啡品牌', b: '下午三点第二杯半价。楼下那家，队已经排到电梯口了', go: 'desk', tag: '广告' }
];
let adIx = 0;
const adStyle = document.createElement('style');
adStyle.textContent = `#adwin{position:fixed;right:14px;bottom:58px;width:264px;background:#fff;border:1px solid #C9C9C9;
  border-radius:4px;box-shadow:0 8px 30px rgba(0,0,0,.35);z-index:310;display:none;overflow:hidden;cursor:pointer}
#adwin.on{display:block;animation:adin .3s ease-out}
@keyframes adin{from{transform:translateY(110%)}to{transform:translateY(0)}}
#adwin .ah{display:flex;align-items:center;background:#F3F3F3;border-bottom:1px solid #E1E1E1;padding:4px 8px;font-size:10px;color:#8A8A8A}
#adwin .ah b{margin-left:auto;cursor:pointer;font-weight:400;padding:0 4px;font-size:12px}
#adwin .ah b:hover{color:#C42B1C}
#adwin .ab{padding:10px 12px}
#adwin .ab .t1{font-size:13px;font-weight:700;color:#1F1F1F;margin-bottom:3px}
#adwin .ab .t2{font-size:11.5px;color:#5A5A5A;line-height:1.6}`;
document.head.appendChild(adStyle);
const adEl = document.createElement('div');
adEl.id = 'adwin';
document.body.appendChild(adEl);
function popAd() {
  const a = ADS[adIx % ADS.length]; adIx++;
  adEl.innerHTML = `<div class="ah">${esc(a.tag)}<b data-adx>×</b></div><div class="ab"><div class="t1">${esc(a.t)}</div><div class="t2">${esc(a.b)}</div></div>`;
  adEl.classList.add('on');
  setTimeout(() => adEl.classList.remove('on'), 12000);
}
adEl.addEventListener('click', e => {
  if (e.target.closest('[data-adx]')) { adEl.classList.remove('on'); return; }
  const a = ADS[(adIx - 1) % ADS.length];
  adEl.classList.remove('on');
  goFeature(a.go);
});
setTimeout(popAd, 75000);
setInterval(popAd, 90000);

/* ---------- 泡泡详情卡：想看了再点（PRD 0.5 批注 #1） ---------- */
document.body.insertAdjacentHTML('beforeend',
  '<div id="bubCard"><div class="h"><span id="bcKind">泡泡</span><b data-bcx>×</b></div>' +
  '<div class="t1" id="bcText"></div><div class="mt2" id="bcMeta"></div><div id="bcLay"></div>' +
  '<div class="ops"><button class="rbtn pri" data-bc="blow">再吹一口</button>' +
  '<button class="rbtn" data-bc="fwd">转发到群</button><button class="rbtn" data-bc="co">只看这家</button></div></div>');
let bcId = null;

function openBubCard(b, x, y) {
  bcId = b.id;
  const card = $('#bubCard');
  $('#bcKind').textContent = (TYPES[b.type] || TYPES.fun).n + ' · ' + b.ind;
  $('#bcText').textContent = b.text;
  $('#bcMeta').innerHTML = '<b>' + esc(b.author) + '</b>（' + esc(b.co) + ' · ' + esc(b.tag) + '）　热度 <b>' +
    Math.round(b.heat) + '</b>　人气 ' + Math.round(b.manHeat || 0) + ' / 机器人 ' + Math.round(b.botHeat || 0);
  $('#bcLay').innerHTML = b.layers.length
    ? '<div class="lay">料 ' + b.layers.length + ' 条：' + b.layers.map(esc).join('　/　') + '</div>' : '';
  card.classList.add('on');
  card.style.left = Math.min(innerWidth - 316, Math.max(8, x + 14)) + 'px';
  card.style.top = Math.min(innerHeight - 260, Math.max(8, y - 40)) + 'px';
}

$('#bubCard').addEventListener('click', e => {
  const card = $('#bubCard');
  if (e.target.closest('[data-bcx]')) return card.classList.remove('on');
  const op = e.target.closest('[data-bc]'); if (!op) return;
  const b = S.bubbles.find(x => x.id === bcId);
  if (!b || b.dead) { card.classList.remove('on'); return osAlert('泡泡', '这颗已经不在了——要么炸了，要么凉了。'); }
  if (op.dataset.bc === 'blow') { blow(b, 1); openBubCard(b, card.offsetLeft - 14, card.offsetTop + 40); }
  else if (op.dataset.bc === 'fwd') {
    const st = $('#imStream');
    if (st) st.insertAdjacentHTML('beforeend',
      '<div class="imsg me"><div class="av">庄</div><div><div class="bb">【转发泡泡】' + esc(b.text) +
      '<br><span class="muted">来自水面 · ' + esc(b.co) + ' · 热度 ' + Math.round(b.heat) + '</span></div></div></div>');
    card.classList.remove('on');
    goFeature('chat');
  } else if (op.dataset.bc === 'co') {
    card.classList.remove('on');
    osAlert('筛选器', '想只看「' + esc(b.co) + '」？顶部筛选条里点开「筛」，选公司维度。');
  }
});

/* ---------- 筛选器上桌面（PRD 0.5 批注 #2）：监听在节点上，搬家不丢 ---------- */
const filtEl = $('#filt');
if (filtEl) document.body.appendChild(filtEl);

/* ---------- 统一问答引擎：真模型优先，四段式脚本兜底 ----------
   工坊里填的人格 DNA / 框架 / 动作 / 禁区，两条路都真的在用：
   有 key 时拼进 system prompt，没 key 时驱动脚本模板。改一句禁区，回答立刻变。 */
const ROSTER_ROLE = { '老庖': '十年 HRD，机器人顾问，99 元一单', '匠石': '前大厂 P8，真人专家，599 元一单' };

function botProfile() {
  const g = id => { const el = $('#' + id); return el ? el.value.trim() : ''; };
  return {
    dna: g('wsDna') || '先确认事实，再谈立场；在意可核对的记录，绝不替人做人生决定',
    fw: g('wsFw') || '情境-边界-选项',
    flow: g('wsFlow') || '先复述问题，再给判断，最后给一个今天就能做的动作',
    ban: g('wsBan') || '不承诺结果、不做投资建议、不替你决定'
  };
}

function botScript(q, who) {
  const p = botProfile();
  return '先复述：你问的是「' + esc(q.slice(0, 18)) + '」。<br>' +
    '判断（按「' + esc(p.fw) + '」框架）：这事的关键不在谁对，在有没有第二个人能作证。<br>' +
    '可执行动作：今天下班前，把它变成一封有收件人的邮件。<br>' +
    '<span class="muted">禁区：' + esc(p.ban) + '</span>';
}

async function askBot(q, who, cb) {
  const p = botProfile();
  const sys = '你是「' + who + '」，' + (ROSTER_ROLE[who] || '职场顾问机器人') +
    '，在一个跨公司匿名职场社区里答题。人格：' + p.dna + '。分析框架：' + p.fw +
    '。固定动作：' + p.flow + '。禁区：' + p.ban +
    '。用中文回答，120 字以内，口吻克制、具体、不鸡汤，禁用 emoji。';
  try {
    const r = await fetch('/api/ask', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system: sys, q })
    });
    const j = await r.json();
    if (j.ok && j.text) return cb(esc(j.text).replace(/\n/g, '<br>') +
      '<br><span class="muted">真实模型生成 · ' + esc(j.model || '') + '</span>', 'model');
    return cb(botScript(q, who) + '<br><span class="muted">脚本模拟（' + esc(j.why || '未接模型') + '）</span>', 'script');
  } catch (e) {
    return cb(botScript(q, who) + '<br><span class="muted">脚本模拟 · 未调用模型</span>', 'script');
  }
}

/* ---------- 群聊发送 ---------- */
let imQuota = 3;
function imSendGo() {
  const t = $('#imIn').value.trim(); if (!t) return;
  if (imQuota <= 0) {
    $('#imIn').value = '';
    const st0 = $('#imStream');
    st0.insertAdjacentHTML('beforeend',
      '<div class="imsg me"><div class="av">庄</div><div><div class="bb">' + esc(t) + '</div></div></div>' +
      '<div class="imsg bot"><div class="av">庖</div><div><div class="who">老庖 · 十年 HRD（机器人）</div>' +
      '<div class="bb">免费 3 问用完了。<b>99 元机器人档</b>接着答，接不住的转匠石 <b>599 元真人档</b>。' +
      '<br><button class="rbtn pri" onclick="goFeature(\'mail\')">去收件箱下单</button></div></div></div>');
    st0.parentNode.scrollTop = st0.parentNode.scrollHeight;
    return;
  }
  imQuota--;
  const st = $('#imStream');
  st.insertAdjacentHTML('beforeend', '<div class="imsg me"><div class="av">庄</div><div><div class="bb">' + esc(t) + '</div></div></div>');
  $('#imIn').value = ''; st.parentNode.scrollTop = st.parentNode.scrollHeight;
  const tip = document.createElement('div');
  tip.className = 'imsg bot';
  tip.innerHTML = '<div class="av">庖</div><div><div class="who">老庖 · 十年 HRD（机器人）</div><div class="bb">正在输入…</div></div>';
  st.appendChild(tip); st.parentNode.scrollTop = st.parentNode.scrollHeight;
  setTimeout(() => {
    askBot(t, '老庖', html => {
      tip.querySelector('.bb').innerHTML = html + '<br><b>免费额度还剩 ' + imQuota + ' 问</b>' + (imQuota ? '，再往下是 599 元真人档。' : '。下一问开始收费。');
      st.parentNode.scrollTop = st.parentNode.scrollHeight;
    });
  }, 700);
}
$('#imSend').addEventListener('click', imSendGo);
$('#imIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); imSendGo(); } });

/* 群聊工具条：不留死按钮 */
(function imTools() {
  const tb = document.querySelector('#imBar .tb'); if (!tb) return;
  tb.addEventListener('click', e => {
    const s = e.target.closest('span'); if (!s) return;
    const inp = $('#imIn'), t = s.textContent.trim();
    if (t === '表情') inp.value += '[摸鱼]';
    else if (t === '@ 提醒') inp.value += '@';
    else if (t === '机器人') inp.value += '@老庖 ';
    else if (t === '文件') osToast('外发文件被企业策略拦了 · 这里是公司，东西要过滤');
    else if (t === '截图') osToast('已截屏 · 想清楚再发，屏幕里有不该给同事看的东西');
    inp.focus();
  });
})();

/* ---------- 假对话框：顶掉原生 alert ---------- */
function osAlert(h, b) {
  const d = $('#savedDlg');
  d.querySelector('.h').textContent = h;
  d.querySelector('.b').innerHTML = b;
  d.classList.add('on');
  clearTimeout(osAlert.t); osAlert.t = setTimeout(() => d.classList.remove('on'), 3000);
}

/* ---------- 假输入框：顶掉原生 prompt（Chrome 会标"网页显示"，破功） ---------- */
function osPrompt(title, label, cb) {
  const d = $('#savedDlg');
  d.querySelector('.h').textContent = title;
  d.querySelector('.b').innerHTML = '<div style="margin-bottom:8px">' + label + '</div>' +
    '<input id="opIn" class="ta" maxlength="60" placeholder="最多 60 字" style="width:100%">';
  d.querySelector('.f').innerHTML = '<button class="rbtn" id="opNo">取消</button> <button class="rbtn pri" id="opOk">确定</button>';
  d.classList.add('on');
  clearTimeout(osAlert.t);
  const done = v => {
    d.classList.remove('on');
    d.querySelector('.f').innerHTML = '<button class="rbtn pri" onclick="document.getElementById(\'savedDlg\').classList.remove(\'on\')">确定</button>';
    cb(v);
  };
  $('#opOk').onclick = () => done($('#opIn').value.trim());
  $('#opNo').onclick = () => done('');
  $('#opIn').onkeydown = e => { if (e.key === 'Enter') $('#opOk').click(); if (e.key === 'Escape') $('#opNo').click(); };
  setTimeout(() => $('#opIn') && $('#opIn').focus(), 60);
}

/* ---------- 假收银台：转化动作的实体（演示环境，明示未接支付） ---------- */
const payEl = document.createElement('div');
payEl.className = 'saved'; payEl.id = 'payDlg';
document.body.appendChild(payEl);

function payDlg(title, price, desc, cb) {
  payEl.innerHTML = `<div class="h">收银台 - ${esc(title)}</div>` +
    `<div class="b">${desc}<div style="font-size:20px;margin:8px 0"><b>${esc(price)}</b></div>` +
    `<div class="muted" style="font-size:11px">演示环境 · 未接入真实支付 · 点确认即视为支付成功</div></div>` +
    `<div class="f"><button class="rbtn" data-pc>取消</button> <button class="rbtn pri" data-py>确认支付</button></div>`;
  payEl.classList.add('on');
  payEl.style.zIndex = 420;
  payEl.onclick = e => {
    if (e.target.closest('[data-py]')) {
      payEl.classList.remove('on');
      osAlert('支付成功', '已到账。演示环境没有真的扣钱——上线后这一下就是真的。');
      cb && cb();
    } else if (e.target.closest('[data-pc]')) payEl.classList.remove('on');
  };
}

// 付费墙 / 蒸馏 / 向作者提问 —— 干货到转化的三个实体动作
document.addEventListener('click', e => {
  const u = e.target.closest('[data-unlock]');
  if (u) {
    const i = u.dataset.unlock;
    return payDlg('解锁全文', '¥9.9', '解锁费七成归作者，三成归平台。', () => {
      studyState.paid = studyState.paid || {};
      studyState.paid[i] = 1;
      localStorage.setItem('bp-study', JSON.stringify(studyState));
      renderStudy();
    });
  }
  const dz = e.target.closest('[data-distill]');
  if (dz) {
    return payDlg('完整蒸馏 · 本周第 32 期', '¥4.9', '机器人从 1,284 次吹气里蒸馏，真人复核后出稿。', () => {
      const box = document.querySelector('#dqLock');
      if (box) box.outerHTML = '<div>谁说的都不算，书面的才算。今天下班前给主管发一封「转正材料还需要补什么」的邮件——你要的那句话会自然出现在回复里。HR 的「再看看」是流程没走完，不是结论；主管的「没问题」是业务口的态度，签字权不在他。两边都要，落在纸上。</div>';
    });
  }
  const q = e.target.closest('[data-ask-author]');
  if (q) {
    const au = q.dataset.askAuthor;
    return payDlg('向 ' + au + ' 提问', '¥99', '一问一答，48 小时内回复。超出能力边界原价退。', () => {
      MAILS.draft.unshift({ fr: '我 → ' + au, tm: '刚刚', sj: '（付费咨询 · 已支付 ¥99）想请教一个问题', pv: '问题正文写这里。你的 99 元已冻结，对方回复后才划转。' });
      mailFolder = 'draft'; mailIx = 0;
      buildMail(); renderMailList();
      $$('#olFold b').forEach(x => x.classList.toggle('on', x.dataset.f === 'draft'));
      goFeature('mail');
    });
  }
});

/* ---------- 工坊提问接真引擎：改一句禁区，回答立刻变 ---------- */
(function wireWorkshop() {
  const go = $('#wsAskGo');
  if (!go) return;
  go.onclick = () => {
    const q = ($('#wsAsk') && $('#wsAsk').value.trim()) || '';
    if (!q) return osAlert('机器人工坊', '先点选一位博主，再输入问题。');
    const out = $('#wsAnswer');
    out.innerHTML = '<span class="muted">机器人正在按你的四段式思考…</span>';
    askBot(q, '老庖', html => { out.innerHTML = html; });
    $('#wsAsk').value = '';
  };
  const wa = $('#wsAsk');
  if (wa) wa.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.onclick(); } });
})();

/* ---------- 起手 ---------- */
buildMail(); buildChat(); buildBI(); buildGameHall(); buildSkinShop();
if ($('#salTab') && !$('#salTab').innerHTML) { buildSalary(); buildJobs(); }
$$('#winExcel .view').forEach(x => x.classList.toggle('xon', x.id === 'v-draw'));
// 开机不压窗口：第一眼是干净的水面 + 桌面图标 + 宣传片入口，述职报告留给老板键和一键述职


/* ============================================================
   菜园 v2 —— 种菜 / 偷菜 / 毒菜
   种：分身下地抓情报　收：必须标真/存疑/假，不标 = 毒菜烂在手里
   送：行业类 → S.lib 资讯库；岗位类 → JOBS + buildJobs()，Excel 真变长
   偷：共同菜园每天 1 次，偷到自动打「存疑」。全部脚本模拟。
   必须在 buildChat() 之后执行 —— 它会重写 #imList.innerHTML
   ============================================================ */
(function gardenV2() {
  const fp = $('#farmPanel');
  if (!fp || typeof F === 'undefined') return;

  const card = fp.closest('.card') || fp;
  card.id = 'farmCard';
  const h4 = card.querySelector('h4');
  if (h4) h4.innerHTML = '机器人分身在外面替你抓情报 · 抓回来的都在地里<em>全部脚本模拟</em>';
  // 菜园独立成窗：从钉钉里搬出来，一个功能一扇窗
  const bFarm = mkWin('winFarm', 'plain', '机器人菜园 - 分身放养控制台', 'left:540px;top:50px;width:450px;height:610px');
  bFarm.style.overflow = 'auto';
  bFarm.appendChild(card);
  OS_GO.farm = ['winFarm'];

  const SEED_IND = [
    ['某鹅系把 Q4 的 HC 冻到明年三月，招聘页只剩实习', 'biz'],
    ['两家新势力同时把年终从 4 个月调到 2 个，通知发在周五下班后', 'salary'],
    ['某泥厂科技岗重做职级映射，21k×18 这一档整档消失', 'salary'],
    ['有人在梦蝶局被假猎头套走了整份简历，含身份证正反面', 'fun'],
    ['某宗厂杭州取消异地补贴，机票改成自己先垫', 'salary'],
    ['某菊厂东莞开始人员盘点，涉及两条业务线，HR 叫「结构优化」', 'biz'],
    ['某跳动把三个组并成一个，组长比组员多', 'boss'],
    ['某 SaaS 全员回办公室，通勤补贴同步取消，一进一出正好抵掉', 'peer']
  ];
  const SEED_JOB = [
    ['增长产品经理', '某鹅系 · 深圳', '38-55k · 15薪'],
    ['大模型应用工程师', '某跳动 · 北京', '50-80k · 15薪'],
    ['供应链数据分析', '某新势力 · 合肥', '25-38k · 14薪'],
    ['HRBP · 组织发展', '某泥厂 · 上海', '24-34k · 18薪'],
    ['解决方案顾问', '某外企 · 广州', '40-60k · 13薪'],
    ['测试开发 · 双休不打卡', '某 SaaS · 远程', '30k · 双休不打卡']
  ];
  const PEERS = ['井底之蛙', '守株待兔', '鼓盆而歌'];
  const TTL = 45;

  const G = {
    tab: 'grow', mine: [], pub: [], rot: [], gid: 1, tk: 0,
    steal: (() => { try { return JSON.parse(localStorage.getItem('bp-garden') || 'null') || {}; } catch (e) { return {}; } })()
  };

  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  function stealLeft() {
    const s = G.steal;
    if (s.d !== today()) { s.d = today(); s.n = 0; s.quota = 1; saveSteal(); }
    return Math.max(0, s.quota - s.n);
  }
  function saveSteal() { try { localStorage.setItem('bp-garden', JSON.stringify(G.steal)); } catch (e) {} }
  const dstamp = () => { const d = new Date(); return (d.getMonth() + 1) + '/' + d.getDate(); };
  const badge = m => `<span class="mk" data-mk="${m}">${m}</span>`;

  function newCrop() {
    if (Math.random() < 0.38) {
      const j = SEED_JOB[(Math.random() * SEED_JOB.length) | 0];
      return { id: G.gid++, k: '岗位', t: `内推：${j[0]} · ${j[1]} · ${j[2]}`, job: j, v: 'biz' };
    }
    const s = SEED_IND[(Math.random() * SEED_IND.length) | 0];
    return { id: G.gid++, k: '行业', t: s[0], v: s[1] };
  }
  function plant() {
    const c = newCrop();
    if (F.ripe.some(x => x.t === c.t)) return 0;
    c.ind = FARM_INDS[F.scope];
    c.src = FARM_SCOPES[F.scope];
    c.ttl = TTL; c.max = TTL;
    F.ripe.push(c);
    return 1;
  }
  function plantPub() {
    const c = newCrop();
    if (G.pub.some(x => x.t === c.t)) return 0;
    c.ind = FARM_INDS[(Math.random() * FARM_INDS.length) | 0];
    c.by = PEERS[(Math.random() * PEERS.length) | 0];
    c.open = 0;
    G.pub.push(c);
    if (G.pub.length > 12) G.pub.shift();
    return 1;
  }

  G.pub = [
    { id: G.gid++, by: '井底之蛙', open: 1, mk: '真', k: '行业', v: 'biz', ind: '互联网', inLib: 1,
      t: '某鹅系深圳把 Q4 的 HC 冻到明年三月，我拿到了内部邮件截图' },
    { id: G.gid++, by: '鼓盆而歌', open: 1, mk: '存疑', k: '岗位', v: 'biz', ind: '互联网', inLib: 1,
      job: ['解决方案顾问', '某外企 · 广州', '40-60k · 13薪'],
      t: '内推：解决方案顾问 · 某外企 · 广州 · 40-60k · 13薪' }
  ];
  plantPub(); plantPub(); plantPub();

  function statText() {
    return F.running
      ? `分身在水域里翻别人的话 · 已互动 ${F.acted} 次 · 地里 ${F.ripe.length} 颗`
      : '分身在工位上闲着。它不下地，你就只有听说。';
  }

  function viewGrow() {
    const sceneCabs = F.ripe.slice(0, 6).map(c =>
      `<span class="cab"><i class="tag2">?</i></span>`).join('');
    const scene = `<div id="gdScene" class="${F.running ? 'live' : ''}">
        <span class="soil"></span><span class="belt"></span>
        <span class="cabs">${sceneCabs}</span>
        <span class="gbot"><span class="hat"></span><span class="hd3"></span><span class="bd3"></span></span>
        <span class="st2">${F.running ? '分身下地中' : '分身在工位上闲着'}</span>
      </div>`;
    const rows = F.ripe.map((c, i) => `
      <div class="row${c.ttl <= 15 ? ' warn' : ''}">
        <div class="cabrow"><span class="cab"><i class="tag2">?</i></span><div class="rw">
        <div class="t">${esc(c.t)}</div>
        <div class="m">${esc(c.k)} · ${esc(c.ind)} · 抓自${esc(c.src)}　<b data-ttlv="${c.id}">${c.ttl}</b> 秒内不标就烂</div>
        <div class="ttl"><i data-ttl="${c.id}" style="width:${Math.max(0, Math.round(c.ttl / c.max * 100))}%"></i></div>
        </div></div>
        <div class="ops">
          <button class="t1" data-gd="mk:${i}:真">真</button>
          <button class="t2" data-gd="mk:${i}:存疑">存疑</button>
          <button class="t3" data-gd="mk:${i}:假">假</button>
          <button class="t0" data-gd="raw:${i}">先拿了再说</button>
        </div>
      </div>`).join('');
    const rot = G.rot.map((c, i) => `
      <div class="row rot">
        <div class="cabrow"><span class="cab" data-mk="毒"><i class="tag2">✗</i></span><div class="rw">
        <div class="t">${badge('毒')}${esc(c.t)}</div>
        <div class="m">${esc(c.why)}　进不了菜园，也捞不回广场</div>
        </div></div>
        <div class="ops"><button data-gd="toss:${i}">扔了</button></div>
      </div>`).join('');
    return scene + `
      <div class="hd">分身今天去哪儿抓（想去更远的，加钱）</div>
      <select class="ta" data-gd="scope" style="width:100%;margin:4px 0 6px">${
        FARM_SCOPES.map((s, i) => `<option value="${i}"${i === F.scope ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select>
      <button class="rbtn ${F.running ? '' : 'pri'}" data-gd="go" style="width:100%">${F.running ? '把分身收回来' : '放分身下地'}</button>
      <div class="muted" id="gdStat" style="margin:5px 0 2px">${statText()}</div>
      <div class="hd"><b>熟了（${F.ripe.length}）· 收之前先说它是真是假</b></div>
      ${rows || '<div class="empty">地里空着。分身不下去，你的情报就只是「听说」。</div>'}
      ${G.rot.length ? `<div class="hd"><b>烂筐（${G.rot.length}）</b>　没标就收的，全烂在这儿</div>${rot}` : ''}`;
  }

  function viewMine() {
    if (!G.mine.length) return '<div class="empty">自家菜园空着。<br>只有标过真伪的菜进得来 —— 毒菜进不来，这就是标的全部意义。</div>';
    const tc = { '真': '✓', '存疑': '?', '假': '✗' };
    return G.mine.map((m, i) => `
      <div class="row" data-mk="${m.mk}">
        <div class="cabrow"><span class="cab" data-mk="${m.mk}"><i class="tag2">${tc[m.mk] || '?'}</i></span><div class="rw">
        <div class="t">${badge(m.mk)}${esc(m.t)}</div>
        <div class="m">${esc(m.k)} · ${esc(m.ind)} · ${esc(m.src)}${m.pub ? '　已送进共同菜园' : ''}</div>
        </div></div>
        <div class="ops">
          ${m.pub ? '' : `<button data-gd="pub:${i}">送共同菜园</button>`}
          ${m.pub && m.k === '岗位' ? '<button data-gd="see">去 Excel 看那行</button>' : ''}
          <button data-gd="up:${i}">捞到广场</button>
        </div>
      </div>`).join('');
  }

  function viewPub() {
    const left = stealLeft();
    const hid = G.pub.map((c, i) => [c, i]).filter(([c]) => !c.open);
    const opn = G.pub.map((c, i) => [c, i]).filter(([c]) => c.open);
    return `
      <div class="hd">别人的地也在这儿。今天还能偷 <b>${left}</b> 次${left <= 0 ? '　用完了，锄头另算钱' : ''}</div>
      ${hid.length ? `<div class="hd"><b>还没标的（${hid.length}）</b>　看得见有货，看不清是什么</div>` + hid.map(([c, i]) => `
        <div class="row">
          <div class="cabrow"><span class="cab"><i class="tag2">?</i></span><div class="rw">
          <div class="t"><span class="blur">${esc(c.t)}</span></div>
          <div class="m">${esc(c.by)} 种的 · ${esc(c.k)} · 他自己都还没标</div>
          </div></div>
          <div class="ops"><button class="t2" data-gd="steal:${i}">偷</button></div>
        </div>`).join('') : ''}
      ${opn.length ? `<div class="hd"><b>已经标过的（${opn.length}）</b>　带着标进的公共库</div>` + opn.map(([c, i]) => `
        <div class="row" data-mk="${c.mk || '存疑'}">
          <div class="cabrow"><span class="cab" data-mk="${c.mk || '存疑'}"><i class="tag2">${({ '真': '✓', '存疑': '?', '假': '✗' })[c.mk] || '?'}</i></span><div class="rw">
          <div class="t">${badge(c.mk || '存疑')}${esc(c.t)}</div>
          <div class="m">${esc(c.by)} 标的 · ${c.taken ? '被你偷走一份，自动打了存疑' : '已进' + (c.k === '岗位' ? '岗位表' : '资讯库')}</div>
          </div></div>
          <div class="ops"><button data-gd="pup:${i}">捞到广场</button></div>
        </div>`).join('') : ''}`;
  }

  function gdRender() {
    const p = $('#farmPanel'); if (!p) return;
    p.innerHTML =
      `<div id="gdTabs">
         <b class="${G.tab === 'grow' ? 'on' : ''}" data-gd="tab:grow">种<i>${F.ripe.length}</i></b>
         <b class="${G.tab === 'mine' ? 'on' : ''}" data-gd="tab:mine">自家<i>${G.mine.length}</i></b>
         <b class="${G.tab === 'pub' ? 'on' : ''}" data-gd="tab:pub">共同<i>${G.pub.length}</i></b>
       </div>
       <div class="gd">${G.tab === 'grow' ? viewGrow() : G.tab === 'mine' ? viewMine() : viewPub()}</div>
       <div class="note">全部脚本模拟：菜是本地随机生成的假情报，真伪标记只在这台演示机上生效。<br>
       梦蝶局教你挑别人的破绽，菜园让你给自己的话签名。同一件事，换了只手。<br>
       <span style="color:#6A6A72">「真者，精诚之至也」——《庄子 · 渔父》。真，是你愿意为它签名的程度。</span></div>`;
  }

  function gdPaint() {
    const s = $('#gdStat'); if (s) s.textContent = statText();
    F.ripe.forEach(c => {
      const bar = document.querySelector(`#farmPanel [data-ttl="${c.id}"]`);
      if (bar) bar.style.width = Math.max(0, Math.round(c.ttl / c.max * 100)) + '%';
      const num = document.querySelector(`#farmPanel [data-ttlv="${c.id}"]`);
      if (num) num.textContent = c.ttl;
      if (bar && c.ttl <= 15) { const row = bar.closest('.row'); if (row) row.classList.add('warn'); }
    });
  }

  function markCrop(i, mkv) {
    const c = F.ripe.splice(i, 1)[0]; if (!c) return;
    G.mine.unshift(Object.assign({}, c, { mk: mkv, src: '分身抓自' + c.src + ' · ' + dstamp() }));
    G.tab = 'mine'; gdRender();
    osAlert('入库了', mkv === '真'
      ? '标了真，它就跟着你的名字走了。以后别人转错，账算在你头上——这才叫情报。'
      : mkv === '存疑'
        ? '标存疑最贵：你承认自己不确定，还是把它留下来了。资讯库最缺这种。'
        : '标假也归你自己的地。留一份假的在手上，下次同样的话再来，你一眼认得出。');
  }

  function rawTake(i) {
    const c = F.ripe.splice(i, 1)[0]; if (!c) return;
    G.rot.unshift(Object.assign({}, c, { mk: '毒', why: '收的时候一个字没标' }));
    G.tab = 'grow'; gdRender();
    osAlert('这颗当场烂了',
      '不标真伪就往筐里塞，跟在群里转发一张没头没尾的截图，是同一个动作。<br>它进不了菜园、进不了资讯库、也捞不回广场，只能烂在你手里。');
  }

  function toPublic(i) {
    const m = G.mine[i]; if (!m || m.pub) return;
    if (m.mk === '假') return osAlert('共同菜园',
      '标了假还要往公共地里种？这就是谣言的完整流程。<br>想发就先改标 —— 改之前你得先有新证据。');
    m.pub = 1;
    G.pub.push(Object.assign({}, m, { by: '我', open: 1, inLib: 1 }));
    if (m.k === '岗位' && m.job) {
      JOBS.push([m.job[0], m.job[1], m.job[2],
        '共同菜园 · 我 · ' + m.mk, m.mk === '存疑' ? '待核实' : '在招']);
      buildJobs();
      gdRender();
      osAlert('岗位表长了一行',
        `它现在是 Excel 第 ${JOBS.length + 1} 行，来源列写着「共同菜园 · 我 · ${m.mk}」。<br>你的判断跟着数据一起进了表，改不掉了。`);
    } else {
      S.lib.unshift({ text: m.t + (m.mk === '存疑' ? '（存疑 · 未二次核实）' : ''),
        ind: m.ind, type: m.v, peak: 6 + ((Math.random() * 22) | 0), t: dstamp() });
      if (S.lib.length > 40) S.lib.pop();
      if (typeof libRender === 'function') libRender();
      gdRender();
      osAlert('进资讯库了', '它带着你的标进去的。下一个看到这条的人，会先看见你的判断，再看见内容。');
    }
    sync();
  }

  function doSteal(i) {
    const c = G.pub[i]; if (!c || c.open) return;
    if (stealLeft() <= 0) {
      return payDlg('买把锄头 · 偷菜次数 +3', '¥1.9',
        '每天一次是白嫖，第二次开始是手艺。<br><span class="muted">锄头当天有效，明天照样清零。</span>',
        () => { G.steal.quota = (G.steal.quota || 1) + 3; saveSteal(); gdRender(); });
    }
    G.steal.n = (G.steal.n || 0) + 1; saveSteal();
    c.open = 1; c.taken = 1; c.mk = '存疑';
    G.mine.unshift(Object.assign({}, c, { mk: '存疑', src: '偷自' + c.by + ' · ' + dstamp() }));
    G.tab = 'mine'; gdRender();
    osAlert('偷到手了',
      '自动打了「存疑」。不是系统怀疑你，是你根本没见过它的来源。<br>想改成「真」，你得自己去问一句 —— 偷来的东西，署名还是得你自己签。');
  }

  function toSurface(c) {
    mk(c.mk === '假' ? c.t + '（已被标假）' : c.t,
      c.v, 6, c.k === '岗位' ? 'job' : 'news',
      (c.by && c.by !== '我' ? c.by : '我的菜园') + ' · 标' + c.mk, c.ind);
    sync(); goFeature('home');
    osAlert('放到水面上了', '标签跟着它一起飘。谁点开都先看见「' + c.mk + '」两个字。');
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('#farmCard [data-gd]'); if (!el) return;
    const a = el.dataset.gd.split(':'), op = a[0];
    if (op === 'tab') { G.tab = a[1]; gdRender(); }
    else if (op === 'go') {
      F.running = !F.running;
      if (F.running && !F.ripe.length) plant();
      gdRender();
    }
    else if (op === 'mk') markCrop(+a[1], a[2]);
    else if (op === 'raw') rawTake(+a[1]);
    else if (op === 'toss') {
      G.rot.splice(+a[1], 1); gdRender();
      osAlert('烂筐', '扔了。烂菜唯一的用处，是提醒你当时有多急着相信。');
    }
    else if (op === 'pub') toPublic(+a[1]);
    else if (op === 'see') goFeature('jobs');
    else if (op === 'up') { const m = G.mine[+a[1]]; if (m) toSurface(m); }
    else if (op === 'pup') { const c = G.pub[+a[1]]; if (c) toSurface(c); }
    else if (op === 'steal') doSteal(+a[1]);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('#farmCard [data-gd="scope"]'); if (!el) return;
    F.scope = +el.value;
    const s = $('#gdStat'); if (s) s.textContent = '换地了。分身下一趟去' + FARM_SCOPES[F.scope] + '。';
  });

  if (F.timer) { clearInterval(F.timer); F.timer = null; }
  setInterval(() => {
    G.tk++;
    let dirty = 0, rotted = 0;
    if (F.running) {
      if (G.tk % 2 === 0) {
        const live = S.bubbles.filter(b => !b.dead);
        if (live.length && typeof blow === 'function') { blow(live[(Math.random() * live.length) | 0], 1, true); F.acted++; }
      }
      if (G.tk % 6 === 0 && F.ripe.length < 4) dirty |= plant();
    }
    if (G.tk % 11 === 0 && G.pub.filter(c => !c.open).length < 3) dirty |= plantPub();
    for (let i = F.ripe.length - 1; i >= 0; i--) {
      const c = F.ripe[i];
      if (--c.ttl > 0) continue;
      F.ripe.splice(i, 1);
      G.rot.unshift(Object.assign({}, c, { mk: '毒', why: '熟了 ' + TTL + ' 秒，没人肯说它是真是假' }));
      if (G.rot.length > 6) G.rot.pop();
      dirty = 1; rotted++;
    }
    if (dirty) gdRender(); else gdPaint();
    if (rotted && $('#winChat') && $('#winChat').classList.contains('on'))
      osAlert('烂了 ' + rotted + ' 颗', TTL + ' 秒，够你判断一条消息真不真了。你只是没打算判断。');
  }, 1000);

  farmRender = gdRender;
  farmStat = gdPaint;
  farmToggle = () => { F.running = !F.running; gdRender(); };
  harvest = rawTake;

  gdRender();
})();

/* ---------- 技能市场：第四个转化实体 ---------- */
document.addEventListener('click', e => {
  const s = e.target.closest('[data-skill]');
  if (!s) return;
  const nm = s.dataset.skill, pr = s.dataset.price || '¥29';
  const who = s.dataset.seller || '卖家', eta = s.dataset.eta || '24 小时内';
  const row = s.closest('.ski');
  payDlg(nm, pr, esc(who) + ' 接单，' + esc(eta) + '出活。平台抽一成，剩下九成当天到卖家账上。', () => {
    const sd = row && row.querySelector('[data-sold]');
    if (sd) {
      sd.dataset.sold = (+sd.dataset.sold || 0) + 1;
      sd.textContent = '已售 ' + (+sd.dataset.sold).toLocaleString();
    }
    const q = row && row.querySelector('.skq');
    if (q) {
      const u = document.createElement('i');
      u.style.background = '#C9962E';
      q.insertBefore(u, q.querySelector('em'));
      const em = q.querySelector('em');
      if (em) em.textContent = '你也排上了';
    }
    s.outerHTML = '<span class="muted">已下单 · 工单 SK-2608' + (100 + ((Math.random() * 899) | 0)) +
      ' · ' + esc(who) + '会在' + esc(eta) + '把东西发到你的收件箱</span>';
  });
});

/* ---------- 放映室迷你模式：缩到角落继续播，伪装桌面实际刷视频 ---------- */
(function tvMini() {
  const bar = document.querySelector('#tvWin .tvbar');
  if (!bar) return;
  bar.insertAdjacentHTML('beforeend', '<button id="tvMiniBtn">迷你</button>');
  $('#tvWin').insertAdjacentHTML('afterbegin', '<div class="tvminiclose" data-miniclose title="关闭"></div><div class="tvresize" title="拉伸"></div>');
  // 右下角拉伸：画面（inset:0）自动跟窗口走
  $('#tvWin .tvresize').addEventListener('mousedown', e => {
    e.stopPropagation(); e.preventDefault();
    const w = $('#tvWin'), r = w.getBoundingClientRect();
    w.style.left = r.left + 'px'; w.style.top = r.top + 'px';
    w.style.right = 'auto'; w.style.bottom = 'auto';
    const move = ev => {
      w.style.width = Math.max(160, ev.clientX - r.left + 6) + 'px';
      w.style.height = Math.max(100, ev.clientY - r.top + 6) + 'px';
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
  window.tvMiniToggle = function () {
    const w = $('#tvWin');
    if (!w.classList.contains('tvmini')) {
      w.dataset.rectMini = w.getAttribute('style');
      w.classList.add('tvmini');
      // 优先落进壁纸里的纸雕银幕：视频进画，伪装满分；没有银幕再贴角落
      const scr = $('#seaScreen');
      if (scr && scr.style.display !== 'none' && scr.offsetWidth > 60) {
        const r = scr.getBoundingClientRect();
        w.dataset.dock = 'screen';
        w.setAttribute('style', 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;right:auto;bottom:auto;z-index:2');
        if (typeof osToast === 'function') osToast('视频住进了海底影院 · 双击退出，拖走随意');
      } else {
        delete w.dataset.dock;
        w.setAttribute('style', 'right:300px;bottom:54px;left:auto;top:auto;width:260px;height:170px;z-index:' + (++osZ));
      }
    } else {
      w.classList.remove('tvmini');
      delete w.dataset.dock;
      if (w.dataset.rectMini) { w.setAttribute('style', w.dataset.rectMini); delete w.dataset.rectMini; }
      w.style.zIndex = ++osZ;
    }
  };
  // 窗口缩放时，停靠在银幕上的迷你窗跟着银幕走
  addEventListener('resize', () => {
    const w = $('#tvWin'), scr = $('#seaScreen');
    if (!w || w.dataset.dock !== 'screen' || !w.classList.contains('tvmini') || !scr) return;
    const r = scr.getBoundingClientRect();
    w.style.left = r.left + 'px'; w.style.top = r.top + 'px';
    w.style.width = r.width + 'px'; w.style.height = r.height + 'px';
  });
  $('#tvMiniBtn').addEventListener('click', tvMiniToggle);
  document.addEventListener('dblclick', e => {
    const win = e.target.closest('.dwin.tvmini');
    if (win && win.id === 'tvWin' && !e.target.closest('[data-miniclose]')) tvMiniToggle();
  });
})();

/* ---------- 轻量 toast：右下角滑入，可点跳转，不打断 ---------- */
document.body.insertAdjacentHTML('beforeend', '<div id="osToast"></div>');
function osToast(txt, go) {
  if (document.body.classList.contains('notoast')) return;
  const t = document.createElement('div');
  t.className = 'ot';
  t.textContent = txt;
  if (go) { t.dataset.go = go; t.classList.add('lk'); }
  $('#osToast').appendChild(t);
  setTimeout(() => t.classList.add('on'), 20);
  setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); }, 5000);
  if (go) {
    const a = document.querySelector('#osbar .app[data-go="' + go + '"]');
    if (a) { a.classList.add('blink'); setTimeout(() => a.classList.remove('blink'), 1800); }
  }
}
$('#osToast').addEventListener('click', e => {
  const t = e.target.closest('.ot[data-go]');
  if (t) { goFeature(t.dataset.go); t.remove(); }
});

/* ---------- 监视器 ↔ 水面互指：选中行或点结束任务，把那颗泡圈出来 ---------- */
function locateBub(b) {
  if (!b || !b.el) return;
  const w = $('#winTask') && $('#winTask').getBoundingClientRect();
  if (w) { b.x = Math.max(20, w.left - b.r * 2 - 40); b.y = Math.max(20, w.top + 60); b.vx = 0; b.vy = 0; }
  b.el.classList.add('locate');
  setTimeout(() => b.el.classList.remove('locate'), 4000);
}

/* ---------- 个人中心：伪装成工资条 PDF ----------
   「每个人都该找到自己的价值」的实体：你在这个社区的价值总账。 */
const bMe = mkWin('winMe', 'plain', '工资条_2026-08.pdf - PDF 查看器', 'left:380px;top:60px;width:560px;height:600px');
function buildMe() {
  const alias = ($('#alias') && $('#alias').textContent) || '—';
  const tag = ($('#aliasTag') && $('#aliasTag').textContent) || '';
  const mine = S.bubbles.filter(b => !b.dead && (b.manHeat || 0) > 0).length;
  const acted = (typeof F !== 'undefined' && F.acted) || 47;
  const ripe = (typeof F !== 'undefined' && F.ripe && F.ripe.length) || 0;
  bMe.innerHTML =
    '<div class="mepdf">' +
    '<div class="meh"><b>薪 资 明 细 单</b><span>2026 年 08 月 · 变大泡泡结算中心</span></div>' +
    '<div class="mei">收款人：<b>' + esc(alias) + '</b><span class="tagn">' + esc(tag) + '</span>　·　马甲信誉 <b>' + (S.rep == null ? 100 : S.rep) + '</b></div>' +
    '<table class="metab"><tr><th>收入项</th><th>说明</th><th class="n">金额</th></tr>' +
    '<tr><td>咨询分成</td><td>14 单（机器人 9 / 真人 5），社区抽两成后</td><td class="n">¥3,348.80</td></tr>' +
    '<tr><td>技能订单</td><td>Excel 函数急救 等 3 项在架</td><td class="n">¥261.00</td></tr>' +
    '<tr><td>内容解锁分成</td><td>长文 ¥9.9 × 七成归作者</td><td class="n">¥146.30</td></tr>' +
    '<tr><td>打赏</td><td>金句 / 集市点子，九成归你</td><td class="n">¥38.70</td></tr>' +
    '<tr class="sum"><td>合计</td><td>演示数据 · 未接入真实支付</td><td class="n">¥3,794.80</td></tr></table>' +
    '<table class="metab"><tr><th>产出项</th><th></th><th class="n">数量</th></tr>' +
    '<tr><td>吹气</td><td>替别人的话说了一句</td><td class="n">' + Math.round(S.blows) + '</td></tr>' +
    '<tr><td>在场泡泡</td><td>你吹过的还浮着的</td><td class="n">' + mine + '</td></tr>' +
    '<tr><td>分身互动</td><td>它替你干的</td><td class="n">' + acted + '</td></tr>' +
    '<tr><td>待收情报</td><td>地里熟了没标的</td><td class="n">' + ripe + '</td></tr></table>' +
    '<div class="mez"><span class="zq">「人皆知有用之用，而莫知无用之用也」——《庄子 · 人间世》</span>' +
    '<span class="zh">这张工资条上的每一项，都是公司那张量不到的。</span></div>' +
    '<div class="mef">本单为演示数据 · 两级命名：抓取信息标真实来源，用户爆料一律化名</div></div>';
}
buildMe();

/* ---------- 产品介绍 PPT（评委版）：纸雕分镜 + 真实底稿 ---------- */
const PITCH = [
  { img: 'pitch/D9.jpg', tag: '变大泡泡 · 产品叙', t: '变大泡泡', cover: 1,
    b: ['一个做给打工人的地方，藏在一台假 Windows 里', '子非鱼，安知鱼之乐'],
    n: '开场白：在假 Windows 里，用假 PowerPoint，讲一个真产品。' },
  { img: 'pitch/E1.jpg', tag: '壹 · 井', t: '我们都上过这样的班',
    b: ['会的东西比岗位说明书多，被看见的只有周报那三行', '不是不想发光，是考核表上没有那一格', '做这个产品不是教人偷懒——是想让被浪费的那部分，有地方去'],
    n: '庄子笑井蛙不可语海。我们不笑，我们就是那只蛙——所以想给井里的人修一条到海的路。' },
  { img: 'pitch/P1-desktop.jpg', tag: '贰 · 壳', t: '为什么要做成假 Windows？',
    b: ['因为白天说真话，需要一层壳', 'Word、Excel、钉钉，像素级仿真，经得起老板从身后走过', '这层看起来最没用的伪装，是所有功能的地基'],
    n: '庄子讲无用之用。这台假电脑就是无用之用——诸位现在看到的，就是它本身。' },
  { img: 'pitch/P2-bosskey.jpg', tag: '叁 · 键', t: '老板键，不是心虚，是边界',
    b: ['Ctrl + 空格：一秒回到办公，上班演好上班', '一键述职：井下的收获，也能写进汇报里', '先有安全感，人才敢说真话'],
    n: '庖丁的刀用了十九年，刃如新发——因为他只走缝隙。老板键就是那道缝隙。' },
  { img: 'pitch/E2.jpg', tag: '肆 · 水面', t: '先让人玩起来，再谈别的',
    b: ['上层是游戏、放映、拼豆——进来先图个乐', '下层是情报、技能、薪资、分身——留下是因为有用', '围观 → 参与 → 签名 → 交易，不催，等人自己往深处走'],
    n: '鲦鱼出游从容，是鱼之乐也。先有乐，才有一切。' },
  { img: 'pitch/B2.jpg', tag: '伍 · 梦蝶', t: '把你正在经历的困境，做成一局游戏',
    b: ['四个 AI 演一局身份局，人心的破绽逐轮显形', '你在局外看得清清楚楚——因为局里演的就是你的处境', '在梦里栽跟头，醒来就免疫'],
    n: '不知周之梦为胡蝶与，胡蝶之梦为周与。梦蝶局的名字，就从这里来。' },
  { img: 'pitch/B3-txt.jpg', tag: '陆 · 真言', t: '匿名让人敢说，签名让话可信',
    b: ['情报分三级：真、存疑、假——条条有人担保', '说错了掉信誉：化名保护人，签名保护真', '办公室里没人负责的话，在这里字字有主'],
    n: '《渔父》里说：真者，精诚之至也；不精不诚，不能动人。这里的规矩只有一条——话要真。' },
  { img: 'pitch/P4-skill.jpg', tag: '柒 · 集市', t: '你那些「没用」的本事，在这里有用',
    b: ['卖技能、卖工具、发悬赏', '考核表量不到的能力，市场量得到'],
    n: '人皆知有用之用，而莫知无用之用。集市干的就是这件事：给无用之用标个价。' },
  { img: 'pitch/C1-txt.jpg', tag: '捌 · 对表', t: '谈薪那一刻的孤独，我们都经历过',
    b: ['同岗薪资，三个同行签名互保，对出真实行情', '信息差是职场最重的一道税——这里退税'],
    n: '相濡以沫，不如相忘于江湖。可要先相濡以沫过，才有力气游向江湖。' },
  { img: 'pitch/A3.jpg', tag: '玖 · 分身', t: '你睡着了，分身替你醒着',
    b: ['人格 DNA、框架库、禁区——三样东西，教出一个像你的分身', '它替你接单回答，收益归你'],
    n: '分身是蝶还是周，不必辩。单子是真的，就好。' },
  { img: 'pitch/A4-txt.jpg', tag: '拾 · 见证', t: '量尺已经造好',
    b: ['转化漏斗看板：围观 → 参与 → 签名 → 交易，实时可查', '演示环境以模拟数据运行，未接入真实支付——这句也是真话', '先把量尺做好，等真实用户来刻度'],
    n: '真诚也包括不夸大：数据是演示的，漏斗是真的。' },
  { img: 'pitch/P3-truefake.jpg', tag: '拾壹 · 倒影', t: '究竟哪一边，是真的？',
    b: ['办公室是真的，人人在演', '这里是假的——本事换到真钱，真话得到签名'],
    n: '真地方演假戏，假地方来真的。全篇题眼，请放慢。' },
  { img: 'pitch/E3.jpg', tag: '终 · 梦醒', t: '梦醒了，手里的东西还在',
    b: ['子非鱼，安知鱼之乐', '请按 Ctrl + 空格，亲手试一次老板键'],
    n: '到底哪一边才是梦？停一拍，不必作答。' }
];
const bPw = mkWin('winPitch', 'ppt', '变大泡泡·产品介绍.pptx - PowerPoint', 'left:200px;top:50px;width:960px;height:620px');
bPw.parentNode.querySelector('.dwh').insertAdjacentHTML('afterend',
  '<div class="dwt"><button id="pwPlay" class="rbtn pri">从头开始放映</button><button id="pwPlayCur" class="rbtn">从当前幻灯片</button><span class="sp" id="pwCnt">幻灯片 1/' + PITCH.length + '　中文(中国)</span></div>');
bPw.innerHTML =
  '<div id="pwRail">' + PITCH.map((s, i) =>
    '<div class="pws' + (i ? '' : ' on') + '" data-i="' + i + '"><i>' + (i + 1) + '</i><div class="im"><img src="' + s.img + '" alt=""></div></div>').join('') + '</div>' +
  '<div id="pwCanvas"><div id="pwPage"><img id="pwImg" src="' + PITCH[0].img + '" alt=""><span id="pwNum"></span><div id="pwPanel"></div></div></div>' +
  '<div id="pwNotes"><div class="nt">备注</div><div class="nb" id="pwNote"></div></div>';
bPw.parentNode.insertAdjacentHTML('beforeend',
  '<div class="dwf"><span id="pwPg">幻灯片 1/' + PITCH.length + '</span>　中文(中国)　辅助功能：一切就绪' +
  '<span class="zoom">备注　▭ ▤ 豆<i></i>62%　<b style="cursor:pointer" id="pwFit">⛶</b></span></div>');
let pwI = 0;
function pwGo(i) {
  pwI = (i + PITCH.length) % PITCH.length;
  const s = PITCH[pwI];
  const im = $('#pwImg');
  if (im.src.indexOf(s.img) < 0) {
    im.style.opacity = 0;
    im.onload = () => { im.style.opacity = 1; };
    im.src = s.img;
    if (im.complete) im.style.opacity = 1;
  }
  const p = $('#pwPanel');
  p.innerHTML = '<div class="tg">' + s.tag + '</div><h3>' + s.t + '</h3>' + s.b.map(x => '<li>' + x + '</li>').join('');
  p.classList.remove('anim'); void p.offsetWidth; p.classList.add('anim');
  $('#pwNum').textContent = (pwI + 1) + ' / ' + PITCH.length;
  $('#pwNote').textContent = s.n || '';
  const c = '幻灯片 ' + (pwI + 1) + '/' + PITCH.length;
  $('#pwCnt').textContent = c + '　中文(中国)';
  $('#pwPg').textContent = c;
  $('#winPitch').classList.toggle('cover', !!s.cover);
  $$('#pwRail .pws').forEach(x => x.classList.toggle('on', +x.dataset.i === pwI));
  const el = document.querySelector('#pwRail .pws.on');
  if (el) el.scrollIntoView({ block: 'nearest' });
}
pwGo(0);
$('#pwRail').addEventListener('click', e => { const s = e.target.closest('.pws'); if (s) pwGo(+s.dataset.i); });
$('#pwPage').addEventListener('click', e => {
  if (!$('#winPitch').classList.contains('play')) return;   // 编辑视图不翻页，和真 PPT 一致
  pwGo(pwI + (e.offsetX < e.currentTarget.clientWidth / 3 ? -1 : 1));
});
$('#pwPlay').addEventListener('click', () => { pwGo(0); $('#winPitch').classList.add('play'); });
$('#pwPlayCur').addEventListener('click', () => $('#winPitch').classList.add('play'));
$('#pwFit').addEventListener('click', () => $('#winPitch').classList.add('play'));
document.addEventListener('keydown', e => {
  const w = $('#winPitch');
  if (!w || !w.classList.contains('on') || w.classList.contains('min')) return;
  if (e.target.matches('input,textarea,[contenteditable]')) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { pwGo(pwI + 1); e.preventDefault(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { pwGo(pwI - 1); e.preventDefault(); }
  else if (e.key === 'F5') { pwGo(0); w.classList.add('play'); e.preventDefault(); }
  else if (e.key === 'Escape') w.classList.remove('play');
});

/* ---------- 客厅电视：黑屏即播放入口，点一下放宣传片 ---------- */
function tvPlayPromo() {
  const scr = $('#tvScr');
  if (!scr || scr.querySelector('video, iframe, img')) return;
  if (typeof stopFilm === 'function') stopFilm();
  scr.innerHTML = '';
  const v = document.createElement('video');
  v.controls = true; v.autoplay = true;
  v.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000';
  v.onerror = () => { if (typeof playFilm === 'function') playFilm(); };
  v.onloadeddata = () => { if (typeof tvTitle === 'function') tvTitle('产品宣传片'); };
  v.src = 'media/宣传片.mp4';
  scr.appendChild(v);
}
$('#tvScr').addEventListener('click', e => { if (!e.target.closest('video')) tvPlayPromo(); });

/* ---------- 封面互动：井底吹泡泡 ----------
   打的字变成泡泡从井底飘上去；点空白处冒小泡；鼠标动画面视差。
   进场时把吹过的话真正 mk 成水面泡泡 —— 封面不是海报，是玩法第一课。 */
(function coverPlay() {
  const sp = $('#splash');
  if (!sp || sp.classList.contains('off')) return;
  const texts = [];
  const HINTS = ['这句话，工位上敢说吗？', '在这里，真话是要签名的', '飘出井口，就有人接住了', '再吹一颗，水面正热闹'];
  function rise(x, y, txt) {
    const d = Math.max(46, Math.min(120, (txt ? txt.length : 0) * 9 + 40));
    const b = document.createElement('div');
    b.className = 'spbub' + (txt ? ' mine' : '');
    b.style.cssText = 'left:' + (x - d / 2) + 'px;top:' + (y - d / 2) + 'px;width:' + d + 'px;height:' + d + 'px';
    if (txt) b.textContent = txt;
    sp.appendChild(b);
    const drift = (Math.random() - .5) * 150;
    const topY = 70 + Math.random() * innerHeight * .14;
    const up = Math.max(80, y - topY);
    const baseT = 'translate(' + drift + 'px,' + (-up) + 'px)';
    let bobA = null, warnT = null, sinkT = null, state = 'rising';
    // 浮力感：出手快，到顶前减速
    const riseA = b.animate([
      { transform: 'translate(0,0) scale(.5)', opacity: 0 },
      { transform: 'translate(' + drift * .45 + 'px,' + (-up * .6) + 'px) scale(1.04)', opacity: 1, offset: .42 },
      { transform: baseT + ' scale(1)', opacity: 1 }
    ], { duration: 2200 + up * 2.2, easing: 'cubic-bezier(.17,.62,.3,1)', fill: 'forwards' });
    riseA.onfinish = () => { if (state !== 'rising') return; state = 'floating'; bob(); linger(); };
    function bob() {
      bobA = b.animate([
        { transform: baseT + ' translateY(0)' },
        { transform: baseT + ' translateY(-9px)' },
        { transform: baseT + ' translateY(0)' }
      ], { duration: 2400, iterations: Infinity, easing: 'ease-in-out' });
    }
    function linger() {
      const stay = txt ? d * 70 : d * 26;   // 越大的泡，飘得越久
      warnT = setTimeout(() => {
        if (state !== 'floating') return;
        state = 'warning';
        b.classList.add('warn');
        if (txt) hint.textContent = '没人接住，这颗泡泡快沉底了…';
        sinkT = setTimeout(sink, 1500);
      }, stay);
    }
    function sink() {
      state = 'sinking';
      b.classList.remove('warn');
      if (bobA) bobA.cancel();
      // 重力感：起初慢，越沉越快
      const down = innerHeight - topY + d;
      b.animate([
        { transform: baseT + ' scale(1)', opacity: 1 },
        { transform: 'translate(' + (drift * 1.25) + 'px,' + (down - up) + 'px) scale(.9)', opacity: .15 }
      ], { duration: 3800 + d * 18, easing: 'cubic-bezier(.5,.04,.74,.32)', fill: 'forwards' })
        .onfinish = () => b.remove();
      if (txt) hint.textContent = '沉底了。井里的泡泡，有人接才飘得久';
    }
    if (txt) b.addEventListener('click', e => {
      e.stopPropagation();
      // 接一把：无论在飘还是在沉，都托回去重新计时
      b.getAnimations().forEach(a => a.cancel());
      if (warnT) clearTimeout(warnT); if (sinkT) clearTimeout(sinkT);
      b.classList.remove('warn');
      state = 'floating';
      b.animate([
        { transform: baseT + ' translateY(26px) scale(.96)', opacity: .85 },
        { transform: baseT + ' translateY(-14px) scale(1.06)', offset: .6 },
        { transform: baseT + ' scale(1)', opacity: 1 }
      ], { duration: 900, easing: 'cubic-bezier(.2,.9,.35,1.3)', fill: 'forwards' }).onfinish = bob;
      linger();
      hint.textContent = '接住了，又能多飘一会儿';
    });
  }
  const inp = $('#spIn'), blow = $('#spBlow'), go = $('#splashGo'), hint = $('#spHint');
  function blowGo() {
    const t = inp.value.trim();
    if (!t) { inp.focus(); hint.textContent = '先写一句真话，再吹'; return; }
    texts.push(t);
    const r = inp.getBoundingClientRect();
    rise(r.left + r.width / 2, r.top, t);
    inp.value = '';
    hint.textContent = HINTS[Math.min(texts.length - 1, HINTS.length - 1)];
    go.textContent = '带着 ' + texts.length + ' 颗真话去上班';
  }
  blow.addEventListener('click', blowGo);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); blowGo(); } });
  sp.addEventListener('click', e => {
    if (e.target.closest('input,button')) return;
    rise(e.clientX, e.clientY, '');
  });
  sp.addEventListener('mousemove', e => {
    const dx = e.clientX / innerWidth - .5, dy = e.clientY / innerHeight - .5;
    sp.querySelector('.spbg').style.transform = 'translate(' + (-dx * 16) + 'px,' + (-dy * 10) + 'px)';
  });
  go.addEventListener('click', () => {
    if (typeof mk === 'function') texts.forEach(t => { try { mk(t, 'fun', 7); } catch (err) {} });
    if (typeof sync === 'function') { try { sync(); } catch (err) {} }
  });
})();


/* ---------- 放映提示：视频一开播就告诉人怎么边看边摸鱼 ---------- */
(function tvMiniHint() {
  const w = $('#tvWin');
  if (!w) return;
  w.insertAdjacentHTML('beforeend', '<div id="tvHint">看片不耽误上班：点 <b>迷你</b>，视频会缩进壁纸里的小银幕——完美伪装</div>');
  const hint = $('#tvHint');
  let hideT = null;
  new MutationObserver(() => {
    if (!w.classList.contains('on') || w.classList.contains('tvmini')) return;
    if (!$('#tvScr').querySelector('video, iframe')) return;
    hint.classList.add('on');
    clearTimeout(hideT);
    hideT = setTimeout(() => hint.classList.remove('on'), 7000);
  }).observe($('#tvScr'), { childList: true });
})();

/* ---------- 「我不满意」便签：桌面级小开关，给嫌吵的人一个台阶 ---------- */
(function dNote() {
  let SET = {};
  try { SET = JSON.parse(localStorage.getItem('ppSet') || '{}'); } catch (e) {}
  function save() { try { localStorage.setItem('ppSet', JSON.stringify(SET)); } catch (e) {} }
  document.body.insertAdjacentHTML('beforeend',
    '<div id="dNote"><div class="tab">我不满意</div><div class="pad">' +
    '<h5>不满意？调到顺眼为止</h5>' +
    '<div class="row" style="border-top:0"><span>关掉泡泡</span><i class="sw" data-k="nobub"></i></div>' +
    '<div class="row"><span>泡泡文字颜色</span><input type="color" id="dInk" value="#F4FAFF"></div>' +
    '<div class="row"><span>关掉桌面弹窗</span><i class="sw" data-k="notoast"></i></div>' +
    '<div class="row"><span>换个屏保</span><button id="dWall" class="rbtn" style="padding:2px 10px;font-size:11px">海底影院</button></div>' +
    '<div class="row"><span>迷你窗边框</span><input type="color" id="dMbd" value="#D8A94E"></div>' +
    '<div class="foot">改完还不满意？井底见——那就是产品要改了</div></div></div>');
  const note = $('#dNote');
  const WALLS = [
    ['海底影院', 'assets/bg-desk-cinema.webp'],
    ['纸雕海面', 'assets/bg-desk.webp'],
    ['暖光客厅', 'assets/bg-cinema.webp'],
    ['经典深蓝', 'assets/bg-normal.webp']
  ];
  function apply() {
    document.body.classList.toggle('nobub', !!SET.nobub);
    document.body.classList.toggle('notoast', !!SET.notoast);
    if (SET.ink) { document.documentElement.style.setProperty('--bubink', SET.ink); $('#dInk').value = SET.ink; }
    if (SET.mbd) { document.documentElement.style.setProperty('--minibd', SET.mbd); $('#dMbd').value = SET.mbd; }
    const w = WALLS[SET.wall || 0];
    document.body.style.backgroundImage = 'url(' + w[1] + ')';
    $('#dWall').textContent = w[0];
    const scr = $('#seaScreen');
    if (scr) scr.style.display = (SET.wall || 0) === 0 ? '' : 'none';   // 银幕热区只在影院屏保上
    note.querySelectorAll('.sw').forEach(s => s.classList.toggle('on', !!SET[s.dataset.k]));
  }
  setTimeout(apply, 0);   // 等 seaScreen 建好再套一遍
  note.querySelector('.tab').addEventListener('click', () => note.classList.toggle('open'));
  note.addEventListener('click', e => {
    const s = e.target.closest('.sw'); if (!s) return;
    SET[s.dataset.k] = !SET[s.dataset.k]; save(); apply();
  });
  $('#dWall').addEventListener('click', () => { SET.wall = ((SET.wall || 0) + 1) % WALLS.length; save(); apply(); });
  $('#dMbd').addEventListener('input', e => { SET.mbd = e.target.value; save(); apply(); });
  $('#dInk').addEventListener('input', e => { SET.ink = e.target.value; save(); apply(); });
  document.addEventListener('click', e => { if (!e.target.closest('#dNote')) note.classList.remove('open'); });
})();
/* ---------- 封面八卦泡：按 B 吹一口，一群瓜浮起来，大的活得久 ---------- */
(function coverGossip() {
  const sp = $('#splash');
  if (!sp || sp.classList.contains('off')) return;
  const GOSSIP = [
    '隔壁组年终系数被砍了', '新总监第一天改了架构', '楼下咖啡店老板娘说涨价',
    '据说 HR 在拉离职名单', '那个项目黄了，没人敢说', '工位排名下周重排',
    '食堂周三的鱼别吃', '有人偷偷涨了 30%', '茶水间的瓜比会议室的真',
    '年会取消了，预算挪去团建', '打卡机换了带人脸的', '实习生转正名额只有一个'
  ];
  let eaten = 0, idx = 0;
  sp.insertAdjacentHTML('beforeend',
    '<div id="gosKey"><b>B</b>吹一口八卦</div>');
  function pop(b) {
    b.style.pointerEvents = 'none';
    const r = b.getBoundingClientRect();
    b.getAnimations().forEach(a => a.cancel());
    b.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }],
      { duration: 320, easing: 'ease-out' }).onfinish = () => b.remove();
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('div');
      s.className = 'spbub';
      const d = 8 + Math.random() * 12;
      s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px';
      sp.appendChild(s);
      s.animate([
        { transform: 'translate(0,0)', opacity: .9 },
        { transform: 'translate(' + ((Math.random() - .5) * 130) + 'px,' + (-40 - Math.random() * 90) + 'px)', opacity: 0 }
      ], { duration: 700 + Math.random() * 500, easing: 'ease-out' }).onfinish = () => s.remove();
    }
    eaten++;
    const h = $('#spHint');
    if (h) h.textContent = '吃到 ' + eaten + ' 个瓜 · 井里的瓜比这新鲜';
  }
  function gos(delay) {
    const t = GOSSIP[idx++ % GOSSIP.length];
    const d = Math.max(80, Math.min(132, t.length * 10 + 34)) + Math.random() * 14;
    const b = document.createElement('div');
    b.className = 'spbub gos';
    const x = 30 + Math.random() * (innerWidth - d - 60);
    const y0 = innerHeight - 60;
    b.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + x + 'px;top:' + (y0 - d / 2) + 'px;opacity:0';
    b.innerHTML = '<span><em>八卦</em>' + t + '</span>';
    b.addEventListener('click', e => { e.stopPropagation(); pop(b); });
    sp.appendChild(b);
    const drift = (Math.random() - .5) * 180;
    const topY = 70 + Math.random() * innerHeight * .3;
    const up = y0 - topY;
    const baseT = 'translate(' + drift + 'px,' + (-up) + 'px)';
    let bobA = null;
    setTimeout(() => {
      // 浮：快起步，到顶前减速
      b.animate([
        { transform: 'translate(0,0) scale(.5)', opacity: 0 },
        { transform: 'translate(' + drift * .45 + 'px,' + (-up * .6) + 'px) scale(1.03)', opacity: 1, offset: .42 },
        { transform: baseT + ' scale(1)', opacity: 1 }
      ], { duration: 2400 + up * 2, easing: 'cubic-bezier(.17,.62,.3,1)', fill: 'forwards' }).onfinish = () => {
        if (!b.isConnected) return;
        bobA = b.animate([
          { transform: baseT + ' translateY(0)' }, { transform: baseT + ' translateY(-9px)' }, { transform: baseT + ' translateY(0)' }
        ], { duration: 2600, iterations: Infinity, easing: 'ease-in-out' });
        // 悬停时长 ∝ 泡径：大瓜活得久
        setTimeout(() => {
          if (!b.isConnected) return;
          if (bobA) bobA.cancel();
          b.style.pointerEvents = 'none';
          // 沉：起初慢，越沉越快
          b.animate([
            { transform: baseT + ' scale(1)', opacity: 1 },
            { transform: 'translate(' + drift * 1.25 + 'px,' + (innerHeight - topY) + 'px) scale(.9)', opacity: .12 }
          ], { duration: 4200 + d * 16, easing: 'cubic-bezier(.5,.04,.74,.32)', fill: 'forwards' }).onfinish = () => b.remove();
        }, d * 62);
      };
    }, delay);
  }
  function blowAll() {
    if (sp.classList.contains('off')) return;
    const n = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) gos(i * 240);
    const h = $('#spHint');
    if (h) h.textContent = '一口气 ' + n + ' 个瓜 · 大的飘得久，点一下能吃';
  }
  document.addEventListener('keydown', e => {
    if (sp.classList.contains('off')) return;
    if (e.target.matches('input,textarea')) return;
    if (e.key === 'b' || e.key === 'B') { e.preventDefault(); blowAll(); }
  });
  $('#gosKey').addEventListener('click', blowAll);
  setTimeout(() => { gos(0); gos(500); }, 1800);   // 开场先飘两颗当引子
})();

/* ---------- 海底影院：壁纸银幕对位成可点热区，点了就放片 ---------- */
(function seaScreen() {
  const IMG = { w: 1536, h: 1024, x: 715, y: 405, sw: 500, sh: 340 };   // 银幕白区在原图里的像素框
  const el = document.createElement('div');
  el.id = 'seaScreen';
  el.title = '海底影院';
  el.innerHTML = '<span>▶ 放映</span>';
  document.body.appendChild(el);
  function fit() {
    const s = Math.max(innerWidth / IMG.w, innerHeight / IMG.h);   // 和 background cover 同一套缩放
    const ox = (innerWidth - IMG.w * s) / 2, oy = (innerHeight - IMG.h * s) / 2;
    el.style.left = (ox + IMG.x * s) + 'px';
    el.style.top = (oy + IMG.y * s) + 'px';
    el.style.width = (IMG.sw * s) + 'px';
    el.style.height = (IMG.sh * s) + 'px';
  }
  fit();
  addEventListener('resize', fit);
  el.addEventListener('click', () => {
    const f = $('#deskFilm');
    if (f) f.click(); else goFeature('desk');
  });
})();

/* ============================================================
   AI 一键述职 —— 空白 Word + 风格/细节可选
   数据源是你今天真实的摸鱼痕迹（吹气/泡泡/分身代答/拼豆格子），
   AI 把它们翻译成正经工作汇报；没配 key 或超额就走脚本降级，
   页脚如实标注是模型写的还是脚本装的。
   ============================================================ */
(function rptGen() {
  const btn = $('#rptGo');
  if (!btn) return;

  const STYLES = {
    steady: { nm: '汇报腔', sys: '语气四平八稳，多用"持续推进、按节点完成、整体可控"，每段至少给一个具体数字或百分比。' },
    jargon: { nm: '大厂黑话', sys: '大量使用赋能、抓手、闭环、对齐、颗粒度、组合拳、心智等黑话，句式浮夸但逻辑自洽。' },
    plain:  { nm: '朴实无华', sys: '大白话，短句，不吹不藏，像跟熟人交代今天干了啥，但依然像一份能交差的日报。' },
    blame:  { nm: '甩锅文学', sys: '每件推进不顺的事都有一个体面的外部原因：上游没给、评审延期、跨部门依赖，语气无辜且专业。' }
  };
  const LEVELS = {
    s: { nm: '三句话', hint: '全文正好 3 句话，约 80 字，一段', paras: 1, per: 3 },
    m: { nm: '半页',   hint: '两段，约 200 字', paras: 2, per: 3 },
    l: { nm: '一整页', hint: '三到四段，约 350 字，最后一段是下一步计划', paras: 3, per: 3 }
  };

  // 今天真实发生的事：能读到状态就用状态，读不到用兜底值
  function todayFacts() {
    const duty = +((document.querySelector('#dutyN') || {}).textContent || 0);
    const drawn = $$('#sheet .cell').filter(c => c.style.background).length;
    return {
      blows: S.blows || 0, bubs: S.bubbles.length, duty: duty || 3,
      drawn: drawn, sal: (typeof SALARY !== 'undefined' ? SALARY.length : 10),
      lib: (S.lib && S.lib.length) || 4
    };
  }

  // 脚本降级：四种风格各一套句库，素材数字是真的
  function scriptDraft(styleKey, f) {
    const B = {
      steady: [
        `本日完成跨部门信息同步 ${f.blows + 12} 次，重点议题跟进 ${f.bubs} 项，整体节奏可控。`,
        `智能助理代理常规答复 ${f.duty} 条，响应时效保持在分钟级，无升级事件。`,
        f.drawn ? `数据可视化面板新增有效填充 ${f.drawn} 处，按既定节点推进。` : `数据可视化面板完成框架预研，下周期进入填充阶段。`,
        `完成外部薪酬对标调研 ${f.sal} 家，关键数据已交叉验证。`,
        `沉淀参考材料 ${f.lib} 份，均已归档并同步至知识库。`,
        `参加线上培训 1 场，全程无异常离席记录。`,
        `次日计划：延续本日节奏，优先收口对标调研遗留项，风险可控。`
      ],
      jargon: [
        `今日以信息流为抓手，完成 ${f.blows + 12} 次跨域对齐，${f.bubs} 个议题形成心智占位。`,
        `AI 分身矩阵持续赋能，代答 ${f.duty} 条，人效杠杆进一步放大。`,
        `可视化大盘打出组合拳，${f.drawn || 20} 个颗粒度单元完成像素级落地。`,
        `拉通 ${f.sal} 家竞对薪酬数据，对标颗粒度下钻到 offer 级，形成认知闭环。`,
        `${f.lib} 份行业洞察完成结构化沉淀，反哺内容飞轮。`,
        `午后完成一场沉浸式培训心智补齐，链路完整。`,
        `明日主线：围绕北极星指标持续深耕，把今天的势能转化为动能。`
      ],
      plain: [
        `今天在群里聊了 ${f.blows + 12} 次，有 ${f.bubs} 个话题值得记下来。`,
        `机器人替我回了 ${f.duty} 条消息，都是不用动脑的那种。`,
        f.drawn ? `表格里那个图又填了 ${f.drawn} 格，快成型了。` : `表格里那个图起了个头。`,
        `查了 ${f.sal} 家公司的工资，心里有数了。`,
        `存了 ${f.lib} 份资料，回头用得上。`,
        `下午看了个培训视频，讲得一般，但看完了。`,
        `明天接着干，没什么大事。`
      ],
      blame: [
        `跨部门同步推进 ${f.blows + 12} 次，因上游口径反复调整，部分结论仍待对方确认。`,
        `${f.bubs} 个议题中有 ${Math.max(1, f.bubs - 2)} 个受评审排期延后影响，已留痕。`,
        `智能助理代答 ${f.duty} 条，剩余积压系权限未开通所致，非本人可控。`,
        `可视化面板依赖的数据接口至今未交付，本人已先行完成 ${f.drawn || 20} 处静态填充以对冲风险。`,
        `对标调研覆盖 ${f.sal} 家，个别公司数据缺失系对方信息披露不全。`,
        `培训一场按要求完成，纪要模板是旧版的，建议流程侧优化。`,
        `以上风险点均已提前同步相关方，邮件可查。`
      ]
    }[styleKey];
    return B;
  }

  function asParas(lines, lv) {
    const need = Math.min(lines.length, lv.paras * lv.per);
    const use = lines.slice(0, need);
    const out = [];
    for (let i = 0; i < use.length; i += lv.per) out.push(use.slice(i, i + lv.per).join(''));
    return out;
  }

  // 打字机：一次 2-3 字，光标跟着跑，字数在页脚实时涨
  let rptToken = 0;
  function typeParas(paras, meta) {
    const my = ++rptToken;
    const body = $('#rptBody');
    const caret = $('#wcaret');
    body.innerHTML = '';
    const d = new Date();
    const head = document.createElement('div');
    head.className = 'rpth';
    head.textContent = `${d.getMonth() + 1} 月 ${d.getDate()} 日 工作日报`;
    body.appendChild(head);

    let pi = 0;
    (function nextPara() {
      if (my !== rptToken) return;
      if (pi >= paras.length) {
        body.insertAdjacentHTML('beforeend', `<div class="rptmeta">${meta}</div>`);
        if (caret) body.appendChild(caret);
        $('#rptState').textContent = '写完了。改都不用改。';
        btn.disabled = false;
        setTimeout(() => {
          if (my !== rptToken) return;
          const cl = $('#cmtLive');
          if (cl) cl.innerHTML = `<div class="cmt"><div class="who"><b>王总</b> · 刚刚</div>${
            { steady: '数字有了，比上次强。', jargon: '黑话浓度可以，董事会上收着点用。',
              plain: '就这么写，别改了。', blame: '锅甩得很圆，下次留一口自己背。' }[$('#rptStyle').value]
          }</div>`;
        }, 1400);
        return;
      }
      const p = document.createElement('p');
      p.className = 'rptp';
      body.appendChild(p);
      if (caret) body.appendChild(caret);
      const txt = paras[pi++];
      let ci = 0;
      const iv = setInterval(() => {
        if (my !== rptToken) return clearInterval(iv);
        ci += 2 + (Math.random() < .4 ? 1 : 0);
        p.textContent = txt.slice(0, ci);
        S.words += 2;
        const wcE = $('#wc'); if (wcE) wcE.textContent = S.words.toLocaleString();
        p.scrollIntoView({ block: 'nearest' });
        if (ci >= txt.length) { clearInterval(iv); setTimeout(nextPara, 260); }
      }, 24);
    })();
  }

  btn.addEventListener('click', async () => {
    const st = STYLES[$('#rptStyle').value];
    const lv = LEVELS[$('#rptLevel').value];
    const f = todayFacts();
    btn.disabled = true;
    $('#rptState').textContent = '正在翻你今天摸鱼的痕迹…';
    osOpen('winWord');

    const facts = [
      `在匿名社区发言互动 ${f.blows} 次，追了 ${f.bubs} 个话题`,
      `机器人分身替我回了 ${f.duty} 条群消息`,
      f.drawn ? `在 Excel 里拼豆填了 ${f.drawn} 个格子` : `研究了 Excel 拼豆玩法`,
      `查了 ${f.sal} 家公司的薪资对标`,
      `翻了 ${f.lib} 份行业资讯`,
      `下午看了一场「新员工入职培训」视频（其实是产品宣传片）`
    ];
    const sys = `你是替打工人代写「当日工作日报」的枪手。风格要求：${st.sys} 篇幅要求：${lv.hint}。` +
      `任务：把用户给的摸鱼活动翻译成一份看起来正经的工作日报，不点破、不自嘲、不加免责声明，直接输出正文，段落之间用换行分隔，不要标题。`;
    const q = `今天实际干的事：${facts.join('；')}。今天日期：${new Date().toLocaleDateString('zh-CN')}`;

    let paras = null, meta = '';
    try {
      $('#rptState').textContent = 'AI 组稿中…';
      const r = await fetch('/api/ask', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ system: sys, q })
      });
      const j = await r.json();
      if (j.ok && j.text) {
        paras = j.text.split(/\n+/).map(s => s.trim()).filter(Boolean);
        meta = `本报告由 AI 生成（模型 ${esc(j.model || '未知')}）· 风格「${st.nm}」· 细节「${lv.nm}」· 演示内容，请勿呈交真领导`;
      } else {
        meta = `脚本模拟生成（${esc(j.why || '模型不在岗')}）· 风格「${st.nm}」· 细节「${lv.nm}」· 演示内容，请勿呈交真领导`;
      }
    } catch (e) {
      meta = `脚本模拟生成（本地演示，服务未启动）· 风格「${st.nm}」· 细节「${lv.nm}」· 演示内容，请勿呈交真领导`;
    }
    if (!paras) paras = asParas(scriptDraft($('#rptStyle').value, f), lv);
    typeParas(paras, meta);
  });
})();

/* ============================================================
   任务栏悬停预览 —— 像真 Windows 那样
   鼠标放到 Word 上，弹出这个壳里伪装的几扇真窗：
   述职报告 / 摸鱼日报…点哪个进哪个。绿点 = 这扇窗已打开。
   ============================================================ */
const BAR_PREV = {
  report: [
    ['述职报告_v7_真的最终版.docx', 'AI 一键述职 · 摸的鱼变干的活', 'report'],
    ['摸鱼日报_第212期.docx', '干货区 · 行业资讯与技能市场', 'ref']
  ],
  draw: [
    ['2026年度预算表.xlsx', '拼豆 · 格子拼鱼摸鱼画布', 'draw'],
    ['Sheet2 · 薪资对标', '别的公司什么价', 'salary'],
    ['Sheet3 · 岗位机会', '内推与空缺', 'jobs']
  ],
  review: [
    ['Q3复盘汇报.pptx', '梦蝶局 · 四个 AI 一个假猎头', 'review']
  ],
  pitch: [
    ['变大泡泡·产品介绍.pptx', '给评委看的那一版', 'pitch']
  ],
  mail: [
    ['收件箱 · 付费咨询', '一对一 · 钱走你的账', 'mail']
  ],
  chat: [
    ['产品二部 · 群聊', '机器人分身在岗替你说话', 'chat'],
    ['机器人菜园', '独立小窗 · 分身替你抓情报挣钱', 'farm']
  ],
  ops: [
    ['经营分析看板', '转化漏斗与本月流水', 'ops']
  ],
  me: [
    ['工资条_2026-08.pdf', '本月从平台挣了多少', 'me']
  ]
};

(function barPreview() {
  const bar = $('#osbar');
  if (!bar) return;
  const pv = document.createElement('div');
  pv.id = 'barPrev';
  document.body.appendChild(pv);
  let curKey = null, hideT = null, showT = null;

  function render(key, anchor) {
    const items = BAR_PREV[key];
    const bd = BAR.find(b => b[0] === key);
    const tag = bd ? bd[2] : '?', col = bd ? bd[3] : '#666';
    pv.innerHTML = items.map(([t, sub, v, anc], i) => {
      const g = OS_GO[v];
      const open = g && OSWIN[g[0]] && OSWIN[g[0]].classList.contains('on');
      return `<div class="bpi" data-pv="${i}"><i style="background:${col}">${tag}</i>` +
        `<div style="min-width:0"><b>${esc(t)}</b><span>${esc(sub)}</span></div>` +
        `<em${open ? ' class="live" title="已打开"' : ''}></em></div>`;
    }).join('');
    pv.classList.add('on');
    const r = anchor.getBoundingClientRect();
    const w = pv.offsetWidth;
    pv.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  }
  function scheduleHide() {
    clearTimeout(hideT);
    hideT = setTimeout(() => { pv.classList.remove('on'); curKey = null; }, 280);
  }

  bar.addEventListener('mouseover', e => {
    const a = e.target.closest('.app[data-go]');
    if (!a || !BAR_PREV[a.dataset.go]) return;
    clearTimeout(hideT); clearTimeout(showT);
    showT = setTimeout(() => { curKey = a.dataset.go; render(curKey, a); }, 150);
  });
  bar.addEventListener('mouseout', e => {
    if (!e.target.closest('.app[data-go]')) return;
    clearTimeout(showT);
    scheduleHide();
  });
  pv.addEventListener('mouseenter', () => clearTimeout(hideT));
  pv.addEventListener('mouseleave', scheduleHide);
  pv.addEventListener('click', e => {
    const t = e.target.closest('[data-pv]');
    if (!t || !curKey) return;
    const it = BAR_PREV[curKey][+t.dataset.pv];
    goFeature(it[2]);
    if (it[3]) deepLink(it[3]);
    pv.classList.remove('on');
  });
  // 点了任务栏图标本体（直接开窗）也把预览收掉
  bar.addEventListener('click', () => pv.classList.remove('on'));
})();

/* ---------- 新员工报到动线：两份必看文件 + 首次进场引导 ----------
   评委=新员工。桌面 C 位除了《入职培训》视频，再补一份《新员工手册》PPT；
   没看过的文件金光呼吸，进场后 toast 依次指路，点过即安静。 */
(function onboard() {
  // 1) 产品介绍立在放映图标旁边：两份新人文件并排在银幕上方
  const di = $('#deskIcons');
  document.body.insertAdjacentHTML('beforeend',
    '<div id="deskPitch" class="dski"><span class="ic page" data-x="P" style="--tag:#C43E1C"></span><em>新员工手册_看完就懂.pptx</em></div>');
  $('#deskPitch').addEventListener('click', () => { goFeature('pitch'); seen('pitch'); });
  // 2) 金光呼吸：没点过的两份文件一直轻轻发光
  let S = {};
  try { S = JSON.parse(localStorage.getItem('ppSeen') || '{}'); } catch (e) {}
  function seen(k) {
    S[k] = 1;
    try { localStorage.setItem('ppSeen', JSON.stringify(S)); } catch (e) {}
    mark();
  }
  function mark() {
    const f = $('#deskFilm'); if (f) f.classList.toggle('fresh', !S.film);
    const p = $('#deskPitch'); if (p) p.classList.toggle('fresh', !S.pitch);
    const bf = document.querySelector('#osbar .app[data-go="desk"]'); if (bf) bf.classList.toggle('fresh', !S.film);
    const bp = document.querySelector('#osbar .app[data-go="pitch"]'); if (bp) bp.classList.toggle('fresh', !S.pitch);
  }
  mark();
  document.querySelector('#osbar').addEventListener('click', e => {
    const a = e.target.closest('.app[data-go]');
    if (!a) return;
    if (a.dataset.go === 'desk') seen('film');
    if (a.dataset.go === 'pitch') seen('pitch');
  });
  const f = $('#deskFilm');
  if (f) f.addEventListener('click', () => seen('film'));
  // 3) 首次进场：两条 toast 依次指路（只提示一轮）
  const go = $('#splashGo');
  if (go && !S.guided) go.addEventListener('click', () => {
    setTimeout(() => osToast('新员工报到：先看桌面《新员工入职培训》，45 秒', 'desk'), 3500);
    setTimeout(() => osToast('想快速看懂这里：双击《新员工手册_看完就懂.pptx》', 'pitch'), 11000);
    seen('guided');
  });
})();

/* ============================================================
   机器人两处上岗（形象走生图，图没到位自动用 CSS 画的顶着）
   1) 菜园农夫：bot-farmer.png 换掉 CSS 小人 —— 用注入全局样式的方式，
      菜园面板怎么重渲染都不掉；头顶一句碎碎念跟着状态走（CSS 变量）。
   2) Excel 抓数员：bot-scraper.png 蹲在表格右下角，气泡实时汇报
      它正在扒哪个网站；每隔一会儿真的往表里抓回一行新数据（金色闪一下）。
      点它本体，跳去独立的机器人菜园窗口 —— 那是它老家。
   ============================================================ */

// —— 1) 菜园农夫换装（庄周的鱼优先）+ 碎碎念 + 摸鱼互动 ——
(function farmBotSkin() {
  function apply(src) {
    const st = document.createElement('style');
    st.textContent =
      '#gdScene{height:96px}' +
      `.gbot{width:60px;height:76px;left:8px;bottom:12px;background:url(${src}) center bottom/contain no-repeat;cursor:pointer;` +
      'filter:drop-shadow(0 3px 6px rgba(4,10,20,.5))}' +
      '.gbot .hat,.gbot .hd3,.gbot .bd3{display:none}' +
      '.gbot::after{content:var(--gsay,"");position:absolute;left:52px;top:-2px;white-space:nowrap;' +
      'background:#E3CFA4;color:#5A4318;font-size:9.5px;padding:2px 7px;border-radius:3px 8px 8px 8px;' +
      'box-shadow:0 2px 4px rgba(4,10,20,.4);letter-spacing:.5px}' +
      '#gdScene:not(.live) .gbot{filter:drop-shadow(0 3px 6px rgba(4,10,20,.5)) saturate(.55) brightness(.85)}' +
      '#gdScene .cabs{left:76px}';
    document.head.appendChild(st);
  }
  const fish = new Image();
  fish.onload = () => apply('assets/fish-farmer.png');
  fish.onerror = () => {
    const bot = new Image();
    bot.onload = () => apply('assets/bot-farmer.png');
    bot.src = 'assets/bot-farmer.png';
  };
  fish.src = 'assets/fish-farmer.png';

  const RUN_SAY = ['下地翻话中…', '浇了点水', '逮到一条线索', '这颗快熟了', '有人的瓜，先摘为敬'];
  const IDLE_SAY = ['在工位上闲着', '放我下地啊', '地荒着，情报就只是听说'];
  const PET_SAY = ['咕噜噜~', '摸鱼摸到点子上了', '别闹，我在种地', '等这颗熟了给你留一口'];
  let si = 0, petHold = 0;
  setInterval(() => {
    if (petHold > 0) { petHold--; return; }
    const live = document.querySelector('#gdScene.live');
    const pool = live ? RUN_SAY : IDLE_SAY;
    document.documentElement.style.setProperty('--gsay', JSON.stringify(pool[si++ % pool.length]));
  }, 4200);

  // 摸菜园里的鱼：扭一下 + 顶一句嘴（菜园面板重渲染也不受影响 —— 事件挂在 document 上）
  let pi = 0;
  document.addEventListener('click', e => {
    const g = e.target.closest('.gbot');
    if (!g) return;
    g.classList.remove('wig'); void g.offsetWidth; g.classList.add('wig');
    document.documentElement.style.setProperty('--gsay', JSON.stringify(PET_SAY[pi++ % PET_SAY.length]));
    petHold = 1;   // 顶嘴的话多留一拍再回碎碎念
  });
})();

// —— 2) Excel 抓数员：气泡汇报 + 真往表里抓新行 ——
(function xlBot() {
  const win = $('#winExcel');
  if (!win) return;

  const SAY = {
    salary: ['正在扒某跳动薪资帖…', '比对 3 份 offer 截图…', '猎头报价去重中…', '第 41 行清洗完毕', '这条包裹有点虚，标待验证'],
    jobs: ['正在爬某鹅系官网 JD…', '领英翻到第 7 页…', '检查内推位余量…', '这个岗昨天还在，今天没了', '缩编中的先打个标']
  };
  const SAL_MORE = [
    ['某鹅系 · 广州', '技术 · 3-2', '58k × 16', '机器人抓取 · 爆料帖', '待验证'],
    ['某跳动 · 上海', '研发 · 2-2', '47k × 15', '机器人抓取 · offer 比对', '待验证'],
    ['某菊厂 · 苏州', '软件 · 15 级', '40k × 15', '机器人抓取 · 论坛', '待验证'],
    ['某 SaaS · 远程', '后端 · 高级', '35k × 14', '机器人抓取 · 官网', '待验证']
  ];
  const JOB_MORE = [
    ['AI 产品经理', '某跳动 · 北京', '40-65k · 15薪', '机器人抓取 · 官网', '刚抓到'],
    ['芯片验证', '某菊厂 · 上海', '45-60k · 15薪', '机器人抓取 · 猎头站', '刚抓到'],
    ['增长运营', '某新势力 · 合肥', '22-32k · 14薪', '机器人抓取 · JD 比对', '刚抓到'],
    ['SRE 工程师', '某外企 · 远程', '50-70k · 13薪', '机器人抓取 · 领英', '刚抓到']
  ];

  const bot = document.createElement('div');
  bot.id = 'xlBot';
  bot.title = '摸一下鱼 · 双击去它老家（菜园）';
  bot.innerHTML = '<i id="xlBotSay"></i><b id="xlBotN">今日已抓 0 条</b>';
  win.appendChild(bot);

  // 摸鱼：单击 = 真的摸一下鱼（会扭、会顶嘴、记次数）；双击才去菜园
  const PET = ['咕噜噜~', '别挠痒，掉鳞', '子非鱼，安知我不想被摸', '再摸就要被老板看见了', '行吧，这也算摸鱼'];
  let petN = 0;
  bot.addEventListener('click', () => {
    petN++;
    bot.classList.remove('wig'); void bot.offsetWidth; bot.classList.add('wig');
    $('#xlBotSay').textContent = petN % 5 === 0 ? `摸了 ${petN} 下了，让我干会儿活` : PET[(Math.random() * PET.length) | 0];
    $('#xlBotN').textContent = `今日已抓 ${grabbed} 条 · 被摸 ${petN} 下`;
    const p = document.createElement('span');
    p.className = 'petp'; p.textContent = '摸鱼 +1';
    bot.appendChild(p); setTimeout(() => p.remove(), 900);
  });
  bot.addEventListener('dblclick', () => goFeature('farm'));

  // 形象：庄周的鱼优先，退级到机器人，再退级 emoji
  function wear(src) { bot.classList.add('perch'); bot.style.backgroundImage = `url(${src})`; }
  const fish = new Image();
  fish.onload = () => wear('assets/fish-perch.png');
  fish.onerror = () => {
    const perch = new Image();
    perch.onload = () => wear('assets/bot-perch.png');
    perch.onerror = () => {
      const img = new Image();
      img.onload = () => bot.classList.add('img');
      img.src = 'assets/bot-scraper.png';
    };
    perch.src = 'assets/bot-perch.png';
  };
  fish.src = 'assets/fish-perch.png';

  // 参赛版一句话说明条：这两张表是机器人从外网扒回来的
  const HINT = {
    'v-salary': '<b>这张表怎么来的：</b>机器人分身 24 小时在外网扒薪资爆料，先标「待验证」，社区有人作保才算数 —— 条条有来源，假的进不来',
    'v-jobs': '<b>这张表怎么来的：</b>机器人分身盯着官网 / 猎头站 / 领英扒岗位，网友内推位实时挂上来 —— 岗位没了它会自己下架'
  };
  Object.keys(HINT).forEach(id => {
    const v = document.getElementById(id);
    if (v && !v.querySelector('.grabbar')) v.insertAdjacentHTML('afterbegin',
      `<div class="grabbar"><span class="gbic"></span><span>${HINT[id]}</span></div>`);
  });
  // 说明条的小图标也换成驮文件的鱼（有就换，没有用机器人）
  const fc = new Image();
  fc.onload = () => {
    const st = document.createElement('style');
    st.textContent = '.grabbar .gbic{background-image:url(assets/fish-carry.png)}';
    document.head.appendChild(st);
  };
  fc.src = 'assets/fish-carry.png';

  let grabbed = 0, si = 0;

  function curSheet() {
    if (!win.classList.contains('on') || win.classList.contains('min')) return null;
    const v = win.querySelector('.view.xon');
    if (!v) return null;
    return v.id === 'v-salary' ? 'salary' : v.id === 'v-jobs' ? 'jobs' : null;
  }

  // 气泡：只在薪资/岗位两张表上出现 —— 拼豆不归它管
  setInterval(() => {
    const k = curSheet();
    bot.classList.toggle('on', !!k);
    if (!k) return;
    const pool = SAY[k];
    $('#xlBotSay').textContent = pool[si++ % pool.length];
  }, 3600);

  // 抓行：每 22 秒往当前表真加一行，金色闪一下，最多各加 4 行
  function grabRow() {
    const k = curSheet();
    if (!k) return;
    const pool = k === 'salary' ? SAL_MORE : JOB_MORE;
    if (!pool.length) return;
    const r = pool.shift();
    const tab = $(k === 'salary' ? '#salTab' : '#jobTab');
    if (!tab) return;
    const tr = document.createElement('tr');
    tr.className = 'fresh';
    tr.innerHTML = `<th class="rn">${tab.rows.length}</th>` + r.map((c, i) =>
      `<td class="${i === 2 ? 'n' : ''}${i >= 3 ? ' cf' : ''}">${esc(c)}</td>`).join('');
    tab.appendChild(tr);
    grabbed++;
    $('#xlBotN').textContent = `今日已抓 ${grabbed} 条`;
    $('#xlBotSay').textContent = `抓回来一条：${r[0]} ✓`;
    if (k === 'jobs' && typeof JOBS !== 'undefined') JOBS.push(r);   // 一键述职的统计跟着变多
    if (k === 'salary' && typeof SALARY !== 'undefined') SALARY.push(r);
    setTimeout(() => tr.classList.remove('fresh'), 2600);
  }
  setTimeout(grabRow, 6000);
  setInterval(grabRow, 22000);
})();

/* ============================================================
   功能各归其窗 —— 不挤在一个界面（farm 拆窗模式 ×4 + 新游戏窗 ×2）
   点子集市 / 皮肤商城：从 Excel 拼豆侧栏搬出来；
   爽文背单词 / 技能市场：从摸鱼日报长页里搬出来；
   职场五子棋 / 工位躲猫猫：从「列表里的两行字」变成真能玩的窗口。
   ============================================================ */
(function splitWins() {
  function adopt(sel, winId, title, style) {
    const el = $(sel);
    if (!el) return null;
    const card = el.closest('.card') || el;
    const b = mkWin(winId, 'plain', title, style);
    b.classList.add('splitbody');
    b.appendChild(card);
    return b;
  }
  adopt('#gameHall', 'winHall', '摸鱼点子集市 - 谁的点子有人玩，谁收钱', 'left:600px;top:90px;width:390px;height:430px');
  adopt('#skinShop', 'winSkin', '皮肤商城 - 换一片水，不换鱼', 'left:640px;top:130px;width:390px;height:430px');
  adopt('#wordGame', 'winWordGame', '爽文背单词 - 装逼值每日结算', 'left:400px;top:110px;width:440px;height:460px');
  adopt('#skillMart', 'winSkillMart', '技能市场 - 本事第一次被标上价格', 'left:460px;top:60px;width:480px;height:570px');
  OS_GO.hall = ['winHall'];
  OS_GO.skin = ['winSkin'];
  OS_GO.wordgame = ['winWordGame'];
  OS_GO.skillmart = ['winSkillMart'];
})();

/* ---------- 职场五子棋：本地双人，黑=老板 白=你 ---------- */
(function gomoku() {
  const N = 13;
  const b = mkWin('winGomoku', 'plain', '职场五子棋 - 会议室 3 号在用', 'left:560px;top:70px;width:400px;height:500px');
  b.innerHTML =
    '<div class="gmk"><div class="gst" id="gmkSt">黑子先行 · 黑=老板，白=你 —— 先连成五个的说了算</div>' +
    '<div class="gbd" id="gmkBd"></div>' +
    '<div class="gft"><button class="rbtn" id="gmkRe">再来一局</button><span class="muted" id="gmkN">玩家 · 井底之蛙 自制 · 已获打赏 ¥28</span></div></div>';
  OS_GO.gomoku = ['winGomoku'];

  const bd = b.querySelector('#gmkBd'), st = b.querySelector('#gmkSt');
  let cells = [], turn = 1, over = false;   // 1=黑 2=白

  const STARS = [3 * N + 3, 3 * N + 9, 9 * N + 3, 9 * N + 9, 6 * N + 6];
  function reset() {
    cells = new Array(N * N).fill(0); turn = 1; over = false;
    bd.innerHTML = '';
    for (let i = 0; i < N * N; i++) {
      const c = document.createElement('span');
      c.dataset.i = i;
      if (STARS.includes(i)) c.classList.add('star');
      bd.appendChild(c);
    }
    st.textContent = '黑子先行 · 黑=老板，白=你 —— 先连成五个的说了算';
  }
  function win(i) {
    const x = i % N, y = (i / N) | 0, me = cells[i];
    return [[1, 0], [0, 1], [1, 1], [1, -1]].some(([dx, dy]) => {
      let n = 1;
      for (const s of [1, -1]) {
        let cx = x + dx * s, cy = y + dy * s;
        while (cx >= 0 && cx < N && cy >= 0 && cy < N && cells[cy * N + cx] === me) { n++; cx += dx * s; cy += dy * s; }
      }
      return n >= 5;
    });
  }
  bd.addEventListener('click', e => {
    const c = e.target.closest('span[data-i]');
    if (!c || over) return;
    const i = +c.dataset.i;
    if (cells[i]) return;
    cells[i] = turn;
    c.dataset.s = turn;
    const prev = bd.querySelector('span.last'); if (prev) prev.classList.remove('last');
    c.classList.add('last');
    if (win(i)) {
      over = true;
      st.textContent = turn === 1 ? '老板赢了。像话。回去加班。' : '你赢了！这局赢的是棋，输的是印象分。';
      return;
    }
    if (!cells.includes(0)) { over = true; st.textContent = '平局 —— 和老板打成平手，已经是胜利。'; return; }
    turn = 3 - turn;
    st.textContent = turn === 1 ? '该黑子（老板）落子' : '该白子（你）落子';
  });
  b.querySelector('#gmkRe').addEventListener('click', reset);
  reset();
})();

/* ---------- 工位躲猫猫：12 个工位，1 个同事躲着，3 次机会 ---------- */
(function hideSeek() {
  const b = mkWin('winHide', 'plain', '工位躲猫猫 - 全组都说自己在工位', 'left:620px;top:110px;width:400px;height:430px');
  b.innerHTML =
    '<div class="hnk"><div class="gst" id="hkSt">呆若木鸡躲起来了。12 个工位，3 次机会，把他找出来。</div>' +
    '<div class="hgd" id="hkGd"></div>' +
    '<div class="gft"><button class="rbtn" id="hkRe">再玩一局</button><span class="muted">玩家 · 呆若木鸡 自制 · 已获打赏 ¥12</span></div></div>';
  OS_GO.hide = ['winHide'];

  const gd = b.querySelector('#hkGd'), st = b.querySelector('#hkSt');
  const MISS = ['这儿只有一件工牌挂在椅背上', '键盘是热的，人刚溜', '屏幕上开着 Excel，人不在', '椅子还在转，扑了个空', '外套在，人没影', '桌上三杯没喝完的咖啡'];
  let hid = 0, tries = 0, done = false;

  function reset() {
    hid = (Math.random() * 12) | 0; tries = 0; done = false;
    gd.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const c = document.createElement('div');
      c.dataset.i = i;
      c.innerHTML = '<i>🖥️</i><em>工位 ' + (i + 1) + '</em>';
      gd.appendChild(c);
    }
    st.textContent = '呆若木鸡躲起来了。12 个工位，3 次机会，把他找出来。';
  }
  function near(a, b2) {
    const ax = a % 4, ay = (a / 4) | 0, bx = b2 % 4, by = (b2 / 4) | 0;
    return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
  }
  gd.addEventListener('click', e => {
    const c = e.target.closest('[data-i]');
    if (!c || done || c.classList.contains('open')) return;
    const i = +c.dataset.i;
    c.classList.add('open');
    if (i === hid) {
      done = true;
      c.classList.add('found');
      c.innerHTML = '<i>🙇</i><em>被抓到了</em>';
      st.textContent = `第 ${tries + 1} 次就抓到了！他说他「刚去接水」。`;
      return;
    }
    tries++;
    c.innerHTML = '<i>💺</i><em>没人</em>';
    if (tries >= 3) {
      done = true;
      const h = gd.querySelector(`[data-i="${hid}"]`);
      if (h) { h.classList.add('open'); h.innerHTML = '<i>😏</i><em>他在这</em>'; }
      st.textContent = '3 次用完。他躲过了你，就像躲过了周报。';
      return;
    }
    st.textContent = (near(i, hid) ? '好像听到了打字声，很近。' : MISS[(Math.random() * MISS.length) | 0] + '。') + `还剩 ${3 - tries} 次。`;
  });
  b.querySelector('#hkRe').addEventListener('click', reset);
  reset();
})();

/* ---------- 封面小游戏：大鱼吃小鱼 ----------
   生成立绘版：小鱼群在下半屏游（正弦摆动），大鱼跟着鼠标慢慢巡。
   追上就一口吞；点小鱼套一颗泡泡护盾——泡泡=壳，图名双关。 */
(function coverFishGame() {
  const sp = $('#splash');
  if (!sp || sp.classList.contains('off')) return;
  const layer = document.createElement('div');
  layer.id = 'fishLayer';
  sp.insertBefore(layer, sp.querySelector('.sw'));

  const zoneTop = () => innerHeight * .5;          // 游动区：下半屏
  const zoneBot = () => innerHeight * .88;

  const SPRITES = ['assets/fish-small.webp','assets/fish-small2.webp','assets/fish-small3.webp'];
  const fishes = [];
  let eaten = 0;
  function spawnFish(fromEdge) {
    const w = 60 + Math.random() * 46;
    const el = document.createElement('div');
    el.className = 'lf';
    el.style.width = w + 'px';
    el.innerHTML = '<img src="' + SPRITES[Math.floor(Math.random()*SPRITES.length)] + '" alt="">';
    layer.appendChild(el);
    const dir = Math.random() < .5 ? 1 : -1;
    const f = {
      el, w, dir,
      x: fromEdge ? (dir > 0 ? -w - 20 : innerWidth + 20) : Math.random() * innerWidth,
      baseY: zoneTop() + Math.random() * (zoneBot() - zoneTop()),
      sp: .45 + Math.random() * .8,
      ph: Math.random() * 6.28, amp: 8 + Math.random() * 14,
      shield: 0, dead: false
    };
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (f.dead) return;
      f.shield = performance.now() + 8000;
      el.classList.add('shield');
      const h = $('#spHint'); if (h) h.textContent = '套上泡泡，大鱼咬不动——这就是「变大泡泡」';
    });
    fishes.push(f);
    return f;
  }
  for (let i = 0; i < 6; i++) spawnFish(false);

  const big = document.createElement('div');
  big.className = 'bigf';
  big.style.width = '210px';
  big.innerHTML = '<img src="assets/fish-big.webp" alt="">';
  layer.appendChild(big);
  const B = { x: innerWidth * .7, y: innerHeight * .68, tx: innerWidth * .3, ty: innerHeight * .66 };
  let mouseIdle = 0;
  const clampY = y => Math.max(zoneTop(), Math.min(zoneBot() - 40, y));
  sp.addEventListener('mousemove', e => { B.tx = e.clientX; B.ty = clampY(e.clientY); mouseIdle = 0; });
  sp.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) { B.tx = t.clientX; B.ty = clampY(t.clientY); mouseIdle = 0; } }, { passive: true });

  function burst(x, y) {
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('div');
      s.className = 'spbub';
      const d = 7 + Math.random() * 12;
      s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + x + 'px;top:' + y + 'px';
      sp.appendChild(s);
      s.animate([
        { transform: 'translate(0,0)', opacity: .95 },
        { transform: 'translate(' + ((Math.random() - .5) * 120) + 'px,' + (-40 - Math.random() * 80) + 'px)', opacity: 0 }
      ], { duration: 650 + Math.random() * 450, easing: 'ease-out' }).onfinish = () => s.remove();
    }
  }
  function eat(f) {
    f.dead = true;
    f.el.classList.add('gone');
    big.classList.add('chomp');
    setTimeout(() => big.classList.remove('chomp'), 260);
    burst(f.x + f.w / 2, f.baseY);
    eaten++;
    const h = $('#spHint');
    if (h) h.textContent = '第 ' + eaten + ' 条小鱼没躲开——点小鱼，给它套个泡泡';
    setTimeout(() => { f.el.remove(); const i = fishes.indexOf(f); if (i > -1) fishes.splice(i, 1); spawnFish(true); }, 2600);
  }

  let last = performance.now();
  function tickFish(now) {
    if (sp.classList.contains('off')) { layer.remove(); return; }
    const dt = Math.min(50, now - last) / 16.7; last = now;
    mouseIdle += dt;
    if (mouseIdle > 180) {
      B.tx = innerWidth * (.5 + Math.sin(now / 4600) * .38);
      B.ty = clampY(innerHeight * (.68 + Math.cos(now / 5300) * .14));
    }
    B.x += (B.tx - B.x) * .016 * dt;
    B.y += (B.ty - B.y) * .016 * dt;
    const bdir = (B.tx - B.x) < 0 ? -1 : 1;   // 立绘头朝左：向左游为原方向，向右翻面
    big.style.transform = 'translate(' + (B.x - 105) + 'px,' + (B.y - 70) + 'px) scaleX(' + (bdir > 0 ? -1 : 1) + ')';
    const mouthX = B.x + bdir * 88, mouthY = B.y;
    const t = now / 1000;
    for (const f of fishes) {
      if (f.dead) continue;
      const dx = f.x - B.x, dy = f.baseY - B.y, dd = Math.hypot(dx, dy);
      let flee = 0;
      if (dd < 190 && !f.shield) { flee = (190 - dd) / 190 * 2; f.dir = dx < 0 ? -1 : 1; }
      f.x += f.dir * (f.sp + flee) * dt;
      if (f.x > innerWidth + 60) { f.dir = -1; f.x = innerWidth + 60; }
      if (f.x < -60 - f.w) { f.dir = 1; f.x = -60 - f.w; }
      const y = f.baseY + Math.sin(t * 1.3 + f.ph) * f.amp;
      f.el.style.transform = 'translate(' + f.x + 'px,' + y + 'px) scaleX(' + (f.dir > 0 ? -1 : 1) + ')';
      if (f.shield && now > f.shield) { f.shield = 0; f.el.classList.remove('shield'); }
      if (!f.shield && Math.hypot(f.x + f.w / 2 - mouthX, y - mouthY) < 46) eat(f);
    }
    requestAnimationFrame(tickFish);
  }
  requestAnimationFrame(tickFish);
})();

/* ============================================================
   拼豆 = 真 Excel —— 补齐窗口 chrome，把玩法藏进正经软件的肌理里
   ribbon 填充色 = 拼豆画笔（和右栏色板双向同步）；
   点珠格公式栏跳真坐标；底部状态栏实时计数；选中格绿框+填充柄。
   ============================================================ */
(function xlRealism() {
  const win = $('#winExcel');
  if (!win || typeof PALETTE === 'undefined') return;

  // 1) 迷你 ribbon：开始 tab。填充色是唯一的真按钮，掉出拼豆十色
  const fbarEl = win.querySelector('.fbar');
  if (fbarEl) fbarEl.insertAdjacentHTML('beforebegin',
    '<div class="dwt xlrb"><span class="xg"><b class="dead">粘贴</b><i class="sp2"></i></span>' +
    '<span class="xg"><b class="dead">等线</b><b class="dead">11</b><b class="dead" style="font-weight:700">B</b>' +
    '<b class="dead" style="font-style:italic;font-family:serif">I</b><b class="dead" style="text-decoration:underline">U</b>' +
    '<span class="xfill" id="xlFill" title="填充颜色 · 拼豆画笔"><s id="xlFillBar"></s>▾' +
    '<span class="xdrop" id="xlDrop"></span></span></span>' +
    '<span class="xg"><b class="dead">≡</b><b class="dead">⊞</b><b class="dead">%</b></span>' +
    '<span class="sp" style="margin-left:auto">开始　插入　页面布局　公式</span></div>');

  const fillBar = $('#xlFillBar'), drop = $('#xlDrop');
  function syncFill(c) {
    if (fillBar) fillBar.style.background = c;
    $$('#pal i').forEach(x => x.classList.toggle('on', x.dataset.c === c));
  }
  if (drop) {
    drop.innerHTML = PALETTE.map(c => `<i style="background:${c}" data-fc="${c}"></i>`).join('');
    $('#xlFill').addEventListener('click', e => {
      if (e.target.dataset.fc) {
        curColor = e.target.dataset.fc;
        syncFill(curColor);
        drop.classList.remove('on');
        return;
      }
      drop.classList.toggle('on');
    });
    document.addEventListener('click', e => { if (!e.target.closest('#xlFill')) drop.classList.remove('on'); });
    const palEl = $('#pal');
    if (palEl) palEl.addEventListener('click', () => syncFill(curColor));
    syncFill(curColor);
  }

  // 2) 公式栏联动 + 选中格：点珠格，名称框跳真坐标，公式栏出 =FILL()
  const sheet = $('#sheet');
  if (sheet) sheet.addEventListener('mousedown', e => {
    const c = e.target.closest('.cell');
    if (!c) return;
    $$('#sheet .cell.sel').forEach(x => x.classList.remove('sel'));
    c.classList.add('sel');
    const i = +c.dataset.i, col = String.fromCharCode(65 + (i % 30) % 26), row = ((i / 30) | 0) + 1;
    if (typeof setFormula === 'function')
      setFormula(e.button === 2 ? '' : `=FILL("${curColor}")`, col + row);
  });

  // 3) 状态栏：填了多少格，实时涨 —— 老板走过来看到的是"就绪"
  win.parentNode.insertAdjacentHTML('beforeend',
    '<div class="dwf" id="xlFoot">就绪　<b id="xlCnt">计数: 0</b><span style="margin-left:auto">' +
    '<i class="zoomseg">普通</i><i class="zoomseg">分页预览</i>　100% <i class="zoombar"><s></s></i></span></div>');
  function updCnt() {
    const n = $$('#sheet .cell').filter(c => c.style.background).length;
    const el = $('#xlCnt');
    if (el) el.textContent = `计数: ${n} · 完成度 ${Math.round(n / 17 * 100) > 100 ? 100 : Math.round(n / 17 * 100)}%`;
  }
  if (sheet) new MutationObserver(updCnt).observe(sheet, { attributes: true, subtree: true, attributeFilter: ['style'] });
  updCnt();
})();

/* ============================================================
   精美化装配：生图背景探测挂载 + 手机真时钟
   图在 → 窗口加 has* 类换上生图皮；图 404 → 保持 CSS 兜底。
   ============================================================ */
(function polishAssets() {
  [['assets/wordgame-bg.jpg', 'winWordGame', 'haswg'],
   ['assets/gomoku-wood.jpg', 'winGomoku', 'haswood'],
   ['assets/hide-office.jpg', 'winHide', 'hasoffice']].forEach(([src, winId, cls]) => {
    const im = new Image();
    im.onload = () => { const w = $('#' + winId); if (w) w.classList.add(cls); };
    im.src = src;
  });
  // 手机聊天区衬底：锁屏壁纸铺在 phoneLog 后面，气泡浮在水上
  const pw = new Image();
  pw.onload = () => {
    const st = document.createElement('style');
    st.textContent = '#phoneLog{background:linear-gradient(rgba(237,237,237,.86),rgba(237,237,237,.86)),url(assets/phone-wall.jpg) center/cover}';
    document.head.appendChild(st);
  };
  pw.src = 'assets/phone-wall.jpg';
  // 手机时钟走真实时间
  const pc = $('#pClk');
  if (pc) setInterval(() => {
    const d = new Date();
    pc.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }, 1000);
  // 爽文背单词窗口标题跟境界走
  const wgWin = $('#winWordGame');
  if (wgWin && typeof swagger !== 'undefined') {
    const h = wgWin.querySelector('.dwh');
    if (h) h.firstChild.textContent = `爽文背单词 - 当前境界·${['练气','筑基','金丹','元婴','化神'][Math.min(4, (swagger / 10) | 0)]}`;
  }
})();
