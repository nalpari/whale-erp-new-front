// 환경설정(config) 화면이 같이 쓰는 임시 부품. 1팀 공통 컴포넌트에 없는 것들이라 컴포넌트 제안 대상이다.
// 생김새는 DESIGN.md 토큰과 규칙(2px 모서리, 1px 선, 34/42/46 높이)으로만 만든다. system 화면의 같은 부품과 모양을 맞췄다.
import * as ui from "./ui.mjs";
export { help, req, tel } from "./biz-form.mjs";

// 사용자 안내 문구(목업 .note)
export const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
// 제목 옆 보조 글자
export const sub = (t) => `<span class="ml-[10px] text-[14px] font-normal text-erp-label">${t}</span>`;
export const muted = (t) => `<span class="text-erp-muted">${t}</span>`;
// 안내 띠(목업 band 의 제목 줄)
export const band = (text) => `<p class="flex min-h-[42px] items-center rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[12px] py-[8px] text-[14px] font-medium text-erp-ink">${text}</p>`;
// 구분 꼬리표(역할·관리 주체·적용 범위 같은 분류 값). 상태가 아니라서 색을 쓰지 않고 표 머리 바탕·선에 2depth 글자색. 높이는 배지와 같다.
export const tag = (t) => `<span class="inline-block rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub">${t}</span>`;
// 입력칸 + 도움말을 세로로
export const stack = (...c) => `<div class="flex flex-col gap-[8px]">${c.join("")}</div>`;
// 위쪽 정렬 formRow(도움말 줄 수가 달라도 입력칸 높이가 맞게)
export const row = (...c) => ui.formRow(...c).replace('class="flex w-full gap-[6px]"', 'class="flex w-full items-start gap-[6px]"');
// 빈 칸(두 칸 줄의 오른쪽을 비울 때)
export const blank = '<div class="min-w-px flex-1"></div>';
// 두 칸 묶음 카드(목록 + 상세처럼 나란히 놓는 카드). system/codes 와 같은 껍데기.
export const card = (w, html) => `<section class="${w} flex flex-col gap-[12px] overflow-y-auto rounded-[4px] [&>*]:shrink-0 border border-erp-panel-line bg-white p-[25px]">${html}</section>`;
// 확인창 안의 짧은 항목·값 목록(목업 .kv)
export const kv = (rows, w = 96) =>
  `<dl class="grid gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]" style="grid-template-columns:${w}px 1fr">${rows
    .map(([k, v]) => `<dt class="text-erp-label">${k}</dt><dd>${v}</dd>`)
    .join("")}</dl>`;
// 넓은 확인창. extra.mjs 의 dialog 는 420px 고정이라 폭만 바꾼다.
export const wide = (dialogHtml, w) => dialogHtml.replace("w-[420px]", w);
// 표의 n 번째 줄들을 흐리게(미사용·지난 날짜)
export const dimRows = (table, idx) => {
  let n = -1;
  return table.replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, (m) => (idx.includes(++n) ? m.replace('">', ' text-erp-muted">') : m));
};
// 고른 줄 표시(표 머리 바탕)
export const markRow = (table, n) => {
  let i = -1;
  return table.replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, (m) => (++i === n ? m.replace('">', ' bg-erp-thead-bg">') : m));
};
// 두 줄 칸(표 한 칸에 위아래 두 값)
export const two = (a, b) => `<span class="block truncate">${a}</span><span class="block truncate">${b}</span>`;
// 라디오 묶음(목업 seg · typepick). ui.radio 를 한 줄로.
export const radios = (name, items, checked) =>
  `<div role="radiogroup" class="flex min-h-[34px] flex-wrap items-center gap-x-[24px] gap-y-[8px]">${items.map((t, i) => ui.radio(t, name, i === checked)).join("")}</div>`;

// 점포 고르기(목업 spick). 위는 점포 검색칸, 아래는 고른 점포 칩. 칩의 x 는 흉내만.
const chip = ([name, code, type]) =>
  `<li class="flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px]"><span class="font-medium">${name}</span><span class="text-erp-label">${code} · ${type}</span><button type="button" aria-label="${name} 빼기" class="grid size-[26px] place-items-center rounded-[2px] text-erp-label hover:text-erp-ink"><svg viewBox="0 0 8 8" class="size-[8px] stroke-current" aria-hidden="true"><path d="M1 1l6 6M7 1L1 7" stroke-width="1.5" stroke-linecap="round" fill="none"></path></svg></button></li>`;
export const storePicker = (A, { pool, picked, hint, label = "관리할 점포 찾기" }) =>
  `<div class="flex flex-col gap-[10px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[12px]"><div class="flex flex-col gap-[8px]"><p class="text-[14px] font-medium">점포 찾기 <span class="font-normal text-erp-label">${pool}</span></p>${ui.searchField(A, { placeholder: "점포명 또는 점포코드", label })}${hint ? `<span class="text-[13px] text-erp-label">${hint}</span>` : ""}</div><div class="flex flex-col gap-[8px] border-t border-erp-divider pt-[10px]"><p class="flex items-center gap-[10px] text-[14px] font-medium">선택한 점포 <span class="font-normal text-erp-label">${picked.length}개점</span><button type="button" class="ml-auto text-erp-link hover:underline">모두 빼기</button></p><ul aria-label="선택한 점포" class="flex flex-wrap gap-[6px]">${picked.map(chip).join("")}</ul></div></div>`;

// 화면 아래 가운데 버튼 줄
export const buttons = (...b) => `<div class="flex justify-center gap-[6px]">${b.join("")}</div>`;
