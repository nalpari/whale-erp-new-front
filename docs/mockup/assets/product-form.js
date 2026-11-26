/* 목업 전용 — 단위 상품 등록 · 수정(products-new · products-edit) 공용. 자동완성 두 가지(2026-11-25 사용자 지정).
   ① 옵션 상품(data-optq): 옵션 상품 관리에 있는 이름이면 골라 넣고 추가 가격을 불러온다 — 불러온 가격은 이 상품에서 바꿀 수 있다(PL-45).
      없는 이름이면 「새 옵션으로 등록」을 고르고, 저장할 때 옵션 상품 관리에 새 옵션 상품으로 등록된다(PL-44).
   ② 연결 상품(data-linkq): 등록된 단위 상품에서만 고른다(세트 상품은 빠진다). 연결하면 옵션 구성에 그 상품의 묶음이 생기고,
      옵션 SET 이 있으면 「옵션도 추가할지」 물어 그 묶음 안에 복사한다 — 복사한 뒤에는 이 상품의 SET 이라 따로 고친다(PL-46 · PL-47).
      수량 칸은 없다 — 같은 상품이 두 개 들어가면 두 번 연결하고, 묶음도 둘(아메리카노 1 · 아메리카노 2)이라 옵션을 따로 정한다(2026-11-25). */
(function () {
  var OPTS = [["샷 추가","OP000001",500],["바닐라 시럽","OP000002",500],["헤이즐넛 시럽","OP000003",500],["휘핑 추가","OP000004",500],["디카페인 원두","OP000005",500],["라지 사이즈","OP000006",700],["얼음 많이","OP000007",0]];
  var SELF = document.body.dataset.selfCode || "";
  /* 단위 상품 · 그 상품의 옵션 SET [이름, 필수, 다중, [옵션 상품명, 추가 가격]] */
  var PRODS = [
    ["아메리카노","PD000001",[["원두 선택",true,false,[["디카페인 원두",500]]],["추가",false,true,[["샷 추가",500],["바닐라 시럽",500]]]]],
    ["카페라떼","PD000002",[["추가",false,true,[["샷 추가",500],["바닐라 시럽",500]]]]],
    ["바닐라라떼","PD000003",[["추가",false,true,[["샷 추가",500]]]]],
    ["콜드브루","PD000004",[["얼음 양",false,false,[["얼음 많이",0]]]]],
    ["흑당라떼","PD000005",[]],
    ["크루아상","PD000006",[]],
    ["딸기라떼","PD000009",[]],
    ["시즌 밤라떼","PD000010",[]],
    ["치즈케익","PD000011",[]],
    ["모닝 세트","PD000013",[],true]  /* 상품 유형이 세트 상품 — 연결 상품 후보는 단일 상품만이라 빠진다(PL-46) */
  ].filter(function (p) { return p[1] !== SELF && !p[3]; });
  var norm = function (s) { return s.replace(/\s+/g, "").toLowerCase(); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var won = function (n) { return n.toLocaleString() + "원"; };
  var uid = 0;
  var searchIc = function () { var e = document.querySelector("[data-optq] > [data-icon]"); return e ? e.outerHTML : ""; };
  function toast(t) {
    var d = document.createElement("div"); d.className = "scopetoast"; d.setAttribute("role", "status"); d.textContent = t;
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2400);
  }
  function items(box, q) {
    var n = norm(q);
    if (box.hasAttribute("data-linkq")) {
      return PRODS.filter(function (p) { return (!n || norm(p[0]).indexOf(n) > -1 || p[1].toLowerCase().indexOf(n) > -1); })
        .map(function (p) { return { name: p[0], code: p[1], sets: p[2] }; });
    }
    var out = OPTS.filter(function (o) { return !n || norm(o[0]).indexOf(n) > -1; }).map(function (o) { return { name: o[0], code: o[1], price: o[2] }; });
    if (n && !OPTS.some(function (o) { return norm(o[0]) === n; })) out.push({ name: q.trim(), isNew: true });
    return out;
  }
  function row(o) {
    if (o.isNew) return '<b style="width: 14px; text-align: center">+</b><span>「' + esc(o.name) + '」 새 옵션으로 등록</span>';
    return '<span style="flex: 1">' + esc(o.name) + '</span><span class="mono subtle">' + o.code + "</span>" +
      (o.sets ? '<span class="subtle">' + (o.sets.length ? "옵션 SET " + o.sets.length + "개" : "옵션 없음") + "</span>" : '<span class="mono subtle">' + won(o.price) + "</span>");
  }
  function render(box) {
    var inp = box.querySelector("input"), list = box.querySelector(".addr__list");
    if (!list.id) list.id = "acq-" + ++uid;
    var its = items(box, inp.value);
    box._its = its; box._at = its.length ? 0 : -1;
    list.innerHTML = its.length ? its.map(function (o, i) {
      return '<div class="spick__opt" role="option" aria-selected="' + (i === 0) + '" id="' + list.id + "-" + i + '" data-i="' + i + '">' + row(o) + "</div>";
    }).join("") : '<div class="addr__count">' + (box.hasAttribute("data-linkq") ? "맞는 단위 상품이 없습니다." : "옵션 상품 이름을 입력하세요.") + "</div>";
    list.hidden = false; inp.setAttribute("aria-expanded", "true"); inp.setAttribute("aria-controls", list.id);
  }
  function close(box) { box.querySelector(".addr__list").hidden = true; box.querySelector("input").setAttribute("aria-expanded", "false"); }
  function pickOpt(box, o) {
    var tr = box.closest("tr"), price = tr.querySelector("[data-optq-price]");
    box.querySelector("input").value = o.name;
    tr.querySelector("[data-optq-code]").innerHTML = o.isNew ? '<span class="tag">새 옵션</span>' : '<span class="mono">' + o.code + "</span>";
    tr.querySelector("[data-optq-new]").hidden = !o.isNew;
    price.value = o.isNew ? "" : o.price; price.placeholder = "0";
    tr.querySelector("[data-optq-base]").textContent = o.isNew ? "" : "기본 " + won(o.price);
    close(box);
    if (o.isNew) price.focus();
  }
  /* 옵션 SET 카드 — 연결 상품 묶음에 넣을 때 쓴다. 칸 모양은 화면의 SET 카드와 같고, 연결 상품 묶음에도 같은 카드를 쓴다(PL-47) */
  var sw = function (on, label) { return '<span class="toggle" role="switch" aria-pressed="' + on + '" tabindex="0"' + (label ? ' aria-label="' + label + '"' : "") + "></span>"; };
  function optRow(name, price) {
    var o = OPTS.filter(function (x) { return x[0] === name; })[0];
    return '<tr><td style="min-width: 240px"><div class="addr__q" data-optq>' + searchIc() +
      '<input class="input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-label="옵션 상품" placeholder="옵션 상품명 입력" autocomplete="off" value="' + esc(name) + '" />' +
      '<div class="addr__list spick__list" role="listbox" aria-label="옵션 상품" hidden></div></div>' +
      '<span class="help" data-optq-new hidden style="display: block; margin-top: 4px">저장하면 옵션 상품 관리에 새 옵션 상품으로 등록됩니다.</span></td>' +
      '<td data-optq-code>' + (o ? '<span class="mono">' + o[1] + "</span>" : '<span class="nil">-</span>') + "</td>" +
      '<td class="num"><input class="input mono" style="width: 96px; text-align: right" inputmode="numeric" aria-label="추가 가격" value="' + (o ? price : "") + '" placeholder="0" data-optq-price />' +
      '<span class="help" data-optq-base style="display: block; margin-top: 4px">' + (o ? "기본 " + won(o[2]) : "") + "</span></td>" +
      "<td>" + sw(false, "수량입력") + '</td><td><input type="checkbox" aria-label="기본선택" /></td><td>' + sw(true, "사용") + '</td><td><button class="tbtn" type="button">빼기</button></td></tr>';
  }
  function setCard(s) {
    return '<div style="border: 1px solid var(--hairline); border-radius: 6px; padding: var(--s-4); background: var(--surface-card)" class="stack--lg" data-set-card>' +
      '<div class="grid" style="grid-template-columns: minmax(0, 1fr) auto; gap: var(--s-4); align-items: end">' +
      '<div class="field"><label>SET 이름 <span class="req">*</span></label><input class="input" value="' + esc(s[0]) + '" placeholder="예: 원두 선택" aria-label="SET 이름" /></div>' +
      '<button class="btn btn--secondary btn--sm" type="button" data-set-del>SET 삭제</button></div>' +
      '<div class="inline" style="gap: var(--s-5); flex-wrap: wrap"><span class="inline" style="gap: 6px">필수선택 ' + sw(s[1]) + '</span><span class="inline" style="gap: 6px">다중선택 ' + sw(s[2]) + '</span><span class="inline" style="gap: 6px">사용 ' + sw(true) + "</span></div>" +
      '<div class="tblwrap" style="overflow: visible"><table class="tbl"><thead><tr><th scope="col">옵션 상품</th><th scope="col">옵션 코드</th><th scope="col" class="num">추가 가격</th><th scope="col">수량입력</th><th scope="col">기본선택</th><th scope="col">사용</th><th scope="col"></th></tr></thead><tbody>' +
      (s[3].length ? s[3] : [["", ""]]).map(function (x) { return optRow(x[0], x[1]); }).join("") + "</tbody></table></div>" +
      '<div class="inline"><button class="btn btn--secondary btn--sm" type="button" data-opt-add>+ 옵션 추가</button><a class="tlink" href="option-products.html">옵션 상품 관리 ›</a></div></div>';
  }
  /* 연결 상품 묶음 — 연결 상품 줄 하나에 묶음 하나. 줄을 빼면 묶음도 빠진다 */
  function groupTitle(tr) { return tr._o.name; }
  function syncGroups() {
    var gs = [].slice.call(document.querySelectorAll("[data-link-group]")), any = gs.length > 0;
    gs.forEach(function (g) {
      var same = gs.filter(function (x) { return x._tr._o && x._tr._o.code === g._tr._o.code; });
      g.querySelector("[data-lg-title]").textContent = g._tr._o.name + (same.length > 1 ? " " + (same.indexOf(g) + 1) : "");
    });
    document.querySelectorAll("[data-common-head]").forEach(function (h) { h.hidden = !any; });
  }
  function ensureGroup(tr) {
    if (tr._group && tr._group.isConnected) { tr._group.querySelector("[data-lg-sets]").innerHTML = ""; }
    else {
      var host = document.querySelector("[data-group-host]");
      host.insertAdjacentHTML("beforeend",
        '<div data-link-group style="border: 1px solid var(--hairline-strong); border-radius: 6px; background: var(--surface-sunk, #f8f9fb); padding: var(--s-4); display: flex; flex-direction: column; gap: var(--s-3)">' +
        '<div class="inline" style="gap: 8px; flex-wrap: wrap"><span class="tag">연결 상품</span><b data-lg-title style="font-size: 15px"></b><span class="mono subtle" data-lg-code></span>' +
        '<span class="inline" style="gap: 6px; margin-left: auto"><button class="btn btn--secondary btn--sm" type="button" data-lg-import>옵션 가져오기</button><button class="btn btn--secondary btn--sm" type="button" data-lg-addset>+ 옵션 SET 추가</button></span></div>' +
        '<div data-lg-sets style="display: flex; flex-direction: column; gap: var(--s-3)"></div>' +
        '<p class="subtle" data-lg-empty style="margin: 0">옵션 없음 — 이 상품은 옵션 없이 세트에 들어갑니다.</p></div>');
      tr._group = host.lastElementChild; tr._group._tr = tr;
    }
    tr._group.querySelector("[data-lg-title]").textContent = groupTitle(tr);
    tr._group.querySelector("[data-lg-code]").textContent = tr._o.code;
    tr._group.querySelector("[data-lg-empty]").hidden = false;
    syncGroups();
  }
  function addSets(group, sets) {
    group.querySelector("[data-lg-sets]").insertAdjacentHTML("beforeend", sets.map(setCard).join(""));
    group.querySelector("[data-lg-empty]").hidden = group.querySelectorAll("[data-set-card]").length > 0;
  }
  var pending = null;
  function askImport(tr) {
    var o = tr._o;
    if (!o.sets.length) { toast("「" + o.name + "」에는 가져올 옵션이 없습니다."); return; }
    pending = tr;
    var m = document.getElementById("pop-link-opt");
    m.querySelector("[data-lo-name]").textContent = o.name;
    m.querySelector("[data-lo-sets]").innerHTML = o.sets.map(function (s, i) {
      return '<label class="inline" style="gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--hairline)"><input type="checkbox" checked data-lo-i="' + i + '" />' +
        "<b>" + esc(s[0]) + '</b><span class="tag">' + (s[1] ? "필수" : "선택") + '</span><span class="subtle">' + s[3].map(function (x) { return esc(x[0]) + " +" + x[1]; }).join(" · ") + "</span></label>";
    }).join("");
    m.hidden = false;
  }
  function pickLink(box, o) {
    var tr = box.closest("tr");
    box.querySelector("input").value = o.name;
    tr.querySelector("[data-linkq-code]").innerHTML = '<span class="mono">' + o.code + "</span>";
    close(box);
    tr._o = o;
    ensureGroup(tr);
    if (o.sets.length) askImport(tr);
  }
  function dropGroup(tr) { if (tr._group) { tr._group.remove(); tr._group = null; } tr._o = null; syncGroups(); }
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-lo-apply]");
    if (add && pending) {
      var o = pending._o, picked = [].filter.call(document.querySelectorAll("[data-lo-i]"), function (c) { return c.checked; }).map(function (c) { return o.sets[+c.dataset.loI]; });
      addSets(pending._group, picked);
      if (picked.length) toast("「" + o.name + "」 묶음에 옵션 SET " + picked.length + "개를 넣었습니다. 여기서 고칠 수 있습니다.");
      pending = null;
    }
    if (e.target.closest("#pop-link-opt [data-close]")) pending = null;
    var imp = e.target.closest("[data-lg-import]");
    if (imp) askImport(imp.closest("[data-link-group]")._tr);
    var as = e.target.closest("[data-lg-addset]");
    if (as) addSets(as.closest("[data-link-group]"), [["", false, false, []]]);
    var del = e.target.closest("[data-set-del]");
    if (del && del.closest("[data-set-card]")) {
      var g = del.closest("[data-link-group]"); del.closest("[data-set-card]").remove();
      if (g) g.querySelector("[data-lg-empty]").hidden = g.querySelectorAll("[data-set-card]").length > 0;
    }
    var rm = e.target.closest("[data-link-rm]");
    if (rm) {
      var rtr = rm.closest("tr"), n = rtr._group ? rtr._group.querySelectorAll("[data-set-card]").length : 0, nm = rtr._o && rtr._o.name;
      dropGroup(rtr);
      var tb = rm.closest("tbody"); if (tb.rows.length > 1) rtr.remove(); else clearLink(rtr);
      if (n) toast("「" + nm + "」을(를) 빼면서 그 옵션 SET " + n + "개도 뺐습니다.");
    }
    var la = e.target.closest("[data-link-add]");
    if (la) { var tb2 = document.querySelector("[data-link-body]"), nr = tb2.rows[tb2.rows.length - 1].cloneNode(true); clearLink(nr); tb2.appendChild(nr); nr.querySelector("input").focus(); }
    var a = e.target.closest("[data-opt-add]");
    if (a) {
      var tb3 = a.closest(".stack--lg").querySelector("tbody"), tr = tb3.rows[tb3.rows.length - 1].cloneNode(true), b = tr.querySelector("[data-optq]");
      b.querySelector("input").value = ""; b.querySelector(".addr__list").id = "";
      tr.querySelector("[data-optq-code]").innerHTML = '<span class="nil">-</span>';
      var p = tr.querySelector("[data-optq-price]"); p.value = ""; p.placeholder = "0";
      tr.querySelector("[data-optq-base]").textContent = ""; tr.querySelector("[data-optq-new]").hidden = true;
      tb3.appendChild(tr); b.querySelector("input").focus();
    }
  });
  function clearLink(tr) {
    var b = tr.querySelector("[data-linkq]"); b.querySelector("input").value = ""; b.querySelector(".addr__list").id = "";
    tr.querySelector("[data-linkq-code]").innerHTML = '<span class="nil">-</span>';
    tr._o = null; tr._group = null;
  }
  /* 주문 화면 미리보기 — 지금 옵션 구성으로 손님이 고르는 화면을 그린다(목업 전용, PL-47).
     세트 공통 SET 은 한 번, 연결 상품 묶음은 묶음마다 한 칸(아메리카노 1 · 아메리카노 2 · 치즈케익) */
  function readSet(card) {
    var name = card.querySelector(".field input").value || "(이름 없는 SET)";
    var sws = card.querySelectorAll(":scope > .inline .toggle");
    var on = function (i) { return sws[i] && sws[i].getAttribute("aria-pressed") === "true"; };
    var opts = [].map.call(card.querySelectorAll("tbody tr"), function (r) {
      var n = r.querySelector("[data-optq] input").value, p = r.querySelector("[data-optq-price]");
      return n ? { name: n, price: +(p.value || 0) } : null;
    }).filter(Boolean);
    return { name: name, req: on(0), multi: on(1), use: sws.length > 2 ? on(2) : true, opts: opts };
  }
  function setHtml(s) {
    var type = s.multi ? "checkbox" : "radio", grp = "pv-" + ++uid;
    return '<div style="display: flex; flex-direction: column; gap: 6px"><div class="inline" style="gap: 6px"><b style="font-size: 13.5px">' + esc(s.name) + '</b><span class="tag">' + (s.req ? "필수" : "선택") + "</span>" + (s.multi ? '<span class="subtle" style="font-size: 12px">여러 개</span>' : "") + "</div>" +
      '<div class="inline" style="gap: 6px; flex-wrap: wrap">' + (s.opts.length ? s.opts.map(function (o) {
        return '<label class="inline" style="gap: 6px; border: 1px solid var(--hairline-strong); border-radius: 4px; padding: 6px 10px; font-size: 13px"><input type="' + type + '" name="' + grp + '" />' + esc(o.name) + (o.price ? '<span class="mono subtle">+' + o.price.toLocaleString() + "</span>" : "") + "</label>";
      }).join("") : '<span class="subtle" style="font-size: 12.5px">옵션 없음</span>') + "</div></div>";
  }
  function block(title, sub, sets) {
    return '<section style="border: 1px solid var(--hairline); border-radius: 6px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px">' +
      '<div class="inline" style="gap: 8px"><b style="font-size: 14.5px">' + esc(title) + "</b>" + (sub ? '<span class="subtle" style="font-size: 12.5px">' + esc(sub) + "</span>" : "") + "</div>" +
      (sets.length ? sets.map(setHtml).join("") : '<span class="subtle" style="font-size: 12.5px">고를 옵션이 없습니다.</span>') + "</section>";
  }
  function openPreview() {
    var out = [], name = (document.getElementById("pname") || {}).value || "이 상품";
    var common = [].map.call(document.querySelectorAll("[data-set-host] > div"), function (c) { return c.querySelector(".field input") ? readSet(c) : null; })
      .filter(function (s) { return s && s.use && (s.opts.length || s.name !== "(이름 없는 SET)"); });
    var groups = document.querySelectorAll("[data-link-group]");
    if (common.length) out.push(block(groups.length ? "세트 공통" : name, groups.length ? "세트 전체에 한 번" : "", common));
    [].forEach.call(groups, function (g) {
      var sets = [].map.call(g.querySelectorAll("[data-set-card]"), readSet).filter(function (s) { return s.use; });
      out.push(block(g.querySelector("[data-lg-title]").textContent, "", sets));
    });
    var m = document.getElementById("pop-order-pv");
    m.querySelector("[data-pv-name]").textContent = name;
    m.querySelector("[data-pv-body]").innerHTML = out.length ? out.join("") : '<p class="subtle" style="margin: 0">고를 옵션이 없습니다.</p>';
    m.hidden = false;
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-order-pv]")) openPreview();
    var ex = e.target.closest("[data-sample-go]");
    if (ex) location.search = ex.dataset.sampleGo ? "?sample=" + ex.dataset.sampleGo : "";
  });
  /* 목업 예시 — ?sample=set 이면 「아메리카노 2잔 + 치즈케익 세트」를 채워 둔다 */
  var ALL = { "아메리카노": ["아메리카노","PD000001",[["원두 선택",true,false,[["디카페인 원두",500]]],["추가",false,true,[["샷 추가",500],["바닐라 시럽",500]]]]], "치즈케익": ["치즈케익","PD000011",[]] };
  function linkSample(tr, key) {
    var p = ALL[key], o = { name: p[0], code: p[1], sets: p[2] };
    tr.querySelector("[data-linkq] input").value = o.name;
    tr.querySelector("[data-linkq-code]").innerHTML = '<span class="mono">' + o.code + "</span>";
    tr._o = o; ensureGroup(tr); addSets(tr._group, o.sets);
  }
  document.addEventListener("DOMContentLoaded", function () {
    if (/[?&]sample=set\b/.test(location.search) && document.querySelector("[data-link-body]")) {
      var nm = document.getElementById("pname"); if (nm) nm.value = "아메리카노 2잔 + 치즈케익 세트";
      var tb = document.querySelector("[data-link-body]");
      linkSample(tb.rows[0], "아메리카노");
      ["아메리카노", "치즈케익"].forEach(function (k) { var r = tb.rows[0].cloneNode(true); clearLink(r); tb.appendChild(r); linkSample(r, k); });
      /* 세트 공통 예시 — 빈 SET 카드 하나를 「포장」으로 */
      var c = document.querySelector("[data-set-host] > div");
      if (c) { c.querySelector(".field input").value = "포장"; var oi = c.querySelector("[data-optq] input"); if (oi) oi.value = "포장 봉투"; var pp = c.querySelector("[data-optq-price]"); if (pp) pp.value = "100"; var cd = c.querySelector("[data-optq-code]"); if (cd) cd.innerHTML = '<span class="tag">새 옵션</span>'; }
      document.querySelectorAll("[data-sample-go]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.sampleGo === "set"); });
    }
  });
  /* 상품 유형 — 세트 상품일 때만 연결 상품 칸을 보인다. 세트인데 연결 상품이 없으면 저장을 막는다(PL-11 · PL-46) */
  function isSet() { var r = document.querySelector('input[name="ptype"]:checked'); return r && r.value === "set"; }
  function syncType() {
    var on = isSet();
    document.querySelectorAll("[data-set-only]").forEach(function (el) { el.hidden = !on; });
    if (!on) document.querySelectorAll("[data-link-group]").forEach(function (g) { g.style.display = "none"; });
    else document.querySelectorAll("[data-link-group]").forEach(function (g) { g.style.display = ""; });
    document.querySelectorAll("[data-common-head]").forEach(function (h) { h.hidden = !on || !document.querySelector("[data-link-group]"); });
  }
  document.addEventListener("change", function (e) {
    if (e.target.name !== "ptype") return;
    var n = [].filter.call(document.querySelectorAll("[data-linkq] input"), function (i) { return i.value; }).length;
    if (!isSet() && n) { document.querySelector('input[name="ptype"][value="set"]').checked = true; toast("연결 상품 " + n + "개를 모두 빼야 단일 상품으로 바꿀 수 있습니다."); return; }
    syncType();
  });
  document.addEventListener("click", function (e) {
    var sv = e.target.closest("a.btn--primary[href*='products-detail']");
    if (!sv || !isSet()) return;
    var linked = [].some.call(document.querySelectorAll("[data-linkq] input"), function (i) { return i.value; });
    var err = document.querySelector("[data-link-err]");
    if (err) err.hidden = linked;
    if (!linked) { e.preventDefault(); err.scrollIntoView({ block: "center" }); }
  });
  document.addEventListener("DOMContentLoaded", function () {
    if (/[?&]sample=set\b/.test(location.search)) { var st = document.querySelector('input[name="ptype"][value="set"]'); if (st) st.checked = true; }
    syncType();
  });
  var AC = "[data-optq], [data-linkq]";
  var pick = function (b, o) { (b.hasAttribute("data-linkq") ? pickLink : pickOpt)(b, o); };
  document.addEventListener("input", function (e) { var b = e.target.closest(AC); if (b) render(b); });
  document.addEventListener("focusin", function (e) { var b = e.target.closest(AC); if (b && e.target.matches("input")) render(b); });
  document.addEventListener("mousedown", function (e) {
    var o = e.target.closest(".spick__opt"), b = o && o.closest(AC);
    if (b) { e.preventDefault(); pick(b, b._its[+o.dataset.i]); return; }
    document.querySelectorAll(AC).forEach(function (x) { if (!x.contains(e.target)) close(x); });
  });
  document.addEventListener("keydown", function (e) {
    var b = e.target.closest(AC); if (!b || !b._its) return;
    var list = b.querySelector(".addr__list");
    if (e.key === "Escape") { close(b); return; }
    if (list.hidden || !b._its.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      b._at = (b._at + (e.key === "ArrowDown" ? 1 : -1) + b._its.length) % b._its.length;
      [].forEach.call(list.querySelectorAll(".spick__opt"), function (o, k) { o.setAttribute("aria-selected", k === b._at); });
      e.target.setAttribute("aria-activedescendant", list.id + "-" + b._at);
    } else if (e.key === "Enter") { e.preventDefault(); pick(b, b._its[b._at]); }
  });
})();
