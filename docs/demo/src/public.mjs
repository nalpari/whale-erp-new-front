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
// 조용한 글자 링크(로그인 아래 찾기 등). 파란 링크는 상세로 가는 링크에만 쓰므로 회색으로 둔다.
export const quietLink = (text, href, a = "") =>
  `<a${a} class="text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink" href="${href}">${text}</a>`;
// 키컬러 글자 링크(로그인 아래 사업자회원가입처럼 다음 행동을 눈에 띄게 둘 때, 2026-10-06 피드백). 굵게 + 브랜드색.
export const keyLink = (text, href, a = "") =>
  `<a${a} class="font-semibold text-erp-brand transition-colors duration-150 ease-out hover:text-erp-ink" href="${href}">${text}</a>`;
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
// header 를 주면(로그인 화면, 2026-10-07 피드백) 로그인전 홈화면의 GNB(siteNav)를 위에 얹는다 — 로고가 거기 이미 있어 가운데 칸의 brand 는 뺀다.
export function authPage(A, R, { card, width = "w-[420px]", foot = "", home = link(R, "auth/login.html"), header = "" }) {
  return `<div class="${ui.ERP_THEME}">${header}<div class="${header ? "h-[calc(100dvh-70px)]" : "h-[100dvh]"} overflow-y-auto bg-erp-thead-bg"><div class="flex min-h-full flex-col items-center justify-center gap-[24px] p-[24px]">${header ? "" : brand(A, home)}<main class="flex ${width} flex-col gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">${card}</main>${foot}</div></div></div>`;
}

// 로그인 화면 맨 아래 약관 링크 줄. 누르면 전문을 확인창으로 연다. 확인창 폭은 회원가입 전문 보기와 같은 640px(2026-10-06 피드백).
export function legalFoot() {
  const use = x.dialogId();
  const policy = x.dialogId();
  const btn = (id, label) => `<button type="button" data-dialog="${id}" class="transition-colors duration-150 ease-out hover:text-erp-ink">${label}</button>`;
  return `<footer class="flex flex-col items-center gap-[6px] text-[12px] text-erp-label"><nav aria-label="약관 및 정책" class="flex gap-[12px]">${btn(use, "이용약관")}${btn(policy, '<b class="font-semibold text-erp-ink">개인정보처리방침</b>')}</nav><p><b class="font-semibold">WHALE ERP</b> Copyright © Interplug Corp. All Rights Reserved.</p></footer>${termsDialog(use, "use", "w-[640px]")}${termsDialog(policy, "policy", "w-[640px]")}`;
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
// width 를 주면 확인창 기본 폭(420px) 대신 그 값을 쓴다(회원가입처럼 뒤 카드 폭에 맞출 때, 2026-10-06 피드백).
export const termsDialog = (id, key, width) => {
  const html = x.dialog(id, TERMS[key].title, `${termsVer(key)}<div class="mt-[12px] flex max-h-[60dvh] flex-col gap-[12px] overflow-y-auto pr-[10px]">${termsBody(key)}</div>`, ui.button("확인", { "data-close": true }));
  return width ? html.replace("w-[420px]", width) : html;
};

// ── 비로그인 홈 쪽(홈·공지사항·도입문의) 위쪽 줄과 아래쪽 줄 ── 1팀 Figma(2026_Whale-ERP, node 1-689) GNB·푸터로 맞췄다(2026-10-07 피드백).
// 오른쪽 묶음(LOGIN·도입문의·공지사항)은 버튼이 아니라 조용한 글자 링크다 — quietLink 와 같은 회색, 자산이 없는 사람 아이콘만 인라인으로 그렸다.
const PERSON_ICON = `<svg viewBox="0 0 24 24" class="size-[16px]" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>`;
export function siteNav(A, R, current = "") {
  const sec = [
    ["ops", "매장운영"],
    ["finance", "재무관리"],
    ["franchise", "프랜차이즈"],
    ["addons", "요금안내"],
  ];
  const home = link(R, "home/index.html");
  const nav = sec
    .map(([id, l]) => `<a class="text-[15px] font-medium text-erp-ink transition-colors duration-150 ease-out hover:text-erp-brand" href="${home === "#" ? "#" : `${home}#${id}`}">${l}</a>`)
    .join("");
  const quiet = (label, href, cur, icon = "") =>
    `<a${cur ? ' aria-current="page"' : ""} class="flex items-center gap-[4px] text-[14px] font-medium ${cur ? "text-erp-brand" : "text-erp-label"} transition-colors duration-150 ease-out hover:text-erp-ink" href="${href}">${icon}${label}</a>`;
  const right =
    quiet("LOGIN", link(R, "auth/login.html"), current === "login", PERSON_ICON) +
    quiet("도입문의", link(R, "home/inquiry.html"), current === "inquiry") +
    quiet("공지사항", link(R, "home/notices.html"), current === "notices");
  return `<header class="sticky top-0 z-10 flex h-[70px] items-center gap-[54px] border-b border-erp-bar-line bg-white px-[24px]">${brand(A, home)}<nav aria-label="서비스 안내" class="flex flex-1 gap-[34px]">${nav}</nav><div class="flex items-center gap-[24px]">${right}</div></header>`;
}
// 1팀 Figma 푸터(2026-10-07 피드백) — 인터플러그 로고 + 약관·사업자정보 + 소셜 아이콘 셋. 로고·아이콘 자산이 없어 인라인 SVG 로 그렸다.
const INTERPLUG_MARK = `<svg viewBox="0 0 32 32" class="size-[32px] shrink-0" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#1a1a1a"/><text x="16" y="21" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">im</text></svg>`;
const socialIcon = (label, path) =>
  `<a href="#" aria-label="${label}" class="grid size-[32px] shrink-0 place-items-center rounded-full bg-[#d9dbe0] text-white transition-colors duration-150 ease-out hover:bg-erp-brand"><svg viewBox="0 0 24 24" class="size-[15px]" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></a>`;
const SOCIAL =
  socialIcon("인스타그램", '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none"/>') +
  socialIcon("유튜브", '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none"/>') +
  socialIcon("틱톡", '<path d="M14 3v10.2a3.3 3.3 0 1 1-3.3-3.3c.3 0 .6 0 .9.1V7.4a5.9 5.9 0 1 0 5 5.8V8.6c1 .7 2.2 1.1 3.4 1.1V7.1A5.9 5.9 0 0 1 16 3z" fill="currentColor" stroke="none"/>');
export function siteFoot(A, R) {
  const sep = '<span class="h-[11px] w-px bg-[#d9d9d9]"></span>';
  const row = (...items) => `<p class="flex flex-wrap items-center gap-[10px] text-[13px] text-erp-label">${items.join(sep)}</p>`;
  return `<footer class="border-t border-erp-bar-line bg-white"><div class="mx-auto flex w-[1200px] items-start justify-between gap-[24px] px-[24px] py-[32px]"><div class="flex items-start gap-[18px]"><div class="flex flex-col items-center gap-[4px]">${INTERPLUG_MARK}<span class="text-[11px] whitespace-nowrap text-erp-label">INTERPLUG Co., Ltd.</span></div><div class="flex flex-col gap-[6px]">${row(quietLink("이용약관", link(R, "auth/terms.html#use")), quietLink("개인정보처리방침", "#"))}${row(
    "상호: 인터플러그",
    "주소: 03787 서울특별시 서대문구 연세로 5다길 22-3, 발리빌딩 3층",
  )}${row("이메일: help@interplug.co.kr", "전화번호: 6923-0028", "사업자등록번호 : 1233467890")}${row("통신판매업신고번호: 2021-00000000000")}<p class="mt-[6px] text-[12px] text-erp-muted">Copyrights© 2026 INTERPLUG. All Rights Reserved.</p></div></div><div class="flex items-center gap-[10px]">${SOCIAL}</div></div></footer>`;
}
export const sitePage = (A, R, { current, main, foot }) =>
  `<div class="${ui.ERP_THEME}"><div class="h-[100dvh] overflow-y-auto bg-white">${siteNav(A, R, current)}<main>${main}</main>${foot}</div></div>`;
