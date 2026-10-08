// 플랫폼 공통코드 관리. 목업 docs/mockup/system/codes.html 의 기본 상태(등록·수정 권한, SERVICE 그룹 선택)를 플랫폼 관리자로 본 것.
// 왼쪽 공통코드 그룹, 오른쪽 고른 그룹의 상세 코드를 두 카드로 나란히 둔다(2단 카드 본문).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { platformHeader } from "../../site.mjs";
import { band as riskBand } from "../../staff-parts.mjs";

// 두 카드 껍데기
const card = (w, html) => `<section class="${w} flex flex-col gap-[12px] overflow-y-auto rounded-[4px] [&>*]:shrink-0 border border-erp-panel-line bg-white p-[25px]">${html}</section>`;
// 고른 줄 표시(목업 surface-strong). dataTable 결과의 n 번째 줄에 표 머리 바탕을 얹는다.
const markRow = (table, n) => {
  let i = -1;
  return table.replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, (m) => (++i === n ? m.replace('">', ' bg-erp-thead-bg">') : m));
};
// 끌어서 순서 바꾸는 손잡이. 아이콘이 없어 글자 기호로 둔다.
const handle = '<span title="끌어서 순서 바꾸기" aria-label="끌어서 순서 바꾸기" class="cursor-grab text-[16px] text-erp-label">≡</span>';
const sub = (t) => `<span class="ml-[10px] text-[14px] font-normal text-erp-label">${t}</span>`;
const help = (t) => `<span class="text-[13px] leading-[1.5] whitespace-normal text-erp-label">${t}</span>`;
// 추가 행(목업 surface-hover). 버튼을 누르면 아래 ADD_SCRIPT 가 template 을 표 맨 끝에 붙인다 — 입력 행 + 안내 행.
const addRows = (id, cells, note) =>
  `<template id="${id}"><tr class="h-[46px] border-b border-erp-thead-line bg-erp-thead-bg" data-new-row>${cells
    .map(([c, left]) => `<td class="px-[10px] ${left ? "text-left" : "text-center"}">${c}</td>`)
    .join("")}</tr>${note ? `<tr class="border-b border-erp-thead-line bg-erp-thead-bg"><td colspan="${cells.length}" class="px-[10px] py-[10px] text-left">${help(note)}</td></tr>` : ""}</template>`;
// 코드는 영문 대문자로만 — 소문자를 치면 대문자로 바꾼다
const codeField = (placeholder, label) => ui.textField({ placeholder, maxlength: 20, "aria-label": label, "data-upper": true, title: "영문 대문자·숫자·밑줄, 영문으로 시작, 20자 이내 (소문자는 대문자로 바뀝니다)" });
// 추가 버튼을 누르면 그 표에 새 행을 붙이고, 첫 칸으로 스크롤·포커스한다. 저장 전 새 행은 하나만 둔다(목업과 같다).
const ADD_SCRIPT = `<script>
(() => {
  document.querySelectorAll("[data-add-row]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tpl = document.getElementById(btn.dataset.addRow);
      const body = btn.closest("section").querySelector("tbody");
      body.append(tpl.content.cloneNode(true));
      btn.disabled = true;
      const first = body.querySelector("[data-new-row] input");
      first.scrollIntoView({ block: "nearest", behavior: "smooth" });
      first.focus({ preventScroll: true });
    });
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches("[data-upper]")) e.target.value = e.target.value.toUpperCase();
  });
})();
</script>`;
const dim = (b) => b.replace('class="', 'class="disabled:pointer-events-none disabled:opacity-40 ');

// [그룹 코드, 그룹명, 관리 주체, BP 적용(null=해당 없음, true=적용, false=미적용)]
const GROUPS = [
  ["SERVICE", "서비스", "플랫폼고정", null],
  ["ROLE_TYPE", "권한 유형", "플랫폼고정", null],
  ["ACCOUNT_STATUS", "계정 상태", "플랫폼고정", null],
  ["JOIN_PATH", "가입경로", "플랫폼고정", null],
  ["WITHDRAW_REASON", "탈퇴 사유", "플랫폼고정", null],
  ["MAIL_TYPE", "메일 유형", "플랫폼고정", null],
  ["TERMS_TYPE", "약관 유형", "플랫폼고정", null],
  ["FLOOR_TYPE", "층수 구분", "플랫폼고정", null],
  ["STORE_STATUS", "점포 상태", "플랫폼고정", null],
  ["STORE_TYPE", "점포 유형", "플랫폼고정", null],
  ["MANAGE_OWNER", "관리 주체", "플랫폼고정", null],
  ["EMP_TYPE", "고용 형태", "플랫폼제공", true],
  ["LEAVE_TYPE", "휴가 유형", "플랫폼제공", true],
  ["PAY_TYPE", "급여 형태", "플랫폼제공", false],
];
const SERVICES = [
  ["WHALE_ERP", "Whale ERP"],
  ["PLATFORM", "Whale ERP 플랫폼 관리"],
  ["POS", "POS"],
  ["KIOSK", "KIOSK"],
  ["TABLE_ORDER", "Table Order"],
  ["PICK_UP_ORDER", "Pick Up Order"],
  ["QR_ORDER", "QR Order"],
  ["RECIPE_MANAGEMENT", "레시피관리"],
  ["ORDER_MANAGEMENT", "발주관리"],
  ["STORE_INVENTORY", "점포재고관리"],
  ["WAITING_MANAGEMENT", "대기순번관리"],
  ["RESERVATION", "예약관리", false],
];

export default ({ A, R }) => {
  const apply = x.dialogId();

  const groupCols = [
    { header: "그룹 코드", width: "w-[170px]", align: "left" },
    { header: "그룹명", align: "left" },
    { header: "관리 주체", width: "w-[100px]" },
    { header: "BP 적용", width: "w-[130px]" },
    { header: "사용 상태", width: "w-[100px]" },
  ];
  const groupRows = GROUPS.map(([code, name, owner, bp], i) => [
    i === 0 ? `<b class="font-semibold" aria-current="true">${code}</b>` : ui.link(code, "#"),
    ui.textField({ value: name, "aria-label": "그룹명" }),
    owner,
    bp === null ? '<span class="text-erp-muted">—</span>' : bp ? ui.badge("on", "적용") : x.dialogTrigger("BP에 적용", apply, "soft"),
    x.toggle("사용", true),
  ]);
  const left = card(
    "w-[780px] shrink-0",
    ui.sectionHead(`공통코드 그룹${sub(`${GROUPS.length}개`)}`, dim(ui.button("추가", { variant: "soft", "data-add-row": "new-group" })) + ui.button("저장")) +
      markRow(ui.dataTable(groupCols, groupRows), 0) +
      addRows(
        "new-group",
        [
          [codeField("그룹 코드", "그룹 코드"), true],
          [ui.textField({ placeholder: "그룹명", "aria-label": "그룹명" }), true],
          [ui.select(["선택", "플랫폼고정", "플랫폼제공"], { "aria-label": "관리 주체" })],
          ['<span class="text-erp-label" title="플랫폼제공 그룹은 미적용으로 저장합니다">미적용</span>'],
          [x.toggle("사용", true)],
        ],
      ),
  );

  const codeCols = [
    { header: "이동", width: "w-[60px]" },
    { header: "상세 코드", width: "w-[220px]", align: "left" },
    { header: "코드명", align: "left" },
    { header: "표시 순서", width: "w-[90px]" },
    { header: "사용 상태", width: "w-[120px]" },
  ];
  const codeRows = SERVICES.map(([code, name, on = true], i) => [
    handle,
    code,
    ui.textField({ value: name, "aria-label": "코드명" }),
    i + 1,
    x.toggle(on ? "사용" : "사용중지", on),
  ]);
  const right = card(
    "min-w-0 flex-1",
    ui.sectionHead(`상세 코드${sub("SERVICE · 서비스 · 플랫폼고정")}`, dim(ui.button("추가", { variant: "soft", "data-add-row": "new-code" })) + ui.button("저장")) +
      ui.dataTable(codeCols, codeRows) +
      addRows(
        "new-code",
        [
          [""],
          [codeField("서비스 코드 직접 입력", "상세 코드"), true],
          [ui.textField({ placeholder: "서비스명", "aria-label": "코드명" }), true],
          [`<span title="맨 끝에 붙습니다. 저장한 뒤 끌어서 옮길 수 있습니다">${SERVICES.length + 1}</span>`],
          [x.toggle("사용", true)],
        ],
      ),
  );

  // BP에 적용 확인창 — 문구는 목업 pop-apply 와 같다. 적용 대상 요약(표 머리와 같은 바탕·선) + 되돌릴 수 없다는 위험 띠.
  const summary = (rows) =>
    `<dl class="grid grid-cols-[84px_1fr] gap-x-[12px] gap-y-[8px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[16px] py-[14px]">${rows
      .map(([k, v]) => `<dt class="font-medium text-erp-label">${k}</dt><dd class="text-erp-ink">${v}</dd>`)
      .join("")}</dl>`;
  const dialog = x
    .dialog(
      apply,
      "BP에 적용",
      `<div class="flex flex-col gap-[12px] break-keep">` +
        summary([
          ["그룹", `PAY_TYPE <span class="text-erp-label">·</span> 급여 형태`],
          ["상세 코드", "지금 등록된 상세 코드 전부"],
        ]) +
        riskBand("사용 중인 모든 BP에 배포되며 되돌릴 수 없습니다", {
          tone: "risk",
          desc: "적용하면 이 그룹과 상세 코드가 각 BP에 복사되고, 그룹의 BP 적용은 다시 미적용으로 바꿀 수 없습니다. 적용한 뒤 추가하는 상세 코드는 기존 BP에는 배포되지 않고 새로 가입하는 BP부터 적용됩니다.",
        }) +
        `</div>`,
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("적용", { "data-close": true }),
    )
    // 안내 문단이 길어 이 창만 넓힌다(기본 420px)
    .replace("w-[420px]", "w-[480px]");

  return {
    title: "플랫폼 공통코드 관리",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "플랫폼 공통코드 관리",
      body: `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${left}${right}</div>${dialog}${ADD_SCRIPT}`,
    }),
  };
};
