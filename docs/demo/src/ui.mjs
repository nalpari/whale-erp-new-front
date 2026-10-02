// 데모 HTML 을 그리는 함수들. src/components/common 의 컴포넌트를 HTML 문자열로 옮겼다.
// 클래스 문자열은 컴포넌트 코드와 한 글자도 다르면 안 된다 — 다르면 1팀 화면과 생김새가 어긋난다.
// 컴포넌트가 바뀌면 여기도 고치고 node docs/demo/build.mjs 를 다시 돌린다.
// 값은 데모를 만드는 사람이 쓴 글자뿐이라 따로 이스케이프하지 않는다(사용자 입력이 들어오지 않는다).

let seq = 0;
export const uid = (p = "erp") => `${p}-${++seq}`;
export const resetIds = () => (seq = 0);
const attrs = (a = {}) =>
  Object.entries(a)
    .filter(([, v]) => v !== false && v != null)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${v}"`))
    .join("");

// theme.ts
export const EASE_OUT = "ease-[cubic-bezier(0.23,1,0.32,1)]";
export const FIELD_BOX =
  "w-full rounded-[2px] border border-erp-field-line bg-white text-[14px] text-erp-ink outline-none! caret-erp-ink! transition-[border-color] duration-150 ease-out placeholder:text-erp-label focus:border-erp-brand";
export const FIELD = `${FIELD_BOX} h-[34px] pl-[10px]`;
export const ERP_THEME =
  "bg-white font-erp leading-[normal] tracking-[-0.025em] text-erp-ink scheme-light selection:bg-erp-brand selection:text-white [&_*:focus-visible]:outline-erp-brand! [&_:is(a[href],button:enabled,select:enabled,label:has(input:enabled),input[type=checkbox]:enabled)]:cursor-pointer [&_*]:[scrollbar-color:#cfd4da_transparent]! [&_*]:[scrollbar-width:thin]!";

// 아이콘. A 는 assets 폴더까지의 상대 경로(페이지마다 다르다).
export const img = (A, name, w, h, cls = "") => `<img alt="" width="${w}" height="${h}"${cls !== null ? (cls ? ` class="${cls}"` : "") : ""} src="${A}icons/${name}">`;

// button.tsx
const BTN_TONE = {
  primary: "border-erp-brand bg-erp-brand text-white",
  soft: "border-erp-brand-soft bg-erp-brand-soft text-white",
  off: "border-erp-subtle bg-erp-subtle text-erp-ink",
};
const BTN_SHELL =
  "inline-flex h-[34px] shrink-0 items-center justify-center rounded-[2px] border px-[24px] text-[14px] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-150 ease-out hover:border-erp-brand hover:bg-white hover:text-erp-ink";
export function button(label, { variant = "primary", href, ...a } = {}) {
  const cls = `${BTN_SHELL} ${BTN_TONE[variant]} `;
  return href !== undefined
    ? `<a class="${cls}" href="${href}"${attrs(a)}>${label}</a>`
    : `<button type="button"${attrs(a)} class="${cls}">${label}</button>`;
}

// badge.tsx
const BADGE_TONE = { on: "min-w-[44px] bg-erp-on-bg text-erp-on", off: "bg-erp-off-bg text-erp-off" };
export const badge = (tone, text) =>
  `<span class="inline-block rounded-[2px] px-[4px] py-[2px] text-center text-[14px] font-medium ${BADGE_TONE[tone]}">${text}</span>`;

export const link = (text, href, label) =>
  `<a${label ? ` aria-label="${label}"` : ""} class="text-erp-link hover:underline" href="${href}">${text}</a>`;

// page-bar.tsx
export const pageBar = (title, right = "") =>
  `<div class="flex h-[59px] items-center border-b border-erp-bar-line bg-white px-[24px]"><h1 class="flex-1 text-[22px] font-semibold text-erp-ink">${title}</h1>${right}</div>`;

// list-toolbar.tsx
export const listToolbar = (total, right = "") =>
  `<div class="flex items-end gap-[6px]"><p class="flex-1 text-[14px] text-erp-ink">총 <b class="font-semibold">${total.toLocaleString("ko-KR")}</b> 건</p>${right}</div>`;

// data-table.tsx. columns: { header, width?, align? }, rows: 칸 HTML 배열의 배열
export function dataTable(columns, rows, empty = "데이터가 없습니다.") {
  const cols = columns.map((c) => (c.width ? `<col class="${c.width}">` : "<col>")).join("");
  const head = columns.map((c) => `<th scope="col" class="px-[10px] font-medium text-erp-thead-text">${c.header}</th>`).join("");
  const body = rows.length
    ? rows
        .map(
          (r) =>
            `<tr class="h-[46px] border-b border-erp-thead-line">${r
              .map((cell, i) => `<td class="truncate px-[10px] ${columns[i].align === "left" ? "text-left" : "text-center"}">${cell}</td>`)
              .join("")}</tr>`,
        )
        .join("")
    : `<tr class="h-[92px] border-b border-erp-thead-line"><td colspan="${columns.length}" class="text-center text-erp-muted">${empty}</td></tr>`;
  return `<table class="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]"><colgroup>${cols}</colgroup><thead><tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">${head}</tr></thead><tbody class="text-erp-ink">${body}</tbody></table>`;
}

// detail-table.tsx. rows: [label, valueHtml]
export function detailTable(title, rows) {
  const items = rows
    .map(([label, value], i) => {
      const last = i === rows.length - 1;
      return `<div class="flex w-full"><dt class="flex h-[46px] w-[180px] shrink-0 items-center truncate border-b border-l border-erp-thead-line bg-white p-[12px] text-[14px] font-medium text-erp-label ${last ? "rounded-bl-[2px]" : ""}">${label}</dt><dd class="flex h-[46px] min-w-px flex-1 items-center gap-[10px] overflow-hidden border-r border-b border-erp-thead-line bg-white p-[12px] text-[14px] text-erp-ink ${last ? "rounded-br-[2px]" : ""}">${value}</dd></div>`;
    })
    .join("");
  return `<div class="w-full"><h3 class="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">${title}</h3><dl class="flex w-full flex-col">${items}</dl></div>`;
}
export const detailValues = (items) =>
  items
    .map((it, i) => `<span class="flex items-center gap-[10px] whitespace-nowrap">${i > 0 ? '<span class="h-[11px] w-px bg-[#d9d9d9]"></span>' : ""}${it}</span>`)
    .join("");

// form.tsx
export const textField = (a = {}) => `<input${attrs(a)} class="${FIELD}">`;
export const textarea = ({ rows = 8, value = "", ...a } = {}) =>
  `<textarea${attrs(a)} rows="${rows}" class="${FIELD_BOX} resize-none px-[16px] py-[12px] leading-[1.6]">${value}</textarea>`;
export const select = (options, { value, ...a } = {}) =>
  `<select${attrs(a)} class="${FIELD} appearance-none bg-[url(/icons/select-arrow.svg)] bg-[length:30px_30px] bg-[position:right_center] bg-no-repeat pr-[30px]">${options
    .map((o) => `<option${o === (value ?? options[0]) ? " selected" : ""}>${o}</option>`)
    .join("")}</select>`;
const MARK_MOTION =
  "pointer-events-none relative scale-75 opacity-0 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] peer-checked:scale-100 peer-checked:opacity-100 motion-reduce:scale-100";
export const checkbox = (A, label, checked = false, a = {}) =>
  `<label class="flex items-center gap-[8px] text-[14px] text-erp-ink"><span class="relative grid size-[20px] shrink-0 place-items-center"><input${attrs(a)} type="checkbox" class="peer absolute inset-0 appearance-none rounded-[2px] border border-erp-field-line bg-white transition-[background-color,border-color] duration-150 ease-out checked:border-erp-brand checked:bg-erp-brand"${checked ? " checked" : ""}>${img(A, "check.svg", 12, 9, MARK_MOTION)}</span>${label}</label>`;
export const radio = (label, name, checked = false) =>
  `<label class="flex items-center gap-[8px] text-[14px] text-erp-ink"><span class="relative grid size-[20px] shrink-0 place-items-center"><input type="radio" name="${name}" class="peer absolute inset-0 appearance-none rounded-full border border-erp-field-line bg-white transition-[border-color] duration-150 ease-out checked:border-erp-brand"${checked ? " checked" : ""}><span class="size-[8px] rounded-full bg-erp-brand ${MARK_MOTION}"></span></span>${label}</label>`;
export const field = (label, control, width) =>
  `<label class="flex flex-col justify-center gap-[8px] ${width ?? "min-w-px flex-1"}"><span class="truncate text-[14px] font-medium text-erp-label">${label}</span>${control}</label>`;
export const formRow = (...children) => `<div class="flex w-full gap-[6px]">${children.join("")}</div>`;
export const formGroup = (title, ...children) =>
  `<section class="flex w-full flex-col gap-[10px]"><h3 class="text-[15px] font-semibold text-erp-ink">${title}</h3><div class="flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">${children.join("")}</div></section>`;

// search-field.tsx
export const searchField = (A, { placeholder = "", label = placeholder, value = "" } = {}) =>
  `<div class="relative"><input aria-label="${label}" placeholder="${placeholder}" type="search" value="${value}" class="${FIELD} pr-[52px] [&::-webkit-search-cancel-button]:appearance-none"><button type="button" aria-label="입력 지우기" inert class="group absolute top-1/2 right-[32px] grid size-[18px] -translate-y-1/2 place-items-center rounded-full bg-erp-subtle transition-[opacity,background-color] duration-150 ease-out hover:bg-erp-field-line pointer-events-none opacity-0"><svg viewBox="0 0 8 8" class="size-[8px] stroke-erp-label transition-colors duration-150 ease-out group-hover:stroke-erp-ink" aria-hidden="true"><path d="M1 1l6 6M7 1L1 7" stroke-width="1.5" stroke-linecap="round" fill="none"></path></svg></button><button type="button" aria-label="검색" class="absolute top-0 right-0 grid size-[34px] place-items-center disabled:opacity-40">${img(A, "search.svg", 12, 12)}</button></div>`;

// date-field.tsx. 날짜판은 erp.js 가 popover 안에 그린다.
export const POPOVER =
  "fixed m-0 w-[268px] rounded-[2px] border border-[#ebebeb] bg-white p-[16px] shadow-[0_2px_6px_rgba(40,47,55,0.08)] font-erp tracking-[-0.025em] text-erp-ink scheme-light -translate-y-[4px] opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] open:translate-y-0 open:opacity-100 starting:open:-translate-y-[4px] starting:open:opacity-0 motion-reduce:translate-y-0 motion-reduce:transition-none [&_*:focus-visible]:outline-erp-brand! [&_button]:cursor-pointer";
export function dateField(A, { label = "날짜", value = "" } = {}) {
  const id = uid("date");
  return `<div class="relative"><input aria-label="${label}" placeholder="YYYY-MM-DD" value="${value}" class="${FIELD_BOX} h-[34px] pr-[34px] pl-[10px]"><button type="button" popovertarget="${id}" aria-label="${label} 달력 열기" aria-haspopup="dialog" aria-expanded="false" class="absolute top-0 right-0 grid h-[34px] w-[30px] place-items-center">${img(A, "calendar.svg", 30, 30)}</button><div id="${id}" popover="auto" role="dialog" aria-label="${label} 선택" class="${POPOVER}"></div></div>`;
}

// filter-panel.tsx
const PANEL_BUTTON = "grid h-[32px] place-items-center rounded-[2px] border border-erp-button-line bg-white";
export function filterPanel(A, sections, { title = "필터", reset = true } = {}) {
  return `<aside class="relative shrink-0 overflow-hidden rounded-[4px] border border-erp-panel-line bg-white transition-[width] duration-250 ${EASE_OUT} motion-reduce:transition-none w-[226px] "><div class="flex h-full w-[224px] flex-col transition-opacity opacity-100 duration-200"><div class="mx-[18px] mt-[18px] flex shrink-0 items-center gap-[6px] border-b border-erp-divider pb-[18px]"><h2 class="flex-1 text-[15px] font-semibold text-erp-ink">${title}</h2><button type="button" aria-label="${title} 초기화"${reset ? "" : " disabled"} class="${PANEL_BUTTON} px-[13px]">${img(A, "reset.svg", 14, 14)}</button><span class="w-[38px]"></span></div><div class="min-h-0 flex-1 overflow-y-auto pl-[18px] [scrollbar-gutter:stable]"><div class="flex w-[188px] flex-col gap-[18px] pt-[18px] pb-[24px]">${sections.join("")}</div></div></div><button type="button" aria-label="${title} 접기" aria-expanded="true" class="absolute top-[18px] right-[18px] w-[38px] ${PANEL_BUTTON}">${img(A, "collapse.svg", 12, 18, "col-start-1 row-start-1 ")}${img(A, "expand.svg", 12, 18, "col-start-1 row-start-1 invisible")}</button></aside>`;
}
export const filterSection = (label, content, { tight, last } = {}) =>
  `<div role="group" aria-label="${label}" class="flex flex-col ${tight ? "gap-[8px]" : "gap-[12px]"} ${last ? "" : "border-b border-erp-divider pb-[18px]"}"><p class="text-[14px] font-medium text-erp-label">${label}</p>${content}</div>`;

// pagination.tsx
const ARROW = "flex items-center gap-[4px] transition-colors duration-150 ease-out enabled:hover:text-erp-brand disabled:text-erp-thead-text";
export function pagination(A, page, totalPages, maxPages = 10) {
  if (totalPages < 1) return "";
  const start = Math.max(1, Math.min(page - Math.floor(maxPages / 2), totalPages - maxPages + 1));
  const nums = Array.from({ length: Math.min(maxPages, totalPages) }, (_, i) => start + i);
  const num = (n) =>
    `<li><button type="button"${n === page ? ' aria-current="page"' : ""} class="size-[38px] rounded-[2px] border border-erp-subtle transition-[background-color,border-color,color] duration-150 ease-out ${
      n === page ? "bg-erp-subtle font-semibold text-erp-ink" : "bg-white text-erp-muted hover:border-erp-brand hover:text-erp-ink"
    }">${n}</button></li>`;
  return `<nav aria-label="페이지" class="flex items-center justify-center gap-[17px] text-[14px] font-medium"><button type="button"${page <= 1 ? " disabled" : ""} class="${ARROW} text-erp-ink">${img(A, "prev.svg", 16, 16)}Prev</button><ol class="flex gap-[9px]">${nums.map(num).join("")}</ol><button type="button"${page >= totalPages ? " disabled" : ""} class="${ARROW} text-erp-ink">Next${img(A, "next.svg", 16, 16)}</button></nav>`;
}

// slide-panel.tsx. trigger 는 aria-controls 로 이 id 를 가리키는 버튼이다(slideTrigger).
export const slidePanel = (id, label, children) =>
  `<aside id="${id}" aria-label="${label}" inert class="absolute inset-y-0 right-0 z-10 flex w-[464px] flex-col gap-[16px] overflow-y-auto border-x border-erp-panel-line bg-white p-[24px] transition-transform duration-250 ${EASE_OUT} motion-reduce:transition-none translate-x-full">${children}</aside>`;
export const slideTrigger = (label, id, variant = "primary") => button(label, { variant, "aria-expanded": "false", "aria-controls": id });
// 패널 아래 버튼 줄. data-close 는 erp.js 가 패널을 닫는 단서다.
export const panelButtons = (cancel = "취소", save = "저장") =>
  `<div class="flex justify-center gap-[6px]">${button(cancel, { variant: "off", "data-close": true })}${button(save, { "data-close": true })}</div>`;

// popup.tsx (헤더의 점포 선택칸·사용자 메뉴가 쓴다)
const MOTION = {
  fold: {
    base: "transition-[clip-path,visibility] motion-reduce:transition-[opacity,visibility] motion-reduce:[clip-path:none]",
    closed: "invisible duration-[180ms] motion-reduce:opacity-0 [clip-path:inset(-8px_-8px_100%_-8px)]",
    innerClosed: "-translate-y-[6px] duration-[180ms]",
  },
  fade: { base: "transition-[opacity,visibility]", closed: "invisible opacity-0 duration-150", innerClosed: "" },
};
const TAIL = '<span class="absolute -top-[5px] left-1/2 size-[8px] -translate-x-1/2 -rotate-45 rounded-tr-[1px] border-t border-r border-[#ebebeb] bg-white"></span>';
export const popup = (id, motion, cls, children, tail = false) => {
  const m = MOTION[motion];
  return `<div id="${id}" inert class="absolute top-[calc(100%+8px)] z-20 rounded-[2px] border border-[#ebebeb] bg-white p-[23px] ${EASE_OUT} ${m.base} ${m.closed} ${cls}">${tail ? TAIL : ""}<div class="transition-transform ${EASE_OUT} motion-reduce:transform-none ${m.innerClosed}">${children}</div></div>`;
};

// store-select.tsx
export function storeSelect(A, options, value = options[0], label = "점포") {
  const id = uid("store");
  const rest = options.filter((o) => o !== value);
  const items = rest
    .map(
      (o) =>
        `<li><button type="button" class="block w-full truncate rounded-[8px] px-[12px] py-[10px] text-left transition-colors duration-150 ease-out hover:bg-erp-thead-bg hover:text-erp-brand focus-visible:bg-erp-thead-bg">${o}</button></li>`,
    )
    .join("");
  return `<div class="relative flex-1"><button type="button" aria-expanded="false" aria-controls="${id}" aria-label="${label}: ${value}" class="flex h-[42px] w-[420px] items-center gap-[10px] rounded-full border border-erp-field-line bg-erp-thead-bg px-[18px] text-left text-[14px] text-erp-ink"><span class="flex-1 truncate">${value}</span>${img(A, "chevron-small-brand.svg", 5, 8, `transition-transform duration-200 ${EASE_OUT} -rotate-90`)}</button>${popup(
    id,
    "fold",
    "left-0 w-[420px] rounded-[12px]! border-erp-field-line! p-[6px]! shadow-[0_2px_6px_rgba(40,47,55,0.08)]",
    `<ul aria-label="${label}" class="text-[14px] text-erp-ink">${items}</ul>`,
  )}</div>`;
}

// user-pop.tsx. items: { label, href, danger? }
export function userPop(A, name, items) {
  const id = uid("user");
  const list = items
    .map((it) => `<li><a class="${it.danger ? "text-[#e93737]" : "text-erp-ink hover:text-erp-brand"}" href="${it.href}">${it.label}</a></li>`)
    .join("");
  return `<div class="relative"><button type="button" aria-expanded="false" aria-controls="${id}" class="flex items-center"><span class="flex items-center gap-[10px] text-[15px] font-medium text-erp-ink">${img(A, "avatar.svg", 42, 42)}${name}</span>${img(A, "user-more.svg", 34, 34, `transition-transform duration-200 ${EASE_OUT} `)}</button>${popup(
    id,
    "fade",
    "right-0 w-[154px]",
    `<p class="text-[15px] leading-[2] font-medium text-[#111] [text-box:trim-both_cap_alphabetic]">MY PAGE</p><hr class="mt-[12px] mb-[18px] border-erp-button-line"><ul class="text-[14px] leading-[2] [text-box:trim-both_cap_alphabetic]">${list}</ul>`,
    true,
  )}</div>`;
}

// global-header.tsx
const ICON_HOVER =
  "group relative grid h-[32px] place-items-center rounded-full [&>img]:transition-opacity [&>img]:duration-150 hover:[&>img]:opacity-70 [&>span:first-child]:transition-opacity hover:[&>span:first-child]:opacity-70";
const tip = (label) =>
  `<span class="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 z-20 -translate-x-1/2 translate-y-[4px] rounded-[100px] border border-[#ebebeb] bg-white px-[12px] py-[10px] text-[14px] leading-[2] whitespace-nowrap text-erp-brand opacity-0 transition-[opacity,translate] duration-150 ease-out [text-box:trim-both_cap_alphabetic] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0">${TAIL}${label}</span>`;
export const serviceLinks = (A, hrefs = {}) =>
  `<div class="flex h-[42px] shrink-0 items-center gap-[18px] rounded-full border border-erp-field-line bg-white px-[24px]"><span class="text-[15px] font-medium whitespace-nowrap text-erp-ink">서비스 바로가기</span><div class="flex items-center gap-[12px]"><a aria-label="웨일ERP" class="${ICON_HOVER} w-[32px]" href="${hrefs.erp ?? "#"}">${img(A, "service-erp.svg", 32, 32)}${tip("웨일ERP")}</a><a aria-label="부가서비스 현황" class="${ICON_HOVER} w-[32px] bg-white" href="${hrefs.addon ?? "#"}">${img(A, "service-chat.svg", 19, 19)}${tip("부가서비스 현황")}</a><a aria-label="플랫폼관리" class="${ICON_HOVER} w-[14px]" href="${hrefs.platform ?? "#"}"><span class="grid grid-cols-3 gap-[2.5px]">${img(A, "dot.svg", 3, 3).repeat(9)}</span>${tip("플랫폼관리")}</a></div></div>`;
export const alarmLink = (A, href) =>
  `<a aria-label="알림" class="shrink-0 rounded-full transition-opacity duration-150 ease-out hover:opacity-70" href="${href}">${img(A, "alarm.svg", 42, 42)}</a>`;

// menus: { label, items: [{ label, href }] }. 2depth 줄은 처음엔 첫 메뉴 항목을 그려 두고 erp.js 가 바꾼다.
export function globalHeader(A, menus, right, home = "#") {
  const navBtn = (m, i) =>
    `<button type="button" aria-expanded="false" class="flex h-[52px] shrink-0 items-center text-[16px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand-soft ${
      i === 0 ? "pr-[20px]" : "px-[20px]"
    } text-white">${m.label}</button>`;
  const sub = menus[0].items
    .map((it) => `<li><a class="whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand" href="${it.href}">${it.label}</a></li>`)
    .join("");
  return `<header class="bg-white" data-menus='${JSON.stringify(menus)}'><div class="flex h-[70px] items-center gap-[34px] px-[24px]"><a class="flex w-[177px] shrink-0 items-center gap-[10px]" href="${home}">${img(A, "logo-whale.svg", 53, 40)}<p class="leading-[1.3] text-[#252525]"><span class="block text-[16px] font-extrabold uppercase">Whale ERP</span><span class="block text-[12px]">Management System</span></p></a><div class="flex flex-1 items-center gap-[12px]">${right}</div></div><nav class="flex h-[52px] items-center gap-[54px] bg-erp-nav px-[24px]">${menus
    .map(navBtn)
    .join("")}</nav><div inert class="grid transition-[grid-template-rows] duration-200 ${EASE_OUT} motion-reduce:transition-none grid-rows-[0fr]"><div class="overflow-hidden"><ul class="flex gap-[24px] border-b border-erp-bar-line py-[12px] pl-[24px] text-[13.5px] leading-[16px] text-erp-sub transition-opacity ease-out opacity-100 duration-[180ms]">${sub}</ul></div></div></header>`;
}

// 화면 틀. /design/full 과 같은 조합이다: 헤더 · 제목 줄 · 본문(남는 높이). 등록 패널은 바깥 relative 영역 오른쪽에 겹친다.
export function erpFrame({ header, title, titleRight = "", body, panels = "" }) {
  return `<div class="${ERP_THEME} min-h-[100dvh]"><div class="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg"><div class="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">${header}${pageBar(title, titleRight)}${body}${panels}</div></div></div>`;
}

// 목록 화면 본문: 왼쪽 필터 + 오른쪽 목록 카드
export const listBody = (filter, content) =>
  `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${filter}<main class="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">${content}</main></div>`;

// 상세 화면 본문: 카드 하나, 넘치면 이 영역이 세로로 스크롤한다
export const detailBody = (content) =>
  `<div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]"><div class="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">${content}</div></div>`;

// 카드 안 묶음 제목 줄(상세 화면의 "전자 계약서" 줄)
export const sectionHead = (title, right = "") =>
  `<div class="flex items-end gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">${title}</h2>${right}</div>`;
