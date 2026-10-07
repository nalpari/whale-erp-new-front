// 공지사항 · FAQ(비로그인). 목업 docs/mockup/home/notices.html. #faq 로 FAQ 탭을 연다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

// 중립 배지. Badge 는 운영(파랑)·미운영(빨강) 두 가지뿐이라 같은 모양에 옅은 회색 바탕으로 만든다.
const tag = (t) => `<span class="inline-block rounded-[2px] bg-erp-subtle px-[4px] py-[2px] text-[14px] font-medium">${t}</span>`;
// FAQ 답변은 목록에서 펼친다(네이티브 details).
const qa = (A, q, a) =>
  `<details class="group border-b border-erp-thead-line"><summary class="flex h-[46px] cursor-pointer list-none items-center gap-[10px] px-[12px] text-[14px] font-medium [&::-webkit-details-marker]:hidden"><span class="flex-1">${q}</span>${ui.img(A, "chevron-small.svg", 5, 8, "-rotate-90 transition-transform duration-150 ease-out group-open:rotate-90")}</summary><div class="bg-erp-thead-bg px-[12px] py-[12px] text-[14px] leading-[1.6]">${a}</div></details>`;

export default ({ A, R }) => {
  const notices = ui.dataTable(
    [{ header: "제목", align: "left" }, { header: "구분", width: "w-[110px]" }, { header: "게시일", width: "w-[120px]" }],
    [
      [`<span class="flex items-center gap-[6px]">${tag("고정")}9월 정기 점검 안내 (09-14 02:00~05:00)</span>`, "점검", "2026-09-05"],
      ["근로계약 전자날인 기능이 열렸습니다", "기능", "2026-09-01"],
      ["개인정보처리방침 개정 안내", "약관", "2026-08-25"],
      ["WHALE ERP 1차 오픈 일정 안내", "안내", "2026-08-19"],
    ],
  );
  const faq = `<div class="border-t border-erp-thead-line">${[
    ["가입은 누가 할 수 있나요?", "식당·카페를 직접 운영하는 <b>일반 BP</b>와 가맹점을 두는 <b>본사 BP</b>가 직접 가입합니다. 가맹점은 가입하지 않고, 본사가 만들어 준 관리자 계정으로 로그인합니다."],
    ["직원도 이 사이트로 로그인하나요?", "아닙니다. 직원은 <b>직원 전용 앱</b>으로 들어갑니다. 관리자가 근로계약서 초안을 저장하면 초대가 문자로 나가고, 직원은 앱에서 가입과 계약서 날인을 합니다."],
    ["점포가 여러 개면 어떻게 보나요?", "화면 위쪽에서 조회 범위를 고릅니다. 전체·직영·가맹 또는 점포 하나를 고르면 그 뒤의 모든 조회가 그 범위로 맞춰집니다."],
    ["급여를 계산해 주나요?", "근로계약과 출퇴근 기록을 참조해 <b>초안</b>을 만들어 드립니다. 4대보험 같은 공제는 관리자가 직접 넣고, 급여 지급 자체는 제공하지 않습니다."],
    ["요금은 어떻게 되나요?", `점포 수와 직원 수에 따른 요금 PLAN이 있고, POS·KIOSK 같은 부가서비스는 따로 구독합니다. 자세한 내용은 ${ui.link("도입문의", link(R, "home/inquiry.html"))}로 물어보실 수 있습니다.`],
  ]
    .map(([q, a]) => qa(A, q, a))
    .join("")}</div>`;

  const main = `<div class="mx-auto flex w-[1200px] flex-col gap-[18px] px-[24px] py-[48px]"><div class="flex flex-col gap-[6px]"><h1 class="text-[22px] font-semibold">공지사항 · FAQ</h1><p class="text-[14px] text-erp-label">로그인하지 않아도 볼 수 있는 글만 모았습니다.</p></div>${x.tabs([
    { id: "notices", label: "공지사항 4", html: notices },
    { id: "faq", label: "FAQ 5", html: faq },
  ])}</div>`;
  return { title: "공지사항 · FAQ", html: p.sitePage(A, R, { current: "notices", main, foot: p.siteFoot(A, R) }) };
};
