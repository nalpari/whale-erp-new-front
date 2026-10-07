// BP 마스터 계정 목록. 목업 docs/mockup/bp/index.html 의 기본 상태(처음 진입 · 전체)를 플랫폼 관리자로 본 것.
// 목업 위쪽 검색 조건 묶음은 점포 목록처럼 왼쪽 필터로 옮겼다.
import * as ui from "../../ui.mjs";
import { platformHeader } from "../../site.mjs";
import { bpNewPanel } from "./new.mjs";
import { bpDetailPanel } from "./detail.mjs";
import { bpEditPanel } from "./edit.mjs";

// 표의 BP 코드·상호명은 상세를 슬라이드 패널로 연다 — 이 데모는 점포·사업자 데이터를 ㈜한강상회 하나만 갖고 있어 어느 줄을 눌러도 같은 상세가 뜬다.
const detailTrigger = (text) => `<button type="button" aria-controls="bp-detail-panel" aria-expanded="false" class="text-erp-link hover:underline">${text}</button>`;

// [BP 코드, 아이디, 이름, 연락처, 이메일, 상태, 상호명, 사업자등록번호, 가입경로, 등록자, 등록 일시]
const GONE = '<span class="text-erp-muted">탈퇴로 삭제됨</span>';
export const BPS = [
  ["BP000031", "bakerylab", "오세린", "010-2291-7730", "serin@breadlab.kr", "사용", "브레드랩 2호", "-", "플랫폼등록", "platjung", "2026-09-18 10:04"],
  ["BP000030", "breadlab", "오세린", "010-2291-7730", "ceo@breadlab.kr", "사용", "브레드랩", "214-88-10392", "플랫폼등록", "platjung", "2026-08-02 15:40"],
  ["BP000021", "badafood", "김도현", "010-4410-2215", "dohyun@badafood.co.kr", "사용", "㈜바다푸드", "617-81-40277", "회원가입", "badafood", "2026-03-11 09:20"],
  ["BP000017", "hangang01", "정하윤", "010-4821-7730", "hayoon@hangang.co.kr", "사용", "㈜한강상회", "211-87-01234", "회원가입", "hangang01", "2025-02-03 11:12"],
  ["BP000012", "sotbap", "이준호", "010-7732-0918", "junho@sotbap.kr", "미사용", "솥밥상회", "220-19-55813", "회원가입", "sotbap", "2024-11-05 14:08"],
  ["BP000010", "cafenoon", "한지우", "010-5518-4402", "jiwoo@cafenoon.kr", "사용", "카페눈", "113-25-60418", "플랫폼등록", "platkim", "2024-09-02 10:00"],
  ["BP000008", "gukbap24", null, null, null, "탈퇴", "국밥24", "312-07-88104", "회원가입", "gukbap24", "2024-06-14 08:47"],
  ["BP000003", "morihq", "박서윤", "010-5521-3380", "seoyun@moricoffee.kr", "사용", "모리커피 본사", "101-81-22302", "회원가입", "morihq", "2024-02-19 13:30"],
];

export default ({ A, R }) => {
  const filter = ui.filterPanel(A, [
    ui.filterSection(
      "검색어",
      ui.select(["BP 코드", "아이디+이름", "상호명", "사업자등록번호"], { "aria-label": "검색 기준" }) +
        ui.searchField(A, { placeholder: "BP000001 · 아이디·이름 일부 · 상호명 일부 · 사업자등록번호", label: "검색어" }),
      { tight: true },
    ),
    ui.filterSection("상태", ui.checkbox(A, "사용", true) + ui.checkbox(A, "미사용", true) + ui.checkbox(A, "탈퇴", true)),
    ui.filterSection("사업자정보 인증", ui.select(["전체", "인증완료", "미인증"], { "aria-label": "사업자정보 인증" }), { tight: true, last: true }),
  ]);

  const cols = [
    { header: "BP 코드", width: "w-[110px]" },
    { header: "아이디", width: "w-[120px]" },
    { header: "이름", width: "w-[110px]" },
    { header: "연락처", width: "w-[130px]" },
    { header: "이메일", align: "left" },
    { header: "상태", width: "w-[90px]" },
    { header: "상호명", width: "w-[160px]" },
    { header: "사업자등록번호", width: "w-[150px]" },
    { header: "가입경로", width: "w-[110px]" },
    { header: "등록자", width: "w-[110px]" },
    { header: "등록 일시", width: "w-[150px]" },
  ];
  const rows = BPS.map(([code, id, nm, tel, mail, state, corp, biz, via, by, at]) => [
    detailTrigger(code),
    id,
    nm ?? GONE,
    tel ?? GONE,
    mail ?? GONE,
    ui.badge(state === "사용" ? "on" : "off", state),
    detailTrigger(corp),
    biz,
    via,
    by,
    at,
  ]);

  const toolbar = ui.listToolbar(
    BPS.length,
    ui.button("엑셀 다운로드", { variant: "soft" }) +
      ui.slideTrigger("BP 마스터 계정 등록", "bp-new-panel") +
      `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`,
  );

  return {
    title: "BP 마스터 계정 관리",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "BP 마스터 계정 관리",
      body: ui.listBody(filter, toolbar + ui.dataTable(cols, rows, "일치하는 BP가 없습니다.") + `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`),
      panels: bpNewPanel(A, R) + bpDetailPanel(A, R) + bpEditPanel(A, R),
    }),
  };
};
