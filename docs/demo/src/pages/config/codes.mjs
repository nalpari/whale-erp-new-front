// BP 공통코드 관리. 앱 src/app/bp-code-groups(bp-code-group-panel · bp-code-item-panel) + components/site/code-editor 대로 그린다(2026-10-30 재영 「front대로」).
// 왼쪽 필터, 그 오른쪽에 그룹 목록 카드와 상세 코드 카드를 나란히 둔다(system 공통코드와 같은 배치). 보는 사람은 BP 마스터 · EMP_TYPE 고용 형태 선택.
// 상세 코드는 [추가]로 맨 끝에 새 행, 손잡이로 끌거나 ↑ · ↓ 로 순서, 휴지통으로 「삭제 예정」을 표시해 두었다가 [저장] 한 번에 반영한다(CODE_SCRIPT).
// render 의 platform 은 플랫폼 계정으로 본 견본(조회만 — codes-platform.mjs)이다.
// 생략: 상세 코드 불러오기 실패 · 저장 실패 띠 · 서버 409(지운 코드와 겹침) · 그룹 0건(「볼 수 있는 공통코드 그룹이 없습니다.」) — 데모 데이터로 생기지 않는다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader } from "../../site.mjs";
import { band, floatingHelpTip } from "../../role-side.mjs";

// [그룹 코드, 그룹명, 관리 주체] — 플랫폼제공 그룹만 보인다. 플랫폼고정은 BP 가 고칠 것이 없어 뺐다(앱 bp-codes.ts, 2026-10-27 사용자 지정)
const GROUPS = [
  ["EMP_TYPE", "고용 형태", "플랫폼제공"],
  ["LEAVE_TYPE", "휴가 유형", "플랫폼제공"],
  ["POSITION", "직급", "플랫폼제공"],
  ["BANK", "은행", "플랫폼제공"],
];
const SELECTED = 0;
// 관리주체 열 이름 옆 도움말(앱 bp-code-item-panel OWNER_HELP, 2026-10-27 사용자 지정)
const OWNER_HELP =
  '<span class="block whitespace-nowrap">· <b class="font-semibold">플랫폼제공</b> 웨일ERP 기본 코드입니다.</span><span class="block whitespace-nowrap pl-[10px]">(수정·삭제 가능)</span><span class="block whitespace-nowrap">· <b class="font-semibold">BP전용</b> 우리 회사만 사용하는 코드입니다.</span>';
// [상세 코드, 코드명, 관리주체, 사용]
const CODES = [
  ["FULL", "정직원", "플랫폼제공", true],
  ["CONTRACT", "계약직", "플랫폼제공", true],
  ["PART", "아르바이트", "플랫폼제공", true],
  ["INTERN", "수습", "BP전용", true],
];
const CODE_PLACEHOLDER = "영문 대문자로 시작, 영문·숫자·언더바(_) (최대20자)"; // 앱 code-validation.ts

// 두 카드의 머리 줄 높이를 버튼 높이(34px)로 맞춰, 왼쪽 그룹 표와 오른쪽 상세 코드 표가 같은 높이에서 시작하게 한다.
const head = (title, right) => ui.sectionHead(title, right).replace('class="flex items-end gap-[6px]"', 'class="flex h-[34px] items-end gap-[6px]"');
// 줄 상태는 tr 의 data 로 칠한다 — data-deleted(삭제 예정: 취소선 · 「삭제 예정」), data-invalid(칸 오류: 오류 줄 자리를 둔다, 앱 CellError reserve)
const DEL = "group-data-[deleted]:hidden";
const STRUCK = "hidden text-erp-label group-data-[deleted]:inline";
// 칸 오류 문구 자리(앱 code-panel.tsx CellError) — 그 줄에 오류가 있으면 오류 없는 칸도 한 줄만큼 비워 입력칸 높이를 맞춘다
const cellError = (control) =>
  `<span class="flex flex-col gap-[4px] group-data-[invalid]:py-[6px]">${control}<span data-cell-error class="hidden truncate text-left text-[12px] leading-[1.4] text-erp-off group-data-[invalid]:block">&nbsp;</span></span>`;
// 끌어서 순서 바꾸는 손잡이(앱 use-row-reorder.tsx). ↑ · ↓ 키로도 옮긴다
const handle = (code) =>
  `<button type="button" data-code-handle title="끌어서 순서 바꾸기" aria-label="${code} 순서 옮기기, 위 · 아래 화살표" class="cursor-grab px-[6px] text-[16px] text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink active:cursor-grabbing ${DEL}">≡</button>`;
// 행 끝 [삭제](휴지통) · [되돌리기](되돌림 화살표) — 앱 delete-mark.tsx DeleteToggle. 아이콘은 줄 상태로 바꿔 보인다
const deleteToggle = (code) =>
  `<button type="button" data-code-del aria-pressed="false" aria-label="${code} 삭제" title="삭제" class="inline-grid size-[28px] place-items-center rounded-[2px] border border-erp-button-line bg-white text-erp-label transition-colors duration-150 ease-out hover:border-erp-off hover:text-erp-off group-data-[deleted]:hover:border-erp-brand group-data-[deleted]:hover:text-erp-brand">` +
  `<svg viewBox="0 0 16 16" class="size-[14px] ${DEL}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4h11"/><path d="M6 4V2.5h4V4"/><path d="M3.8 4l.7 9.5h7l.7-9.5"/><path d="M6.6 6.5v4.5M9.4 6.5v4.5"/></svg>` +
  `<svg viewBox="0 0 16 16" class="hidden size-[14px] group-data-[deleted]:block" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 3.5 2.5 6.5l3 3"/><path d="M2.5 6.5h7a4 4 0 0 1 0 8H7"/></svg></button>`;
const nameInput = (label, a = {}) => ui.textField({ maxlength: 50, "aria-label": label, "data-code-label": true, ...a });

export const render = ({ A, R }, { title = "BP 공통코드 관리", platform = false } = {}) => {
  const filter = ui.filterPanel(A, [
    ui.filterSection("그룹 코드", ui.searchField(A, { placeholder: "예: EMP_TYPE", label: "그룹 코드" }), { tight: true }),
    // 관리주체 칸은 플랫폼 공통코드 관리에만 둔다(앱 code-group-filter.tsx showOwner, 2026-10-27)
    ui.filterSection("그룹명", ui.searchField(A, { placeholder: "예: 고용 형태", label: "그룹명" }), { tight: true, last: true }),
  ]);

  const groupCols = [
    { header: "그룹 코드", width: "w-[170px]", align: "left" },
    { header: "그룹명", align: "left" },
    { header: "관리주체", width: "w-[110px]" },
  ];
  const groupRows = GROUPS.map(([code, name, owner], i) => [
    i === SELECTED ? `<b class="font-semibold" aria-current="true">${code}</b>` : `<a href="#" data-code-group class="text-erp-link hover:underline">${code}</a>`,
    name,
    c.ownerTag(owner),
  ]);
  let g = -1;
  const groupTable = c
    .markCurrent(ui.dataTable(groupCols, groupRows, "볼 수 있는 공통코드 그룹이 없습니다."), SELECTED)
    .replace(/<tr class="h-\[46px\] border-b border-erp-thead-line/g, (m) => `<tr data-group-row="${GROUPS[++g][0]}|${GROUPS[g][1]}" class="h-[46px] border-b border-erp-thead-line`);
  const left = c.card(
    "w-[560px] shrink-0",
    head(`공통코드 그룹${c.sub(`<span data-group-count>${GROUPS.length}</span>개`)}`) +
      // 열 이름 줄까지 고정, 아래만 스크롤(2026-10-26). 쪽 넘김 없이 전부 보인다(앱과 같다, 2026-10-27 사용자 지정)
      ui.scrollTable(groupTable),
  );

  const manage = !platform;
  const codeCols = [
    ...(manage ? [{ header: "이동", width: "w-[60px]" }] : []),
    { header: "상세 코드", align: "left" }, // 남는 폭(앱과 같다, 2026-10-27)
    { header: "코드명", width: "w-[160px]", align: "left" },
    { header: "표시 순서", width: "w-[90px]" },
    { header: "사용여부", width: "w-[110px]" },
    { header: `<span class="inline-flex items-center gap-[4px]">관리주체${floatingHelpTip(OWNER_HELP, "관리주체")}</span>`, width: "w-[110px]" },
    // 플랫폼제공 · BP전용 코드 모두 지울 수 있다(앱 bpDeletable, 2026-10-22)
    ...(manage ? [{ header: "삭제", width: "w-[70px]" }] : []),
  ];
  const savedCells = (code, name, owner, on, i) => [
    handle(code),
    `<span class="${DEL}" title="등록한 코드 값은 바꿀 수 없습니다.">${code}</span><s class="${STRUCK}">${code}</s>`,
    `<span class="${DEL}">${cellError(nameInput(`${code} 코드명`, { value: name }))}</span><s class="${STRUCK}" data-struck-label>${name}</s>`,
    `<span data-code-order>${i + 1}</span>`,
    `<div class="${DEL}">${x.toggle("사용", on)}</div><span class="${STRUCK} text-[14px]">삭제 예정</span>`,
    c.ownerTag(owner),
    deleteToggle(code),
  ];
  const codeRows = CODES.map(([code, name, owner, on], i) =>
    manage
      ? savedCells(code, name, owner, on, i)
      : // 플랫폼 계정은 조회만 — 코드명은 글자, 사용여부는 배지(앱 bp-code-item-panel.tsx)
        [code, name, i + 1, on ? ui.badge("on", "사용") : ui.badge("off", "미사용"), c.ownerTag(owner)],
  );
  let r = -1;
  const codeTable = ui
    .dataTable(codeCols, codeRows, "이 그룹에 상세 코드가 없습니다.")
    .replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, () => `<tr data-code-row="${CODES[++r][0]}" class="group h-[46px] border-b border-erp-thead-line">`);
  // [추가]가 붙이는 새 행 — 바탕을 깔고(앱 DataTable added) 이동 칸에 빼기 [×], 새 행은 BP전용으로 저장된다(api)
  const newRow =
    `<template id="code-new-row"><tr data-code-row data-code-new class="group h-[46px] border-b border-erp-thead-line bg-erp-thead-bg">` +
    [
      '<button type="button" data-code-remove aria-label="새 행 빼기" title="이 새 행 빼기" class="px-[6px] text-[16px] text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink">×</button>',
      cellError(ui.textField({ placeholder: CODE_PLACEHOLDER, maxlength: 20, "aria-label": "새 행 상세 코드", "data-code-new-code": true })),
      cellError(nameInput("새 행 코드명", { placeholder: "코드명" })),
      '<span data-code-order></span>',
      x.toggle("사용", true),
      c.ownerTag("BP전용"),
      "",
    ]
      .map((cell, i) => `<td class="truncate px-[10px] ${i === 1 || i === 2 ? "text-left" : "text-center"}">${cell}</td>`)
      .join("") +
    `</tr></template>`;

  // 저장한 새 행이 바뀌어 들어갈 보통 줄(BP전용) — __CODE__ 를 저장한 코드로 바꿔 쓴다
  const savedRow = manage && `<template id="code-saved-row">${ui.tableRow(codeCols, savedCells("__CODE__", "", "BP전용", true, 0)).replace("<tr ", '<tr data-code-row="__CODE__" ').replace('class="h-[46px]', 'class="group h-[46px]')}</template>`;
  const groupHead = c.headValues([["그룹코드", "EMP_TYPE"], ["그룹명", "고용 형태"], ["", c.ownerTag("플랫폼제공")]]); // 앱 code-panel GroupHead 와 같다(2026-10-27)
  const right = c.card(
    "min-w-0 flex-1",
    head(`상세 코드${c.sub(groupHead)}`, manage ? ui.button("추가", { variant: "soft", "data-code-add": true }) + ui.button("저장", { "data-code-save": true, "data-toast": "" }) : "") +
      // 플랫폼 계정은 조회만 — BP 권한 그룹과 같은 회색 안내 한 줄(2026-10-30 재영)
      (platform ? band("플랫폼 계정은 BP 공통코드를 조회만 합니다.") : "") +
      // 순서를 옮기면 표 위 빨간 상자(앱 code-panel.tsx PendingNotice · REORDERED)
      (manage ? `<div data-code-reordered hidden>${c.warnBand("표시 순서가 변경되었습니다. 저장 시 반영됩니다.").replace("<div ", '<div role="status" ')}</div>` : "") +
      ui.scrollTable(codeTable) +
      (manage ? newRow + savedRow : ""),
  );

  // 저장하지 않은 변경이 있는데 다른 그룹으로 가거나 검색하면 묻는다(앱 unsaved-changes.tsx, 문구 2026-10-27 사용자 지정)
  const unsaved = manage
    ? x.dialog(
        "code-unsaved",
        "저장하지 않은 변경사항",
        "<p>현재 수정한 내용이 저장되지 않았습니다.</p><p>저장하지 않고 이동하면 수정한 내용이 모두 사라집니다. 이동하시겠습니까?</p>",
        ui.button("취소", { variant: "off", "data-close": true }) + ui.button("저장하지 않고 이동", { "data-code-discard": true }),
      )
    : "";

  return {
    title,
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 공통코드 관리",
      body: `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${filter}${left}${right}</div>${unsaved}${CODE_SCRIPT}`,
    }),
  };
};

export default (ctx) => render(ctx);

// 이 화면 전용 동작. 검색은 그룹 코드 · 그룹명을 함께 걸고, 맞는 그룹이 없으면 검색어를 넣은 빈 문구(앱 code-group-filter.tsx searchedEmpty).
// 앱은 검색하면 고른 그룹이 풀리지만, 데모는 다른 그룹 상세가 없어 상세 코드를 그대로 둔다. 같은 이유로 [저장하지 않고 이동]은 상세 코드를 처음 상태로 되돌리기만 한다.
const CODE_SCRIPT = `<script>
(() => {
  const body = document.querySelector("[data-code-row]")?.closest("tbody");
  const PATTERN = /^[A-Z][A-Z0-9_]{0,19}$/;
  const initial = body?.innerHTML;
  let base = [];
  const rows = () => [...body.querySelectorAll("tr[data-code-row]")];
  const saved = () => rows().filter((r) => !r.hasAttribute("data-code-new"));
  const order = () => saved().map((r) => r.dataset.codeRow).join();
  const reset = () => (base = order());
  const renumber = () => {
    rows().forEach((r, i) => (r.querySelector("[data-code-order]").textContent = i + 1));
    const notice = document.querySelector("[data-code-reordered]");
    if (notice) notice.hidden = order() === base;
  };
  const dirty = () =>
    !!body &&
    (order() !== base ||
      rows().some((r) => r.hasAttribute("data-code-new") || r.hasAttribute("data-deleted")) ||
      [...body.querySelectorAll("input")].some((i) => (i.type === "checkbox" ? i.checked !== i.defaultChecked : i.value !== i.defaultValue)));
  if (body) reset();

  // 순서 — 손잡이를 잡은 줄만 끌 수 있다. 저장한 줄 사이에서만 옮기고 새 행은 늘 맨 끝이다
  let dragging = null;
  const move = (row, to) => {
    const list = saved();
    if (to < 0 || to >= list.length || list[to] === row) return;
    list[to].insertAdjacentElement(list.indexOf(row) < to ? "afterend" : "beforebegin", row);
    renumber();
  };
  document.addEventListener("pointerdown", (e) => {
    const h = e.target.closest("[data-code-handle]");
    if (h) h.closest("tr").draggable = true;
  });
  body?.addEventListener("dragstart", (e) => {
    dragging = e.target.closest("tr");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragging.dataset.codeRow);
    dragging.classList.add("bg-erp-thead-bg");
  });
  body?.addEventListener("dragover", (e) => {
    const over = e.target.closest("tr[data-code-row]:not([data-code-new])");
    if (!dragging || !over) return;
    e.preventDefault();
    if (over !== dragging) move(dragging, saved().indexOf(over));
  });
  body?.addEventListener("drop", (e) => e.preventDefault());
  body?.addEventListener("dragend", () => {
    dragging?.classList.remove("bg-erp-thead-bg");
    if (dragging) dragging.draggable = false;
    dragging = null;
  });
  document.addEventListener("keydown", (e) => {
    const h = e.target.closest?.("[data-code-handle]");
    if (!h || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const row = h.closest("tr");
    move(row, saved().indexOf(row) + (e.key === "ArrowUp" ? -1 : 1));
    h.focus();
  });

  // 칸 오류 — 고치면 그 줄 오류를 지운다(다시 [저장]할 때 다시 본다)
  const setError = (input, message) => {
    const slot = input.parentElement.querySelector("[data-cell-error]");
    slot.textContent = message || "\\u00a0";
    slot.title = message || "";
    input.toggleAttribute("aria-invalid", !!message);
  };
  const clearRow = (row) => {
    row.removeAttribute("data-invalid");
    row.querySelectorAll("input[aria-invalid]").forEach((i) => setError(i, ""));
  };
  const validate = () => {
    let first = null;
    const fail = (input, message) => {
      setError(input, message);
      input.closest("tr").setAttribute("data-invalid", "");
      first ??= input;
    };
    rows().forEach(clearRow);
    rows().forEach((r) => {
      if (r.hasAttribute("data-deleted")) return;
      const label = r.querySelector("[data-code-label]");
      if (!label.value.trim()) fail(label, "코드명을 입력해 주세요.");
    });
    const known = saved().map((r) => r.dataset.codeRow);
    const fresh = [...body.querySelectorAll("[data-code-new-code]")];
    const codes = fresh.map((i) => i.value.trim().toUpperCase());
    fresh.forEach((input, n) => {
      const code = codes[n];
      if (!code) fail(input, "코드를 입력해 주세요.");
      else if (!PATTERN.test(code)) fail(input, "영문 대문자로 시작해 영문·숫자·_로 입력해 주세요.(최대 20자)");
      else if (known.includes(code)) fail(input, "이미 사용 중인 상세 코드입니다.");
      else if (codes.indexOf(code) !== n || codes.lastIndexOf(code) !== n) fail(input, "다른 새 행과 같은 상세 코드입니다.");
    });
    first?.focus();
    return !first;
  };

  document.addEventListener("input", (e) => {
    const row = e.target.closest?.("tr[data-code-row]");
    if (!row) return;
    if (e.target.matches("[data-code-new-code]")) e.target.value = e.target.value.toUpperCase();
    if (row.hasAttribute("data-invalid") && e.target.matches("[data-code-label], [data-code-new-code]")) clearRow(row);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-code-add]")) {
      body.append(document.getElementById("code-new-row").content.cloneNode(true));
      renumber();
      const input = rows().at(-1).querySelector("input");
      input.scrollIntoView({ block: "nearest" });
      input.focus({ preventScroll: true });
      return;
    }
    const rm = e.target.closest("[data-code-remove]");
    if (rm) {
      rm.closest("tr").remove();
      return renumber();
    }
    const del = e.target.closest("[data-code-del]");
    if (del) {
      const row = del.closest("tr");
      const on = !row.hasAttribute("data-deleted");
      row.toggleAttribute("data-deleted", on);
      if (on) clearRow(row);
      row.querySelector("[data-struck-label]").textContent = row.querySelector("[data-code-label]").value;
      del.setAttribute("aria-pressed", on);
      del.setAttribute("aria-label", row.dataset.codeRow + (on ? " 삭제 되돌리기" : " 삭제"));
      del.title = on ? "삭제 되돌리기" : "삭제";
      return;
    }
    // [저장] — 고친 것이 없어도 누를 수 있다(앱, 2026-10-30 재영). 알림은 앱 savedToast 대로: 새 행이 있거나 수정 · 삭제가 함께면 저장, 삭제만이면 삭제, 그 밖은 수정
    if (e.target.closest("[data-code-save]")) {
      if (!validate()) return;
      const all = rows();
      const creates = all.filter((r) => r.hasAttribute("data-code-new")).length;
      const deletes = all.filter((r) => r.hasAttribute("data-deleted")).length;
      const updates = dirty() && all.length - creates - deletes > 0;
      window.erpToast?.(creates || (updates && deletes) ? "저장되었습니다." : deletes ? "삭제되었습니다." : "수정되었습니다.");
      all.filter((r) => r.hasAttribute("data-deleted")).forEach((r) => r.remove());
      // 저장한 새 행은 보통 줄로(손잡이 · 글자 코드 · [삭제])
      all.filter((r) => r.isConnected && r.hasAttribute("data-code-new")).forEach((r) => {
        const code = r.querySelector("[data-code-new-code]").value.trim().toUpperCase();
        const label = r.querySelector("[data-code-label]").value.trim();
        const on = r.querySelector('input[role="switch"]').checked;
        const t = document.createElement("template");
        t.innerHTML = document.getElementById("code-saved-row").innerHTML.replaceAll("__CODE__", code);
        const row = t.content.firstElementChild;
        row.querySelector("[data-code-label]").value = label;
        row.querySelector('input[role="switch"]').checked = on;
        r.replaceWith(row);
      });
      body.querySelectorAll("input").forEach((i) => (i.type === "checkbox" ? (i.defaultChecked = i.checked) : (i.defaultValue = i.value)));
      reset();
      renumber();
      return;
    }
    const groupLink = e.target.closest("[data-code-group]");
    if (groupLink) {
      e.preventDefault();
      if (dirty()) ask(() => {});
    }
  });

  // 저장하지 않은 변경 확인
  let pending = null;
  const ask = (go) => {
    pending = go;
    document.getElementById("code-unsaved").showModal();
  };
  document.querySelector("[data-code-discard]")?.addEventListener("click", () => {
    document.getElementById("code-unsaved").close();
    body.innerHTML = initial;
    reset();
    renumber();
    pending?.();
    pending = null;
  });

  // 그룹 검색 — 두 칸 값을 함께 건다
  const search = () => {
    const code = document.querySelector('input[aria-label="그룹 코드"]').value.trim();
    const name = document.querySelector('input[aria-label="그룹명"]').value.trim();
    const groupRows = [...document.querySelectorAll("[data-group-row]")];
    let shown = 0;
    groupRows.forEach((r) => {
      const [c, n] = r.dataset.groupRow.split("|");
      const hit = (!code || c.toUpperCase().includes(code.toUpperCase())) && (!name || n.includes(name));
      r.hidden = !hit;
      shown += hit;
    });
    document.querySelector("[data-group-count]").textContent = shown;
    const tbody = groupRows[0].closest("tbody");
    tbody.querySelector("[data-group-empty]")?.remove();
    if (shown) return;
    const terms = [code && "그룹 코드 ‘" + code + "’", name && "그룹명 ‘" + name + "’"].filter(Boolean).join(" · ");
    const empty = document.createElement("tr");
    empty.dataset.groupEmpty = "";
    empty.className = "h-[92px] border-b border-erp-thead-line";
    empty.innerHTML = '<td colspan="3" class="text-center text-erp-muted"></td>';
    empty.firstChild.innerHTML = terms ? "" : "볼 수 있는 공통코드 그룹이 없습니다.";
    if (terms) empty.firstChild.append(terms + "에 맞는 공통코드 그룹이 없습니다.", document.createElement("br"), "검색 조건을 바꿔 다시 검색해 주세요.");
    tbody.append(empty);
  };
  const trySearch = () => (dirty() ? ask(search) : search());
  document.querySelectorAll('input[aria-label="그룹 코드"], input[aria-label="그룹명"]').forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) trySearch();
    });
    input.parentElement.querySelector('[aria-label="검색"]')?.addEventListener("click", trySearch);
  });
})();
</script>`;
