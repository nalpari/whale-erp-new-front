// 회원가입. 목업 docs/mockup/auth/signup.html 의 기본 상태(사업자정보 인증 전).
// 기본정보 · 사업자정보 인증(선택) · 약관동의를 한 화면에 둔다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  const tel = `<div class="flex gap-[6px]">${ui.textField({ value: "010", inputmode: "numeric", "aria-label": "앞자리" })}${ui.textField({ value: "4821", inputmode: "numeric", "aria-label": "가운데자리" })}${ui.textField({ value: "7730", inputmode: "numeric", "aria-label": "끝자리" })}</div>`;
  const basic = ui.formGroup(
    "기본정보",
    ui.field("아이디 *", ui.textField({ value: "hangang01", autocomplete: "username" }) + p.help("영문 또는 영문·숫자 4~20자 · 칸을 벗어나면 바로 중복을 확인합니다")),
    p.row(
      ui.field("비밀번호 *", ui.textField({ type: "password", value: "whale-2026!", autocomplete: "new-password" }) + p.help("영문·숫자·특수문자 각 1자 이상, 8~20자")),
      ui.field("비밀번호 확인 *", ui.textField({ type: "password", value: "whale-2026!", autocomplete: "new-password" })),
    ),
    p.row(ui.field("이름 *", ui.textField({ value: "정하윤" }) + p.help("한글 또는 영문 2~20자")), ui.field("연락처 *", tel)),
    ui.field("이메일 *", ui.textField({ type: "email", value: "hayoon@hangang.co.kr" }) + p.help("칸을 벗어나면 형식과 중복을 확인합니다 · 아이디 찾기와 임시 비밀번호가 이 주소로 갑니다")),
    ui.field("상호명 *", ui.textField({ value: "㈜한강상회" }) + p.help("1~50자. 사업자 인증 결과로 채우지 않고 직접 입력하며, 인증한 뒤에도 고칠 수 있습니다.")),
  );

  const biz = ui.formGroup(
    "사업자정보 인증 (선택)",
    p.note("국세청 API로 사업자등록번호·대표자명·개업일자의 진위만 확인합니다. 인증하지 않아도 위 기본정보와 약관 동의만으로 회원가입을 요청할 수 있습니다. 상호명은 이 인증으로 채워지지 않습니다."),
    `<h4 class="text-[14px] font-semibold">사업자 번호 인증</h4>`,
    ui.field("사업자등록번호", ui.textField({ value: "211-87-01234" })),
    p.row(ui.field("대표자명", ui.textField({ value: "남도현" })), ui.field("개업일자", ui.dateField(A, { label: "개업일자", value: "2021-03-15" }))),
    `<div class="flex">${ui.button("인증하기")}</div>`,
  );

  const use = x.dialogId();
  const privacy = x.dialogId();
  const view = (id) => `<button type="button" data-dialog="${id}" class="text-[14px] text-erp-link hover:underline">전문 보기</button>`;
  const agree = ui.formGroup(
    "약관동의",
    ui.checkbox(A, "약관 전체 동의"),
    `<hr class="border-erp-divider">`,
    `<div class="flex items-center justify-between">${ui.checkbox(A, "이용약관 동의 (필수)")}${view(use)}</div>`,
    `<div class="flex items-center justify-between">${ui.checkbox(A, "개인정보 수집·이용 동의 (필수)")}${view(privacy)}</div>`,
  );

  const card =
    p.cardTitle("회원가입", "사업자 한 곳이 BP 하나로 가입합니다. 점포는 가입한 뒤 점포 관리에서 등록합니다.") +
    basic +
    biz +
    agree +
    p.block(ui.button("회원가입", { href: link(R, "auth/signup-done.html") })) +
    `<p class="flex justify-center gap-[10px] text-[14px]"><span class="text-erp-label">이미 계정이 있나요?</span>${p.quietLink('<b class="font-semibold text-erp-ink">로그인</b>', link(R, "auth/login.html"))}</p>` +
    p.termsDialog(use, "use") +
    p.termsDialog(privacy, "privacy");
  return { title: "회원가입", html: p.authPage(A, R, { card, width: "w-[640px]" }) };
};
