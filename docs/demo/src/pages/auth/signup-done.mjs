// 가입 완료. 앱 디자인 샘플 src/app/design/guest/sign-up/complete(기획 시안 signup-done)를 옮겼다.
// 회원가입 폼이 주소로 넘긴 값을 guest.js 가 채운다. 바로 열면 시안의 예시 값을 보인다.
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  const login = link(R, "auth/login.html");
  const main = `<section class="grid min-h-[730px] grid-cols-2">${g.visual(A, {
    eyebrow: "Business membership",
    title: `<p class="text-[42px] leading-normal font-extrabold tracking-[-0.025em] text-[rgba(58,86,112,0.6)] ${g.TRIM}">내 매장의 첫 페이지를 열어보세요</p>`,
    body: "가입하고 오늘부터 바로 매장 관리를 시작하세요.",
  })}<div class="flex items-center justify-center px-[200px] py-[80px] text-guest-ink"><div class="flex w-full flex-col items-center gap-[32px] text-center"><div class="flex flex-col items-center gap-[12px]"><h1 class="text-[28px] leading-[1.2] font-bold">가입을 환영합니다</h1><p class="text-[18px] leading-[1.5] font-medium"><span data-query="companyName">㈜한강상회</span> · 아이디 <span data-query="loginId">hangang01</span></p><p class="text-[16px] leading-[1.5] text-[#767676]">가입 안내 메일을 <strong data-query="email" class="font-semibold text-guest-ink">hayoon@hangang.co.kr</strong>로 보냈습니다.</p></div><div class="grid w-[280px]">${g.button(A, "웨일ERP 시작하기", { tone: "navy", href: login, arrow: true, tall: true })}</div><p class="w-full rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy">이 화면은 10분 동안만 열립니다.<br>시간이 지나면 <a href="${login}" class="font-semibold underline underline-offset-[3px] hover:text-guest-ink ${g.HOVER}">로그인 화면</a>에서 가입한 아이디로 들어오세요.</p></div></div></section>`;

  return { title: "가입 완료", head: g.head(A), html: g.page(A, R, { current: "auth/signup-done.html", main, flush: true }) };
};
