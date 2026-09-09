/* 일간 근무표 — 날짜 이동과 다시 그리기.
   목업이지만 버튼이 눌리기만 하고 아무 일도 안 일어나면 이 화면의 값을
   보여줄 수 없다. 주간 근무표에 있는 한 주치 데이터를 그대로 넣어 두고,
   좌우 버튼·드롭다운으로 요일을 옮기면 막대와 인원 띠를 다시 그린다.

   운영시간 07:00-22:00 = 15칸. 1시간 = 100/15 %. */
(function () {
  "use strict";

  var OPEN = 7, CLOSE = 22, SPAN = CLOSE - OPEN;

  var STAFF = [
    { name: "오세라", role: "점장" },
    { name: "유하람", role: "바리스타" },
    { name: "서지안", role: "바리스타" },
    { name: "권도윤", role: "바리스타" },
    { name: "하준서", role: "바리스타", blocked: "계약 대기 · 배정 불가" }
  ];

  /* [시작, 끝, 유형] · null 이면 휴무. 주간 근무표와 같은 값이다. */
  var DAYS = [
    { date: "2026-08-17", label: "08-17 월", shifts: {
      오세라: [9, 18, "미들"], 서지안: [7, 16, "오픈"], 권도윤: [13, 22, "마감"], 유하람: null } },
    { date: "2026-08-18", label: "08-18 화", shifts: {
      오세라: [9, 18, "미들"], 서지안: [7, 16, "오픈"], 권도윤: null, 유하람: [16, 22, "마감"] } },
    { date: "2026-08-19", label: "08-19 수", shifts: {
      오세라: null, 서지안: [7, 16, "오픈"], 권도윤: [13, 22, "마감"], 유하람: [16, 22, "마감"] } },
    { date: "2026-08-20", label: "08-20 목", shifts: {
      오세라: [9, 18, "미들"], 서지안: [7, 16, "오픈"], 권도윤: [13, 22, "마감"], 유하람: null } },
    { date: "2026-08-21", label: "08-21 금", shifts: {
      오세라: [9, 18, "미들"], 서지안: null, 권도윤: [13, 22, "마감"], 유하람: [16, 22, "마감"] } },
    { date: "2026-08-22", label: "08-22 토", shifts: {
      오세라: [11, 20, "미들"], 서지안: null, 권도윤: null, 유하람: [12, 22, "마감"] } },
    { date: "2026-08-23", label: "08-23 일", shifts: {
      오세라: null, 서지안: [10, 19, "오픈"], 권도윤: [13, 22, "마감"], 유하람: [12, 22, "마감"] } }
  ];

  var DOW = ["일", "월", "화", "수", "목", "금", "토"];
  var TODAY = 5; /* 샘플의 오늘. 공백이 드러나는 토요일이다 */
  var cur = TODAY;

  function pct(h) { return ((h - OPEN) / SPAN) * 100; }
  function hhmm(h) { return (h < 10 ? "0" : "") + h + ":00"; }

  /* 시간대별 인원 수 — 한 칸은 t ~ t+1 시간이다. */
  function coverage(day) {
    var out = [];
    for (var t = OPEN; t < CLOSE; t++) {
      var n = 0;
      for (var k in day.shifts) {
        var s = day.shifts[k];
        if (s && s[0] <= t && t < s[1]) n++;
      }
      out.push(n);
    }
    return out;
  }

  function rowHTML(p, day) {
    var s = day.shifts[p.name];
    var bar;
    if (p.blocked) {
      bar = '<div class="tl__bar tl__bar--blocked" style="left:0;width:100%">' + p.blocked + "</div>";
    } else if (!s) {
      bar = '<div class="tl__bar tl__bar--none" style="left:0;width:100%">휴무</div>';
    } else {
      bar = '<div class="tl__bar" style="left:' + pct(s[0]).toFixed(3) + "%;width:" +
            (((s[1] - s[0]) / SPAN) * 100).toFixed(3) + '%">' +
            hhmm(s[0]) + "-" + hhmm(s[1]) + " · " + s[2] + "</div>";
    }
    return '<div class="tl__row"><span class="tl__name">' + p.name +
           "<span>" + p.role + "</span></span>" +
           '<div class="tl__track">' + bar + "</div></div>";
  }

  function render(root) {
    var day = DAYS[cur], cov = coverage(day);
    var zero = cov.filter(function (n) { return n === 0; }).length;
    var alone = cov.filter(function (n) { return n === 1; }).length;

    root.querySelector("[data-tl-rows]").innerHTML =
      STAFF.map(function (p) { return rowHTML(p, day); }).join("");

    root.querySelector("[data-tl-cover]").innerHTML =
      cov.map(function (n) { return '<span class="tl__cell" data-n="' + n + '">' + n + "</span>"; }).join("");

    var d = new Date(day.date + "T00:00:00");
    root.querySelector("[data-tl-title]").textContent =
      day.date + " " + DOW[d.getDay()];

    var badge = root.querySelector("[data-tl-badge]");
    if (zero) {
      badge.className = "badge badge--risk";
      badge.textContent = "공백 " + zero + "시간";
    } else if (alone) {
      badge.className = "badge badge--warn";
      badge.textContent = "혼자 근무 " + alone + "시간";
    } else {
      badge.className = "badge badge--ok";
      badge.textContent = "공백 없음";
    }

    /* 언제가 비는지 문장으로도 남긴다. 숫자만으로는 눈에 안 들어온다.
       흩어진 시간을 개수로 뭉뚱그리면 어디가 문제인지 알 수 없어 구간으로 묶는다. */
    function runs(match) {
      var out = [], run = null;
      cov.forEach(function (n, i) {
        if (match(n) && !run) run = [OPEN + i, OPEN + i + 1];
        else if (match(n)) run[1] = OPEN + i + 1;
        else if (run) { out.push(run); run = null; }
      });
      if (run) out.push(run);
      return out.map(function (g) { return hhmm(g[0]) + "-" + hhmm(g[1]); });
    }
    var gaps = runs(function (n) { return n === 0; });
    var solo = runs(function (n) { return n === 1; });
    var msg = [];
    if (gaps.length) msg.push(gaps.join(", ") + " 에 배정된 직원이 없다");
    if (solo.length) msg.push(solo.join(", ") + " 은 혼자 근무한다");
    root.querySelector("[data-tl-note]").textContent = msg.join(" · ") || "공백도 단독 근무도 없다";

    var sel = root.querySelector("[data-tl-date]");
    if (sel) sel.selectedIndex = cur;
    root.querySelector('[data-tl-step="-1"]').disabled = cur === 0;
    root.querySelector('[data-tl-step="1"]').disabled = cur === DAYS.length - 1;
    var td = root.querySelector("[data-tl-today]");
    if (td) td.disabled = cur === TODAY;
  }

  function boot() {
    var root = document.querySelector("[data-tl-root]");
    if (!root) return;

    var sel = root.querySelector("[data-tl-date]");
    if (sel) {
      sel.innerHTML = DAYS.map(function (d) { return "<option>" + d.label + "</option>"; }).join("");
      sel.addEventListener("change", function () { cur = sel.selectedIndex; render(root); });
    }
    root.querySelectorAll("[data-tl-step]").forEach(function (b) {
      b.addEventListener("click", function () {
        cur = Math.min(DAYS.length - 1, Math.max(0, cur + Number(b.dataset.tlStep)));
        render(root);
      });
    });
    var today = root.querySelector("[data-tl-today]");
    if (today) today.addEventListener("click", function () { cur = TODAY; render(root); });
    /* 좌우 화살표로도 넘긴다 — 하루씩 훑어볼 때 편하다. */
    root.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      cur = Math.min(DAYS.length - 1, Math.max(0, cur + (e.key === "ArrowRight" ? 1 : -1)));
      render(root); e.preventDefault();
    });
    render(root);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
