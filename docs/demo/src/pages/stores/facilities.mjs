// 시설물 및 장비 관리 목록. 목업 docs/mockup/stores/facilities.html 의 기본 상태를 BP 마스터로 본 것(1.5차, 앱 화면 없음).
// 목업 위쪽 검색 조건 묶음은 디자인 가이드의 왼쪽 필터로 옮겼다 — 점포 정보 관리 목록(stores/index.mjs)과 같다.
// 근거: 「시설물·장비 관리 정책서」 PL-1 ~ PL-3. BP 는 들어오기 전에 정해져 필터 · 열에 BP · 가맹이 없다.
import * as ui from "../../ui.mjs";
import { tag } from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { storeFilterSection } from "../../store-filter.mjs";
import { bulkUpload } from "../../facility-bulk.mjs";
import { ALL_STORES, FACILITIES, GROUP_SCRIPT, STATUSES, classSelect, facilityBadge, groupSelect, storeFilterScript, storeName } from "../../facility-parts.mjs";


export default ({ A, R }) => {
  const bulk = bulkUpload();
  // 점포 — 점포 정보 관리 목록과 같은 점포 검색(여러 곳 · [일괄검색]). 폐점 점포도 고를 수 있다(PL-1)
  // 운영상태 · 그룹 · 분류 · 시설물/장비명은 필터 이름이 표 머리와 같아 공통 거르기가 그 열로 거른다
  const filter = ui.filterPanel(A, [
    storeFilterSection(A, ALL_STORES),
    ui.filterSection("운영상태", ui.select(["전체", ...STATUSES], { "aria-label": "운영상태" }), { tight: true }),
    ui.filterSection("그룹", groupSelect("fac-class", { first: "전체" }), { tight: true }),
    // 그룹을 골라야 그 그룹의 분류가 나온다 — 「전체」면 막아 둔다(PL-3)
    ui.filterSection("분류", classSelect("fac-class", { first: "전체" }), { tight: true }),
    ui.filterSection("시설물/장비명", ui.searchField(A, { placeholder: "이름으로 찾기", label: "시설물/장비명" }), { tight: true, last: true }),
  ]);

  const cols = [
    { header: "순번", width: "w-[60px]" },
    { header: "운영상태", width: "w-[98px]" },
    { header: "점포", width: "w-[220px]", align: "left" },
    { header: "그룹", width: "w-[120px]" },
    { header: "분류", width: "w-[110px]" },
    { header: "시설물/장비명", align: "left" },
    { header: "등록일", width: "w-[120px]" },
  ];
  // 폐점 점포의 것도 남고 점포 옆에 폐점 꼬리표(조회만 된다, PL-1)
  const rows = FACILITIES.map(([id, state, code, group, klass, name, date], i) => [
    FACILITIES.length - i,
    facilityBadge(state),
    `<span data-store>${storeName(code)}</span>${code === "ST000012" ? `<span class="ml-[6px] inline-flex align-middle">${ui.badge("closed", "폐점")}</span>` : ""}`,
    tag(group),
    klass,
    // 견본 상세 — 커피머신은 수리 이력이 있어 삭제가 막힌 상세, 냉난방기는 폐점 점포 상세
    ui.link(name, link(R, id === 4 ? "stores/facilities-detail-history.html" : id === 1 ? "stores/facilities-detail-closed.html" : "stores/facilities-detail.html")),
    date,
  ]);
  const table = ui.fillTable(cols, rows, "조건에 맞는 시설물 · 장비가 없습니다.");

  return {
    title: "시설물 및 장비 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "시설물 및 장비 관리",
      // 등록은 제목 줄 오른쪽 — 권한 그룹이 이 메뉴에 등록 권한을 준 계정에만(PL-1). 데모는 BP 마스터라 늘 보인다
      // [일괄 등록]은 레이어 팝업(양식 내려받기 · 파일 올리기 · 미리보기, PL-7), [등록]은 등록 화면
      titleRight: `<div class="flex gap-[6px]">${bulk.button}${ui.button("등록", { href: link(R, "stores/facilities-new.html") })}</div>`,
      body:
        ui.listBody(
          filter,
          ui.listToolbar(rows.length, `<div class="w-[80px] shrink-0">${ui.select(["50", "100"], { "aria-label": "페이지당 건수" })}</div>`) +
            `<div class="flex flex-1 flex-col">${table}</div>` +
            `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
        ) +
        bulk.dialogs +
        GROUP_SCRIPT +
        storeFilterScript(2),
    }),
  };
};
