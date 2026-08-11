// 爽文背单词 · Word「拼写和语法检查」
// 真 Word 的拼写检查就是「一个词 + 三个建议 + 更改/忽略」，和三选一答题是同一个控件。
// 深色鎏金保留为文档主题底（haswg 继续生效），读起来是"一份被打开的深色文档"。
(function () {
  'use strict';
  var K = window.BPKit;
  if (!K) return;

  // ---- 词库：英文词 + 正解词义 + 两个像模像样的错项，tx 是那句霸总爽文 ----
  // 中文文档里夹一个英文单词，Word 本来就会画红波浪线 —— 出题框和「不在词典中」是同一个控件
  var DATA = [
    { w: 'redundant', ok: '冗余的、多余的', no: ['红色的、醒目的', '必需的、不可替代的'], tx: '他冷笑一声：“redundant？”全场死寂，三年前被裁掉的他坐在谈判桌主位。' },
    { w: 'severance', ok: '遣散费', no: ['严重程度分级', '年终奖金系数'], tx: 'HR 递来 severance 方案，他看完只说：“把利息也算上。”' },
    { w: 'headcount', ok: '编制人数', no: ['员工体检项目', '人事主管的职级'], tx: '老板说 headcount 冻结，他打开表格：冻结的是你们，不是我的晋升。' },
    { w: 'attrition', ok: '人员流失', no: ['考勤打卡记录', '注意力集中程度'], tx: 'attrition 曲线一路上扬，董事会终于发现留下的都是会点头的人。' },
    { w: 'probation', ok: '试用期', no: ['公开表彰', '项目立项审批'], tx: 'probation 还没结束，他已经给 CEO 做完了季度复盘。' },
    { w: 'escalate', ok: '升级上报处理', no: ['自动扶梯上行', '逐级压缩预算'], tx: '对方让他别 escalate，他把邮件抄送了全公司。' },
    { w: 'align', ok: '对齐、达成一致', no: ['分派任务', '单独约谈'], tx: '大家 align 了三小时，最后发现只有他的目标和奖金对齐。' },
    { w: 'bandwidth', ok: '精力带宽', no: ['公司网速上限', '工位过道的宽度'], tx: '领导问还有没有 bandwidth，他把日历摊开：只剩离职面试。' },
    { w: 'leverage', ok: '杠杆、筹码', no: ['离职证明', '平级调动'], tx: '他没有背景，只有 leverage：客户的续约合同在他抽屉里。' },
    { w: 'synergy', ok: '协同效应', no: ['一款能量饮料', '合成材料的强度'], tx: '两个部门谈 synergy，最后协同出来一张加班排班表。' },
    { w: 'pipeline', ok: '项目管线、储备', no: ['办公楼的供水管道', '打卡机前排的队'], tx: 'pipeline 看似满满，真正能落地的只有他的辞职信。' },
    { w: 'churn', ok: '客户流失率', no: ['搅拌、打发奶油', '季度营收增速'], tx: 'churn 报表红得发亮，老板却要求把红色改成“积极”。' },
    { w: 'onboarding', ok: '入职引导流程', no: ['登机值机手续', '获得董事会席位'], tx: '新人 onboarding 第一天就学会了如何绕过三层审批。' },
    { w: 'offboarding', ok: '离职交接', no: ['把会议改到线下', '取消出差计划'], tx: 'offboarding 会议上，他把所有坑标成了自己的名字。' },
    { w: 'KPI', ok: '关键绩效指标', no: ['每千次曝光成本', '键盘布局标准'], tx: 'KPI 写着“保持稳定”，他稳定地拿下了最大客户。' },
    { w: 'OKR', ok: '目标与关键结果', no: ['一次性动态密钥', '海外汇款行号'], tx: 'OKR 复盘结束，他的 O 只有一个：离开这间会议室。' },
    { w: 'stakeholder', ok: '利益相关者', no: ['持股最多的那个人', '会议记录员'], tx: 'stakeholder 们投票选方案，最后客户一句话决定一切。' },
    { w: 'deliverable', ok: '交付物', no: ['可以外送的餐品', '能准点下班的岗位'], tx: 'deliverable 按时交了，唯一没交的是他的耐心。' },
    { w: 'bottleneck', ok: '瓶颈、卡点', no: ['瓶装水供应商', '颈椎病的职业叫法'], tx: '大家找 bottleneck 找了半天，发现瓶颈就是那个不批预算的人。' },
    { w: 'scope creep', ok: '需求范围失控蔓延', no: ['望远镜的爬行支架', '监控摄像头的盲区'], tx: 'scope creep 一路长大，最后把“顺手”变成了一个新部门。' },
    { w: 'burnout', ok: '职业倦怠、耗竭', no: ['服务器过热宕机', '年会上的烧烤环节'], tx: 'burnout 体检报告出来，他决定把加班当成历史资料。' },
    { w: 'benchmark', ok: '对标基准', no: ['长椅上的刻痕', '银行的贷款利率'], tx: 'benchmark 说行业都这样，他问：“那行业都错呢？”' },
    { w: 'retention', ok: '留存、留住人', no: ['个税代扣比例', '会议纪要的保密等级'], tx: '公司研究 retention，他的办法是给员工真正的周末。' },
    { w: 'ownership', ok: '主人翁意识、担责', no: ['房产证', '船舶所有权登记'], tx: 'ownership 不是背锅，他在会上把责任和资源一起领走。' }
  ];

  // 批注人：领导在你文档上批注「这个词你用错了」，比红框疼十倍
  var CRIT = [
    ['王总', '这个词你用错了，下次开会前先查一下。'],
    ['HR 李姐', '措辞不专业，建议按公司术语手册修改。'],
    ['实习生小张', '啊？我一直以为是另一个意思……'],
    ['张工', '这句我看了三遍，还是没懂你想说什么。']
  ];
  var PRAISE = [
    ['王总', '这几处用词很到位，转给其他部门参考。'],
    ['HR 李姐', '术语使用规范，建议纳入新人培训材料。']
  ];

  // 三档难度 = 真 Word「写作风格」下拉的三个选项
  var LEVELS = [
    { k: 'a', name: '仅拼写', sec: 15 },
    { k: 'b', name: '拼写和语法', sec: 10 },
    { k: 'c', name: '语法和优化', sec: 6 }
  ];
  var ROUND = 8;

  K.ready(function () {
    var h = K.shell({
      win: 'winWordGame',
      title: '爽文连载_第37章_未删减.docx - Word',
      size: 'width:640px;height:500px',
      crumb: false,
      side: true,
      save: 'word',
      onPause: onPause
    });
    if (!h) return;

    var sv = h.save, hud = h.hud, sfx = h.sfx, fx = h.fx;
    var lv = LEVELS.filter(function (x) { return x.k === sv.get('lv', 'b'); })[0] || LEVELS[1];
    var queue = [], cur = null, streak = 0, earn = 0, right = 0, wrong = 0;
    var st = 'intro', locked = false, timer = null;

    h.css(
      '.dwb{padding:0;background:#F5F6F7}' +
      '.k-stage{padding:0;background:#1B1D26;display:flex;flex-direction:column}' +
      '&.haswg .k-stage{background:linear-gradient(rgba(18,20,30,.9),rgba(14,16,24,.95)),url(assets/wordgame-bg.jpg) center/cover}' +
      '.k-st{flex:1;min-height:0}' +
      '.k-st.on{display:flex;flex-direction:column}' +
      '.k-side{background:#FAFAFA}' +
      '.k-note.bad{border-left-color:#C43E1C}' +
      '.k-note.good{border-left-color:#4E8A4E}' +
      '.k-bar i{background:var(--g-2)}' +
      '.dwt button.on{background:var(--word-blue);border-color:var(--word-blue);color:#fff}' +

      '.wg-dlg{flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;padding:12px 14px;overflow:auto;color:#DDD6C4}' +
      '.wg-lb{font-size:11.5px;color:#9A927F}' +
      '.wg-lb u{text-decoration:underline}' +
      '.wg-lb b{color:#E8D9B0;font-family:var(--mono);font-size:12.5px;margin-left:2px}' +
      // 「不在词典中」文本框：真 Word 这里就是一个只读多行框 + 红波浪线
      '.wg-ctx{position:relative;background:#12141C;border:1px solid #3A3628;border-radius:3px;padding:10px 12px;' +
      '  font-family:var(--kai);font-size:15px;line-height:1.9;color:#E8E2D2;min-height:52px}' +
      '.wg-ctx em{font-style:normal;font-weight:700;color:#F0C674;font-family:var(--mono);' +
      '  text-decoration:underline;text-decoration-style:wavy;text-decoration-color:#E06C6C;text-underline-offset:4px}' +
      '.wg-sug{display:flex;flex-direction:column;gap:5px}' +
      '.wg-op{display:block;width:100%;text-align:left;font-size:13px;line-height:1.6;cursor:pointer;' +
      '  padding:8px 11px;border-radius:4px;font-family:var(--ui);' +
      '  color:#DDD6C4;background:rgba(28,26,38,.72);border:1px solid rgba(214,178,106,.28)}' +
      '.wg-op:hover{border-color:var(--g-3);background:rgba(40,37,52,.85)}' +
      '.wg-op.good{background:#2E5A38;border-color:#5FBF77;color:#DFFFE8}' +
      '.wg-op.bad{background:#5A2E2E;border-color:#BF5F5F;color:#FFE0E0}' +
      '.wg-op[disabled]{cursor:default}' +
      // 扫描条：Word 检查文档时本来就有进度指示，倒计时藏在这儿不穿帮
      '.wg-scan{margin-top:auto;display:flex;align-items:center;gap:9px;font-size:11px;color:#8C8574;padding-top:6px}' +
      '.wg-scan .tr{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.09);overflow:hidden}' +
      '.wg-scan .tr b{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--g-2),var(--g-4))}' +
      '.wg-act{display:flex;gap:8px;align-items:center;padding-top:2px}' +
      '.wg-act .hint{font-size:11.5px;color:#9A927F}' +

      '.wg-pane{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;justify-content:center;' +
      '  gap:9px;padding:22px 26px;color:#DDD6C4}' +
      '.wg-t{font-size:16px;font-weight:700;color:#E8D9B0}' +
      '.wg-p{font-size:13px;line-height:1.9;color:#BDB6A4}' +
      '.wg-p b{color:#F0C674;font-weight:600}' +
      '.wg-kv{display:flex;gap:22px;flex-wrap:wrap;font-size:12px;color:#9A927F;padding:8px 0}' +
      '.wg-kv em{display:block;font-style:normal;font-size:22px;color:var(--g-5);font-weight:700;line-height:1.5}' +
      '.wg-pane .wg-act{margin-top:6px}'
    );

    // ---------- HUD ----------
    function paintTool() {
      var btns = LEVELS.map(function (x) {
        return '<button data-lv="' + x.k + '"' + (x.k === lv.k ? ' class="on"' : '') +
          (st === 'play' ? ' disabled' : '') + '>' + x.name + '</button>';
      }).join('');
      var main = st === 'play'
        ? '<button class="rbtn wg-stop">结束校对</button>'
        : '<button class="rbtn gold wg-start">' + (st === 'over' ? '重新校对' : '开始校对') + '</button>';
      hud.tool('<span class="sp2">写作风格：</span>' + btns + main,
        st === 'play' ? '第 ' + (ROUND - queue.length + 1) + '/' + ROUND + ' 处 · 中文(中国)' : '校对语言：中文(中国)');
    }
    function paintFoot() {
      var done = ROUND - queue.length;
      hud.foot(
        st === 'play' ? ['第 ' + (done + 1) + '/' + ROUND + ' 处', '连击 x' + streak, '装逼值 ' + K.swagger.get()]
                      : ['共 ' + ROUND + ' 处', '装逼值 ' + K.swagger.get() + ' · ' + K.swagger.rankName()],
        '校对完成度 ' + Math.round(done / ROUND * 100) + '%');
      hud.bar(done / ROUND * 100);
    }
    function paintTitle() { hud.title(K.swagger.rankName(), st === 'play'); }
    function paintAll() { paintTool(); paintFoot(); paintTitle(); }

    // ---------- 出题 ----------
    function ask() {
      if (!queue.length) return end();
      cur = queue[0];
      locked = false;
      var w = K.esc(cur.w);
      // 爽文原句照抄，只把那个英文词挑出来画红波浪线
      var carry = K.esc(cur.tx).split(w).join('<em>' + w + '</em>');
      var opts = K.shuffle([{ t: cur.ok, k: 1 }, { t: cur.no[0], k: 0 }, { t: cur.no[1], k: 0 }]);

      h.states.play.innerHTML =
        '<div class="wg-dlg">' +
        '<div class="wg-lb">不在词典中(<u>N</u>)：<b>' + w + '</b></div>' +
        '<div class="wg-ctx">' + carry + '</div>' +
        '<div class="wg-lb">词义建议(<u>G</u>)：</div>' +
        '<div class="wg-sug">' + opts.map(function (o) {
          return '<button class="wg-op" data-k="' + o.k + '">' + K.esc(o.t) + '</button>';
        }).join('') + '</div>' +
        '<div class="wg-act" id="wgAct"></div>' +
        '<div class="wg-scan"><span>正在检查文档…</span><i class="tr"><b></b></i>' +
        '<span>每处 ' + lv.sec + ' 秒</span></div>' +
        '</div>';

      timer = h.timer(h.states.play.querySelector('.wg-scan b'), {
        sec: lv.sec,
        onEnd: function () { judge(null); }
      });
      timer.start(lv.sec);
      // 出题那一刻窗口可能正关着（答对后 820ms 才出下一题），此时不能让表空跑
      if (K.pause.isPaused(h.win)) timer.pause();
      sfx.play('key');
      fx.deal(h.states.play.querySelectorAll('.wg-op'), { step: 0.05, sound: false });
      paintAll();
    }

    // ---------- 判定：btn 为 null 表示超时 ----------
    function judge(btn) {
      if (locked || st !== 'play') return;
      locked = true;
      timer.freeze();
      K.qa('.wg-op', h.states.play).forEach(function (b) { b.disabled = true; });
      var okBtn = h.states.play.querySelector('.wg-op[data-k="1"]');

      if (btn && btn.dataset.k === '1') {
        right++; streak++;
        var gain = streak >= 3 ? 3 : 1;
        btn.classList.add('good');
        fx.pop(btn);
        sfx.play('ok');
        K.swagger.add(gain);
        earn += gain;
        sv.max('best', streak);
        if (streak >= 3) fx.float(h.states.play.querySelector('.wg-ctx'), '连装 x' + streak + '　+' + gain);
        if (streak === 3 || streak === 6) {
          var p = PRAISE[(streak / 3 - 1) % PRAISE.length];
          hud.note(p[0], p[1], 'good');
        }
        queue.shift();
        paintAll();
        setTimeout(function () { if (st === 'play') ask(); }, 820);
        return;
      }

      streak = 0; wrong++;
      if (btn) { btn.classList.add('bad'); fx.shake(btn); }
      if (okBtn) okBtn.classList.add('good');
      sfx.play('err');
      // 讲评搬到右侧批注栏：这是别人对你这份文档的评价，不是一个红框
      var c = btn ? CRIT[Math.random() * CRIT.length | 0] : ['会议纪要', '此处沉默了 ' + lv.sec + ' 秒，已按「无异议」记录。'];
      hud.note(c[0], c[1] + '　正解：' + cur.ok + '（该词已重新排队）', 'bad');
      queue.push(queue.shift());
      var act = h.states.play.querySelector('#wgAct');
      if (act) act.innerHTML = '<button class="rbtn wg-next">继续校对</button>' +
        '<span class="hint">右侧批注栏有人回复了你。</span>';
      paintAll();
    }

    // ---------- 结算：真 Word 查完就是这句 + 可读性统计 ----------
    function end() {
      st = 'over';
      if (timer) timer.stop();
      var total = right + wrong;
      var acc = total ? Math.round(right / total * 100) : 0;
      h.states.over.innerHTML =
        '<div class="wg-pane" id="wgOver">' +
        '<div class="wg-t">拼写和语法检查已完成。</div>' +
        '<p class="wg-p">本次共校对 <b>' + ROUND + '</b> 处，采纳建议 <b>' + right + '</b> 处，' +
        '误判 <b>' + wrong + '</b> 处。写作风格：<b>' + K.esc(lv.name) + '</b>。</p>' +
        '<div class="wg-kv">' +
        '<div>本次装逼值<em>+' + earn + '</em></div>' +
        '<div>准确率<em>' + acc + '%</em></div>' +
        '<div>最佳连击<em>x' + sv.get('best', 0) + '</em></div>' +
        '<div>当前称号<em>' + K.esc(K.swagger.rankName()) + '</em></div>' +
        '</div>' +
        '<p class="wg-p">可读性统计：总装逼值 <b>' + K.swagger.get() + '</b>，' +
        '本文档已可在任意会议中安全朗读。</p>' +
        '<div class="wg-act"><button class="rbtn gold wg-start">重新校对</button></div>' +
        '</div>';
      h.go('over');
      paintAll();
      fx.stamp(h.states.over.querySelector('#wgOver'), acc >= 75 ? '已校对' : '待复核');
      hud.note('审阅', '本次校对结束，采纳 ' + right + ' / ' + ROUND + '。' +
        (acc >= 75 ? '文档可以发出去了。' : '建议再过一遍。'), acc >= 75 ? 'good' : '');
    }

    function intro() {
      st = 'intro';
      if (timer) timer.stop();
      h.states.intro.innerHTML =
        '<div class="wg-pane">' +
        '<div class="wg-t">拼写和语法检查</div>' +
        '<p class="wg-p">本章共有 <b>' + ROUND + '</b> 处英文词不在词典中。' +
        'Word 无法确定它们在这段爽文里到底是什么意思，建议逐一确认。</p>' +
        '<div class="wg-kv">' +
        '<div>审阅人段位<em>' + K.esc(K.swagger.rankName()) + '</em></div>' +
        '<div>累计装逼值<em>' + K.swagger.get() + '</em></div>' +
        '<div>历史最佳连击<em>x' + sv.get('best', 0) + '</em></div>' +
        '</div>' +
        '<p class="wg-p">当前写作风格 <b>' + K.esc(lv.name) + '</b>，每处限时 <b>' + lv.sec + '</b> 秒。' +
        '连对三处起，每处按三倍计。</p>' +
        '<div class="wg-act"><button class="rbtn gold wg-start">开始校对</button>' +
        '<span class="hint">在工具栏切换写作风格即改难度。</span></div>' +
        '</div>';
      h.go('intro');
      paintAll();
    }

    function newRound() {
      st = 'play';
      earn = 0; streak = 0; right = 0; wrong = 0;
      queue = K.shuffle(DATA.slice()).slice(0, ROUND);
      hud.clearNotes();
      hud.note('Word', '共 ' + ROUND + ' 处待确认。选错的词会重新排队，等着你雪耻。', '');
      h.go('play');
      ask();
    }

    // ---------- 暂停总线：关窗 / 最小化 / 老板键 / 切标签，任一为真都停表 ----------
    // 旧代码判的是 win.style.display==='none'，而 os.js 关窗走的是 classList.remove('on')，永远不成立
    function onPause(p) {
      if (!timer || st !== 'play' || locked) return;
      if (p) timer.pause(); else timer.resume();
    }

    // ---------- 唯一的委托监听：挂在窗上，工具条和正文一起管 ----------
    h.win.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button') : null;
      if (!t || !h.win.contains(t)) return;
      if (t.dataset.lv) {
        if (st === 'play') return;
        lv = LEVELS.filter(function (x) { return x.k === t.dataset.lv; })[0];
        sv.set('lv', lv.k);
        sfx.play('click');
        (st === 'over' ? end : intro)();
        return;
      }
      if (t.classList.contains('wg-start')) { sfx.play('enter'); return newRound(); }
      if (t.classList.contains('wg-stop')) { sfx.play('click'); return end(); }
      if (t.classList.contains('wg-next')) { sfx.play('click'); queue.length ? ask() : end(); return; }
      if (t.classList.contains('wg-op') && !locked) judge(t);
    });

    h.win.__game = {
      timer: function () { return timer; },
      state: function () { return st; },
      remain: function () { return timer ? timer.remain() : -1; }
    };

    intro();
  });
})();
