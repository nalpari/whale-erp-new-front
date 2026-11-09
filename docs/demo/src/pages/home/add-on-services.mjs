// 부가서비스 소개. 앱 디자인 샘플 src/app/design/guest/add-on-services/page.tsx(Figma 로그인전_공유 · 부가서비스 44:1792, 2026-11-06. 처음은 로그인전_부가서비스 1:1083)를 옮겼다.
import * as g from "../../guest.mjs";

const S = "add-on-services";

// 유리판 아이콘 조각 — 흰 반투명 판에 그림자와 안쪽 밝은 테두리를 준다.
const GRAD = `style="background-image:${g.ICON_GRADIENT}"`;

const pickupIcon = (A) =>
  `<span class="relative block h-[74px] w-[62px]">${g.gimg(A, `${S}/pickup.svg`, 87.9649, 99.9648, "absolute top-[-11.68px] left-[-12.98px] max-w-none")}</span>`;

const tableOrderIcon = () =>
  `<span class="relative block h-[74px] w-[64px]"><span class="absolute top-[17px] left-0 h-[57px] w-[64px] rounded-[10px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]" ${GRAD}></span><span class="absolute top-0 left-[7px] h-[67px] w-[50px] rounded-[8px] ${g.GLASS}"></span><span class="absolute top-[12px] left-[13px] h-[14px] w-[38px] rounded-[10px] bg-white/15 shadow-[0_1.9px_18.7px_rgba(0,0,0,0.03),inset_0_7.5px_5.8px_rgba(255,255,255,0.5)] backdrop-blur-[4.2px]"></span><span class="absolute top-[35px] left-[14px] h-[2px] w-[36px] rounded-full bg-white/90"></span><span class="absolute top-[42px] left-[19px] h-[2px] w-[26px] rounded-full bg-white/60"></span><span class="absolute top-[49px] left-[24px] h-[2px] w-[16px] rounded-full bg-white/20"></span></span>`;

const qrOrderIcon = (A) =>
  `<span class="relative block h-[74px] w-[61px]">${g.gimg(A, `${S}/qr-phone.svg`, 122.937, 138.937, "absolute top-[-23.72px] left-[-37.47px] max-w-none")}<span class="absolute top-[67px] left-[9px] h-[3px] w-[30px] rounded-full bg-white/90"></span>${g.gimg(A, `${S}/qr-code.svg`, 36.85, 36.85, "absolute top-[26px] left-[5.2px] max-w-none")}</span>`;

const waitingIcon = (A) =>
  `<span class="relative block h-[74px] w-[80.59px]">${g.gimg(A, `${S}/waiting.svg`, 95.7796, 90.708, "absolute top-0 left-0 max-w-none")}</span>`;


// 구독 단위(사업자·점포 구독)는 주황 바탕, 나머지 조건은 회청 바탕 꼬리표이고 글자는 모두 흰색이다(44:1792). 셋째 꼬리표는 남는 폭을 채운다.
const badges = (list) =>
  `<div class="flex gap-[4px]">${list
    .map(
      (b, i) =>
        `<span class="flex h-[30px] items-center justify-center rounded-[3px] px-[10px] text-[14px] leading-[1.4] font-semibold whitespace-nowrap text-white ${b.endsWith("구독") ? "bg-[#ee882d]" : "bg-[#c1cfda]"} ${i === 2 ? "flex-1" : ""}">${b}</span>`,
    )
    .join("")}</div>`;

// 부가서비스 카드. 옅은 회청 바탕에 30px 로 둥글고 그림자는 없다(44:1861).
const CARD = "rounded-[30px] border border-[#ecf1f4] bg-[#f6f9fb] px-[32px] py-[40px]";
const lines = (list) => list.map((l) => `<span class="block">${l}</span>`).join("");

// 시안이 제목 옆의 「요금 안내 보기」 · 「도입문의」를 뺐다(44:1792).
// 한 줄의 카드는 그리드가 같은 높이로 늘리고, 설명이 남는 높이를 채워 꼬리표를 카드 아래에 맞춘다(2026-11-06 요청).
const serviceSection = ({ light, desc, services, last = false }) =>
  `<section class="${g.FRAME} flex flex-col gap-[60px] pt-[120px] ${last ? "pb-[120px]" : ""}"><div class="flex flex-col gap-[18px]">${g.sectionTitle(light, "부가서비스")}<p class="text-[18px] leading-[1.5] font-medium text-guest-ink">${desc[0]}<br>${desc[1]}</p></div><ul class="grid grid-cols-5 gap-[16px]">${services
    .map(
      (s) =>
        `<li class="flex flex-col gap-[4px] ${CARD}"><span class="flex h-[88px] items-center pb-[14px]">${s.icon}</span><div class="flex flex-1 flex-col gap-[10px]"><h3 class="text-[22px] leading-[1.5] font-extrabold text-guest-navy">${s.name}</h3><div class="flex flex-1 flex-col gap-[18px]"><p class="flex-1 text-[16px] leading-[1.5] text-guest-navy">${lines(s.desc)}</p>${badges(s.badges)}</div></div></li>`,
    )
    .join("")}</ul></section>`;

const MEMBERSHIP = ["점포 구독", "비회원 이용", "전화번호 포인트"];

const sales = (A) => [
  { name: "Pick up Order", desc: ["손님은 앱으로 미리 주문·결제하고, 도착하자마자 받아갑니다."], badges: ["점포 구독", "일반 회원 전용", "앱 주문 결제"], icon: pickupIcon(A) },
  { name: "POS", desc: ["카운터 주문과 카드·간편결제를 빠르게.", "판매 기록은 매출 조회로 바로 이어집니다."], badges: MEMBERSHIP, icon: g.posIcon(A) },
  { name: "KIOSK", desc: ["손님이 직접 주문하고 결제하니, 바쁜 시간에도 직원은 음식과 서비스에 집중합니다."], badges: MEMBERSHIP, icon: g.kioskIcon() },
  { name: "Table Order", desc: ["자리에 앉아 바로 주문하고, 추가 주문도 편하게. 직원을 부를 필요가 없습니다."], badges: MEMBERSHIP, icon: tableOrderIcon() },
  { name: "QR Order", desc: ["테이블 QR만 찍으면 앱 설치 없이 내 폰으로 주문 끝."], badges: MEMBERSHIP, icon: qrOrderIcon(A) },
];

const management = (A) => [
  { name: "레시피 관리", desc: ["레시피와 재료 사용량을 기록해 두면, 누가 만들어도 어느 매장에서도 같은 맛."], badges: ["사업자 구독", "점포 구독", "상품 정보 연동"], icon: g.recipeIcon(A, `${S}/recipe-bookmark.svg`) },
  { name: "발주 관리", desc: ["점포는 필요한 자재를 본사에 바로 주문하고 결제까지 끝냅니다."], badges: ["사업자 구독", "자재 정보 연동"], icon: g.orderIcon(A, `${S}/order-mail-back.svg`, `${S}/order-mail-front.svg`) },
  { name: "점포 재고 관리", desc: ["다 떨어지고 나서 알게 되는 재고는 이제 그만. 부족한 품목을 미리 확인하세요."], badges: ["점포 구독"], icon: g.inventoryIcon(A, `${S}/inventory.svg`) },
  { name: "대기 순번 관리", desc: ["줄 선 손님에게 차례를 알려드려, 기다리는 시간도 기분 좋게 만듭니다."], badges: ["점포 구독"], icon: waitingIcon(A) },
  { name: "예약 관리", desc: ["방문 예약을 날짜·시간별로 한눈에. 놓치는 예약 없이 손님을 맞이하세요."], badges: ["점포 구독"], icon: g.calendarIcon() },
];

const EXPANSIONS = [
  {
    name: "점포수 추가",
    desc: "사업자 구독 · 기본 점포 1개",
    icon: [
      { src: `${S}/store-1.svg`, width: 57.3333, height: 17.3333, left: 3.33, top: 3.33 },
      { src: `${S}/store-2.svg`, width: 46.6667, height: 30.6667, left: 8.67, top: 30 },
      { src: `${S}/plus.svg`, width: 18, height: 17, left: 23, top: 38 },
      { src: `${S}/store-4.svg`, width: 57.3333, height: 4, left: 3.33, top: 16.67 },
      { src: `${S}/store-5.svg`, width: 57.3333, height: 17.3333, left: 3.33, top: 16.67 },
    ],
  },
  // 사람 하나에 더하기 — 매장운영 「직원 초대」(두 사람)와 다른 그림이다(44:2195).
  {
    name: "직원수 추가",
    desc: "사업자·점포 구독 · 기본 직원 5명",
    icon: [
      { src: `${S}/staff-1.svg`, width: 41.3333, height: 20, left: 3.33, top: 38 },
      { src: `${S}/staff-2.svg`, width: 25.3333, height: 25.3333, left: 11.33, top: 6 },
      { src: `${S}/staff-3.svg`, width: 10.0005, height: 16.0005, left: 50, top: 42 },
      { src: `${S}/staff-4.svg`, width: 7.00053, height: 13.001, left: 45, top: 28 },
      { src: `${S}/plus.svg`, width: 18, height: 17, left: 43, top: 4 },
    ],
  },
  {
    name: "재무관리",
    desc: "사업자·점포 구독",
    icon: [
      { src: `${S}/finance-1.svg`, width: 57.3333, height: 57.3333, left: 3.33, top: 3.33 },
      { src: `${S}/finance-2.svg`, width: 25.3333, height: 25.3333, left: 19.33, top: 19.33 },
      { src: `${S}/finance-3.svg`, width: 4, height: 36, left: 30, top: 14 },
    ],
  },
];

// 이 섹션만 굵은 줄이 위에 온다.
const expansions = (A) =>
  `<section class="relative overflow-hidden bg-guest-ink py-[120px]">${g.cover(A, "store-operations/flow-bg.png", "object-cover object-bottom")}<span class="absolute inset-0 bg-guest-scrim"></span><div class="${g.FRAME} relative flex flex-col gap-[60px]"><h2 class="text-[52px] leading-[1.2] tracking-[-0.025em] text-white"><span class="block font-bold">확장 옵션</span><span class="block font-normal">매장이 커지는 만큼 한도를 늘리세요</span></h2><ul class="grid grid-cols-3 gap-[28px]">${EXPANSIONS.map(
    (e) =>
      `<li class="flex gap-[24px] rounded-[16px] bg-white/10 px-[48px] py-[42px]">${g.layeredIcon(A, e.icon)}<div class="flex flex-1 flex-col gap-[8px] leading-[1.5]"><h3 class="text-[24px] font-semibold text-[#fafafa]">${e.name}</h3><p class="text-[18px] text-[#ccc]">${e.desc}</p></div></li>`,
  ).join("")}</ul></div></section>`;

const SUBSCRIPTION = [
  { title: "기본은 점포 단위", desc: ["부가서비스는 점포마다 필요한 것만 구독합니다.", "발주 관리와 점포수 추가는 사업자(본사) 단위로 구독합니다."] },
  { title: "권한은 자동으로", desc: ["구독하는 순간 대표자와 해당 매장의 가맹점주에게 관리 권한이 자동으로 열립니다.", "따로 설정할 필요가 없습니다."] },
  { title: "계약 기간 유지", desc: ["구독 기간은 원하는 만큼 선택할 수 있고, 선택한 기간 동안은 중도 해약", "없이 유지됩니다."] },
];

// 회색 바탕 구역이 푸터에 바로 붙는다 — 화면은 page 의 flush 로 그린다. 카드는 흰 바탕 16px 모서리다(44:2217).
const subscription = () =>
  `<section class="bg-guest-surface pt-[120px] pb-[60px]"><div class="${g.FRAME} flex flex-col gap-[60px]">${g.sectionTitle("WHALE ERP", "구독 안내")}<ul class="grid grid-cols-3 gap-[16px]">${SUBSCRIPTION.map(
    (s) => `<li class="flex flex-col gap-[10px] rounded-[16px] border border-guest-line bg-white px-[32px] py-[40px]"><h3 class="text-[22px] leading-[1.5] font-extrabold text-guest-ink">${s.title}</h3><p class="text-[16px] leading-[1.5] text-guest-ink">${lines(s.desc)}</p></li>`,
  ).join("")}</ul></div></section>`;

export default ({ A, R }) => ({
  title: "부가서비스",
  head: g.head(A),
  html: g.page(A, R, {
    current: "home/add-on-services.html",
    main:
      serviceSection({ light: "판매용", desc: ["카운터, 테이블, 손님의 스마트폰까지.", "손님이 편한 방식으로 주문하고, 매출은 자동으로 한곳에 모입니다."], services: sales(A) }) +
      serviceSection({ light: "관리용", desc: ["보이지 않는 곳에서 매장을 받쳐주는 기능들.", "매장이 커지면 점포·직원 한도도 함께 늘리세요."], services: management(A), last: true }) +
      expansions(A) +
      subscription(),
    flush: true,
  }),
});
