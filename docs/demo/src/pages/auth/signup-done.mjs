// 가입 완료. 목업 docs/mockup/auth/signup-done.html.
import * as ui from "../../ui.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  const card =
    `<div class="flex flex-col items-center gap-[10px] py-[18px] text-center"><h1 class="text-[18px] font-semibold">회원가입이 완료되었습니다</h1><p class="text-[14px]">㈜한강상회 · 아이디 hangang01</p><p class="text-[13px] text-erp-label">가입 안내 메일을 <b class="font-semibold text-erp-ink">hayoon@hangang.co.kr</b> 로 보냈습니다.</p></div>` +
    p.block(ui.button("웨일ERP 시작하기", { href: link(R, "home/signed-in.html") })) +
    p.note(`이 화면은 10분 동안만 열립니다. 시간이 지나면 ${ui.link("로그인 화면", link(R, "auth/login.html"))}에서 가입한 아이디로 들어오세요.`);
  return { title: "가입 완료", html: p.authPage(A, R, { card }) };
};
