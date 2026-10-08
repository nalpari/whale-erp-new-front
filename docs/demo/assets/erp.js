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

  // 바탕창(PANEL_BACKDROP) — 패널이 열리면 같이 떠서 화면 전체(헤더 포함)를 막고, 패널이 닫히면 같이 꺼진다.
  function setBackdrop(open) {
    const bd = $("[data-panel-backdrop]");
    if (!bd) return;
    swap(bd, open, "opacity-100", "opacity-0");
    bd.inert = !open;
  }

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
    // 겹쳐 연 패널(상세 위 수정)을 닫을 때는 아래 패널이 아직 열려 있으니 바탕창을 걷지 않는다
    setBackdrop(stack.some((entry) => entry.sticky));
  }

  // 바탕창을 누르면 열려 있는 패널을 모두 닫는다(2026-10-06 피드백) — 패널이 닫히기 전에는 바탕창이 뒤 버튼 클릭을 막는다.
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-panel-backdrop]")) return;
    [...stack].reverse().forEach((entry) => entry.sticky && entry.close());
  });

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button[aria-controls]");
    if (!t) return;
    const target = document.getElementById(t.getAttribute("aria-controls"));
    if (!target) return;
    const open = t.getAttribute("aria-expanded") !== "true";
    if (isPopup(target)) setPopup(t, target, open, false);
    else if (isPanel(target) && !target._entry) setPanel(t, target, true);
  });

  // 패널 안의 data-close 버튼(닫기·취소)은 패널을 닫는다. 저장류 버튼은 data-close 를 달지 않아 패널이 열린 채로 남는다.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-close]");
    if (b?.closest("dialog")) return; // 패널 안 확인창의 버튼은 확인창만 닫는다
    const panel = b?.closest("aside");
    if (panel?._entry) panel._entry.close();
  });

  // 저장하고 다른 슬라이드로 가기(data-save-panel="패널 id") — 자기 패널을 닫고, 그 패널이 아직 닫혀 있으면 연다.
  // 상세 위에 겹쳐 연 수정 패널은 닫기만 해도 아래 상세 패널이 보인다. 주소의 ?panel=id 는 화면을 열 때 그 패널을 연다.
  const openPanelById = (id) => {
    const target = document.getElementById(id);
    const t = $(`button[aria-controls="${CSS.escape(id)}"]`);
    if (target && t && isPanel(target) && !target._entry) setPanel(t, target, true);
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-save-panel]");
    if (!b) return;
    b.closest("aside")?._entry?.close();
    openPanelById(b.dataset.savePanel);
  });
  const wantPanel = new URLSearchParams(location.search).get("panel");
  if (wantPanel) openPanelById(wantPanel);

  // ── Toast (저장 등 완료 안내). data-toast="문구" 버튼을 누르면 화면 아래에 잠깐 떴다가 사라진다 ──
  let toastEl, toastTimer;
  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      toastEl.className =
        "fixed inset-x-0 bottom-[32px] z-50 mx-auto w-fit rounded-[2px] bg-erp-nav px-[18px] py-[12px] text-[14px] text-white opacity-0 translate-y-[6px] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none pointer-events-none";
      document.body.append(toastEl);
    }
    toastEl.textContent = msg;
    clearTimeout(toastTimer);
    requestAnimationFrame(() => toastEl.classList.remove("opacity-0", "translate-y-[6px]"));
    toastTimer = setTimeout(() => toastEl.classList.add("opacity-0", "translate-y-[6px]"), 2200);
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-toast]");
    if (t?.dataset.toast) showToast(t.dataset.toast);
  });
  // "저장" 버튼은 어디서든 공통으로 "저장되었습니다." 토스트를 띄운다(2026-10-06 피드백) — data-toast 로 자기만의
  // 문구를 이미 정한 버튼과, 또 다른 확인창을 먼저 여는 버튼(data-dialog, 아직 저장이 끝난 게 아니다)은 건너뛴다.
  // 점포 등록·수정의 [저장] 은 다음 화면으로 가는 링크라, 바로 옮기면 토스트가 보이지 않는다 — 조금 늦게 옮긴다.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button, a[href]");
    if (!b || b.textContent.trim() !== "저장" || b.hasAttribute("data-toast") || b.hasAttribute("data-dialog")) return;
    showToast("저장되었습니다.");
    const href = b.getAttribute("href");
    if (href) {
      e.preventDefault();
      setTimeout(() => (location.href = b.href), 900);
    }
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

  // ── 점포 범위 드롭다운(scopeDropdown). 전체·일반·가맹 묶음 + 점포 목록이 role="option" 버튼으로 평평하게 들어 있어
  // 위 일반 드롭다운(ul 전제)과는 별도로 고른다. 칸의 점포 값만 바꾸고 BP 이름은 그대로 둔다 ──
  document.addEventListener("click", (e) => {
    const opt = e.target.closest('[data-scope-label][role="option"]');
    if (!opt) return;
    const pop = opt.closest("[id]");
    if (!pop) return;
    const trigger = $(`[aria-controls="${CSS.escape(pop.id)}"]`);
    if (!trigger) return;
    $$('[role="option"]', pop).forEach((o) => o.setAttribute("aria-selected", String(o === opt)));
    const value = $("[data-scope-value]", trigger);
    if (value) value.textContent = opt.dataset.scopeLabel;
    trigger.setAttribute("aria-label", `점포: ${opt.dataset.scopeLabel}`);
    setPopup(trigger, pop, false, true);
    document.dispatchEvent(new CustomEvent("erp:scope", { detail: opt.dataset.scopeLabel }));
  });

  // 점포 이름으로 찾기 — 묶음(전체·일반·가맹, 또는 직영·가맹 선택 확인창)과 이름·코드가 맞는 점포만 남기고, 빈 묶음은 숨긴다.
  // role="option" 평평한 목록(scopeDropdown)과 라벨·체크박스 목록(BP·점포 선택 확인창) 모두 data-scope-q 를 들고 있어 같이 거른다.
  document.addEventListener("input", (e) => {
    const q = e.target.closest("[data-scope-q-input]");
    if (!q) return;
    const pop = q.closest("[id]");
    const list = $("[data-scope-list]", pop);
    const term = q.value.trim().toLowerCase();
    let any = false;
    $$("[data-scope-sect]", list).forEach((sect) => {
      let sectAny = false;
      $$("[data-scope-q]", sect).forEach((o) => {
        const hit = !term || (o.dataset.scopeQ || "").toLowerCase().includes(term);
        o.hidden = !hit;
        if (hit) sectAny = true;
      });
      sect.hidden = !sectAny;
      if (sectAny) any = true;
    });
    const none = $("[data-scope-none]", pop);
    if (none) none.hidden = any;
  });

  // ── BP 및 점포 선택 확인창(platformScopeDialog, F-TLJOCK) — 묶음 체크 ↔ 개별 점포 체크 두 방향 동기화, 선택 결과 요약 ──
  function paintScopeGroup(g, state) {
    g.setAttribute("aria-checked", state);
    g.classList.toggle("border-erp-brand", state !== "false");
    g.classList.toggle("bg-erp-brand", state === "true");
    const check = $("[data-group-check]", g);
    const mixed = $("[data-group-mixed]", g);
    if (check) check.classList.toggle("hidden", state !== "true");
    if (mixed) mixed.classList.toggle("hidden", state !== "mixed");
  }
  function syncScopeDialog(dlg) {
    $$("[data-scope-group]", dlg).forEach((g) => {
      const items = $$(`[data-scope-pick][data-scope-type="${g.dataset.scopeGroup}"]`, dlg);
      const on = items.filter((i) => i.checked).length;
      paintScopeGroup(g, !on ? "false" : on === items.length ? "true" : "mixed");
    });
    const total = $$("[data-scope-pick]:checked", dlg).length;
    const summary = $("[data-scope-summary]", dlg);
    if (summary) {
      const all = $$("[data-scope-pick]", dlg).length;
      summary.textContent = total ? `선택 ${total}곳` : `선택 안 함 · 적용하면 전체 ${all}개점을 봅니다`;
    }
  }
  document.addEventListener("click", (e) => {
    const g = e.target.closest('[data-scope-group][role="checkbox"]');
    if (!g) return;
    const dlg = g.closest("[data-scope-popup]");
    const next = g.getAttribute("aria-checked") !== "true";
    $$(`[data-scope-pick][data-scope-type="${g.dataset.scopeGroup}"]`, dlg).forEach((i) => (i.checked = next));
    syncScopeDialog(dlg);
  });
  document.addEventListener("change", (e) => {
    if (!e.target.matches("[data-scope-pick]")) return;
    const dlg = e.target.closest("[data-scope-popup]");
    if (dlg) syncScopeDialog(dlg);
  });

  // ── 점포 일괄 검색 확인창(config-parts.mjs storeBulkDialog) — 관리 점포 고르기의 [일괄 검색] ──
  // 왼쪽(L) 매핑 안 된 점포 ↔ 오른쪽(R) 매핑된 점포. 줄(label[data-bulk-item])을 두 목록 사이로 옮긴다.
  // 열 때마다 지금 칩(선택한 점포)으로 두 목록을 다시 나누고 체크를 모두 푼다 — 취소하고 다시 열면 고치기 전으로 돌아간다.
  // 옮기기: 체크 + [추가 ›]·[‹ 빼기], 또는 끌어서 반대쪽 목록에 놓기(체크한 줄을 끌면 같은 쪽 체크한 줄이 모두 간다).
  // 옵션 체크(data-bulk-group: * 전체 · 유형)는 그 목록에서 묶음을 한꺼번에 체크한다. [적용]은 오른쪽 목록으로 칩을 다시 그린다.
  const SPICK_CHIP = (name, code, type) =>
    `<li data-code="${code}" title="${name} · ${code} · ${type}" class="flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px]"><span class="font-medium">${name}</span><button type="button" aria-label="${name} 빼기" class="grid size-[26px] place-items-center rounded-[2px] text-erp-label hover:text-erp-ink"><svg viewBox="0 0 8 8" class="size-[8px] stroke-current" aria-hidden="true"><path d="M1 1l6 6M7 1L1 7" stroke-width="1.5" stroke-linecap="round" fill="none"></path></svg></button></li>`;
  const bulkPane = (dlg, side) => $(`[data-bulk-pane="${side}"]`, dlg);
  const bulkItems = (dlg, side) => $$("[data-bulk-item]", $("[data-bulk-list]", bulkPane(dlg, side)));
  const bulkPicks = (dlg, side, key = "*") =>
    bulkItems(dlg, side)
      .map((it) => $("[data-bulk-pick]", it))
      .filter((i) => !i.disabled && (key === "*" || i.dataset.bulkType === key));
  // 줄을 목록에 넣을 때 처음 순서(data-order)를 지킨다
  function bulkPlace(dlg, item, side) {
    const list = $("[data-bulk-list]", bulkPane(dlg, side));
    const after = bulkItems(dlg, side).find((it) => +it.dataset.order > +item.dataset.order);
    list.insertBefore(item, after || $("[data-bulk-empty]", list));
  }
  function syncBulkDialog(dlg) {
    for (const side of ["L", "R"]) {
      const pane = bulkPane(dlg, side);
      const n = bulkItems(dlg, side).length;
      $("[data-bulk-count]", pane).textContent = `${n}곳`;
      $("[data-bulk-empty]", pane).hidden = n > 0;
      $$("[data-bulk-group]", pane).forEach((g) => {
        const items = bulkPicks(dlg, side, g.dataset.bulkGroup);
        const on = items.filter((i) => i.checked).length;
        paintScopeGroup(g, !on ? "false" : on === items.length ? "true" : "mixed");
        g.setAttribute("aria-disabled", String(!items.length));
        g.tabIndex = items.length ? 0 : -1;
        const cnt = $("[data-bulk-optcount]", g.parentElement);
        if (cnt) cnt.textContent = ` ${items.length}`;
      });
      const k = bulkPicks(dlg, side).filter((i) => i.checked).length;
      const btn = $(`[data-bulk-move="${side === "L" ? "R" : "L"}"]`, dlg);
      btn.disabled = !k;
      btn.textContent = side === "L" ? `추가${k ? ` ${k}` : ""} ›` : `‹ 빼기${k ? ` ${k}` : ""}`;
    }
    $("[data-bulk-apply]", dlg).textContent = `${bulkItems(dlg, "R").length}개점 적용`;
  }
  function bulkMove(dlg, items, to) {
    items.filter((it) => it.getAttribute("draggable") === "true").forEach((it) => {
      $("[data-bulk-pick]", it).checked = false;
      bulkPlace(dlg, it, to);
    });
    syncBulkDialog(dlg);
  }
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-spick-open]");
    if (open) {
      const dlg = document.getElementById(open.dataset.spickOpen);
      const codes = $$("[data-spick-list] > [data-code]", open.closest("[data-spick]")).map((li) => li.dataset.code);
      $$("[data-bulk-item]", dlg).forEach((it) => {
        $("[data-bulk-pick]", it).checked = false;
        bulkPlace(dlg, it, it.getAttribute("draggable") === "true" && codes.includes(it.dataset.code) ? "R" : "L");
      });
      dlg._was = codes;
      syncBulkDialog(dlg);
      dlg.showModal();
      return;
    }
    const opt = e.target.closest("[data-bulk-opt]");
    if (opt) {
      const g = $("[data-bulk-group]", opt);
      const dlg = g.closest("[data-bulk-popup]");
      const items = bulkPicks(dlg, g.dataset.bulkSide, g.dataset.bulkGroup);
      if (!items.length) return;
      const next = g.getAttribute("aria-checked") !== "true";
      items.forEach((i) => (i.checked = next));
      syncBulkDialog(dlg);
      return;
    }
    const mv = e.target.closest("[data-bulk-move]");
    if (mv) {
      const dlg = mv.closest("[data-bulk-popup]");
      const to = mv.dataset.bulkMove;
      bulkMove(dlg, bulkPicks(dlg, to === "R" ? "L" : "R").filter((i) => i.checked).map((i) => i.closest("[data-bulk-item]")), to);
      const next = $("[data-bulk-move]:not(:disabled)", dlg) || $("[data-bulk-apply]", dlg);
      next.focus();
      return;
    }
    const apply = e.target.closest("[data-bulk-apply]");
    if (apply) {
      const dlg = apply.closest("[data-bulk-popup]");
      const box = dlg.closest("[data-spick]");
      const right = bulkItems(dlg, "R").map((it) => $("[data-bulk-pick]", it));
      const was = dlg._was || [];
      const fresh = right.filter((i) => !was.includes(i.dataset.code));
      const kept = was.map((c) => right.find((i) => i.dataset.code === c)).filter(Boolean);
      $("[data-spick-list]", box).innerHTML = [...fresh, ...kept].map((i) => SPICK_CHIP(i.dataset.name, i.dataset.code, i.dataset.bulkType)).join("");
      spickCount(box);
      dlg.close();
    }
  });
  document.addEventListener("keydown", (e) => {
    const g = e.target.closest?.('[data-bulk-group][role="checkbox"]');
    if (g && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      g.click();
    }
  });
  document.addEventListener("change", (e) => {
    if (!e.target.matches("[data-bulk-pick]")) return;
    syncBulkDialog(e.target.closest("[data-bulk-popup]"));
  });
  // 끌어서 옮기기
  let bulkDrag = null;
  const bulkOverOff = (dlg) => $$("[data-bulk-pane]", dlg).forEach((p) => p.removeAttribute("data-over"));
  document.addEventListener("dragstart", (e) => {
    const it = e.target.closest?.('[data-bulk-item][draggable="true"]');
    if (!it) return;
    const dlg = it.closest("[data-bulk-popup]");
    const from = it.closest("[data-bulk-pane]").dataset.bulkPane;
    const mine = $("[data-bulk-pick]", it);
    const items = mine.checked ? bulkPicks(dlg, from).filter((i) => i.checked).map((i) => i.closest("[data-bulk-item]")) : [it];
    bulkDrag = { dlg, from, items };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", items.map((x) => x.dataset.code).join(" "));
    items.forEach((x) => x.classList.add("opacity-40"));
  });
  document.addEventListener("dragover", (e) => {
    const p = bulkDrag && e.target.closest?.("[data-bulk-pane]");
    if (!p || p.dataset.bulkPane === bulkDrag.from) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!p.hasAttribute("data-over")) {
      bulkOverOff(bulkDrag.dlg);
      p.setAttribute("data-over", "");
    }
  });
  document.addEventListener("dragleave", (e) => {
    const p = bulkDrag && e.target.closest?.("[data-bulk-pane]");
    if (p && !p.contains(e.relatedTarget)) p.removeAttribute("data-over");
  });
  document.addEventListener("drop", (e) => {
    const p = bulkDrag && e.target.closest?.("[data-bulk-pane]");
    if (!p || p.dataset.bulkPane === bulkDrag.from) return;
    e.preventDefault();
    bulkMove(bulkDrag.dlg, bulkDrag.items, p.dataset.bulkPane);
  });
  document.addEventListener("dragend", () => {
    if (!bulkDrag) return;
    bulkDrag.items.forEach((x) => x.classList.remove("opacity-40"));
    bulkOverOff(bulkDrag.dlg);
    bulkDrag = null;
  });

  // ── 점포 찾기 목록(config-parts.mjs storePicker 의 data-spick-dd) — 목업 spick 자동완성 ──
  // 칸에 포커스가 가면 아직 고르지 않은 점포(data-spick-pool 에서 칩에 없는 것)가 모두 펼쳐지고, 글자를 넣으면 점포명·점포코드로 좁힌다.
  // 고르면(누르기 · Enter) 칩 맨 앞에 붙고 목록은 열린 채 다시 그린다. ↑↓ 로 고를 줄을 옮기고, Esc · Tab · 바깥 누르기로 닫는다.
  const spickPool = (box) =>
    (box.dataset.spickPool || "")
      .split(";")
      .filter(Boolean)
      .map((t) => {
        const [name, code, type] = t.split("|");
        return { name, code, type };
      });
  const spickPicked = (box) => $$("[data-spick-list] > [data-code]", box).map((li) => li.dataset.code);
  const spickCount = (box) => {
    const n = spickPicked(box).length;
    $("[data-spick-count]", box).textContent = `${n}개점`;
    const none = $("[data-spick-none]", box);
    if (none) none.hidden = n > 0;
  };
  function spickMark(dd, i) {
    const opts = $$('[role="option"]', dd);
    opts.forEach((o, k) => o.setAttribute("aria-selected", String(k === i)));
    dd._at = i;
    if (opts[i]) opts[i].scrollIntoView({ block: "nearest" });
  }
  function spickOpen(box) {
    const input = $("[data-spick-find] input", box);
    const dd = $("[data-spick-dd]", box);
    const t = input.value.trim().toLowerCase();
    const picked = spickPicked(box);
    const found = spickPool(box).filter((s) => !picked.includes(s.code) && (!t || `${s.name} ${s.code}`.toLowerCase().includes(t)));
    dd._found = found;
    dd.innerHTML = found.length
      ? found
          .map(
            (s, i) =>
              `<button type="button" role="option" tabindex="-1" aria-selected="false" data-i="${i}" class="flex w-full items-center gap-[10px] rounded-[2px] px-[10px] py-[8px] text-left text-[14px] text-erp-ink hover:bg-erp-thead-bg aria-selected:bg-erp-thead-bg"><span class="min-w-0 flex-1 truncate">${s.name}</span><span class="shrink-0 text-[12px] text-erp-muted">${s.code}</span></button>`,
          )
          .join("")
      : `<p class="px-[10px] py-[14px] text-center text-[13px] text-erp-label">${picked.length >= spickPool(box).length ? "고를 수 있는 점포를 모두 골랐습니다." : "맞는 점포가 없습니다."}</p>`;
    dd.hidden = false;
    input.setAttribute("aria-expanded", "true");
    spickMark(dd, found.length ? 0 : -1);
  }
  function spickClose(box) {
    const dd = $("[data-spick-dd]", box);
    if (!dd || dd.hidden) return;
    dd.hidden = true;
    dd.innerHTML = "";
    $("[data-spick-find] input", box).setAttribute("aria-expanded", "false");
  }
  function spickAdd(box, i) {
    const s = ($("[data-spick-dd]", box)._found || [])[i];
    if (!s) return;
    $("[data-spick-list]", box).insertAdjacentHTML("afterbegin", SPICK_CHIP(s.name, s.code, s.type));
    spickCount(box);
    const input = $("[data-spick-find] input", box);
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    spickOpen(box);
  }
  $$("[data-spick-find] input").forEach((input) => {
    const box = input.closest("[data-spick]");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.autocomplete = "off";
    input.addEventListener("focus", () => spickOpen(box));
    input.addEventListener("click", () => $("[data-spick-dd]", box).hidden && spickOpen(box));
    input.addEventListener("input", () => spickOpen(box));
    input.addEventListener("keydown", (e) => {
      const dd = $("[data-spick-dd]", box);
      const n = (dd._found || []).length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (dd.hidden) spickOpen(box);
        else if (n) spickMark(dd, Math.min(dd._at + 1, n - 1));
      } else if (e.key === "ArrowUp" && !dd.hidden && n) {
        e.preventDefault();
        spickMark(dd, Math.max(dd._at - 1, 0));
      } else if (e.key === "Enter" && !dd.hidden) {
        e.preventDefault();
        if (dd._at > -1) spickAdd(box, dd._at);
      } else if (e.key === "Escape" && !dd.hidden) {
        e.preventDefault();
        e.stopPropagation();
        spickClose(box);
      } else if (e.key === "Tab") spickClose(box);
    });
    const dd = $("[data-spick-dd]", box);
    dd.addEventListener("mousedown", (e) => e.preventDefault()); // 칸의 포커스를 잃지 않게
    dd.addEventListener("click", (e) => {
      const o = e.target.closest('[role="option"]');
      if (o) spickAdd(box, +o.dataset.i);
    });
    dd.addEventListener("mousemove", (e) => {
      const o = e.target.closest('[role="option"]');
      if (o && +o.dataset.i !== dd._at) spickMark(dd, +o.dataset.i);
    });
  });
  document.addEventListener("pointerdown", (e) => {
    $$("[data-spick-find]").forEach((f) => !f.contains(e.target) && spickClose(f.closest("[data-spick]")));
  });
  // 범위 선택(data-spick-scope) — 전체 점포면 같은 묶음(section)의 점포 고르기 영역을 숨기고, 일부 점포일 때만 보인다
  const spickScope = (sel) => {
    const box = $("[data-spick]", sel.closest("section"));
    if (box) box.hidden = sel.value === "전체 점포";
  };
  $$("select[data-spick-scope]").forEach((sel) => {
    sel.addEventListener("change", () => spickScope(sel));
    spickScope(sel);
  });
  // 전체 제거 — 칩을 모두 뺀다
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-spick-clear]");
    if (!b) return;
    const box = b.closest("[data-spick]");
    $("[data-spick-list]", box).innerHTML = "";
    spickCount(box);
  });

  // [적용] — 고른 BP·점포 범위를 세션에 남기고 웨일ERP 로 이동한다. 이동한 페이지는 initAppliedScope 가 이 값을 읽어 GNB 에 그린다.
  const SCOPE_KEY = "whale-applied-scope";
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-scope-apply]");
    if (!btn) return;
    const dlg = btn.closest("[data-scope-popup]");
    const bpSelect = $("select", dlg);
    const bp = bpSelect ? bpSelect.value.split(" · ")[0] : "";
    const groupTotal = {};
    $$("[data-scope-group]", dlg).forEach((g) => (groupTotal[g.dataset.scopeGroup] = $$(`[data-scope-pick][data-scope-type="${g.dataset.scopeGroup}"]`, dlg).length));
    const checked = $$("[data-scope-pick]:checked", dlg);
    const all = $$("[data-scope-pick]", dlg).length;
    let value;
    if (!checked.length) value = `전체 ${all}개점`;
    else if (checked.length === 1) value = checked[0].dataset.scopeName;
    else {
      const byType = {};
      checked.forEach((c) => (byType[c.dataset.scopeType] = (byType[c.dataset.scopeType] || 0) + 1));
      const types = Object.keys(byType);
      value = types.length === 1 && byType[types[0]] === groupTotal[types[0]] ? `${types[0].replace("점포", "")} ${byType[types[0]]}개점` : `선택 ${checked.length}곳`;
    }
    try {
      sessionStorage.setItem(SCOPE_KEY, JSON.stringify({ bp, value }));
    } catch (err) {}
    location.href = btn.dataset.scopeApply;
  });

  // 위 세션값을 읽어 ERP 화면 GNB 의 점포 범위 드롭다운(scopeDropdown)에 그대로 반영한다.
  function initAppliedScope() {
    let data;
    try {
      data = JSON.parse(sessionStorage.getItem(SCOPE_KEY) || "null");
    } catch (err) {
      return;
    }
    if (!data) return;
    const trigger = $('header button[aria-controls^="scope-"]');
    if (!trigger) return;
    const bp = trigger.querySelector("b");
    const value = $("[data-scope-value]", trigger);
    if (bp && data.bp) bp.textContent = data.bp;
    if (value) value.textContent = data.value;
    trigger.setAttribute("aria-label", `점포: ${data.value}`);
    document.dispatchEvent(new CustomEvent("erp:scope", { detail: data.value }));
  }

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
    // 지우기 단추가 없는 검색칸(플랫폼 헤더 「BP 및 점포 선택」 창의 점포 찾기)은 건너뛴다.
    // 없으면 여기서 멈춰 그 뒤 초기화(페이지 번호·달력·주 이동)가 모든 플랫폼 화면에서 빠졌다.
    if (!clear) return;
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
  // 범위 값이 실제 점포 이름일 때만 점포 하나다. 「전체 11개점」「직영 3개점」「선택 2곳」은 묶음이다.
  // ponytail: 「선택 N곳」은 고른 점포로 거르지 않고 전체를 보인다(데모).
  const isOneStore = (scope) => !/전체|개점$|^선택 \d+곳$/.test(scope);

  function initScopeStore(input) {
    const set = (scope) => {
      const one = isOneStore(scope);
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

  // ── 로그인 후 홈: 범위 선택기가 「전체」면 전체 화면, 점포 하나면 점포 하나 화면(HOME-6 B) ──
  function initScopeView(views) {
    const set = (scope) => {
      const one = isOneStore(scope);
      views.forEach((v) => (v.hidden = (v.dataset.scopeView === "one") !== one));
      if (!one) return;
      $$("[data-scope-name]").forEach((el) => (el.textContent = scope));
      const box = $("[data-stores]");
      const row = box && JSON.parse(box.dataset.stores)[scope];
      if (row) $$("[data-store-field]", box).forEach((el) => (el.textContent = row[el.dataset.storeField]));
    };
    document.addEventListener("erp:scope", (e) => set(e.detail));
    const now = $('header button[aria-label^="점포: "]');
    if (now) set(now.getAttribute("aria-label").slice(4));
  }

  // ── 점포 하나 화면 근무스케줄: 요일 칩(data-wd-pick)은 그 요일 근무자만 남기고, 월간 달력(data-dayplan)은 날짜를 누르면 그날 근무스케줄을 보인다 ──
  function initDayPlan(root) {
    // crew 한 줄: [이름, 보조 글자, { 요일: "09:00~18:00" }, 배정 불가 사유]. all 이면 그날 재직자 전원(휴무·배정 불가 포함).
    const { crew, holiday, today, month, all } = JSON.parse(root.dataset.dayplan);
    const WD = "일월화수목금토";
    const pane = root.firstElementChild;
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let cur = today;
    const show = (key) => {
      const d = new Date(`${key}T00:00:00`);
      if (d.getMonth() !== month) return; // 데모 달력은 한 달뿐
      cur = key;
      const off = Boolean(holiday[key]);
      const work = (c) => !c[3] && c[2][d.getDay()];
      const list = off ? [] : all ? crew : crew.filter(work);
      $("[data-daytitle]", pane).textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`;
      $("[data-daysum]", pane).innerHTML = off ? `${holiday[key]} 연휴 · 점포 휴무` : `근무 <b class="text-erp-ink">${list.filter(work).length}명</b> · ${key === today ? "오늘" : key < today ? "지난 날" : "예정"}`;
      $("[data-daylist]", pane).innerHTML = list.length
        ? list.map((c) => `<li class="flex items-center gap-[8px] border-b border-erp-thead-line py-[8px]"><span class="flex-1">${c[0]} <span class="text-erp-muted">${c[1]}</span></span>${c[3] ? `<span class="text-right text-[13px] text-erp-off">배정 불가</span>` : work(c) ? `<span class="text-right text-[13px] text-erp-muted">${c[2][d.getDay()]}</span>` : `<span class="text-right text-[13px] text-erp-muted">휴무</span>`}</li>`).join("")
        : '<li class="py-[8px] text-[13px] text-erp-muted">근무 없음</li>';
      $$("[data-day]", root).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.day === key)));
    };
    root.addEventListener("click", (e) => {
      const day = e.target.closest("[data-day]");
      if (day) return show(day.dataset.day);
      const move = e.target.closest("[data-daymove]");
      if (!move) return;
      const d = new Date(`${cur}T00:00:00`);
      d.setDate(d.getDate() + Number(move.dataset.daymove));
      show(iso(d));
    });
    show(today);
  }
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-wd-pick]");
    if (!chip) return;
    const wd = chip.dataset.wdPick;
    $$("[data-wd-pick]").forEach((b) => b.setAttribute("aria-pressed", String(b === chip)));
    $$("[data-wd-day]").forEach((g) => (g.hidden = g.dataset.wdDay !== wd));
    const n = $("[data-wd-count]");
    if (n) n.textContent = chip.dataset.count;
  });

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

  // ── 목록에서 골라 지우기: 머리 체크(data-pick-all)로 모두 고르고, 확인창의 버튼(data-remove-picked="표 id")이 고른 줄을 지운다 ──
  document.addEventListener("change", (e) => {
    if (!e.target.matches("[data-pick-all]")) return;
    $$("[data-pick-row]", e.target.closest("table")).forEach((c) => (c.checked = e.target.checked));
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove-picked]");
    const table = b && document.getElementById(b.dataset.removePicked);
    if (!table) return;
    $$("[data-pick-row]:checked", table).forEach((c) => c.closest("tr").remove());
    const all = $("[data-pick-all]", table);
    if (all) all.checked = false;
    const body = table.tBodies[0];
    if (!body.rows.length)
      body.innerHTML = `<tr class="h-[92px] border-b border-erp-thead-line"><td colspan="${table.tHead.rows[0].cells.length}" class="text-center text-erp-muted">${table.dataset.empty}</td></tr>`;
    const total = table.closest("main")?.querySelector("p b");
    if (total) total.textContent = $$("[data-pick-row]", table).length;
  });

  // ── 모두 읽음(data-read-all="표 id"): 미확인 점을 지우고 제목을 읽은 글자로 ──
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-read-all]");
    const table = b && document.getElementById(b.dataset.readAll);
    if (!table) return;
    $$("[data-unread]", table).forEach((d) => {
      const tr = d.closest("tr");
      d.parentElement.textContent = "";
      $$("a.font-semibold", tr).forEach((a) => {
        a.classList.remove("font-semibold");
        a.classList.replace("text-erp-ink", "text-erp-muted");
      });
    });
  });

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
    // data-step="month" 이면 한 달씩 넘기고 열두 달 판에서 달을 고른다(급여명세서). 묶음 키는 그 달 1일.
    const day = nav.dataset.step === "day";
    const month = nav.dataset.step === "month";
    const move = (d, n) => (month ? shiftMonth(d, n) : addDays(d, n * (day ? 1 : 7)));
    const first = parse(nav.dataset.weekStart);
    let mon = first;
    let cursor = mon;
    const show = () => {
      const key = iso(mon);
      const hit = blocks.find((b) => b.dataset.week === key) || blocks.find((b) => b.dataset.week === "");
      blocks.forEach((b) => (b.hidden = b !== hit));
      trigger.textContent = month
        ? `${mon.getFullYear()}년 ${mon.getMonth() + 1}월`
        : day
          ? `${iso(mon)} (${WEEK[mon.getDay()]})`
          : `${mon.getFullYear()}년 ${md(mon)} ~ ${md(addDays(mon, 6))}`;
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
    const renderMonth = () => {
      const y = cursor.getFullYear();
      const cell = (i) => {
        const sel = y === mon.getFullYear() && i === mon.getMonth();
        return `<button type="button" data-pick="${iso(new Date(y, i, 1))}" aria-pressed="${sel}" class="grid h-[36px] place-items-center rounded-[2px] text-[14px] transition-colors duration-150 ease-out ${sel ? "bg-erp-brand text-white" : "text-erp-ink hover:bg-erp-thead-bg"}">${i + 1}월</button>`;
      };
      pop.innerHTML = `
        <div class="flex items-center justify-between">
          <button type="button" aria-label="이전 해" data-move="-12" class="${NAV}">${ICON("chevron-small.svg")}</button>
          <p aria-live="polite" class="text-[15px] font-semibold text-erp-ink">${y}년</p>
          <button type="button" aria-label="다음 해" data-move="12" class="${NAV}">${ICON("chevron-small.svg", "rotate-180")}</button>
        </div>
        <div class="mt-[12px] grid grid-cols-4 gap-[4px]">${Array.from({ length: 12 }, (_, i) => cell(i)).join("")}</div>
        ${foot("이번 달")}`;
      $('[aria-pressed="true"]', pop)?.focus();
    };
    const render = () => {
      if (month) return renderMonth();
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
    prev.addEventListener("click", () => go(move(mon, -1)));
    next.addEventListener("click", () => go(move(mon, 1)));
    pop.addEventListener("toggle", (e) => {
      const opened = e.newState === "open";
      trigger.setAttribute("aria-expanded", String(opened));
      if (opened) {
        cursor = day || month ? mon : addDays(mon, 3);
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
    // data-need-pick="표 id": 고른 줄이 없으면 확인창 대신 data-none-dialog 안내창을 띄운다(선택 삭제)
    const none = open?.dataset.needPick && !$$("[data-pick-row]:checked", document.getElementById(open.dataset.needPick)).length;
    if (open) document.getElementById(none ? open.dataset.noneDialog : open.dataset.dialog)?.showModal();
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

  // 알림 템플릿 수정·등록(NOTIFY-10). 변수 목록 줄에서 본문 위 변수 단추를 그리고, 단추를 누르면 본문 커서 자리에 #{변수} 를 넣는다.
  // 저장 전에 제목·본문을 검사해 목록에 없는 #{변수}와 빠진 필수 변수를 줄 번호와 함께 보이고, 통과하면 저장 확인창을 연다.
  // 채널·유형을 고르면 등록 화면은 템플릿 코드 기본값(채널 접두 + 코드)을 채우고, 수정 화면은 코드를 바꿀 때 확인창을 띄운다.
  function initTemplateEdit(root) {
    const rows = () => $$("[data-var-row]", root);
    const vars = () =>
      rows()
        .map((r) => ({ name: $("[data-var-name]", r).value.trim(), required: $("[data-var-required]", r).checked }))
        .filter((v) => v.name);
    const btnBox = $("[data-var-buttons]", root);
    const body = btnBox && document.getElementById(btnBox.dataset.target);
    const btnClass = $("[data-var-add]", root)?.className ?? "";
    const drawButtons = () => {
      btnBox.replaceChildren(
        ...vars().map((v) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = btnClass;
          b.textContent = v.name;
          b.dataset.insertVar = `#{${v.name}}`;
          return b;
        }),
      );
    };
    root.addEventListener("click", (e) => {
      const ins = e.target.closest("[data-insert-var]");
      if (ins && body) {
        const at = body.selectionStart;
        const v = ins.dataset.insertVar;
        body.value = body.value.slice(0, at) + v + body.value.slice(body.selectionEnd);
        body.focus();
        body.selectionStart = body.selectionEnd = at + v.length;
        body.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (e.target.closest("[data-var-add]")) {
        $("[data-var-body]", root).append($("[data-var-template]", root).content.cloneNode(true));
        drawButtons();
      }
      const del = e.target.closest("[data-var-del]");
      if (del) {
        del.closest("[data-var-row]").remove();
        drawButtons();
      }
      const save = e.target.closest("[data-tpl-save]");
      if (save) {
        const errs = [];
        const known = new Set(vars().map((v) => v.name));
        const fields = $$("[data-tpl-check]", root).filter((f) => !f.closest("[hidden]"));
        fields.forEach((f) => {
          const where = f.matches("[data-tpl-body]") ? "본문" : "제목";
          f.value.split("\n").forEach((line, i) => {
            for (const m of line.matchAll(/#\{([^}]*)\}/g))
              if (!known.has(m[1])) errs.push(`${where} ${i + 1}번째 줄: #{${m[1]}} 는 변수 목록에 없습니다.`);
          });
        });
        // 글자 수 제한(앱 푸시 제목 40·본문 100, NOTIFY-4): 넘으면 저장하지 않는다.
        $$("[data-count]", root).forEach((c) => {
          const f = document.getElementById(c.dataset.count);
          if (!f.closest("[hidden]") && f.value.length > +c.dataset.max)
            errs.push(`${f.matches("[data-tpl-body]") ? "본문" : "제목"}은 ${c.dataset.max}자를 넘을 수 없습니다(지금 ${f.value.length}자).`);
        });
        // 템플릿 코드가 다른 템플릿과 겹치면 저장하지 않는다(NOTIFY-11).
        const tplCode = $("[data-tpl-code]", root).value.trim();
        if (JSON.parse(root.dataset.codes || "[]").includes(tplCode)) errs.push(`템플릿 코드 ${tplCode} 는 이미 있는 템플릿이 쓰고 있습니다.`);
        const text = fields.map((f) => f.value).join("\n");
        vars()
          .filter((v) => v.required && !text.includes(`#{${v.name}}`))
          .forEach((v) => errs.push(`필수 변수 #{${v.name}} 가 제목·본문에 없습니다.`));
        const box = $("[data-tpl-errors]", root);
        box.replaceChildren(...errs.map((t) => Object.assign(document.createElement("p"), { textContent: t })));
        box.hidden = !errs.length;
        if (!errs.length) document.getElementById(save.dataset.tplSave)?.showModal();
      }
      if (e.target.closest("[data-code-revert]")) {
        const code = $("[data-code-original]", root);
        code.value = code.dataset.codeOriginal;
      }
    });
    root.addEventListener("input", (e) => e.target.matches("[data-var-name]") && drawButtons());

    // 채널: 알림톡이면 제목 칸을 숨기고 카카오 템플릿 코드·검수 안내를, 앱 푸시면 수신 설정 묶음을 보인다.
    // 등록 화면은 채널을 고르면 템플릿 코드의 접두만 바꾸고 운영자가 넣은 나머지는 둔다(NOTIFY-11).
    const channel = $("[data-tpl-channel]", root);
    const code = $("[data-tpl-code]", root);
    const prefixes = JSON.parse(root.dataset.prefixes);
    const sync = () => {
      const talk = channel.value === "알림톡";
      $$("[data-tpl-talk]", root).forEach((el) => (el.hidden = !talk));
      $$("[data-tpl-title]", root).forEach((el) => (el.hidden = talk));
      $$("[data-tpl-push]", root).forEach((el) => (el.hidden = channel.value !== "앱 푸시"));
    };
    const fillCode = () => {
      if (root.hasAttribute("data-tpl-new") && prefixes[channel.value]) code.value = `${prefixes[channel.value]}_${code.value.replace(/^(NTF|PUSH|EMAIL|TALK)_?/, "")}`;
    };
    channel.addEventListener("change", () => (sync(), fillCode()));
    code.addEventListener("change", () => {
      if (code.dataset.codeOriginal && code.value !== code.dataset.codeOriginal) document.getElementById(code.dataset.codeDialog)?.showModal();
    });
    drawButtons();
    sync();

    $$("[data-count]", root).forEach((c) => {
      const f = document.getElementById(c.dataset.count);
      const max = +c.dataset.max;
      const show = () => {
        c.textContent = `${f.value.length} / ${max}`;
        c.classList.toggle("text-erp-off", f.value.length > max);
      };
      f.addEventListener("input", show);
      show();
    });
  }

  // 점포 등록·수정의 층별 정보 표. [층 추가] 는 빈 줄 template 을 복제해 표 끝에 붙이고,
  // 줄의 [삭제] 는 그 줄을 지운다. 마지막 줄을 지우면 공통 표의 빈 상태 줄을 되돌려 놓는다.
  // 마크업은 biz-form.mjs 의 floorTable 이 낸다 — 단서가 바뀌면 거기도 같이 고친다.
  function initFloors(root) {
    const body = $("tbody", root);
    const clone = (name) => $(`[data-floor-${name}]`, root).content.cloneNode(true);
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-floor-add]")) {
        $("td[colspan]", body)?.closest("tr").remove(); // 빈 상태 줄이 있으면 치운다
        body.append(clone("row"));
      }
      const del = e.target.closest("[data-floor-del]");
      if (del) {
        del.closest("tr").remove();
        if (!body.rows.length) body.append(clone("empty"));
      }
    });
  }

  const init = () => {
    fromHash();
    $$("[data-tpl-root]").forEach(initTemplateEdit);
    initFilters();
    $$("header").forEach(initHeader);
    $$('button[aria-expanded][aria-label$="접기"], button[aria-expanded][aria-label$="펼치기"]').forEach(initFilter);
    $$('input[type="search"]').forEach(initSearch);
    $$("input[data-scope-store]").forEach(initScopeStore);
    initAppliedScope();
    const views = $$("[data-scope-view]");
    if (views.length) initScopeView(views);
    $$("[data-dayplan]").forEach(initDayPlan);
    initWhen($$("[data-when]"));
    $$("[data-workplan]").forEach(initWorkPlan);
    $$('nav[aria-label="페이지"]').forEach(initPagination);
    $$("button[popovertarget]:not([data-week-label])").forEach(initDate);
    $$("[data-weeks]").forEach(initWeeks);
    $$("[data-floors]").forEach(initFloors);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
