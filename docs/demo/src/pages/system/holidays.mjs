// 플랫폼 휴일 관리(조회 전용). 목업 docs/mockup/system/holidays.html 을 플랫폼 관리자로 본 것.
// 앱 public-holidays/page.tsx 와 같다 — 캘린더 · 목록 탭 오른쪽에 「최근 동기화」 꼬리표, 캘린더는 제목 자리에 달 이동 줄,
// 목록은 제목 자리에 연도 선택칸(2026-11-02 사용자 지정). 캘린더는 2026년 9월(목업 처음 진입).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { platformHeader } from "../../site.mjs";

// 「선택한 월의 공식 휴일은 N일입니다.」 — 숫자와 「일」만 굵게(앱과 같다, 2026-11-02 사용자 지정)
const countText = (unit, n) => `<span class="text-[14px] text-erp-label">선택한 ${unit}의 공식 휴일은 <span class="font-semibold">${n}일</span>입니다.</span>`;

// [날짜, 요일, 휴일명, 비고]
const HOLIDAYS = [
  ["2026-01-01", "목", "신정", ""],
  ["2026-02-16", "월", "설날", "설 연휴"],
  ["2026-02-17", "화", "설날", ""],
  ["2026-02-18", "수", "설날", "설 연휴"],
  ["2026-03-01", "일", "삼일절", ""],
  ["2026-03-02", "월", "대체공휴일", "삼일절 대체"],
  ["2026-05-05", "화", "어린이날", ""],
  ["2026-05-24", "일", "부처님오신날", ""],
  ["2026-05-25", "월", "대체공휴일", "부처님오신날 대체"],
  ["2026-06-06", "토", "현충일", ""],
  ["2026-08-15", "토", "광복절", ""],
  ["2026-08-17", "월", "대체공휴일", "광복절 대체"],
  ["2026-09-24", "목", "추석", "추석 연휴"],
  ["2026-09-25", "금", "추석", ""],
  ["2026-09-26", "토", "추석", "추석 연휴"],
  ["2026-09-28", "월", "대체공휴일", "추석 대체"],
  ["2026-10-03", "토", "개천절", ""],
  ["2026-10-05", "월", "대체공휴일", "개천절 대체"],
  ["2026-10-09", "금", "한글날", ""],
  ["2026-12-25", "금", "성탄절", ""],
];
const TODAY = "2026-09-21";

// 월 달력. 1팀 컴포넌트에 없어 표 선·표 머리 바탕으로 그린다. 공식 휴일은 상태 빨강, 오늘은 날짜 선택판의 오늘 표시와 같은 테두리.
function monthGrid(y, m) {
  const first = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => i - first + 1);
  const td = (d, i) => {
    const line = `h-[92px] border-b border-erp-thead-line p-[10px] align-top ${i % 7 ? "border-l" : ""}`;
    if (d < 1 || d > days) return `<td class="${line} bg-erp-thead-bg"></td>`;
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const hol = HOLIDAYS.find((h) => h[0] === key);
    if (hol) return `<td class="${line} bg-erp-off-bg"><span class="text-[14px] font-semibold text-erp-off">${d}</span><p class="mt-[6px] text-[13px] font-medium text-erp-off">${hol[2]}</p></td>`;
    if (key === TODAY) return `<td class="${line}"><span aria-label="오늘" class="inline-grid h-[24px] min-w-[24px] place-items-center rounded-[2px] border border-erp-brand px-[4px] text-[14px] font-semibold text-erp-brand">${d}</span></td>`;
    return `<td class="${line}"><span class="text-[14px] text-erp-ink">${d}</span></td>`;
  };
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => `<tr>${cells.slice(r * 7, r * 7 + 7).map((d, i) => td(d, i)).join("")}</tr>`).join("");
  const head = ["일", "월", "화", "수", "목", "금", "토"].map((w) => `<th scope="col" class="px-[10px] text-left font-medium text-erp-thead-text">${w}</th>`).join("");
  return `<table aria-label="${y}년 ${m}월 캘린더" class="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]"><thead><tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

// 범례 칸
const legend = (cls, text) => `<span class="flex items-center gap-[6px] text-[14px] text-erp-ink"><i class="inline-block size-[10px] rounded-[2px] ${cls}"></i>${text}</span>`;
// 달 이동 줄 [2026년 9월 ▾] ‹ › [오늘 · 날짜] — BP 휴일 데모(config/holidays.mjs monthNav)와 같은 모양. 연 · 월 고르기 판은 그리지 않는다.
const ICON_BOX = "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";
const arrow = (d) => `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="size-[16px] text-erp-ink"><path d="${d}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const monthNav = () =>
  `<div role="group" aria-label="달 이동" class="flex items-center gap-[6px]"><button type="button" aria-expanded="false" aria-label="2026년 9월 — 연 · 월 선택" class="flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-button-line bg-white pr-[8px] pl-[12px] text-[16px] font-semibold text-erp-ink transition-[border-color] duration-150 hover:border-erp-brand">2026년 9월<span class="ml-[2px] grid size-[20px] place-items-center rounded-full bg-erp-brand-soft"><svg viewBox="0 0 10 6" fill="none" aria-hidden="true" class="h-[6px] w-[10px]"><path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></button><button type="button" aria-label="이전달" class="${ICON_BOX}">${arrow("M11 14L5 8L11 2")}</button><button type="button" aria-label="다음달" class="${ICON_BOX}">${arrow("M5 14L11 8L5 2")}</button><button type="button" class="flex h-[34px] shrink-0 items-center rounded-[2px] border border-erp-button-line bg-white px-[14px] text-[14px] font-medium whitespace-nowrap text-erp-ink transition-[border-color] duration-150 ease-out hover:border-erp-brand">오늘<span class="ml-[6px] text-[12px] font-normal text-erp-label">· 2026-09-21(월)</span></button></div>`;
// 탭 바로 오른쪽 「최근 동기화」 꼬리표 — Tag 바탕 · 선 · 글자색에 탭 글자와 같은 15px(앱과 같다, 2026-11-02 사용자 지정)
const syncTag = (at) =>
  `<span class="ml-[18px] self-center rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[8px] py-[2px] text-[15px] font-medium whitespace-nowrap text-erp-sub">최근 동기화 <span class="ml-[4px] text-erp-ink">${at}</span></span>`;

export default ({ A, R }) => {
  const sel = (opts, value, label, w) => `<div class="${w} shrink-0">${ui.select(opts, { value, "aria-label": label })}</div>`;

  const cols = [
    { header: "날짜", width: "w-[220px]" },
    { header: "휴일명", align: "left" },
    { header: "비고", align: "left" },
  ];
  const rows = HOLIDAYS.map(([d, w, name, memo]) => [
    `<span class="text-erp-off">${d}</span> <span class="text-erp-label">(${w})</span>`,
    name,
    memo || '<span class="text-erp-muted">-</span>', // 짧은 「-」(앱과 같다, 2026-10-30)
  ]);
  // 제목 자리에 연도 선택칸(앱 HolidayList, 2026-11-02 사용자 지정 — 전엔 맨 위 줄에 선택칸, 여기엔 「2026년」 제목)
  const list =
    `<div class="flex items-center gap-[12px]">${sel(["2000년", "…", "2025년", "2026년", "2027년", "…", "2100년"], "2026년", "연도", "w-[110px]")}${countText("연도", HOLIDAYS.length)}</div>` +
    ui.dataTable(cols, rows);

  const sep = HOLIDAYS.filter((h) => h[0].startsWith("2026-09")).length;
  // 제목 자리에 달 이동 줄 + 「선택한 월의 공식 휴일은 N일입니다.」, 오른쪽 범례는 「공식 휴일」 하나(앱과 같다, 2026-10-30 · 11-02)
  const cal =
    `<div class="flex items-center gap-[6px]"><div class="flex flex-1 items-center gap-[6px]">${monthNav()}<span class="ml-[12px]">${countText("월", sep)}</span></div>${legend("bg-erp-off", "공식 휴일")}</div>` +
    monthGrid(2026, 9);

  const tabs = x
    .tabs(
      [
        { id: "calendar", label: "캘린더", html: cal },
        { id: "list", label: "목록", html: list },
      ],
      "calendar",
    )
    // 꼬리표는 탭 목록(tablist) 밖에 둔다 — 탭 줄 선은 둘을 감싼 줄이 긋는다(앱 page.tsx 와 같다)
    .replace(
      /<div role="tablist" class="flex shrink-0 border-b border-erp-bar-line">([\s\S]*?)<\/div>/,
      (m, tabsHtml) =>
        `<div class="flex shrink-0 items-center border-b border-erp-bar-line"><div role="tablist" class="flex">${tabsHtml}</div>${syncTag("2026-09-01 04:00")}</div>`,
    );
  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${tabs}</div>`);

  return {
    title: "플랫폼 휴일 관리",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "플랫폼 휴일 관리", body }),
  };
};
