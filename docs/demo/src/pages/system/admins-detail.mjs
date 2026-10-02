// 플랫폼 관리자 상세. 목업 docs/mockup/system/admins-detail.html 의 기본 상태(platpark 박지우, 수정·삭제 권한 있음)를 플랫폼 관리자로 본 것.
// 목업 제목 줄 오른쪽의 실행 버튼들은 화면 아래 버튼 줄로 내렸다. 목업 전용 결과 단계(오류·발송 실패)는 뺐다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { platformHeader, link } from "../../site.mjs";

const muted = (t) => `<span class="text-erp-muted">${t}</span>`;
// 확인창 안의 짧은 항목·값 목록(목업 .kv). 1팀 컴포넌트에 없어 두 칸 grid 로 그린다.
const kv = (rows) =>
  `<dl class="grid grid-cols-[60px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">${rows
    .map(([k, v]) => `<dt class="text-erp-label">${k}</dt><dd>${v}</dd>`)
    .join("")}</dl>`;
const WHO = kv([["아이디", "platpark"], ["이름", "박지우"]]);

export default ({ A, R }) => {
  const resetId = x.dialogId();
  const deleteId = x.dialogId();

  const info = ui.detailTable("기본정보", [
    ["아이디", "platpark"],
    ["이름", "박지우"],
    ["연락처", "010-7781-3302"],
    ["이메일", "jiwoo.park@whale-erp.example"],
    ["소속 부서", "고객지원팀"],
    ["직책", "매니저"],
    ["주소", "06236 서울 강남구 테헤란로 152, 12층"],
  ]);
  const role = ui.detailTable("권한 · 상태", [
    ["사용자 권한", `고객지원 담당 ${muted("PA000002 · 플랫폼 관리자 추가 권한")}`],
    ["계정 상태", ui.badge("on", "사용")],
    ["생성 일시", "2025-06-02 10:11"],
    ["최근 로그인", "2026-09-21 09:03"],
    ["강제 비밀번호 변경", "대상 아님"],
  ]);

  const history = ui.dataTable(
    [
      { header: "일시", width: "w-[170px]" },
      { header: "처리자", width: "w-[130px]" },
      { header: "항목", width: "w-[160px]" },
      { header: "변경 전", align: "left" },
      { header: "변경 후", align: "left" },
    ],
    [
      ["2026-08-12 09:40", "platkim", "초기 비밀번호", "—", `초기화 메일 발송 완료 ${muted("· 값은 남기지 않음")}`],
      ["2026-03-02 14:20", "platkim", "직책", "사원", "매니저"],
      ["2025-07-01 09:30", "platjung", "사용자 권한", `플랫폼 관리자 ${muted("PA000001")}`, `고객지원 담당 ${muted("PA000002")}`],
      ["2025-06-02 10:11", "platjung", "계정", "", `사용 · 플랫폼 관리자 ${muted("PA000001")}`],
    ],
  );

  const resetDialog = x.dialog(
    resetId,
    "비밀번호 초기화",
    `<div class="flex flex-col gap-[12px] break-keep">${WHO}<p>새 초기 비밀번호(12자 무작위)를 비밀번호 초기화 안내 메일로 계정 이메일에 보냅니다. 초기화하는 사람도 그 값을 볼 수 없습니다. 초기 비밀번호는 1시간 안에 로그인해야 하며, 지나면 로그인 화면의 비밀번호 찾기로 임시 비밀번호를 다시 받습니다.</p><p><b class="font-semibold">기존 비밀번호는 바로 무효가 되고, 로그인 중인 세션도 모두 끊깁니다.</b> 계정 상태는 그대로입니다. 다음 로그인 때 비밀번호를 새로 정해야 합니다.</p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
  );
  const deleteDialog = x.dialog(
    deleteId,
    "플랫폼 관리자 계정 삭제",
    `<div class="flex flex-col gap-[12px] break-keep">${WHO}<p>삭제하면 <b class="font-semibold">관리자 목록과 검색에서 빠지고</b>, 이 계정으로는 <b class="font-semibold">더 로그인할 수 없습니다</b>. 로그인 중인 세션도 바로 끊깁니다.</p><p class="text-erp-label">되돌릴 수 없습니다. 아이디는 다시 쓸 수 없고, 이메일은 다른 계정에 다시 쓸 수 있습니다. 이 계정이 남긴 처리 이력은 지우지 않습니다.</p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "system/admins.html") }),
  );

  const buttons = `<div class="flex justify-center gap-[6px]">${ui.button("목록", { variant: "off", href: link(R, "system/admins.html") })}${x.dialogTrigger("비밀번호 초기화", resetId, "soft")}${x.dialogTrigger("계정 삭제", deleteId, "soft")}${ui.button("수정", { href: link(R, "system/admins-edit.html") })}</div>`;

  const body = ui.detailBody(
    `<div class="grid grid-cols-2 items-start gap-[24px]">${info}${role}</div>` +
      `<div class="flex flex-col gap-[12px]">${ui.sectionHead("생성 · 변경 이력", `<span class="text-[14px] text-erp-label">생성 · 정보 · 권한 · 상태 · 비밀번호 초기화 · 최신순</span>`)}${history}</div>` +
      buttons +
      resetDialog +
      deleteDialog,
  );

  return {
    title: "박지우",
    html: ui.erpFrame({ header: platformHeader(A, R), title: `박지우 <span class="ml-[6px] align-middle">${ui.badge("on", "사용")}</span>`, body }),
  };
};
