/* 화면정의서 팝업 공용 스크립트 — screen-def.css 와 짝. 각 페이지는
   <script id="state-json" type="application/json"> 에 {purpose, items[]} 를 담고,
   <body data-export-name="..."> 로 내보내기 파일 이름의 밑동을 준다. */
(function () {
  "use strict";
  var LS_KEY = "whale-screendef:" + location.pathname;
  var stateEl = document.getElementById("state-json");
  var defaults = JSON.parse(stateEl.textContent);
  var STATE = defaults;
  try {
    var saved = localStorage.getItem(LS_KEY);
    if (saved) {
      // merge, not replace — a draft saved before a new field (e.g. screenName) existed
      // must still pick up that field's default instead of rendering it blank forever.
      STATE = Object.assign({}, defaults, JSON.parse(saved));
    }
  } catch (e) {
    STATE = defaults;
  }

  var editing = false;
  var armed = false;
  var selected = new Set();
  var img = document.getElementById("shotImg");
  var wrap = document.getElementById("shotWrap");
  var descBody = document.getElementById("descBody");
  var purposeEl = document.getElementById("purposeEl");
  var btnEdit = document.getElementById("btnEdit");
  var btnExport = document.getElementById("btnExport");
  var btnArm = document.getElementById("btnArm");
  var addRowBtn = document.getElementById("addRow");
  var metaNameEl = document.getElementById("metaName");
  var metaPathEl = document.getElementById("metaPath");

  function updateArmUI() {
    if (!btnArm) return;
    document.body.classList.toggle("arming", armed);
    btnArm.classList.toggle("btn2--on", armed);
    btnArm.textContent = armed ? "클릭할 위치를 선택하세요…" : "핀 추가";
  }

  function markSelection() {
    wrap.querySelectorAll(".pin").forEach(function (p) {
      p.classList.toggle("pin--selected", selected.has(Number(p.dataset.idx)));
    });
  }

  function sizeToImage() {
    var w = img.naturalWidth || img.width;
    if (w) { wrap.style.width = w + "px"; img.style.width = w + "px"; }
  }
  if (img.complete) sizeToImage(); else img.addEventListener("load", sizeToImage);

  function persist() {
    stateEl.textContent = JSON.stringify(STATE, null, 2);
    try { localStorage.setItem(LS_KEY, JSON.stringify(STATE)); } catch (e) {}
  }

  function render() {
    wrap.querySelectorAll(".pin").forEach(function (p) { p.remove(); });
    STATE.items.forEach(function (item, i) {
      var pin = document.createElement("div");
      pin.className = "pin";
      pin.style.left = item.x + "px";
      pin.style.top = item.y + "px";
      pin.textContent = String(i + 1);
      pin.dataset.idx = i;
      if (selected.has(i)) pin.classList.add("pin--selected");
      var del = document.createElement("span");
      del.className = "pin__del";
      del.textContent = "×";
      del.addEventListener("click", function (e) {
        e.stopPropagation();
        STATE.items.splice(i, 1);
        persist(); render();
      });
      pin.appendChild(del);
      wirePinDrag(pin, i);
      wrap.appendChild(pin);
    });

    purposeEl.textContent = STATE.purpose;
    purposeEl.contentEditable = editing ? "true" : "false";

    if (metaNameEl) {
      metaNameEl.textContent = STATE.screenName || "";
      metaNameEl.contentEditable = editing ? "true" : "false";
    }
    if (metaPathEl) {
      metaPathEl.textContent = STATE.screenPath || "";
      metaPathEl.contentEditable = editing ? "true" : "false";
    }

    descBody.innerHTML = "";
    STATE.items.forEach(function (item, i) {
      var tr = document.createElement("tr");

      var tdNum = document.createElement("td");
      tdNum.className = "num";
      tdNum.textContent = String(i + 1);
      tr.appendChild(tdNum);

      var tdBody = document.createElement("td");
      tdBody.className = "body";

      var b = document.createElement("b");
      b.textContent = item.title;
      b.contentEditable = editing ? "true" : "false";
      b.addEventListener("blur", function () {
        item.title = b.textContent.trim();
        persist();
      });
      tdBody.appendChild(b);

      if (editing) {
        var ta = document.createElement("textarea");
        ta.value = item.desc;
        ta.addEventListener("blur", function () {
          item.desc = ta.value;
          persist();
        });
        tdBody.appendChild(ta);

        var rowDel = document.createElement("span");
        rowDel.className = "row__del";
        rowDel.textContent = "×";
        rowDel.addEventListener("click", function () {
          STATE.items.splice(i, 1);
          persist(); render();
        });
        tr.style.position = "relative";
        tr.appendChild(rowDel);
      } else {
        var ul = document.createElement("ul");
        (item.desc || "").split("\n").forEach(function (line) {
          if (!line.trim()) return;
          var li = document.createElement("li");
          li.textContent = line;
          ul.appendChild(li);
        });
        tdBody.appendChild(ul);
      }

      tr.appendChild(tdBody);
      descBody.appendChild(tr);
    });
  }

  function wirePinDrag(pin, i) {
    pin.addEventListener("pointerdown", function (e) {
      if (!editing) return;
      if (e.target.classList.contains("pin__del")) return;
      e.preventDefault();
      e.stopPropagation();

      var toggleOnly = e.shiftKey || e.ctrlKey || e.metaKey;
      if (toggleOnly) {
        if (selected.has(i)) selected.delete(i); else selected.add(i);
        markSelection();
        return;
      }

      // plain click/drag: if this pin is part of a multi-selection, drag the whole group;
      // otherwise it becomes the sole selection and drags alone.
      var group = (selected.has(i) && selected.size > 1) ? Array.from(selected) : [i];
      if (group.length === 1) { selected = new Set([i]); markSelection(); }

      try { pin.setPointerCapture(e.pointerId); } catch (capErr) {}
      var startX = e.clientX, startY = e.clientY;
      var startPos = group.map(function (gi) {
        return { idx: gi, x: STATE.items[gi].x, y: STATE.items[gi].y };
      });

      function onMove(ev) {
        var dx = ev.clientX - startX, dy = ev.clientY - startY;
        startPos.forEach(function (p) {
          var nx = Math.round(p.x + dx), ny = Math.round(p.y + dy);
          STATE.items[p.idx].x = nx;
          STATE.items[p.idx].y = ny;
          var el = wrap.querySelector('.pin[data-idx="' + p.idx + '"]');
          if (el) { el.style.left = nx + "px"; el.style.top = ny + "px"; }
        });
      }
      function onUp() {
        pin.removeEventListener("pointermove", onMove);
        pin.removeEventListener("pointerup", onUp);
        persist();
      }
      pin.addEventListener("pointermove", onMove);
      pin.addEventListener("pointerup", onUp);
    });
  }

  img.addEventListener("click", function (e) {
    if (!editing) return;
    if (!armed) {
      if (selected.size) { selected = new Set(); markSelection(); }
      return;
    }
    var rect = img.getBoundingClientRect();
    var x = Math.round(e.clientX - rect.left);
    var y = Math.round(e.clientY - rect.top);
    STATE.items.push({ x: x, y: y, title: "새 항목", desc: "정의: " });
    armed = false;
    updateArmUI();
    persist(); render();
    var rows = descBody.querySelectorAll("tr");
    var lastB = rows[rows.length - 1].querySelector("b");
    if (lastB) { lastB.focus(); selectAllText(lastB); }
  });

  if (btnArm) {
    btnArm.addEventListener("click", function () {
      armed = !armed;
      updateArmUI();
    });
  }

  function selectAllText(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  addRowBtn.addEventListener("click", function () {
    STATE.items.push({ x: 40, y: 40, title: "새 항목", desc: "정의: " });
    persist(); render();
  });

  purposeEl.addEventListener("blur", function () {
    STATE.purpose = purposeEl.textContent.trim();
    persist();
  });

  if (metaNameEl) {
    metaNameEl.addEventListener("blur", function () {
      STATE.screenName = metaNameEl.textContent.trim();
      persist();
    });
  }
  if (metaPathEl) {
    metaPathEl.addEventListener("blur", function () {
      STATE.screenPath = metaPathEl.textContent.trim();
      persist();
    });
  }

  btnEdit.addEventListener("click", function () {
    editing = !editing;
    document.body.classList.toggle("editing", editing);
    btnEdit.textContent = editing ? "편집 종료" : "편집 모드";
    btnEdit.classList.toggle("btn2--on", editing);
    btnExport.hidden = !editing;
    if (btnArm) btnArm.hidden = !editing;
    armed = false; updateArmUI();
    selected = new Set();
    render();
  });

  btnExport.addEventListener("click", function () {
    persist();
    var html = "<!doctype html>\n" + document.documentElement.outerHTML;
    var blob = new Blob([html], { type: "text/html" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    var base = document.body.dataset.exportName || "screen-def";
    a.download = base + ".edited.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  render();
})();
