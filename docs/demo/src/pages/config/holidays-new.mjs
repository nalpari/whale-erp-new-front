// BP 휴일 등록. 목업 docs/mockup/config/holidays-new.html 의 기본 상태(특정 점포 3곳 · 하루)를 BP 마스터로 본 것.
// 목업은 BP 휴일 관리 위 팝업으로 연다 — holidays.mjs 가 newForm 을 확인창에 싣고, 이 파일은 주소로 바로 열 때의 화면이다.
// 적용 범위(목업 typepick)와 날짜 유형(목업 seg)은 1팀 라디오로 옮겼다.
// 휴일 정보를 위로, 적용 대상을 아래로 둔다. 휴일 정보는 휴일명 → 날짜 → 설명 순서로 세로로 쌓는다(2026-10-07).
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

// 적용 범위 — 선택 상자만 둔다(안내 문구 없음 · 2026-10-07). 전체 화면은 반 칸, 패널은 한 칸 전체.
export const scopeField = (store, panel) => {
  const f = ui.field(c.req("적용 범위"), ui.select(["전체 점포", "특정 점포"], { value: store ? "특정 점포" : "전체 점포" }));
  return panel ? f : c.row(f, c.blank);
};

export const newForm = (A, { panel = false } = {}) =>
  ui.formGroup(
    "휴일 정보",
    ui.field(c.req("휴일명"), ui.textField({ value: "재고 정리 휴무", maxlength: 30 })),
    c.stack(
      `<span class="text-[14px] font-medium text-erp-label">${c.req("날짜")}</span>`,
      c.radios("hn-type", ["하루", "기간", "반복"], 0),
      ui.dateField(A, { label: "날짜", value: "2026-10-15" }),
    ),
    ui.field("설명", ui.textarea({ rows: 4, value: "분기 재고 실사로 하루 휴무" })),
  ) +
  ui.formGroup(
    "적용 대상",
    scopeField(true, panel),
    c.stack(
      `<span class="text-[14px] font-medium text-erp-label">${c.req("대상 점포")}</span>`,
      c.storePicker(A, {
        pool: "㈜한강상회 전체 11개점 중에서",
        label: "대상 점포 찾기",
        picked: [
          ["모리커피 성수점", "ST000002", "직영점포"],
          ["온기식당 판교점", "ST000003", "직영점포"],
          ["모리커피 연남점", "ST000006", "가맹점포"],
        ],
      }),
    ),
  );

export default ({ A, R }) => ({
  title: "BP 휴일 등록",
  html: ui.erpFrame({
    header: erpHeader(A, R),
    title: "BP 휴일 관리",
    body: ui.detailBody(
      ui.sectionHead("BP 휴일 등록") +
        newForm(A) +
        c.buttons(ui.button("취소", { variant: "off", href: link(R, "config/holidays.html") }), ui.button("등록", { href: link(R, "config/holidays-detail.html") })),
    ),
  }),
});
