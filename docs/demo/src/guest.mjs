// 비로그인 화면(home 의 소개·도입문의·공지사항, auth 의 로그인·찾기·가입·약관 전문)이 같이 쓰는 틀과 조각.
// 앱의 디자인 샘플 src/app/design/guest(Figma 로그인전)를 옮긴 것이다 — 화면을 고치면 그쪽과 같이 고친다.
// 관리자 화면과 다른 디자인이라 DESIGN.md 대신 globals.css 의 --color-guest-* 토큰과 Figma 규격을 따른다.
// 클래스는 앱 코드와 같은 글자로 적는다. 다만 url() 이 든 클래스는 앱의 Tailwind 가 docs/ 까지 훑어 앱 CSS 에 넣으므로
// 상대 경로를 쓰지 못한다 — 그림은 <img> 나 style 로, 체크 표시는 base.css 의 guest-checkbox 로 그린다.
import { ERP_THEME, EASE_OUT } from "./ui.mjs";
import { link } from "./site.mjs";

// ── 머리 요소: 영문 글꼴(앱은 next/font), 화면 사이 전환, 동작(guest.js) ──
export const head = (A) =>
  `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700&family=Inter:wght@700&family=REM:wght@500;800;900&display=swap">
<style>:root{--font-rem:"REM";--font-inter-tight:"Inter Tight";--font-inter:"Inter"}@view-transition{navigation:auto}</style>
<script src="${A}guest.js?v=__V__" defer></script>
`;

// ── 움직임(앱 guest/theme.ts) ──
export const HOVER = "[transition:color_250ms_ease,background-color_250ms_ease,border-color_250ms_ease] motion-reduce:transition-none";
export const BUTTON_MOTION =
  "group [transition:color_250ms_ease,background-color_250ms_ease,border-color_250ms_ease,scale_150ms_cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";
const ARROW_NUDGE = `transition-[translate] duration-250 ${EASE_OUT} group-hover:translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0`;
const ARROW_NUDGE_BACK = `transition-[translate] duration-250 ${EASE_OUT} group-hover:-translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0`;

// ── 폼 규격(앱 guest/guest-form.ts) — 입력칸 56px, 주 버튼 66px, 모서리 6px ──
export const INPUT_BOX = `flex h-[56px] items-center gap-[10px] rounded-[6px] border border-[#ebebeb] bg-white px-[16px] focus-within:border-guest-navy has-disabled:bg-guest-card ${HOVER}`;
export const INPUT =
  "min-w-0 flex-1 bg-transparent text-[15px] leading-[1.5] text-guest-ink outline-none! placeholder:text-[#999] placeholder:tracking-[-0.002em] disabled:text-[#767676]";
export const LABEL = "text-[16px] leading-[1.4] font-medium text-guest-ink";
export const SUBMIT =
  "h-[66px] rounded-[6px] border border-guest-navy bg-guest-navy text-[18px] leading-[1.5] font-semibold tracking-normal text-white hover:bg-white hover:text-guest-navy active:scale-[0.99] [transition:color_250ms_ease,background-color_250ms_ease,scale_150ms_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";
export const FIELD_BUTTON = `h-[56px] shrink-0 rounded-[6px] border border-guest-ink bg-white px-[18px] text-[18px] leading-[1.5] font-semibold whitespace-nowrap hover:border-guest-navy hover:text-guest-navy ${BUTTON_MOTION}`;
// 체크 표시 그림은 base.css 의 guest-checkbox 가 그린다.
export const CHECKBOX = `guest-checkbox size-[20px] shrink-0 appearance-none rounded-[4px] border border-[#aab4c4] bg-white bg-center bg-no-repeat checked:border-guest-navy checked:bg-guest-navy ${HOVER}`;
export const ICON_BUTTON = "flex size-[16px] items-center justify-center";

// ── 조각(앱 guest/guest-ui.tsx) ──
export const TRIM = "[text-box:trim-both_cap_alphabetic]";
export const ICON_GRADIENT = "linear-gradient(114deg, rgba(174,190,206,0.8) 8.98%, rgba(32,96,154,0.8) 94.82%)";

// 그림. 앱의 next/image 를 옮긴 것이다. 소수 크기는 시안 좌표 그대로라 style 로 준다.
export const gimg = (A, src, w, h, cls = "", alt = "") =>
  `<img alt="${alt}" src="${A}guest/${src}" style="width:${w}px;height:${h}px"${cls ? ` class="${cls}"` : ""}>`;
// 칸을 덮는 그림(앱의 Image fill + object-cover).
export const cover = (A, src, cls = "object-cover", eager = false) =>
  `<img alt="" src="${A}guest/${src}"${eager ? "" : ' loading="lazy"'} class="absolute inset-0 size-full ${cls}">`;
// 글자색을 따르는 아이콘. 앱은 CSS 마스크로 그리지만, 마스크 그림은 파일로 연 데모(file://)에서 불러오지 않아
// SVG 를 마크업에 바로 넣고 선 색을 currentColor 로 둔다.
const svg = (cls, viewBox, paths, width) =>
  `<svg aria-hidden="true" class="${cls}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
export const userCircle = (cls) =>
  svg(cls, "0 0 24 24", '<path d="M15.5 10.5a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z"/><path d="M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0Z"/><path d="M18 20a6 6 0 0 0-12 0"/>', 1.5);
const arrowSvg = (cls) =>
  svg(cls, "0 0 16.7004 15.0674", '<path d="M9.20037 0.833331L15.867 7.50001M0.833331 7.58926H15.8452M9.20037 14.2341L15.867 7.56741"/>', 1.66666);

export const sectionTitle = (light, bold, dark = false) =>
  `<h2 class="text-[52px] leading-[1.2] tracking-[-0.025em] ${dark ? "text-[#f5f5f5]" : "text-guest-ink"}"><span class="block font-normal">${light}</span><span class="block font-bold">${bold}</span></h2>`;
export const titleRow = (light, bold, action) => `<div class="flex items-end justify-between">${sectionTitle(light, bold)}${action}</div>`;

export const arrow = (A, back = false) => arrowSvg(`h-[15.0674px] w-[16.7004px] shrink-0 ${back ? `-scale-x-100 ${ARROW_NUDGE_BACK}` : ARROW_NUDGE}`);

const BUTTON_TONE = {
  navy: "border-guest-navy bg-guest-navy text-white hover:bg-white hover:text-guest-navy",
  soft: "border-guest-navy-soft bg-guest-navy-soft text-white hover:border-guest-navy hover:bg-white hover:text-guest-navy",
  white: "border-white bg-white text-guest-navy text-[17px]! hover:border-guest-navy",
  outline: "border-guest-button-line bg-white text-guest-ink hover:border-guest-navy hover:text-guest-navy",
  line: "border-guest-navy-soft bg-white text-guest-navy hover:border-guest-navy",
};
// arrow: true 는 글 뒤에 나아가는 화살표, "back" 은 글 앞에 되돌아가는 화살표. tall 은 폼 아래 66px 버튼 줄.
export const button = (A, text, { tone, href = "#", arrow: arr = false, grow = false, tall = false }) =>
  `<a href="${href}" class="flex ${tall ? "h-[66px]" : "h-[48px]"} shrink-0 items-center justify-center gap-[12px] rounded-[6px] border px-[18px] text-[18px] leading-[1.5] font-semibold whitespace-nowrap ${BUTTON_MOTION} ${grow ? "flex-1" : ""} ${BUTTON_TONE[tone]}">${arr === "back" ? arrow(A, true) : ""}${text}${arr === true ? arrow(A) : ""}</a>`;

// 비밀번호 칸 오른쪽의 보기·숨기기 버튼. 지금 상태를 바꾸는 그림 하나만 보인다(guest.js).
export const eyeButton = (A, label) =>
  `<button type="button" data-password-toggle="${label}" aria-label="${label} 보기" aria-pressed="false" class="${ICON_BUTTON}">${gimg(A, "login/eye-on.svg", 16, 16)}${gimg(A, "login/eye-off.svg", 16, 16).replace("<img", "<img hidden")}</button>`;

// 로그인·계정 찾기·가입 완료의 왼쪽 칸 — 구름 위 고래 그림에 영문 머리말, 큰 제목, 안내를 얹는다.
export const visual = (A, { eyebrow, title, body }) =>
  `<div class="relative flex flex-col justify-end gap-[32px] overflow-hidden px-[60px] py-[74px]">${cover(A, "login/visual.png", "object-cover", true)}<div class="relative flex flex-col gap-[34px] uppercase"><p class="font-[family-name:var(--font-rem)] text-[24px] leading-none font-medium tracking-[-0.025em] text-[rgba(58,86,112,0.5)] ${TRIM}">${eyebrow}</p>${title}</div><p class="relative pl-[10px] text-[17px] leading-[1.4] text-[rgba(58,86,112,0.6)] ${TRIM}">${body}</p></div>`;

// ── 머리말 · 푸터 ──
const MENUS = [
  ["매장운영", "home/store-operations.html"],
  ["재무관리", ""],
  ["프랜차이즈", ""],
  ["부가 서비스", "home/add-on-services.html"],
];
// 본문이 머리말과 같은 흰 바탕인 화면은 맨 위에서도 선을 긋는다. 스크롤하면 guest.js 가 흰 바탕과 선을 깐다.
const LINED = ["auth/login.html", "auth/find.html", "auth/signup.html", "auth/signup-done.html", "home/inquiry.html", "home/notices.html", "auth/terms.html"];

function header(A, R, current) {
  const lined = LINED.includes(current);
  const menus = MENUS.map(([label, path]) => {
    const on = path && path === current;
    return `<a href="${link(R, path)}"${on ? ' aria-current="page"' : ""} class="text-[20px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy aria-[current=page]:text-guest-navy ${HOVER}">${label}</a>`;
  }).join("");
  const side = (text, path) =>
    `<a href="${link(R, path)}"${path === current ? ' aria-current="page"' : ""} class="hover:text-guest-ink aria-[current=page]:text-guest-navy ${HOVER}">${text}</a>`;
  return `<header data-guest-header${lined ? " data-lined" : ""} style="view-transition-name:guest-header" class="sticky top-0 z-20 flex h-[110px] items-center border-b px-[80px] transition-[background-color,border-color] duration-150 ${EASE_OUT} motion-reduce:transition-none ${lined ? "border-guest-line" : "border-transparent"}">
<a href="${link(R, "home/index.html")}" class="flex items-center gap-[8px] py-[5px]"><span class="relative size-[50px] opacity-95">${gimg(A, "logo-whale.svg", 49.6875, 37.4997, "absolute top-[12.5px] left-0")}${gimg(A, "logo-star.svg", 24.1664, 17.5001, "absolute top-0 left-[7.57px]")}</span><span class="flex flex-col leading-[1.4] [text-box:trim-both_cap_alphabetic]"><span class="font-[family-name:var(--font-rem)] text-[20px] font-extrabold tracking-normal text-guest-ink uppercase">whale ERP</span><span class="font-[family-name:var(--font-inter-tight)] text-[13px] tracking-normal text-[#353535]">STORE MANAGEMENT SYSTEM</span></span></a>
<nav class="flex flex-1 justify-center gap-[80px]">${menus}</nav>
<div class="flex items-center gap-[34px] text-[20px] font-semibold text-[#999]"><a href="${link(R, "auth/login.html")}" class="flex items-center gap-[6px] uppercase hover:text-guest-ink ${HOVER}">${userCircle(`size-[24px] ${HOVER}`)}Login</a>${side("도입문의", "home/inquiry.html")}${side("공지사항", "home/notices.html")}</div>
</header>`;
}

// Figma 의 회사 정보 그대로다. 「상호」가 두 번 나오는 둘째 칸은 기획 확정 전 자리값이다.
const INFO_ROWS = [
  ["상호: 인터플러그", "상호: 인터플러그", "주소: 03787 서울특별시 서대문구 연세로 5다길 22-3, 발리빌딩 3층"],
  ["이메일: help@interplug.co.kr", "전화번호: 6923-0028", "사업자등록번호 : 1233467890"],
  ["통신판매업신고번호: 2021-00000000000"],
];
const BAR = '<span class="h-[8px] w-px bg-[#ddd]"></span>';

function footer(A, R) {
  const rows = INFO_ROWS.map((row) => `<div class="flex items-center gap-[8px]">${row.map((t) => `<span>${t}</span>`).join(BAR)}</div>`).join("");
  const legal = (text, hash) => `<a href="${link(R, `auth/terms.html#${hash}`)}" class="hover:text-guest-ink ${HOVER}">${text}</a>`;
  return `<footer class="bg-white"><div class="border-t border-guest-line px-[80px] pt-[38px] pb-[32px]"><div class="flex items-start gap-[100px]"><span class="relative h-[50px] w-[80px]">${gimg(A, "footer-logo.svg", 80, 49.9939, "absolute top-0 left-0", "인터플러그")}${gimg(A, "footer-logo-text.svg", 61.6474, 5.57821, "absolute top-[42.71px] left-[3.28px]")}</span><div class="flex flex-col gap-[8px] text-[16px] leading-[1.6] text-guest-sub"><div class="flex flex-col gap-[2px]"><div class="flex items-center gap-[8px] leading-[1.5]">${legal("이용약관", "use")}${BAR}${legal("개인정보처리방침", "privacy")}</div>${rows}</div><p class="text-[#888]">Copyrights© 2026 INTERPLUG. All Rights Reserved.</p></div></div></div></footer>`;
}

// 비로그인 화면 한 장. current 는 이 화면의 데모 경로(머리말 메뉴 표시용).
// 본문과 푸터 사이는 시안대로 60px 띄운다. 로그인처럼 푸터가 본문에 바로 붙는 화면은 flush.
export const page = (A, R, { current, main, flush = false }) =>
  `<div class="${ERP_THEME} min-w-[1720px] bg-white break-keep">${header(A, R, current)}<div style="view-transition-name:guest-page;view-transition-class:guest-page" class="${flush ? "" : "pb-[60px]"}">${main}</div>${footer(A, R)}</div>`;

// ── 아이콘(앱 guest/guest-icons.tsx) ──
// 선 아이콘 조각 { src, width, height, left, top } 을 64px 칸에 겹친다. src 는 assets/guest 아래 경로.
export const layeredIcon = (A, parts) =>
  `<span class="relative size-[64px]">${parts.map((p) => `<img alt="" src="${A}guest/${p.src}" class="absolute max-w-none" style="width:${p.width}px;height:${p.height}px;left:${p.left}px;top:${p.top}px">`).join("")}</span>`;

// 직원 두 명 — 매장운영 「직원 초대」와 부가서비스 「직원수 추가」가 같은 그림을 쓴다.
export const STAFF_ICON = [
  { src: "store-operations/flow-invite-1.svg", width: 41.3333, height: 20, left: 3.33, top: 38 },
  { src: "store-operations/flow-invite-2.svg", width: 25.3333, height: 25.3333, left: 11.33, top: 6 },
  { src: "store-operations/flow-invite-3.svg", width: 12.0005, height: 19.6538, left: 48.67, top: 38.35 },
  { src: "store-operations/flow-invite-4.svg", width: 12.0214, height: 24.6676, left: 40.67, top: 6.35 },
];

export const kioskIcon = () =>
  `<span class="relative block h-[74px] w-[70px]"><span class="absolute top-0 left-[7px] h-[63px] w-[56px] rounded-[10px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]" style="background-image:${ICON_GRADIENT}"></span><span class="absolute top-[5px] left-[12px] h-[39px] w-[46px] rounded-[10px] shadow-[inset_0_1px_3.8px_rgba(255,255,255,0.05)]" style="background-image:linear-gradient(108deg, rgba(255,255,255,0.04) 8.98%, rgba(255,255,255,0.24) 94.82%)"></span><span class="absolute top-[14px] left-[21px] h-[8px] w-[29px] rounded-[2px] bg-white/90"></span><span class="absolute top-[27px] left-[21px] h-[2px] w-[24px] rounded-full bg-white/60"></span><span class="absolute top-[33px] left-[21px] h-[2px] w-[17px] rounded-full bg-white/40"></span><span class="absolute top-[49px] left-0 h-[25px] w-[70px] rounded-[10px] bg-white/40 shadow-[0_1.3px_13px_rgba(0,0,0,0.09),inset_0_5.2px_4px_rgba(255,255,255,0.55)] backdrop-blur-[4.9px]"></span></span>`;

export const inventoryIcon = (A, src) =>
  `<span class="relative block h-[74px] w-[67px]">${gimg(A, src, 83.3356, 91.3557, "absolute top-[-9.18px] left-[-12.98px] max-w-none")}</span>`;

export const orderIcon = (A, back, front) =>
  `<span class="relative block h-[74px] w-[72px]">${gimg(A, back, 72.15, 61.1035, "absolute top-[12.89px] left-0 max-w-none")}<span class="absolute top-0 left-[10.31px] h-[64.75px] w-[51.27px] rounded-[9px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]" style="background-image:${ICON_GRADIENT}"></span><span class="absolute top-[14px] left-[21.2px] h-[2px] w-[29px] rounded-full bg-white/90"></span><span class="absolute top-[21px] left-[21.2px] h-[2px] w-[24px] rounded-full bg-white/60"></span><span class="absolute top-[28px] left-[21.2px] h-[2px] w-[17px] rounded-full bg-white/40"></span>${gimg(A, front, 72.15, 40.7839, "absolute top-[33.22px] left-0 max-w-none")}</span>`;

export const recipeIcon = (A, bookmark) =>
  `<span class="relative block h-[74px] w-[68px]"><span class="absolute top-0 left-[13.87px] h-[52.42px] w-[53.96px] rounded-[8.9px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]" style="background-image:${ICON_GRADIENT}"></span>${gimg(A, bookmark, 79.9233, 83.7806, "absolute top-[-1.21px] left-[-12.98px] max-w-none")}<span class="absolute top-[30px] left-[19px] h-[2px] w-[17px] rounded-full bg-white/90"></span><span class="absolute top-[23px] left-[26.5px] h-[17px] w-[2px] rounded-full bg-white/90"></span></span>`;
