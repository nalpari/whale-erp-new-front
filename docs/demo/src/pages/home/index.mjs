// 로그인 전 메인. 앱 디자인 샘플 src/app/design/guest/page.tsx(Figma 로그인전_공유 · 로그인전_Main 44:2, 2026-11-06)를 옮겼다.
import * as g from "../../guest.mjs";
import { link } from "../../site.mjs";

const { TRIM, HOVER, BUTTON_MOTION } = g;
const no = (i) => String(i + 1).padStart(2, "0");

// 「세 단계」 아이콘 — 역할 섹션과 같은 선 아이콘(가입 · 매장 · 알림톡 초대). 번호는 STEP 알약 대신 「01」 숫자(2026-11-09 사용자 지정).
const STEP_ICONS = [
  "<circle cx=\"19\" cy=\"15\" r=\"7\"/><path d=\"M6 40c0-7.2 5.8-13 13-13 3.4 0 6.5 1.3 8.8 3.4\"/><path d=\"M37 28v12M31 34h12\"/>",
  "<path d=\"M7 18l3-10h28l3 10\"/><path d=\"M7 18c0 3 2.5 5 5.5 5s5.5-2 5.5-5c0 3 2.5 5 6 5s6-2 6-5c0 3 2.5 5 5.5 5S41 21 41 18\"/><path d=\"M10 23v17h28V23\"/><path d=\"M20 40v-9h8v9\"/>",
  "<path d=\"M24 8C13.5 8 5 14.7 5 23c0 5.3 3.5 10 8.8 12.6L12 42l7.6-4.6c1.4.2 2.9.4 4.4.4 10.5 0 19-6.7 19-15S34.5 8 24 8z\"/><circle cx=\"16\" cy=\"23\" r=\"1.6\"/><circle cx=\"24\" cy=\"23\" r=\"1.6\"/><circle cx=\"32\" cy=\"23\" r=\"1.6\"/>"
];
const stepIcon = (A, i) => `<svg aria-hidden="true" viewBox="0 0 48 48" class="h-[56px] w-[56px] shrink-0 text-guest-navy-soft" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${STEP_ICONS[i]}</svg>`;

// 섹션 위아래 여백은 모두 100px 로 같다. 카드 제목 · 상자 머리 글자는 바탕색과 상관없이 남색, 섹션 제목만 먹색(2026-11-10 사용자 지정).
// 메인은 본문 폭을 1520px 로 묶는다 — 공통 FRAME(최대 1760px)은 100% 배율에서 양옆이 꽉 차 보였다(앱 guest-home.tsx, 2026-11-09 사용자 지정).
const FRAME = "mx-auto w-full max-w-[1680px] px-[80px]";

const HIGHLIGHTS = [
  { no: "01", title: "점포 1개 운영", desc: "무료 제공" },
  { no: "02", title: "직원 5명 초대", desc: "무료 제공" },
  { no: "03", title: "직원 전용 앱", desc: "무료 제공" },
  { no: "04", title: "관리자 등록", desc: "무료 제공" },
  { no: "05", title: "부가서비스", desc: "순차 오픈 예정, 필요한 만큼 구독" },
];

// 머리말(110px)이 Billboard 위에 겹치도록 그만큼 끌어올린다. 머리말 아래 빈 하늘 100px 를 잘라 1080 → 980.
// 고래는 정사각 그림을 677×375 에 늘여 채운 것이 시안이다 — object-cover 로 바꾸면 고래가 잘린다. 가운데에서 오른쪽으로 200px 옮겼다.
// 글 묶음은 머리말 아래부터 바닥까지 가운데에 둬 위 · 아래 여백을 같게 한다. 슬로건은 영문 WHALE ERP 자리(윗줄 48 · 아랫줄 86px).
// 슬로건 칠은 배경을 글자 모양으로 오린 것이라 TRIM 없이 줄 높이로 간격을 두고, w-max 로 상자를 글자 폭만큼 넓힌다. 큰 글자는 글자 앞 여백(옆 베어링)도 커서 안으로 들어가 보여 음수 여백으로 아래 줄 시작선에 맞춘다(2026-11-09 사용자 지정).
const HERO_BUTTON = "flex h-[48px] items-center justify-center rounded-[6px] border border-guest-navy bg-white text-[18px] leading-[1.5] font-semibold text-guest-navy hover:bg-[rgba(58,86,112,0.9)] hover:text-white";
const billboard = (A, R) => `<section class="relative -mt-[110px] h-[980px] overflow-hidden">${g.cover(A, "billboard-bg.png", "object-cover", true)}
<div class="guest-whale absolute top-[410px] left-[calc(50%+200px)] h-[375px] w-[677px] -translate-1/2">${g.cover(A, "billboard-whale.png", "", true)}</div>
<div class="absolute inset-x-0 top-[110px] bottom-0 flex items-center justify-center"><div class="${FRAME} flex flex-col gap-[80px]"><div class="flex items-end justify-between"><div class="flex w-[445px] flex-col gap-[48px]"><p class="flex flex-col gap-[4px] font-extrabold text-transparent"><span class="-ml-[0.03em] w-max bg-gradient-to-r from-[rgba(58,86,112,0.7)] to-[rgba(58,86,112,0.35)] bg-clip-text text-[48px] leading-[1.3] tracking-[-0.025em] whitespace-nowrap">식당·카페 사장님의</span><span class="-ml-[0.05em] w-max bg-gradient-to-r from-[rgba(58,86,112,0.8)] to-[rgba(58,86,112,0.36)] bg-clip-text text-[86px] leading-[1.25] tracking-[-0.025em] whitespace-nowrap">든든한 파트너</span></p><div class="flex flex-col gap-[24px] text-guest-navy"><p class="text-[22px] leading-[1.5] font-bold whitespace-nowrap ${TRIM}">처음 여는 매장도, 오래 운영한 매장도 쉽게 관리하세요</p><p class="text-[17px] leading-[1.5] whitespace-nowrap ${TRIM}">직원 계약부터 근무표·급여, 매출·재무, 가맹점 관리까지<br>여러 서비스를 일일이 알아보고 관리할 필요 없이, 하나로 해결</p></div></div>
<div class="flex gap-[8px]"><a href="${link(R, "auth/signup.html")}" class="${HERO_BUTTON} w-[176px] gap-[12px] ${BUTTON_MOTION}">무료로 시작하기${g.arrow(A)}</a><a href="${link(R, "home/inquiry.html")}" class="${HERO_BUTTON} w-[100px] ${BUTTON_MOTION}">도입문의</a></div></div>
<div class="flex flex-col items-start gap-[20px]">${g.tag("이용 안내")}<ul class="flex w-full justify-between border-t border-[rgba(130,151,168,0.15)] pt-[24px] text-guest-navy">${HIGHLIGHTS.map(
  (h) => `<li class="leading-[1.6]"><strong class="block text-[22px] font-bold"><span class="mr-[8px] text-guest-navy-soft">${h.no}</span>${h.title}</strong><span class="text-[17px]">${h.desc}</span></li>`,
).join("")}</ul></div></div></div></section>`;

// 사장님 유형 카드 — 「누구 → 한 문장 → 핵심 세 개 → 버튼」만 둔다(2026-11-09 사용자 지정).
const PERSONAS = [
  { head: "매장 하나를 운영해요", pitch: "직원 관리부터 급여까지 혼자서도 쉽게", features: ["종이 계약서 없이, 앱으로 근로계약서 작성·서명", "직원 출퇴근 기록을 자동으로 확인", "급여명세서도 클릭 한 번으로 발송"], service: "매장운영", cta: "자세히 보기", note: null, href: "home/store-operations.html" },
  { head: "여러 매장을 운영해요", pitch: "매장이 늘어도 관리는 한 화면에서", features: ["매장별 매출을 한눈에 비교", "매장마다 통장 입출금을 따로 확인", "점장에게 맡길 일만 선택해 권한 부여"], service: "재무관리", cta: "자세히 보기", note: null, href: "home/finance-management.html" },
  { head: "프랜차이즈 본사예요", pitch: "가맹점이 많아져도, 본사 관리는 간편하게", features: ["가맹계약을 온라인으로 간편하게 체결", "새 메뉴와 가격을 가맹점에 한 번에 전달", "가맹점 점검 결과를 함께 확인"], service: "프랜차이즈", cta: "자세히 보기", note: null, href: "home/franchise.html" },
  { head: "가맹점을 운영해요", pitch: "본사가 Whale ERP를 쓴다면, 가입 없이 시작", features: ["본사 메뉴와 가격이 매장에 바로 반영", "직원 계약과 출퇴근도 앱으로 간편하게", "우리 매장 운영은 내 방식대로 관리"], service: null, cta: "본사에서 받은 계정으로 로그인", note: ["본사가 Whale ERP를 쓰지 않나요?", "직영 매장으로 등록해서 관리하세요"], href: "auth/login.html" },
];

// 버튼은 서비스 이름만 굵게, 나머지는 보통 굵기. 안내(note)는 버튼 위에 둬 버튼 줄이 카드끼리 맞는다.
const ctaLabel = (p) => `<span class="font-normal">${p.service ? `<strong class="font-bold">${p.service} </strong>` : ""}${p.cta}</span>`;
const personas = (A, R) => `<section class="bg-guest-surface py-[100px]"><div class="${FRAME} flex flex-col gap-[60px]">${g.sectionTitle("사장님은,", "어떤 매장을 운영하세요?", false, { tag: "매장 유형별 안내", oneLine: true })}<div class="grid grid-cols-4 gap-[16px]">${PERSONAS.map(
  (p, i) => `<article class="flex flex-col rounded-b-[6px] border border-guest-line bg-white"><span class="h-[6px] bg-guest-navy"></span><div class="flex flex-1 flex-col gap-[32px] p-[34px]"><div class="flex flex-col gap-[16px] text-guest-navy"><h3 class="text-[22px] leading-[1.4] font-bold ${TRIM}"><span class="mr-[8px] text-guest-navy-soft">${no(i)}</span>${p.head}</h3><p class="text-[17px] leading-[1.5] text-guest-body ${TRIM}">${p.pitch}</p></div><ul class="flex flex-col gap-[12px] border-t border-[#e7e7e7] pt-[24px] text-[15px] leading-[1.5] text-guest-ink">${p.features.map((l) => `<li class="flex items-center gap-[10px]">${g.gimg(A, "check-circle.svg", 18, 18)}${l}</li>`).join("")}</ul>${p.note ? `<p class="mt-auto text-[16px] leading-[1.5] text-guest-body">${p.note[0]}<br>${p.note[1]}</p>` : ""}<div class="${p.note ? "" : "mt-auto "}flex">${g.button(A, ctaLabel(p), { tone: "invert", href: link(R, p.href), arrow: true, grow: true })}</div></div></article>`,
).join("")}</div></div></section>`;

// 누가 어디서 쓰는지 — 사장님 · 관리자 · 직원. 생성형 사진 대신 선 아이콘(실제 화면 캡처가 준비되면 바꾼다). 연한 하늘색 바탕(2026-11-09 사용자 지정).
const ROLE_ICON = {
  web: '<rect x="5" y="8" width="38" height="25" rx="2.5"/><path d="M18 40h12M24 33v7M5 14h38"/>',
  manager: '<circle cx="18" cy="16" r="6"/><path d="M7 38c0-6.1 4.9-11 11-11 2.4 0 4.6.8 6.4 2.1"/><path d="M36 25l7 3v5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5v-5l7-3z"/><path d="M33 33l2 2 4-4"/>',
  app: '<rect x="14" y="4" width="20" height="40" rx="3.5"/><path d="M21 9h6M19 21l3.5 3.5L29 18"/><circle cx="24" cy="38" r="1.2"/>',
};
const CONNECTIONS = [
  {
    label: "01",
    where: "관리자 웹",
    title: "사장님이 매장과 직원을 등록해요",
    desc: ["매장과 직원을 등록하고,", "관리자를 지정해 운영을 시작해요."],
    features: ["매장 정보 관리", "관리자 등록 · 권한 설정", "직원 초대 · 근로계약서 · 급여명세서 발송"],
    icon: "web",
  },
  {
    label: "02",
    where: "관리자 웹",
    title: "관리자가 근무 일정을 관리해요",
    desc: ["근무표를 공유하고,", "출퇴근 현황과 할 일을 한눈에 확인해요."],
    features: ["근무표 공유 및 조율", "출퇴근 확인", "할 일 배정"],
    icon: "manager",
  },
  {
    label: "03",
    where: "직원 앱",
    title: "직원은 앱으로 출퇴근해요",
    desc: ["근로계약서에 서명하고,", "근무 일정과 급여명세서를 간편하게 확인해요."],
    features: ["근로계약서 전자 서명", "출퇴근", "급여명세서 확인"],
    icon: "app",
  },
];

const connections = (A) => `<section class="bg-[#f1f7fc] py-[100px]"><div class="${FRAME} flex flex-col gap-[60px]">${g.sectionTitle("사장님부터 직원까지,", "매장 업무가 하나로 연결돼요", false, { tag: "함께 일하는 방식", oneLine: true })}<div class="grid grid-cols-3 gap-[34px]">${CONNECTIONS.map(
  (c, i) => `<div class="relative flex flex-col gap-[34px]">${i < CONNECTIONS.length - 1 ? `<span aria-hidden="true" class="absolute top-[110px] -right-[17px] z-10 flex size-[34px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-guest-line bg-white text-guest-navy">${g.arrow(A)}</span>` : ""}<div class="relative flex h-[220px] items-center justify-center rounded-[16px] bg-white text-guest-navy-soft"><span class="absolute top-[18px] left-[18px] rounded-[4px] bg-[#f1f7fc] px-[10px] py-[4px] text-[14px] leading-[1.5] font-semibold text-guest-navy">${c.where}</span><svg aria-hidden="true" viewBox="0 0 48 48" class="h-[104px] w-[104px]" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ROLE_ICON[c.icon]}</svg></div><div class="flex flex-col gap-[12px] pl-[2px] text-guest-body"><h3 class="text-[22px] leading-[1.4] font-bold text-guest-navy"><span class="mr-[8px] text-guest-navy-soft">${c.label}</span>${c.title}</h3><p class="text-[17px] leading-[1.6]">${c.desc[0]}<br>${c.desc[1]}</p><ul class="flex flex-col gap-[10px] pt-[8px] text-[15px] leading-[1.5] text-guest-ink">${c.features.map((l) => `<li class="flex items-center gap-[10px]">${g.gimg(A, "check-circle.svg", 18, 18)}${l}</li>`).join("")}</ul></div></div>`,
).join("")}</div></div></section>`;

// 시안이 줄을 직접 나눈 설명은 줄마다 나눠 둔다. 매장은 사업자 진위확인을 마쳐야 운영으로 바뀌고, 운영 중인 매장에서만 직원을 초대할 수 있다 — 길어도 순서를 적어 혼란을 막는다(2026-11-09 사용자 지정).
const STEPS = [
  { title: "사업자 회원가입", desc: ["계정 정보만 입력하면 가입 완료!"] },
  { title: "매장 등록", desc: ["매장 정보를 등록하고 사업자 확인을 마치면 운영 준비 완료!"] },
  { title: "직원 초대", desc: ["근로계약서를 보내면 직원 초대도 완료!"] },
];

// 아이콘을 위에 두고 글을 아래로 — 옆에 두면 설명 칸이 좁아 세 줄로 꺾였다. 사방 여백 40px, 설명은 한 줄(2026-11-10 사용자 지정).
const steps = (A, R) => `<section class="bg-guest-surface py-[100px]"><div class="${FRAME} flex flex-col gap-[60px]">${g.titleRow("매장 관리,", "어떻게 시작하면 될까요?", g.button(A, "사업자 회원가입하기", { tone: "invert", href: link(R, "auth/signup.html"), arrow: true }), { tag: "시작 방법", oneLine: true })}<ol class="grid grid-cols-3 gap-[24px]">${STEPS.map(
  (s, i) => `<li class="relative flex flex-col items-start gap-[28px] rounded-[16px] border border-guest-line bg-white p-[40px]">${i < STEPS.length - 1 ? `<span aria-hidden="true" class="absolute top-1/2 -right-[12px] z-10 flex size-[34px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-guest-line bg-white text-guest-navy">${g.arrow(A)}</span>` : ""}${stepIcon(A, i)}<div class="flex flex-1 flex-col items-start gap-[20px]"><div class="flex flex-col gap-[16px] leading-[1.5]"><h3 class="text-[22px] font-bold text-guest-navy ${TRIM}"><span class="mr-[8px] text-guest-navy-soft">${no(i)}</span>${s.title}</h3><p class="text-[17px] text-guest-body ${TRIM}">${s.desc.join("<br>")}</p></div></div></li>`,
).join("")}</ol></div></section>`;

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
  `<div class="flex items-center justify-between gap-[18px]"><p class="text-[17px] leading-[1.6] font-medium text-guest-navy ${TRIM}">${text}</p>${g.button(A, action, { tone: "invert", href, arrow: true })}</div>`;

// FAQ 는 name 을 같이 준 <details> 라 하나를 열면 나머지가 닫힌다(앱과 같은 네이티브 동작).
// 반 폭 두 칸은 큰 제목 없이 띠지만 둔다 — 상자 머리 문장이 제목 역할을 한다. 연한 하늘색 바탕, 위아래 90px(2026-11-09 사용자 지정).
const boards = (A, R) => `<section class="bg-[#f1f7fc] py-[100px]"><div class="${FRAME} grid grid-cols-2 gap-[16px]"><div class="flex flex-col items-start gap-[24px]">${g.tag("자주 묻는 질문")}<div class="flex w-full flex-1 flex-col gap-[34px] rounded-[6px] border border-guest-line bg-white p-[34px]">${boardHead(A, "자주 묻는 질문과 답변을 확인해 보세요.", "자주 묻는 질문 보기", link(R, "home/notices.html#faq"))}<div class="flex flex-col gap-[8px]">${FAQS.map(
  (faq) => `<details name="guest-faq"${faq.a !== null ? " open" : ""} class="group rounded-[3px] bg-guest-surface pb-[4px] open:bg-[#f5f5f5]"><summary class="flex cursor-pointer px-[20px] pt-[22px] pb-[18px] list-none items-center gap-[11px] text-[17px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy ${HOVER} [&::-webkit-details-marker]:hidden"><span class="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-guest-navy text-[18px] font-bold tracking-normal text-white">Q</span><span class="flex-1">${faq.q}</span>${g.gimg(A, "faq-plus.svg", 28, 28, "group-open:hidden")}${g.gimg(A, "faq-close.svg", 28, 28, "hidden group-open:block")}</summary>${faq.a ? `<p class="pr-[20px] pb-[18px] pl-[60px] text-[16px] leading-[1.5] text-guest-sub">${faq.a}</p>` : ""}</details>`,
).join("")}</div></div></div><div class="flex flex-col items-start gap-[24px]">${g.tag("공지사항")}<div class="flex w-full flex-1 flex-col gap-[32px] rounded-[6px] border border-guest-line bg-white p-[34px]">${boardHead(A, "서비스 업데이트와 주요 공지사항을 확인해 보세요.", "공지사항 보기", link(R, "home/notices.html"))}<ul class="border-t border-guest-list-line text-[15px] leading-[1.5]">${NEWS.map(
  (n) => `<li class="flex items-center gap-[8px] border-b border-guest-list-line py-[18px] last:border-b-0">${n.badge ? `<span class="flex h-[30px] items-center rounded-[3px] px-[10px] text-[15px] leading-[1.4] font-semibold ${n.badge.cls}">${n.badge.text}</span>` : ""}<a href="${link(R, "home/notice-detail.html")}" class="flex-1 text-guest-ink hover:text-guest-navy ${HOVER}">${n.title}</a><span class="text-guest-sub">2026.10.30</span></li>`,
).join("")}</ul></div></div></div></section>`;

export default ({ A, R }) => {
  const main = billboard(A, R) + personas(A, R) + connections(A) + steps(A, R) + boards(A, R);
  return { title: "비로그인 홈", head: g.head(A), html: g.page(A, R, { current: "home/index.html", main, flush: true }) };
};
