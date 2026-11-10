// 시설물 및 장비 수리 이력 목록. 목업 docs/mockup/stores/repairs.html 의 기본 상태를 BP 마스터로 본 것(1.5차, 앱 화면 없음).
// 목업 위쪽 검색 조건 묶음은 왼쪽 필터로 옮겼다 — 시설물·장비 목록(stores/facilities.mjs)과 같다.
// 근거: 「시설물·장비 수리 이력 정책서」 PL-1 · PL-4. BP 는 들어오기 전에 정해져 필터 · 열에 BP · 가맹이 없다.
import * as ui from "../../ui.mjs";
import { tag } from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { storeFilterSection } from "../../store-filter.mjs";
import { ALL_STORES, GROUP_SCRIPT, REPAIRS, classSelect, groupSelect, storeFilterScript, storeName } from "../../facility-parts.mjs";

const muted = (t) => `<span class="text-erp-muted">${t}</span>`;
// 검색일시 — 기준(고장일자 · 수리일자)을 고르고 그 날짜의 기간을 넣는다. 필터 폭(188px)이라 기준 · 시작 · 끝을 위아래로.
// 기준 선택칸은 안쪽 묶음 이름에 「검색 기준」을 넣어 공통 거르기(erp.js)가 글자로 거르지 않게 하고, 거르기는 아래 DATE_SCRIPT 가 맡는다
const searchDate = (A) =>
  `<div class="flex flex-col gap-[6px]"><div role="group" aria-label="검색일시 검색 기준">${ui.select(["고장일자", "수리일자"], { "aria-label": "검색일시 기준", "data-date-kind": true })}</div>${ui.dateField(A, { label: "검색일시 시작" })}${ui.dateField(A, { label: "검색일시 끝" })}</div>`;

// 고른 기준 열(고장일자 7 · 수리일자 8)의 날짜가 기간 안인 줄만 보인다. 기간을 비우면 거르지 않고, 기준 날짜가 없는 줄(수리 전 이력의 수리일자)은
// 기간을 넣으면 빠진다. 공통 거르기와 점포 거르기(hidden · data-store-out)와 겹치지 않게 data-date-out 으로 숨기고 「총 N 건」을 다시 센다
const DATE_SCRIPT = `<style>[data-date-out]{display:none!important}</style><script>
(() => {
  const kind = document.querySelector("[data-date-kind]");
  const from = document.querySelector('[aria-label="검색일시 시작"]');
  const to = document.querySelector('[aria-label="검색일시 끝"]');
  const ok = (v) => /^\\d{4}-\\d{2}-\\d{2}$/.test(v);
  const apply = () => {
    const col = kind.value === "수리일자" ? 8 : 7;
    const a = ok(from.value) ? from.value : "", b = ok(to.value) ? to.value : "";
    const rows = [...document.querySelectorAll("main table tbody tr")].filter((tr) => !tr.hasAttribute("data-empty"));
    rows.forEach((tr) => {
      const d = tr.cells[col].textContent.trim();
      const has = /^\\d{4}-/.test(d);
      tr.toggleAttribute("data-date-out", (a && (!has || d < a)) || (b && (!has || d > b)));
    });
    const visible = rows.filter((tr) => !tr.hidden && !tr.hasAttribute("data-date-out") && !tr.hasAttribute("data-store-out")).length;
    const total = [...document.querySelectorAll("main p")].find((q) => /^총\\s/.test(q.textContent.trim()) && q.querySelector("b"));
    if (total) total.querySelector("b").textContent = visible.toLocaleString("ko-KR");
    const empty = document.querySelector("main table tbody > [data-empty]");
    if (empty) empty.hidden = visible > 0;
  };
  ["input", "change"].forEach((t) => document.addEventListener(t, () => setTimeout(apply, 20)));
  document.addEventListener("click", () => setTimeout(apply, 20));
})();
</script>`;

export default ({ A, R }) => {
  // 점포 — 점포 정보 관리 목록과 같은 점포 검색(여러 곳 · [일괄검색] · 폐점 포함). 그룹을 골라야 분류가 나온다. 날짜는 검색일시 하나(기준 + 기간)
  const filter = ui.filterPanel(A, [
    storeFilterSection(A, ALL_STORES),
    ui.filterSection("그룹", groupSelect("rep-class", { first: "전체" }), { tight: true }),
    ui.filterSection("분류", classSelect("rep-class", { first: "전체" }), { tight: true }),
    ui.filterSection("시설물/장비명", ui.searchField(A, { placeholder: "이름으로 찾기", label: "시설물/장비명" }), { tight: true }),
    ui.filterSection("고장 내용", ui.searchField(A, { placeholder: "고장 내용으로 찾기", label: "고장 내용" }), { tight: true }),
    ui.filterSection("검색일시", searchDate(A), { tight: true, last: true }),
  ]);

  const cols = [
    { header: "순번", width: "w-[60px]" },
    { header: "점포", width: "w-[200px]", align: "left" },
    { header: "그룹", width: "w-[110px]" },
    { header: "분류", width: "w-[100px]" },
    { header: "시설물/장비명", width: "w-[240px]", align: "left" },
    { header: "고장 내용", align: "left" },
    { header: "수리비", width: "w-[110px]" },
    { header: "고장일자", width: "w-[110px]" },
    { header: "수리일자", width: "w-[110px]" },
  ];
  // 폐기된 대상 · 폐점 점포의 이력도 남고 배지를 붙인다(PL-4). 수리 전 이력은 수리비 · 수리일자가 「-」
  const rows = REPAIRS.map(([id, code, group, klass, name, state, fault, cost, faultDate, repairDate], i) => [
    REPAIRS.length - i,
    `<span data-store>${storeName(code)}</span>${code === "ST000012" ? `<span class="ml-[6px] inline-flex align-middle">${ui.badge("closed", "폐점")}</span>` : ""}`,
    tag(group),
    klass,
    `${name}${state === "폐기" ? `<span class="ml-[6px] inline-flex align-middle">${ui.badge("off", "폐기")}</span>` : ""}`,
    ui.link(fault, link(R, code === "ST000012" ? "stores/repairs-detail-closed.html" : "stores/repairs-detail.html")),
    cost || muted("-"),
    faultDate,
    repairDate || muted("-"),
  ]);
  const table = ui.fillTable(cols, rows, "조건에 맞는 수리 이력이 없습니다.");

  return {
    title: "시설물 및 장비 수리 이력",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "시설물 및 장비 수리 이력",
      // 등록은 제목 줄 오른쪽 — 권한 그룹이 이 메뉴에 등록 권한을 준 계정에만(PL-1)
      titleRight: ui.button("등록", { href: link(R, "stores/repairs-new.html") }),
      body:
        ui.listBody(
          filter,
          ui.listToolbar(rows.length, `<div class="w-[80px] shrink-0">${ui.select(["50", "100"], { "aria-label": "페이지당 건수" })}</div>`) +
            `<div class="flex flex-1 flex-col">${table}</div>` +
            `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
        ) +
        GROUP_SCRIPT +
        storeFilterScript(1) +
        DATE_SCRIPT,
    }),
  };
};
