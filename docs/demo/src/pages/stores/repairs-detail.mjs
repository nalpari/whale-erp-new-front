// 시설물 및 장비 수리 이력 상세. 목업 docs/mockup/stores/repairs-detail.html 을 BP 마스터로 본 것(1.5차, 앱 화면 없음).
// 생김새는 시설물·장비 상세(stores/facilities-detail.mjs): 테두리 없는 이름 줄 + 실행 버튼, 그 아래 상세 표 두 개(고장 정보 · 수리 정보).
// render 의 sample: "base"(수리 완료) · "closed"(폐점 점포 — 조회만, repairs-detail-closed.mjs).
// 근거: 「시설물·장비 수리 이력 정책서」 PL-1 · PL-3 · PL-4. 저장된 값이 있는 항목만 보인다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { tag, warnBand } from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { noticeBand } from "../../store-parts.mjs";

const SAMPLES = {
  base: { store: "모리커피 성수점", group: "점포 장비", klass: "그라인더", name: "EK43S 전자동 원두 커피 그라인더", fault: "원두가 정상적인 굵기로 분쇄되지 않음", cause: "원두 그라인더의 칼날 마모", faultDate: "2026-11-03", repairDate: "2026-11-05", tech: ["홍길동", "010-2222-3333"], cost: "200,000원", pay: "신용카드", parts: [["그라인더 모터", 1], ["그라인더 칼날", 2]] },
  closed: { store: "모리커피 해운대점", group: "점포 시설물", klass: "냉난방", name: "천장형 냉난방기", fault: "냉방이 약함", cause: "냉매 부족", faultDate: "2025-07-11", repairDate: "2025-07-12", tech: ["이준서", "010-7788-1234"], cost: "80,000원", pay: "현금", parts: [["냉매 R410A", 1]] },
};
const sub = (t) => `<span class="text-erp-label">${t}</span>`;

export const render = ({ A, R }, { sample = "base" } = {}) => {
  const d = SAMPLES[sample];
  const closed = sample === "closed";
  const deleteId = ui.uid("dialog");

  // 폐점 점포는 [목록]만(조회만, PL-1). [목록]은 늘 Primary
  const actions =
    (closed ? "" : x.dialogTrigger("삭제", deleteId, "soft") + ui.button("수정", { variant: "soft", href: link(R, "stores/repairs-edit.html") })) +
    ui.button("목록", { href: link(R, "stores/repairs.html") });

  const head = `<div class="flex items-center gap-[18px] py-[6px]">
    <div class="flex min-w-0 flex-1 flex-col gap-[6px]">
      <h2 class="truncate text-[20px] font-semibold text-erp-ink">${d.fault}</h2>
      <div class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label"><span>${d.store}</span>${closed ? ui.badge("closed", "폐점") : ""}<span class="h-[11px] w-px bg-[#d9d9d9]"></span><span>${d.name}</span></div>
    </div>
    <div class="flex shrink-0 gap-[6px]">${actions}</div>
  </div>`;

  // 시설물/장비명을 누르면 그 시설물·장비 상세로 간다
  const fault = ui.detailTable("고장 정보", [
    ["점포", d.store],
    ["시설물·장비", ui.detailValues([tag(d.group), d.klass, ui.link(d.name, link(R, "stores/facilities-detail.html"))])],
    ["고장 내용", d.fault],
    ["고장 원인", d.cause],
    ["고장 일자", d.faultDate],
    ["변경이력", ui.detailValues([`${sub("등록")} 2026-11-03 18:20 · 정하윤`, `${sub("최종수정")} 2026-11-05 11:02 · 정하윤`])],
  ]);
  // 교체 부품은 「부품명 | 수량개」 한 줄씩 — 줄이 여럿이라 값이 여러 줄인 줄(multiline)로 둔다(PL-3)
  const repair = ui.detailTable("수리 정보", [
    ["수리 일자", d.repairDate],
    ["수리기사", ui.detailValues(d.tech)],
    ["수리비", ui.detailValues([`${d.cost} ${sub("(부가세 포함)")}`, d.pay])],
    ["교체 부품", `<div class="flex flex-col gap-[4px]">${d.parts.map(([n, q]) => `<span class="flex items-center gap-[10px]">${ui.detailValues([n, `${q}개`])}</span>`).join("")}</div>`, true],
  ]);

  // 삭제 확인 — 논리 삭제, 교체 부품 줄도 함께(PL-4). 1팀 화면은 빨간 버튼을 쓰지 않는다
  const deleteDialog = closed
    ? ""
    : x.dialog(
        deleteId,
        "수리 이력을 삭제하시겠습니까?",
        `<div class="flex flex-col gap-[12px]"><dl class="grid grid-cols-[90px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]"><dt class="text-erp-label">시설물/장비명</dt><dd>${d.name}</dd><dt class="text-erp-label">고장 내용</dt><dd>${d.fault}</dd><dt class="text-erp-label">고장 일자</dt><dd>${d.faultDate}</dd></dl>${warnBand("삭제하면 수리 이력 목록에서 제외되고 복구할 수 없습니다.\n교체 부품 정보도 함께 삭제됩니다.")}</div>`,
        ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "stores/repairs.html") }),
      );

  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]">${head}${closed ? noticeBand("info", "폐점 점포의 수리 이력은 조회만 할 수 있습니다.") : ""}<div class="grid grid-cols-2 items-start gap-[24px]">${fault}${repair}</div></div>` +
      deleteDialog,
  );
  return { title: closed ? "수리 이력 상세 · 폐점 점포" : "수리 이력 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "시설물 및 장비 수리 이력", body }) };
};

export default (ctx) => render(ctx);
