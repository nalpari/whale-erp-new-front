// 플랫폼 관리자 상세. 목업 docs/mockup/system/admins-detail.html 의 기본 상태(platpark 박지우, 수정·삭제 권한 있음)를 플랫폼 관리자로 본 것.
// 목업 제목 줄 오른쪽의 실행 버튼들은 화면 아래 버튼 줄로 내렸다. 목업 전용 결과 단계(오류·발송 실패)는 뺐다.
// 상세·등록·수정은 따로 화면(주소)이 없고 목록(system/admins.html)의 슬라이드 패널로만 연다(2026-10-08). 저장하면 상세 패널로 간다(erp.js data-save-panel).
// 수정은 상세 패널 위에 수정 패널을 겹쳐 연다.
import * as ui from "../ui.mjs";
import * as x from "../extra.mjs";
import * as c from "../config-parts.mjs";
import { link } from "../site.mjs";

const muted = (t) => `<span class="text-erp-muted">${t}</span>`;
// 확인창 안의 짧은 항목·값 목록(목업 .kv). 1팀 컴포넌트에 없어 두 칸 grid 로 그린다.
const kv = (rows) =>
  `<dl class="grid grid-cols-[60px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">${rows
    .map(([k, v]) => `<dt class="text-erp-label">${k}</dt><dd>${v}</dd>`)
    .join("")}</dl>`;
const WHO = kv([["아이디", "platpark"], ["이름", "박지우"]]);
// 권한명은 이름 옆에 계정 상태처럼 꼬리표로 보인다(BP 관리자 상세와 같은 방패 아이콘 · 2026-10-08). 본문의 권한 · 상태 표는 없앴다.
const SHIELD = `<svg viewBox="0 0 24 24" class="mr-[4px] inline-block size-[12px] align-[-1px]" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.1 20 6v6.1c0 4.5-3.4 7.9-8 8.9-4.6-1-8-4.4-8-8.9V6z"/><path d="m8.9 12.1 2.1 2.1 4.1-4.2"/></svg>`;
const NAME = `박지우 <span class="ml-[6px] inline-flex gap-[6px] align-middle">${ui.badge("on", "사용")}<span title="사용자 권한">${c.tag(`${SHIELD}고객지원 담당`)}</span></span>`;

function platformAdminDetailBody(A, R) {
  const resetId = x.dialogId();
  const deleteId = x.dialogId();
  const histId = x.dialogId();

  // 주소 줄은 세 줄이라 46px 고정 높이에서 잘린다 — 이 줄만 최소 46px 에 내용만큼 늘어나게 한다
  const growAddress = (html) =>
    html.replace(/<div class="flex w-full"><dt class="flex h-\[46px\]([^"]*)">주소<\/dt><dd class="flex h-\[46px\]/, '<div class="flex w-full"><dt class="flex min-h-[46px]$1">주소</dt><dd class="flex min-h-[46px]');
  const info = growAddress(ui.detailTable("기본정보", [
    ["아이디", "platpark"],
    ["이름", "박지우"],
    ["연락처", "010-7781-3302"],
    ["이메일", "jiwoo.park@whale-erp.example"],
    // 비밀번호 초기화는 이메일 아래 칸에 둔다(BP 관리자 상세와 같다 · 2026-10-08)
    ["비밀번호", x.dialogTrigger("초기화", resetId, "soft")],
    ["소속 부서", "고객지원팀"],
    ["직책", "매니저"],
    // 주소는 우편번호 · 기본주소 · 상세주소를 줄을 바꿔 보이고, 위아래 선에 붙지 않게 여백을 준다
    ["주소", `<div class="py-[2px] leading-[1.6]">${["06236", "서울 강남구 테헤란로 152", "12층"].join("<br>")}</div>`],
    ["등록일시", ui.detailValues(["2025-06-02 10:11", "platjung"])],
    ["최종 수정일시", ui.detailValues(["2026-08-12 09:40", "platkim"])],
    ["최근 로그인", "2026-09-21 09:03"],
  ]));

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
    `<div class="flex flex-col gap-[12px] break-keep">${WHO}<p>새 초기 비밀번호(12자 무작위)를 비밀번호 초기화 안내 메일로 계정 이메일에 보냅니다. 초기화하는 사람도 그 값을 볼 수 없습니다. 초기 비밀번호는 1시간 안에 로그인해야 하며, 지나면 로그인 화면의 비밀번호 찾기로 임시 비밀번호를 다시 받습니다.</p><p><b class="font-semibold">기존 비밀번호는 바로 무효가 되지만, 로그인 중인 세션은 끊지 않습니다.</b> 계정 상태는 그대로입니다. 다음 로그인 때 비밀번호를 새로 정해야 합니다.</p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
  );
  const deleteDialog = x.dialog(
    deleteId,
    "플랫폼 관리자 계정 삭제",
    `<div class="flex flex-col gap-[12px] break-keep">${WHO}<p>삭제하면 <b class="font-semibold">관리자 목록과 검색에서 빠지고</b>, 이 계정으로는 <b class="font-semibold">더 로그인할 수 없습니다</b>.</p><p class="text-erp-label">되돌릴 수 없습니다. 아이디는 다시 쓸 수 없고, 이메일은 다른 계정에 다시 쓸 수 있습니다. 이 계정이 남긴 처리 이력은 지우지 않습니다.</p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "system/admins.html") }),
  );

  // 생성·변경 이력 — BP 관리자 상세처럼 버튼을 누르면 팝업으로 본다(2026-10-08). 표가 넓어 이 창만 넓힌다.
  const historyDialog = x
    .dialog(
      histId,
      "생성 · 변경 이력",
      `<div class="overflow-x-auto">${history}</div><div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
      ui.button("닫기", { variant: "off", "data-close": true }),
    )
    .replace("w-[420px]", "w-[640px] max-h-[calc(100dvh-48px)] overflow-y-auto");

  const editBtn = ui.slideTrigger("수정", "platform-admin-edit-panel");
  const actions = `${x.dialogTrigger("삭제", deleteId, "soft")}${editBtn}${x.dialogTrigger("변경 이력", histId, "soft")}`;
  // 이름은 맨 위에 혼자, 기능 버튼은 닫기까지 모두 맨 아래로(BP 관리자 상세 패널과 같다)
  const head = `<h2 class="text-[18px] font-semibold whitespace-nowrap text-erp-ink">${NAME}</h2>`;
  const buttons = `<div class="flex flex-wrap justify-center gap-[6px] border-t border-erp-panel-line pt-[16px]">${actions}${ui.button("닫기", { variant: "off", "data-close": true })}</div>`;

  return head + info + buttons + resetDialog + deleteDialog + historyDialog;
}

export const platformAdminDetailPanel = (A, R) => ui.slidePanel("platform-admin-detail-panel", "플랫폼 관리자 상세", platformAdminDetailBody(A, R));
