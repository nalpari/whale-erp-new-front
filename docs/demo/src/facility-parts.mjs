// 시설물 및 장비 관리(stores/facilities*) 화면만 쓰는 조각. 목업 docs/mockup/stores/facilities*.html 을 옮겼다.
// 근거: 「시설물·장비 관리 정책서」(claude.ai 문서, 2026-11-10) PL-1 ~ PL-6. 아직 앱 화면이 없어 1팀 공통 부품과 점포 화면 부품으로 그린다.
import * as ui from "./ui.mjs";
import { STORES } from "./site.mjs";
import { CLOSED_STORE, note } from "./store-parts.mjs";

// 그룹 = 공통코드 그룹 두 개(화면이 고정으로 부른다), 분류 = 그 그룹의 상세 코드(PL-3)
export const CODES = { "점포 시설물": ["식재보관", "급수", "냉난방"], "점포 장비": ["그라인더", "커피머신", "제빙기"] };
// 운영상태 = 공통코드 「시설물 운영상태」(플랫폼고정, PL-2) · 점검 주기 = 「시설물 점검 주기」(플랫폼고정, PL-6)
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

// 운영상태 배지 — 운영 파랑 · 보관 회색 · 폐기 빨강
export const facilityBadge = (state) => ui.badge(state === "운영" ? "on" : state === "폐기" ? "off" : "closed", state);

// 그룹을 골라야 분류가 나온다 — 그룹이 「전체」(또는 「선택」)면 분류는 막고, 바꾸면 처음 값으로 돌린다(PL-3).
// 그룹 선택칸 data-group-of="분류칸 id", 분류칸에 처음 값(data-first)을 단다. 한 화면에 한 번만 붙는다.
export const GROUP_SCRIPT = `<script>
(() => {
  if (window.__facilityGroup) return;
  window.__facilityGroup = true;
  const CODES = ${JSON.stringify(CODES)};
  const fill = (g) => {
    const k = document.getElementById(g.dataset.groupOf);
    const list = CODES[g.value] || [];
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

// 구매액 — 숫자만 10자리, 천 단위 쉼표(PL-5). 근로계약서 작성의 시급 · 급여명세서 검토의 금액 칸과 같은 모양:
// 공통 입력칸 그대로(왼쪽 정렬, 단위 글자를 칸 옆에 붙이지 않는다), 단위 · 규칙은 칸 아래 회색 도움말 한 줄
export const amount = (value = "") =>
  `<div class="flex flex-col gap-[8px]">${ui.textField({ value, inputmode: "numeric", maxlength: 13, "aria-label": "구매액", placeholder: "숫자만 입력" })}<span class="text-[13px] text-erp-label">원 단위로 숫자만 입력할 수 있습니다.</span></div>`;

export { note };
