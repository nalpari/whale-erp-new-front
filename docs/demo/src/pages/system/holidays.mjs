// 플랫폼 휴일 관리(조회 전용). 목업 docs/mockup/system/holidays.html 을 플랫폼 관리자로 본 것.
// 목업의 캘린더·목록 보기 전환은 탭으로 옮겼고, 표(목록)를 먼저 연다. 캘린더는 2026년 9월(목업 처음 진입).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { platformHeader } from "../../site.mjs";

const sub = (t) => `<span class="ml-[10px] text-[14px] font-normal text-erp-label">${t}</span>`;

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
// 이전·다음 달 버튼(필터 패널의 아이콘 버튼과 같은 껍데기)
const iconBtn = (A, icon, label) => `<button type="button" aria-label="${label}" class="grid size-[34px] place-items-center rounded-[2px] border border-erp-button-line bg-white">${ui.img(A, icon, 16, 16)}</button>`;

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
    memo || '<span class="text-erp-muted">—</span>',
  ]);
  const list = ui.sectionHead(`2026년${sub(`공식 휴일 ${HOLIDAYS.length}일`)}`, '<span class="text-[14px] text-erp-label">목록은 고른 연도 한 해를 보여 줍니다</span>') + ui.dataTable(cols, rows);

  const sep = HOLIDAYS.filter((h) => h[0].startsWith("2026-09")).length;
  const cal =
    `<div class="flex items-center gap-[6px]">${ui.button("오늘", { variant: "off" })}${iconBtn(A, "prev.svg", "이전달")}${iconBtn(A, "next.svg", "다음달")}${sel(["8월", "9월", "10월"], "9월", "월", "w-[80px]")}</div>` +
    ui.sectionHead(`2026년 9월${sub(`공식 휴일 ${sep}일`)}`, `<span class="flex gap-[18px]">${legend("bg-erp-off", "공식 휴일")}${legend("border border-erp-brand", `오늘 ${TODAY}`)}</span>`) +
    monthGrid(2026, 9);

  const body = ui.detailBody(
    `<div class="flex items-center gap-[12px]">${sel(["2000년", "…", "2025년", "2026년", "2027년", "…", "2100년"], "2026년", "연도", "w-[96px]")}<span class="text-[14px] text-erp-label">최종 동기화 2026-09-01 03:00 · 올해·다음 해 공식 휴일 동기화</span></div>` +
      `<div class="flex flex-col gap-[12px]">${x.tabs(
        [
          { id: "calendar", label: "캘린더", html: cal },
          { id: "list", label: "목록", html: list },
        ],
        "calendar",
      )}</div>`,
  );

  return {
    title: "플랫폼 휴일 관리",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "플랫폼 휴일 관리", body }),
  };
};
