// BP 휴일 등록. 목업 docs/mockup/config/holidays-new.html 의 기본 상태(특정 점포 3곳 · 하루)를 BP 마스터로 본 것.
// 목업은 BP 휴일 관리 위 팝업으로 연다 — holidays.mjs 가 newForm 을 확인창에 싣고, 이 파일은 주소로 바로 열 때의 화면이다.
// 적용 범위(목업 typepick)와 날짜 유형(목업 seg)은 1팀 라디오로 옮겼다.
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export const scopeRadios = (name, store) =>
  c.radios(
    name,
    [`전체 점포 ${c.muted("㈜한강상회의 모든 점포에 적용 · 예외 점포를 뺄 수 있음")}`, `특정 점포 ${c.muted("고른 점포에만 적용 · 여러 곳을 한 휴일로")}`],
    store ? 1 : 0,
  );

export const newForm = (A) =>
  ui.formGroup(
    "적용 대상",
    c.stack(`<span class="text-[14px] font-medium text-erp-label">${c.req("적용 범위")}</span>`, scopeRadios("hn-scope", true)),
    c.stack(
      `<span class="text-[14px] font-medium text-erp-label">${c.req("대상 점포")}</span>`,
      c.storePicker(A, {
        pool: "㈜한강상회 전체 11개점 중에서",
        label: "대상 점포 찾기",
        picked: [
          ["모리커피 성수점", "ST000002", "일반점포"],
          ["온기식당 판교점", "ST000003", "일반점포"],
          ["모리커피 연남점", "ST000006", "가맹점포"],
        ],
      }),
      c.help("내 접근 범위 안의 점포만 나옵니다. 고른 점포는 모두 이 휴일 한 건에 묶입니다."),
    ),
  ) +
  ui.formGroup(
    `휴일 정보${c.sub("* 표시가 필수 · 설명은 선택 · 종일 휴일")}`,
    c.row(
      c.stack(
        `<span class="text-[14px] font-medium text-erp-label">${c.req("날짜")}</span>`,
        c.radios("hn-type", ["하루", "기간", "반복"], 0),
        ui.dateField(A, { label: "날짜", value: "2026-10-15" }),
        c.help("오늘(2026-09-21) 또는 그 뒤 날짜"),
      ).replace('class="flex flex-col', 'class="min-w-px flex-1 flex flex-col'),
      ui.field(c.req("휴일명"), c.stack(ui.textField({ value: "재고 정리 휴무", maxlength: 30 }), c.help("30자까지 · 캘린더 우측 목록에 ‘휴일명 - 적용 대상’으로 나옵니다."))),
    ),
    ui.field("설명", ui.textarea({ rows: 4, value: "분기 재고 실사로 하루 휴무" })),
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
