// 매장운영 소개. 앱 디자인 샘플 src/app/design/guest/store-operations/page.tsx(Figma 로그인전_Sub 1:688)를 옮겼다.
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

const S = "store-operations";

const MOMENTS = [
  {
    before: { title: "계약서 쓸 틈도 없이 시작된 첫 출근", desc: "첫 출근은 했는데, 계약서는 아직" },
    after: { title: "출근 전, 휴대폰으로 계약서 서명 완료", desc: "휴대폰으로 간편하게 근로계약서 서명을 마치세요." },
    arrow: "arrow-down-circle.svg",
  },
  {
    before: { title: "파트타이머 급여 계산할 때마다 한숨", desc: "근무시간 확인부터 급여 계산까지 막막" },
    after: { title: "출퇴근 기록 그대로, 정확한 급여명세서", desc: "기록된 근무시간을 반영해 급여 내역을 정리하세요." },
    arrow: "arrow-down-circle.svg",
  },
  {
    before: { title: "고장 난 장비, 지난 수리 기록은 어디에?", desc: "또 고장 난 장비, 지난 수리 기록은 어디에?" },
    after: { title: "장비별 수리 이력으로 바로 대응", desc: "이전 수리 내역을 확인하고 고장에 빠르게 대응하세요." },
    arrow: "arrow-down-circle-last.svg",
  },
];

const momentBox = (kicker, { title, desc }, after) =>
  `<div class="flex flex-col gap-[10px] pt-[34px] pr-[34px] pb-[42px] pl-[44px] ${after ? "bg-guest-slate text-white" : "bg-guest-card text-guest-slate"}"><div class="flex flex-col gap-[4px]"><p class="text-[16px] leading-[1.5] font-semibold">${kicker}</p><p class="text-[28px] leading-[1.4] font-bold">${title}</p></div><p class="text-[16px] leading-[1.5] ${g.TRIM}">${desc}</p></div>`;

const moments = (A, R) =>
  `<section class="flex flex-col gap-[60px] px-[80px] pt-[120px]">${g.titleRow(
    "사장님,",
    "이런 순간 있으셨죠?",
    `<div class="flex gap-[8px]">${g.button(A, "사업자 회원가입", { tone: "navy", href: link(R, "auth/signup.html"), arrow: true })}${g.button(A, "도입문의", { tone: "soft", href: link(R, "home/inquiry.html") })}</div>`,
  )}<div class="grid grid-cols-3 gap-px overflow-hidden rounded-[16px]">${MOMENTS.map(
    (m) =>
      `<div class="relative flex flex-col">${momentBox("BEFORE", m.before, false)}${momentBox("WHALE ERP 도입 후", m.after, true)}${g.gimg(A, `${S}/${m.arrow}`, 66, 66, "absolute top-[calc(50%+9px)] left-1/2 -translate-1/2")}</div>`,
  ).join("")}</div></section>`;

const FEATURES = [
  {
    id: "store",
    tab: "점포 관리",
    no: "01 점포 관리",
    title: ["매장 정보,", "찾지 말고 바로 꺼내세요"],
    lead: ["사업자번호, 계약 기간, 평수와 좌석 수까지 한곳에 정리됩니다.", "서류함을 뒤지던 시간이 사라집니다."],
    points: ["운영·폐점 상태까지 한눈에 보는 점포 정보", "가맹계약 기간과 상태 정리", "평수·좌석 수·주요 장비 기록"],
  },
  {
    id: "inspection",
    tab: "점검 · 시설물",
    no: "02 점검 · 시설물",
    title: ["고장 나기 전에,", "점검 기록이 먼저 알려줍니다"],
    lead: ["위생·운영 점검 결과를 기록하고 직원과 바로 공유하세요.", "장비별 수리 이력이 남아 같은 고장에 두 번 당황하지 않습니다."],
    points: ["템플릿으로 빠르게 끝내는 점검표", "시설물·장비 정보를 한곳에", "수리 이력과 수리비까지 재무에 연결"],
  },
  {
    id: "contract",
    tab: "근로계약 · 급여",
    no: "03 근로계약 · 급여",
    title: ["계약서와 급여명세서,", "더는 미루지 마세요"],
    lead: ["직원 앱으로 근로계약서를 보내면 직원이 휴대폰으로 바로 서명합니다.", "급여명세서도 빠짐없이 발급해 노무 걱정을 덜어드립니다."],
    points: ["정직원·파트타이머 전자 근로계약서", "급여명세서·연장근무 수당명세서", "직원 앱으로 명세서 바로 발송"],
  },
  {
    id: "attendance",
    tab: "근무 · 출퇴근",
    no: "04 근무 · 출퇴근",
    title: ["몇 시에 왔더라?", "이제 기록이 답합니다"],
    lead: ["직원은 매장 QR만 찍으면 출퇴근 끝.", "근무표와 실제 출근 기록을 나란히 보고, 오늘 할 일은", "TO-DO로 전달하세요."],
    points: ["주간 근무 스케줄 공유", "QR 한 번으로 출퇴근 기록", "직원별 TO-DO 리스트"],
  },
];

const lines = (list) => list.map((l) => `<span class="block">${l}</span>`).join("");

// 바로가기(앱 feature-shortcuts.tsx). 부드럽게 내려가는 동작은 guest.js 의 data-scroll-to 가 맡는다.
const shortcuts = () =>
  `<nav class="flex gap-[8px]">${FEATURES.map(
    (f) =>
      `<button type="button" data-scroll-to="${f.id}" class="flex h-[48px] items-center rounded-[6px] border border-guest-button-line bg-white px-[18px] text-[18px] leading-[1.5] font-semibold text-guest-navy hover:border-guest-navy ${g.BUTTON_MOTION}">${f.tab}</button>`,
  ).join("")}</nav>`;

// 사진과 글이 번갈아 좌우를 바꾼다. 바로가기로 내려왔을 때 고정 머리말(110px)에 가리지 않게 띄운다.
const features = (A) =>
  `<section class="flex flex-col gap-[60px] px-[80px] py-[120px]">${g.titleRow("매장운영,", "이렇게 달라집니다", shortcuts())}<div class="flex flex-col gap-[120px]">${FEATURES.map(
    (f, i) =>
      `<article id="${f.id}" class="flex scroll-mt-[130px] justify-center gap-[100px] ${i % 2 ? "flex-row-reverse" : ""}"><div class="relative h-[540px] w-[400px] shrink-0">${g.cover(A, `${S}/feature-photo.jpg`)}</div><div class="flex flex-col gap-[64px] pt-[44px] text-guest-ink"><span class="h-[5px] w-[80px] bg-guest-ink"></span><div class="flex flex-col gap-[32px]"><div class="flex flex-col gap-[18px]"><div class="flex flex-col gap-[8px]"><p class="text-[20px] leading-[1.5] font-semibold">${f.no}</p><h3 class="text-[34px] leading-[1.4] font-bold">${lines(f.title)}</h3></div><p class="text-[18px] leading-[1.5] font-semibold ${g.TRIM}">${lines(f.lead)}</p></div><p class="text-[18px] leading-[1.5] text-guest-body ${g.TRIM}">${lines(f.points)}</p></div></div></article>`,
  ).join("")}</div></section>`;

const FLOW = [
  { title: "01 직원 초대", desc: "카톡·문자로 가입 링크 전송", icon: g.STAFF_ICON },
  { title: "02 계약서 서명", desc: "지원자 휴대폰으로 바로 전자서명", icon: [{ src: `${S}/flow-sign.svg`, width: 64, height: 64, left: 0, top: 0 }] },
  {
    title: "03 근무표 공유",
    desc: "나의 이번 주 스케줄을 한눈에",
    icon: [
      { src: `${S}/flow-schedule-1.svg`, width: 57.3682, height: 30.6686, left: 3.34, top: 3.33 },
      { src: `${S}/flow-schedule-2.svg`, width: 57.3334, height: 17.3282, left: 3.33, top: 30 },
      { src: `${S}/flow-schedule-2.svg`, width: 57.3334, height: 17.3282, left: 3.33, top: 43.33 },
    ],
  },
  {
    title: "04 QR 출퇴근",
    desc: "도착 후 매장 QR만 찍으면 끝",
    icon: [
      { src: `${S}/flow-clock-1.svg`, width: 57.3333, height: 57.3333, left: 3.33, top: 3.33 },
      { src: `${S}/flow-clock-2.svg`, width: 14.6671, height: 25.3338, left: 30, top: 14 },
    ],
  },
  { title: "05 급여 명세서", desc: "근무 기록 그대로 정확하게", icon: [{ src: `${S}/flow-payslip.svg`, width: 64, height: 64, left: 0, top: 0 }] },
];

const flow = (A) =>
  `<section class="relative flex flex-col gap-[60px] overflow-hidden bg-guest-ink px-[80px] py-[120px]">${g.cover(A, `${S}/flow-bg.png`, "object-cover object-bottom")}<span class="absolute inset-0 bg-[rgba(37,37,37,0.8)]"></span><div class="relative">${g.sectionTitle("채용부터 월급날까지,", "끊김 없이", true)}</div><ol class="relative grid grid-cols-5 gap-[32px]">${FLOW.map(
    (s) =>
      `<li class="flex flex-col items-center gap-[24px] rounded-[16px] border border-white/10 py-[42px] text-center backdrop-blur-[12px]">${g.layeredIcon(A, s.icon)}<div class="flex flex-col gap-[8px] leading-[1.5]"><h3 class="text-[24px] font-semibold text-[#fafafa]">${s.title}</h3><p class="text-[18px] text-[#ccc]">${s.desc}</p></div></li>`,
  ).join("")}</ol></section>`;

const addOns = (A, R) => {
  const items = [
    { name: "KIOSK", desc: "고객이 직접 터치로 주문·결제하는 비대면 무인 단말기", icon: g.kioskIcon() },
    { name: "재고 관리", desc: "매장 내 식자재, 소모품 등의 재고를 실시간 확인 및 관리", icon: g.inventoryIcon(A, `${S}/addon-inventory.svg`) },
    { name: "발주 관리", desc: "필요한 식자재나 물품을 본사나 거래처별로 손쉽게 발주", icon: g.orderIcon(A, `${S}/addon-mail-back.svg`, `${S}/addon-mail-front.svg`) },
    { name: "레시피 관리", desc: "가맹점의 메뉴 정보와 레시피를 본사에서 관리", icon: g.recipeIcon(A, `${S}/addon-bookmark.svg`) },
  ];
  return `<section class="flex flex-col gap-[60px] px-[80px] pt-[120px]">${g.titleRow(
    "함께 쓰면",
    "더 편해지는 부가서비스",
    g.button(A, "부가서비스 전체 보기", { tone: "navy", href: link(R, "home/add-on-services.html"), arrow: true }),
  )}<ul class="grid grid-cols-4 gap-[16px]">${items
    .map(
      (it) =>
        `<li class="flex flex-col gap-[4px] rounded-[16px] border border-guest-line bg-white px-[42px] py-[40px] shadow-[0_8px_24px_rgba(0,0,0,0.02)]"><span class="flex h-[88px] items-center pb-[14px]">${it.icon}</span><div class="flex flex-col gap-[10px] leading-[1.5]"><h3 class="text-[22px] font-bold text-[#222]">${it.name}</h3><p class="text-[16px] text-guest-body">${it.desc}</p></div></li>`,
    )
    .join("")}</ul></section>`;
};

export default ({ A, R }) => ({
  title: "매장운영",
  head: g.head(A),
  html: g.page(A, R, { current: "home/store-operations.html", main: moments(A, R) + features(A) + flow(A) + addOns(A, R) }),
});
