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
// 칩에는 점포명만 쓰고(코드·유형은 title), 칩 영역은 늘 5줄 높이(34px × 5 + 간격 6px × 4)이고 넘치면 그 안에서 세로로 스크롤한다. 비면 안내 문구를 가운데 둔다.
const chip = ([name, code, type]) =>
  `<li data-code="${code}" title="${name} · ${code} · ${type}" class="flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px]"><span class="font-medium">${name}</span><button type="button" aria-label="${name} 빼기" class="grid size-[26px] place-items-center rounded-[2px] text-erp-label hover:text-erp-ink"><svg viewBox="0 0 8 8" class="size-[8px] stroke-current" aria-hidden="true"><path d="M1 1l6 6M7 1L1 7" stroke-width="1.5" stroke-linecap="round" fill="none"></path></svg></button></li>`;
// bulk: 고를 수 있는 점포 전체 [점포명, 코드, 유형, 고를 수 없는 사유?]. 주면 세 가지를 단다(erp.js).
//  · 점포 찾기 칸 아래 목록 — 칸을 누르면 아직 고르지 않은 점포가 모두 펼쳐지고, 글자를 넣으면 점포명·점포코드로 좁힌다. 고르면 칩 맨 앞에 붙는다.
//  · 칸 옆 [일괄 검색] 버튼과 두 목록 사이로 옮기는 확인창.
//  · 전체 제거(clearLabel) 버튼 — 칩을 모두 뺀다.
// hidden: 처음에 숨긴다(범위가 전체 점포인 등록 화면). 범위 선택에 data-spick-scope 를 달면 erp.js 가 전체 점포일 때 숨기고 일부 점포일 때 보인다.
export const storePicker = (A, { pool, picked, hint, label = "관리할 점포 찾기", clearLabel = "모두 빼기", bulk, hidden = false }) => {
  const dlg = bulk ? ui.uid("spick-bulk") : "";
  const search = ui.searchField(A, { placeholder: "점포명 또는 점포코드", label });
  // 떠 있는 목록이라 팝업 그림자 하나만 쓴다(DESIGN 뜬 것만 그림자). 테두리 #ebebeb 는 팝업 테두리 값.
  const dropdown = `<div role="listbox" aria-label="고를 수 있는 점포" hidden data-spick-dd class="absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-[288px] overflow-y-auto overscroll-contain rounded-[2px] border border-[#ebebeb] bg-white p-[6px] shadow-[0_2px_6px_rgba(40,47,55,0.08)]"></div>`;
  const find = bulk
    ? `<div class="flex items-start gap-[6px]"><div class="relative min-w-px flex-1" data-spick-find>${search}${dropdown}</div>${ui.button("일괄 검색", { variant: "soft", "data-spick-open": dlg })}</div>`
    : search;
  const clear = bulk
    ? // 줄 끝의 보조 버튼이라 좌우 여백만 24 → 12 로 줄인다(높이 34 는 그대로 — DESIGN 높이 체계)
      ui.button(clearLabel, { variant: "soft", "data-spick-clear": true }).replace('class="', 'class="ml-auto ').replace("px-[24px]", "px-[12px]")
    : `<button type="button" class="ml-auto text-erp-link hover:underline">${clearLabel}</button>`;
  const poolAttr = bulk ? ` data-spick-pool="${bulk.filter((s) => !s[3]).map((s) => s.slice(0, 3).join("|")).join(";")}"` : "";
  return `<div class="flex flex-col gap-[10px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[12px]" data-spick${poolAttr}${hidden ? " hidden" : ""}><div class="flex flex-col gap-[8px]"><p class="text-[14px] font-medium">점포 찾기${pool ? ` <span class="font-normal text-erp-label">${pool}</span>` : ""}</p>${find}${hint ? `<span class="text-[13px] text-erp-label">${hint}</span>` : ""}</div><div class="flex flex-col gap-[8px] border-t border-erp-divider pt-[10px]"><p class="flex min-h-[34px] items-center gap-[10px] text-[14px] font-medium">선택한 점포 <span class="font-normal text-erp-label" data-spick-count>${picked.length}개점</span>${clear}</p><div class="relative h-[194px]"><ul aria-label="선택한 점포" class="flex h-full flex-wrap content-start gap-[6px] overflow-y-auto overscroll-contain" data-spick-list>${picked.map(chip).join("")}</ul><p class="pointer-events-none absolute inset-0 grid place-items-center text-[13px] text-erp-muted" data-spick-none${picked.length ? " hidden" : ""}>아직 고른 점포가 없습니다. 위에서 찾아 더하세요.</p></div></div>${bulk ? storeBulkDialog(A, dlg, { stores: bulk, picked: picked.map((p) => p[1]) }) : ""}</div>`;
};

// 점포 일괄 검색 확인창(목업 spickpop). 왼쪽은 매핑 안 된 점포, 오른쪽은 매핑된 점포다.
// 체크하고 가운데 [추가 ›] · [‹ 빼기] 로 옮기거나, 줄을 끌어 반대쪽 목록에 놓는다(erp.js). 체크한 줄을 끌면 같은 쪽 체크한 줄이 모두 간다.
// 두 목록 위 옵션(전체 선택 · 직영점포 · 가맹점포)은 그 목록에서 묶음을 한꺼번에 체크한다. 사유가 있는 점포는 흐리게 두고 옮기지 않는다.
// 묶음 체크의 켜진 바탕·테두리는 aria-checked 변형으로 칠한다 — bg-white 가 erp.css 에서 bg-erp-brand 뒤에 나와 클래스 바꾸기로는 덮이지 않는다.
// 끌어 놓을 목록은 data-over 일 때 브랜드색 테두리가 된다. 열 때마다 erp.js 가 지금 칩(선택한 점포)으로 두 목록을 다시 나눈다.
function storeBulkDialog(A, id, { stores, picked }) {
  const groupCheck = (key, side, label) =>
    `<span role="checkbox" tabindex="0" aria-checked="false" aria-label="${label}" data-bulk-group="${key}" data-bulk-side="${side}" class="relative grid size-[20px] shrink-0 place-items-center rounded-[2px] border border-erp-field-line bg-white aria-checked:border-erp-brand aria-checked:bg-erp-brand aria-[checked=mixed]:border-erp-brand aria-disabled:opacity-40"><img alt="" width="12" height="9" class="hidden" data-group-check src="${A}icons/check.svg"><span class="hidden h-[2px] w-[10px] bg-erp-brand" data-group-mixed></span></span>`;
  const opt = (key, side, label) =>
    `<span class="flex cursor-pointer items-center gap-[6px] text-[13px] text-erp-ink" data-bulk-opt>${groupCheck(key, side, label)}${label}<span class="text-erp-muted" data-bulk-optcount></span></span>`;
  const row = ([name, code, type, lock], i) =>
    `<label data-bulk-item data-code="${code}" data-order="${i}" draggable="${!lock}" class="flex items-center gap-[8px] rounded-[2px] px-[8px] py-[6px] ${lock ? "cursor-not-allowed text-erp-muted" : "cursor-grab text-erp-ink hover:bg-erp-thead-bg has-checked:bg-erp-subtle"}"${lock ? ` title="${lock} · 고를 수 없습니다"` : ""}>${ui.checkbox(A, "", false, {
      "data-bulk-pick": "",
      "data-bulk-type": type,
      "data-name": name,
      "data-code": code,
      "aria-label": name,
      disabled: !!lock,
    })}<span class="min-w-0 flex-1 truncate text-[13px]">${name}</span><span class="shrink-0 text-[11.5px] text-erp-muted">${code}</span><span class="w-[52px] shrink-0 text-right text-[11.5px] text-erp-muted">${lock || type}</span></label>`;
  const types = [...new Set(stores.map((s) => s[2]))];
  const opts = (side, label) =>
    `<div role="group" aria-label="${label}" class="flex shrink-0 flex-wrap gap-x-[18px] gap-y-[6px] border-b border-erp-divider px-[12px] py-[10px]">${opt("*", side, "전체 선택")}${types.map((t) => opt(t, side, t)).join("")}</div>`;
  const items = stores.map(row);
  const pane = (side, title, extra, list, empty) =>
    `<section data-bulk-pane="${side}" aria-label="${title}" class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[4px] border border-erp-panel-line transition-[border-color] duration-150 ease-out data-[over]:border-erp-brand"><div class="flex h-[42px] shrink-0 items-center gap-[8px] border-b border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px] font-medium">${title}<span class="font-normal text-erp-label" data-bulk-count></span></div>${extra.opts || ""}<div class="h-[300px] overflow-y-auto overscroll-contain p-[4px]" data-bulk-list>${list}<p class="px-[12px] py-[40px] text-center text-[13px] leading-[1.6] text-erp-muted" data-bulk-empty>${empty}</p></div></section>`;
  const move = (to, label) =>
    ui.button(label, { variant: "off", "data-bulk-move": to, disabled: true }).replace('class="', 'class="disabled:pointer-events-none disabled:opacity-40 ');
  const left = pane(
    "L",
    "매핑 안 된 점포",
    { opts: opts("L", "매핑 안 된 점포에서 한꺼번에 체크") },
    stores.map((s, i) => (picked.includes(s[1]) ? "" : items[i])).join(""),
    "고를 수 있는 점포를 모두 매핑했습니다.",
  );
  const right = pane(
    "R",
    "매핑된 점포",
    { opts: opts("R", "매핑된 점포에서 한꺼번에 체크") },
    stores.map((s, i) => (picked.includes(s[1]) ? items[i] : "")).join(""),
    "아직 매핑된 점포가 없습니다.<br>왼쪽에서 골라 옮기세요.",
  );
  const body =
    `<p class="text-[13px] text-erp-label">왼쪽에서 체크하고 [추가 ›] 를 누르거나 끌어서 오른쪽에 놓으면 매핑됩니다. 오른쪽에서 빼면 매핑이 풀립니다.</p>` +
    `<div class="mt-[12px] flex items-stretch gap-[12px]">${left}<div class="flex shrink-0 flex-col justify-center gap-[6px]">${move("R", "추가 ›")}${move("L", "‹ 빼기")}</div>${right}</div>`;
  return `<dialog id="${id}" data-bulk-popup aria-labelledby="${id}-t" class="m-auto w-[800px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"><h2 id="${id}-t" class="text-[18px] font-semibold">점포 일괄 검색</h2><div class="mt-[12px] text-[14px] leading-[1.6] text-erp-ink">${body}</div><div class="mt-[24px] flex justify-end gap-[6px]">${ui.button("취소", { variant: "off", "data-close": true })}${ui.button(`${picked.length}개점 적용`, { "data-bulk-apply": true })}</div></dialog>`;
}

// 화면 아래 가운데 버튼 줄
export const buttons = (...b) => `<div class="flex justify-center gap-[6px]">${b.join("")}</div>`;
