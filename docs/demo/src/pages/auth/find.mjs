// 아이디/비밀번호 찾기. 앱 디자인 샘플 src/app/design/guest/find-account(Figma 1:1811)를 옮겼다.
// 로그인 화면과 같은 틀에 오른쪽 폼만 다르다. 주소 #id · #pw 로 탭을 연다.
// 데모라 인증번호 발송·확인은 하지 않는다. 받기를 누르면 남은 시간만 센다(guest.js).
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

// 탭 켜짐·꺼짐 클래스. 탭 줄은 erp.js 의 탭 동작(data-on · data-off)이 바꾼다.
const TAB_ON = "border-guest-ink text-guest-ink";
const TAB_OFF = "border-[#999] text-[#999] hover:text-guest-ink";

const tab = (key, label, on) =>
  `<button type="button" role="tab" data-find-tab="${key}" aria-selected="${on}" data-on="${TAB_ON}" data-off="${TAB_OFF}" class="flex-1 border-b-2 p-[10px] text-[22px] leading-[1.4] font-medium ${g.HOVER} ${on ? TAB_ON : TAB_OFF}">${label}</button>`;

const field = (label, input, only = "") =>
  `<label${only ? ` data-find-only="${only}"${only === "password" ? " hidden" : ""}` : ""} class="flex flex-col gap-[10px]"><span class="${g.LABEL}">${label}</span><span class="${g.INPUT_BOX}">${input}</span></label>`;

export default ({ A, R }) => {
  const form = `<div role="tablist" class="flex">${tab("id", "ID 찾기", true)}${tab("password", "비밀번호 찾기", false)}</div><form data-find-form role="tabpanel" class="flex flex-col gap-[24px]"><div class="flex flex-col gap-[16px]">${field("이름", `<input name="name" autocomplete="name" placeholder="이름을 입력해 주세요" class="${g.INPUT}">`, "id")}${field("아이디", `<input name="loginId" autocomplete="username" placeholder="아이디를 입력해 주세요" disabled class="${g.INPUT}">`, "password")}${field("휴대폰 번호", `<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="숫자만 입력해 주세요" class="${g.INPUT}">`)}<div class="flex flex-col gap-[10px]"><label for="verification-code" class="${g.LABEL}">인증번호</label><div class="flex gap-[10px]"><span class="flex-1 ${g.INPUT_BOX}"><input id="verification-code" name="verificationCode" inputmode="numeric" autocomplete="one-time-code" placeholder="인증번호 6자리" class="${g.INPUT}"></span><button type="button" data-send-code class="${g.FIELD_BUTTON}">인증번호 받기</button></div><p data-timer hidden aria-live="polite" class="text-[15px] leading-[1.5] text-[#767676]"></p></div></div><div class="grid grid-cols-3 gap-[8px]"><button type="submit" data-find-submit class="${g.SUBMIT}">아이디 확인</button>${g.button(A, "회원가입", { tone: "soft", href: link(R, "auth/signup.html"), tall: true })}${g.button(A, "로그인 이동", { tone: "line", href: link(R, "auth/login.html"), arrow: "back", tall: true })}</div><p class="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy">휴대폰번호가 바뀌었다면 <strong class="font-semibold">고객센터 02-3847-1592</strong>로 문의해 주세요.</p></form>`;

  // 시안은 Pretendard Black(900)이지만 저장소에 담은 가장 굵은 굵기가 800 이다.
  const main = `<section class="grid grid-cols-2">${g.visual(A, {
    eyebrow: "Account help",
    title: `<p class="text-[42px] leading-normal font-extrabold tracking-[-0.025em] text-[rgba(58,86,112,0.6)] ${g.TRIM}">계정을 찾아 드릴게요</p>`,
    body: "가입할 때 인증한 휴대폰번호로 아이디를 확인하고,<br>비밀번호를 새로 설정할 수 있습니다.",
  })}<div class="flex flex-col gap-[27px] px-[200px] py-[80px] text-guest-ink"><div class="flex flex-col gap-[8px]"><h1 class="text-[28px] leading-[1.2] font-bold">아이디/비밀번호 찾기</h1><p class="text-[16px] leading-[1.5]">관리자 계정으로 로그인 하세요.</p></div>${form}</div></section>`;

  return { title: "아이디/비밀번호 찾기", head: g.head(A), html: g.page(A, R, { current: "auth/find.html", main, flush: true }) };
};
