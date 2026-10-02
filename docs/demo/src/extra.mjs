// 1팀 공통 컴포넌트에 없는 부품. 데모를 그리려고 임시로 둔 것이고, 컴포넌트 제안의 대상이다.
// 생김새는 DESIGN.md 토큰과 규칙(2px 모서리, 1px 선, 34/42/46 높이, 뜬 것만 그림자)으로만 만든다.
// 여기 없는 부품이 필요하면 화면 파일 안에서 같은 규칙으로 만들고, 무엇을 만들었는지 보고한다.
import { button, uid } from "./ui.mjs";

// 탭. 고른 탭은 erp.js 가 바꾼다. 주소의 #id 가 탭 패널 id 와 같으면 그 탭으로 연다(예: 화면.html#탭 id).
// tabs: [{ id, label, html }]
const TAB_ON = "border-erp-brand font-semibold text-erp-ink";
const TAB_OFF = "border-transparent font-medium text-erp-label hover:text-erp-ink";
export function tabs(items, selected = items[0].id) {
  const list = items
    .map(
      (t) =>
        `<button type="button" role="tab" id="tab-${t.id}" aria-controls="${t.id}" aria-selected="${t.id === selected}" data-on="${TAB_ON}" data-off="${TAB_OFF}" class="-mb-px flex h-[42px] items-center border-b-2 px-[18px] text-[15px] transition-colors duration-150 ease-out ${t.id === selected ? TAB_ON : TAB_OFF}">${t.label}</button>`,
    )
    .join("");
  const panels = items
    .map((t) => `<div role="tabpanel" id="${t.id}" aria-labelledby="tab-${t.id}" class="flex min-h-0 flex-1 flex-col gap-[12px]"${t.id === selected ? "" : " hidden"}>${t.html}</div>`)
    .join("");
  return `<div role="tablist" class="flex shrink-0 border-b border-erp-bar-line">${list}</div>${panels}`;
}

// 확인창·팝업 창. 네이티브 <dialog> 로 띄운다(Esc 로 닫힘). 여는 버튼은 dialogTrigger, 닫는 버튼은 data-close.
// buttons 를 비우면 [취소][확인] 을 둔다.
export function dialog(id, title, body, buttons) {
  const foot = buttons ?? `${button("취소", { variant: "off", "data-close": true })}${button("확인", { "data-close": true })}`;
  return `<dialog id="${id}" aria-labelledby="${id}-title" class="m-auto w-[420px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"><h2 id="${id}-title" class="text-[18px] font-semibold">${title}</h2><div class="mt-[12px] text-[14px] leading-[1.6] text-erp-ink">${body}</div><div class="mt-[24px] flex justify-end gap-[6px]">${foot}</div></dialog>`;
}
export const dialogTrigger = (label, id, variant = "primary") => button(label, { variant, "data-dialog": id });
export const dialogId = () => uid("dialog");

// 켜고 끄는 스위치(사용 여부 등). 체크박스 위에 그린다.
export const toggle = (label, checked = false) =>
  `<label class="flex items-center gap-[8px] text-[14px] text-erp-ink"><span class="relative inline-flex h-[20px] w-[36px] shrink-0"><input type="checkbox" role="switch" class="peer absolute inset-0 appearance-none rounded-full bg-erp-field-line transition-colors duration-150 ease-out checked:bg-erp-brand"${checked ? " checked" : ""}><span class="pointer-events-none absolute top-[2px] left-[2px] size-[16px] rounded-full bg-white transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] peer-checked:translate-x-[16px] motion-reduce:transition-none"></span></span>${label}</label>`;

// 보기 전환(카드 / 표). 탭과 같은 동작이라 role="tab" 으로 두고 erp.js 의 탭 처리를 그대로 쓴다.
// items: [{ id, label, icon }] — icon 은 24 격자 SVG path. 패널은 tabPanel 로 따로 둔다.
const SEG_ON = "bg-erp-subtle font-semibold text-erp-ink";
const SEG_OFF = "bg-white text-erp-label hover:text-erp-ink";
export function segment(label, items, selected = items[0].id) {
  const btns = items
    .map(
      (t) =>
        `<button type="button" role="tab" id="tab-${t.id}" aria-controls="${t.id}" aria-selected="${t.id === selected}" data-on="${SEG_ON}" data-off="${SEG_OFF}" class="flex h-[32px] items-center gap-[6px] px-[12px] text-[14px] transition-colors duration-150 ease-out ${t.id === selected ? SEG_ON : SEG_OFF}">${t.icon ? `<svg viewBox="0 0 24 24" class="size-[15px] fill-none stroke-current" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t.icon}</svg>` : ""}${t.label}</button>`,
    )
    .join("");
  return `<div role="tablist" aria-label="${label}" class="flex shrink-0 overflow-hidden rounded-[2px] border border-erp-button-line">${btns}</div>`;
}
export const tabPanel = (id, html, shown) => `<div role="tabpanel" id="${id}" aria-labelledby="tab-${id}" class="flex flex-col gap-[12px]"${shown ? "" : " hidden"}>${html}</div>`;
export const ICON = {
  grid: '<rect x="3.6" y="3.6" width="7" height="7" rx="1.4"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.4"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.4"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.4"/>',
  table: '<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2"/><path d="M3.4 9.6h17.2M3.4 14.6h17.2M9.6 9.6v9.8"/>',
  store: '<path d="M4.6 9.6v10.7h14.8V9.6"/><path d="M3 9.6 4.7 3.9h14.6L21 9.6"/><path d="M3 9.6a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M9.6 20.3v-6.1h4.8v6.1"/>',
};

// 카드(점포 카드 등). 카드 전체가 링크다. 모서리 4px·1px 선·그림자 없음(카드·패널 규칙), 호버는 선 색만 바꾼다.
// image: 이미지 주소(없으면 아이콘 칸), fields: [[라벨, 값, wide?]]
// data: 목록 거르기용 항목 { 열 이름: 값 }. 카드에 보이지 않는 값(사업자등록번호 등)도 넣는다 — 표 머리와 같은 이름이면 erp.js 가 그 열처럼 거른다.
export function card({ href, image, icon = ICON.store, title, sub, badge = "", fields = [], data }) {
  const pic = image
    ? `<img src="${image}" alt="${title} 대표 이미지" class="size-[48px] shrink-0 rounded-[2px] object-cover">`
    : `<span role="img" aria-label="대표 이미지 없음" class="grid size-[48px] shrink-0 place-items-center rounded-[2px] bg-erp-thead-bg text-erp-label"><svg viewBox="0 0 24 24" class="size-[20px] fill-none stroke-current" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></span>`;
  const grid = fields
    .map(([k, v, wide]) => `<div class="${wide ? "col-span-2 " : ""}flex flex-col gap-[4px]"><dt class="text-[13px] text-erp-label">${k}</dt><dd class="truncate text-[14px] text-erp-ink">${v}</dd></div>`)
    .join("");
  return `<a href="${href}"${data ? ` data-fields='${JSON.stringify(data)}'` : ""} class="flex flex-col gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[18px] transition-colors duration-150 ease-out hover:border-erp-brand"><div class="flex items-center gap-[12px]">${pic}<div class="flex min-w-0 flex-1 flex-col gap-[4px]"><b class="truncate text-[15px] font-semibold text-erp-ink">${title}</b><span class="truncate text-[13px] text-erp-label">${sub}</span></div>${badge}</div><dl class="grid grid-cols-2 gap-x-[12px] gap-y-[10px] border-t border-erp-divider pt-[12px]">${grid}</dl></a>`;
}
// data-filter-items: erp.js 의 목록 거르기가 카드 하나하나를 거르는 단서.
export const cardGrid = (cards) => `<div data-filter-items class="grid grid-cols-4 gap-[12px]">${cards.join("")}</div>`;
