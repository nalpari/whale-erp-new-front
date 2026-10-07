// 점포 정보 관리 목록. 목업 docs/mockup/stores/index.html(S-BAYAJS) 의 기본 상태를 BP 마스터로 본 것.
// 목업 위쪽 검색 조건 묶음은 디자인 가이드의 왼쪽 필터로 옮겼다. 카드·표 전환은 목업대로 두고 카드가 기본이다(카드는 extra.mjs 임시 부품).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const filter = ui.filterPanel(A, [
    ui.filterSection("점포", ui.searchField(A, { placeholder: "점포코드·점포명" }), { tight: true }),
    ui.filterSection("사업자등록번호", ui.searchField(A, { placeholder: "하이픈 없이 10자리", label: "사업자등록번호" }), { tight: true }),
    ui.filterSection("점포상태", ui.checkbox(A, "미운영", true) + ui.checkbox(A, "운영", true) + ui.checkbox(A, "폐점")),
    ui.filterSection("점포유형", ui.checkbox(A, "직영점포", true) + ui.checkbox(A, "가맹점포", true), { last: true }),
  ]);

  const cols = [
    { header: "순번", width: "w-[60px]" },
    { header: "점포코드", width: "w-[110px]" },
    { header: "점포명", align: "left" },
    { header: "점포유형", width: "w-[110px]" },
    { header: "점포상태", width: "w-[98px]" },
    { header: "사업자등록번호", width: "w-[150px]" },
    { header: "연락처", width: "w-[150px]" },
    { header: "근무직원수", width: "w-[100px]" },
    { header: "등록일", width: "w-[120px]" },
  ];
  const rows = STORES.map(([code, name, type, state, biz, phone, staff, date], i) => [
    i + 1,
    code,
    ui.link(name, link(R, "stores/detail.html")),
    type,
    ui.badge(state === "운영" ? "on" : "off", state),
    biz,
    phone,
    staff,
    date,
  ]);

  const cards = STORES.map(([code, name, type, state, biz, phone, staff, , region, image]) =>
    x.card({
      href: link(R, "stores/detail.html"),
      image: image && `${A}img/${image}`,
      title: name,
      sub: `${code} · ${type}`,
      badge: ui.badge(state === "운영" ? "on" : "off", state),
      muted: state === "미운영",
      fields: [["근무직원", `${staff}명`], ["연락처", phone], ["지역", region, true]],
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
      ),
    }),
  };
};
