// 회원가입. 목업 docs/mockup/auth/signup.html 의 기본 상태(사업자정보 인증 전).
// 기본정보 · 사업자정보 인증(선택) · 약관동의를 한 화면에 둔다.
import * as ui from "../../ui.mjs";
import { req, tel, pwField } from "../../biz-form.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  const basic = ui.formGroup(
    "기본정보",
    ui.field(req("아이디"), ui.textField({ value: "hangang01", autocomplete: "username", placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요." })),
    p.row(
      pwField("비밀번호", "whale-2026!", "new-password", "", "영문·숫자·특수문자를 조합하여 8~20자 입력해 주세요."),
      pwField("비밀번호 확인", "whale-2026!", "new-password"),
    ),
    p.row(ui.field(req("이름"), ui.textField({ value: "정하윤", placeholder: "한글 또는 영문 2~20자" })), ui.field(req("연락처"), tel("010", "4821", "7730"))),
    ui.field(req("이메일"), ui.textField({ type: "email", value: "hayoon@hangang.co.kr" })),
    ui.field(req("상호명"), ui.textField({ value: "㈜한강상회", placeholder: "50자 이내로 입력해 주세요." })),
  );

  const biz = ui.formGroup(
    "사업자정보 인증 (선택)",
    `<h4 class="text-[14px] font-semibold">사업자 번호 인증</h4>`,
    p.row(
      ui.field("사업자등록번호", ui.textField({ value: "211-87-01234", placeholder: "000-00-00000" })),
      ui.field("대표자명", ui.textField({ value: "남도현" })),
      ui.field("개업일자", ui.dateField(A, { label: "개업일자", value: "2021-03-15" })),
    ),
    `<div class="flex">${ui.button("인증하기")}</div>`,
  );

  const use = x.dialogId();
  const privacy = x.dialogId();
  const view = (id) => `<button type="button" data-dialog="${id}" class="text-[14px] text-erp-link hover:underline">전문 보기</button>`;
  // 약관 전체 동의를 켜고 끄면 아래 두 개도 같이 켜지고 꺼진다(2026-10-06 피드백).
  const useChk = ui.uid("agree");
  const privacyChk = ui.uid("agree");
  const syncAll = `document.getElementById('${useChk}').checked=this.checked;document.getElementById('${privacyChk}').checked=this.checked;`;
  const agree = ui.formGroup(
    "약관동의",
    ui.checkbox(A, "약관 전체 동의", false, { onchange: syncAll }),
    `<hr class="border-erp-divider">`,
    `<div class="flex items-center justify-between">${ui.checkbox(A, "이용약관 동의 (필수)", false, { id: useChk })}${view(use)}</div>`,
    `<div class="flex items-center justify-between">${ui.checkbox(A, "개인정보 수집·이용 동의 (필수)", false, { id: privacyChk })}${view(privacy)}</div>`,
  );

  const card =
    p.cardTitle("회원가입") +
    basic +
    biz +
    agree +
    p.block(ui.button("회원가입", { href: link(R, "auth/signup-done.html") })) +
    `<p class="flex justify-center gap-[10px] text-[14px]"><span class="text-erp-label">이미 계정이 있나요?</span>${p.quietLink('<b class="font-semibold text-erp-ink">로그인</b>', link(R, "auth/login.html"))}</p>` +
    // 전문 보기 확인창 폭을 이 카드(w-[860px] · 도입문의 화면과 같은 폭, 2026-10-07 피드백)에 맞춘다.
    p.termsDialog(use, "use", "w-[860px]") +
    p.termsDialog(privacy, "privacy", "w-[860px]");
  return { title: "회원가입", html: p.authPage(A, R, { card, width: "w-[860px]" }) };
};
