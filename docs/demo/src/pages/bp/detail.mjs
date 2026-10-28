// BP 마스터 계정 상세. 목업 docs/mockup/bp/detail.html 의 기본 상태(㈜한강상회 · 사용 · 조회·수정·삭제 권한)를 플랫폼 관리자로 본 것.
// 생김새는 1팀 /design/detail 샘플: 카드 안 묶음 제목 줄 + [버튼] 과 상세 표.
// 목록(bp/index.html)에서 슬라이드 패널로 연다(2026-10-07 피드백) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { BP, platformHeader, link } from "../../site.mjs";
import { bpEditPanel } from "./edit.mjs";

export function bpDetailBody(A, R, { panel = false } = {}) {
  const offId = x.dialogId();
  const resetId = x.dialogId();
  const histId = x.dialogId();
  const cancel = ui.button("취소", { variant: "off", "data-close": true });

  const closeBtn = panel ? ui.button("닫기", { variant: "off", "data-close": true }) : ui.button("닫기", { variant: "off", href: link(R, "bp/index.html") });
  // 상태변경은 기본정보의 ‘상태변경’ 칸으로 옮겼다(2026-10-08)
  const actionButtons =
    f.disabledButton("삭제", "삭제할 수 없습니다 — 로그인 기록이 있고(2026-09-20), 하위 관리자 4명과 등록 점포 11곳이 있습니다. 대신 BP 상태를 미사용으로 바꾸세요.") +
    ui.slideTrigger("수정", "bp-edit-panel") +
    x.dialogTrigger("변경 이력", histId, "soft");

  // 이름 옆에 BP 상태 배지와 BP 코드 꼬리표를 보이고, 기능 버튼은 닫기까지 모두 맨 아래로 내린다(구현 front #144 와 같다).
  const tag = `<span class="inline-block rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub">BP 코드 · <b class="font-semibold">${BP.code}</b></span>`;
  const head = `<h2 class="flex flex-wrap items-center gap-[6px] text-[18px] font-semibold text-erp-ink"><span class="mr-[4px]">${BP.name}</span>${ui.badge("on", "사용")}${tag}</h2>`;
  const bottomButtons = `<div class="flex flex-wrap items-center gap-[6px]">${closeBtn}<span class="flex-1"></span>${actionButtons}</div>`; // 닫기는 맨 왼쪽(상세 슬라이드 공통 · 2026-10-08)

  const inline = (...parts) => `<span class="flex items-center gap-[6px]">${parts.join("")}</span>`;
  const basic = ui.detailTable("기본정보", [
    ["BP 코드", BP.code],
    ["아이디", "hangang01"],
    ["이름", "정하윤"],
    ["연락처", "010-4821-7730"],
    ["이메일", "hayoon@hangang.co.kr"],
    ["비밀번호", x.dialogTrigger("초기화", resetId, "soft")],
    // 현재 상태는 머리의 배지가 보이므로 이 줄은 [상태 변경] 버튼만(2026-10-28 사용자 지정)
    ["상태", x.dialogTrigger("상태 변경", offId, "soft")],
    // 소속 점포는 수만 보인다 — 점포 목록 연결은 나중에(BP-8)
    ["소속 점포", "11곳"],
    ["가입경로", "회원가입"],
    ["등록 일시", ui.detailValues(["2025-02-03 11:12", "hangang01"])],
    ["수정 일시", ui.detailValues(["2026-08-14 10:31", "platkim"])],
    ["최근 로그인", "2026-09-20 08:41"],
    ["약관 동의", "동의"],
    ["강제 변경", "대상 아님"],
  ]);
  // 사업자주소는 플랫폼 관리자 상세의 주소처럼 우편번호 · 기본주소 · 상세주소를 줄을 바꿔 보이고, 그 줄만 내용만큼 늘어난다(2026-10-08)
  const growAddress = (html) =>
    html.replace(/<div class="flex w-full"><dt class="flex h-\[46px\]([^"]*)">사업자주소<\/dt><dd class="flex h-\[46px\]/, '<div class="flex w-full"><dt class="flex min-h-[46px]$1">사업자주소</dt><dd class="flex min-h-[46px]');
  const biz = growAddress(ui.detailTable(f.titleBadge("사업자정보", "on", "인증완료"), [
    ["상호명", BP.name],
    ["사업자번호", "211-87-01234"],
    ["대표자명", "남도현"],
    ["대표자 연락처", "010-5530-1182"],
    ["대표자 이메일", "ceo@hangang.co.kr"],
    ["개업일자", "2021-03-15"],
    ["사업자주소", `<div class="py-[2px] leading-[1.6]">${["04007", "서울 마포구 망원로 42", "3층"].join("<br>")}</div>`],
    ["업태 · 종목", ui.detailValues(["도소매업", "식자재 유통"])],
    ["최종 인증일시", "2026-03-04 10:20"],
  ]));
  const history = ui.dataTable(
    [{ header: "변경 일시", width: "w-[180px]" }, { header: "변경자", width: "w-[140px]" }, { header: "변경 항목", width: "w-[180px]", align: "left" }, { header: "변경 전", align: "left" }, { header: "변경 후", align: "left" }],
    [
      ["2026-09-02 14:05", "platkim", "비밀번호", "", "초기화"],
      ["2026-08-14 10:31", "platkim", "이메일", "hayoon@hangang.kr", "hayoon@hangang.co.kr"],
      ["2026-03-02 16:45", "hangang01", "사업자주소", "서울 마포구 망원로 42, 2층", "서울 마포구 망원로 42, 3층"],
      ["2025-06-10 09:12", "platjung", "대표자 연락처", "010-5530-1100", "010-5530-1182"],
    ],
    "변경 이력이 없습니다.",
  );

  const box = (title, text) => `<div class="mt-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]"><p class="font-semibold">${title}</p>${text ? `<p class="mt-[6px]">${text}</p>` : ""}</div>`;
  const offDialog = x.dialog(
    offId,
    "BP 상태 변경",
    `<p>현재 상태 ${ui.badge("on", "사용")} — <b class="font-semibold">미사용</b>으로만 바꿀 수 있습니다. 탈퇴는 BP 마스터의 회원 탈퇴로만 생깁니다.</p>` +
      box(
        `${BP.name} · 사용 → 미사용`,
        "이 BP 의 관리자 계정 <b class=\"font-semibold\">5개</b>(BP 마스터 1 · BP 관리자 2 · 가맹 마스터 1 · 가맹 관리자 1)가 모두 미사용이 됩니다. 로그인 중인 세션은 끊지 않고 비밀번호도 그대로 둡니다.",
      ) +
      `<ul class="mt-[12px] list-disc pl-[18px]"><li>점포 <b class="font-semibold">11곳</b>은 상태를 그대로 두고 업무만 멈춥니다 — 직원 초대 · 근로계약 · 부가서비스 · 매출 연동 · 출퇴근 기록.</li><li>운영 중인 점포 · 구독 · 미정산 금액 같은 선행 조건은 검사하지 않고 <b class="font-semibold">바로 적용</b>합니다.</li></ul>`,
    cancel + ui.button("미사용으로 변경", { "data-close": true }),
  );
  // 초기화 확인 — 결과는 알림으로만 보인다. 메일 발송에 실패하면 상세 위에 안내 띠가 뜬다(구현 front #144)
  const resetDialog = x.dialog(
    resetId,
    "비밀번호를 초기화하시겠습니까?",
    `<dl class="grid grid-cols-[60px_1fr] gap-y-[6px]"><dt class="text-erp-label">BP</dt><dd>${BP.name} · ${BP.code}</dd><dt class="text-erp-label">계정</dt><dd>hangang01</dd></dl>` +
      `<p class="mt-[12px]">새 초기 비밀번호(12자 무작위)를 계정 이메일로만 보내며, 기존 비밀번호는 즉시 무효가 됩니다.<br>초기 비밀번호는 1시간 안에 로그인해야 하고, 로그인 때 비밀번호를 새로 정합니다. 현재 로그인 중인 세션은 유지됩니다.</p>`,
    cancel + ui.button("초기화", { "data-close": true, "data-toast": "새 초기 비밀번호를 hayoon@hangang.co.kr 로 보냈습니다." }),
    "w-[560px]",
  );
  const historyDialog = x
    .dialog(
      histId,
      "변경 이력",
      `<div class="overflow-x-auto">${history}</div><div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
      ui.button("닫기", { variant: "off", "data-close": true }),
    )
    .replace("w-[420px]", "w-[640px] max-h-[calc(100dvh-48px)] overflow-y-auto");

  const infoLayout = panel ? `<div class="flex flex-col gap-[24px]">${basic}${biz}</div>` : `<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${biz}</div>`;
  return (
    `<div class="flex flex-col gap-[12px]">${head}${infoLayout}</div>` +
    bottomButtons +
    offDialog +
    resetDialog +
    historyDialog
  );
}

export function bpDetailPanel(A, R) {
  return ui.slidePanel("bp-detail-panel", "BP 마스터 계정 상세", bpDetailBody(A, R, { panel: true }));
}

export default ({ A, R }) => {
  const body = ui.detailBody(bpDetailBody(A, R));
  return {
    title: "BP 마스터 계정 상세",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "BP 마스터 계정 관리", body, panels: bpEditPanel(A, R) }),
  };
};
