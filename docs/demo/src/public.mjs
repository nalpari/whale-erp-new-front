// 비로그인 디자인으로 옮기지 않은 로그인 전 화면(새 비밀번호 설정)이 쓰는 틀. ERP 헤더가 없다.
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
// 폭을 꽉 채우는 버튼. Button 에 className 을 넘기지 않고 감싸는 쪽이 폭을 정한다.
export const block = (html) => `<div class="grid">${html}</div>`;
// 칸 둘을 위쪽에 맞춰 나란히(도움말 줄 수가 달라도 입력칸이 어긋나지 않게)
export const row = (...c) => `<div class="flex w-full items-start gap-[6px]">${c.join("")}</div>`;
export const cardTitle = (t, lead = "") =>
  `<div class="flex flex-col gap-[6px]"><h1 class="text-[18px] font-semibold">${t}</h1>${lead ? `<p class="text-[14px] text-erp-label">${lead}</p>` : ""}</div>`;

// 가운데 카드 하나짜리 화면(새 비밀번호 설정). 로그인·찾기·가입·약관 전문은 비로그인 디자인(src/guest.mjs)으로 옮겼다.
export function authPage(A, R, { card, width = "w-[420px]", foot = "", home = link(R, "auth/login.html") }) {
  return `<div class="${ui.ERP_THEME}"><div class="h-[100dvh] overflow-y-auto bg-erp-thead-bg"><div class="flex min-h-full flex-col items-center justify-center gap-[24px] p-[24px]">${brand(A, home)}<main class="flex ${width} flex-col gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">${card}</main>${foot}</div></div></div>`;
}

// 약관 전문 화면의 문구. 목업 auth.js 의 TERMS 에서 읽는다. 회원가입 내용보기는 앱 sign-up/terms.tsx 초안을 따로 옮겼다(signup.mjs).
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
