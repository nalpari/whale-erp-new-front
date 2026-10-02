// BP 휴일 상세. 목업 docs/mockup/config/holidays-detail.html 을 BP 마스터로 본 것.
// 목업은 BP 휴일 관리 화면 위 팝업으로 연다 — holidays.mjs 가 detailParts 로 같은 내용을 확인창에 싣고, 이 파일은 주소로 바로 열 때의 화면이다.
// 표본은 목업 기본(HD-0122 창립기념일) 대신 HD-0114 정기휴무다. 캘린더 처음 진입(9월 21일)에서 고르는 휴일이라 등록 → 상세 → 수정 흐름이 이어진다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export const TITLE = "정기휴무";
export const TAGS = `<span class="ml-[10px] inline-flex gap-[6px] align-middle">${c.tag("특정 점포")}${c.tag("매주 반복")}</span>`;

export function detailParts(R, delId) {
  const body =
    `<div class="grid grid-cols-2 items-start gap-[24px]">${ui.detailTable("휴일 정보", [
      ["적용 범위", c.tag("특정 점포")],
      ["대상 점포", `온기식당 판교점 ${c.muted("ST000003")}`],
      ["고른 날짜", `2026-09-28 ${c.muted("(월) · 반복 중 두 번째 날짜")}`],
      ["휴일명", "정기휴무"],
      ["설명", "월요일마다 쉬는 정기 휴무"],
    ])}${ui.detailTable("반복 · 등록 정보", [
      ["휴일 유형", "반복"],
      ["반복 유형", "매주 · 시작일의 요일(월요일)"],
      ["시작일", `2026-09-21 ${c.muted("(월)")}`],
      ["종료 조건", "종료일 없음"],
      ["다음 날짜", `2026-09-28, 2026-10-05, 2026-10-12 ${c.muted("…")}`],
      ["휴일 번호", "HD-0114"],
      ["등록", `hangang01 ${c.muted("2026-09-15 14:10")}`],
      ["최종 수정", `hangang01 ${c.muted("2026-09-16 10:05")}`],
    ])}</div>` +
    `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`변경 이력${c.sub("이 휴일 · 최신순")}`)}${ui.dataTable(
      [
        { header: "변경 일시", width: "w-[160px]" },
        { header: "변경자", width: "w-[110px]" },
        { header: "변경 항목", width: "w-[100px]" },
        { header: "변경 전", align: "left" },
        { header: "변경 후", align: "left" },
      ],
      [
        ["2026-09-16 10:05", "hangang01", "설명", "정기 휴무", "월요일마다 쉬는 정기 휴무"],
        ["2026-09-15 14:10", "hangang01", "휴일", "", "정기휴무 · 온기식당 판교점 · 매주 반복 · 시작 2026-09-21 · 종료일 없음"],
      ],
    )}</div>`;

  const delDialog = x.dialog(
    delId,
    "휴일 삭제",
    `<div class="flex flex-col gap-[12px] break-keep">${c.kv([
      ["휴일명", "정기휴무"],
      ["고른 날짜", `2026-09-28 ${c.muted("(월)")}`],
      ["적용 대상", "온기식당 판교점"],
      ["반복", "매주 · 시작 2026-09-21 · 종료일 없음"],
      ["삭제 범위", "2026-09-28 부터 이후 모두"],
    ])}<p><b class="font-semibold">이 날짜부터 이후 휴일에 모두 적용됩니다.</b> 이 날짜 하나만 지우는 방법은 없습니다.</p><p>종료 조건을 <b class="font-semibold">‘2026-09-27까지’</b>로 바꿉니다. 그 앞의 2026-09-21 은 지난 날짜라 목록·캘린더에 그대로 남습니다.</p><p class="text-erp-label">원래 종료 조건(종료일 없음)은 변경 이력에만 남습니다. 되돌릴 수 없습니다.</p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "config/holidays.html") }),
  );
  return { body, delDialog };
}

export default ({ A, R }) => {
  const delId = x.dialogId();
  const { body, delDialog } = detailParts(R, delId);
  return {
    title: "BP 휴일 상세",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 휴일 관리",
      body: ui.detailBody(
        ui.sectionHead(TITLE + TAGS) +
          body +
          c.buttons(
            ui.button("목록", { variant: "off", href: link(R, "config/holidays.html") }),
            x.dialogTrigger("삭제", delId, "soft"),
            ui.button("수정", { href: link(R, "config/holidays-edit.html") }),
          ) +
          delDialog,
      ),
    }),
  };
};
