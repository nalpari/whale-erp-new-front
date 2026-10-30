// BP 휴일 관리. 목업 docs/mockup/config/holidays.html 의 기본 상태(9월 캘린더 · 오늘 21일 선택)를 BP 마스터로 본 것.
// 휴일명 검색 필터는 두지 않는다(2026-10-07). 캘린더·목록 보기 전환은 탭으로 옮겼다(system 휴일 관리와 같다).
// 휴일 등록·상세·수정은 화면을 옮기지 않고 오른쪽 슬라이드 패널로 연다(BP 관리자 관리와 같다 · 2026-10-07). 내용은 holidays-new·detail·edit 화면 파일과 같은 함수로 그린다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { HEAD, detailParts } from "./holidays-detail.mjs";
import { newForm, HOLIDAY_SCRIPT } from "./holidays-new.mjs";
import { editForm } from "./holidays-edit.mjs";

const TODAY = 21;
const OFFICIAL = { 24: "추석", 25: "추석", 26: "추석", 28: "대체공휴일" };
// 날짜별 BP 휴일 이름(목록 보기 표본과 같다). 16일은 여러 건·긴 이름 표본(칸이 늘어나고 긴 이름은 말줄임)
const NAMES = { 10: ["정전 점검 휴무"], 16: ["재고 실사 휴무", "매장 청소 휴무", "직원 교육", "정기 소독", "본사 전 직원 워크숍 및 매장 리뉴얼 공사로 인한 전 점포 임시 휴무", "설비 점검 휴무"], 21: ["정기휴무"], 25: ["추석 당일 휴무"], 28: ["정기휴무"], 29: ["내부 공사"] };
// 공식 휴일 숨기기 — 스위치를 켜면 달력을 감싼 칸에 hide-official 을 달고, 공식 휴일 이름·빨간 날짜·바탕을 지운다(2026-10-07)
// 달력 날짜 칸을 누르면 그 칸을 고른 칸으로 표시하고 오른쪽에 그날 휴일을 보인다(2026-10-08)
const DAY_SCRIPT = `<script>document.addEventListener("click",(e)=>{const td=e.target.closest("td[data-day]");if(!td)return;const cal=td.closest("table");cal.querySelectorAll("td[data-sel]").forEach((x)=>x.removeAttribute("data-sel"));td.setAttribute("data-sel","");document.querySelectorAll("[data-day-view]").forEach((v)=>(v.hidden=v.dataset.dayView!==td.dataset.day));});</script>`;
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
    return `<td data-day="${d}"${d === TODAY ? " data-sel" : ""} class="${line} cursor-pointer hover:bg-erp-thead-bg data-[sel]:shadow-[inset_0_0_0_2px_var(--color-erp-brand)] ${off ? `bg-erp-off-bg in-[.hide-official]:bg-white` : ""}">${num}${name}${hols}</td>`;
  };
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => `<tr>${cells.slice(r * 7, r * 7 + 7).map(td).join("")}</tr>`).join("");
  const head = ["일", "월", "화", "수", "목", "금", "토"].map((w) => `<th scope="col" class="px-[10px] text-left font-medium text-erp-thead-text">${w}</th>`).join("");
  return `<table aria-label="2026년 9월 캘린더" class="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]"><thead><tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

const legend = (cls, text) => `<span class="flex items-center gap-[6px] text-[14px] text-erp-ink"><i class="inline-block size-[10px] rounded-[2px] ${cls}"></i>${text}</span>`;
// 달 이동 줄 [2026년 9월 ▾] ‹ › [오늘 · 날짜] — 앱 holidays-screen.tsx monthNav · MonthPicker 와 같은 모양. 연 · 월 고르기 판은 그리지 않는다(데모라 버튼 모양만).
// 화살표는 먹색 선 아이콘, [오늘]도 화살표와 같은 흰 상자(2026-10-30 사용자 지정). 캘린더 제목 자리와 목록 위에 같이 쓴다.
const ICON_BOX = "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";
const arrow = (d) => `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="size-[16px] text-erp-ink"><path d="${d}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const monthNav = () =>
  `<div role="group" aria-label="달 이동" class="flex items-center gap-[6px]"><button type="button" aria-expanded="false" aria-label="2026년 9월 — 연 · 월 고르기" class="flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-button-line bg-white pr-[8px] pl-[12px] text-[16px] font-semibold text-erp-ink transition-[border-color] duration-150 hover:border-erp-brand">2026년 9월<span class="ml-[2px] grid size-[20px] place-items-center rounded-full bg-erp-brand-soft"><svg viewBox="0 0 10 6" fill="none" aria-hidden="true" class="h-[6px] w-[10px]"><path d="M1 1L5 5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></button><button type="button" aria-label="이전달" class="${ICON_BOX}">${arrow("M11 14L5 8L11 2")}</button><button type="button" aria-label="다음달" class="${ICON_BOX}">${arrow("M5 14L11 8L5 2")}</button><button type="button" class="flex h-[34px] shrink-0 items-center rounded-[2px] border border-erp-button-line bg-white px-[14px] text-[14px] font-medium whitespace-nowrap text-erp-ink transition-[border-color] duration-150 ease-out hover:border-erp-brand">오늘<span class="ml-[6px] text-[12px] font-normal text-erp-label">· 2026-09-21(월)</span></button></div>`;
// 글자 링크 모양의 패널 열기 버튼. close 면 버튼이 든 확인창을 닫는다(변경 이력 확인창에서 상세로 갈 때).
const PANEL = { detail: "hol-detail-panel", edit: "hol-edit-panel", new: "hol-new-panel" };
const panelLink = (text, id, close) => `<button type="button" aria-controls="${id}" aria-expanded="false"${close ? " data-close" : ""} class="text-erp-link hover:underline">${text}</button>`;
// 항목 줄(그날의 휴일·변경 이력 한 건). 꼬리표 + 두 줄 글 + 오른쪽 끝.
const itemRow = (lead, title, subText, end = "") =>
  `<div class="flex min-h-[46px] items-center gap-[10px] border-b border-erp-thead-line py-[8px]">${lead}<span class="flex min-w-0 flex-1 flex-col"><span class="truncate font-medium">${title}</span><span class="truncate text-[13px] text-erp-label">${subText}</span></span>${end}</div>`;
// 넓은 확인창(폼·상세가 들어가 길어지면 안에서 스크롤)
const big = (html, w) => c.wide(html, `${w} max-h-[calc(100dvh-48px)] overflow-y-auto`);

// 전체 변경이력: [변경일시, 변경자, 휴일명, 항목, 변경 전, 변경 후] — 앱 history-dialog.tsx WITH_HOLIDAY 열. 값은 api bp-holiday-changes 의 문구(등록 · 휴일명 · 설명 · 날짜 · 강제 종료 · 삭제)
const HISTORY = [
  ["2026-09-18 17:05", "hgops", "임시 휴무", "삭제", "임시 휴무", ""],
  ["2026-09-17 15:30", "hangang01", "창립기념일", "설명", "", "창립을 기념해 전 점포 휴무"],
  ["2026-09-16 10:05", "hangang01", "정기휴무", "설명", "정기 휴무", "월요일마다 쉬는 정기 휴무"],
  ["2026-09-15 14:10", "hangang01", "정기휴무", "등록", "", "정기휴무 · 온기식당 판교점 · 모리커피 서초점 · 모리커피 성수점 · 온기식당 광화문점 · 모리커피 을지로점 · 모리커피 연남점 · 매주 · 시작 2026-09-21 · 종료일 없음"],
  ["2026-09-14 09:15", "hghr", "오후 휴무(단축 운영)", "강제 종료", "매주 · 시작 2026-08-03 · 종료일 없음", "매주 · 시작 2026-08-03 · 2026-09-13까지"],
  ["2026-09-11 18:02", "hghr", "오후 휴무(단축 운영)", "휴일명", "오후 휴무", "오후 휴무(단축 운영)"],
  ["2026-09-08 16:20", "morinam01", "내부 공사", "등록", "", "내부 공사 · 모리커피 연남점 · 하루 · 2026-09-29"],
  ["2026-09-05 11:30", "hgops", "임시 휴무", "등록", "", "임시 휴무 · 모리커피 성수점 · 하루 · 2026-09-30"],
  ["2026-09-02 11:00", "hangang01", "추석 당일 휴무", "등록", "", "추석 당일 휴무 · 전체 점포 · 예외 2개점 · 하루 · 2026-09-25"],
  ["2026-09-01 09:40", "hgops", "정전 점검 휴무", "등록", "", "정전 점검 휴무 · 모리커피 서초점 · 하루 · 2026-09-10"],
];

export default ({ A, R }) => {
  const ids = { del: x.dialogId(), hist: x.dialogId() };

  // [등록]은 페이지 제목 줄 오른쪽(앱 PageBar), [변경이력]은 탭 줄 오른쪽(앱 holidays-screen.tsx, 2026-10-30 사용자 지정 — 전엔 탭 위 도구 줄에 오늘 · 화살표 · 연/월 선택칸과 함께)
  const histTrigger = x.dialogTrigger("변경이력", ids.hist, "soft");

  // 오른쪽 그날 칸 — 달력 날짜 칸을 누르면 그 날짜의 판으로 바뀐다(DAY_SCRIPT · 2026-10-08).
  const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  // 날짜별 휴일 줄 정보 [적용 범위, 휴일유형, 적용 대상]. 없는 이름은 일부 점포 · 하루로 본다(16일 여러 건 표본)
  // 적용 대상은 앱 targetText — 일부 점포는 「첫 점포 외 N개」, 전체 점포는 「BP 상호 · 예외 N개」
  const INFO = {
    "정전 점검 휴무": ["일부 점포", "하루", "모리커피 서초점"],
    정기휴무: ["일부 점포", "매주 반복", "온기식당 판교점 외 5개"],
    "추석 당일 휴무": ["전체 점포", "하루", "㈜한강상회 · 예외 2개"],
    "내부 공사": ["일부 점포", "하루", "모리커피 연남점"],
  };
  const dayView = (d) => {
    const names = NAMES[d] || [];
    // 줄 모양: 범위 꼬리표 · 휴일명, 아랫줄에는 「휴일유형 · 적용 대상」(앱 holiday-calendar.tsx)
    const list = names.length
      ? names
          .map((n) => {
            const [scope, type, target] = INFO[n] || ["일부 점포", "하루", "모리커피 성수점"];
            return `<button type="button" aria-controls="${PANEL.detail}" aria-expanded="false" class="block w-full text-left hover:bg-erp-thead-bg">${itemRow(c.tag(scope), n, `${type} · ${target}`, ui.img(A, "next.svg", 16, 16))}</button>`;
          })
          .join("")
      : `<p class="border-b border-erp-thead-line py-[24px] text-center text-[14px] text-erp-muted">등록된 휴일이 없습니다.</p>`;
    return `<div data-day-view="${d}" class="flex flex-col gap-[12px]"${d === TODAY ? "" : " hidden"}>${ui.sectionHead(`9월 ${d}일 (${WEEK[new Date(2026, 8, d).getDay()]})${c.sub(`${names.length}건`)}`)}<div class="flex flex-col">${list}</div></div>`;
  };
  const day = Array.from({ length: 30 }, (_, i) => dayView(i + 1)).join("");
  // 달력 아래가 카드 선에 붙지 않게 아래 여백을 둔다(2026-10-08)
  // 제목 자리에 달 이동 줄 + 「공식 휴일 숨기기」, 오른쪽 범례는 BP 휴일 · 공식 휴일 순(앱 holiday-calendar.tsx, 2026-10-30 사용자 지정 — 전엔 「2026년 9월」 제목 · 「선택한 날짜 · 오늘」 범례)
  const calendar = `<div class="flex items-start gap-[24px] pb-[24px]"><div data-cal class="flex min-w-0 flex-1 flex-col gap-[12px]"><div class="flex items-center gap-[6px]"><div class="flex flex-1 flex-wrap items-center gap-[18px]">${monthNav()}${ui.checkbox(A, "공식 휴일 숨기기", false, { "data-hide-official": true })}</div><span class="flex flex-wrap items-center gap-[18px]">${legend("bg-erp-on", "BP 휴일")}${legend("bg-erp-off", "공식 휴일")}</span></div>${monthGrid()}</div><div class="flex w-[340px] shrink-0 flex-col gap-[12px]">${day}</div></div>`;

  const ON0114 = (t) => panelLink(t, PANEL.detail);
  // 적용 대상: 일부 점포는 ‘첫 점포 외 N건’, 전체 점포는 예외가 있으면 ‘첫 점포 외 N건 예외’(2026-10-08)
  // 적용범위(꼬리표) · 대상점포 · 예외점포 세 칸(앱과 같다, 2026-10-30 사용자 지정 — 전엔 「적용 대상」 한 칸). 해당 없는 칸은 「-」, 단위는 「개」. 대상점포 수는 그날 적용되는 점포 전부다 — 맡은 범위와 관계없이 센다(2026-10-30 재영)
  const some = (names) => [c.tag("일부 점포"), `${names[0]}${names.length > 1 ? ` 외 ${names.length - 1}개` : ""}`, c.muted("-")];
  const all = (except) => [c.tag("전체 점포"), c.muted("-"), except.length ? `${except.length}개` : c.muted("-")];
  // 최종수정: 「일시 · 사람」 — 사람은 회색(앱 · 권한 그룹 목록과 같다, 2026-10-30 사용자 지정)
  const mod = (at, by) => `${at} <span class="text-erp-label">· ${by}</span>`;
  const HD0114 = ["온기식당 판교점", "모리커피 서초점", "모리커피 성수점", "온기식당 광화문점", "모리커피 을지로점", "모리커피 연남점"];
  const listRows = [
    [`2026-09-10 ${c.muted("(목)")}`, ui.link("정전 점검 휴무", "#"), "하루", ...some(["모리커피 서초점"]), mod("2026-09-01 09:40", "hgops")],
    [`2026-09-21 ${c.muted("(월)")}`, ON0114("정기휴무"), "매주 반복", ...some(HD0114), mod("2026-09-16 10:05", "hangang01")],
    [`2026-09-25 ${c.muted("(금)")}`, ui.link("추석 당일 휴무", "#"), "하루", ...all(["모리커피 청담점", "온기식당 일산점"]), mod("2026-09-02 11:00", "hangang01")],
    [`2026-09-28 ${c.muted("(월)")}`, ON0114("정기휴무"), "매주 반복", ...some(HD0114), mod("2026-09-16 10:05", "hangang01")],
    [`2026-09-29 ${c.muted("(화)")}`, ui.link("내부 공사", "#"), "하루", ...some(["모리커피 연남점"]), mod("2026-09-08 16:20", "morinam01")],
  ];
  const list =
    // 달 이동 줄 + 「BP 휴일 N건」, 쪽 이동 없음 — 한 달 치를 다 보인다(앱 holidays-screen.tsx)
    `<div class="flex items-center gap-[10px]">${monthNav()}<span class="text-[14px] text-erp-label">BP 휴일 ${listRows.length}건</span></div>` +
    c.dimRows(
      ui.dataTable(
        [
          // 날짜 · 휴일명 · 휴일유형 · 적용범위 · 대상점포 · 예외점포 · 최종수정(앱과 같다, 2026-10-30 사용자 지정)
          { header: "날짜", width: "w-[150px]" },
          { header: "휴일명", width: "w-[200px]", align: "left" },
          { header: "휴일유형", width: "w-[120px]" },
          { header: "적용범위", width: "w-[110px]" },
          { header: "대상점포", width: "w-[180px]", align: "left" },
          { header: "예외점포", width: "w-[180px]" },
          { header: "최종수정", align: "left" },
        ],
        listRows,
        "이 달에 등록된 BP 휴일이 없습니다.",
      ),
      [0],
    );

  const content = x
    .tabs(
      [
        { id: "calendar", label: "캘린더", html: calendar },
        { id: "list", label: "목록", html: list },
      ],
      "calendar",
    )
    .replace('<div role="tablist" class="flex shrink-0 border-b border-erp-bar-line">', '<div class="flex shrink-0 items-end gap-[6px] border-b border-erp-bar-line"><div role="tablist" class="flex flex-1">')
    .replace("</div>", `</div><span class="pb-[6px]">${histTrigger}</span></div>`);

  // 확인창들
  // 전체 변경이력 — 기간 · [조회] 아래 표 + 쪽 이동, 안내문 없음(앱 history-dialog.tsx HolidayHistoryButton · WideDialog 760px). 지운 휴일은 여기서만 보인다
  const cut = (t) => `<span class="block truncate" title="${t}">${t}</span>`;
  const histDialog = big(
    x.dialog(
      ids.hist,
      "변경이력",
      `<div class="flex flex-col gap-[12px]"><div class="flex items-center gap-[6px]"><div class="w-[150px]">${ui.dateField(A, { label: "이력 시작일", value: "2026-09-01" })}</div><span class="text-erp-label">~</span><div class="w-[150px]">${ui.dateField(A, {
        label: "이력 종료일",
        value: "2026-09-21",
      })}</div>${ui.button("조회", { variant: "soft" })}</div>${ui.dataTable(
        [
          { header: "변경일시", width: "w-[140px]" },
          { header: "변경자", width: "w-[80px]" },
          { header: "휴일명", width: "w-[120px]", align: "left" },
          { header: "항목", width: "w-[90px]", align: "left" },
          { header: "변경 전", align: "left" },
          { header: "변경 후", align: "left" },
        ],
        HISTORY.map(([at, by, name, field, before, after]) => [at, by, cut(name), field, cut(before), cut(after)]),
        "변경이력이 없습니다.",
      )}<div class="pt-[6px]">${ui.pagination(A, 1, 2)}</div></div>`,
      ui.button("닫기", { variant: "off", "data-close": true }),
    ),
    "w-[760px]",
  );

  // 슬라이드 패널: 상세(삭제는 확인창 · 수정은 수정 패널) · 수정(저장은 범위 확인창) · 등록
  const { body: detailBody, delDialog, endDialog, endId, histDialog: detailHist, histId } = detailParts(A, R, ids.del, { panel: true });
  // 이름(꼬리표)은 맨 위에 혼자, 기능 버튼은 닫기까지 모두 맨 아래로(BP 관리자 상세 패널과 같다 · 2026-10-08)
  const detailPanel = ui.slidePanel(
    PANEL.detail,
    "BP 휴일 상세",
    HEAD +
      detailBody +
      `<div class="flex flex-wrap items-center gap-[6px]">${ui.button("닫기", { variant: "off", "data-close": true })}<span class="flex-1"></span>${x.dialogTrigger("삭제", ids.del, "soft")}${x.dialogTrigger("강제 종료", endId, "soft")}${ui.slideTrigger("수정", PANEL.edit)}${x.dialogTrigger("변경이력", histId, "soft")}</div>`,
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
      titleRight: ui.slideTrigger("등록", PANEL.new),
      body: ui.listBody("", content) + histDialog + delDialog + endDialog + detailHist + HIDE_SCRIPT + DAY_SCRIPT + HOLIDAY_SCRIPT,
      panels: newPanel + detailPanel + editPanel,
    }),
  };
};
