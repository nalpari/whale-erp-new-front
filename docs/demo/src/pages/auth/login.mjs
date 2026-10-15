// 로그인. 앱 디자인 샘플 src/app/design/guest/login(Figma 로그인전_로그인 1:1615)을 옮겼다.
// 왼쪽은 고래 그림, 오른쪽은 관리자 로그인이다. 푸터가 본문에 바로 붙는다(flush).
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  // 데모라 로그인 요청은 보내지 않는다. LOGIN 은 로그인 뒤 홈으로 간다.
  const form = `<form class="flex flex-col gap-[24px]"><div class="flex flex-col gap-[10px]"><label class="${g.INPUT_BOX}"><span class="sr-only">아이디</span><input name="loginId" autocomplete="username" placeholder="User ID" class="${g.INPUT}"><button type="button" data-clear hidden aria-label="아이디 지우기" class="${g.ICON_BUTTON}">${g.gimg(A, "login/clear.svg", 16, 16)}</button></label><label class="${g.INPUT_BOX}"><span class="sr-only">비밀번호</span><input name="password" type="password" autocomplete="current-password" placeholder="Password" class="${g.INPUT}">${g.eyeButton(A, "비밀번호")}</label></div><a href="${link(R, "home/signed-in.html")}" class="flex items-center justify-center ${g.SUBMIT}">LOGIN</a><div class="flex items-center justify-between text-[15px] leading-[1.5] font-medium text-[#5e697b]"><label class="flex items-center gap-[8px]"><input type="checkbox" name="keepSignedIn" class="${g.CHECKBOX}">로그인 상태 유지</label><a href="${link(R, "auth/find.html")}" class="hover:text-guest-navy ${g.HOVER}">아이디/비밀번호 찾기</a></div></form>`;

  const main = `<section class="grid grid-cols-2">${g.visual(A, {
    eyebrow: "Partner office",
    title: `<p class="font-[family-name:var(--font-rem)] leading-[0.86] font-black tracking-[-0.038em] text-[rgba(58,86,112,0.6)] ${g.TRIM}"><span class="block text-[42px]">Welcome back to</span><span class="block text-[84px]">Whale ERP</span></p>`,
    body: "오늘도 매장을 가볍게. 사업자·가맹점·플랫폼 관리자 모두 여기서 시작합니다.<br>권한에 맞는 메뉴가 자동으로 열립니다.",
  })}<div class="flex flex-col gap-[27px] px-[200px] py-[80px] text-guest-ink"><div class="flex flex-col gap-[8px]"><h1 class="text-[28px] leading-[1.2] font-bold">로그인</h1><p class="text-[16px] leading-[1.5]">관리자 계정으로 로그인 하세요.</p></div><div class="flex flex-col gap-[24px]">${form}<div><div class="flex items-center justify-between border-t border-[#ebebeb] py-[24.5px] text-[#111]"><div class="flex flex-col gap-[4px] leading-[1.4]"><p class="text-[20px] font-semibold">처음 오셨나요?</p><p class="text-[16px]">아직 계정이 없으신가요?</p></div>${g.button(A, "사업자 회원가입", { tone: "line", href: link(R, "auth/signup.html"), arrow: true })}</div><p class="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy">직원이신가요?<br>출퇴근·급여명세서는 <strong class="font-semibold">직원 전용 앱</strong>에서 확인하세요.</p></div></div></div></section>`;

  return { title: "로그인", head: g.head(A), html: g.page(A, R, { current: "auth/login.html", main, flush: true }) };
};
