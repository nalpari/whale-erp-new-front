// 약관 전문. 목업 docs/mockup/auth/terms.html. #use · #privacy · #useStaff · #privacyStaff · #marketing · #location 으로 해당 탭을 연다.
// 문구는 목업 auth.js 의 TERMS 에서 읽는다(public.mjs).
import * as x from "../../extra.mjs";
import * as p from "../../public.mjs";

const TABS = [
  ["use", "1) 플랫폼 이용약관(BP사업자 회원가입용)"],
  ["privacy", "2) 개인정보 수집·이용"],
  ["useStaff", "3) 플랫폼 이용약관(직원앱 회원가입용)"],
  ["privacyStaff", "4) 개인정보 수집·이용(직원앱)"],
  ["marketing", "5) 마케팅 수신"],
  ["location", "6) 위치정보 수집·이용"],
];

export default ({ A, R }) => {
  const doc = (key) =>
    `<div class="flex flex-col gap-[6px] pt-[6px]"><h2 class="text-[18px] font-semibold">${p.TERMS[key].title}</h2>${p.termsVer(key)}</div><div class="flex flex-col gap-[18px] text-[14px] leading-[1.6]">${p.termsBody(key)}</div>`;
  const card = `<div class="flex flex-col gap-[18px] [&_[role=tab]]:shrink-0 [&_[role=tab]]:whitespace-nowrap [&_[role=tablist]]:overflow-x-auto">${x.tabs(TABS.map(([id, label]) => ({ id, label, html: doc(id) })))}</div>`;
  return { title: "약관 전문", html: p.authPage(A, R, { card, width: "w-[1320px]" }) };
};
