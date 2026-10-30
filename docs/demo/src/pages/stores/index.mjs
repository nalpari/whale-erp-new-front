// 점포 정보 관리 목록. 목업 docs/mockup/stores/index.html(S-BAYAJS) 의 기본 상태를 BP 마스터로 본 것.
// 목업 위쪽 검색 조건 묶음은 디자인 가이드의 왼쪽 필터로 옮겼다. 카드·표 전환은 목업대로 두고 카드가 기본이다(카드는 extra.mjs 임시 부품).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { tag } from "../../config-parts.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";
import { storeFilterSection } from "../../store-filter.mjs";
import { CLOSED_STORE, detailPageOf, noticeBand, statusBadge } from "../../store-parts.mjs";

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
    // 엑셀 받기 — 0건이면 막고 이유를 감싸는 칸(Blocked)에 단다(앱 ExcelDownloadButton 과 같다)
    const excel = document.querySelector("[data-excel]");
    if (excel) {
      excel.disabled = visible === 0;
      excel.parentElement.title = visible === 0 ? "받을 점포가 없습니다." : "";
    }
  };
  // 받는 동안 「파일 만드는 중 · N%」로 바뀌고 잠긴다 — 데모는 파일을 만들지 않고 글자만 보여 준다
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-excel]");
    if (!b || b.disabled) return;
    b.disabled = true;
    b.setAttribute("aria-busy", "true");
    const steps = ["파일 만드는 중", "파일 만드는 중 · 40%", "파일 만드는 중 · 100%"];
    steps.forEach((t, i) => setTimeout(() => (b.textContent = t), i * 500));
    setTimeout(() => { b.textContent = "엑셀 다운로드"; b.removeAttribute("aria-busy"); apply(); }, steps.length * 500);
  });
  // 처음 한 번 거른다 — 점포상태 기본값(미운영 · 운영)이라 폐점 점포는 폐점을 켜야 보인다(앱 stores-query.ts 의 기본 조건과 같다).
  // 공통 거르기(erp.js, defer)는 입력이 바뀔 때만 돌므로 그것이 붙은 뒤(DOMContentLoaded) 점포상태 칸에 change 를 한 번 보낸다
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('[role="group"][aria-label="점포상태"] input')?.dispatchEvent(new Event("change", { bubbles: true }));
    setTimeout(apply);
  });
  new MutationObserver(apply).observe(list, { childList: true });
  // 보기(탭)를 바꾸거나 돋보기(검색)를 누르면 공통 거르기가 다시 돌므로 그 뒤에 다시 센다
  document.addEventListener("click", (e) => { if (e.target.closest('[role="tab"], button[aria-label="검색"]')) setTimeout(apply); });
  // 공통 목록 거르기가 입력·선택 때마다 「총 N 건」을 다시 쓰므로, 그 뒤에 한 번 더 센다
  ["input", "change"].forEach((t) => document.addEventListener(t, () => setTimeout(apply)));
})();
</script>`;

// missing 을 주면 목록에서 고른 점포 중 그만큼을 찾지 못해 조건에서 뺀 것이다(index-missing.mjs, 앱 page.tsx 와 같다).
// 헤더 범위에서 고른 점포를 못 찾은 경우는 「상단에서 고른 점포를 찾을 수 없어 전체로 조회했습니다.」 띠다 — 데모 화면은 두지 않는다.
export const render = ({ A, R }, { missing = 0 } = {}) => {
  const filter = ui.filterPanel(A, [
    storeFilterSection(A),
    ui.filterSection("사업자등록번호", ui.searchField(A, { placeholder: "하이픈 없이 10자리", label: "사업자등록번호" }), { tight: true }),
    ui.filterSection("점포상태", ui.checkbox(A, "미운영", true) + ui.checkbox(A, "운영", true) + ui.checkbox(A, "폐점")),
    ui.filterSection("점포유형", ui.checkbox(A, "직영점포", true) + ui.checkbox(A, "가맹점포", true), { last: true }),
  ]);

  // 폐점 견본 점포는 등록이 가장 늦어 맨 위다. 점포상태 기본값에 폐점이 없어 처음에는 숨는다(위 스크립트)
  const list = [CLOSED_STORE, ...STORES];
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
  // 순번은 전체 건수에서 거꾸로 센다 — 맨 위(최신 등록)가 전체 건수, 가장 오래된 점포가 1(앱 store-table.tsx 와 같다)
  // 사업자등록번호가 없으면 회색 「미인증」
  const rows = list.map(([code, name, type, state, biz, phone, staff, date, region], i) => [
    list.length - i,
    code,
    ui.link(name, link(R, detailPageOf(code))),
    tag(type),
    statusBadge(state),
    biz === "-" ? '<span class="text-erp-muted">미인증</span>' : biz,
    phone,
    region,
    staff,
    date,
  ]);

  const cards = list.map(([code, name, type, state, biz, phone, staff, , region, image]) =>
    x.card({
      href: link(R, detailPageOf(code)),
      image: image && `${A}img/${image}`,
      title: name,
      sub: `${tag(type)}<span class="ml-[6px] inline-flex align-middle">${code}</span>`,
      badge: statusBadge(state),
      // 운영이 아닌 카드(미운영 · 폐점)는 흐리게 둔다(앱 store-parts.tsx StoreCard)
      muted: state !== "운영",
      // 미인증(사업자등록번호 없음)이면 점포주소를 반 칸으로 줄이고 옆에 「사업자정보 미인증」을 둔다 — 앱 store-parts.tsx 와 같다(2026-10-23).
      fields: [["점포 연락처", phone], ["재직직원", `${staff}명`], ["점포주소", region, biz !== "-"]],
      ...(biz === "-" && { notice: "사업자정보 미인증", noticeTerm: "사업자정보" }),
      data: { 점포코드: code, 점포명: name, 점포유형: type, 점포상태: state, 사업자등록번호: biz },
    }),
  );
  // 빈 상태 — 표와 같은 92px 한 줄(앱 page.tsx). 상단 범위와 고른 점포유형이 겹치지 않으면 앱은
  // 「상단 범위와 고른 점포유형이 겹치지 않아 조회된 점포가 없습니다.」다 — 데모 헤더 범위는 목록을 거르지 않아 이 문구는 두지 않는다
  const EMPTY = "조회된 점포가 없습니다.";
  const cardEmpty = `<p data-empty hidden class="col-span-full grid h-[92px] place-items-center rounded-[4px] border border-erp-panel-line text-[14px] text-erp-muted">${EMPTY}</p>`;
  const table = ui.dataTable(cols, rows, EMPTY).replace("</tbody>", ui.tableEmptyRow(cols, EMPTY).replace("<tr ", "<tr data-empty hidden ") + "</tbody>");

  // [엑셀 다운로드]는 공통 ExcelDownloadButton — 막힌 이유를 감싸는 칸(Blocked)에 단다. 받기 실패 · 예약 생성 안내 띠(ExcelDownloadNotice)는
  // 툴바 바로 위에 선다 — 데모는 받지 않아 띠를 그리지 않는다. [등록]은 툴바가 아니라 제목 줄 오른쪽(앱 page.tsx)
  const toolbar = ui.listToolbar(
    list.length,
    x.segment("보기", [
      { id: "cards", label: "카드", icon: x.ICON.grid },
      { id: "table", label: "표", icon: x.ICON.table },
    ]) +
      `<span class="inline-flex">${ui.button("엑셀 다운로드", { variant: "soft", "data-excel": true })}</span>` +
      `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`,
  );
  // 찾지 못한 점포 안내(앱 page.tsx) — 지워졌거나 볼 수 없게 된 점포를 조건에서 뺐다
  const missingBand = missing ? noticeBand("info", `고른 점포 ${missing}곳을 찾을 수 없어 조건에서 뺐습니다.`, "지워졌거나 볼 수 없게 된 점포입니다.") : "";

  return {
    title: missing ? "점포 정보 관리 · 찾지 못한 점포" : "점포 정보 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "점포 정보 관리",
      // 등록 버튼은 제목 줄 오른쪽 — 3팀 목록과 같은 자리. 가맹 마스터 · 가맹 관리자에게는 숨긴다(앱 page.tsx NotFranchise) —
      // 이 데모는 BP 마스터로만 보여 늘 보인다
      titleRight: ui.button("등록", { href: link(R, "stores/new.html") }),
      body: ui.listBody(
        filter,
        missingBand +
          toolbar +
          x.tabPanel("cards", x.cardGrid([...cards, cardEmpty]), true) +
          x.tabPanel("table", table, false) +
          `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
      ) + STORE_FILTER_SCRIPT,
    }),
  };
};

export default (ctx) => render(ctx);
