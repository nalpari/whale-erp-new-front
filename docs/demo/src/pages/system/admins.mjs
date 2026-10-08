// 플랫폼 관리자 관리 목록. 목업 docs/mockup/system/admins.html 의 기본 상태(조회·등록 권한, 전체)를 플랫폼 관리자로 본 것.
// 목업 위쪽 검색 조건은 왼쪽 필터로 옮겼다(점포 목록과 같은 방식). 등록일시 검색은 두지 않는다(2026-10-08).
// 상세·등록·수정은 BP 관리자 관리처럼 오른쪽 슬라이드 패널로만 연다 — 따로 화면(주소)을 두지 않는다(src/platform-admin/).
import * as ui from "../../ui.mjs";
import { platformHeader } from "../../site.mjs";
import { platformAdminNewPanel } from "../../platform-admin/new.mjs";
import { platformAdminDetailPanel } from "../../platform-admin/detail.mjs";
import { platformAdminEditPanel } from "../../platform-admin/edit.mjs";

// 아이디·이름은 상세를 슬라이드 패널로 연다(표본 상세는 platpark 하나라 모든 줄이 그 상세를 연다)
const detailTrigger = (text) => `<button type="button" aria-controls="platform-admin-detail-panel" aria-expanded="false" class="text-erp-link hover:underline">${text}</button>`;

// 미사용 계정 줄은 흐리게(목업 is-read). 행 단위 클래스를 받지 않는 dataTable 결과에서 n 번째 줄에 글자색을 얹는다.
const dimRows = (table, idx) => {
  let n = -1;
  return table.replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, (m) => (idx.includes(++n) ? m.replace('">', ' text-erp-muted">') : m));
};

// 연락처·이메일 칸 앞 아이콘. 목업 app.js 의 phone·mail 모양을 그대로 옮겼다(앱 public/icons 에는 없는 아이콘이라 여기에만 둔다).
const ICON = {
  phone: '<rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.4"/><path d="M10.4 18.4h3.2"/>',
  mail: '<rect x="3" y="5.4" width="18" height="13.2" rx="1.8"/><path d="m3.6 6.4 8.4 6.6 8.4-6.6"/>',
};
const withIcon = (name, text) =>
  `<span class="inline-flex items-center gap-[6px]"><svg viewBox="0 0 24 24" class="size-[13px] shrink-0 text-erp-label" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>${text}</span>`;

const ADMINS = [
  ["platyoon", "윤채원", "플랫폼 관리자", "사용", "010-9013-5528", "chaewon.yoon@whale-erp.example", "", "2026-09-21 10:04"],
  ["plathan", "한승우", "정산 담당", "사용", "010-4402-7719", "seungwoo.han@whale-erp.example", "2026-09-18 16:05", "2025-11-17 13:40"],
  ["platchoi", "최유나", "고객지원 담당", "미사용", "010-6620-1185", "yuna.choi@whale-erp.example", "2026-04-30 18:22", "2025-06-02 10:18"],
  ["platpark", "박지우", "고객지원 담당", "사용", "010-7781-3302", "jiwoo.park@whale-erp.example", "2026-09-21 09:03", "2025-06-02 10:11"],
  ["platlee", "이도현", "플랫폼 관리자", "사용", "010-5540-2217", "dohyun.lee@whale-erp.example", "2026-09-20 10:15", "2025-03-10 14:22"],
  ["platkim", "김서연", "플랫폼 마스터", "사용", "010-3321-0981", "seoyeon.kim@whale-erp.example", "2026-09-19 17:40", "2025-01-06 09:05"],
  ["platjung", "정민재", "플랫폼 마스터", "사용", "010-2011-4410", "minjae.jung@whale-erp.example", "2026-09-21 08:52", "2025-01-06 09:00"],
];

export default ({ A, R }) => {
  const filter = ui.filterPanel(A, [
    ui.filterSection("아이디 · 이름", ui.searchField(A, { placeholder: "아이디 또는 이름 일부" }), { tight: true }),
    ui.filterSection("사용자 권한", ui.select(["전체", "플랫폼 마스터", "플랫폼 관리자", "고객지원 담당", "정산 담당", "기준정보 조회"], { "aria-label": "사용자 권한" }), { tight: true }),
    ui.filterSection("계정 상태", ui.checkbox(A, "사용", true) + ui.checkbox(A, "미사용", true), { last: true }),
  ]);

  const cols = [
    { header: "아이디", width: "w-[130px]" },
    { header: "이름", width: "w-[110px]" },
    { header: "사용자 권한", width: "w-[140px]" },
    { header: "계정 상태", width: "w-[100px]" },
    { header: "연락처", width: "w-[150px]" },
    { header: "이메일", align: "left" },
    { header: "최근 로그인", width: "w-[170px]" },
    { header: "등록일시", width: "w-[170px]" },
  ];
  const rows = ADMINS.map(([id, name, role, state, phone, mail, login, reg]) => [
    detailTrigger(id),
    detailTrigger(name),
    role,
    ui.badge(state === "사용" ? "on" : "off", state),
    withIcon("phone", phone),
    withIcon("mail", mail),
    login || '<span class="text-erp-muted">로그인 기록 없음</span>',
    reg,
  ]);

  const toolbar = ui.listToolbar(ADMINS.length, ui.slideTrigger("등록", "platform-admin-new-panel"));
  const table = dimRows(ui.dataTable(cols, rows, "조건에 맞는 플랫폼 관리자 계정이 없습니다."), [2]);

  return {
    title: "플랫폼 관리자 관리",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "플랫폼 관리자 관리",
      body: ui.listBody(filter, toolbar + table + `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`),
      panels: platformAdminNewPanel(A, R) + platformAdminDetailPanel(A, R) + platformAdminEditPanel(A, R),
    }),
  };
};
