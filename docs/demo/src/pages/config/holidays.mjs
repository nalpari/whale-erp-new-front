// BP 휴일 관리. 목업 docs/mockup/config/holidays.html 의 기본 상태(9월 캘린더 · 오늘 21일 선택)를 BP 마스터로 본 것.
// 휴일명 검색 필터는 두지 않는다(2026-10-07). 캘린더·목록 보기 전환은 탭으로 옮겼다(system 휴일 관리와 같다).
// 휴일 등록·상세·수정은 화면을 옮기지 않고 오른쪽 슬라이드 패널로 연다(BP 관리자 관리와 같다 · 2026-10-07). 내용은 holidays-new·detail·edit 화면 파일과 같은 함수로 그린다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { TITLE, TAGS, detailParts } from "./holidays-detail.mjs";
import { newForm, HOLIDAY_SCRIPT } from "./holidays-new.mjs";
import { editForm } from "./holidays-edit.mjs";

const TODAY = 21;
const OFFICIAL = { 24: "추석", 25: "추석", 26: "추석", 28: "대체공휴일" };
// 날짜별 BP 휴일 이름(목록 보기 표본과 같다). 16일은 여러 건·긴 이름 표본(칸이 늘어나고 긴 이름은 말줄임)
const NAMES = { 10: ["정전 점검 휴무"], 16: ["재고 실사 휴무", "매장 청소 휴무", "직원 교육", "정기 소독", "본사 전 직원 워크숍 및 매장 리뉴얼 공사로 인한 전 점포 임시 휴무", "설비 점검 휴무"], 21: ["정기휴무"], 25: ["추석 당일 휴무"], 28: ["정기휴무"], 29: ["내부 공사"] };
// 공식 휴일 숨기기 — 스위치를 켜면 달력을 감싼 칸에 hide-official 을 달고, 공식 휴일 이름·빨간 날짜·바탕을 지운다(2026-10-07)
const HIDE_SCRIPT = `<script>document.addEventListener("change",(e)=>{const t=e.target.closest("[data-hide-official]");if(t)t.closest("[data-cal]").classList.toggle("hide-official",t.checked)});</script>`;

// 월 달력(2026년 9월). 1팀 컴포넌트에 없어 표 선·표 머리 바탕으로 그린다(system 휴일 캘린더와 같은 모양).
// 공식 휴일은 상태 빨강, BP 휴일은 이름(넘치면 말줄임, 여러 건이면 칸이 아래로 늘어난다), 고른 날짜(오늘)는 브랜드 테두리.
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
        : `<span class="text-[14px] ${off ? `font-semibold text-erp-off in-[.hide-official]:font-normal in-[.hide-official]:text-erp-ink` : "text-erp-ink"}">${d}</span>`;
    const name = off ? `<p class="mt-[6px] text-[13px] font-medium text-erp-off in-[.hide-official]:hidden">${off}</p>` : "";
    const hols = (NAMES[d] || []).map((n) => `<p title="${n}" class="mt-[6px] truncate rounded-[2px] bg-erp-on-bg px-[4px] py-[2px] text-[13px] font-medium text-erp-on">${n}</p>`).join("");
    return `<td class="${line} ${off ? `bg-erp-off-bg in-[.hide-official]:bg-white` : ""}">${num}${name}${hols}</td>`;
  };
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => `<tr>${cells.slice(r * 7, r * 7 + 7).map(td).join("")}</tr>`).join("");
  const head = ["일", "월", "화", "수", "목", "금", "토"].map((w) => `<th scope="col" class="px-[10px] text-left font-medium text-erp-thead-text">${w}</th>`).join("");
  return `<table aria-label="2026년 9월 캘린더" class="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]"><thead><tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

const legend = (cls, text) => `<span class="flex items-center gap-[6px] text-[14px] text-erp-ink"><i class="inline-block size-[10px] rounded-[2px] ${cls}"></i>${text}</span>`;
const iconBtn = (A, icon, label) => `<button type="button" aria-label="${label}" class="grid size-[34px] place-items-center rounded-[2px] border border-erp-button-line bg-white">${ui.img(A, icon, 16, 16)}</button>`;
const sel = (opts, value, label, w) => `<div class="${w} shrink-0">${ui.select(opts, { value, "aria-label": label })}</div>`;
// 글자 링크 모양의 패널 열기 버튼. close 면 버튼이 든 확인창을 닫는다(변경 이력 확인창에서 상세로 갈 때).
const PANEL = { detail: "hol-detail-panel", edit: "hol-edit-panel", new: "hol-new-panel" };
const panelLink = (text, id, close) => `<button type="button" aria-controls="${id}" aria-expanded="false"${close ? " data-close" : ""} class="text-erp-link hover:underline">${text}</button>`;
// 항목 줄(그날의 휴일·변경 이력 한 건). 꼬리표 + 두 줄 글 + 오른쪽 끝.
const itemRow = (lead, title, subText, end = "") =>
  `<div class="flex min-h-[46px] items-center gap-[10px] border-b border-erp-thead-line py-[8px]">${lead}<span class="flex min-w-0 flex-1 flex-col"><span class="truncate font-medium">${title}</span><span class="truncate text-[13px] text-erp-label">${subText}</span></span>${end}</div>`;
// 넓은 확인창(폼·상세가 들어가 길어지면 안에서 스크롤)
const big = (html, w) => c.wide(html, `${w} max-h-[calc(100dvh-48px)] overflow-y-auto`);

// 변경 이력: [기록일, 요일, 구분, 휴일(링크면 true), 내용, "시각 | 수정자"] — 줄 오른쪽에 최종수정일시 | 수정자 아이디로 나온다
const HISTORY = [
  ["2026-09-18", "금", "삭제", "임시 휴무 - 모리커피 성수점", false, "휴일 날짜 2026-09-30 · 삭제되어 목록과 캘린더에 없음", "17:05 | hgops"],
  ["2026-09-17", "목", "수정", "창립기념일 - ㈜한강상회", false, "설명 · 2026-10-01 부터 이후 모두(첫 날짜라 휴일 전체)", "15:30 | hangang01"],
  ["2026-09-16", "수", "수정", "정기휴무 - 온기식당 판교점", true, "설명 · 2026-09-21 부터 이후 모두(첫 날짜라 휴일 전체)", "10:05 | hangang01"],
  ["2026-09-15", "화", "등록", "정기휴무 - 온기식당 판교점", true, "매주 반복 · 시작 2026-09-21 · 종료일 없음", "14:10 | hangang01"],
  ["2026-09-14", "월", "수정", "오후 휴무(단축 운영) - 온기식당 광화문점", false, "설명", "09:15 | hghr"],
  ["2026-09-11", "금", "수정", "오후 휴무(단축 운영) - 온기식당 광화문점", false, "휴일명 · 오후 휴무 → 오후 휴무(단축 운영)", "18:02 | hghr"],
  ["2026-09-10", "목", "등록", "오후 휴무(단축 운영) - 온기식당 광화문점", false, "휴일 날짜 2026-10-01", "13:20 | hghr"],
  ["2026-09-08", "화", "등록", "내부 공사 - 모리커피 연남점", false, "휴일 날짜 2026-09-29", "16:20 | morinam01"],
  ["2026-09-05", "토", "등록", "임시 휴무 - 모리커피 성수점", null, "휴일 날짜 2026-09-30", "11:30 | hgops"],
  ["2026-09-02", "수", "등록", "추석 당일 휴무 - ㈜한강상회", false, "휴일 날짜 2026-09-25", "11:00 | hangang01"],
  ["2026-09-01", "화", "등록", "정전 점검 휴무 - 모리커피 서초점", false, "휴일 날짜 2026-09-10", "09:40 | hgops"],
];

export default ({ A, R }) => {
  const ids = { del: x.dialogId(), hist: x.dialogId() };

  const controls = `<div class="flex items-center gap-[6px]">${ui.button("오늘", { variant: "off" })}${iconBtn(A, "prev.svg", "이전달")}${iconBtn(A, "next.svg", "다음달")}${sel(
    ["2000년", "…", "2025년", "2026년", "2027년", "…", "2100년"],
    "2026년",
    "연도",
    "w-[96px]",
  )}${sel(["8월", "9월", "10월"], "9월", "월", "w-[80px]")}<span class="flex-1"></span>${x.dialogTrigger("변경 이력 보기", ids.hist, "soft")}${ui.slideTrigger("등록", PANEL.new)}</div>`;

  const day =
    ui.sectionHead(`9월 21일 (월)${c.sub("1건")}`) +
    `<button type="button" aria-controls="${PANEL.detail}" aria-expanded="false" class="block w-full text-left hover:bg-erp-thead-bg">${itemRow(c.tag("일부 점포"), "정기휴무 - 온기식당 판교점", "매주 반복 · HD-0114", ui.img(A, "next.svg", 16, 16))}</button>`;
  // 달력 아래가 카드 선에 붙지 않게 아래 여백을 둔다(2026-10-08)
  const calendar = `<div class="flex items-start gap-[24px] pb-[24px]"><div data-cal class="flex min-w-0 flex-1 flex-col gap-[12px]">${ui.sectionHead(
    "2026년 9월",
    `<span class="flex items-center gap-[18px]">${legend("bg-erp-off", "공식 휴일 · 플랫폼 공식 휴일")}${legend("bg-erp-on", "BP 휴일")}${legend("border border-erp-brand", "선택한 날짜 · 오늘 2026-09-21")}${ui.checkbox(A, "공식 휴일 숨기기", false, { "data-hide-official": true })}</span>`,
  )}${monthGrid()}</div><div class="flex w-[340px] shrink-0 flex-col gap-[12px]">${day}</div></div>`;

  const ON0114 = (t) => panelLink(t, PANEL.detail);
  // 적용 대상: 일부 점포는 ‘첫 점포 외 N건’, 전체 점포는 예외가 있으면 ‘첫 점포 외 N건 예외’(2026-10-08)
  const some = (names) => `${c.tag("일부 점포")} ${names[0]}${names.length > 1 ? ` 외 ${names.length - 1}건` : ""}`;
  const all = (except) =>
    `${c.tag("전체 점포")} ${except.length ? `${except[0]}${except.length > 1 ? ` 외 ${except.length - 1}건` : ""} 예외` : c.muted("예외 없음")}`;
  // 최종수정일시: 수정일시 | 수정자
  const mod = (at, by) => `${at} ${c.muted(`| ${by}`)}`;
  const HD0114 = ["온기식당 판교점", "모리커피 서초점", "모리커피 성수점", "온기식당 광화문점", "모리커피 을지로점", "모리커피 연남점"];
  const listRows = [
    [`2026-09-10 ${c.muted("(목)")}`, ui.link("정전 점검 휴무", "#"), some(["모리커피 서초점"]), "하루", mod("2026-09-01 09:40", "hgops")],
    [`2026-09-21 ${c.muted("(월)")}`, ON0114("정기휴무"), some(HD0114), `매주 · 월요일 ${c.muted("· 종료일 없음")}`, mod("2026-09-16 10:05", "hangang01")],
    [`2026-09-25 ${c.muted("(금)")}`, ui.link("추석 당일 휴무", "#"), all(["모리커피 청담점", "온기식당 일산점"]), "하루", mod("2026-09-02 11:00", "hangang01")],
    [`2026-09-28 ${c.muted("(월)")}`, ON0114("정기휴무"), some(HD0114), `매주 · 월요일 ${c.muted("· 종료일 없음")}`, mod("2026-09-16 10:05", "hangang01")],
    [`2026-09-29 ${c.muted("(화)")}`, ui.link("내부 공사", "#"), some(["모리커피 연남점"]), "하루", mod("2026-09-08 16:20", "morinam01")],
  ];
  const list =
    ui.sectionHead(`2026년 9월 BP 휴일${c.sub(`${listRows.length}건`)}`) +
    c.dimRows(
      ui.dataTable(
        [
          { header: "날짜", width: "w-[220px]", align: "left" },
          { header: "휴일명", width: "w-[180px]", align: "left" },
          { header: "적용 대상", align: "left" },
          { header: "휴일 유형", width: "w-[220px]", align: "left" },
          { header: "최종수정일시", width: "w-[230px]" },
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
      })}</div>${ui.button("조회", { variant: "soft" })}</div><div class="max-h-[440px] overflow-y-auto">${HISTORY.map(
        ([d, w, kind, name, isLink, text, by]) =>
          `<p class="pt-[12px] text-[13px] font-medium text-erp-label">${d} (${w})</p>${itemRow(histTone[kind](kind), isLink ? panelLink(name, PANEL.detail, true) : isLink === false ? ui.link(name, "#") : name, text, `<span class="shrink-0 pr-[12px] text-[13px] text-erp-label">${d} ${by}</span>`)}`,
      ).join("")}</div></div>`,
      ui.button("닫기", { "data-close": true }),
    ),
    "w-[720px]",
  );

  // 슬라이드 패널: 상세(삭제는 확인창 · 수정은 수정 패널) · 수정(저장은 범위 확인창) · 등록
  const { body: detailBody, delDialog, histDialog: detailHist, histId } = detailParts(A, R, ids.del, { panel: true });
  // 이름(꼬리표)은 맨 위에 혼자, 기능 버튼은 닫기까지 모두 맨 아래로(BP 관리자 상세 패널과 같다 · 2026-10-08)
  const detailPanel = ui.slidePanel(
    PANEL.detail,
    "BP 휴일 상세",
    ui.sectionHead(TITLE + TAGS) +
      detailBody +
      `<div class="flex flex-wrap justify-center gap-[6px] border-t border-erp-panel-line pt-[16px]">${x.dialogTrigger("삭제", ids.del, "soft")}${ui.slideTrigger("수정", PANEL.edit)}${x.dialogTrigger("변경 이력", histId, "soft")}${ui.button("닫기", { variant: "off", "data-close": true })}</div>`,
  );
  const editPanel = ui.slidePanel(
    PANEL.edit,
    "BP 휴일 수정",
    ui.sectionHead("BP 휴일 수정") +
      `<div class="flex flex-col gap-[18px]">${editForm(A, { panel: true })}</div>` +
      c.buttons(ui.button("닫기", { variant: "off", "data-close": true }), ui.button("저장", { "data-save-panel": PANEL.detail })),
  );
  const newPanel = ui.slidePanel(
    PANEL.new,
    "BP 휴일 등록",
    ui.sectionHead("BP 휴일 등록") + `<div class="flex flex-col gap-[18px]">${newForm(A, { panel: true })}</div>` + c.buttons(ui.button("닫기", { variant: "off", "data-close": true }), ui.button("저장", { "data-save-panel": PANEL.detail })),
  );

  return {
    title: "BP 휴일 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 휴일 관리",
      body: ui.listBody("", content) + histDialog + delDialog + detailHist + HIDE_SCRIPT + HOLIDAY_SCRIPT,
      panels: newPanel + detailPanel + editPanel,
    }),
  };
};
