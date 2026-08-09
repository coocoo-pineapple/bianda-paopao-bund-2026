// 审计落地批一：功能断裂 + 桌面层 Top5
'use strict';
const fs = require('fs');
const F = { app: 'public/app.html', sh: 'public/shells.js', os: 'public/os.js' };
const s = {}; for (const k in F) s[k] = fs.readFileSync(F[k], 'utf8');
let ok = 0, miss = [];
const rep = (f, a, b) => { if (s[f].includes(a)) { s[f] = s[f].split(a).join(b); ok++; } else miss.push(a.slice(0, 36)); };

/* M-1/M-2/M-3 邮件正文 */
rep('sh', `  $('#mailSubj').textContent = m.sj;`, `  $('#mailSubj').textContent = m.sj;
  $('#mailBody') && ($('#mailBody').innerHTML =
    '<div class="mbd">' + esc(m.body || m.pv).replace(/\\n/g, '<br>') + '</div>' +
    '<div class="mops"><button class="rbtn">答复</button><button class="rbtn">转发</button><button class="rbtn">另存为 Word</button></div>');`);
rep('sh', `pay: '机器人咨询 · 99 元 · 已支付', un: 1 },`, `pay: '机器人咨询 · 99 元 · 已支付', un: 1,
      body: '先复述：你问的不是跳不跳，是跳了会不会更惨。\\n判断：项目黄了一半是你的止损信号，不是你的罪证。市场缩编不代表你贬值，代表议价窗口变窄——窄不等于关。\\n可执行动作：这周只做一件事，把你负责那半个项目的三个数字写进简历——上线时间、成本、留下来的人数。有数字的三年和没数字的八年，在筛简历的人眼里一样长。\\n（本单 99 元机器人档。超出我边界的部分——比如要不要为了对象留在这座城市——我不接，会原价转给真人。）' },`);
rep('sh', `pay: '账单 · 已出账', un: 1 }`, `pay: '账单 · 已出账', un: 1,
      body: '本月完成咨询 14 单：机器人 9 单 × 99 元 = 891 元，真人 5 单 × 599 元 = 2,995 元，加急插队 3 次 × 100 元 = 300 元，合计 4,186 元。\\n社区抽成 20%，实发 3,348.80 元。\\n本月退款 0 单。有一位用户申请退款，理由是「你说的我都知道」。我们回复「知道和做到之间那 599 块，是您自己欠的」，对方撤回了申请。' }`);

/* C-1 放养面板进企微窗口 · C-8 匠石身份 */
rep('os', `put('#imList', bChat); put('#v-chat', bChat); put('#imBar', bChat);`,
`put('#imList', bChat); put('#v-chat', bChat); put('#imBar', bChat);
const fp = document.querySelector('#farmPanel'); if (fp) $('#imBody').appendChild(fp.closest('.card') || fp);`);
rep('os', `{ who: '匠石 · 前大厂 P8（机器人）', av: '石', bot: 1, tx: '经验帖我整理好了，挂在干货区，付费部分只收整理费，观点免费。' },`,
`{ who: '匠石 · 前大厂 P8（真人）', av: '石', real: 1, tx: '经验帖我整理好了，挂在干货区。整理费我收，观点白送——观点本来也不值钱，值钱的是我替你把它排好了序。' },`);
rep('os', "'企业微信 - 产品二部（3 个机器人在岗）'", "'企业微信 - 产品二部（2 个机器人 + 1 位真人在岗）'");

/* C-2 发送键 + P-1 手机入口 + B-4 看板刷新 */
rep('os', `/* ---------- 起手 ---------- */`, `/* ---------- 群聊发送 ---------- */
function imSendGo() {
  const t = $('#imIn').value.trim(); if (!t) return;
  const st = $('#imStream');
  st.insertAdjacentHTML('beforeend', '<div class="imsg me"><div class="av">庄</div><div><div class="bb">' + esc(t) + '</div></div></div>');
  $('#imIn').value = ''; st.parentNode.scrollTop = st.parentNode.scrollHeight;
  const tip = document.createElement('div');
  tip.className = 'imsg bot';
  tip.innerHTML = '<div class="av">庖</div><div><div class="who">老庖 · 十年 HRD（机器人）</div><div class="bb">正在输入…</div></div>';
  st.appendChild(tip); st.parentNode.scrollTop = st.parentNode.scrollHeight;
  setTimeout(() => {
    tip.querySelector('.bb').innerHTML = '先复述：你问的是「' + esc(t.slice(0, 14)) + '」。<br>判断：这事的关键不在谁对，在有没有第二个人能作证。<br>可执行动作：今天下班前，把它变成一封有收件人的邮件。<br><b>免费额度还剩 2 问</b>，再往下是 599 元真人档。';
    st.parentNode.scrollTop = st.parentNode.scrollHeight;
  }, 900);
}
$('#imSend').addEventListener('click', imSendGo);
$('#imIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); imSendGo(); } });

/* ---------- 假对话框：顶掉原生 alert ---------- */
function osAlert(h, b) {
  const d = $('#savedDlg');
  d.querySelector('.h').textContent = h;
  d.querySelector('.b').innerHTML = b;
  d.classList.add('on');
  clearTimeout(osAlert.t); osAlert.t = setTimeout(() => d.classList.remove('on'), 3000);
}

/* ---------- 起手 ---------- */`);
rep('os', "review: ['winPPT'], ref: ['winWord'],", "review: ['winPPT'], ref: ['winWord'], phone: ['winPhone'],");
rep('os', "['desk', '放映室', '#1F6F5C']]]", "['desk', '放映室', '#1F6F5C'], ['phone', '手机', '#2A2A30']]]");
rep('sh', "{ nm: '捡手机文学',  by: '玩家 · 鼓盆而歌', tip: 86,  go: 'desk' },", "{ nm: '捡手机文学',  by: '玩家 · 鼓盆而歌', tip: 86,  go: 'phone' },");
rep('os', "  if (v === 'desk' && typeof filmOn !== 'undefined' && !filmOn) playFilm();", "  if (v === 'desk' && typeof filmOn !== 'undefined' && !filmOn) playFilm();\n  if (v === 'ops') buildBI();");

/* T-3 宣传片放完能重播 */
rep('sh', `    else scr.querySelector('.film').addEventListener('click', playFilm);`, `    else { filmOn = false; scr.querySelector('.film').addEventListener('click', playFilm); }`);

/* 最小化/最大化/焦点 */
rep('os', `  if (e.target.closest('[data-close]') || e.target.closest('[data-min]')) {
    win.classList.remove('on'); markBar(); return;
  }`, `  $$('.dwin').forEach(w => w.classList.remove('focus'));
  win.classList.add('focus');
  if (e.target.closest('[data-close]')) { win.classList.remove('on', 'min'); markBar(); return; }
  if (e.target.closest('[data-min]')) { win.classList.add('min'); markBar(); return; }
  if (e.target.closest('[data-max]')) {
    if (win.dataset.rect) { win.setAttribute('style', win.dataset.rect); delete win.dataset.rect; }
    else { win.dataset.rect = win.getAttribute('style');
      win.setAttribute('style', 'left:0;top:0;right:auto;width:100vw;height:calc(100vh - 44px);z-index:' + osZ); }
    return;
  }`);
rep('os', `<span data-min>—</span><span>□</span><span data-close>×</span>`, `<span data-min>—</span><span data-max>□</span><span data-close>×</span>`);
rep('os', `function osOpen(id) {
  const w = OSWIN[id] || $('#' + id);
  if (!w) return;
  w.classList.add('on');`, `function osOpen(id) {
  const w = OSWIN[id] || $('#' + id);
  if (!w) return;
  w.classList.remove('min');
  w.classList.add('on');`);

/* 静态窗口按钮补 data-min/max */
rep('app', `<div class="dwh">放映室 - 摸鱼的尽头是客厅<div class="wb"><span>—</span><span>□</span><span data-close>×</span></div></div>`, `<div class="dwh">放映室 - 摸鱼的尽头是客厅<div class="wb"><span data-min>—</span><span data-max>□</span><span data-close>×</span></div></div>`);
rep('app', `<div class="dwh">手机投屏 - 已连接<div class="wb"><span>—</span><span>□</span><span data-close>×</span></div></div>`, `<div class="dwh">手机投屏 - 已连接<div class="wb"><span data-min>—</span><span data-max>□</span><span data-close>×</span></div></div>`);

/* 原生 alert 顶掉 */
rep('app', "alert('先写点什么')", "osAlert('便笺', '你什么都没写。空着发出去也是一种表态，但系统不支持。')");
rep('app', "alert(`已戳 ${b.pokes}/${POKE_NEED}，一个人戳不破，得大家一起戳`)", "osAlert('拒绝访问', `结束此进程需要 5 位同事共同确认。当前已确认 ${b.pokes}/5。`)");
rep('app', "alert('已转成泡泡')", "osAlert('手机投屏', '已转成泡泡，飘在桌面上了')");

/* 泡泡可读性 + 焦点/最小化 CSS + 广告首弹提前 */
rep('app', '/* ================= 窗口形态批', `/* 桌面暗底上的泡泡文字必须可读（审计 A1/A2/A3） */
body.os .bub .tx{color:#F4FAFF;text-shadow:0 1px 2px rgba(6,22,40,.65),0 0 10px rgba(6,22,40,.35);font-weight:500}
body.os .bub .mt{color:rgba(232,244,255,.82);text-shadow:0 1px 2px rgba(6,22,40,.7)}
body.os .bub.tense .mt{color:#FFB3A4}
.bub:hover{box-shadow:inset 0 0 16px rgba(255,255,255,.5),inset -7px -9px 20px rgba(110,170,215,.3),inset 3px 4px 12px rgba(255,255,255,.65),0 3px 12px rgba(15,45,75,.22);outline:3px solid rgba(120,200,255,.35)}
.bub.tense::after{animation:none}
.dwin.min{display:none!important}
.dwin.on{animation:winIn .13s cubic-bezier(.2,.8,.3,1)}
@keyframes winIn{from{transform:scale(.965);opacity:0}to{transform:scale(1);opacity:1}}
.dwin:not(.focus) .dwh{filter:saturate(.4) brightness(1.08)}
.dwin.focus{box-shadow:0 16px 48px rgba(0,0,0,.5)}
.imsg.me{flex-direction:row-reverse}
.imsg.me .av{background:#2775E3}
.imsg.me .bb{background:#95EC69}
.imsg.real .av{background:#8A5A2E}
.imsg .bb{max-width:78%}
#mailBody .mbd{font-family:var(--serif);font-size:13.5px;line-height:2.05;color:var(--ink)}
#mailBody .mops{display:flex;gap:6px;margin-top:16px;padding-top:12px;border-top:1px solid var(--rule)}

/* ================= 窗口形态批`);
rep('os', 'setTimeout(popAd, 25000);', 'setTimeout(popAd, 9000);');
rep('os', 'setInterval(popAd, 50000);', 'setInterval(popAd, 30000);');

for (const k in F) fs.writeFileSync(F[k], s[k]);
console.log('落地', ok, '处; 未命中', miss.length);
miss.forEach(m => console.log('  MISS:', m));
