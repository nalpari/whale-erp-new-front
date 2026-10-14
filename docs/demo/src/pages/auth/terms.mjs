// 약관 전문. 목업 docs/mockup/auth/terms.html. #use · #privacy · #useStaff · #privacyStaff · #marketing · #location 으로 해당 탭을 연다.
// 문구는 목업 auth.js 의 TERMS 에서 읽는다(public.mjs). Figma 시안이 없어 비로그인 디자인(회원가입·공지사항과 같은 틀)으로 맞췄다.
// 탭 이름이 길고 여섯 개라 가로 탭 대신 왼쪽 세로 목록으로 둔다. 고른 탭은 erp.js 의 탭 동작(data-on · data-off)이 바꾼다.
import * as g from "../../guest.mjs";
import * as p from "../../public.mjs";

const TABS = [
  ["use", "플랫폼 이용약관 (BP사업자 회원가입용)"],
  ["privacy", "개인정보 수집·이용"],
  ["useStaff", "플랫폼 이용약관 (직원앱 회원가입용)"],
  ["privacyStaff", "개인정보 수집·이용 (직원앱)"],
  ["marketing", "마케팅 수신"],
  ["location", "위치정보 수집·이용"],
];

const TAB_ON = "border-guest-navy bg-guest-card font-semibold text-guest-navy";
const TAB_OFF = "border-transparent font-medium text-[#767676] hover:text-guest-ink";

export default ({ A, R }) => {
  const tabs = TABS.map(
    ([id, label], i) =>
      `<button type="button" role="tab" id="tab-${id}" aria-controls="${id}" aria-selected="${i === 0}" data-on="${TAB_ON}" data-off="${TAB_OFF}" class="flex min-h-[56px] items-center border-l-2 px-[18px] py-[12px] text-left text-[16px] leading-[1.4] ${g.HOVER} ${i === 0 ? TAB_ON : TAB_OFF}">${label}</button>`,
  ).join("");
  // 본문 표·목록은 public.mjs 의 termsBody 를 그대로 쓴다(관리자 화면 표 모양).
  const panels = TABS.map(
    ([id], i) =>
      `<div role="tabpanel" id="${id}" aria-labelledby="tab-${id}" class="flex flex-col gap-[32px]"${i === 0 ? "" : " hidden"}><div class="flex flex-col gap-[8px] border-b border-[#ebebeb] pb-[24px]"><h2 class="text-[22px] leading-[1.4] font-semibold text-guest-ink">${p.TERMS[id].title}</h2><p class="text-[15px] text-[#767676]">${p.TERMS[id].ver}</p></div><div class="flex flex-col gap-[24px] text-[16px] leading-[1.7] text-guest-body [&_h3]:text-[17px] [&_h3]:text-guest-ink">${p.termsBody(id)}</div></div>`,
  ).join("");

  const main = `<section class="mx-auto flex w-[1200px] flex-col gap-[40px] pt-[80px] text-guest-ink"><div class="flex flex-col gap-[8px]"><h1 class="text-[28px] leading-[1.2] font-bold">약관 전문</h1><p class="text-[16px] leading-[1.5]">Whale ERP 서비스 이용에 적용되는 약관과 개인정보 처리 기준입니다.</p></div><div class="flex items-start gap-[60px]"><div role="tablist" aria-orientation="vertical" class="sticky top-[130px] flex w-[300px] shrink-0 flex-col border-t border-[#ebebeb]">${tabs}</div><div class="min-w-0 flex-1">${panels}</div></div></section>`;

  return { title: "약관 전문", head: g.head(A), html: g.page(A, R, { current: "auth/terms.html", main }) };
};
