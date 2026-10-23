// 점포 정보 관리 목록. 목업 docs/mockup/stores/index.html(S-BAYAJS) 의 기본 상태를 BP 마스터로 본 것.
// 목업 위쪽 검색 조건 묶음은 디자인 가이드의 왼쪽 필터로 옮겼다. 카드·표 전환은 목업대로 두고 카드가 기본이다(카드는 extra.mjs 임시 부품).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { tag } from "../../config-parts.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";
import { storeFilter } from "../../store-filter.mjs";

// 필터의 점포 고르기는 1팀 공통 부품(store-filter.mjs) — 휴일 등록 「대상 점포」처럼 찾아 고르면 「선택한 점포」에 쌓인다.

// 고른 점포로 목록 거르기(이 화면 전용 — 칩 빼기·개수는 store-filter.mjs). 공통 erp.js 의 목록 거르기(hidden)와 겹치지 않게 data-store-out 으로 숨긴다.
const STORE_FILTER_SCRIPT = `<style>[data-store-out]{display:none!important}</style><script>
(() => {
  const box = document.querySelector("[data-store-filter]");
  const list = box.querySelector("[data-spick-list]");
  const codeOf = (el) => (el.tagName === "TR" ? el.cells[1] && el.cells[1].textContent.trim() : JSON.parse(el.dataset.fields || "{}")["점포코드"]);
  const apply = () => {
    const picked = [...list.children].map((li) => li.dataset.code);
    const items = [...document.querySelectorAll("[data-filter-items] > [data-fields]"), ...document.querySelectorAll("main table tbody tr")].filter((el) => codeOf(el));
    items.forEach((el) => el.toggleAttribute("data-store-out", picked.length > 0 && !picked.includes(codeOf(el))));
    // 목록 위 「총 N 건」 — 지금 보이는 보기(카드·표)에서 보이는 줄 수
    // 화면에 실제로 보이는 것만 센다 — 숨은 보기(탭)나 걸러진 항목은 offsetParent 가 없다
    const visible = items.filter((el) => el.offsetParent !== null).length;
    const total = [...document.querySelectorAll("main p")].find((q) => /^총\\s/.test(q.textContent.trim()) && q.querySelector("b"));
    if (total) total.querySelector("b").textContent = visible.toLocaleString("ko-KR");
    // 빈 결과 안내 — 공통 거르기는 자기 조건만 보고 결과가 있다고 여기므로, 고른 점포로 숨긴 것까지 쳐서 다시 정한다
    document.querySelectorAll("main [data-filter-items], main table tbody").forEach((set) => {
      const empty = set.querySelector(":scope > [data-empty]");
      if (!empty) return;
      const rows = [...set.children].filter((el) => el !== empty && codeOf(el));
      empty.hidden = !rows.length || rows.some((el) => !el.hidden && !el.hasAttribute("data-store-out"));
    });
  };
  new MutationObserver(apply).observe(list, { childList: true });
  // 보기(탭)를 바꾸거나 돋보기(검색)를 누르면 공통 거르기가 다시 돌므로 그 뒤에 다시 센다
  document.addEventListener("click", (e) => { if (e.target.closest('[role="tab"], button[aria-label="검색"]')) setTimeout(apply); });
  // 공통 목록 거르기가 입력·선택 때마다 「총 N 건」을 다시 쓰므로, 그 뒤에 한 번 더 센다
  ["input", "change"].forEach((t) => document.addEventListener(t, () => setTimeout(apply)));
})();
</script>`;

export default ({ A, R }) => {
  const filter = ui.filterPanel(A, [
    ui.filterSection("점포", storeFilter(A), { tight: true }),
    ui.filterSection("사업자등록번호", ui.searchField(A, { placeholder: "하이픈 없이 10자리", label: "사업자등록번호" }), { tight: true }),
    ui.filterSection("점포상태", ui.checkbox(A, "미운영", true) + ui.checkbox(A, "운영", true) + ui.checkbox(A, "폐점")),
    ui.filterSection("점포유형", ui.checkbox(A, "직영점포", true) + ui.checkbox(A, "가맹점포", true), { last: true }),
  ]);

  const cols = [
    { header: "순번", width: "w-[60px]" },
    { header: "점포코드", width: "w-[110px]" },
    { header: "점포명", width: "w-[160px]", align: "left" },
    { header: "점포유형", width: "w-[110px]" },
    { header: "점포상태", width: "w-[98px]" },
    { header: "사업자등록번호", width: "w-[150px]" },
    { header: "점포 연락처", width: "w-[150px]" },
    { header: "점포주소", width: "w-[150px]", align: "left" },
    { header: "재직직원", width: "w-[100px]" },
    { header: "등록일", width: "w-[120px]" },
  ];
  const rows = STORES.map(([code, name, type, state, biz, phone, staff, date, region], i) => [
    i + 1,
    code,
    ui.link(name, link(R, "stores/detail.html")),
    tag(type),
    ui.badge(state === "운영" ? "on" : "off", state),
    biz,
    phone,
    region,
    staff,
    date,
  ]);

  const cards = STORES.map(([code, name, type, state, biz, phone, staff, , region, image]) =>
    x.card({
      href: link(R, "stores/detail.html"),
      image: image && `${A}img/${image}`,
      title: name,
      sub: `${tag(type)}<span class="ml-[6px] inline-flex align-middle">${code}</span>`,
      badge: ui.badge(state === "운영" ? "on" : "off", state),
      muted: state === "미운영",
      // 미인증(사업자등록번호 없음)이면 점포주소를 반 칸으로 줄이고 옆에 「사업자정보 미인증」을 둔다 — 앱 store-parts.tsx 와 같다(2026-10-23).
      fields: [["점포 연락처", phone], ["재직직원", `${staff}명`], ["점포주소", region, biz !== "-"]],
      ...(biz === "-" && { notice: "사업자정보 미인증", noticeTerm: "사업자정보" }),
      data: { 점포코드: code, 점포명: name, 점포유형: type, 점포상태: state, 사업자등록번호: biz },
    }),
  );

  const toolbar = ui.listToolbar(
    STORES.length,
    x.segment("보기", [
      { id: "cards", label: "카드", icon: x.ICON.grid },
      { id: "table", label: "표", icon: x.ICON.table },
    ]) +
      ui.button("엑셀 다운로드", { variant: "soft" }) +
      ui.button("등록", { href: link(R, "stores/new.html") }) +
      `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`,
  );

  return {
    title: "점포 정보 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "점포 정보 관리",
      body: ui.listBody(
        filter,
        toolbar +
          x.tabPanel("cards", x.cardGrid(cards), true) +
          x.tabPanel("table", ui.dataTable(cols, rows, "조회된 점포가 없습니다."), false) +
          `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
      ) + STORE_FILTER_SCRIPT,
    }),
  };
};
