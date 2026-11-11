// 시설물 및 장비 관리(stores/facilities*) 화면만 쓰는 조각. 목업 docs/mockup/stores/facilities*.html 을 옮겼다.
// 근거: 「시설물·장비 관리 정책서」(claude.ai 문서, 2026-11-10) PL-1 ~ PL-6. 아직 앱 화면이 없어 1팀 공통 부품과 점포 화면 부품으로 그린다.
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import { STORES } from "./site.mjs";
import { CLOSED_STORE, note } from "./store-parts.mjs";
import { REQ } from "./biz-form.mjs";
import { tag } from "./config-parts.mjs";

// 그룹 = 공통코드 그룹 두 개(화면이 고정으로 부른다), 분류 = 그 그룹의 상세 코드(PL-3)
export const CODES = { "점포 시설물": ["식재보관", "급수", "냉난방"], "점포 장비": ["그라인더", "커피머신", "제빙기"] };
// 그룹마다 불러오는 공통코드 그룹 코드(제안 이름, 1팀 확정 전)
export const GROUP_CODES = { "점포 시설물": "STORE_FACILITY", "점포 장비": "STORE_EQUIPMENT" };
// 운영상태 = 공통코드 「시설물 운영상태」(플랫폼고정, PL-2) · 점검 주기 = 「시설물 점검 주기」(플랫폼제공, PL-6)
export const STATUSES = ["운영", "보관", "폐기"];
export const CYCLES = ["매일", "매주", "매월", "수시"];

// 견본 시설물·장비 — [id, 운영상태, 점포코드, 그룹, 분류, 이름, 등록일]. 등록일 내림차순(목록 기본 정렬)
export const FACILITIES = [
  [6, "운영", "ST000002", "점포 장비", "그라인더", "EK43S 전자동 원두 커피 그라인더", "2026-11-02"],
  [5, "운영", "ST000002", "점포 시설물", "식재보관", "업소용 4도어 냉장고", "2026-10-28"],
  [4, "운영", "ST000005", "점포 장비", "커피머신", "라마르조코 리네아 PB 2그룹", "2026-10-15"],
  [3, "보관", "ST000003", "점포 시설물", "급수", "직수형 정수기", "2026-09-03"],
  [2, "폐기", "ST000005", "점포 장비", "제빙기", "호시자키 제빙기 IM-45", "2026-06-20"],
  [1, "운영", CLOSED_STORE[0], "점포 시설물", "냉난방", "천장형 냉난방기", "2025-03-02"],
];
// 목록 점포 검색은 폐점 점포도 고를 수 있다(PL-1)
export const ALL_STORES = [...STORES, CLOSED_STORE];
export const storeName = (code) => ALL_STORES.find((s) => s[0] === code)?.[1] ?? code;

// 견본 수리 이력 — [id, 점포코드, 그룹, 분류, 시설물·장비 이름, 대상 운영상태, 고장 내용, 수리비, 고장일자, 수리일자]. 고장일 내림차순(목록 기본 정렬).
// 수리 전 이력은 수리비 · 수리일자가 비어 있다. 대상이 폐기됐거나 점포가 폐점해도 이력은 남는다(수리 이력 정책서 PL-1 · PL-4)
export const REPAIRS = [
  [5, "ST000002", "점포 장비", "그라인더", "EK43S 전자동 원두 커피 그라인더", "운영", "원두가 정상적인 굵기로 분쇄되지 않음", "200,000", "2026-11-03", "2026-11-05"],
  [4, "ST000002", "점포 시설물", "식재보관", "업소용 4도어 냉장고", "운영", "냉장실 온도가 8도 이상으로 올라감", "", "2026-11-08", ""],
  [3, "ST000005", "점포 장비", "커피머신", "라마르조코 리네아 PB 2그룹", "운영", "스팀 압력이 오르지 않음", "450,000", "2026-10-20", "2026-10-22"],
  [2, "ST000005", "점포 장비", "제빙기", "호시자키 제빙기 IM-45", "폐기", "얼음이 만들어지지 않음", "120,000", "2026-06-02", "2026-06-04"],
  [1, CLOSED_STORE[0], "점포 시설물", "냉난방", "천장형 냉난방기", "운영", "냉방이 약함", "80,000", "2025-07-11", "2025-07-12"],
];
// 수리 대상 선택지 — 분류마다 운영상태가 「운영」인 시설물·장비만(수리 이력 정책서 PL-1). 견본 점포(성수점) 기준
export const OPERATING_BY_CLASS = { 그라인더: ["EK43S 전자동 원두 커피 그라인더"], 식재보관: ["업소용 4도어 냉장고"], 커피머신: [], 제빙기: [], 급수: [], 냉난방: [] };
// 수리비 결제 수단 — 공통코드 「수리비 결제 수단」(플랫폼고정, 수리 이력 정책서 PL-2)
export const PAYMENT_METHODS = ["현금", "계좌이체", "신용카드", "기타"];

// 운영상태 배지 — 운영 파랑 · 보관 회색 · 폐기 빨강
export const facilityBadge = (state) => ui.badge(state === "운영" ? "on" : state === "폐기" ? "off" : "closed", state);

// 그룹을 골라야 분류가 나온다 — 그룹이 「전체」(또는 「선택」)면 분류는 막고, 바꾸면 처음 값으로 돌린다(PL-3).
// 그룹 선택칸 data-group-of="분류칸 id", 분류칸에 처음 값(data-first)을 단다. 한 화면에 한 번만 붙는다.
export const GROUP_SCRIPT = `<script>
(() => {
  if (window.__facilityGroup) return;
  window.__facilityGroup = true;
  const CODES = ${JSON.stringify(CODES)};
  const GROUP_CODES = ${JSON.stringify(GROUP_CODES)};
  const fill = (g) => {
    const k = document.getElementById(g.dataset.groupOf);
    const list = CODES[g.value] || [];
    // 분류 칸 이름 줄의 출처 꼬리표도 고른 그룹의 공통코드 그룹으로 바꾼다 — 그룹을 안 골랐으면 숨긴다
    const src = document.querySelector('[data-code-of="' + g.dataset.groupOf + '"]');
    if (src) { src.hidden = !GROUP_CODES[g.value]; src.querySelector("[data-code]").textContent = GROUP_CODES[g.value] || ""; }
    k.innerHTML = [k.dataset.first, ...list].map((c) => "<option>" + c + "</option>").join("");
    k.disabled = !list.length;
    k.title = list.length ? "" : "그룹을 먼저 선택해 주세요.";
    k.dispatchEvent(new Event("change", { bubbles: true }));
  };
  document.addEventListener("change", (e) => { if (e.target.matches("[data-group-of]")) fill(e.target); });
  // 필터 초기화는 그룹을 처음 값으로 되돌린 뒤 input 만 보낸다 — 그 뒤에 분류를 다시 맞춘다
  document.addEventListener("click", (e) => { if (e.target.closest('button[aria-label$="초기화"]')) setTimeout(() => document.querySelectorAll("[data-group-of]").forEach(fill)); });
})();
</script>`;

// 플랫폼제공 공통코드에서 값을 가져오는 등록 · 수정 칸 — 칸 이름 줄 오른쪽 끝에 출처 「공통코드 그룹 [코드]」(FAQ 등록 카테고리와 같은 모양, 2026-11-11 사용자 지정).
// BP 가 공통코드 관리에서 볼 수 없는 플랫폼고정 그룹(운영상태 · 수리비 결제 수단)에는 붙이지 않는다 — 분류 · 점검 주기만 해당한다.
export const CYCLE_CODE = "FACILITY_INSPECTION_CYCLE";
// codes 는 꼬리표로 보일 그룹 코드 목록. codeOf 를 주면 그 분류칸 id 의 출처라 그룹을 바꿀 때 GROUP_SCRIPT 가 꼬리표 글자를 바꾼다
const codeSource = (codes, codeOf) =>
  `<span ${codeOf ? `data-code-of="${codeOf}" ` : ""}class="-my-[2px] ml-auto flex shrink-0 items-center gap-[6px] pl-[10px] text-[14px] font-medium text-erp-label">공통코드 그룹 ${codes
    .map((c) => (codeOf ? tag(c).replace("<span ", "<span data-code ") : tag(c)))
    .join("")}</span>`;
export const codeGroup = (label, codes, control, codeOf) =>
  `<div role="group" aria-label="${label.replace(REQ, "")}" class="flex min-w-px flex-1 flex-col justify-center gap-[8px]"><span class="flex items-center text-[14px] font-medium text-erp-label"><span class="truncate">${label}</span>${codeSource(codes, codeOf)}</span>${control}</div>`;

// 그룹 · 분류 선택칸 한 쌍. first: 「전체」(필터) · 「선택」(등록)
export const groupSelect = (id, { first, value = first, label = "그룹" } = {}) =>
  ui.select([first, ...Object.keys(CODES)], { value, "aria-label": label, "data-group-of": id });
export const classSelect = (id, { first, group, value = first, label = "분류" } = {}) => {
  const list = CODES[group] || [];
  return ui
    .select([first, ...list], { value, id, "aria-label": label, "data-first": first, disabled: list.length ? undefined : true, title: list.length ? undefined : "그룹을 먼저 선택해 주세요." });
};

// 점포 하나를 고르는 자동완성(등록 화면) — 칸을 누르면 고를 수 있는 점포 전체, 치면 점포명 · 점포코드로 좁힌다. 폐점 점포는 뺀다(PL-1).
// 공통 점포 필터(store-filter.mjs)의 펼친 목록 모양을 쓴다. 칸은 type=text — type=search 면 목록 거르기가 걸린다.
const DROPDOWN =
  "absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-[288px] overflow-y-auto overscroll-contain rounded-[2px] border border-[#ebebeb] bg-white p-[6px] shadow-[0_2px_6px_rgba(40,47,55,0.08)]";
export const storePick = (A, value = "") =>
  `<div class="relative" data-store-one data-pool="${STORES.map(([code, name]) => `${code}|${name}`).join(";")}">${ui
    .searchField(A, { placeholder: "점포명 또는 점포코드로 찾기", label: "점포", value })
    .replace('type="search"', 'type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" autocomplete="off"')}<div role="listbox" aria-label="선택할 수 있는 점포" hidden class="${DROPDOWN}"></div></div>` +
  `<script>
(() => {
  document.querySelectorAll("[data-store-one]:not([data-ready])").forEach((box) => {
    box.dataset.ready = "1";
    const q = box.querySelector("input"), list = box.querySelector("[role=listbox]");
    const pool = box.dataset.pool.split(";").map((s) => s.split("|"));
    let picked = q.value;
    const close = () => { list.hidden = true; q.setAttribute("aria-expanded", "false"); };
    const show = () => {
      const t = q.value === picked ? "" : q.value.replace(/\\s/g, "").toLowerCase();
      const found = pool.filter(([c, n]) => !t || c.toLowerCase().includes(t) || n.replace(/\\s/g, "").toLowerCase().includes(t));
      list.innerHTML = found.length
        ? '<p class="px-[10px] py-[6px] text-[12px] text-erp-label">' + (t ? "검색 결과 " : "선택할 수 있는 점포 ") + found.length + "곳</p>" +
          found.map(([c, n]) => '<button type="button" role="option" data-name="' + n + '" class="flex w-full items-center gap-[10px] rounded-[2px] px-[10px] py-[8px] text-left text-[14px] hover:bg-erp-thead-bg"><span class="text-erp-label">' + c + "</span><span>" + n + "</span></button>").join("")
        : '<p class="px-[10px] py-[8px] text-[14px] text-erp-muted">검색 조건에 맞는 점포가 없습니다.</p>';
      list.hidden = false;
      q.setAttribute("aria-expanded", "true");
    };
    q.addEventListener("focus", show);
    q.addEventListener("input", () => { picked = ""; show(); });
    q.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    list.addEventListener("mousedown", (e) => e.preventDefault());
    list.addEventListener("click", (e) => { const o = e.target.closest("[data-name]"); if (!o) return; q.value = picked = o.dataset.name; close(); });
    document.addEventListener("click", (e) => { if (!box.contains(e.target)) close(); });
  });
})();
</script>`;

// 문서 첨부 칸(앱 공통 AttachmentField 모양) — 종류마다 1개, JPG · PNG · PDF, 10MB 이하. 다 차면 [파일 선택]을 막는다(PL-5).
// files: [[이름, 크기, 그림?]], rejected: [[이름, 까닭]]
const thumb = (ext) => `<span class="grid size-[64px] shrink-0 place-items-center rounded-[8px] border border-erp-panel-line bg-erp-thead-bg text-[12px] text-erp-label">${ext}</span>`;
export const attachment = (label, files = [], rejected = []) => {
  const full = files.length >= 1;
  const pick = ui.button("파일 선택", { variant: "soft", disabled: full ? true : undefined, title: full ? `${label}은(는) 1개까지 첨부할 수 있습니다.` : undefined });
  const rows = files
    .map(
      ([name, size, image]) =>
        `<li class="flex items-center gap-[10px] border-b border-erp-divider ${image ? "py-[12px]" : "h-[34px]"}"><span class="flex min-w-0 flex-1 items-center gap-[10px]">${image ? thumb("PNG") : ""}<span class="truncate">${name}</span></span><span class="text-erp-label">${size}</span><button type="button" class="text-erp-link hover:underline">빼기</button></li>`,
    )
    .join("");
  const bad = rejected
    .map(
      ([name, reason]) =>
        `<li class="flex flex-col justify-center gap-[2px] border-b border-erp-divider py-[6px] leading-[1.6] break-keep"><p class="break-all text-erp-ink">${name}</p><p class="flex gap-[4px] pl-[6px] text-erp-off"><span aria-hidden="true" class="text-erp-muted">└</span><span>${reason}</span></p></li>`,
    )
    .join("");
  return (
    `<div role="group" aria-label="${label}" class="flex flex-col gap-[8px]">` +
    `<span class="text-[14px] font-medium text-erp-label">${label} <span class="ml-[4px] text-[12px] font-normal text-erp-muted">${files.length} / 1</span></span>` +
    `<div>${pick}</div>` +
    `<p class="break-keep text-[14px] leading-[1.6] text-erp-label">JPG, PNG, PDF 파일을 1개 첨부할 수 있습니다. <span class="whitespace-nowrap">(10MB 이하)</span></p>` +
    (rows ? `<ul aria-label="${label} 첨부파일" class="text-[14px]">${rows}</ul>` : "") +
    (bad ? `<ul role="status" aria-label="올리지 않은 파일" class="text-[14px]">${bad}</ul>` : "") +
    `</div>`
  );
};

// 금액 칸 하나(수리 이력 수리비) — 숫자만 10자리, 칸 아래 안내
export const amount = (value = "", label = "금액") =>
  `<div class="flex flex-col gap-[8px]">${ui.textField({ value, inputmode: "numeric", maxlength: 13, "aria-label": label, placeholder: "숫자만 입력" })}<span class="text-[13px] text-erp-label">원 단위로 숫자만 입력할 수 있습니다.</span></div>`;

// 단가 · 수량 · 총금액(PL-5) — 총금액은 입력할 수 없고 단가 × 수량으로 채운다. 단가는 숫자 10자리, 다 친 뒤 쉼표.
// 수량은 1 ~ 9,999, 처음 값 1. 「부가세 포함」을 켜면 단가 · 총금액을 부가세 포함으로 본다. 칸 옆에 「원」을 붙이지 않는다
const won = (unit, qty) => {
  const u = Number(String(unit).replace(/[^0-9]/g, ""));
  return u && qty ? (u * qty).toLocaleString("ko-KR") : "";
};
export const priceFields = (unit = "", qty = 1) =>
  `<div class="flex flex-col gap-[8px]"><span class="flex items-center gap-[18px] text-[14px] font-medium text-erp-label">구매 금액${x.toggle("부가세 포함", true)}</span>` +
  `<div data-price class="flex w-full gap-[6px]">${ui.field("단가", ui.textField({ value: unit, inputmode: "numeric", maxlength: 13, placeholder: "숫자만 입력", "data-unit": true }))}` +
  `${ui.field("수량", ui.textField({ value: String(qty), inputmode: "numeric", maxlength: 4, "data-qty": true }), "w-[120px] shrink-0")}` +
  `${ui.field("총금액", ui.textField({ value: won(unit, qty), readonly: true, placeholder: "단가 × 수량", "data-total": true }))}</div>` +
  `<span class="text-[13px] text-erp-label">원 단위로 숫자만 입력할 수 있습니다.</span></div>`;

// 메모 — 선택, 줄바꿈 · 공백 포함 200자. 칸 이름 옆에 글자 수(PL-5)
export const memoField = (value = "") =>
  `<label data-memo-box class="flex flex-col gap-[8px]"><span class="flex items-center gap-[6px] text-[14px] font-medium text-erp-label">메모<span data-memo-count class="text-[12px] font-normal text-erp-muted">${value.length} / 200</span></span>${ui.textarea({ rows: 3, value, maxlength: 200, placeholder: "메모를 입력해 주세요.", "data-memo": true })}</label>`;

// 단가 · 수량을 고칠 때마다 총금액을 다시 셈하고, 단가는 칸을 벗어날 때 쉼표를 붙인다. 메모는 글자 수를 센다
export const PRICE_SCRIPT = `<script>
(() => {
  if (window.__facilityPrice) return;
  window.__facilityPrice = true;
  const num = (v) => v.replace(/[^0-9]/g, "");
  const fmt = (v) => (v ? Number(v).toLocaleString("ko-KR") : "");
  const calc = (box) => {
    const u = num(box.querySelector("[data-unit]").value), q = num(box.querySelector("[data-qty]").value);
    box.querySelector("[data-total]").value = u && q ? fmt(String(Number(u) * Number(q))) : "";
  };
  document.addEventListener("input", (e) => {
    const t = e.target, box = t.closest("[data-price]");
    if (t.matches("[data-memo]")) t.closest("[data-memo-box]").querySelector("[data-memo-count]").textContent = t.value.length + " / 200";
    if (!box) return;
    if (t.matches("[data-unit]")) t.value = num(t.value).slice(0, 10);
    if (t.matches("[data-qty]")) t.value = num(t.value).slice(0, 4);
    calc(box);
  });
  document.addEventListener("focusout", (e) => {
    const t = e.target, box = t.closest("[data-price]");
    if (!box) return;
    if (t.matches("[data-unit]")) t.value = fmt(num(t.value));
    if (t.matches("[data-qty]") && !(Number(t.value) >= 1)) t.value = "1";
    calc(box);
  });
})();
</script>`;

// 고른 점포로 줄 거르기(목록 공통, col = 점포 열 번호, 그 칸의 [data-store] 글자로 견준다) — 점포 정보 관리 목록과 같은 점포 고르기(store-filter.mjs)라 칩 빼기 · 개수는 그 부품이 맡는다.
// 공통 거르기(erp.js, 필터 이름 = 열 머리)와 겹치지 않게 data-store-out 으로 숨기고, 「총 N 건」과 빈 줄을 다시 맞춘다.
export const storeFilterScript = (col) => `<style>[data-store-out]{display:none!important}</style><script>
(() => {
  const box = document.querySelector("[data-store-filter]");
  const list = box.querySelector("[data-spick-list]");
  const NAME = ${JSON.stringify(Object.fromEntries(ALL_STORES.map(([c, n]) => [c, n])))};
  const apply = () => {
    const picked = [...list.children].map((li) => NAME[li.dataset.code]);
    const rows = [...document.querySelectorAll("main table tbody tr")].filter((tr) => !tr.hasAttribute("data-empty"));
    rows.forEach((tr) => tr.toggleAttribute("data-store-out", picked.length > 0 && !picked.includes(tr.cells[${col}].querySelector("[data-store]").textContent.trim())));
    const visible = rows.filter((tr) => !tr.hidden && !tr.hasAttribute("data-store-out")).length;
    const total = [...document.querySelectorAll("main p")].find((q) => /^총\\s/.test(q.textContent.trim()) && q.querySelector("b"));
    if (total) total.querySelector("b").textContent = visible.toLocaleString("ko-KR");
    const empty = document.querySelector("main table tbody > [data-empty]");
    if (empty) empty.hidden = visible > 0;
  };
  new MutationObserver(apply).observe(list, { childList: true });
  ["input", "change", "click"].forEach((t) => document.addEventListener(t, () => setTimeout(apply)));
  document.addEventListener("DOMContentLoaded", () => setTimeout(apply));
})();
</script>`;

export { note };
