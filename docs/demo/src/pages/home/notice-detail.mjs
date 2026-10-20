// 공지사항 상세(비로그인, #293). 목록(notices)의 첫 글을 연 것.
// 비로그인 상세에는 이전 · 다음 글이 없다(api #71, 2026-10-19). 첨부는 이미지 · PDF 를 내려받는다(#272 · #292).
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";
import { badge, NOTICES } from "./notices.mjs";

const FILES = [
  ["9월_정기점검_안내.pdf", "184 KB"],
  ["점검_시간표.png", "96 KB"],
];

export default ({ A, R }) => {
  const n = NOTICES[0];
  const files = `<ul aria-label="첨부파일" class="flex flex-col gap-[8px] rounded-[6px] bg-guest-card px-[24px] py-[18px] text-[16px] leading-[1.5]">${FILES.map(
    ([name, size]) => `<li class="flex items-center gap-[10px]"><a href="#" download class="text-guest-navy underline underline-offset-[3px] hover:text-guest-ink ${g.HOVER}">${name}</a><span class="text-guest-sub">${size}</span></li>`,
  ).join("")}</ul>`;
  const body = `<p class="text-[17px] leading-[1.8] whitespace-pre-line text-guest-ink">9월 14일(일) 새벽 2시부터 5시까지 정기 점검이 있습니다.
점검 시간에는 관리자 웹과 직원 전용 앱을 모두 사용할 수 없습니다.
직원 근무 앱의 출퇴근 등록은 점검 중에도 기기에 기록되고 점검이 끝나면 자동으로 반영됩니다.
점검이 일찍 끝나면 공지 없이 서비스를 재개합니다.</p>`;

  const main = `<section class="mx-auto flex w-[1200px] flex-col gap-[32px] pt-[80px] text-guest-ink"><div class="flex flex-col gap-[16px] border-b-2 border-guest-ink pb-[24px]"><div class="flex items-center gap-[8px]">${n.pinned ? badge("고정") : ""}${badge(n.kind)}</div><h1 class="text-[28px] leading-[1.4] font-bold">${n.title}</h1><span class="text-[16px] text-guest-sub">${n.date}</span></div>${body}${files}<div class="flex justify-center border-t border-[#ebebeb] pt-[40px]">${g.button(A, "목록", { tone: "outline", href: link(R, "home/notices.html") })}</div></section>`;

  return { title: "공지사항", head: g.head(A), html: g.page(A, R, { current: "home/notices.html", main }) };
};
