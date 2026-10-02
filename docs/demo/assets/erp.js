// 데모 HTML 의 동작. 1팀 공통 컴포넌트(src/components/common)가 React 상태로 바꾸던 클래스를 그대로 바꾼다.
// 마크업은 컴포넌트가 그리는 HTML 과 같아야 한다 — 여기서 찾는 단서는 그 마크업의 aria 속성과 클래스다.
// 여기 적은 클래스 문자열은 컴포넌트 코드와 같아야 한다. 컴포넌트가 바뀌면 같이 고치고 build-css.mjs 를 다시 돌린다.
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const swap = (el, on, onCls, offCls) => {
    if (!el) return;
    el.classList.remove(...(on ? offCls : onCls).split(" ").filter(Boolean));
    el.classList.add(...(on ? onCls : offCls).split(" ").filter(Boolean));
  };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── 열린 것 목록. Esc 는 가장 나중에 연 것만 닫는다(useDismiss 의 "가장 안쪽 먼저" 규칙). ──
  const stack = [];
  const push = (entry) => {
    stack.push(entry);
    entry.root.setAttribute("data-dismiss-open", "");
  };
  const drop = (entry) => {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
    entry.root.removeAttribute("data-dismiss-open");
  };
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !stack.length) return;
    const top = stack[stack.length - 1];
    top.close(top.root.contains(document.activeElement));
  });
  // 바깥을 누르거나 포커스가 바깥으로 나가면 닫는다. 슬라이드 패널은 바깥을 눌러도 닫히지 않는다.
  const outside = (e) => {
    for (const entry of [...stack].reverse()) {
      if (entry.sticky || entry.root.contains(e.target)) continue;
      entry.close(false);
    }
  };
  document.addEventListener("pointerdown", outside);
  document.addEventListener("focusin", outside);

  // ── Popup (popup.tsx). fold: 위에서 펼침 / fade: 투명도만 ──
  const MOTION = {
    fold: {
      open: "visible duration-[260ms] [clip-path:inset(-8px_-8px_-8px_-8px)]",
      closed: "invisible duration-[180ms] motion-reduce:opacity-0 [clip-path:inset(-8px_-8px_100%_-8px)]",
      innerOpen: "translate-y-0 duration-[260ms]",
      innerClosed: "-translate-y-[6px] duration-[180ms]",
    },
    fade: { open: "visible opacity-100 duration-200", closed: "invisible opacity-0 duration-150", innerOpen: "", innerClosed: "" },
  };
  const isPopup = (el) => el.classList.contains("top-[calc(100%+8px)]");
  const motionOf = (el) => (el.classList.contains("transition-[clip-path,visibility]") ? MOTION.fold : MOTION.fade);

  function setPopup(trigger, pop, open, refocus) {
    const m = motionOf(pop);
    swap(pop, open, m.open, m.closed);
    swap(pop.lastElementChild, open, m.innerOpen, m.innerClosed);
    pop.inert = !open;
    trigger.setAttribute("aria-expanded", String(open));
    // 트리거 화살표: 점포 선택칸은 -90 ↔ 90, 사용자 메뉴는 0 ↔ 180
    const chevron = $('img[src$="chevron-small-brand.svg"]', trigger);
    swap(chevron, open, "rotate-90", "-rotate-90");
    const more = $('img[src$="user-more.svg"]', trigger);
    if (more) more.classList.toggle("rotate-180", open);
    const wrap = trigger.parentElement;
    if (open) {
      const entry = { root: wrap, close: (back) => setPopup(trigger, pop, false, back) };
      wrap._entry = entry;
      push(entry);
    } else if (wrap._entry) {
      drop(wrap._entry);
      wrap._entry = null;
      if (refocus) trigger.focus();
    }
  }

  // ── SlidePanel (slide-panel.tsx) ──
  const isPanel = (el) => el.tagName === "ASIDE" && (el.classList.contains("translate-x-full") || el.classList.contains("translate-x-0"));

  function setPanel(trigger, panel, open) {
    swap(panel, open, "translate-x-0", "translate-x-full");
    panel.inert = !open;
    trigger.setAttribute("aria-expanded", String(open));
    if (open) {
      panel._entry = { root: panel, sticky: true, close: () => setPanel(trigger, panel, false) };
      push(panel._entry);
    } else if (panel._entry) {
      drop(panel._entry);
      panel._entry = null;
      trigger.focus();
    }
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button[aria-controls]");
    if (!t) return;
    const target = document.getElementById(t.getAttribute("aria-controls"));
    if (!target) return;
    const open = t.getAttribute("aria-expanded") !== "true";
    if (isPopup(target)) setPopup(t, target, open, false);
    else if (isPanel(target) && !target._entry) setPanel(t, target, true);
  });

  // 패널 안의 data-close 버튼(취소·저장)은 패널을 닫는다.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-close]");
    const panel = b?.closest("aside");
    if (panel?._entry) panel._entry.close();
  });

  // 드롭다운 항목을 고르면 닫는다. 점포 선택칸은 고른 값을 칸에 넣고, 원래 값을 목록으로 돌려놓는다.
  document.addEventListener("click", (e) => {
    const item = e.target.closest("[id] > div > ul button, [id] > div > ul a");
    const pop = item?.closest("[id]");
    if (!pop || !isPopup(pop)) return;
    const trigger = $(`[aria-controls="${CSS.escape(pop.id)}"]`);
    const label = trigger && $("span.flex-1.truncate", trigger);
    if (label) {
      const prev = label.textContent;
      label.textContent = item.textContent;
      item.textContent = prev;
      trigger.setAttribute("aria-label", trigger.getAttribute("aria-label").replace(/: .*/, `: ${label.textContent}`));
      document.dispatchEvent(new CustomEvent("erp:scope", { detail: label.textContent }));
    }
    if (trigger) setPopup(trigger, pop, false, true);
  });

  // ── GlobalHeader (global-header.tsx). 1depth 를 누르면 2depth 줄이 열린다 ──
  function initHeader(header) {
    const nav = $("nav.bg-erp-nav", header);
    const sub = nav?.nextElementSibling;
    if (!sub) return;
    const list = $("ul", sub);
    const buttons = $$("button", nav);
    const menus = JSON.parse(header.dataset.menus || "null") || DEFAULT_MENUS;
    let open = false;
    let menu = 0;
    let shown = 0;
    const renderItems = () => {
      list.innerHTML = (menus[shown]?.items || [])
        .map(
          (it) =>
            `<li><a href="${it.href}" class="whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand">${it.label}</a></li>`,
        )
        .join("");
    };
    const paint = () => {
      swap(sub, open, "grid-rows-[1fr]", "grid-rows-[0fr]");
      sub.inert = !open;
      swap(list, shown === menu, "opacity-100 duration-[180ms]", "opacity-0 duration-[120ms]");
      buttons.forEach((b, i) => {
        const on = open && menu === i;
        b.setAttribute("aria-expanded", String(on));
        swap(b, on, "text-erp-brand-soft", "text-white");
      });
    };
    const settle = (e) => {
      if (e.target === list && shown !== menu) {
        shown = menu;
        renderItems();
        paint();
      }
    };
    list.addEventListener("transitionend", settle);
    list.addEventListener("transitioncancel", settle);
    const entry = { root: header, close: () => ((open = false), drop(entry), paint()) };
    buttons.forEach((b, i) =>
      b.addEventListener("click", () => {
        if (!open || reduced()) {
          shown = i;
          renderItems();
        }
        open = !(open && menu === i);
        menu = i;
        open ? stack.includes(entry) || push(entry) : drop(entry);
        paint();
      }),
    );
    list.addEventListener("click", (e) => e.target.closest("a") && entry.close());
    renderItems();
  }

  // ── FilterPanel (filter-panel.tsx). 226 ↔ 76 으로 접고 편다 ──
  function initFilter(btn) {
    const aside = btn.parentElement;
    // 초기화: 처음 그려진 값으로 되돌린다(데모라 목록은 그대로).
    aside.querySelector('button[aria-label$="초기화"]:not([disabled])')?.addEventListener("click", () => {
      $$("input", aside).forEach((i) => {
        if (i.readOnly) return; // 헤더 점포 선택으로 고정된 칸은 그대로
        if (i.type === "checkbox" || i.type === "radio") i.checked = i.defaultChecked;
        else i.value = i.defaultValue;
        i.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
    const inner = aside.firstElementChild;
    const [collapse, expand] = $$("img", btn);
    const title = btn.getAttribute("aria-label").replace(/ (접기|펼치기)$/, "");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      swap(aside, open, "w-[226px]", "w-[76px]");
      swap(inner, open, "opacity-100 duration-200", "opacity-0 duration-100");
      inner.inert = !open;
      collapse.classList.toggle("invisible", !open);
      expand.classList.toggle("invisible", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", `${title} ${open ? "접기" : "펼치기"}`);
    });
  }

  // ── SearchField (search-field.tsx). 값이 있을 때만 지우기 버튼 ──
  function initSearch(input) {
    const clear = input.parentElement.querySelector('button[aria-label="입력 지우기"]');
    const sync = () => {
      const has = !!input.value && !input.readOnly;
      swap(clear, has, "opacity-100", "pointer-events-none opacity-0");
      clear.inert = !has;
    };
    input.addEventListener("input", sync);
    clear.addEventListener("click", () => {
      input.value = "";
      sync();
      input.focus();
    });
    sync();
  }

  // ── 필터의 점포 칸(data-scope-store). 헤더 점포 선택이 점포 1개면 그 점포로 고정하고,
  // 전체·일반점포 전체·가맹점포 전체처럼 묶음이면 고정을 풀어 검색할 수 있게 한다 ──
  function initScopeStore(input) {
    const set = (scope) => {
      const one = !/전체/.test(scope);
      if (!one && !input.readOnly) return;
      input.readOnly = one;
      input.value = one ? scope : "";
      input.style.backgroundColor = one ? "var(--color-erp-thead-bg)" : "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };
    document.addEventListener("erp:scope", (e) => set(e.detail));
    const now = $('header button[aria-label^="점포: "]');
    if (now) set(now.getAttribute("aria-label").slice(4));
  }

  // ── 근무 일정 입력(data-workplan) → 소정근로시간 표(data-hours)·주 시간(data-hours-sum) ──
  // 근무요일(월~일)은 눌러서 켜고 끈다. 시·분은 선택칸.
  function initWorkPlan(root) {
    const table = $("table[data-hours]");
    const sum = $("[data-hours-sum]");
    if (!table) return;
    const v = (k) => Math.min(59, Math.max(0, parseInt($(`[data-k="${k}"]`, root).value, 10) || 0));
    const at = (k) => `${pad(v(`${k}-sh`))}:${pad(v(`${k}-sm`))}`;
    const to = (k) => `${pad(v(`${k}-eh`))}:${pad(v(`${k}-em`))}`;
    const len = (k) => v(`${k}-eh`) * 60 + v(`${k}-em`) - (v(`${k}-sh`) * 60 + v(`${k}-sm`));
    const sync = () => {
      const on = Object.fromEntries($$("button[aria-pressed]", root).map((b) => [b.textContent, b.getAttribute("aria-pressed") === "true" ? 1 : 0]));
      const day = Math.max(0, len("work") - Math.max(0, len("rest")));
      [...table.tBodies[0].rows].forEach((tr) => {
        const d = (tr.dataset.day ||= tr.cells[0].textContent);
        const f = on[d] || 0;
        [at("work"), to("work"), at("rest"), to("rest")].forEach((t, i) => (tr.cells[i + 1].textContent = f ? t : "-"));
      });
      if (sum) sum.textContent = ((Object.values(on).reduce((n, f) => n + f, 0) * day) / 60).toFixed(1);
    };
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button[aria-pressed]");
      if (!b) return;
      b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
      sync();
    });
    root.addEventListener("input", sync);
    root.addEventListener("change", sync);
    sync();
  }

  // ── 첨부 파일 칸(data-file): 고른 파일 이름을 옆 칸에 보인다 ──
  document.addEventListener("change", (e) => {
    const f = e.target.closest('[data-file] input[type="file"]');
    if (f) $("input[readonly]", f.closest("[data-file]")).value = [...f.files].map((x) => x.name).join(", ");
  });

  // ── 라디오에서 고른 값에 따라 칸을 보이고 숨긴다: data-when="라디오 name:고른 항목 글자" ──
  function initWhen(els) {
    const picked = (name) => $(`input[type="radio"][name="${CSS.escape(name)}"]:checked`)?.closest("label")?.textContent.trim();
    const sync = () =>
      els.forEach((el) => {
        const [name, value] = el.dataset.when.split(":");
        el.hidden = picked(name) !== value;
      });
    document.addEventListener("change", (e) => e.target.type === "radio" && sync());
    sync();
  }

  // ── Pagination (pagination.tsx). 데모라 번호 강조만 옮긴다 ──
  const PAGE_ON = "bg-erp-subtle font-semibold text-erp-ink";
  const PAGE_OFF = "bg-white text-erp-muted hover:border-erp-brand hover:text-erp-ink";
  function initPagination(nav) {
    const nums = $$("ol button", nav);
    const [prev, next] = [nav.firstElementChild, nav.lastElementChild];
    const go = (n) => {
      nums.forEach((b) => {
        const on = Number(b.textContent) === n;
        swap(b, on, PAGE_ON, PAGE_OFF);
        on ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current");
      });
      prev.disabled = n <= Number(nums[0].textContent);
      next.disabled = n >= Number(nums[nums.length - 1].textContent);
    };
    const current = () => Number($('[aria-current="page"]', nav)?.textContent || 1);
    nums.forEach((b) => b.addEventListener("click", () => go(Number(b.textContent))));
    prev.addEventListener("click", () => go(current() - 1));
    next.addEventListener("click", () => go(current() + 1));
  }

  // ── DateField (date-field.tsx). 날짜판은 popover 로 띄운다 ──
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (v) => {
    const m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec((v || "").trim());
    if (!m) return null;
    const d = new Date(+m[1], m[2] - 1, +m[3]);
    return d.getMonth() === m[2] - 1 && d.getDate() === +m[3] ? d : null;
  };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const shiftMonth = (d, n) => {
    const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
    return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
  };
  const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  const CELL = "grid h-[32px] w-[34px] place-items-center rounded-[2px] text-[14px] transition-colors duration-150 ease-out";
  const NAV = "grid size-[28px] place-items-center rounded-[2px] text-erp-label transition-colors duration-150 ease-out hover:bg-erp-thead-bg";
  const FOOT = "text-[13px] transition-colors duration-150 ease-out";
  const ICON = (name, cls = "") => `<img alt="" width="5" height="8" class="${cls}" src="${ASSETS}icons/${name}">`;

  function initDate(trigger) {
    const pop = document.getElementById(trigger.getAttribute("popovertarget"));
    const wrap = trigger.parentElement;
    const input = $("input", wrap);
    let cursor = new Date();
    const place = () => {
      const r = wrap.getBoundingClientRect();
      const below = innerHeight - r.bottom > pop.offsetHeight + 16;
      pop.style.left = `${Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8))}px`;
      pop.style.top = `${Math.max(8, below ? r.bottom + 6 : r.top - pop.offsetHeight - 6)}px`;
    };
    const render = () => {
      const value = parse(input.value);
      const today = iso(new Date());
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const start = addDays(first, -first.getDay());
      const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
      const cell = (d) => {
        const key = iso(d);
        const sel = value && key === iso(value);
        const tone = sel
          ? "bg-erp-brand text-white"
          : `hover:bg-erp-thead-bg ${key === today ? "border border-erp-brand text-erp-brand" : d.getMonth() !== cursor.getMonth() ? "text-erp-label" : "text-erp-ink"}`;
        return `<button type="button" role="gridcell" data-day="${key}" aria-label="${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일" aria-selected="${!!sel}"${key === today ? ' aria-current="date"' : ""} tabindex="${key === iso(cursor) ? 0 : -1}" class="${CELL} ${tone}">${d.getDate()}</button>`;
      };
      pop.innerHTML = `
        <div class="flex items-center justify-between">
          <button type="button" aria-label="이전 달" data-move="-1" class="${NAV}">${ICON("chevron-small.svg")}</button>
          <p aria-live="polite" class="text-[15px] font-semibold text-erp-ink">${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월</p>
          <button type="button" aria-label="다음 달" data-move="1" class="${NAV}">${ICON("chevron-small.svg", "rotate-180")}</button>
        </div>
        <div role="grid" class="mt-[12px]">
          <div role="row" class="flex">${WEEK.map((w, i) => `<span role="columnheader" class="grid h-[28px] w-[34px] place-items-center text-[12px] ${i === 0 ? "text-[#e93737]" : "text-erp-label"}">${w}</span>`).join("")}</div>
          ${Array.from({ length: 6 }, (_, w) => `<div role="row" class="flex">${days.slice(w * 7, w * 7 + 7).map(cell).join("")}</div>`).join("")}
        </div>
        <div class="mt-[12px] flex justify-between border-t border-erp-divider pt-[12px]">
          <button type="button" data-clear class="${FOOT} text-erp-label hover:text-erp-ink">지우기</button>
          <button type="button" data-today class="${FOOT} text-erp-brand hover:text-erp-ink">오늘</button>
        </div>`;
      $('[tabindex="0"]', pop)?.focus();
    };
    const close = () => {
      pop.hidePopover();
      trigger.focus();
    };
    const pick = (d) => {
      input.value = iso(d);
      close();
    };
    trigger.addEventListener("click", () => {
      cursor = parse(input.value) || new Date();
    });
    pop.addEventListener("toggle", (e) => {
      const opened = e.newState === "open";
      trigger.setAttribute("aria-expanded", String(opened));
      if (opened) {
        render();
        place();
        addEventListener("scroll", place, { capture: true, passive: true });
        addEventListener("resize", place);
      } else {
        removeEventListener("scroll", place, { capture: true });
        removeEventListener("resize", place);
        pop.innerHTML = "";
        if (document.activeElement === document.body) trigger.focus();
      }
    });
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.day) pick(parse(b.dataset.day));
      else if (b.dataset.move) ((cursor = shiftMonth(cursor, +b.dataset.move)), render());
      else if ("clear" in b.dataset) ((input.value = ""), close());
      else if ("today" in b.dataset) pick(new Date());
    });
    pop.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (step) cursor = addDays(cursor, step);
      else if (e.key === "PageUp") cursor = shiftMonth(cursor, -1);
      else if (e.key === "PageDown") cursor = shiftMonth(cursor, 1);
      else return;
      e.preventDefault();
      render();
    });
    input.addEventListener("blur", () => {
      const d = parse(input.value);
      if (d) input.value = iso(d);
      else if (input.value) input.value = "";
    });
  }

  // ── 주 선택(직원 상세 근무스케줄). 화살표로 한 주씩, 가운데 버튼은 달력에서 그 달의 몇째 주를 고른다 ──
  // 주는 월요일에 시작한다. 몇째 주인지는 목요일이 든 달로 센다(9월 1주 = 08-31 ~ 09-06).
  // data-weeks 가 가리키는 묶음의 [data-week="월요일"] 하나만 보이고, 없는 주는 data-week="" 빈 표를 보인다.
  const monday = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const md = (d) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const WEEK_MON = ["월", "화", "수", "목", "금", "토", "일"];
  function initWeeks(nav) {
    const box = nav.dataset.weeks && document.getElementById(nav.dataset.weeks);
    const blocks = box ? $$("[data-week]", box) : [];
    const [prev, trigger, next] = $$(":scope > button", nav);
    const pop = document.getElementById(trigger.getAttribute("popovertarget"));
    // data-step="day" 이면 하루씩 넘기고 달력에서 날짜 하나를 고른다(출퇴근 현황 일별).
    const day = nav.dataset.step === "day";
    const step = day ? 1 : 7;
    const first = parse(nav.dataset.weekStart);
    let mon = first;
    let cursor = mon;
    const show = () => {
      const key = iso(mon);
      const hit = blocks.find((b) => b.dataset.week === key) || blocks.find((b) => b.dataset.week === "");
      blocks.forEach((b) => (b.hidden = b !== hit));
      trigger.textContent = day ? `${iso(mon)} (${WEEK[mon.getDay()]})` : `${mon.getFullYear()}년 ${md(mon)} ~ ${md(addDays(mon, 6))}`;
    };
    const head = (y, m) => `
        <div class="flex items-center justify-between">
          <button type="button" aria-label="이전 달" data-move="-1" class="${NAV}">${ICON("chevron-small.svg")}</button>
          <p aria-live="polite" class="text-[15px] font-semibold text-erp-ink">${y}년 ${m + 1}월</p>
          <button type="button" aria-label="다음 달" data-move="1" class="${NAV}">${ICON("chevron-small.svg", "rotate-180")}</button>
        </div>`;
    const foot = (label) => `
        <div class="mt-[12px] flex justify-end border-t border-erp-divider pt-[12px]">
          <button type="button" data-first class="${FOOT} text-erp-brand hover:text-erp-ink">${label}</button>
        </div>`;
    const renderDay = () => {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const last = new Date(y, m + 1, 0);
      const rows = [];
      for (let w = monday(new Date(y, m, 1)); w <= last; w = addDays(w, 7)) rows.push(w);
      const cell = (d) => {
        const sel = iso(d) === iso(mon);
        return `<button type="button" data-pick="${iso(d)}" aria-pressed="${sel}" aria-label="${d.getMonth() + 1}월 ${d.getDate()}일" class="grid h-[32px] w-[33px] place-items-center rounded-[2px] text-[14px] transition-colors duration-150 ease-out ${sel ? "bg-erp-brand text-white" : `hover:bg-erp-thead-bg ${d.getMonth() !== m ? "text-erp-label" : "text-erp-ink"}`}">${d.getDate()}</button>`;
      };
      pop.innerHTML = `${head(y, m)}
        <div class="mt-[12px] flex text-[12px] text-erp-label">${WEEK_MON.map((w) => `<span class="grid h-[28px] w-[33px] place-items-center">${w}</span>`).join("")}</div>
        ${rows.map((w) => `<div class="flex">${Array.from({ length: 7 }, (_, i) => cell(addDays(w, i))).join("")}</div>`).join("")}
        ${foot("오늘")}`;
      $('[aria-pressed="true"]', pop)?.focus();
    };
    const render = () => {
      if (day) return renderDay();
      // cursor 달에 목요일이 드는 주들
      const thu1 = new Date(cursor.getFullYear(), cursor.getMonth(), 1 + ((4 - new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 7) % 7));
      const rows = [];
      for (let m = addDays(thu1, -3); addDays(m, 3).getMonth() === thu1.getMonth(); m = addDays(m, 7)) rows.push(m);
      const row = (m, n) => {
        const sel = iso(m) === iso(mon);
        const days = Array.from({ length: 7 }, (_, i) => addDays(m, i))
          .map((d) => `<span class="grid h-[32px] w-[26px] place-items-center ${!sel && d.getMonth() !== thu1.getMonth() ? "text-erp-label" : ""}">${d.getDate()}</span>`)
          .join("");
        return `<button type="button" data-pick="${iso(m)}" aria-pressed="${sel}" class="flex w-full items-center rounded-[2px] text-[14px] transition-colors duration-150 ease-out ${sel ? "bg-erp-brand text-white" : "text-erp-ink hover:bg-erp-thead-bg"}"><span class="w-[54px] text-[13px] font-semibold">${n}주</span>${days}</button>`;
      };
      pop.innerHTML = `${head(thu1.getFullYear(), thu1.getMonth())}
        <div class="mt-[12px] flex text-[12px] text-erp-label"><span class="w-[54px]"></span>${WEEK_MON.map((w) => `<span class="grid h-[28px] w-[26px] place-items-center">${w}</span>`).join("")}</div>
        <div class="flex flex-col gap-[2px]">${rows.map((m, i) => row(m, i + 1)).join("")}</div>
        ${foot("이번 주")}`;
      $('[aria-pressed="true"]', pop)?.focus();
    };
    const place = () => {
      const r = trigger.getBoundingClientRect();
      pop.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - pop.offsetWidth / 2, innerWidth - pop.offsetWidth - 8))}px`;
      pop.style.top = `${r.bottom + 6}px`;
    };
    const go = (m) => {
      mon = m;
      show();
    };
    prev.addEventListener("click", () => go(addDays(mon, -step)));
    next.addEventListener("click", () => go(addDays(mon, step)));
    pop.addEventListener("toggle", (e) => {
      const opened = e.newState === "open";
      trigger.setAttribute("aria-expanded", String(opened));
      if (opened) {
        cursor = day ? mon : addDays(mon, 3);
        render();
        place();
        addEventListener("scroll", place, { capture: true, passive: true });
        addEventListener("resize", place);
      } else {
        removeEventListener("scroll", place, { capture: true });
        removeEventListener("resize", place);
        pop.innerHTML = "";
      }
    });
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.pick) (go(parse(b.dataset.pick)), pop.hidePopover(), trigger.focus());
      else if (b.dataset.move) ((cursor = shiftMonth(cursor, +b.dataset.move)), render());
      else if ("first" in b.dataset) (go(first), pop.hidePopover(), trigger.focus());
    });
    show();
  }

  // 이 스크립트 파일이 있는 폴더(assets/). 화면이 하위 폴더에 있어도 아이콘 경로가 맞도록 여기서 잡는다.
  const ASSETS = document.currentScript.src.replace(/erp\.js(\?.*)?$/, "");

  // 헤더 메뉴. 화면에 data-menus 가 없으면 이것을 쓴다. 3단계에서 데모 화면 주소를 채운다.
  const menu = (label, items) => ({ label, items: items.map((l) => ({ label: l, href: "#" })) });
  const DEFAULT_MENUS = [
    menu("기초정보관리", ["상품 정보 관리", "가격 정보 관리", "카테고리 정보 관리", "자재 정보 관리"]),
    menu("점포관리", ["점포 정보 관리", "계약서 템플릿 관리", "계약서 관리", "시설물 및 장비 관리", "점검표 템플릿 관리", "점검 결과 관리"]),
    menu("직원관리", ["직원 정보 관리", "근로계약 관리", "급여명세서 관리", "근무 스케줄 관리", "출·퇴근 현황 조회", "TO-DO List 관리"]),
    menu("매출조회", ["매출 조회", "매출 통계", "매출 분석"]),
    menu("재무관리", ["입·출금 관리", "매출/매입 거래 등록", "계정별 현황 조회"]),
    menu("환경설정", ["관리자 관리", "권한 관리", "공통코드 관리", "휴일 관리"]),
    menu("고객지원", ["부가서비스 구독 관리", "구독료 청구 및 납부 현황", "결제수단 관리", "정산 현황 조회", "공지사항", "문의하기"]),
  ];

  // ── 탭 (src/extra.mjs, 1팀 컴포넌트 아님) ──
  function selectTab(btn) {
    const list = btn.closest('[role="tablist"]');
    $$('[role="tab"]', list).forEach((t) => {
      const on = t === btn;
      t.setAttribute("aria-selected", String(on));
      swap(t, on, t.dataset.on, t.dataset.off);
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest('[role="tab"]');
    if (t) selectTab(t);
  });
  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const t = id && $(`[role="tab"][aria-controls="${CSS.escape(id)}"]`);
    if (!t) return;
    selectTab(t);
    // 주소의 #id 로 브라우저가 패널까지 내려 버려 탭 줄이 가려진다. 감싸는 스크롤 영역을 모두 맨 위로 돌린다.
    const top = () => {
      for (let el = t; el; el = el.parentElement) el.scrollTop = 0;
      scrollTo(0, 0);
    };
    top();
    requestAnimationFrame(top);
  };
  addEventListener("load", fromHash);
  addEventListener("hashchange", fromHash);

  // ── 확인창 (src/extra.mjs). 네이티브 dialog ──
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-dialog]");
    if (open) document.getElementById(open.dataset.dialog)?.showModal();
    const close = e.target.closest("dialog [data-close]");
    if (close) close.closest("dialog").close();
  });

  // ── 목록 거르기(데모). 필터 패널·목록 위 검색칸·선택칸의 값으로 표 줄이나 카드를 숨긴다. ──
  // 필터 이름(필터 묶음 이름, 칸의 aria-label)이 표 머리와 같으면 그 열로, 아니면 줄 전체 글자로 거른다.
  // 체크 묶음은 고른 값 중 하나와 같은 낱말이 있으면 통과(모두 켜거나 모두 끄면 거르지 않음), 「전체」 선택칸도 거르지 않는다.
  const norm = (t) => (t || "").toLowerCase().replace(/[\s\-.·,()]/g, "");
  const words = (t) => (t || "").split(/[\s·,/()]+/).filter(Boolean);
  const SKIP = /페이지당|검색 기준|연도|^월$/;

  // 요소 안 글자를 칸·줄 사이에 띄어쓰기를 넣어 모은다(textContent 는 칸 글자를 붙여 버린다).
  const textOf = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const out = [];
    while (w.nextNode()) out.push(w.currentNode.nodeValue);
    return out.join(" ").replace(/\s+/g, " ");
  };

  function itemsOf(set) {
    if (set.tagName === "TABLE") {
      const heads = $$("thead th", set).map((th) => th.textContent.trim());
      const rows = $$("tbody tr", set).filter((tr) => !tr.hasAttribute("data-empty") && !tr.querySelector("td[colspan]"));
      return { heads, items: rows.map((el) => ({ el, cells: $$("td", el).map((td) => textOf(td).trim()), all: `${textOf(el)} ${el.dataset.search || ""}` })) };
    }
    const items = $$(":scope > *", set).filter((el) => !el.hasAttribute("data-empty"));
    const heads = [...new Set(items.flatMap((el) => [...$$("dt", el).map((d) => d.textContent.trim()), ...Object.keys(JSON.parse(el.dataset.fields || "{}"))]))];
    return {
      heads,
      items: items.map((el) => {
        const dl = { ...Object.fromEntries($$("dt", el).map((d) => [d.textContent.trim(), d.nextElementSibling?.textContent.trim() || ""])), ...JSON.parse(el.dataset.fields || "{}") };
        return { el, cells: heads.map((h) => String(dl[h] ?? "")), all: `${textOf(el)} ${Object.values(dl).join(" ")}` };
      }),
    };
  }

  // 이름이 가리키는 열. 「아이디 · 이름」처럼 여럿이면 그 열들 중 하나라도 맞으면 된다.
  // 「이름·휴대전화번호로 검색」처럼 끝말을 떼고 나눈 조각이 모두 열 이름과 맞을 때만 그 열로 좁히고, 하나라도 없으면 줄 전체에서 찾는다.
  const partsOf = (label) =>
    label
      .replace(/(으)?로\s*(검색|찾기)$|\s*(입력|검색)$/, "")
      .split(/[·,]/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 2);
  const colsFor = (heads, label) => {
    const parts = partsOf(label);
    const hit = (p) => heads.map((h, i) => [h, i]).filter(([h]) => h && (p === h || h.includes(p) || (h.length >= 2 && p.includes(h)))).map(([, i]) => i);
    const per = parts.map(hit);
    return parts.length && per.every((c) => c.length) ? [...new Set(per.flat())] : [];
  };
  const textsFor = (it, cols) => (cols.length ? cols.map((i) => it.cells[i] || "") : [it.all]);

  // 거르기 칸으로 볼 것: 목록 밖에 있고, 확인창·등록 패널(aria-label 이 있는 aside) 안이 아닌 칸.
  const FILTER_CTRL = 'input[type="search"], select, input[type="checkbox"], input[type="radio"]';
  const labelOf = (c) => c.closest('[role="group"], [role="radiogroup"]')?.getAttribute("aria-label") || c.getAttribute("aria-label") || c.placeholder || "";
  const isFilterCtrl = (c, set) =>
    !set.contains(c) &&
    !c.closest("table, dialog, aside[aria-label], header") &&
    // 폼 칸(ui.field 는 label 로 감싼다)은 거르기 칸이 아니다. 체크·라디오는 제 label 안에 있으니 묶음으로 본다.
    !(c.closest("label") && c.type !== "checkbox" && c.type !== "radio") &&
    !(c.type === "checkbox" && !c.closest('[role="group"]')) &&
    // 다른 탭 패널 안의 칸은 그 탭 목록의 것이다.
    !(c.closest('[role="tabpanel"]') && !c.closest('[role="tabpanel"]').contains(set)) &&
    !SKIP.test(labelOf(c)) &&
    !SKIP.test(c.getAttribute("aria-label") || "");

  // 목록에서 위로 올라가며 거르기 칸이 처음 보이는 영역을 찾는다(탭 패널, 목록 카드, 왼쪽 필터까지 품은 본문).
  function filterRoot(set) {
    for (let el = set.parentElement; el && el !== document.body; el = el.parentElement) {
      if (el.querySelector("header")) return null; // 화면 전체까지 올라가면 그만(다른 탭·폼의 칸을 잡지 않게)
      if ($$(FILTER_CTRL, el).some((c) => isFilterCtrl(c, set))) {
        // 폼(ui.field 로 감싼 입력칸·여러 줄 칸이 있는 곳) 안의 표는 거르지 않는다 — 주소 검색칸 같은 것이 표를 거르면 안 된다.
        return el.querySelector('label input:not([type="checkbox"]):not([type="radio"]):not([type="search"]), textarea') ? null : el;
      }
    }
    return null;
  }

  // 체크·라디오의 이름. 「접수 1」처럼 끝에 붙은 건수는 뗀다.
  const optText = (c) => (c.closest("label")?.textContent || "").trim().replace(/\s*\d+$/, "");

  function readConditions(root, set) {
    const conds = [];
    const ctrls = $$(FILTER_CTRL, root).filter((c) => isFilterCtrl(c, set));
    // 체크 묶음: 고른 값 중 하나(모두 켜거나 모두 끄면 거르지 않음)
    const groups = new Map();
    for (const c of ctrls.filter((c) => c.type === "checkbox" && c.getAttribute("role") !== "switch")) {
      const g = c.closest('[role="group"]');
      if (g) groups.set(g, [...(groups.get(g) || []), c]);
    }
    for (const [g, boxes] of groups) {
      const on = boxes.filter((b) => b.checked).map((b) => optText(b));
      if (on.length && on.length < boxes.length) conds.push({ label: g.getAttribute("aria-label"), any: on });
    }
    // 라디오 묶음: 고른 값이 「전체」거나 처음 고른 값이면 거르지 않음
    const radios = new Map();
    for (const c of ctrls.filter((c) => c.type === "radio")) radios.set(c.name, [...(radios.get(c.name) || []), c]);
    for (const list of radios.values()) {
      const on = list.find((r) => r.checked);
      const text = on && optText(on);
      if (!on || on.defaultChecked || /전체/.test(text)) continue;
      conds.push({ label: labelOf(on), any: [text] });
    }
    // 검색칸·선택칸
    for (const c of ctrls.filter((c) => c.type !== "checkbox" && c.type !== "radio")) {
      const v = c.tagName === "SELECT" ? c.value : c.value.trim();
      // 선택칸은 「전체」거나 처음 그려진 값 그대로면 거르지 않는다(목업이 처음 보여 준 목록을 그대로 둔다).
      if (!v || (c.tagName === "SELECT" && (/전체/.test(v) || c.selectedOptions[0]?.defaultSelected || (c.selectedIndex === 0 && ![...c.options].some((o) => o.defaultSelected))))) continue;
      conds.push(c.tagName === "SELECT" ? { label: labelOf(c), any: [v] } : { label: labelOf(c), text: v });
    }
    return conds;
  }

  function applyFilter(set) {
    const root = filterRoot(set);
    if (!root) return;
    const scope = root;
    const conds = readConditions(root, set);
    const { heads, items } = itemsOf(set);
    const pass = (it, c, whole) => {
      const texts = whole ? [it.all] : textsFor(it, colsFor(heads, c.label));
      if (c.text) return texts.some((t) => norm(t).includes(norm(c.text)));
      // 같은 낱말이면 통과. 「운영 총괄 · BA000003」처럼 네 글자 이상 값은 띄어쓰기·기호를 빼고 포함 여부로 본다(「운영」이 「미운영」에 걸리지 않게 짧은 값은 낱말로만).
      return texts.some((t) => c.any.some((a) => t.trim() === a || words(t).includes(a) || (a.length >= 4 && norm(t).includes(norm(a)))));
    };
    // 이름이 같은 열에 그 값이 하나도 없으면(「담당」 열은 이름인데 선택값은 「개인 배정」 등) 줄 전체 글자로 다시 본다.
    // 검색어는 그 열에서만 찾는다(사업자등록번호 칸에 「모리」를 쳐서 점포명이 걸리면 안 된다). 고르는 값만 줄 전체로 다시 본다.
    for (const c of conds) c.whole = !c.text && !items.some((it) => pass(it, c, false));
    const first = $$("table, [data-filter-items]", root).find((t) => !t.closest("dialog, aside[aria-label]") && (t.tagName !== "TABLE" || t.tHead));
    // 고르는 조건이 이 목록의 어느 열과도 이름이 맞지 않고 어느 줄에도 없으면, 이 목록과 상관없는 조건으로 보고 무시한다
    // (급여명세서 화면의 「명세서 상태」가 「검토 대기」 표까지 비우지 않게). 검색어는 늘 그대로 건다.
    const active = conds.filter((c) => c.text || colsFor(heads, c.label).length || items.some((it) => pass(it, c, true)));
    let shown = 0;
    for (const it of items) {
      const ok = active.every((c) => pass(it, c, c.whole));
      it.el.hidden = !ok;
      if (ok) shown++;
    }
    // 빈 결과
    let empty = $(":scope [data-empty]", set.tagName === "TABLE" ? set.tBodies[0] : set);
    if (!empty) {
      empty =
        set.tagName === "TABLE"
          ? Object.assign(document.createElement("tr"), {
              innerHTML: `<td colspan="${heads.length || 1}" class="text-center text-erp-muted">조회된 결과가 없습니다.</td>`,
            })
          : Object.assign(document.createElement("div"), { textContent: "조회된 결과가 없습니다." });
      empty.setAttribute("data-empty", "");
      empty.className = set.tagName === "TABLE" ? "h-[92px] border-b border-erp-thead-line" : "col-span-full grid h-[92px] place-items-center text-[14px] text-erp-muted";
      (set.tagName === "TABLE" ? set.tBodies[0] : set).append(empty);
    }
    empty.hidden = shown > 0 || !items.length;
    // 목록 위 「총 N 건」(보이는 목록일 때만)
    const panel = set.closest('[role="tabpanel"]');
    if (set === first && (!panel || !panel.hidden)) {
      const total = $$("p", root).find((p) => /^총\s/.test(p.textContent.trim()) && p.querySelector("b"));
      if (total) {
        total.dataset.base ??= total.querySelector("b").textContent;
        total.querySelector("b").textContent = conds.length ? shown.toLocaleString("ko-KR") : total.dataset.base;
      }
    }
  }

  function initFilters() {
    const sets = [...$$("table").filter((t) => t.tHead && t.tBodies[0] && !t.closest("dialog, aside[aria-label]")), ...$$("[data-filter-items]")];
    if (!sets.length) return;
    const run = () => sets.forEach(applyFilter);
    document.addEventListener("input", (e) => e.target.matches("input, select") && !e.target.closest("dialog") && run());
    document.addEventListener("change", (e) => e.target.matches("input, select") && !e.target.closest("dialog") && run());
    document.addEventListener("click", (e) => e.target.closest('button[aria-label="검색"]') && run());
  }

  const init = () => {
    fromHash();
    initFilters();
    $$("header").forEach(initHeader);
    $$('button[aria-expanded][aria-label$="접기"], button[aria-expanded][aria-label$="펼치기"]').forEach(initFilter);
    $$('input[type="search"]').forEach(initSearch);
    $$("input[data-scope-store]").forEach(initScopeStore);
    initWhen($$("[data-when]"));
    $$("[data-workplan]").forEach(initWorkPlan);
    $$('nav[aria-label="페이지"]').forEach(initPagination);
    $$("button[popovertarget]:not([data-week-label])").forEach(initDate);
    $$("[data-weeks]").forEach(initWeeks);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
