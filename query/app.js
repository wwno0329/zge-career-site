(function () {
  "use strict";

  var CAT = window.CATALOG_DATA;
  var CAREER = window.CAREER_DATA || [];
  var WEEKLY = window.WEEKLY_DATA || {};
  var HIRE = window.HIRE_STATS || {};
  var OUTLOOK = window.OUTLOOK_DATA || {};
  var CLASS_DATA = window.CLASS_DATA || {};
  var EMPLOYMENT = window.EMPLOYMENT || {};
  var CITY_DATA = window.CITY_DATA || [];
  var CURRENT = window.CURRENT_DATA || {};
  var LEVELS = {
    undergrad: { label: "本科", data: CAT.undergrad },
    zhuanke: { label: "专科", data: CAT.vocational.zhuanke },
    graduate: { label: "硕士", data: CAT.graduate }
  };
  var currentLevel = "undergrad";
  var selectedMajor = null;
  var selectedClass = null;
  var hireFilter = false;
  var weeklyFilter = false;
  var cityFilter = false;

  var KW_ALIAS = {
    "电工": ["电气"], "电气": ["电工", "自动化"],
    "财会": ["财务", "会计"], "会计": ["财会", "财务"], "财务": ["财会", "会计"],
    "软件": ["计算机"], "人工智能": ["计算机"], "计算机": ["软件", "人工智能", "大数据", "数据科学"],
    "自动化": ["电气", "控制"], "控制": ["自动化", "电气"],
    "金融": ["经济", "投资"], "经济": ["金融", "贸易"], "贸易": ["国际经济", "经济"],
    "工商管理": ["管理", "市场营销"], "管理": ["工商管理", "市场营销"], "市场营销": ["工商管理", "管理"],
    "机电": ["机械", "电气"], "机械": ["机电", "车辆"], "车辆": ["机械", "汽车"], "汽车": ["车辆"],
    "物流": ["供应链"], "供应链": ["物流"],
    "通信": ["电子信息", "信息工程"], "电子信息": ["通信", "电子"], "电子": ["电子信息", "通信", "微电子"],
    "石油": ["地质", "能源"], "地质": ["石油", "采矿"], "采矿": ["地质", "矿业"],
    "化工": ["化学", "材料"], "化学": ["化工"],
    "制药": ["药学", "药物"], "药学": ["制药", "药物"], "药物": ["药学", "制药"],
    "医学": ["临床", "护理"], "临床": ["医学", "口腔", "中医"], "护理": ["医学"],
    "土木": ["建筑", "工程管理"], "建筑": ["土木"], "工程管理": ["土木", "造价"],
    "能源": ["电气", "新能源"], "新能源": ["能源", "材料"], "材料": ["化工", "新能源"],
    "数学": ["统计", "数据"], "统计": ["数学", "数据"], "数据": ["数学", "统计", "计算机"],
    "语言": ["英语", "外语", "翻译"], "翻译": ["语言", "外语"],
    "法学": ["法律"], "法律": ["法学"],
    "旅游": ["酒店", "会展"], "设计": ["艺术", "视觉"], "教育": ["师范"],
    "新闻": ["传播", "广告"], "传播": ["新闻", "广告"], "心理": ["应用心理"],
    "环境": ["环保", "生态"], "生物": ["生命科学"], "水利": ["水电"], "水电": ["水利", "电气"],
    "信号": ["轨道交通", "通信", "电子信息"],
    "铁道": ["铁路", "交通运输", "轨道交通"], "铁路": ["铁道", "交通运输", "轨道交通"],
    "交通运输": ["铁道", "铁路", "轨道交通", "物流"], "轨道交通": ["铁道", "铁路", "交通运输", "车辆"],
    "农学": ["农业", "园艺", "畜牧", "烟草"], "农业": ["农学"], "园艺": ["农学"], "畜牧": ["农学", "动物"], "烟草": ["农学"],
    "军工": ["兵器", "航空"], "机器人": ["自动化", "机械", "人工智能"], "安全": ["安全工程"],
    "食品": ["食品科学"], "水利": ["水电"]
  };

  function majorRelevant(itemMajors, m) {
    if (!m) return true;
    if (!itemMajors || !itemMajors.length) return false;
    var hay = (m.name + " " + (m.cat || "") + " " + (m.cls || "")).toLowerCase();
    for (var i = 0; i < itemMajors.length; i++) {
      var raw = String(itemMajors[i] || "").trim();
      if (!raw) continue;
      if (raw === "不限" || raw === "不限专业" || raw === "专业不限" || raw === "无专业限制") return true;
      var kw = raw.replace(/类$/, "").toLowerCase();
      if (hay.indexOf(kw) >= 0) return true;
      var aliases = KW_ALIAS[kw] || [];
      for (var j = 0; j < aliases.length; j++) {
        if (hay.indexOf(aliases[j]) >= 0) return true;
      }
    }
    return false;
  }

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function allMajors(levelKey) {
    var lv = LEVELS[levelKey];
    var out = [];
    if (levelKey === "graduate") {
      lv.data.forEach(function (cat) {
        cat.items.forEach(function (it) {
          out.push({ code: it.code, name: it.name, cat: cat.name, catCode: cat.code, cls: "", clsCode: cat.code, note: it.note || "", it: it });
        });
      });
    } else {
      lv.data.forEach(function (cat) {
        cat.classes.forEach(function (cls) {
          cls.majors.forEach(function (m) {
            out.push({ code: m.code, name: m.name, cat: cat.name, catCode: cat.code, cls: cls.name, clsCode: cls.code, note: m.note || "", it: m });
          });
        });
      });
    }
    return out;
  }

  function searchMajors(q) {
    q = q.toLowerCase();
    var res = [];
    allMajors(currentLevel).forEach(function (m) {
      if (m.name.toLowerCase().indexOf(q) >= 0 || m.code.indexOf(q) >= 0 ||
          m.cat.toLowerCase().indexOf(q) >= 0 || m.cls.toLowerCase().indexOf(q) >= 0) {
        res.push(m);
      }
    });
    return res;
  }

  function majorChip(m) {
    var b = el("button", "major-chip", esc(m.name));
    b.title = m.code + (m.note ? " " + m.note : "");
    b.addEventListener("click", function () { selectMajor(m); });
    return b;
  }

  function searchRow(m) {
    var row = el("div", "search-row-item");
    var left = el("div");
    left.innerHTML = "<div class='nm'>" + esc(m.name) + " <span class='cd'>" + esc(m.code) + "</span></div>" +
      "<div class='brd'>" + esc(m.cat) + (m.cls ? " / " + esc(m.cls) : "") + "</div>";
    row.appendChild(left);
    row.appendChild(el("div", "cd", "查看方向 →"));
    row.addEventListener("click", function () { selectMajor(m); });
    return row;
  }

  function renderBrowser() {
    var box = $("#majorBrowser");
    box.innerHTML = "";
    var resHide = $("#result");
    if (resHide) resHide.classList.add("hidden");
    var q = ($("#searchInput").value || "").trim();
    $("#browserHint").textContent = q ? "（只显示匹配的专业，点击查看）" : "（点击展开浏览专业大类，或在上方输入专业名/代码搜索）";

        if (q) {
      var majRes = searchMajors(q);
      if (!majRes.length) {
        box.appendChild(el("div", "empty-state", "没有找到相关专业，换个关键词试试，比如「计算机」「会计」「电气」。" + (currentLevel === "graduate" ? "（硕士按学科门类/学科名称检索）" : "")));
        return;
      }
      var sum = el("div", "search-summary");
      sum.innerHTML = "🔎 为你找到 <b>" + majRes.length + "</b> 个专业" + (majRes.length > 40 ? "（显示前 40 个，可输入更具体的关键词）" : "，点击专业查看就业方向");
      box.appendChild(sum);
      majRes.slice(0, 40).forEach(function (m) { box.appendChild(searchRow(m)); });
      return;
    }

    var lv = LEVELS[currentLevel];
    lv.data.forEach(function (cat) {
      var det = el("details", "cat-group");
      var n = currentLevel === "graduate" ? cat.items.length : cat.classes.reduce(function (s, c) { return s + c.majors.length; }, 0);
      var sum = el("summary");
      sum.innerHTML = "<span>" + esc(cat.name) + "</span><span class='cnt'>" + n + " 个</span>";
      det.appendChild(sum);
      var body = el("div", "cat-body");
      if (currentLevel === "graduate") {
        var wrapG = el("div", "major-chips");
        cat.items.forEach(function (it) {
          wrapG.appendChild(majorChip({ code: it.code, name: it.name, cat: cat.name, catCode: cat.code, cls: "", clsCode: cat.code, note: it.note || "", it: it }));
        });
        body.appendChild(wrapG);
      } else {
        cat.classes.forEach(function (cls) {
          body.appendChild(classRow({ code: cls.code, name: cls.name, cat: cat.name, catCode: cat.code, count: cls.majors.length, cls: cls }));
        });
      }
      det.appendChild(body);
      box.appendChild(det);
    });
  }

  function allClasses(levelKey) {
    var lv = LEVELS[levelKey];
    var out = [];
    lv.data.forEach(function (cat) {
      cat.classes.forEach(function (cls) {
        out.push({ code: cls.code, name: cls.name, cat: cat.name, catCode: cat.code, count: cls.majors.length, cls: cls });
      });
    });
    return out;
  }

  function classRow(cls) {
    var row = el("div", "class-row");
    var info = (CLASS_DATA[currentLevel] || {})[cls.code];
    var brief = info ? info.brief : "";
    if (brief.length > 42) brief = brief.slice(0, 42) + "…";
    row.innerHTML = "<div><div class='nm'>" + esc(cls.name) + " <span class='cnt'>" + cls.count + " 个专业</span></div>" +
      (brief ? "<div class='brd'>" + esc(brief) + "</div>" : "") +
      "</div><div class='go'>查看 →</div>";
    row.addEventListener("click", function () { selectClass(cls); });
    return row;
  }

  function selectClass(cls) {
    if (currentLevel === "graduate") {
      selectMajor({ code: cls.code, name: cls.name, cat: cls.cat, catCode: cls.catCode, cls: "", clsCode: cls.catCode, note: "", it: null });
      return;
    }
    selectedClass = cls;
    renderClassDetail();
    $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderClassDetail() {
    var r = $("#result");
    r.classList.remove("hidden");
    var cls = selectedClass;
    var head = el("div", "result-head");
    head.innerHTML = "<h2>📂 " + esc(cls.name) + "</h2><span class='cd'>" + esc(cls.cat) + "</span><span class='lvl'>" + LEVELS[currentLevel].label + "</span>";
    r.innerHTML = "";
    r.appendChild(head);

    var info = (CLASS_DATA[currentLevel] || {})[cls.code];
    if (info) {
      var cb = el("div", "class-box");
      var ch = "<h3>专业大类就业方向（初稿）</h3>";
      ch += "<div class='field'><b>定位：</b>" + esc(info.brief) + "</div>";
      ch += "<div class='field'><b>对口行业：</b>" + esc((info.industries || []).join("、")) + "</div>";
      ch += "<div class='field'><b>常见岗位：</b>" + esc((info.jobs || []).join("、")) + "</div>";
      if (info.further) ch += "<div class='field'><b>深造方向：</b>" + esc(info.further) + "</div>";
      if (info.skills) ch += "<div class='field'><b>技能/证书建议：</b>" + esc(info.skills) + "</div>";
      cb.innerHTML = ch;
      r.appendChild(cb);
    } else {
      r.appendChild(el("div", "summary-box", "「" + esc(cls.name) + "」的详细就业方向正在整理中，下面可以先浏览该类下的具体专业。"));
    }

    var sub = el("div", "related-box");
    sub.appendChild(el("h3", "", "该类下的 " + cls.count + " 个专业（点具体专业看细分方向）"));
    var wrap = el("div", "major-chips");
    (cls.cls.majors || []).forEach(function (m) {
      wrap.appendChild(majorChip({ code: m.code, name: m.name, cat: cls.cat, catCode: cls.catCode, cls: cls.name, clsCode: cls.code, note: m.note || "", it: m }));
    });
    sub.appendChild(wrap);
    r.appendChild(sub);

    var back = el("div", "class-crumb");
    back.innerHTML = "<a href='javascript:void(0)' class='crumb-link'>← 返回专业大类列表</a>";
    back.querySelector(".crumb-link").addEventListener("click", function () { selectedClass = null; renderBrowser(); });
    r.appendChild(back);
  }

  function relatedMajors(m) {
    var out = [];
    allMajors(currentLevel).forEach(function (x) {
      if (x.code === m.code) return;
      if (currentLevel === "graduate") {
        if (x.catCode === m.catCode) out.push(x);
      } else {
        if (x.clsCode === m.clsCode) out.push(x);
      }
    });
    return out.slice(0, 12);
  }

  function selectMajor(m) {
    selectedMajor = m;
    hireFilter = true;
    weeklyFilter = true;
    cityFilter = true;
    renderResult();
    renderHire();
    renderWeekly();
    renderCities();
    $("#result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderResult() {
    var r = $("#result");
    r.classList.remove("hidden");
    var m = selectedMajor;
    var career = null;
    CAREER.forEach(function (c) {
      if (c.level === currentLevel && c.code === m.code) career = c;
    });
    var head = el("div", "result-head");
    head.innerHTML = "<h2>" + esc(m.name) + "</h2><span class='cd'>" + esc(m.code) + "</span><span class='lvl'>" + LEVELS[currentLevel].label + "</span>";
    r.innerHTML = "";
    r.appendChild(head);

    var clsLink = null;
    if (currentLevel !== "graduate") {
      var clsArr = allClasses(currentLevel);
      for (var ci = 0; ci < clsArr.length; ci++) { if (clsArr[ci].code === m.clsCode) { clsLink = clsArr[ci]; break; } }
    }
    if (clsLink) {
      var crumb = el("div", "class-crumb");
      crumb.innerHTML = "📂 所属专业大类：<a href='javascript:void(0)' class='crumb-link'>" + esc(clsLink.name) + "</a>（点此查看大类详情）";
      crumb.querySelector(".crumb-link").addEventListener("click", function () { selectClass(clsLink); });
      r.appendChild(crumb);
    }
    renderCurrent(r, m); // 当前可报企业（用户最关心，优先展示）

    if (career) {
      r.appendChild(el("div", "summary-box", esc(career.summary)));
      var outlook = OUTLOOK[currentLevel + ":" + m.code];
      if (outlook) {
        var ob = el("div", "outlook-box");
        var oh = "<h3>📈 专业前景解读</h3>";
        if (outlook.status) oh += "<div class='field'><b>现状：</b>" + esc(outlook.status) + "</div>";
        if (outlook.trend) oh += "<div class='field'><b>趋势：</b>" + esc(outlook.trend) + "</div>";
        if (outlook.advice) oh += "<div class='field'><b>建议：</b>" + esc(outlook.advice) + "</div>";
        if (outlook.salary) oh += "<div class='field'><b>薪资参考：</b>" + esc(outlook.salary) + "</div>";
        ob.innerHTML = oh;
        r.appendChild(ob);
      }
      var grid = el("div", "directions");
      career.directions.forEach(function (dir) {
        var card = el("div", "dir-card " + dir.type);
        card.appendChild(el("div", "dir-head", esc(dir.label)));
        dir.items.forEach(function (it) {
          var h = "<h4>" + esc(it.title) + "</h4>";
          h += "<div class='tag-row'>" + (it.positions || []).map(function (p) { return "<span class='tag'>" + esc(p) + "</span>"; }).join("") + "</div>";
          h += "<div class='field'><b>常见单位：</b>" + esc((it.orgs || []).join("、")) + "</div>";
          if (it.req) h += "<div class='field'><b>一般要求：</b>" + esc(it.req) + "</div>";
          if (it.intern) h += "<div class='field'><b>实习/经历建议：</b>" + esc(it.intern) + "</div>";
          if (it.tips) h += "<div class='field'><b>投递提示：</b>" + esc(it.tips) + "</div>";
          card.appendChild(el("div", "dir-item", h));
        });
        grid.appendChild(card);
      });
      r.appendChild(grid);
    } else {
      var clsInfo = null;
      var clsKey = currentLevel === "graduate" ? m.catCode : m.clsCode;
      if (CLASS_DATA[currentLevel] && CLASS_DATA[currentLevel][clsKey]) clsInfo = CLASS_DATA[currentLevel][clsKey];
      if (clsInfo) {
        var cb = el("div", "class-box");
        var ch = "<h3>📂 所属专业类 · " + esc(clsInfo.name) + "</h3>";
        ch += "<div class='field'><b>定位：</b>" + esc(clsInfo.brief) + "</div>";
        ch += "<div class='field'><b>对口行业：</b>" + esc((clsInfo.industries || []).join("、")) + "</div>";
        ch += "<div class='field'><b>常见岗位：</b>" + esc((clsInfo.jobs || []).join("、")) + "</div>";
        if (clsInfo.further) ch += "<div class='field'><b>深造方向：</b>" + esc(clsInfo.further) + "</div>";
        if (clsInfo.skills) ch += "<div class='field'><b>技能/证书建议：</b>" + esc(clsInfo.skills) + "</div>";
        cb.innerHTML = ch;
        r.appendChild(cb);
        r.appendChild(el("div", "summary-box", "「" + esc(m.name) + "」属于" + esc(clsInfo.name) + "，以上为该专业类的通用就业方向（初稿）。具体专业与单位细节将逐步补充。"));
      } else {
        r.appendChild(el("div", "empty-state",
          "「" + esc(m.name) + "」的详细方向正在整理中。\n你可以先看看下面的相近专业，也可以告诉我们优先整理这个专业。"));
      }
      var rel = relatedMajors(m);
      if (rel.length) {
        var box = el("div", "related-box");
        box.appendChild(el("h3", "", "相近专业（同专业类）"));
        var wrap = el("div", "major-chips");
        rel.forEach(function (x) { wrap.appendChild(majorChip(x)); });
        box.appendChild(wrap);
        r.appendChild(box);
      }
    }
    renderEmployment(r, m);
  }

  function renderCurrent(r, m) {
    var list = CURRENT.majors ? CURRENT.majors[currentLevel + ":" + m.code] : null;
    if (!list || !list.length) return;
    var box = el("div", "current-box");
    var h = "<h3>📌 当前可报企业（" + (CURRENT.updatedAt || "") + " 更新）</h3>";
    list.forEach(function (it) {
      h += "<div class='current-item'>";
      h += "<div class='current-company'><b>" + esc(it.company) + "</b> <span class='tag'>" + esc(it.position) + "</span></div>";
      h += "<div class='field'><b>状态：</b>" + esc(it.status) + (it.url ? " · <a href='" + esc(it.url) + "' target='_blank' rel='noopener'>官方入口</a>" : "") + "</div>";
      h += "</div>";
    });
    h += "<div class='field' style='margin-top:6px'>" + esc(CURRENT.note || "") + "</div>";
    box.innerHTML = h;
    r.appendChild(box);
  }

  function renderEmployment(r, m) {
    if (currentLevel === "graduate") return;
    var emp = EMPLOYMENT[currentLevel === "undergrad" ? "undergrad" : "vocational"];
    if (!emp) return;
    var tags = [];
    if ((emp.green || []).indexOf(m.name) >= 0) tags.push("🟢 2025 绿牌专业（就业前景较好）");
    if ((emp.red || []).indexOf(m.name) >= 0) tags.push("🔴 2025 红牌专业（就业预警）");
    var hi = (emp.highIncome || []).filter(function (x) { return x.major === m.name; })[0];
    if (hi) tags.push("💰 高薪专业（毕业半年月收入约 " + hi.income + "）");
    if (!tags.length) return;
    var box = el("div", "emp-box");
    box.innerHTML = "<h3>📊 就业数据参考</h3>" + tags.map(function (t) { return "<div class='emp-tag'>" + esc(t) + "</div>"; }).join("") +
      "<div class='field' style='margin-top:6px'>数据来源：" + esc(EMPLOYMENT.source) + "。" + esc(EMPLOYMENT.note) + "</div>";
    r.appendChild(box);
  }

  function renderCities() {
    var m = selectedMajor;
    var filter = cityFilter && !!m;
    var meta = $("#cityMeta");
    var list = $("#cityList");
    if (!list) return;
    list.innerHTML = "";
    var all = CITY_DATA || [];
    var show = all;
    if (filter) show = all.filter(function (c) { return majorRelevant(c.majors, m); });
    if (meta) {
      meta.textContent = filter
        ? "（仅显示适合「" + m.name + "」的城市 " + show.length + "/" + all.length + " 个）"
        : "（想转行 / 换城市的朋友参考）";
    }
    if (!show.length) {
      list.appendChild(el("div", "empty-state", m
        ? "暂未匹配到与「" + m.name + "」高度对口的城市，可点下方「查看全部」浏览 50 城。"
        : "城市指南整理中。"));
    } else {
      show.forEach(function (c) {
        var card = el("div", "city-card");
        var h = "<div class='city-head'><b>" + esc(c.city) + "</b><span class='tag'>" + esc(c.tag) + "</span></div>";
        h += "<div class='field'><b>支柱行业：</b>" + esc(c.industries.join("、")) + "</div>";
        h += "<div class='field'><b>央国企代表：</b>" + esc(c.soc.join("、")) + "</div>";
        h += "<div class='field'><b>外资企业代表：</b>" + esc(c.foreign.join("、")) + "</div>";
        h += "<div class='field'><b>大厂/上市公司代表：</b>" + esc(c.listed.join("、")) + "</div>";
        h += "<div class='field'><b>适合专业/方向：</b>" + esc(c.majors.join("、")) + "</div>";
        h += "<div class='field'><b>特点：</b>" + esc(c.notes) + "</div>";
        card.innerHTML = h;
        list.appendChild(card);
      });
    }
    if (m) {
      var tb = el("div", "filter-toggle");
      tb.innerHTML = filter
        ? "<a href='javascript:void(0)' class='filter-link'>查看全部 " + all.length + " 城 →</a>"
        : "<a href='javascript:void(0)' class='filter-link'>只显示与「" + m.name + "」相关 ↓</a>";
      tb.querySelector(".filter-link").addEventListener("click", function () { cityFilter = !cityFilter; renderCities(); });
      list.appendChild(tb);
    }
  }

  function renderHire() {
    var m = selectedMajor;
    var filter = hireFilter && !!m;
    var meta = $("#hireMeta");
    var list = $("#hireList");
    if (!list) return;
    list.innerHTML = "";
    var all = HIRE.items || [];
    var show = all;
    if (filter) show = all.filter(function (it) { return majorRelevant(it.majors, m); });
    if (meta) {
      meta.textContent = filter
        ? "（更新于 " + (HIRE.updatedAt || "") + " · 仅显示与「" + m.name + "」相关 " + show.length + "/" + all.length + " 条）"
        : "（更新于 " + (HIRE.updatedAt || "") + "）";
    }
    if (!show.length) {
      list.appendChild(el("div", "empty-state", m
        ? "暂未收录与「" + m.name + "」直接相关的公司招录数据，可点下方「查看全部」参考各行业官方招录规模。"
        : (HIRE.note || "招录数据整理中。")));
    } else {
      show.forEach(function (it) {
        var card = el("div", "weekly-item");
        var h = "<div class='wi-company'><b>" + esc(it.unit) + "</b> <span class='tag'>" + esc(it.year || "") + " " + esc(it.kind || "") + "</span></div>";
        if (it.count) h += "<div class='field'><b>拟录用人数：</b>" + esc(it.count) + "</div>";
        if (it.detail) h += "<div class='field'><b>口径说明：</b>" + esc(it.detail) + "</div>";
        if (it.url) h += "<div class='field'><b>来源：</b><a href='" + esc(it.url) + "' target='_blank' rel='noopener'>官方公示/公告</a></div>";
        card.innerHTML = h;
        list.appendChild(card);
      });
    }
    if (m) {
      var tb = el("div", "filter-toggle");
      tb.innerHTML = filter
        ? "<a href='javascript:void(0)' class='filter-link'>查看全部 " + all.length + " 条 →</a>"
        : "<a href='javascript:void(0)' class='filter-link'>只显示与「" + m.name + "」相关 ↓</a>";
      tb.querySelector(".filter-link").addEventListener("click", function () { hireFilter = !hireFilter; renderHire(); });
      list.appendChild(tb);
    }
  }

  function renderWeekly() {
    var m = selectedMajor;
    var filter = weeklyFilter && !!m;
    var meta = $("#weekLabel");
    var list = $("#weeklyList");
    if (!list) return;
    list.innerHTML = "";
    var all = WEEKLY.items || [];
    var show = all;
    if (filter) show = all.filter(function (it) { return majorRelevant(it.majors, m); });
    if (meta) {
      meta.textContent = filter
        ? "（" + (WEEKLY.weekLabel || "") + " · 仅显示与「" + m.name + "」相关 " + show.length + "/" + all.length + " 条）"
        : "（" + (WEEKLY.weekLabel || "") + " · 更新于 " + (WEEKLY.updatedAt || "") + "）";
    }
    if (!show.length) {
      list.appendChild(el("div", "empty-state", m
        ? "本周暂未收录与「" + m.name + "」直接相关的招聘，可点下方「查看全部」浏览本周全部单位，或关注下周更新。"
        : "本周更新内容正在整理中。\n上线后，这里会每周发布央国企、外资企业、上市公司大厂的公开招聘信息，包含岗位、专业要求、投递渠道和截止时间。"));
    } else {
      show.forEach(function (it) {
        var card = el("div", "weekly-item");
        var h = "<div class='wi-company'><b>" + esc(it.company) + "</b> <span class='tag'>" + esc(it.type || "") + "</span></div>";
        h += "<div class='wi-pos'>" + esc(it.position || "") + "</div>";
        if (it.majors) h += "<div class='field'><b>适用专业：</b>" + esc(it.majors.join("、")) + "</div>";
        if (it.city) h += "<div class='field'><b>地点：</b>" + esc(it.city) + "</div>";
        if (it.deadline) h += "<div class='field'><b>截止：</b>" + esc(it.deadline) + "</div>";
        if (it.publishDate) h += "<div class='field'><b>发布时间：</b>" + esc(it.publishDate) + "</div>";
        if (it.source) h += "<div class='field'><b>来源：</b>" + (it.url ? "<a href='" + esc(it.url) + "' target='_blank' rel='noopener'>" + esc(it.source) + "</a>" : esc(it.source)) + "</div>";
        if (it.verified === false) h += "<div class='field'><b>核实状态：</b>核实中</div>";
        card.innerHTML = h;
        list.appendChild(card);
      });
    }
    if (m) {
      var tb = el("div", "filter-toggle");
      tb.innerHTML = filter
        ? "<a href='javascript:void(0)' class='filter-link'>查看全部 " + all.length + " 条 →</a>"
        : "<a href='javascript:void(0)' class='filter-link'>只显示与「" + m.name + "」相关 ↓</a>";
      tb.querySelector(".filter-link").addEventListener("click", function () { weeklyFilter = !weeklyFilter; renderWeekly(); });
      list.appendChild(tb);
    }
  }

  $("#levelChips").addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest(".chip") : null;
    if (!btn) return;
    currentLevel = btn.getAttribute("data-level");
    var chips = document.querySelectorAll("#levelChips .chip");
    for (var i = 0; i < chips.length; i++) { chips[i].classList.remove("active"); }
    btn.classList.add("active");
    selectedMajor = null;
    hireFilter = false;
    weeklyFilter = false;
    cityFilter = false;
    $("#result").classList.add("hidden");
    renderBrowser();
    renderHire();
    renderWeekly();
    renderCities();
  });

  function doSearch(opt) {
    opt = opt || {};
    var q = ($("#searchInput").value || "").trim();
    if (opt.jump && q) {
      var exact = allMajors(currentLevel).filter(function (m) {
        return m.name === q || String(m.code).toLowerCase() === q.toLowerCase();
      });
      if (exact.length === 1) { selectMajor(exact[0]); return; }
    }
    renderBrowser();
    if (opt.scroll) {
      var target = $("#majorBrowser");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  $("#searchInput").addEventListener("input", function () { renderBrowser(); });
  $("#searchBtn").addEventListener("click", function () { doSearch({ jump: true, scroll: true }); });
  $("#searchInput").addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") { ev.preventDefault(); doSearch({ jump: true, scroll: true }); }
  });

  var lvlParam = (location.search.match(/level=([a-z]+)/) || [])[1];
  if (lvlParam && LEVELS[lvlParam]) {
    currentLevel = lvlParam;
    var step = $("#levelStep");
    var fixed = $("#levelFixed");
    if (step) step.classList.add("hidden");
    if (fixed) {
      fixed.classList.remove("hidden");
      var fn = $("#levelFixedName");
      if (fn) fn.textContent = LEVELS[currentLevel].label + "专业";
    }
    var chips0 = document.querySelectorAll("#levelChips .chip");
    for (var i0 = 0; i0 < chips0.length; i0++) {
      chips0[i0].classList.toggle("active", chips0[i0].getAttribute("data-level") === lvlParam);
    }
  }
  renderBrowser();
  renderWeekly();
  renderHire();
  renderCities();
})();
