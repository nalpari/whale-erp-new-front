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
// 이름 아랫줄에 「역할 | 권한그룹 | 상태 배지」 — 공통코드 상세 코드 머리와 같은 모양(2026-10-27 사용자 지정 — 전엔 이름 옆 상태 배지 · 「사용자 권한 · 그룹명」 꼬리표)
const HEAD = c.adminHead("박지우", "플랫폼 관리자", "고객지원 담당", ui.badge("on", "사용"));

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
    ["소속부서", "고객지원팀"],
    ["직책", "매니저"],
    // 주소는 우편번호 · 기본주소 · 상세주소를 줄을 바꿔 보이고, 위아래 선에 붙지 않게 여백을 준다
    ["주소", `<div class="py-[2px] leading-[1.6]">${["06236", "서울 강남구 테헤란로 152", "12층"].join("<br>")}</div>`],
    // 최근 로그인은 표 맨 아래 줄. 등록 · 최종수정은 표 밖 테두리 없는 카드로(2026-10-27 사용자 지정)
    ["최근 로그인", "2026-09-21 09:03"],
  ])) + c.recordValues(["2025-06-02 10:11", "platjung"], ["2026-08-12 09:40", "platkim"]);

  const history = ui.dataTable(
    [
      { header: "변경일시", width: "w-[140px]" },
      { header: "변경자", width: "w-[80px]" },
      { header: "항목", width: "w-[120px]", align: "left" }, // 앱 history-dialog.tsx 와 같다(2026-10-26)
      { header: "변경 전", align: "left" },
      { header: "변경 후", align: "left" },
    ],
    [
      ["2026-08-12 09:40", "platkim", "초기 비밀번호", "", `초기화 메일 발송 완료 ${muted("· 값은 남기지 않음")}`],
      ["2026-03-02 14:20", "platkim", "직책", "사원", "매니저"],
      ["2025-07-01 09:30", "platjung", "사용자 권한", `플랫폼 관리자 ${muted("PA000001")}`, `고객지원 담당 ${muted("PA000002")}`],
      ["2025-06-02 10:11", "platjung", "계정", "", `사용 · 플랫폼 관리자 ${muted("PA000001")}`],
    ],
  );

  // 안내가 세 줄이라 넓은 확인창 480px(앱 admin-detail-panel.tsx 의 ConfirmDialog wide, 2026-10-26)
  const resetDialog = x.dialog(
    resetId,
    "비밀번호를 초기화하시겠습니까?",
    `<div class="flex flex-col gap-[12px] break-keep">${WHO}<p>임시 비밀번호가 등록된 이메일로 발송되며, 기존 비밀번호는 즉시 무효화됩니다.<br>임시 비밀번호는 1시간 동안 유효하며, 로그인 시 비밀번호를 변경해야 합니다.<br>현재 로그인 중인 세션은 유지됩니다.</p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
    "w-[480px]",
  );
  const deleteDialog = x.dialog(
    deleteId,
    "관리자 계정을 삭제하시겠습니까?",
    `<div class="flex flex-col gap-[12px] break-keep">${WHO}<div class="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] text-erp-off"><p>삭제한 계정은 관리자 목록 및 검색 결과에서 제외되며, 해당 계정으로 더 이상 로그인할 수 없습니다.</p><p>삭제한 계정은 복구할 수 없습니다.</p></div></div>` /* 빨간 안내 상자 · 굵은 글씨 없음(앱과 같다, 2026-10-27) */,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "system/admins.html") }),
  );

  // 변경이력 — BP 관리자 상세처럼 버튼을 누르면 팝업으로 본다(2026-10-08). 표가 넓어 이 창만 넓힌다. 제목·칸
  // 이름은 1팀 영역 모두(점포·BP·휴일 등) 같은 말을 쓴다(2026-10-20 디자인 수정).
  // 폭 760px(앱 history-dialog.tsx 와 같다, 2026-10-26). 쪽 나눔은 한 쪽(앱 HISTORY_PAGE_SIZE)을 넘을 때만 보여, 네 건인 표본에는 두지 않는다
  const historyDialog = x
    .dialog(
      histId,
      "변경이력",
      `<div class="overflow-x-auto">${history}</div>`,
      ui.button("닫기", { variant: "off", "data-close": true }),
    )
    .replace("w-[420px]", "w-[760px] max-h-[calc(100dvh-48px)] overflow-y-auto");

  const editBtn = ui.slideTrigger("수정", "platform-admin-edit-panel");
  const actions = `${x.dialogTrigger("삭제", deleteId, "soft")}${editBtn}${x.dialogTrigger("변경이력", histId, "soft")}`;
  // 이름은 맨 위에 혼자, 기능 버튼은 닫기까지 모두 맨 아래로(BP 관리자 상세 패널과 같다)
  const head = HEAD;
  const buttons = `<div class="flex flex-wrap items-center gap-[6px]">${ui.button("닫기", { variant: "off", "data-close": true })}<span class="flex-1"></span>${actions}</div>`; // 닫기는 맨 왼쪽(상세 슬라이드 공통 · 2026-10-08)

  return head + info + buttons + resetDialog + deleteDialog + historyDialog;
}

export const platformAdminDetailPanel = (A, R) => ui.slidePanel("platform-admin-detail-panel", "플랫폼 관리자 상세", platformAdminDetailBody(A, R));
