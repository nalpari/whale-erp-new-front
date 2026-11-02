// BP 휴일 상세. 목업 docs/mockup/config/holidays-detail.html 을 BP 마스터로 본 것.
// 목업은 BP 휴일 관리 화면 위 팝업으로 연다 — holidays.mjs 가 detailParts 로 같은 내용을 확인창에 싣고, 이 파일은 주소로 바로 열 때의 화면이다.
// 표본은 목업 기본(HD-0122 창립기념일) 대신 HD-0114 정기휴무다. 캘린더 처음 진입(9월 21일)에서 고르는 휴일이라 등록 → 상세 → 수정 흐름이 이어진다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export const TITLE = "정기휴무";
// 머리: 첫 줄 휴일명, 둘째 줄 「적용 범위 값 | 휴일유형 값 | 상태 배지」 — BP 관리자 상세 머리와 같은 형식(앱과 같다, 2026-10-30 사용자 지정 — 전엔 제목 옆 꼬리표)
export const HEAD = `<div class="flex flex-col items-start gap-[6px]"><h2 class="text-[18px] font-semibold text-erp-ink">${TITLE}</h2><span class="text-[14px]">${c.headValues([["적용 범위", "일부 점포"], ["휴일유형", "매주 반복"], ["", ui.badge("on", "진행 중")]])}</span></div>`;

// 등록 화면과 같은 순서로 묶는다 — 휴일 정보 · 반복 · 적용 대상 · 등록 정보(2026-10-08). 변경 이력은 BP 관리자 상세처럼 확인창으로 연다.
// 패널(464px)은 한 줄로 쌓고, 전체 화면은 왼쪽(휴일 정보 · 반복) · 오른쪽(적용 대상 · 등록 정보) 두 칸이다.
export function detailParts(A, R, delId, { panel = false } = {}) {
  const histId = x.dialogId();
  // 날짜 · 반복은 휴일 유형 바로 아래 줄로(따로 「반복」 표를 두지 않는다, 앱과 같다, 2026-10-30 사용자 지정)
  const info = ui.detailTable("휴일정보", [
    ["휴일명", "정기휴무"],
    // 휴일유형 줄은 뺐다 — 머리 줄에 있다(앱과 같다, 2026-10-30)
    // 시작일 · 반복 기준 · 종료조건은 한 줄(앱과 같다, 2026-10-30 사용자 지정)
    ["날짜", "2026-09-21(월)부터 · 월요일마다 · 종료일 없음"],
    ["설명", "월요일마다 쉬는 정기 휴무"],
    // 등록 · 최종수정은 설명 아래 — 값은 「일시 · 사람」, 사람은 회색(앱 · 관리자 상세와 같다, 2026-10-30 사용자 지정)
    ["등록", `2026-09-15 14:10 <span class="text-erp-label">· hangang01</span>`],
    ["최종수정", `2026-09-16 10:05 <span class="text-erp-label">· hangang01</span>`],
  ]);
  // 적용 대상 — 적용 범위 아래에 BP 관리자 상세의 점포 매핑처럼 묶음 제목 + 점포 표를 둔다(2026-10-08).
  // 일부 점포면 대상 점포, 전체 점포면 예외 점포를 싣는다. 점포가 없으면 표의 빈 줄로 보인다.
  // 표본은 6개점 — 다섯 줄 높이까지 보이고 그 넘는 줄은 표 안에서 스크롤한다(2026-10-08)
  const scopeStores = {
    label: "대상점포",
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
  // 「적용 대상」 표는 뺐다 — 적용 범위는 머리 줄에 있다. 점포는 BP 관리자 상세의 대상점포처럼 회색 제목 바 + 열 이름 줄 없는 표(앱과 같다, 2026-10-30 사용자 지정)
  const storeTable = ui
    .dataTable(
      [{ header: "점포명", align: "left" }, { header: "점포코드", width: "w-[90px]" }, { header: "적용 기간", width: "w-[110px]" }],
      scopeStores.list.map(([n, code]) => [n, `<span class="text-[12px] text-erp-muted">${code}</span>`, "26.09.21부터"]),
      "대상점포가 없습니다.",
    )
    .replace("<thead>", '<thead class="sr-only">')
    .replace('class="w-full table-fixed border-collapse border-x', 'class="w-full table-fixed border-collapse border-t border-x');
  const stores = `<section class="flex flex-col"><h3 class="flex h-[42px] items-center rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink"><span class="flex items-baseline gap-[10px]">${scopeStores.label}<span class="text-[14px] font-normal text-erp-label">${scopeStores.list.length}개</span></span></h3><div class="max-h-[231px] overflow-y-auto">${storeTable}</div></section>`;
  const body = panel
    ? `<div class="flex flex-col gap-[24px]">${info}${stores}</div>`
    : `<div class="grid grid-cols-2 items-start gap-[24px]"><div class="flex flex-col gap-[24px]">${info}</div><div class="flex flex-col gap-[24px]">${stores}</div></div>`;

  // 변경이력 — 이 휴일의 이력만, 쪽 이동 없음(앱 history-dialog.tsx OwnHistoryButton · WideDialog 760px). 값은 api bp-holiday-changes 의 문구
  const cut = (t) => `<span class="block truncate" title="${t}">${t}</span>`;
  const histDialog = c.wide(
    x.dialog(
      histId,
      "변경이력",
      ui.dataTable(
        [
          { header: "변경일시", width: "w-[140px]" },
          { header: "변경자", width: "w-[80px]" },
          { header: "항목", width: "w-[90px]", align: "left" },
          { header: "변경 전", align: "left" },
          { header: "변경 후", align: "left" },
        ],
        [
          ["2026-09-16 10:05", "hangang01", "설명", cut("정기 휴무"), cut("월요일마다 쉬는 정기 휴무")],
          ["2026-09-15 14:10", "hangang01", "등록", "", cut("정기휴무 · 온기식당 판교점 · 모리커피 서초점 · 모리커피 성수점 · 온기식당 광화문점 · 모리커피 을지로점 · 모리커피 연남점 · 매주 · 시작 2026-09-21 · 종료일 없음")],
        ],
        "변경이력이 없습니다.",
      ),
      ui.button("닫기", { variant: "off", "data-close": true }),
    ),
    "w-[760px] max-h-[calc(100dvh-48px)] overflow-y-auto",
  );

  // 삭제 · 강제 종료 확인창 — 대상(회색 상자) + 빨간 안내 상자, 확인 버튼은 기본 버튼(앱 holiday-detail-panel.tsx, 2026-10-30 사용자 지정)
  // 둘은 api 가 함께 주지 않는다(시작 전 · 오늘 시작이면 삭제, 지난 날짜가 있으면 강제 종료). 데모는 버튼 둘을 모두 보인다
  const confirmBody = (rows, warn) => `<div class="flex flex-col gap-[12px] break-keep">${c.kv(rows, 60)}${c.warnBand(warn)}</div>`;
  const delDialog = x.dialog(
    delId,
    "휴일을 삭제하시겠습니까?",
    confirmBody([["휴일명", "정기휴무"]], "삭제한 휴일은 변경이력에서 확인할 수 있으며, 복구할 수 없습니다."),
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "config/holidays.html") }),
  );
  const endId = x.dialogId();
  // 종료일은 어제 — 오늘이 2026-09-21 이다(목록 · 캘린더 표본과 같다)
  const endDialog = x.dialog(
    endId,
    "휴일을 강제 종료하시겠습니까?",
    confirmBody([["휴일명", "정기휴무"], ["종료일", "2026-09-20(어제)"]], "오늘부터 이 휴일은 적용되지 않으며, 강제 종료는 되돌릴 수 없습니다."),
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("강제 종료", { "data-close": true }),
  );
  return { body, delDialog, endDialog, endId, histDialog, histId };
}

export default ({ A, R }) => {
  const delId = x.dialogId();
  const { body, delDialog, endDialog, endId, histDialog, histId } = detailParts(A, R, delId);
  return {
    title: "BP 휴일 상세",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 휴일 관리",
      body: ui.detailBody(
        HEAD +
          body +
          c.buttons(
            ui.button("목록", { variant: "off", href: link(R, "config/holidays.html") }),
            x.dialogTrigger("삭제", delId, "soft"),
            x.dialogTrigger("강제 종료", endId, "soft"),
            ui.button("수정", { href: link(R, "config/holidays-edit.html") }),
            x.dialogTrigger("변경이력", histId, "soft"),
          ) +
          delDialog +
          endDialog +
          histDialog,
      ),
    }),
  };
};
