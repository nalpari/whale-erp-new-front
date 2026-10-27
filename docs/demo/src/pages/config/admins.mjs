// BP 관리자 관리 목록. 목업 docs/mockup/config/admins.html 의 기본 상태(처음 진입 · 전체)를 BP 마스터로 본 것.
// 목업 위쪽 검색 조건 묶음은 왼쪽 필터로 옮겼다. 표본 상세는 hghr 하나라 모든 줄이 그 상세를 연다.
// 상세·등록·수정은 BP 마스터 계정 관리처럼 오른쪽 슬라이드 패널로 연다 — 전체 화면 주소도 그대로 둔다.
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader } from "../../site.mjs";
import { storeFilter } from "../../store-filter.mjs";
import { adminNewPanel } from "./admins-new.mjs";
import { adminDetailPanel } from "./admins-detail.mjs";
import { adminEditPanel } from "./admins-edit.mjs";

// 이름은 상세를 슬라이드 패널로 연다. 아이디는 링크 없이 본문 글자(플랫폼 관리자 목록과 같다, 2026-10-27 사용자 지정)
const detailTrigger = (text) => `<button type="button" aria-controls="admin-detail-panel" aria-expanded="false" class="text-erp-link hover:underline">${text}</button>`;

// [아이디, 이름, 역할, 권한 그룹, 그룹 코드, 상태, 매핑 점포, 등록일시, 최근 로그인] — 등록일시 최신순
const ADMINS = [
  ["moricd", "윤재희", "가맹 관리자", "모리 매니저", "FA000003", "사용", "2", "2026-01-06 13:30", "2026-09-18 22:41"],
  ["ongids", "서동현", "가맹 관리자", "온기 점장", "FA000004", "미사용", "1", "2025-09-01 09:40", "2026-06-12 21:15"],
  ["moriyn", "한지수", "가맹 관리자", "모리 점장", "FA000002", "사용", "1", "2025-08-11 10:05", "2026-09-21 07:58"],
  ["hgacct", "최민호", "BP 관리자", "정산 조회", "BA000005", "미사용", "전체", "2025-07-15 14:03", "2026-03-31 18:10"],
  ["ongifm", "오태민", "가맹 마스터", "가맹 마스터(고정)", "FM000001", "사용", "3", "2025-05-20 15:40", "2026-09-19 20:02"],
  ["hghr", "이서아", "BP 관리자", "인사 담당", "BA000004", "사용", "4", "2025-04-01 09:12", "2026-09-20 17:55"],
  ["morinam01", "박서윤", "가맹 마스터", "가맹 마스터(고정)", "FM000001", "사용", "4", "2025-03-03 11:00", "2026-09-21 09:12"],
  ["hgops", "김도윤", "BP 관리자", "운영 총괄", "BA000003", "사용", "전체", "2025-02-10 10:20", "2026-09-21 08:30"],
];
const GROUPS = [
  "전체",
  "운영 총괄 · BA000003",
  "인사 담당 · BA000004",
  "정산 조회 · BA000005",
  "고객응대 · BA000006",
  "점포 조회 전용 · BA000007",
  "가맹 마스터(고정) · FM000001",
  "모리 점장 · FA000002",
  "모리 매니저 · FA000003",
  "온기 점장 · FA000004",
];

export default ({ A, R }) => {
  const filter = ui.filterPanel(A, [
    // 점포 — 점포 정보 관리와 같은 점포 고르기(찾아 고르면 「선택한 점포」에 쌓임 · 5개 넘으면 스크롤)
    ui.filterSection("점포", storeFilter(A), { tight: true }),
    ui.filterSection("아이디 · 이름", ui.searchField(A, { placeholder: "아이디 또는 이름 일부를 입력하세요", label: "아이디 · 이름" }), { tight: true }),
    ui.filterSection("권한 그룹", ui.select(GROUPS, { "aria-label": "권한 그룹" }), { tight: true }),
    ui.filterSection("계정 상태", ui.select(["전체", "사용", "미사용"], { "aria-label": "계정 상태" }), { tight: true, last: true }),
  ]);

  // 아이디 · 이름 · 역할 · 권한명 · 코드 · 최근 로그인 · 등록일시는 폭을 정하지 않아 남는 폭을 똑같이 나눈다. 최근 로그인 다음에 등록일시(2026-10-27 사용자 지정)
  const cols = [
    { header: "아이디" },
    { header: "이름" },
    { header: "역할" },
    { header: "권한명 · 코드" }, // 열 이름도 값과 같은 형식 · 가운데 정렬(앱과 같다, 2026-10-27)
    { header: "계정 상태", width: "w-[100px]" },
    { header: "매핑 점포", width: "w-[110px]" },
    { header: "최근 로그인" },
    { header: "등록일시" },
  ];
  const rows = ADMINS.map(([id, name, role, group, code, state, stores, reg, login]) => [
    id,
    detailTrigger(name),
    role,
    `${group} ${c.muted(`· ${code}`)}`,
    ui.badge(state === "사용" ? "on" : "off", state),
    stores,
    login,
    reg,
  ]);
  const off = ADMINS.flatMap((a, i) => (a[5] === "미사용" ? [i] : []));

  // [등록]은 제목 줄 — 플랫폼 관리자 관리와 같은 자리(2026-10-27 사용자 지정 — 전엔 목록 건수 줄)
  const toolbar = ui.listToolbar(ADMINS.length, `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`);

  return {
    title: "BP 관리자 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 관리자 관리",
      titleRight: ui.slideTrigger("등록", "admin-new-panel"),
      body: ui.listBody(
        filter,
        toolbar + c.dimRows(ui.dataTable(cols, rows, "조건에 맞는 관리자 계정이 없습니다."), off) + `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
      ),
      panels: adminNewPanel(A, R) + adminDetailPanel(A, R) + adminEditPanel(A, R),
    }),
  };
};
