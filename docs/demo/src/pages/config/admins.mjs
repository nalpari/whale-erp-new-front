// BP 관리자 관리 목록. 목업 docs/mockup/config/admins.html 의 기본 상태(처음 진입 · 전체)를 BP 마스터로 본 것.
// 목업 위쪽 검색 조건 묶음은 왼쪽 필터로 옮겼다. 표본 상세는 hghr 하나라 모든 줄이 그 상세로 간다.
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

// [아이디, 이름, 역할, 권한 그룹, 그룹 코드, 상태, 매핑 점포, 등록일시, 최근 로그인] — 등록일시 최신순
const ADMINS = [
  ["moricd", "윤재희", "가맹 관리자", "모리 매니저", "FA000003", "사용", "2", "2026-01-06 13:30", "2026-09-18 22:41"],
  ["ongids", "서동현", "가맹 관리자", "온기 점장", "FA000004", "미사용", "1", "2025-09-01 09:40", "2026-06-12 21:15"],
  ["moriyn", "한지수", "가맹 관리자", "모리 점장", "FA000002", "사용", "1", "2025-08-11 10:05", "2026-09-21 07:58"],
  ["hgacct", "최민호", "BP 관리자", "정산 조회", "BA000005", "미사용", "전체 · 11", "2025-07-15 14:03", "2026-03-31 18:10"],
  ["ongifm", "오태민", "가맹 마스터", "가맹 마스터(고정)", "FM000001", "사용", "3", "2025-05-20 15:40", "2026-09-19 20:02"],
  ["hghr", "이서아", "BP 관리자", "인사 담당", "BA000004", "사용", "4", "2025-04-01 09:12", "2026-09-20 17:55"],
  ["morinam01", "박서윤", "가맹 마스터", "가맹 마스터(고정)", "FM000001", "사용", "4", "2025-03-03 11:00", "2026-09-21 09:12"],
  ["hgops", "김도윤", "BP 관리자", "운영 총괄", "BA000003", "사용", "전체 · 11", "2025-02-10 10:20", "2026-09-21 08:30"],
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
    ui.filterSection("점포", ui.searchField(A, { placeholder: "점포코드 또는 점포명으로 찾기", label: "점포" }), { tight: true }),
    ui.filterSection("아이디 · 이름", ui.searchField(A, { placeholder: "아이디 또는 이름 일부를 입력하세요", label: "아이디 · 이름" }), { tight: true }),
    ui.filterSection("권한 그룹", ui.select(GROUPS, { "aria-label": "권한 그룹" }), { tight: true }),
    ui.filterSection("계정 상태", ui.select(["전체", "사용", "미사용"], { "aria-label": "계정 상태" }), { tight: true, last: true }),
  ]);

  const detail = link(R, "config/admins-detail.html");
  const cols = [
    { header: "아이디", width: "w-[140px]", align: "left" },
    { header: "이름", width: "w-[110px]" },
    { header: "역할", width: "w-[120px]" },
    { header: "권한 그룹", align: "left" },
    { header: "계정 상태", width: "w-[100px]" },
    { header: "매핑 점포", width: "w-[110px]" },
    { header: "등록일시", width: "w-[160px]" },
    { header: "최근 로그인", width: "w-[160px]" },
  ];
  const rows = ADMINS.map(([id, name, role, group, code, state, stores, reg, login]) => [
    ui.link(id, detail),
    ui.link(name, detail),
    role,
    `${group} ${c.muted(code)}`,
    ui.badge(state === "사용" ? "on" : "off", state),
    stores,
    reg,
    login,
  ]);
  const off = ADMINS.flatMap((a, i) => (a[5] === "미사용" ? [i] : []));

  const toolbar = ui.listToolbar(
    ADMINS.length,
    ui.button("관리자 등록", { href: link(R, "config/admins-new.html") }) + `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`,
  );

  return {
    title: "BP 관리자 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 관리자 관리",
      body: ui.listBody(
        filter,
        toolbar + c.dimRows(ui.dataTable(cols, rows, "조건에 맞는 관리자 계정이 없습니다."), off) + `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
      ),
    }),
  };
};
