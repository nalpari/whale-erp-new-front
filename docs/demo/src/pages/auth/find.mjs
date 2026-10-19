// 아이디/비밀번호 찾기. 앱 실제 화면 src/app/(public)/(site)/find 를 옮겼다(틀은 Figma 1:1811 샘플과 같다).
// 칸은 시안의 휴대폰 인증 대신 정책대로 이름 · 이메일(비밀번호는 아이디까지)이다(okf/auth.md 계정 찾기). 주소 #id · #pw 로 탭을 연다.
// 데모라 요청은 보내지 않는다. 칸을 채워 제출하면 그 탭의 결과 안내만 보인다(guest.js).
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

// 탭 켜짐·꺼짐 클래스. 탭 줄은 erp.js 의 탭 동작(data-on · data-off)이 바꾼다.
const TAB_ON = "border-guest-ink text-guest-ink";
const TAB_OFF = "border-[#999] text-[#999] hover:text-guest-ink";
const RESULT = "flex flex-col gap-[10px] rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy";

const tab = (key, label, on) =>
  `<button type="button" role="tab" data-find-tab="${key}" aria-selected="${on}" data-on="${TAB_ON}" data-off="${TAB_OFF}" class="flex-1 border-b-2 p-[10px] text-[22px] leading-[1.4] font-medium ${g.HOVER} ${on ? TAB_ON : TAB_OFF}">${label}</button>`;

const field = (label, input, only = "") =>
  `<label${only ? ` data-find-only="${only}"${only === "password" ? " hidden" : ""}` : ""} class="flex flex-col gap-[10px]"><span class="${g.LABEL}">${label}</span><span class="${g.INPUT_BOX}">${input}</span></label>`;

// 결과 안내. 비밀번호 탭은 계정이 있든 없든, 메일이 나가지 않았어도 같은 안내다 — 계정이 있는지 드러내지 않는다.
const results = `<div data-find-result="id" role="status" hidden class="${RESULT}"><p>정하윤님의 아이디를 확인했습니다.</p><p class="text-[28px] leading-[1.2] font-bold text-guest-ink">ha******1</p><p class="text-[15px] text-[#767676]">앞 2자와 뒤 1자만 보여 드립니다.</p></div><div data-find-result="password" role="status" hidden class="${RESULT}"><p class="text-[20px] font-semibold text-guest-ink">메일을 확인해 주세요</p><p>입력한 이름·아이디·이메일이 맞으면 등록된 이메일로 임시 비밀번호를 보냈습니다.<br>임시 비밀번호는 1시간 동안만 쓸 수 있습니다.</p></div>`;

export default ({ A, R }) => {
  const form = `<div role="tablist" class="flex">${tab("id", "ID 찾기", true)}${tab("password", "비밀번호 찾기", false)}</div><form data-find-form role="tabpanel" class="flex flex-col gap-[24px]"><div data-find-fields class="flex flex-col gap-[16px]">${field("이름", `<input name="name" autocomplete="name" placeholder="이름을 입력해 주세요" required maxlength="20" class="${g.INPUT}">`)}${field("아이디", `<input name="loginId" autocomplete="username" placeholder="아이디를 입력해 주세요" required maxlength="20" disabled class="${g.INPUT}">`, "password")}${field("이메일", `<input name="email" type="email" autocomplete="email" placeholder="가입할 때 등록한 이메일" required maxlength="254" class="${g.INPUT}">`)}</div>${results}<div data-find-actions class="grid grid-cols-3 gap-[8px]"><button type="submit" data-find-submit class="${g.SUBMIT}">아이디 확인</button>${g.button(A, "회원가입", { tone: "soft", href: link(R, "auth/signup.html"), tall: true })}${g.button(A, "로그인 이동", { tone: "line", href: link(R, "auth/login.html"), arrow: "back", tall: true })}</div><button type="button" data-find-to-password hidden class="text-[15px] leading-[1.5] font-medium text-[#5e697b] hover:text-guest-navy ${g.HOVER}">비밀번호도 잊으셨나요?</button></form>`;

  // 시안은 Pretendard Black(900)이지만 저장소에 담은 가장 굵은 굵기가 800 이다.
  const main = `<section class="grid grid-cols-2">${g.visual(A, {
    eyebrow: "Account help",
    title: `<p class="text-[42px] leading-normal font-extrabold tracking-[-0.025em] text-[rgba(58,86,112,0.6)] ${g.TRIM}">계정을 찾아 드릴게요</p>`,
    body: "가입할 때 등록한 이름과 이메일로 아이디를 확인하고,<br>임시 비밀번호를 메일로 받을 수 있습니다.",
  })}<div class="flex flex-col gap-[27px] px-[200px] py-[80px] text-guest-ink"><div class="flex flex-col gap-[8px]"><h1 class="text-[28px] leading-[1.2] font-bold">아이디/비밀번호 찾기</h1><p class="text-[16px] leading-[1.5]">관리자 계정으로 로그인 하세요.</p></div>${form}</div></section>`;

  return { title: "아이디/비밀번호 찾기", head: g.head(A), html: g.page(A, R, { current: "auth/find.html", main, flush: true }) };
};
