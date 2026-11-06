// 로그인 전 메인. 앱 디자인 샘플 src/app/design/guest/page.tsx(Figma 로그인전_공유 · 로그인전_Main 44:2, 2026-11-06)를 옮겼다.
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

const { TRIM, HOVER, BUTTON_MOTION } = g;
const no = (i) => String(i + 1).padStart(2, "0");

// 세로선(11px)으로 나눈 짧은 낱말 줄. TRIM 은 flex 줄에 걸면 듣지 않아 낱말마다 건다.
// 사이 간격은 1920 에서 12px, 1720 에서 9px — 좁은 카드(가맹점주)에서도 한 줄에 든다.
const divided = (items, cls) =>
  `<div class="flex flex-wrap items-center gap-x-[clamp(9px,calc(1.5vw-16.8px),12px)] gap-y-[10px] leading-[1.6] font-medium whitespace-nowrap ${cls}">${items
    .map((item) => `<span class="${TRIM}">${item}</span>`)
    .join('<span class="h-[11px] w-px shrink-0 bg-current"></span>')}</div>`;

// 「세 단계」 아이콘(앱 guest-home.tsx 의 StepIcon). 회청 그라데이션 면 위에 반투명 유리 면(SVG)과 흰 + 를 겹친다. 82×74 칸 기준.
// 유리 SVG 는 안쪽 그림자 · 흐림 여백만큼 칸 밖으로 넘친다 — 왼쪽 · 위가 음수인 까닭이다.
const at = (A, src, w, h, left, top) => `<img alt="" src="${A}guest/home/${src}" class="absolute max-w-none" style="width:${w}px;height:${h}px;left:${left}px;top:${top}px">`;
const plus = (x, y) =>
  `<span class="absolute h-[2px] w-[17px] rounded-[3.815px] bg-white/90" style="left:${x}px;top:${y + 7}px"></span><span class="absolute h-[17px] w-[2px] rounded-[3.815px] bg-white/90" style="left:${x + 8}px;top:${y}px"></span>`;
const STEP_ICONS = [
  (A) =>
    `<span class="absolute top-0 left-[20.91px] h-[52.33px] w-[54.09px] rounded-[8.942px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]" style="background-image:linear-gradient(106deg, rgba(174,190,206,0.8) 8.98%, rgba(32,96,154,0.8) 94.82%)"></span>${at(A, "step-signup-glass.svg", 80.0558, 89.4992, -5.98, -1.21)}${plus(26.05, 33.94)}`,
  (A) => `${at(A, "step-store-back.svg", 68, 54.4419, 7, 0.98)}${at(A, "step-store-glass.svg", 79.9649, 82.5263, 1.02, 5.75)}${plus(32, 35.14)}`,
  (A) => `${at(A, "step-staff-person.svg", 56.49, 63.3369, 5.93, 5.25)}${at(A, "step-staff-glass.svg", 69.5281, 70.1473, 21.74, 15.31)}${plus(48, 41.14)}`,
];
const stepIcon = (A, i) => `<span class="relative block h-[74px] w-[82px] shrink-0">${STEP_ICONS[i](A)}</span>`;

const HIGHLIGHTS = [
  { no: "01", title: "점포 1개", desc: "가입 즉시 사용" },
  { no: "02", title: "직원 5명", desc: "기본 제공" },
  { no: "03", title: "부가서비스 10종", desc: "필요할 때 더하는 부가서비스" },
  { no: "04", title: "All in One", desc: "매장 운영의 모든 것" },
];

// 머리말(110px)이 Billboard 위에 겹치도록 그만큼 끌어올린다.
// 고래는 정사각 그림을 677×375 에 늘여 채운 것이 시안이다 — object-cover 로 바꾸면 고래가 잘린다.
const billboard = (A, R) => `<section class="relative -mt-[110px] h-[1080px] overflow-hidden">${g.cover(A, "billboard-bg.png", "object-cover", true)}
<div class="absolute top-1/2 left-1/2 h-[375px] w-[677px] -translate-1/2">${g.cover(A, "billboard-whale.png", "", true)}</div>
<div class="absolute top-[478px] left-1/2 flex w-[1520px] -translate-x-1/2 flex-col gap-[80px]"><div class="flex items-end justify-between"><div class="flex w-[445px] flex-col gap-[48px]"><p class="flex flex-col gap-[23px] font-[family-name:var(--font-rem)] font-black text-transparent"><span class="bg-gradient-to-r from-[rgba(58,86,112,0.5)] to-[rgba(58,86,112,0.22)] bg-clip-text text-[70px] tracking-[-0.025em] ${TRIM}">WHALE</span><span class="bg-gradient-to-r from-[rgba(58,86,112,0.8)] to-[rgba(58,86,112,0.36)] bg-clip-text text-[216px] tracking-[-0.025em] ${TRIM}">ERP</span></p><div class="flex flex-col gap-[24px] pl-[12px] text-guest-navy"><p class="font-[family-name:var(--font-inter-tight)] text-[32px] leading-[1.5] font-bold tracking-normal capitalize ${TRIM}">your smart choice</p><p class="text-[17px] leading-[1.4] ${TRIM}">매장에서 챙겨야 할 일, 이제 하나로 끝내세요.<br>직원 계약부터 매출·재무, 가맹점 관리까지 식당·카페 사장님을 위한<br>올인원 플랫폼입니다.</p></div></div>
<div class="flex gap-[8px]"><a href="${link(R, "auth/signup.html")}" class="flex h-[48px] w-[176px] items-center justify-center gap-[12px] rounded-[6px] border border-transparent bg-[rgba(58,86,112,0.9)] text-[18px] leading-[1.5] font-semibold text-white hover:border-guest-navy hover:bg-white hover:text-guest-navy ${BUTTON_MOTION}">무료로 시작하기${g.arrow(A)}</a><a href="${link(R, "home/inquiry.html")}" class="flex h-[48px] w-[100px] items-center justify-center rounded-[6px] border border-transparent bg-white/90 text-[18px] leading-[1.5] font-semibold text-guest-navy hover:border-guest-navy hover:bg-white ${BUTTON_MOTION}">도입문의</a></div></div>
<ul class="flex justify-center gap-[280px] border-t border-[rgba(130,151,168,0.15)] pt-[24px] pl-[2px] text-guest-navy">${HIGHLIGHTS.map(
  (h) => `<li class="flex gap-[10px]"><span class="text-[16px] leading-[2.3] font-bold">${h.no}</span><span class="leading-[1.6]"><strong class="block text-[24px] font-bold">${h.title}</strong><span class="text-[18px]">${h.desc}</span></span></li>`,
).join("")}</ul></div></section>`;

// 아이콘은 정사각 그림을 칸 크기(폭은 카드마다 다르고 높이 148)에 늘여 채운 것이 시안이다.
const FEATURES = [
  { title: "매장운영", href: "home/store-operations.html", icon: ["feature-store.png", 169], lines: ["매장·장비 정보를 한곳에", "종이 없는 근로계약·급여명세서", "근무표 공유와 QR 출퇴근"] },
  { title: "재무관리", icon: ["feature-finance.png", 156], lines: ["통장 입출금을 한눈에", "현금 거래까지 빠짐없이", "돈이 나가는 곳을 비율로"] },
  { title: "프랜차이즈", icon: ["feature-franchise.png", 147], lines: ["온라인으로 끝내는 가맹계약", "신메뉴·가격 한 번에 배포", "현장 점검 결과 바로 공유"] },
  { title: "부가서비스", href: "home/add-on-services.html", icon: ["feature-add-on.png", 164], lines: ["POS · KIOSK 주문·결제", "테이블·픽업·QR 주문", "발주·재고·레시피 관리"] },
];

const features = (A, R) => `<section class="${g.FRAME} flex flex-col gap-[60px] pt-[160px] pb-[80px]">${g.sectionTitle("매장 운영,", "네 가지면 충분합니다")}<div class="grid grid-cols-4 gap-[16px]">${FEATURES.map(
  (f) => `<div class="flex flex-col gap-[32px] rounded-[16px] bg-[#f1f7fc] py-[38px] pl-[72px] text-guest-navy">${g.gimg(A, `home/${f.icon[0]}`, f.icon[1], 148, "max-w-none")}<div class="flex flex-col items-start"><h3 class="text-[32px] leading-[1.6] font-bold">${f.title}</h3><p class="pb-[20px] text-[18px] leading-[1.7]">${f.lines.map((l) => `<span class="block">${l}</span>`).join("")}</p>${g.button(A, "자세히 보기", { tone: "steel", href: f.href ? link(R, f.href) : "#", arrow: true })}</div></div>`,
).join("")}</div></section>`;

const PERSONAS = [
  {
    head: "매장 하나를 운영해요",
    kind: "1인·소규모 매장",
    pitch: ["혼자 챙기기 벅찬 매장 일,", "한 곳에서 끝내세요"],
    features: ["전자 근로계약서와 급여명세서", "근무표 공유와 QR 출퇴근", "오늘 매출 한눈에 확인"],
    services: ["POS", "QR Order", "예약 관리"],
    cta: "매장운영 상세보기",
    href: "home/store-operations.html",
  },
  {
    head: "여러 매장을 직접 운영해요",
    kind: "직영 다점포",
    pitch: ["매장이 늘어도,", "관리는 한 화면에서"],
    features: ["매장별 매출 비교와 통계", "매장별 직원·근무 현황", "매장별 관리자 지정과 권한 분리"],
    services: ["점포수 추가", "직원수 추가", "재무관리"],
    cta: "재무관리 자세히 보기",
  },
  {
    head: "프랜차이즈 본사예요",
    kind: "가맹 사업 운영",
    pitch: ["가맹점이 늘어도,", "본사는 가벼워집니다"],
    features: ["온라인으로 끝내는 가맹계약", "신메뉴·가격 전 가맹점 일괄 배포", "가맹점 점검과 정보공개서 자료"],
    services: ["발주 관리", "레시피 관리", "점포수 추가"],
    cta: "프랜차이즈 자세히 보기",
  },
  {
    head: "가맹점을 운영해요",
    kind: "가맹점주",
    pitch: ["본사와 연결된 매장,", "운영은 더 간단하게"],
    features: ["본사가 발급한 계정으로 바로 로그인", "본사 메뉴·가격이 매장에 그대로", "직원 계약·출퇴근은 직접 관리"],
    services: ["POS · KIOSK", "점포 재고 관리", "대기 순번 관리"],
    cta: "본사 계정으로 로그인",
    href: "auth/login.html",
  },
];

// 내용은 띠 바로 아래부터 채우고 버튼만 바닥에 붙인다. 어느 카드의 줄이 꺾여도 제목 줄과 버튼 줄이 카드끼리 맞는다.
// pitch 글자는 카드 안쪽 폭에 맞춰 1920 에서 32px, 1720 에서 27.6px 로 줄인다 — 안 줄이면 첫 줄이 넘쳐 세 줄이 된다.
const personas = (A, R) => `<section class="bg-[#fafafa] pt-[125px] pb-[80px]"><div class="${g.FRAME} flex flex-col gap-[60px]">${g.sectionTitle("당신은,", "어떤 사장님이신가요?")}<div class="grid grid-cols-4 gap-x-[16px] gap-y-[38px]">${PERSONAS.map(
  (p, i) => `<div class="flex gap-[10px] pl-[2px] text-guest-ink"><span class="text-[16px] leading-[2.3] font-bold">${no(i)}</span><span class="leading-[1.6]"><strong class="block text-[24px] font-bold">${p.head}</strong><span class="text-[18px]">${p.kind}</span></span></div>`,
).join("")}${PERSONAS.map(
  (p) => `<article class="flex flex-col rounded-b-[6px] border border-guest-line bg-white"><span class="h-[6px] bg-guest-navy"></span><div class="flex flex-1 flex-col gap-[30px] px-[34px] pt-[80px] pb-[34px]"><div class="flex flex-col gap-[25px] font-semibold text-guest-navy"><p class="text-[16px] leading-[1.6] ${TRIM}">${p.kind}</p><p class="text-[clamp(26px,calc(2.222vw-10.67px),32px)] leading-[1.3] ${TRIM}">${p.pitch[0]}<br>${p.pitch[1]}</p></div><div class="flex flex-1 flex-col gap-[32px]"><div class="flex flex-col gap-[24px] text-[16px]"><div class="flex flex-col gap-[22px]"><p class="leading-[1.6] font-semibold text-guest-ink ${TRIM}">이런 기능부터 써보세요</p><p class="leading-[1.6] text-guest-body ${TRIM}">${p.features.map((l) => `<span class="block">${l}</span>`).join("")}</p></div><div class="flex flex-col gap-[22px] border-t border-[#e7e7e7] pt-[24px]"><p class="leading-[1.6] font-semibold text-guest-ink ${TRIM}">함께 쓰면 좋은 부가서비스</p>${divided(p.services, "text-guest-body")}</div></div><div class="mt-auto flex">${g.button(A, p.cta, { tone: "navy", href: p.href ? link(R, p.href) : "#", arrow: true, grow: true })}</div></div></div></article>`,
).join("")}</div></div></section>`;

const CONNECTIONS = [
  {
    label: "01 BUSINESS PARTNER",
    title: "사장님이 가입하면",
    desc: ["대표자 계정에 모든 관리 권한이 자동으로 주어집니다.", "점장·가맹점주 계정도 필요한 만큼 만들 수 있어요."],
    tags: ["대표자 권한", "관리자 추가", "가맹주 계정"],
    photo: "connect-partner.png",
  },
  {
    label: "02 STORE",
    title: "내 매장이 등록되고",
    desc: ["직영점도 가맹점도 같은 화면에서 관리합니다.", "가맹계약서만 연결하면 가맹점 관리가 바로 시작됩니다."],
    tags: ["직영점", "가맹점", "시설물·점검"],
    photo: "connect-store.png",
  },
  {
    label: "03 STAFF & CUSTOMER",
    title: "직원과 손님이 이어집니다",
    desc: ["직원은 전용 앱으로 계약서 서명과 출퇴근을, 손님은 키오스크·QR로", "주문과 결제를 편하게."],
    tags: ["직원 앱", "POS·KIOSK", "Pick up·QR Order"],
    photo: "connect-staff.png",
  },
];

// 사진 뒤에 옅은 흰 면을 깔아, 사진이 덜 찬 곳도 어두운 바탕과 갈린다.
const connections = (A) => `<section class="bg-[#1f1f1f] py-[120px]"><div class="${g.FRAME} flex flex-col gap-[80px]">${g.sectionTitle("가입 한 번으로,", "매장 전체가 연결됩니다", true)}<div class="grid grid-cols-3 gap-[34px]">${CONNECTIONS.map(
  (c) => `<div class="flex flex-col gap-[34px]"><div class="relative flex h-[348px] items-end overflow-hidden rounded-[16px] bg-white/10 pb-[22px] pl-[26px]">${g.cover(A, `home/${c.photo}`)}<span class="relative text-[24px] leading-[1.6] font-bold tracking-normal text-[#f5f5f5]">${c.label}</span></div><div class="flex flex-col gap-[8px] pl-[2px] text-[17px] text-[#999]"><h3 class="text-[24px] leading-[1.6] font-semibold text-[#f5f5f5]">${c.title}</h3><p class="leading-[1.5]">${c.desc[0]}<br>${c.desc[1]}</p>${divided(c.tags, "pt-[8px]")}</div></div>`,
).join("")}</div></div></section>`;

// 시안이 줄을 직접 나눈 설명은 줄마다 나눠 둔다.
const STEPS = [
  { title: "사업자 가입하기", desc: ["휴대폰 본인인증과 계정 정보만 입력하면 끝.", "사업자등록번호는 나중에 입력해도 됩니다."] },
  { title: "첫 매장 등록", desc: ["매장 이름, 주소, 사업자등록번호를 입력하면 첫 매장이 열리고 대표자 계정에 관리 권한이 주어집니다."] },
  { title: "직원 초대", desc: ["직원 휴대폰으로 초대 링크를 보내면, 앱 가입부터", "근로계약서 서명까지 자연스럽게 이어집니다."] },
];

// 시안의 줄바꿈은 1920 폭에서만 둔다. 좁으면 그 줄이 한 번 더 꺾여 「끝.」 같은 낱말이 홀로 남는다.
const steps = (A, R) => `<section class="bg-[#fafafa] pt-[120px] pb-[80px]"><div class="${g.FRAME} flex flex-col gap-[60px]">${g.titleRow("시작은", "세 단계면 충분합니다", g.button(A, "가입하고 시작하기", { tone: "navy", href: link(R, "auth/signup.html"), arrow: true }))}<ol class="grid grid-cols-3 gap-[24px]">${STEPS.map(
  (s, i) => `<li class="flex items-end gap-[42px] rounded-[16px] border border-guest-line bg-white px-[42px] pt-[48px] pb-[42px]">${stepIcon(A, i)}<div class="flex flex-1 flex-col items-start gap-[26px]"><span class="rounded-full bg-guest-step px-[14px] py-[12px] text-[16px] leading-[1.5] font-bold tracking-normal text-white ${TRIM}">STEP ${no(i)}</span><div class="flex flex-col gap-[20px] pl-[4px] leading-[1.5]"><h3 class="text-[24px] font-semibold text-guest-navy ${TRIM}">${s.title}</h3><p class="text-[17px] text-guest-body ${TRIM}">${s.desc.join(' <br class="hidden min-[1920px]:inline">')}</p></div></div></li>`,
).join("")}</ol></div></section>`;

const PLANS = [
  {
    kicker: "STARTER",
    cta: "사업자 회원가입",
    href: "auth/signup.html",
    name: "기본 제공",
    summary: "가입하면 바로 쓰는 기본 범위",
    listTitle: "가입 시 제공",
    note: null,
    items: ["점포 1곳 · 직원 5명", "점포 관리 · 점검 · 시설물", "근로계약 · 급여명세서 · 출퇴근", "매출 조회 · 직원 전용 앱"],
  },
  {
    kicker: "ADD-ONS",
    cta: "부가서비스 둘러보기",
    href: "home/add-on-services.html",
    name: "부가서비스",
    summary: "매장에 필요한 서비스만 골라서",
    listTitle: "점포별 월 구독",
    note: "요금 확정 예정",
    items: ["POS · KIOSK · Table Order", "Pick up Order · QR Order", "레시피 · 발주 · 재고 관리", "대기 순번 · 예약 관리"],
  },
];

// 「요금제 자세히 보기」는 요금제 화면이 없어 시안에서 감췄다(2026-11-06).
const plans = (A, R) => `<section class="${g.FRAME} flex flex-col gap-[60px] pt-[120px] pb-[80px]">${g.sectionTitle("처음엔 가볍게,", "필요할 때 더하세요")}<div class="grid grid-cols-2 gap-[16px]">${PLANS.map(
  (plan) => `<article class="flex flex-col gap-[48px] rounded-b-[6px] border border-guest-line pb-[34px]"><span class="h-[6px] bg-guest-navy"></span><div class="flex flex-col gap-[34px] px-[34px]"><div><div class="flex items-center justify-between gap-[18px]"><p class="text-[16px] leading-[1.6] font-semibold tracking-normal text-guest-navy ${TRIM}">${plan.kicker}</p>${g.button(A, plan.cta, { tone: "outline", href: plan.href ? link(R, plan.href) : "#", arrow: true })}</div><div class="flex flex-col gap-[22px] text-guest-navy"><h3 class="text-[32px] leading-[1.3] font-semibold ${TRIM}">${plan.name}</h3><p class="text-[16px] leading-[1.6] font-medium ${TRIM}">${plan.summary}</p></div></div><div class="flex flex-col gap-[18px]"><div class="flex h-[17px] items-center gap-[14px] whitespace-nowrap"><h4 class="text-[24px] leading-[1.6] font-semibold text-guest-ink ${TRIM}">${plan.listTitle}</h4>${plan.note ? `<span class="text-[16px] leading-[1.5] font-medium text-[#e0914a]">${plan.note}</span>` : ""}</div><ul class="flex flex-col gap-[12px] border-t border-guest-list-line pt-[24px] text-[17px] leading-[1.5] text-[#222]">${plan.items.map(
    (item) => `<li class="flex items-center gap-[11px] px-px">${g.gimg(A, "check-circle.svg", 18, 18)}${item}</li>`,
  ).join("")}</ul></div></div></article>`,
).join("")}</div></section>`;

// 시안에 답변이 있는 질문은 둘째 하나뿐이다. 나머지 답변은 기획이 정하면 채운다.
const FAQS = [
  { q: "사업자등록번호 없이도 가입할 수 있나요?", a: null },
  {
    q: "가입하면 바로 쓸 수 있는 범위가 있나요?",
    a: "네, 가입할 때는 필요하지 않습니다. 다만 매장을 등록하거나, 직원을 고용하거나, 세금계산서 발행이 필요한 부가서비스를 구독할 때는 사업자등록번호를 입력해야 합니다.",
  },
  { q: "직원도 앱을 설치해야 하나요?", a: null },
  { q: "부가서비스는 중간에 해지할 수 있나요?", a: null },
];

const NEWS = [
  { badge: { text: "안내", cls: "bg-[#f2f6ff] text-[#366fe3]" }, title: "WHALE ERP 1차 서비스 오픈 안내" },
  { badge: { text: "점검", cls: "bg-[#e7f7f1] text-[#11b076]" }, title: "정기 시스템 점검 (11/05 02:00~04:00)" },
  { badge: null, title: "개인정보처리방침 개정 안내" },
  { badge: null, title: "Pick up Order 서비스 출시 예정 안내" },
  { badge: null, title: "직원 전용 앱 출퇴근 QR 기능 안내" },
  { badge: null, title: "추석 연휴 고객센터 운영 안내" },
];

const boardHead = (A, text, action, href = "#") =>
  `<div class="flex items-center justify-between gap-[18px]"><p class="text-[22px] leading-[1.6] font-medium text-guest-ink ${TRIM}">${text}</p>${g.button(A, action, { tone: "outline", href, arrow: true })}</div>`;

// FAQ 는 name 을 같이 준 <details> 라 하나를 열면 나머지가 닫힌다(앱과 같은 네이티브 동작).
const boards = (A, R) => `<section class="bg-[#fafafa] pt-[120px] pb-[60px]"><div class="${g.FRAME} grid grid-cols-2 gap-[16px]"><div class="flex flex-col gap-[60px]">${g.sectionTitle("시작 전에,", "가장 많이 묻는 질문")}<div class="flex flex-1 flex-col gap-[34px] rounded-[6px] border border-guest-line bg-white p-[34px]">${boardHead(A, "궁금한 점이 더 있다면 언제든 편하게 물어보세요.", "전체 질문 보기", link(R, "home/notices.html#faq"))}<div class="flex flex-col gap-[8px]">${FAQS.map(
  (faq) => `<details name="guest-faq"${faq.a !== null ? " open" : ""} class="group rounded-[3px] bg-[#fafafa] pb-[4px] open:bg-[#f5f5f5]"><summary class="flex cursor-pointer px-[20px] pt-[22px] pb-[18px] list-none items-center gap-[11px] text-[17px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy ${HOVER} [&::-webkit-details-marker]:hidden"><span class="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-guest-navy text-[18px] font-bold tracking-normal text-white">Q</span><span class="flex-1">${faq.q}</span>${g.gimg(A, "faq-plus.svg", 28, 28, "group-open:hidden")}${g.gimg(A, "faq-close.svg", 28, 28, "hidden group-open:block")}</summary>${faq.a ? `<p class="pr-[20px] pb-[18px] pl-[60px] text-[16px] leading-[1.5] text-guest-sub">${faq.a}</p>` : ""}</details>`,
).join("")}</div></div></div><div class="flex flex-col gap-[60px]">${g.sectionTitle("Whale ERP", "새로운 소식 안내")}<div class="flex flex-1 flex-col gap-[32px] rounded-[6px] border border-guest-line bg-white p-[34px]">${boardHead(A, "Whale ERP의 새로운 소식을 알려 드립니다.", "전체 보기", link(R, "home/notices.html"))}<ul class="border-t border-guest-list-line text-[17px] leading-[1.5]">${NEWS.map(
  (n) => `<li class="flex items-center gap-[8px] border-b border-guest-list-line py-[18px] last:border-b-0">${n.badge ? `<span class="flex h-[30px] items-center rounded-[3px] px-[10px] text-[15px] leading-[1.4] font-semibold ${n.badge.cls}">${n.badge.text}</span>` : ""}<a href="${link(R, "home/notice-detail.html")}" class="flex-1 text-guest-ink hover:text-guest-navy ${HOVER}">${n.title}</a><span class="text-guest-sub">2026.10.30</span></li>`,
).join("")}</ul></div></div></div></section>`;

export default ({ A, R }) => {
  const main = billboard(A, R) + features(A, R) + personas(A, R) + connections(A) + steps(A, R) + plans(A, R) + boards(A, R);
  return { title: "비로그인 홈", head: g.head(A), html: g.page(A, R, { current: "home/index.html", main, flush: true }) };
};
