// BP 휴일 상세. 목업 docs/mockup/config/holidays-detail.html 을 BP 마스터로 본 것.
// 목업은 BP 휴일 관리 화면 위 팝업으로 연다 — holidays.mjs 가 detailParts 로 같은 내용을 확인창에 싣고, 이 파일은 주소로 바로 열 때의 화면이다.
// 표본은 목업 기본(HD-0122 창립기념일) 대신 HD-0114 정기휴무다. 캘린더 처음 진입(9월 21일)에서 고르는 휴일이라 등록 → 상세 → 수정 흐름이 이어진다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export const TITLE = "정기휴무";
export const TAGS = `<span class="ml-[10px] inline-flex gap-[6px] align-middle">${c.tag("일부 점포")}${c.tag("매주 반복")}</span>`;

// 등록 화면과 같은 순서로 묶는다 — 휴일 정보 · 반복 · 적용 대상 · 등록 정보(2026-10-08). 변경 이력은 BP 관리자 상세처럼 확인창으로 연다.
// 패널(464px)은 한 줄로 쌓고, 전체 화면은 왼쪽(휴일 정보 · 반복) · 오른쪽(적용 대상 · 등록 정보) 두 칸이다.
export function detailParts(A, R, delId, { panel = false } = {}) {
  const histId = x.dialogId();
  const info = ui.detailTable("휴일 정보", [
    ["휴일명", "정기휴무"],
    ["휴일 유형", "반복"],
    ["선택 날짜", `2026-09-28 ${c.muted("(월)")}`],
    ["설명", "월요일마다 쉬는 정기 휴무"],
    // 등록일시 · 최종수정일시는 휴일 정보의 설명 아래에 둔다(2026-10-08)
    ["등록일시", `2026-09-15 14:10 ${c.muted("| hangang01")}`],
    ["최종수정일시", `2026-09-16 10:05 ${c.muted("| hangang01")}`],
  ]);
  const repeat = ui.detailTable("반복", [
    ["시작일", `2026-09-21 ${c.muted("(월)")}`],
    ["반복 유형", `매주 ${c.muted("· 월요일")}`],
    ["종료 조건", "종료일 없음"],
  ]);
  // 적용 대상 — 적용 범위 아래에 BP 관리자 상세의 점포 매핑처럼 묶음 제목 + 점포 표를 둔다(2026-10-08).
  // 일부 점포면 대상 점포, 전체 점포면 예외 점포를 싣는다. 점포가 없으면 표의 빈 줄로 보인다.
  // 표본은 6개점 — 다섯 줄 높이까지 보이고 그 넘는 줄은 표 안에서 스크롤한다(2026-10-08)
  const scopeStores = {
    label: "대상 점포",
    scope: "일부",
    list: [
      ["온기식당 판교점", "ST000003", "직영점포"],
      ["모리커피 서초점", "ST000001", "직영점포"],
      ["모리커피 성수점", "ST000002", "직영점포"],
      ["온기식당 광화문점", "ST000004", "직영점포"],
      ["모리커피 을지로점", "ST000005", "가맹점포"],
      ["모리커피 연남점", "ST000006", "가맹점포"],
    ],
  };
  const target = ui.detailTable("적용 대상", [["적용 범위", c.tag("일부 점포")]]);
  const storeTable = ui.dataTable(
    [{ header: "점포명", align: "left" }, { header: "점포코드", width: "w-[110px]" }, { header: "점포 유형", width: "w-[100px]" }],
    scopeStores.list,
    "등록한 점포가 없습니다.",
  );
  const stores = `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`${scopeStores.label}${c.sub(`${scopeStores.scope} · ${scopeStores.list.length}개점`)}`)}<div class="max-h-[272px] overflow-auto">${storeTable}</div></div>`;
  const body = panel
    ? `<div class="flex flex-col gap-[24px]">${info}${repeat}${target}${stores}</div>`
    : `<div class="grid grid-cols-2 items-start gap-[24px]"><div class="flex flex-col gap-[24px]">${info}${repeat}</div><div class="flex flex-col gap-[24px]">${target}${stores}</div></div>`;

  // 변경 이력 확인창 — BP 관리자 상세와 같은 모양(넓은 창 · 표 · 페이지 이동)
  const histDialog = c.wide(
    x.dialog(
      histId,
      "변경 이력",
      `<div class="overflow-x-auto">${ui.dataTable(
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
      )}</div><div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
      ui.button("닫기", { variant: "off", "data-close": true }),
    ),
    "w-[720px] max-h-[calc(100dvh-48px)] overflow-y-auto",
  );

  const delDialog = x.dialog(
    delId,
    "휴일 삭제",
    `<div class="flex flex-col gap-[12px] break-keep">${c.kv([
      ["휴일명", "정기휴무"],
      ["선택 날짜", `2026-09-28 ${c.muted("(월)")}`],
      ["적용 대상", "온기식당 판교점"],
      ["반복", "매주 · 시작 2026-09-21 · 종료일 없음"],
    ])}</div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "config/holidays.html") }),
  );
  return { body, delDialog, histDialog, histId };
}

export default ({ A, R }) => {
  const delId = x.dialogId();
  const { body, delDialog, histDialog, histId } = detailParts(A, R, delId);
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
            x.dialogTrigger("변경 이력", histId, "soft"),
            ui.button("수정", { href: link(R, "config/holidays-edit.html") }),
          ) +
          delDialog +
          histDialog,
      ),
    }),
  };
};
