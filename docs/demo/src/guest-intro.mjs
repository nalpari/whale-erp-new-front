// 메뉴 소개 화면(매장운영 · 재무관리)이 함께 쓰는 네 구역. 앱 src/app/design/guest/intro-sections.tsx 를 옮겼다 —
// 시안(로그인전_공유 44:661 · 44:1412)이 같은 틀에 글·그림만 바꿔 넣은 것이라 구역은 여기서 그리고 화면마다 내용 표만 넘긴다.
import * as g from "./guest.mjs";
import { link } from "./site.mjs";

const momentBox = (kicker, { title, desc }, after) =>
  `<div class="flex flex-col gap-[10px] pt-[34px] pr-[34px] pb-[42px] pl-[44px] ${after ? "bg-guest-slate text-white" : "bg-guest-card text-guest-slate"}"><div class="flex flex-col gap-[4px]"><p class="text-[16px] leading-[1.5] font-semibold">${kicker}</p><p class="text-[28px] leading-[1.4] font-bold">${title}</p></div><p class="text-[16px] leading-[1.5] ${g.TRIM}">${desc}</p></div>`;

// BEFORE → 도입 후 화살표. 마지막 칸 화살표는 끝 칸 모양에 맞춘 다른 그림이다(Figma Frame 56 · 57).
export const moments = (A, R, light, bold, items) =>
  `<section class="${g.FRAME} flex flex-col gap-[60px] pt-[120px]">${g.titleRow(
    light,
    bold,
    `<div class="flex gap-[8px]">${g.button(A, "사업자 회원가입", { tone: "navy", href: link(R, "auth/signup.html"), arrow: true })}${g.button(A, "도입문의", { tone: "soft", href: link(R, "home/inquiry.html") })}</div>`,
  )}<div class="grid grid-cols-3 gap-px overflow-hidden rounded-[16px]">${items
    .map(
      (m, i) =>
        `<div class="relative flex flex-col">${momentBox("BEFORE", m.before, false)}${momentBox("WHALE ERP 도입 후", m.after, true)}${g.gimg(A, `store-operations/${i === items.length - 1 ? "arrow-down-circle-last.svg" : "arrow-down-circle.svg"}`, 66, 66, "absolute top-[calc(50%+9px)] left-1/2 -translate-1/2")}</div>`,
    )
    .join("")}</div></section>`;

const lines = (list) => list.map((l) => `<span class="block">${l}</span>`).join("");

// 바로가기(앱 feature-shortcuts.tsx). 부드럽게 내려가는 동작은 guest.js 의 data-scroll-to 가 맡는다.
const shortcuts = (items) =>
  `<nav class="flex gap-[8px]">${items
    .map(
      (f) =>
        `<button type="button" data-scroll-to="${f.id}" class="flex h-[48px] items-center rounded-[6px] border border-guest-button-line bg-white px-[18px] text-[18px] leading-[1.5] font-semibold text-guest-navy hover:border-guest-navy ${g.BUTTON_MOTION}">${f.tab}</button>`,
    )
    .join("")}</nav>`;

// 사진과 글이 번갈아 좌우를 바꾼다. 바로가기로 내려왔을 때 위에 붙는 머리말(110px)에 가리지 않게 띄운다. photo 는 assets/guest 아래 경로.
export const features = (A, light, bold, items) =>
  `<section class="${g.FRAME} flex flex-col gap-[60px] py-[120px]">${g.titleRow(light, bold, shortcuts(items))}<div class="flex flex-col gap-[120px]">${items
    .map(
      (f, i) =>
        `<article id="${f.id}" class="flex scroll-mt-[130px] justify-center gap-[100px] ${i % 2 ? "flex-row-reverse" : ""}"><div class="relative h-[540px] w-[400px] shrink-0 bg-[#f5f5f5]">${g.cover(A, f.photo)}</div><div class="flex flex-col gap-[64px] pt-[44px] text-guest-ink"><span class="h-[5px] w-[80px] bg-guest-ink"></span><div class="flex flex-col gap-[32px]"><div class="flex flex-col gap-[18px]"><div class="flex flex-col gap-[8px]"><p class="text-[20px] leading-[1.5] font-semibold">${f.no}</p><h3 class="text-[34px] leading-[1.4] font-bold">${lines(f.title)}</h3></div><p class="text-[18px] leading-[1.5] font-semibold ${g.TRIM}">${lines(f.lead)}</p></div><p class="text-[18px] leading-[1.5] text-guest-body ${g.TRIM}">${lines(f.points)}</p></div></div></article>`,
    )
    .join("")}</div></section>`;

export const flow = (A, light, bold, steps) =>
  `<section class="relative overflow-hidden bg-guest-ink py-[120px]">${g.cover(A, "store-operations/flow-bg.png", "object-cover object-bottom")}<span class="absolute inset-0 bg-[rgba(31,31,31,0.8)]"></span><div class="${g.FRAME} relative flex flex-col gap-[60px]">${g.sectionTitle(light, bold, true)}<ol class="grid grid-cols-5 gap-[32px]">${steps
    .map(
      (s) =>
        `<li class="flex flex-col items-center gap-[24px] rounded-[16px] bg-white/10 py-[42px] text-center">${g.layeredIcon(A, s.icon)}<div class="flex flex-col gap-[8px] leading-[1.5]"><h3 class="text-[24px] font-semibold text-[#fafafa]">${s.title}</h3><p class="text-[18px] text-[#ccc]">${s.desc}</p></div></li>`,
    )
    .join("")}</ol></div></section>`;

// 맨 아래 회색 구역이 푸터에 바로 붙는다 — 화면은 page 의 flush 로 그린다.
export const addOns = (A, R, items) =>
  `<section class="bg-[#fafafa] pt-[120px] pb-[60px]"><div class="${g.FRAME} flex flex-col gap-[60px]">${g.titleRow(
    "함께 쓰면",
    "더 편해지는 부가서비스",
    g.button(A, "부가서비스 전체 보기", { tone: "navy", href: link(R, "home/add-on-services.html"), arrow: true }),
  )}<ul class="grid grid-cols-3 gap-[16px]">${items
    .map(
      (it) =>
        `<li class="flex items-center gap-[24px] rounded-[16px] border border-guest-line bg-white px-[42px] pt-[40px] pb-[28px]"><span class="flex w-[74px] shrink-0 items-center">${it.icon}</span><div class="flex flex-col gap-[2px] leading-[1.5] text-guest-ink"><h3 class="text-[22px] font-bold">${it.name}</h3><p class="text-[16px]">${it.desc}</p></div></li>`,
    )
    .join("")}</ul></div></section>`;
