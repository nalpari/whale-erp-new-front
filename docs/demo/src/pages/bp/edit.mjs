// BP 마스터 계정 수정. 목업 docs/mockup/bp/edit.html 의 기본 상태(㈜한강상회 · 사용 · 인증된 BP)를 플랫폼 관리자로 본 것.
// 상세(bp/detail.html)에서 슬라이드 패널로 연다(2026-10-06 피드백) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as f from "../../biz-form.mjs";
import { BP, platformHeader, link } from "../../site.mjs";

// 제목 옆에 「BP 코드 · 값」 꼬리표와 계정상태 배지 — 계정상태 칸은 없앴다(앱 bp-master-form-panel.tsx, 2026-10-28 사용자 지정)
const TITLE = `BP 마스터 계정 수정<span class="ml-[6px] inline-flex items-center gap-[6px] align-middle"><span class="inline-flex rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] py-[2px] text-[14px] font-medium text-erp-label">BP 코드 · <b class="ml-[3px] font-semibold text-erp-ink">${BP.code}</b></span>${ui.badge("on", "사용")}</span>`;

// 사업자정보 — 마이페이지 사업자정보 탭과 같은 모양(앱 bp-master-form-panel.tsx · 공통 BizVerificationBox, 2026-10-28 사용자 지정).
// 인증 상자: 회색 제목 줄(오른쪽에 「인증 완료 · 일시」 · 「미인증」) + 세 칸 한 줄 + [인증하기] · [재인증]. 국세청 안내는 인증 전에만.
export function bizAuthBox(A, { locked, values = ["", "", ""], date = "" }) {
  const [num, ceo, open] = values;
  const fields =
    `<div class="flex gap-[6px]">` +
    ui.field("사업자등록번호", ui.textField({ value: num, readonly: locked, placeholder: locked ? undefined : "숫자 10자리", inputmode: "numeric" }), "min-w-px flex-[1.0]") +
    ui.field("대표자명", ui.textField({ value: ceo, readonly: locked, placeholder: locked ? undefined : "대표자 이름", maxlength: 50 }), "min-w-px flex-[0.85]") +
    f.group("개업일자", locked ? ui.textField({ value: open, readonly: true, "aria-label": "개업일자" }) : ui.dateField(A, { label: "개업일자", value: open }), "min-w-px flex-[1.3]") +
    `</div>`;
  return (
    `<section aria-label="사업자 번호 인증" class="w-full">` +
    `<h3 class="flex h-[42px] items-center justify-between rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink"><span>사업자정보</span>${locked ? ui.badge("on", `인증 완료 · ${date}`) : ui.badge("off", "미인증")}</h3>` +
    `<div class="flex flex-col gap-[12px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[16px]">` +
    fields +
    `<div class="flex gap-[6px]">${ui.button(locked ? "재인증" : "인증하기", { variant: "soft" })}</div>` +
    (locked ? "" : `<p class="text-[13px] leading-[1.5] text-erp-label">사업자정보가 국세청에 등록된 정보와 일치하는지 확인합니다.</p>`) +
    `</div></section>`
  );
}

// 상호명부터는 따로 상자. 대표자 연락처 · 이메일 옆 「기본정보와 동일」 — 켜면 기본정보 값이 읽기 전용으로 들어간다.
// 등록은 꺼진 채, 수정은 저장된 값이 기본정보와 같을 때만 켜진 채로 연다(마이페이지와 같은 규칙)
export function bizRest(A, idp, { tradeName, same, phone = ["", "", ""], email = "", category = "", item = "", addr = {} }) {
  const label = (text, id) => `<span class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label"><span>${text}</span>${ui.checkbox(A, "기본정보와 동일", same, { id })}</span>`;
  const tel = same
    ? `<div class="flex gap-[6px]">${phone.map((v, i) => ui.textField({ value: v, readonly: true, "aria-label": ["앞자리", "가운데자리", "끝자리"][i] })).join("")}</div>`
    : f.tel(...phone);
  return (
    `<section aria-label="상호명 등" class="flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">` +
    ui.field(f.req("상호명"), ui.textField({ value: tradeName, maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })) +
    `<div role="group" aria-label="대표자 연락처" class="flex min-w-px flex-1 flex-col gap-[8px]">${label("대표자 연락처", `${idp}-phone-same`)}${tel}</div>` +
    `<div role="group" aria-label="대표자 이메일" class="flex min-w-px flex-1 flex-col gap-[8px]">${label("대표자 이메일", `${idp}-email-same`)}${ui.textField({ type: "email", value: email, maxlength: 100, readonly: same })}</div>` +
    ui.formRow(ui.field("업태", ui.textField({ value: category, maxlength: 50 })), ui.field("종목", ui.textField({ value: item, maxlength: 50 }))) +
    f.address(A, "사업자주소", addr) +
    `</section>`
  );
}

export function bpEditBody(A, R, { panel = false } = {}) {
  const detail = link(R, "bp/detail.html");

  const basic = ui.formGroup(
    "BP 마스터 기본정보",
    // 계정상태 칸 대신 맨 위 회색 안내 상자 한 줄 — 상태는 제목 줄 배지(앱과 같다, 2026-10-28 사용자 지정)
    `<div class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-ink">계정상태는 상세화면의 [BP상태변경]에서 변경할 수 있습니다.</div>`,
    // 아이디 · 가입경로 칸은 두지 않는다 — 바꿀 수 없는 값이라 상세에서 본다(앱 bp-master-form-panel.tsx, 2026-10-28 사용자 지정)
    ui.field(f.req("이름"), ui.textField({ value: "정하윤" })),
    f.group(f.req("연락처"), f.tel("010", "4821", "7730")),
    ui.field(f.req("이메일"), ui.textField({ value: "hayoon@hangang.co.kr" })),
  );

  const biz =
    `<div class="flex flex-col gap-[18px]">` +
    bizAuthBox(A, { locked: true, values: ["211-87-01234", "남도현", "2021-03-15"], date: "2026-03-04 10:20" }) +
    bizRest(A, "ebiz", { tradeName: BP.name, same: false, phone: ["010", "5530", "1182"], email: "ceo@hangang.co.kr", category: "도소매업", item: "식자재 유통", addr: { zip: "04007", base: "서울 마포구 망원로 42", detail: "3층" } }) +
    `</div>`;

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
