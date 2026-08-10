// 爽文背单词 · 装逼值竞技场
// 接管 #wordGame：覆盖 innerHTML 后旧闪卡按钮消失，旧逻辑自然失效（不改 app.html）
(function () {
  'use strict';
  var box = document.getElementById('wordGame');
  if (!box) return;

  // ---- 词库：黑话 + 正解（一本正经的大实话）+ 两个像模像样的错项 ----
  var DATA = [
    { w: '抓手', ok: '我也不知道从哪开始，先说个词稳住场面', no: ['起重机吊臂末端的挂钩部件', '抓住用户的手，指亲密式营销'] },
    { w: '对齐', ok: '开一小时会，确认大家还是各干各的', no: ['Word 里的左对齐右对齐', '把工位桌椅摆整齐再开工'] },
    { w: '颗粒度', ok: '把一句话拆成十页 PPT 的能力', no: ['咖啡豆研磨的粗细程度', '屏幕像素密度的行业叫法'] },
    { w: '闭环', ok: '事情没做成，但汇报做完了', no: ['电路接通形成完整回路', '环形跑道跑满一整圈'] },
    { w: '赋能', ok: '不给钱不给人，给你打一针鸡血', no: ['给设备充电的正式说法', '授予下级行政审批权限'] },
    { w: '心智', ok: '让用户还没比价就先想起你，俗称洗脑', no: ['心理智力测验的简称', '冥想课程里的专注力概念'] },
    { w: '底层逻辑', ok: '加上这四个字，废话听着像哲学', no: ['操作系统内核的运行原理', '大楼地基的承重设计方案'] },
    { w: '组合拳', ok: '一个办法不行，就同时上八个不行的办法', no: ['拳击中的连续击打技术', '健身房的搏击操团课名'] },
    { w: '护城河', ok: '暂时没对手抄，因为这生意不赚钱', no: ['古代城池外的防御水道', '小区外围的景观水系工程'] },
    { w: '方法论', ok: '把运气总结成步骤，供别人复现失败', no: ['哲学系的一门必修课', '论文里介绍实验设计的章节'] },
    { w: 'ROI', ok: '投入是真的，回报是 PPT 里的', no: ['Rate Of Interest，银行利率', 'Region Of Interest，图像识别术语'] },
    { w: 'OKR', ok: 'KPI 换了个马甲，加班照旧', no: ['硅谷一款考勤打卡软件', 'Office Key Register，办公钥匙台账'] },
    { w: 'MVP', ok: '先上线个半成品，锅让用户背', no: ['比赛里的最有价值球员', '年度销量冠军产品的评选称号'] },
    { w: 'PMF', ok: '传说中的状态，谁也没见过但都说快了', no: ['产品经理资格认证考试', '一类私募基金的英文缩写'] },
    { w: 'SOP', ok: '把没人想干的活写成文档，显得有人在干', no: ['肥皂剧 Soap Opera 的缩写', '医疗器械消毒流程的国标编号'] },
    { w: 'B端', ok: '客户很少，但每单都得陪喝酒', no: ['Bilibili 深度用户的简称', '数据线较宽的那一头'] },
    { w: '私域', ok: '把客户拉进群，然后每天骚扰他们', no: ['个人隐私领域的法律术语', '小区业主的私家花园区域'] },
    { w: '飞轮', ok: '一个还没转起来的循环，PPT 上画成圆的', no: ['健身房的动感单车别称', '发动机里储存动能的部件'] },
    { w: '破圈', ok: '在自己人群里火了，幻想外面也知道', no: ['游戏里突破包围圈的战术', '把朋友圈设置成对外公开'] },
    { w: '内卷', ok: '大家一起加班，产出不变，工资也不变', no: ['一种蛋糕卷的卷制手法', '发梢自然内扣的发型'] },
    { w: '降本增效', ok: '裁掉同事，他的活归你', no: ['双面打印省纸的环保倡议', '减脂增肌的健身训练计划'] },
    { w: '向上管理', ok: '把哄老板做成一门学问', no: ['电梯维保行业的作业术语', '组织架构图从下往上绘制'] },
    { w: '错峰摸鱼', ok: '别人忙时你休息，别人休息时你假装忙', no: ['避开周末去钓鱼的休闲方式', '渔业部门的分时捕捞政策'] },
    { w: '优先级', ok: '所有事都是 P0，等于没有 P0', no: ['机场贵宾优先登机的等级', '操作系统进程调度的参数'] }
  ];

  var RANKS = [[100, '庄周'], [60, '装逼宗师'], [30, '黑话十级'], [10, '会话嘴替'], [0, '职场小白']];
  var SNARK = ['同事投来同情的目光。', '老板皱了皱眉，记在了小本本上。', '实习生没忍住笑出了声。', '会议纪要里悄悄删掉了你这句。'];
  var ROUND = 8, SEC = 10;

  var swagger = parseInt(localStorage.getItem('bp-swagger'), 10) || 0;
  var queue = [], cur = null, streak = 0, earn = 0, tmr = 0, locked = false, needRe = false;

  function rank(n) { for (var i = 0; i < RANKS.length; i++) if (n >= RANKS[i][0]) return RANKS[i][1]; return RANKS[4][1]; }
  function save() {
    localStorage.setItem('bp-swagger', String(swagger));
    var el = document.getElementById('swagger');
    if (el) el.textContent = '今日装逼值 ' + swagger;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---- 样式一次性注入（选择器全部挂在 #winWordGame 下）----
  var st = document.createElement('style');
  st.textContent =
    '#winWordGame .wg-head{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;margin-bottom:8px;border-radius:6px;' +
      'font-size:12px;color:#C9B370;background:rgba(214,178,106,.08);border:1px solid rgba(214,178,106,.18)}' +
    '#winWordGame.haswg .wg-head{background:linear-gradient(rgba(18,20,30,.62),rgba(14,16,24,.82)),url(assets/wordgame-bg.jpg) center/cover;color:#E8D9B0}' +
    '#winWordGame .wg-word{font-size:30px;font-weight:bold;text-align:center;color:#E8D9B0;padding:14px 0 4px;position:relative}' +
    '#winWordGame .wg-timer{height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden;margin:10px 0}' +
    '#winWordGame .wg-timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#D6B26A,#E8D9B0);transition:width ' + SEC + 's linear}' +
    '#winWordGame .wg-timer i.run{width:0}' +
    '#winWordGame .wg-choice{display:block;width:100%;margin:6px 0;padding:9px 12px;text-align:left;font-size:13px;cursor:pointer;' +
      'color:#DDD6C4;background:rgba(28,26,38,.7);border:1px solid rgba(214,178,106,.28);border-radius:6px}' +
    '#winWordGame .wg-choice:active{transform:scale(.97)}' +
    '#winWordGame .wg-choice.good{background:#2E5A38;border-color:#5FBF77;color:#DFFFE8;animation:wgPop .45s}' +
    '#winWordGame .wg-choice.bad{background:#5A2E2E;border-color:#BF5F5F;color:#FFE0E0;animation:wgShake .4s}' +
    '#winWordGame .wg-combo{position:absolute;right:4px;top:2px;font-size:12px;color:#FFD76A;animation:wgFlash 1s forwards}' +
    '#winWordGame .wg-fb{margin-top:8px;padding:9px 10px;font-size:12px;line-height:1.7;color:#E8D9B0;' +
      'background:rgba(214,178,106,.1);border:1px dashed rgba(214,178,106,.4);border-radius:6px}' +
    '#winWordGame .wg-end{text-align:center;padding:18px 6px;color:#E8D9B0}' +
    '#winWordGame .wg-end .t{font-size:16px;font-weight:bold;margin-bottom:10px}' +
    '#winWordGame .wg-end .g{font-size:26px;color:#FFD76A;margin:6px 0}' +
    '#winWordGame .wg-end .r{font-size:13px;color:#C9B370;margin-bottom:14px}' +
    '@keyframes wgPop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}' +
    '@keyframes wgShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}' +
    '@keyframes wgFlash{0%{opacity:0;transform:translateY(8px) scale(.7)}25%{opacity:1;transform:none}75%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}';
  document.head.appendChild(st);

  // ---- 出题 ----
  function ask() {
    clearTimeout(tmr);
    if (!queue.length) return end();
    cur = queue[0];
    locked = false;
    var opts = shuffle([{ t: cur.ok, k: 1 }, { t: cur.no[0], k: 0 }, { t: cur.no[1], k: 0 }]);
    var html = '<div class="wg-head"><span>本局剩 ' + queue.length + ' 词</span><span>连击 ' + streak + '</span><span>境界·' + rank(swagger) + '</span></div>' +
      '<div class="wg-word">' + cur.w + '</div>' +
      '<div class="wg-timer"><i></i></div>';
    for (var i = 0; i < 3; i++) html += '<button class="wg-choice" data-k="' + opts[i].k + '">' + opts[i].t + '</button>';
    box.innerHTML = html;
    var bar = box.querySelector('.wg-timer i');
    void bar.offsetWidth; // 强制回流，让 10s 过渡生效（唯一计时：一个 setTimeout，无 interval）
    bar.classList.add('run');
    tmr = setTimeout(function () { judge(null); }, SEC * 1000);
  }

  // ---- 判定：btn 为 null 表示超时 ----
  function judge(btn) {
    if (locked) return;
    locked = true;
    clearTimeout(tmr);
    var bar = box.querySelector('.wg-timer i');
    if (bar) { bar.style.width = getComputedStyle(bar).width; bar.style.transition = 'none'; } // 冻结进度条
    var okBtn = box.querySelector('.wg-choice[data-k="1"]');
    if (btn && btn.dataset.k === '1') { // 答对
      streak++;
      var gain = 1;
      btn.classList.add('good');
      if (streak >= 3) {
        gain += 2;
        var word = box.querySelector('.wg-word');
        if (word) word.insertAdjacentHTML('beforeend', '<span class="wg-combo">连装 x' + streak + '！+2</span>');
      }
      swagger += gain; earn += gain; save();
      queue.shift();
      tmr = setTimeout(ask, 900);
    } else { // 答错 / 超时
      streak = 0;
      if (btn) btn.classList.add('bad');
      if (okBtn) okBtn.classList.add('good');
      var line = btn ? SNARK[Math.random() * SNARK.length | 0] : '你卡壳了。会议室陷入沉默。';
      box.insertAdjacentHTML('beforeend',
        '<div class="wg-fb">' + line + '<br>正解：' + cur.ok +
        '<br><span style="color:#C9B370">这个词已重新排队，等着你雪耻。</span></div>' +
        '<button class="wg-choice wg-next" style="text-align:center">下一题</button>');
      queue.push(queue.shift()); // 错词排到队尾
    }
  }

  // ---- 结算 ----
  function end() {
    clearTimeout(tmr);
    box.innerHTML = '<div class="wg-end"><div class="t">— 本局结算 —</div>' +
      '<div class="g">本局装逼值收入 +' + earn + '</div>' +
      '<div class="r">总装逼值 ' + swagger + ' · 当前称号「' + rank(swagger) + '」</div>' +
      '<button class="wg-choice wg-restart" style="text-align:center">再来一局</button></div>';
  }

  function newRound() {
    earn = 0; streak = 0;
    queue = shuffle(DATA.slice()).slice(0, ROUND);
    ask();
  }

  // ---- 唯一的委托点击监听 ----
  box.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null;
    if (!t) return;
    if (t.classList.contains('wg-restart')) return newRound();
    if (t.classList.contains('wg-next')) return ask();
    if (t.classList.contains('wg-choice') && !locked) judge(t);
  });

  // ---- 窗口关闭时清掉计时器，重开时补出当前题 ----
  var win = document.getElementById('winWordGame');
  if (win && window.MutationObserver) {
    new MutationObserver(function () {
      var hidden = win.style.display === 'none';
      if (hidden) { clearTimeout(tmr); if (!locked && cur) needRe = true; }
      else if (needRe) { needRe = false; ask(); }
    }).observe(win, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  save();
  newRound();
})();
