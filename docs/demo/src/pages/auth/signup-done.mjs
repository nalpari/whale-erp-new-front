// 가입 완료. 목업 docs/mockup/auth/signup-done.html.
// 회원가입과 같은 틀(2026-10-13 피드백) — 위에 GNB(로고 포함), 아래에 푸터. 가운데 카드는 쓰지 않는다.
import * as ui from "../../ui.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

// 피그마 회원가입 시안의 고래 이미지(2026-10-13 피드백). 받은 그림은 화면 캡처라 아래쪽에 옛 문구(가입과 동시에 첫 매장을 등록…)가
// 박혀 있다 — 가입 때 점포를 만들지 않으므로 그 자리를 구름색(#eceef0)으로 덮고 글자를 다시 올린다. 글자 없는 원본을 받으면 덮개를 뺀다.
const hero = (A) =>
  `<figure class="relative w-full overflow-hidden"><img alt="" width="542" height="442" class="block h-auto w-full" src="${A}img/signup-done-whale.png"><div aria-hidden="true" class="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_66%,#eceef0_72%)]"></div><figcaption class="absolute right-[40px] bottom-[48px] left-[40px] flex flex-col gap-[6px]"><span class="text-[13px] font-semibold tracking-[0.04em] text-erp-label uppercase">Business Membership</span><span class="text-[28px] font-semibold text-erp-ink">내 매장의 첫 페이지를 열어보세요</span><span class="text-[13px] text-erp-label">가입하고 오늘부터 바로 매장 관리를 시작하세요.</span></figcaption></figure>`;
// 시작하기 버튼은 폭을 채우지 않고 가운데 200px 로 둔다(2026-10-13 피드백, 피그마 다음 버튼 크기).
const ARROW = `<svg viewBox="0 0 16 16" class="ml-[6px] size-[14px]" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`;

export default ({ A, R }) => {
  const body =
    `<div class="flex flex-col items-center gap-[10px] text-center"><h1 class="text-[22px] font-semibold">가입을 환영합니다</h1><p class="text-[14px]">㈜한강상회 · 아이디 hangang01</p><p class="text-[13px] text-erp-label">가입 안내 메일을 <b class="font-semibold text-erp-ink">hayoon@hangang.co.kr</b>로 보냈습니다.</p></div>` +
    `<div class="flex justify-center"><div class="grid w-[200px]">${ui.button(`웨일ERP 시작하기${ARROW}`, { href: link(R, "home/signed-in.html") })}</div></div>` +
    // 두 줄로 나눠 가운데 정렬한다(2026-10-12). p.note 는 다른 화면도 쓰는 왼쪽 정렬 안내라 여기만 따로 그린다.
    `<p class="text-center text-[13px] leading-[1.6] text-erp-label">이 화면은 10분 동안만 열립니다.<br>시간이 지나면 ${ui.link("로그인 화면", link(R, "auth/login.html"))}에서 가입한 아이디로 들어오세요.</p>`;
  // 피그마 회원가입 시안처럼 좌우로 나눈다(2026-10-13 피드백) — 왼쪽 반은 고래 이미지(비율 유지, 남는 아래는 구름색), 오른쪽 반은 완료 안내.
  const main = `<div class="flex"><div class="w-1/2 shrink-0 bg-[#eceef0]">${hero(A)}</div><div class="flex min-w-0 flex-1 items-center justify-center px-[24px] py-[48px]"><div class="flex w-[420px] flex-col gap-[24px]">${body}</div></div></div>`;
  return { title: "가입 완료", html: p.sitePage(A, R, { main, foot: p.siteFoot(A, R) }) };
};
