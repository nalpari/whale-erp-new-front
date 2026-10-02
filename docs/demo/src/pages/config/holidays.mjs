// BP 휴일 관리. 목업 docs/mockup/config/holidays.html 의 기본 상태(9월 캘린더 · 오늘 21일 선택)를 BP 마스터로 본 것.
// 목업 위쪽 휴일명 검색은 왼쪽 필터로, 캘린더·목록 보기 전환은 탭으로 옮겼다(system 휴일 관리와 같다).
// 휴일 등록·상세·수정은 목업처럼 화면을 옮기지 않고 확인창으로 연다. 내용은 holidays-new·detail·edit 화면 파일과 같은 함수로 그린다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { TITLE, TAGS, detailParts } from "./holidays-detail.mjs";
import { newForm } from "./holidays-new.mjs";
import { editForm, scopeDialog } from "./holidays-edit.mjs";

const TODAY = 21;
const OFFICIAL = { 24: "추석", 25: "추석", 26: "추석", 28: "대체공휴일" };
const COUNT = { 10: 1, 21: 1, 25: 1, 28: 1, 29: 1 };

// 월 달력(2026년 9월). 1팀 컴포넌트에 없어 표 선·표 머리 바탕으로 그린다(system 휴일 캘린더와 같은 모양).
// 공식 휴일은 상태 빨강, BP 휴일은 건수 배지, 고른 날짜(오늘)는 브랜드 테두리.
function monthGrid() {
  const first = new Date(2026, 8, 1).getDay();
  const days = 30;
  const cells = Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => i - first + 1);
  const td = (d, i) => {
    const line = `h-[92px] border-b border-erp-thead-line p-[10px] align-top ${i % 7 ? "border-l" : ""}`;
    if (d < 1 || d > days) return `<td class="${line} bg-erp-thead-bg"></td>`;
    const off = OFFICIAL[d];
    const num =
      d === TODAY
        ? `<span aria-label="고른 날짜 · 오늘" class="inline-grid h-[24px] min-w-[24px] place-items-center rounded-[2px] border border-erp-brand px-[4px] text-[14px] font-semibold text-erp-brand">${d}</span>`
        : `<span class="text-[14px] ${off ? "font-semibold text-erp-off" : "text-erp-ink"}">${d}</span>`;
    const name = off ? `<p class="mt-[6px] text-[13px] font-medium text-erp-off">${off}</p>` : "";
    const badge = COUNT[d] ? `<p class="mt-[6px]">${ui.badge("on", `${COUNT[d]}건`)}</p>` : "";
    return `<td class="${line} ${off ? "bg-erp-off-bg" : ""}">${num}${name}${badge}</td>`;
  };
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => `<tr>${cells.slice(r * 7, r * 7 + 7).map(td).join("")}</tr>`).join("");
  const head = ["일", "월", "화", "수", "목", "금", "토"].map((w) => `<th scope="col" class="px-[10px] text-left font-medium text-erp-thead-text">${w}</th>`).join("");
  return `<table aria-label="2026년 9월 캘린더" class="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]"><thead><tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

const legend = (cls, text) => `<span class="flex items-center gap-[6px] text-[14px] text-erp-ink"><i class="inline-block size-[10px] rounded-[2px] ${cls}"></i>${text}</span>`;
const iconBtn = (A, icon, label) => `<button type="button" aria-label="${label}" class="grid size-[34px] place-items-center rounded-[2px] border border-erp-button-line bg-white">${ui.img(A, icon, 16, 16)}</button>`;
const sel = (opts, value, label, w) => `<div class="${w} shrink-0">${ui.select(opts, { value, "aria-label": label })}</div>`;
// 글자 링크 모양의 확인창 열기 버튼
const dialogLink = (text, id) => `<button type="button" data-dialog="${id}" class="text-erp-link hover:underline">${text}</button>`;
// 항목 줄(그날의 휴일·변경 이력 한 건). 꼬리표 + 두 줄 글 + 오른쪽 끝.
const itemRow = (lead, title, subText, end = "") =>
  `<div class="flex min-h-[46px] items-center gap-[10px] border-b border-erp-thead-line py-[8px]">${lead}<span class="flex min-w-0 flex-1 flex-col"><span class="truncate font-medium">${title}</span><span class="truncate text-[13px] text-erp-label">${subText}</span></span>${end}</div>`;
// 넓은 확인창(폼·상세가 들어가 길어지면 안에서 스크롤)
const big = (html, w) => c.wide(html, `${w} max-h-[calc(100dvh-48px)] overflow-y-auto`);

// 변경 이력: [기록일, 요일, 구분, 휴일(링크면 true), 내용, 처리]
const HISTORY = [
  ["2026-09-18", "금", "삭제", "임시 휴무 - 모리커피 성수점", false, "휴일 날짜 2026-09-30 · 삭제되어 목록과 캘린더에 없음", "hgops · 17:05"],
  ["2026-09-17", "목", "수정", "창립기념일 - ㈜한강상회", false, "설명 · 2026-10-01 부터 이후 모두(첫 날짜라 휴일 전체)", "hangang01 · 15:30"],
  ["2026-09-16", "수", "수정", "정기휴무 - 온기식당 판교점", true, "설명 · 2026-09-21 부터 이후 모두(첫 날짜라 휴일 전체)", "hangang01 · 10:05"],
  ["2026-09-15", "화", "등록", "정기휴무 - 온기식당 판교점", true, "매주 반복 · 시작 2026-09-21 · 종료일 없음", "hangang01 · 14:10"],
  ["2026-09-14", "월", "수정", "오후 휴무(단축 운영) - 온기식당 광화문점", false, "설명", "hghr · 09:15"],
  ["2026-09-11", "금", "수정", "오후 휴무(단축 운영) - 온기식당 광화문점", false, "휴일명 · 오후 휴무 → 오후 휴무(단축 운영)", "hghr · 18:02"],
  ["2026-09-10", "목", "등록", "오후 휴무(단축 운영) - 온기식당 광화문점", false, "휴일 날짜 2026-10-01", "hghr · 13:20"],
  ["2026-09-08", "화", "등록", "내부 공사 - 모리커피 연남점", false, "휴일 날짜 2026-09-29", "morinam01 · 16:20"],
  ["2026-09-05", "토", "등록", "임시 휴무 - 모리커피 성수점", null, "휴일 날짜 2026-09-30", "hgops · 11:30"],
  ["2026-09-02", "수", "등록", "추석 당일 휴무 - ㈜한강상회", false, "휴일 날짜 2026-09-25", "hangang01 · 11:00"],
  ["2026-09-01", "화", "등록", "정전 점검 휴무 - 모리커피 서초점", false, "휴일 날짜 2026-09-10", "hgops · 09:40"],
];

export default ({ A, R }) => {
  const ids = { detail: x.dialogId(), edit: x.dialogId(), scope: x.dialogId(), new: x.dialogId(), del: x.dialogId(), hist: x.dialogId() };

  const filter = ui.filterPanel(A, [
    ui.filterSection("휴일명", ui.searchField(A, { placeholder: "일부만 입력해도 찾습니다", label: "휴일명" }) + c.help("㈜한강상회 · 접근할 수 있는 점포의 휴일만 · 캘린더 배지와 목록에 함께 걸립니다"), {
      tight: true,
      last: true,
    }),
  ]);

  const controls = `<div class="flex items-center gap-[6px]">${ui.button("오늘", { variant: "off" })}${iconBtn(A, "prev.svg", "이전달")}${iconBtn(A, "next.svg", "다음달")}${sel(
    ["2000년", "…", "2025년", "2026년", "2027년", "…", "2100년"],
    "2026년",
    "연도",
    "w-[96px]",
  )}${sel(["8월", "9월", "10월"], "9월", "월", "w-[80px]")}<span class="flex-1"></span>${x.dialogTrigger("변경 이력 보기", ids.hist, "soft")}${x.dialogTrigger("휴일 등록", ids.new)}</div>`;

  const day =
    ui.sectionHead(`9월 21일 (월)${c.sub("1건")}`, '<span class="text-[14px] text-erp-label">휴일명 - 적용 대상</span>') +
    `<button type="button" data-dialog="${ids.detail}" class="block w-full text-left hover:bg-erp-thead-bg">${itemRow(c.tag("특정 점포"), "정기휴무 - 온기식당 판교점", "매주 반복 · HD-0114", ui.img(A, "next.svg", 16, 16))}</button>`;
  const calendar = `<div class="flex items-start gap-[24px]"><div class="flex min-w-0 flex-1 flex-col gap-[12px]">${ui.sectionHead(
    "2026년 9월",
    `<span class="flex gap-[18px]">${legend("bg-erp-off", "공식 휴일 · 플랫폼 공식 휴일")}${legend("bg-erp-on", "BP 휴일 건수 배지")}${legend("border border-erp-brand", "선택한 날짜 · 오늘 2026-09-21")}</span>`,
  )}${monthGrid()}</div><div class="flex w-[340px] shrink-0 flex-col gap-[12px]">${day}</div></div>`;

  const ON0114 = (t) => dialogLink(t, ids.detail);
  const listRows = [
    [`2026-09-10 ${c.muted("(목)")} ${c.tag("지난 날짜")}`, ui.link("정전 점검 휴무", "#"), `${c.tag("특정 점포")} 모리커피 서초점 ${c.muted("ST000001")}`, "하루", `hgops ${c.muted("2026-09-01 09:40")}`],
    [`2026-09-21 ${c.muted("(월)")}`, ON0114("정기휴무"), `${c.tag("특정 점포")} 온기식당 판교점 ${c.muted("ST000003")}`, `매주 · 월요일 ${c.muted("· 종료일 없음")}`, `hangang01 ${c.muted("2026-09-16 10:05")}`],
    [`2026-09-25 ${c.muted("(금)")}`, ui.link("추석 당일 휴무", "#"), `${c.tag("전체 점포")} ${c.muted("예외 없음")}`, "하루", `hangang01 ${c.muted("2026-09-02 11:00")}`],
    [`2026-09-28 ${c.muted("(월)")}`, ON0114("정기휴무"), `${c.tag("특정 점포")} 온기식당 판교점 ${c.muted("ST000003")}`, `매주 · 월요일 ${c.muted("· 종료일 없음")}`, `hangang01 ${c.muted("2026-09-16 10:05")}`],
    [`2026-09-29 ${c.muted("(화)")}`, ui.link("내부 공사", "#"), `${c.tag("특정 점포")} 모리커피 연남점 ${c.muted("ST000006")}`, "하루", `morinam01 ${c.muted("2026-09-08 16:20")}`],
  ];
  const list =
    ui.sectionHead(`2026년 9월 BP 휴일${c.sub(`${listRows.length}건`)}`, '<span class="text-[14px] text-erp-label">날짜순 · 같은 날은 등록 순서 · 줄을 누르면 상세</span>') +
    c.dimRows(
      ui.dataTable(
        [
          { header: "날짜", width: "w-[220px]", align: "left" },
          { header: "휴일명", width: "w-[180px]", align: "left" },
          { header: "적용 대상", align: "left" },
          { header: "휴일 유형", width: "w-[220px]", align: "left" },
          { header: "최종 수정", width: "w-[230px]" },
        ],
        listRows,
        "이 달에 등록된 BP 휴일이 없습니다.",
      ),
      [0],
    ) +
    `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`;

  const content =
    controls +
    x.tabs(
      [
        { id: "calendar", label: "캘린더", html: calendar },
        { id: "list", label: "목록", html: list },
      ],
      "calendar",
    );

  // 확인창들
  const histTone = { 삭제: (t) => ui.badge("off", t), 수정: c.tag, 등록: (t) => ui.badge("on", t) };
  const histDialog = big(
    x.dialog(
      ids.hist,
      "변경 이력 보기",
      `<div class="flex flex-col gap-[12px]"><div class="flex items-center gap-[6px]"><div class="w-[150px]">${ui.dateField(A, { label: "이력 시작일", value: "2026-09-01" })}</div><span class="text-erp-label">~</span><div class="w-[150px]">${ui.dateField(A, {
        label: "이력 종료일",
        value: "2026-09-21",
      })}</div>${ui.button("조회", { variant: "soft" })}</div><p class="text-[13px] text-erp-label">휴일 날짜가 아니라 등록·수정·삭제한 날 기준입니다. 내 접근 범위 밖 점포의 이력은 나오지 않습니다.</p><div class="max-h-[440px] overflow-y-auto">${HISTORY.map(
        ([d, w, kind, name, isLink, text, by]) =>
          `<p class="pt-[12px] text-[13px] font-medium text-erp-label">${d} (${w})</p>${itemRow(histTone[kind](kind), isLink ? dialogLink(name, ids.detail) : isLink === false ? ui.link(name, "#") : name, text, `<span class="shrink-0 text-[13px] text-erp-label">${by}</span>`)}`,
      ).join("")}</div></div>`,
      ui.button("닫기", { "data-close": true }),
    ),
    "w-[720px]",
  );

  const { body: detailBody, delDialog } = detailParts(R, ids.del);
  const detailDialog = big(
    x.dialog(
      ids.detail,
      TITLE + TAGS,
      `<div class="flex flex-col gap-[24px]">${detailBody}</div>`,
      ui.button("닫기", { variant: "off", "data-close": true }) +
        ui.button("삭제", { variant: "soft", "data-dialog": ids.del }) +
        ui.button("수정", { "data-dialog": ids.edit, "data-close": true }),
    ),
    "w-[1100px]",
  );
  const editDialog = big(
    x.dialog(
      ids.edit,
      `BP 휴일 수정${c.sub("정기휴무 · HD-0114")}`,
      `<div class="flex flex-col gap-[18px]">${editForm(A)}</div>`,
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("저장", { "data-dialog": ids.scope }),
    ),
    "w-[880px]",
  );
  const newDialog = big(
    x.dialog(
      ids.new,
      "BP 휴일 등록",
      `<div class="flex flex-col gap-[18px]">${newForm(A)}</div>`,
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("등록", { "data-close": true }),
    ),
    "w-[880px]",
  );

  return {
    title: "BP 휴일 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 휴일 관리",
      body:
        ui.listBody(filter, content) +
        histDialog +
        detailDialog +
        delDialog +
        editDialog +
        scopeDialog(ids.scope, { href: link(R, "config/holidays.html") }) +
        newDialog,
    }),
  };
};
