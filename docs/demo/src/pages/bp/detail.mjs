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
  const sentId = x.dialogId();
  const cancel = ui.button("취소", { variant: "off", "data-close": true });

  const closeBtn = panel ? ui.button("닫기", { variant: "off", "data-close": true }) : ui.button("닫기", { variant: "off", href: link(R, "bp/index.html") });
  const head = ui.sectionHead(
    BP.name,
    x.dialogTrigger("상태변경", offId, "soft") +
      f.disabledButton("삭제", "삭제할 수 없습니다 — 로그인 기록이 있고(2026-09-20), 하위 관리자 4명과 등록 점포 11곳이 있습니다. 대신 BP 상태를 미사용으로 바꾸세요.") +
      ui.slideTrigger("수정", "bp-edit-panel", "soft") +
      closeBtn,
  );

  const basic = ui.detailTable("BP 마스터 기본정보", [
    ["BP 코드", BP.code],
    ["아이디", "hangang01"],
    ["이름", "정하윤"],
    ["연락처", "010-4821-7730"],
    ["이메일", "hayoon@hangang.co.kr"],
    ["비밀번호", `<span class="tracking-[0.2em] text-erp-ink">••••••••</span>${x.dialogTrigger("초기화", resetId, "soft")}`],
    ["BP 상태", `${ui.badge("on", "사용")}<span class="text-erp-label">2025-02-03 11:12</span>`],
    ["소속 점포", ui.link("11곳 · 점포 목록에서 보기", link(R, "stores/index.html"))],
    ["가입경로", "회원가입"],
    ["등록 일시 · 등록자", ui.detailValues(["2025-02-03 11:12", "hangang01"])],
    ["최근 로그인", "2026-09-20 08:41"],
    ["약관 동의", "동의"],
    ["강제 비밀번호 변경", "대상 아님"],
  ]);
  const biz = ui.detailTable(f.titleBadge("BP 사업자정보", "on", "인증완료"), [
    ["상호명", BP.name],
    ["사업자등록번호", "211-87-01234"],
    ["대표자명", "남도현"],
    ["대표자 연락처", "010-5530-1182"],
    ["대표자 이메일", "ceo@hangang.co.kr"],
    ["개업일자", "2021-03-15"],
    ["사업자주소", "04007 서울 마포구 망원로 42, 3층"],
    ["업태 · 종목", ui.detailValues(["도소매업", "식자재 유통"])],
    ["최종 인증 일시", "2026-03-04 10:20"],
  ]);
  const history = ui.dataTable(
    [{ header: "변경 일시", width: "w-[180px]" }, { header: "변경자", width: "w-[140px]" }, { header: "변경 항목", width: "w-[180px]" }, { header: "변경 전" }, { header: "변경 후" }],
    [
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
  const resetDialog = x.dialog(
    resetId,
    "비밀번호 초기화",
    `<dl class="grid grid-cols-[60px_1fr] gap-y-[6px]"><dt class="text-erp-label">BP</dt><dd>${BP.name} <span class="text-erp-label">${BP.code}</span></dd><dt class="text-erp-label">계정</dt><dd>hangang01 · 정하윤</dd></dl>` +
      `<p class="mt-[12px]">새 초기 비밀번호(12자 무작위)를 계정 이메일로 보냅니다. 메일은 「[WHALE ERP] 비밀번호가 초기화되었습니다」 초기화 전용 포맷으로 갑니다(BP 신규 등록 메일과 다른 포맷). 기존 비밀번호로는 더 로그인할 수 없고, 다음 로그인 때 비밀번호를 새로 정해야 합니다. 초기 비밀번호는 1시간 안에 로그인해야 하며, 지나면 로그인 화면의 비밀번호 찾기로 임시 비밀번호를 다시 받습니다.</p>`,
    cancel + ui.button("초기화", { "data-close": true, "data-dialog": sentId }),
  );
  const sentDialog = x.dialog(
    sentId,
    "비밀번호를 초기화했습니다",
    `<p>새 초기 비밀번호를 <b class="font-semibold">hayoon@hangang.co.kr</b> 로 보냈습니다. 화면에는 보이지 않습니다. 초기 비밀번호는 1시간 안에 로그인해야 하며, 지나면 로그인 화면의 비밀번호 찾기로 임시 비밀번호를 다시 받습니다.</p>`,
    ui.button("확인", { "data-close": true }),
  );

  const infoLayout = panel ? `<div class="flex flex-col gap-[24px]">${basic}${biz}</div>` : `<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${biz}</div>`;
  const historyBlock = panel ? `<div class="overflow-x-auto">${history}</div>` : history;
  return (
    `<div class="flex flex-col gap-[12px]">${head}${infoLayout}</div>` +
    `<div class="flex flex-col gap-[12px]">${ui.sectionHead("변경 이력")}${historyBlock}</div>` +
    offDialog +
    resetDialog +
    sentDialog
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
