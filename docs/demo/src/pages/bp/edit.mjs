// BP 마스터 계정 수정. 목업 docs/mockup/bp/edit.html 의 기본 상태(㈜한강상회 · 사용 · 인증된 BP)를 플랫폼 관리자로 본 것.
// 상세(bp/detail.html)에서 슬라이드 패널로 연다(2026-10-06 피드백) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as f from "../../biz-form.mjs";
import { BP, platformHeader, link } from "../../site.mjs";

// 제목 바로 옆에 BP 상태 배지, 그 다음에 BP 코드 · 상호명을 보인다. 아래 BP 상태 묶음은 없앴다(2026-10-08)
const TITLE = `BP 마스터 계정 수정<span class="mx-[10px] inline-flex align-middle">${ui.badge("on", "사용")}</span><span class="text-[14px] font-medium text-erp-label">${BP.code} · ${BP.name}</span>`;

export function bpEditBody(A, R, { panel = false } = {}) {
  const detail = link(R, "bp/detail.html");

  const basic = ui.formGroup(
    "BP 마스터 기본정보",
    // 아이디 · 가입경로 칸은 두지 않는다 — 바꿀 수 없는 값이라 상세에서 본다(앱 bp-master-form-panel.tsx, 2026-10-28 사용자 지정)
    ui.field(f.req("이름"), ui.textField({ value: "정하윤" })),
    f.group(f.req("연락처"), f.tel("010", "4821", "7730")),
    ui.field(f.req("이메일"), ui.textField({ value: "hayoon@hangang.co.kr" })),
    // 계정상태는 보여 주기만 한다 — 바꾸는 곳은 상세의 [BP 상태 변경](2026-10-28)
    `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">계정상태</span><span class="flex items-center gap-[6px] text-[14px]">${ui.badge("on", "사용")}</span>${f.help("계정상태는 상세의 [BP 상태 변경]에서 바꿉니다.")}</div>`,
  );

  const biz = ui.formGroup(
    `${f.titleBadge("BP 사업자정보", "on", "인증완료")}<span class="ml-[10px] text-[13px] font-normal text-erp-label">최종 인증 2026-03-04 10:20</span>`,
    f.bizAuth(A, "ebiz", { start: "done", values: ["211-87-01234", "남도현", "2021-03-15"], input: ["211-87-40981", "남도현", "2026-09-01"] }),
    ui.field(f.req("상호명"), ui.textField({ value: BP.name, maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
    f.group("대표자 연락처", f.tel("010", "5530", "1182")),
    ui.field("대표자 이메일", ui.textField({ value: "ceo@hangang.co.kr" })),
    f.address(A, "사업자주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "3층" }),
    ui.formRow(ui.field("업태", ui.textField({ value: "도소매업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "식자재 유통", maxlength: 50 }))),
  );

  const cancel = panel ? ui.button("취소", { variant: "off", "data-close": true }) : ui.button("취소", { variant: "off", href: detail });
  return (
    basic +
    biz +
    f.formButtons(cancel, ui.button("저장", { href: detail })) +
    f.SWAP_SCRIPT
  );
}

export function bpEditPanel(A, R) {
  return ui.slidePanel(
    "bp-edit-panel",
    "BP 마스터 계정 수정",
    ui.sectionHead(TITLE) + bpEditBody(A, R, { panel: true }),
  );
}

export default ({ A, R }) => {
  const body = ui.detailBody(
    ui.sectionHead(TITLE) + bpEditBody(A, R),
  );
  return { title: "BP 마스터 계정 수정", html: ui.erpFrame({ header: platformHeader(A, R), title: "BP 마스터 계정 관리", body }) };
};
