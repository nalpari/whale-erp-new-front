// 필터의 점포 고르기 — 휴일 등록 「대상 점포」(config-parts storePicker)와 같은 동작을 왼쪽 필터 폭(188px)에 맞춰 줄였다(2026-10-12).
// 1팀 화면의 필터 「점포」 칸이 함께 쓴다(점포 정보 관리 · BP 관리자 관리).
// 칸을 누르면 아직 고르지 않은 점포가 펼쳐지고 글자로 좁힌다(erp.js data-spick 자동완성). 고르면 아래 「선택한 점포」에 한 줄씩 쌓인다.
// 필터에서는 펼친 목록에 점포코드를 보이지 않는다(data-spick-nocode · 2026-10-12). 코드로 찾는 것은 그대로 된다.
// 칸은 type=text 로 둔다 — type=search 면 erp.js 목록 거르기가 그 글자로 목록을 걸러 버린다.
import * as ui from "./ui.mjs";
import { storeBulkDialog } from "./config-parts.mjs";
import { STORES } from "./site.mjs";

// 떠 있는 목록이라 팝업 그림자 하나만 쓴다(DESIGN 뜬 것만 그림자). 테두리 #ebebeb 는 팝업 테두리 값.
const DROPDOWN =
  '<div role="listbox" aria-label="고를 수 있는 점포" hidden data-spick-dd class="absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-[288px] overflow-y-auto overscroll-contain rounded-[2px] border border-[#ebebeb] bg-white p-[6px] shadow-[0_2px_6px_rgba(40,47,55,0.08)]"></div>';

// stores: [점포코드, 점포명, 점포유형, …] — 고를 수 있는 점포(내 관리 범위)
const spickAttrs = (stores) => `data-spick data-spick-pool="${stores.map(([code, name, type]) => `${name}|${code}|${type}`).join(";")}" data-store-filter data-spick-nocode`;
// 필터 라벨 줄 · 칩 머리의 작은 버튼(24px) — 앱 theme.ts SMALL_BUTTON 과 같다
const SMALL_BUTTON =
  "inline-flex h-[24px] shrink-0 items-center rounded-[2px] border border-erp-brand-soft bg-erp-brand-soft px-[8px] text-[12px] font-medium whitespace-nowrap text-white transition-[background-color,border-color,color] duration-150 ease-out hover:border-erp-brand hover:bg-white hover:text-erp-ink";
const pickerBody = (A, clearLabel, clearClass = "text-erp-link hover:underline") =>
  `<div class="relative" data-spick-find>${ui.searchField(A, { placeholder: "점포명 또는 점포코드", label: "점포 찾기" }).replace('type="search"', 'type="text"')}${DROPDOWN}</div>` +
  `<div class="flex flex-col gap-[6px]">` +
  `<p class="flex items-center gap-[6px] text-[13px] font-medium text-erp-ink">선택한 점포<span class="font-normal text-erp-label" data-spick-count>0개점</span><button type="button" data-spick-clear class="ml-auto ${clearClass}">${clearLabel}</button></p>` +
  // 칩은 erp.js 가 붙인다. 필터 폭이라 한 줄에 하나, 긴 점포명은 말줄임. 5개(칩 34px × 5 + 간격 6px × 4 = 194px)까지 보이고 그 뒤로는 이 안에서 스크롤. 칩이 눌려 작아지지 않게 shrink-0.
  `<ul aria-label="선택한 점포" data-spick-list class="flex max-h-[194px] flex-col gap-[6px] overflow-y-auto overscroll-contain [&>li]:min-w-0 [&>li]:shrink-0 [&>li>span]:min-w-0 [&>li>span]:flex-1 [&>li>span]:truncate"></ul>` +
  `</div>`;

export const storeFilter = (A, stores = STORES) => `<div class="flex flex-col gap-[10px]" ${spickAttrs(stores)}>${pickerBody(A, "모두 빼기")}</div>` + STORE_PICK_SCRIPT;

// 점포 정보 관리 필터의 「점포」 묶음 전체(2026-10-27 — 앱 store-filter.tsx 와 같게). 칩 지우기는 작은 [전체 제거], 라벨 줄 오른쪽에 같은 모양의 [일괄검색](24px)을 두어
// BP 관리자 등록과 같은 일괄 검색 창을 「고를 수 있는 점포 / 선택한 점포」 문구로 연다. erp.js 가 버튼 · 창을 같은 [data-spick] 안에서 찾으므로 묶음 자체에 data-spick 을 단다.
const FILTER_BULK_TEXT = {
  guide: "왼쪽에서 체크하고 [추가 ›] 를 누르거나 끌어서 오른쪽에 놓으면 선택됩니다. 오른쪽에서 빼면 선택이 풀립니다.",
  left: "고를 수 있는 점포",
  right: "선택한 점포",
  leftDone: "고를 수 있는 점포를 모두 골랐습니다.",
  rightEmpty: "아직 고른 점포가 없습니다.<br>왼쪽에서 골라 옮기세요.",
};
export const storeFilterSection = (A, stores = STORES) => {
  const dlg = ui.uid("filter-bulk");
  const bulkButton = `<button type="button" data-spick-open="${dlg}" class="${SMALL_BUTTON}">일괄검색</button>`;
  return (
    `<div role="group" aria-label="점포" class="flex flex-col gap-[8px] border-b border-erp-divider pb-[18px]" ${spickAttrs(stores)}>` +
    `<div class="flex items-center justify-between gap-[6px]"><p class="text-[14px] font-medium text-erp-label">점포</p>${bulkButton}</div>` +
    `<div class="flex flex-col gap-[10px]">${pickerBody(A, "전체 제거", SMALL_BUTTON)}</div>` +
    storeBulkDialog(A, dlg, { stores: stores.map(([code, name, type]) => [name, code, type]), picked: [], text: FILTER_BULK_TEXT }) +
    `</div>` +
    STORE_PICK_SCRIPT
  );
};

// 칩의 × 로 그 점포를 빼고 「N개점」을 다시 센다. erp.js 에는 칩 빼기가 없어 이 부품에 붙여 둔다(한 화면에 한 번만 실행).
const STORE_PICK_SCRIPT = `<script>
(() => {
  if (window.__storePick) return;
  window.__storePick = true;
  document.querySelectorAll("[data-store-filter]").forEach((box) => {
    const list = box.querySelector("[data-spick-list]");
    const count = () => (box.querySelector("[data-spick-count]").textContent = list.children.length + "개점");
    list.addEventListener("click", (e) => {
      const x = e.target.closest("li[data-code] button");
      if (x) x.closest("li").remove();
    });
    new MutationObserver(count).observe(list, { childList: true });
  });
})();
</script>`;
