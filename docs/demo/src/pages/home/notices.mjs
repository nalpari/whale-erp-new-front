// 공지사항 · FAQ(비로그인). 목업 docs/mockup/home/notices.html 의 글을 비로그인 디자인(메인의 「새로운 소식」·「자주 묻는 질문」 판)으로 그렸다.
// 탭은 erp.js 의 탭 동작(data-on · data-off)을 쓴다. #faq 로 FAQ 탭을 연다. 새 패널은 서서히 나타난다(guest-fade 는 assets/base.css).
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

const TAB_ON = "border-guest-ink text-guest-ink";
const TAB_OFF = "border-[#ebebeb] text-[#999] hover:text-guest-ink";
const tab = (id, label, on) =>
  `<button type="button" role="tab" id="tab-${id}" aria-controls="${id}" aria-selected="${on}" data-on="${TAB_ON}" data-off="${TAB_OFF}" class="-mb-px w-[200px] border-b-2 p-[10px] text-[22px] leading-[1.4] font-medium ${g.HOVER} ${on ? TAB_ON : TAB_OFF}">${label}</button>`;

// 구분 배지 색은 메인 「새로운 소식」과 같다. 고정 글은 남색 배지를 앞에 단다.
const BADGE = {
  고정: "bg-guest-navy text-white",
  안내: "bg-[#f2f6ff] text-[#366fe3]",
  점검: "bg-[#e7f7f1] text-[#11b076]",
  기능: "bg-guest-card text-guest-navy",
  약관: "bg-[#f5f5f5] text-guest-sub",
};
const badge = (t) => `<span class="flex h-[30px] shrink-0 items-center rounded-[3px] px-[10px] text-[15px] leading-[1.4] font-semibold ${BADGE[t]}">${t}</span>`;

const NOTICES = [
  { pinned: true, kind: "점검", title: "9월 정기 점검 안내 (09-14 02:00~05:00)", date: "2026.09.05" },
  { kind: "기능", title: "근로계약 전자날인 기능이 열렸습니다", date: "2026.09.01" },
  { kind: "약관", title: "개인정보처리방침 개정 안내", date: "2026.08.25" },
  { kind: "안내", title: "WHALE ERP 1차 오픈 일정 안내", date: "2026.08.19" },
];

const faqs = (R) => [
  ["가입은 누가 할 수 있나요?", "식당·카페를 직접 운영하는 <b class=\"font-semibold text-guest-ink\">일반 BP</b>와 가맹점을 두는 <b class=\"font-semibold text-guest-ink\">본사 BP</b>가 직접 가입합니다. 가맹점은 가입하지 않고, 본사가 만들어 준 관리자 계정으로 로그인합니다."],
  ["직원도 이 사이트로 로그인하나요?", "아닙니다. 직원은 <b class=\"font-semibold text-guest-ink\">직원 전용 앱</b>으로 들어갑니다. 관리자가 근로계약서 초안을 저장하면 초대가 문자로 나가고, 직원은 앱에서 가입과 계약서 날인을 합니다."],
  ["점포가 여러 개면 어떻게 보나요?", "화면 위쪽에서 조회 범위를 고릅니다. 전체·직영·가맹 또는 점포 하나를 고르면 그 뒤의 모든 조회가 그 범위로 맞춰집니다."],
  ["급여를 계산해 주나요?", "근로계약과 출퇴근 기록을 참조해 <b class=\"font-semibold text-guest-ink\">초안</b>을 만들어 드립니다. 4대보험 같은 공제는 관리자가 직접 넣고, 급여 지급 자체는 제공하지 않습니다."],
  ["요금은 어떻게 되나요?", `점포 수와 직원 수에 따른 요금 PLAN이 있고, POS·KIOSK 같은 부가서비스는 따로 구독합니다. 자세한 내용은 <a href="${link(R, "home/inquiry.html")}" class="font-semibold text-guest-navy underline underline-offset-[3px] hover:text-guest-ink ${g.HOVER}">도입문의</a>로 물어보실 수 있습니다.`],
];

export default ({ A, R }) => {
  const notices = `<ul class="text-[17px] leading-[1.5]">${NOTICES.map(
    (n) =>
      `<li class="flex items-center gap-[12px] border-b border-guest-list-line px-[10px] py-[22px]">${n.pinned ? badge("고정") : ""}${badge(n.kind)}<a href="#" class="flex-1 truncate text-guest-ink hover:text-guest-navy ${g.HOVER}">${n.title}</a><span class="text-guest-sub">${n.date}</span></li>`,
  ).join("")}</ul>`;

  // 메인의 자주 묻는 질문과 같은 모양. name 을 같이 준 <details> 라 하나를 열면 나머지가 닫힌다.
  const faq = `<div class="flex flex-col gap-[8px] pt-[24px]">${faqs(R)
    .map(
      ([q, a], i) =>
        `<details name="guest-faq"${i === 0 ? " open" : ""} class="group rounded-[3px] bg-[#fafafa] pb-[4px] open:bg-[#f5f5f5]"><summary class="flex cursor-pointer px-[20px] pt-[22px] pb-[18px] list-none items-center gap-[11px] text-[17px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy ${g.HOVER} [&::-webkit-details-marker]:hidden"><span class="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-guest-navy text-[18px] font-bold tracking-normal text-white">Q</span><span class="flex-1">${q}</span>${g.gimg(A, "faq-plus.svg", 28, 28, "group-open:hidden")}${g.gimg(A, "faq-close.svg", 28, 28, "hidden group-open:block")}</summary><p class="pr-[20px] pb-[18px] pl-[60px] text-[16px] leading-[1.6] text-guest-sub">${a}</p></details>`,
    )
    .join("")}</div>`;

  const main = `<section class="mx-auto flex w-[1200px] flex-col gap-[40px] pt-[80px] text-guest-ink"><div class="flex items-end justify-between gap-[24px]"><div class="flex flex-col gap-[8px]"><h1 class="text-[28px] leading-[1.2] font-bold">공지사항 · FAQ</h1><p class="text-[16px] leading-[1.5]">로그인하지 않아도 볼 수 있는 글만 모았습니다.</p></div>${g.button(A, "도입문의", { tone: "outline", href: link(R, "home/inquiry.html"), arrow: true })}</div><div><div role="tablist" class="flex border-b border-[#ebebeb]">${tab("notices", "공지사항", true)}${tab("faq", "FAQ", false)}</div><div role="tabpanel" id="notices" aria-labelledby="tab-notices" class="animate-[guest-fade_220ms_ease] motion-reduce:animate-none">${notices}</div><div role="tabpanel" id="faq" aria-labelledby="tab-faq" hidden class="animate-[guest-fade_220ms_ease] motion-reduce:animate-none">${faq}</div></div></section>`;

  return { title: "공지사항 · FAQ", head: g.head(A), html: g.page(A, R, { current: "home/notices.html", main }) };
};
