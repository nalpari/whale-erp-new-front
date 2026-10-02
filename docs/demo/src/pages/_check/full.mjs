// 생성기 검사용. /design/full 과 같은 내용을 ui.mjs 로 그린다. 두 화면의 스크린샷이 같아야 ui.mjs 가 맞다.
import * as ui from "../../ui.mjs";

const MENUS = [
  ["기초정보관리", ["상품 정보 관리", "가격 정보 관리", "카테고리 정보 관리", "자재 정보 관리"]],
  ["점포관리", ["점포 정보 관리", "계약서 템플릿 관리", "계약서 관리", "시설물 및 장비 관리", "점검표 템플릿 관리", "점검 결과 관리"]],
  ["직원관리", ["직원 정보 관리", "근로계약 관리", "급여명세서 관리", "근무 스케줄 관리", "출·퇴근 현황 조회", "TO-DO List 관리"]],
  ["매출조회", ["매출 조회", "매출 통계", "매출 분석"]],
  ["재무관리", ["입·출금 관리", "매출/매입 거래 등록", "계정별 현황 조회"]],
  ["환경설정", ["관리자 관리", "권한 관리", "공통코드 관리", "휴일 관리"]],
  ["고객지원", ["부가서비스 구독 관리", "구독료 청구 및 납부 현황", "결제수단 관리", "정산 현황 조회", "공지사항", "문의하기"]],
].map(([label, items]) => ({ label, items: items.map((l) => ({ label: l, href: "#" })) }));
const STORES = ["힘이나는커피생활 종로점 BP1234", "(상담중) 동해에서잡아온- BIM1234", "(운영) 동해물과 – BIM1111", "(종료) 동해횟집 – BIM0012"];
const USER = [
  { label: "내정보 관리", href: "#" },
  { label: "비밀번호 변경", href: "#" },
  { label: "로그아웃", href: "#", danger: true },
];

export default ({ A }) => {
  const header = ui.globalHeader(
    A,
    MENUS,
    ui.storeSelect(A, STORES) + ui.serviceLinks(A) + ui.alarmLink(A, "#") + ui.userPop(A, "김지영 (admin)", USER),
    "/",
  );
  const filter = ui.filterPanel(
    A,
    [
      ui.filterSection("점포명", ui.checkbox(A, "을지로3가점", true) + ui.checkbox(A, "무교점") + ui.checkbox(A, "신촌점")),
      ui.filterSection("대표자명", ui.searchField(A, { placeholder: "대표자명 입력", label: "대표자명" }), { tight: true }),
      ui.filterSection("점포상태", ui.checkbox(A, "운영", true) + ui.checkbox(A, "미운영") + ui.checkbox(A, "폐점")),
      ui.filterSection("점포유형", ui.checkbox(A, "일반점포", true) + ui.checkbox(A, "가맹점포")),
      ui.filterSection("등록일", ui.dateField(A, { label: "등록일 시작", value: "2020-08-28" }) + ui.dateField(A, { label: "등록일 끝", value: "2020-08-28" }), { tight: true, last: true }),
    ],
    { reset: false },
  );
  const cols = [
    { header: "번호", width: "w-[60px]" },
    { header: "BP 상호명", align: "left" },
    { header: "점포상태", width: "w-[98px]" },
    { header: "점포유형", width: "w-[180px]" },
    { header: "점포명", width: "w-[320px]", align: "left" },
    { header: "점포 연락처" },
    { header: "대표자명" },
    { header: "계약여부" },
    { header: "등록일" },
  ];
  const rows = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((no) => {
    const on = [10, 8, 4, 3, 1].includes(no);
    return [no, "주식회사 따름인", ui.badge(on ? "on" : "off", on ? "운영" : "미운영"), "일반점포", "힘이나는커피생활 종로점", "02 324 0328", "홍길동", ui.link("계약서보기", "#", "힘이나는커피생활 종로점 계약서보기"), "2025.08.28"];
  });
  const panel = "check-register";
  const body = ui.listBody(
    filter,
    ui.listToolbar(100, ui.slideTrigger("신규 등록", panel) + `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { value: "50", "aria-label": "페이지당 건수" })}</div>`) +
      ui.dataTable(cols, rows) +
      `<div class="pt-[14px]">${ui.pagination(A, 1, 10)}</div>`,
  );
  const form = ui.formGroup(
    "기본 정보",
    ui.formRow(ui.field("점포명", ui.textField()), ui.field("점포 유형", ui.select(["직영점", "가맹점"]), "w-[120px]")),
    ui.formRow(ui.field("사업자등록번호", ui.textField({ inputmode: "numeric" })), ui.field("대표자명", ui.textField(), "w-[120px]")),
    ui.formRow(ui.field("시도", ui.select(["서울", "경기", "인천"])), ui.field("시군구", ui.select(["선택", "종로구", "중구"]))),
    ui.field("상세 주소", ui.textField()),
    ui.field("대표번호", ui.textField({ inputmode: "tel" })),
    ui.field("이메일", ui.textField({ type: "email" })),
  ) +
    ui.formGroup(
      "운영 정보",
      ui.formRow(ui.field("영업 시작 시간", ui.textField()), ui.field("영업 종료 시간", ui.textField())),
      ui.formRow(ui.field("정기 휴무일", ui.select(["없음", "월요일", "화요일"]), "w-[120px]"), ui.field("좌석수", ui.textField({ inputmode: "numeric" }))),
      ui.field("점포 소개", ui.textarea({ placeholder: "점포 소개" })),
    ) +
    ui.panelButtons();
  return { title: "생성기 검사", html: ui.erpFrame({ header, title: "점포정보 관리", body, panels: ui.slidePanel(panel, "점포 등록", form) }) };
};
