// 회원가입. 목업 docs/mockup/auth/signup.html 의 기본 상태(사업자정보 인증 전).
// 기본정보 · 사업자정보 인증(선택) · 약관동의를 한 화면에 둔다.
import * as ui from "../../ui.mjs";
import { req, tel, pwField } from "../../biz-form.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

// 중복 확인 API 가 없어 형식만 본다 — 이 데모는 형식이 맞는 기본값을 쓰므로 통과한 상태를 그대로 보여준다.
// 버튼 없이 칸을 벗어나면(blur) 자동으로 본다고 가정한 모습이라 데모도 버튼 없이 바로 통과 상태로 둔다(2026-10-12 피드백).
// 체크 표시는 운영 파랑(erp-on) — DESIGN.md 에 초록이 없어 "사용 가능"도 상태색을 쓴다(2026-10-12 피드백, 실제 화면과 맞춤).
const AVAILABLE = `<span class="mt-[8px] flex items-center gap-[4px] text-[13px] text-erp-on"><svg viewBox="0 0 20 20" class="size-[16px] shrink-0" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#5e8ce9"/><path d="M6 10.3l2.6 2.6L14 7.3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg> 사용가능합니다.</span>`;
const blank = '<div class="min-w-px flex-1"></div>';

export default ({ A, R }) => {
  const basic = ui.formGroup(
    `기본정보<span class="ml-[10px] text-[14px] font-normal text-erp-label">(<span class="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)</span>`,
    // 아이디·이메일·상호명도 비밀번호·이름처럼 반 폭으로 맞춘다(2026-10-12 피드백) — 남는 반은 blank 로 채운다.
    p.row(ui.field(req("아이디"), ui.textField({ value: "hangang01", autocomplete: "username", placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요." }) + AVAILABLE), blank),
    p.row(
      pwField("비밀번호", "whale-2026!", "new-password", "", "영문·숫자·특수문자를 조합하여 8~20자 입력해 주세요."),
      pwField("비밀번호 확인", "whale-2026!", "new-password"),
    ),
    p.row(ui.field(req("이름"), ui.textField({ value: "정하윤", placeholder: "한글 또는 영문 2~20자" })), ui.field(req("연락처"), tel("010", "4821", "7730"))),
    p.row(ui.field(req("이메일"), ui.textField({ type: "email", value: "hayoon@hangang.co.kr" }) + AVAILABLE), blank),
    p.row(ui.field(req("상호명"), ui.textField({ value: "㈜한강상회", placeholder: "50자 이내로 입력해 주세요." })), blank),
  );

  // 국세청 진위확인 API 가 없어 "인증하기"는 자리표시자다 — 인증완료됐다 치고 그 상태를 기본으로 보여준다(2026-10-12 피드백).
  // "재인증"·"지우기"는 생김새만 — 인증 전 상태(빈 칸 · 인증하기 버튼)로 돌아가는 토글은 실제 동작하지 않는다
  // (bizAuth 의 data-swap 토글을 처리하는 핸들러가 erp.js 에 아직 없다 — 다른 화면의 재인증 버튼도 같다).
  const biz = ui.formGroup(
    "사업자정보 인증 (선택)",
    `<h4 class="flex items-center gap-[8px] text-[14px] font-semibold">사업자 번호 인증${ui.badge("on", "인증완료")}</h4>`,
    p.row(
      ui.field("사업자등록번호", ui.textField({ value: "211-87-01234", disabled: true })),
      ui.field("대표자명", ui.textField({ value: "남도현", disabled: true })),
      ui.field("개업일자", ui.textField({ value: "2021-03-15", disabled: true })),
    ),
    `<div class="flex gap-[6px]">${ui.button("재인증", { variant: "soft" })}${ui.button("지우기", { variant: "off" })}</div>`,
  );

  const use = x.dialogId();
  const privacy = x.dialogId();
  const view = (id) => `<button type="button" data-dialog="${id}" class="text-[14px] text-erp-link underline">내용보기</button>`;
  // 모두 동의합니다를 켜고 끄면 아래 두 개도 같이 켜지고 꺼진다(2026-10-06 피드백).
  // 거꾸로 아래 둘 중 하나라도 끄면 모두 동의도 풀리고, 둘 다 켜면 다시 켜진다 — 개발 화면(agree-section.tsx)과 같다(2026-10-13 피드백).
  const allChk = ui.uid("agree");
  const useChk = ui.uid("agree");
  const privacyChk = ui.uid("agree");
  const syncAll = `document.getElementById('${useChk}').checked=this.checked;document.getElementById('${privacyChk}').checked=this.checked;`;
  const syncOne = `document.getElementById('${allChk}').checked=document.getElementById('${useChk}').checked&&document.getElementById('${privacyChk}').checked;`;
  const agree = ui.formGroup(
    "약관동의",
    ui.checkbox(A, "모두 동의합니다.", false, { id: allChk, onchange: syncAll }),
    `<hr class="border-erp-divider">`,
    `<div class="flex items-center justify-between">${ui.checkbox(A, "이용약관 동의 (필수)", false, { id: useChk, onchange: syncOne })}${view(use)}</div>`,
    `<div class="flex items-center justify-between">${ui.checkbox(A, "개인정보 수집·이용 동의 (필수)", false, { id: privacyChk, onchange: syncOne })}${view(privacy)}</div>`,
  );

  // 체크 둘 다 비어 있는 기본값이라, 제출을 시도하면 뜨는 오류 문구도 데모에 그대로 보여준다(2026-10-12 피드백).
  // 실제 개발 화면과 같은 자리(약관동의 카드와 회원가입 버튼 사이) — 하나만 비었으면 그 이름만 말한다.
  const agreeError = `<span role="alert" class="text-[13px] text-[#e93737]">이용약관과 개인정보 수집·이용에 모두 동의해 주세요.</span>`;

  const card =
    p.cardTitle("회원가입") +
    basic +
    biz +
    agree +
    agreeError +
    p.block(ui.button("회원가입", { href: link(R, "auth/signup-done.html") })) +
    `<p class="flex justify-center gap-[10px] text-[14px]"><span class="text-erp-label">이미 계정이 있나요?</span>${p.quietLink('<b class="font-semibold text-erp-ink">로그인</b>', link(R, "auth/login.html"))}</p>` +
    // 내용보기 확인창 폭을 이 카드(w-[860px] · 도입문의 화면과 같은 폭, 2026-10-07 피드백)에 맞춘다.
    p.termsDialog(use, "use", "w-[860px]") +
    p.termsDialog(privacy, "privacy", "w-[860px]");
  return { title: "회원가입", html: p.authPage(A, R, { card, width: "w-[860px]" }) };
};
