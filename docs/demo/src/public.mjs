// 로그인 전 화면(auth 전부, home 의 비로그인 화면)이 같이 쓰는 틀. ERP 헤더가 없다.
// DESIGN.md 는 관리자 화면용이라 로그인 전 규칙이 따로 없다 — 같은 토큰·서체·2px/4px 모서리·1px 선으로 조용하게 만든다.
// 여기 있는 부품은 1팀 공통 컴포넌트에 없는 것이고, 컴포넌트 제안의 대상이다.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import { link } from "./site.mjs";

// 헤더 로고와 같은 마크업
export const brand = (A, href) =>
  `<a class="flex items-center gap-[10px]" href="${href}">${ui.img(A, "logo-whale.svg", 53, 40)}<p class="leading-[1.3] text-[#252525]"><span class="block text-[16px] font-extrabold uppercase">Whale ERP</span><span class="block text-[12px]">Management System</span></p></a>`;

// 칸 아래 도움말, 안내 문구
export const help = (t) => `<span class="text-[12px] leading-[1.5] text-erp-label">${t}</span>`;
export const note = (t) => `<p class="text-[13px] leading-[1.6] text-erp-label">${t}</p>`;
// 조용한 글자 링크(로그인 아래 찾기·가입 등). 파란 링크는 상세로 가는 링크에만 쓰므로 회색으로 둔다.
export const quietLink = (text, href, a = "") =>
  `<a${a} class="text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink" href="${href}">${text}</a>`;
// 링크 여럿을 11px 세로선(#d9d9d9, DetailTable 값 구분선과 같은 것)으로 나눈 가운데 줄
export const linkRow = (...links) =>
  `<p class="flex items-center justify-center gap-[10px] text-[14px]">${links.join('<span class="h-[11px] w-px bg-[#d9d9d9]"></span>')}</p>`;
// 폭을 꽉 채우는 버튼. Button 에 className 을 넘기지 않고 감싸는 쪽이 폭을 정한다.
export const block = (html) => `<div class="grid">${html}</div>`;
// 칸 둘을 위쪽에 맞춰 나란히(도움말 줄 수가 달라도 입력칸이 어긋나지 않게)
export const row = (...c) => `<div class="flex w-full items-start gap-[6px]">${c.join("")}</div>`;
export const cardTitle = (t, lead = "") =>
  `<div class="flex flex-col gap-[6px]"><h1 class="text-[18px] font-semibold">${t}</h1>${lead ? `<p class="text-[14px] text-erp-label">${lead}</p>` : ""}</div>`;

// 가운데 카드 하나짜리 화면(로그인·찾기·가입·약관)
export function authPage(A, R, { card, width = "w-[420px]", foot = "", home = link(R, "auth/login.html") }) {
  return `<div class="${ui.ERP_THEME}"><div class="h-[100dvh] overflow-y-auto bg-erp-thead-bg"><div class="flex min-h-full flex-col items-center justify-center gap-[24px] p-[24px]">${brand(A, home)}<main class="flex ${width} flex-col gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">${card}</main>${foot}</div></div></div>`;
}

// 로그인 화면 맨 아래 약관 링크 줄. 누르면 전문을 확인창으로 연다.
export function legalFoot() {
  const use = x.dialogId();
  const policy = x.dialogId();
  const btn = (id, label) => `<button type="button" data-dialog="${id}" class="transition-colors duration-150 ease-out hover:text-erp-ink">${label}</button>`;
  return `<footer class="flex flex-col items-center gap-[6px] text-[12px] text-erp-label"><nav aria-label="약관 및 정책" class="flex gap-[12px]">${btn(use, "이용약관")}${btn(policy, '<b class="font-semibold text-erp-ink">개인정보처리방침</b>')}</nav><p><b class="font-semibold">WHALE ERP</b> Copyright © Interplug Corp. All Rights Reserved.</p></footer>${termsDialog(use, "use")}${termsDialog(policy, "policy")}`;
}

// 약관 문구. 목업 auth.js 의 TERMS 한 곳에서 읽는다(두 곳에 적지 않는다).
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "../../mockup/assets/auth.js"), "utf8");
const from = src.indexOf("var TERMS = ") + "var TERMS = ".length;
export const TERMS = new Function(`return ${src.slice(from, src.indexOf("\n  };", from) + 4)}`)();

const CELL = "border border-erp-thead-line px-[10px] py-[6px] text-left align-top";
export function termsBody(key) {
  return TERMS[key].body
    .map(([head, v]) => {
      const content = Array.isArray(v)
        ? `<ol class="list-decimal pl-[18px]">${v.map((li) => `<li>${li}</li>`).join("")}</ol>`
        : v?.rows
          ? `<table class="w-full border-collapse text-[13px]"><thead><tr>${v.head.map((h) => `<th class="${CELL} bg-erp-thead-bg font-medium text-erp-thead-text">${h}</th>`).join("")}</tr></thead><tbody>${v.rows
              .map((r) => `<tr>${r.map((c) => `<td class="${CELL}">${c}</td>`).join("")}</tr>`)
              .join("")}</tbody></table>`
          : `<p>${v}</p>`;
      return `<section class="flex flex-col gap-[6px]">${head ? `<h3 class="font-semibold">${head}</h3>` : ""}${content}</section>`;
    })
    .join("");
}
export const termsVer = (key) => `<p class="text-[12px] text-erp-label">${TERMS[key].ver}</p>`;
export const termsDialog = (id, key) =>
  x.dialog(id, TERMS[key].title, `${termsVer(key)}<div class="mt-[12px] flex max-h-[60dvh] flex-col gap-[12px] overflow-y-auto pr-[10px]">${termsBody(key)}</div>`, ui.button("확인", { "data-close": true }));

// ── 비로그인 홈 쪽(홈·공지사항·도입문의) 위쪽 줄과 아래쪽 줄 ──
export function siteNav(A, R, current = "") {
  const sec = [
    ["ops", "매장운영"],
    ["finance", "재무관리"],
    ["franchise", "프랜차이즈"],
    ["addons", "부가서비스"],
  ];
  const home = link(R, "home/index.html");
  const nav = sec
    .map(([id, l]) => `<a class="text-[15px] font-medium text-erp-ink transition-colors duration-150 ease-out hover:text-erp-brand" href="${home === "#" ? "#" : `${home}#${id}`}">${l}</a>`)
    .join("");
  const notices = `<a${current === "notices" ? ' aria-current="page"' : ""} class="text-[14px] font-medium ${current === "notices" ? "text-erp-brand" : "text-erp-ink"} transition-colors duration-150 ease-out hover:text-erp-brand" href="${link(R, "home/notices.html")}">공지사항</a>`;
  return `<header class="sticky top-0 z-10 flex h-[70px] items-center gap-[54px] border-b border-erp-bar-line bg-white px-[24px]">${brand(A, home)}<nav aria-label="서비스 안내" class="flex flex-1 gap-[34px]">${nav}</nav><div class="flex items-center gap-[6px]"><span class="mr-[12px]">${notices}</span>${ui.button("도입문의", { variant: "soft", href: link(R, "home/inquiry.html") })}${ui.button("로그인", { href: link(R, "auth/login.html") })}</div></header>`;
}
export const siteFoot = (...items) =>
  `<footer class="border-t border-erp-bar-line bg-erp-thead-bg"><div class="mx-auto flex w-[1200px] items-center gap-[18px] px-[24px] py-[24px] text-[13px] text-erp-label">${items.join("")}</div></footer>`;
export const sitePage = (A, R, { current, main, foot }) =>
  `<div class="${ui.ERP_THEME}"><div class="h-[100dvh] overflow-y-auto bg-white">${siteNav(A, R, current)}<main>${main}</main>${foot}</div></div>`;
export const BIZ = "상호 인터플러그 · 사업자등록번호 105-87-63602";
