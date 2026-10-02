// BP 휴일 수정. 목업 docs/mockup/config/holidays-edit.html 을 BP 마스터로 본 것. 표본은 상세와 같은 HD-0114 정기휴무(고른 날짜 2026-09-28).
// 목업은 BP 휴일 관리 위 팝업으로 연다 — holidays.mjs 가 editForm 을 확인창에 싣고, 이 파일은 주소로 바로 열 때의 화면이다.
// 저장은 목업처럼 ‘이 날짜부터 이후 모두 바꿉니다’ 확인창을 거친다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { scopeRadios } from "./holidays-new.mjs";

export const editForm = (A) =>
  ui.formGroup(
    `적용 대상${c.sub("수정하는 사람 · 정하윤 · hangang01 · BP 마스터")}`,
    c.stack(`<span class="text-[14px] font-medium text-erp-label">${c.req("적용 범위")}</span>`, scopeRadios("he-scope", true)),
    c.stack(
      `<span class="text-[14px] font-medium text-erp-label">${c.req("대상 점포")}</span>`,
      c.storePicker(A, { pool: "㈜한강상회 전체 11개점 중에서", label: "대상 점포 찾기", picked: [["온기식당 판교점", "ST000003", "일반점포"]] }),
      c.help("hangang01의 접근 범위 안 점포만 나옵니다. 여러 곳을 한 휴일로 묶을 수 있습니다."),
    ),
  ) +
  ui.formGroup(
    `휴일 정보${c.sub("* 표시가 필수")}`,
    c.row(
      c.stack(
        `<span class="text-[14px] font-medium text-erp-label">${c.req("시작일")}</span>`,
        c.radios("he-type", ["하루", "기간", "반복"], 2),
        ui.dateField(A, { label: "시작일", value: "2026-09-28" }),
        c.help("고른 날짜 2026-09-28 · 옮기면 새 휴일은 그 날짜부터 반복합니다. 고른 날짜(2026-09-28) 이후로만 옮길 수 있습니다 — 앞당기려면 상세에서 그 날짜를 골라 수정하세요."),
      ).replace('class="flex flex-col', 'class="min-w-px flex-1 flex flex-col'),
      ui.field(c.req("휴일명"), ui.textField({ value: "정기휴무", maxlength: 30 })),
    ),
    ui.field("설명", ui.textarea({ rows: 4, value: "월요일마다 쉬는 정기 휴무" })),
  ) +
  ui.formGroup(
    `반복 설정${c.sub("반복 유형과 종료 조건도 고칠 수 있습니다")}`,
    c.row(ui.field("반복 유형", c.stack(ui.select(["매일", "매주", "매월", "매년"], { value: "매주" }), c.help("시작일의 요일(월요일)마다 반복합니다."))), c.blank),
    c.stack(`<span class="text-[14px] font-medium text-erp-label">종료 조건</span>`, c.radios("he-end", ["종료일 없음", "특정 날짜까지", "지정 횟수만큼"], 0)),
  );

// 저장 전 확인창. done 은 [저장]이 하는 일(링크 또는 닫기).
export const scopeDialog = (id, done) =>
  x.dialog(
    id,
    "이 날짜부터 이후 모두 바꿉니다",
    `<div class="flex flex-col gap-[12px] break-keep">${c.kv(
      [
        ["휴일명", "정기휴무"],
        ["고른 날짜", `2026-09-28 ${c.muted("(월)")}`],
        ["적용", "2026-09-28 부터 이후 모두"],
        ["새 휴일 번호", `HD-0125 ${c.muted("· 원래 휴일 HD-0114")}`],
      ],
      90,
    )}<p><b class="font-semibold">이 날짜부터 이후 휴일에 모두 적용됩니다.</b> 이 날짜 하나만 고치는 방법은 없습니다.</p><p class="text-erp-label">기존 휴일 HD-0114 는 종료 조건을 ‘2026-09-27까지’로 바꿔 끝나고, 2026-09-28 부터는 새 휴일 번호 HD-0125 로 이어집니다. 새 휴일에는 ‘원래 휴일 HD-0114’가 표시되고 상세에서 서로 오갈 수 있습니다. 지난 날짜 2026-09-21 은 그대로입니다.</p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("저장", done),
  );

export default ({ A, R }) => {
  const detail = link(R, "config/holidays-detail.html");
  const scopeId = x.dialogId();
  return {
    title: "BP 휴일 수정",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 휴일 관리",
      body: ui.detailBody(
        ui.sectionHead(`BP 휴일 수정${c.sub("정기휴무 · HD-0114")}`) +
          editForm(A) +
          c.buttons(ui.button("취소", { variant: "off", href: detail }), x.dialogTrigger("저장", scopeId)) +
          scopeDialog(scopeId, { href: detail }),
      ),
    }),
  };
};
