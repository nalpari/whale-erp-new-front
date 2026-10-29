// 1팀 화면(점포·BP·마이페이지) 폼이 같이 쓰는 임시 부품. 1팀 공통 컴포넌트에 없는 것들이라 컴포넌트 제안 대상이다.
// 생김새는 DESIGN.md 토큰과 규칙(2px 모서리, 1px 선, 34px 높이)으로만 만든다.
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";

// 도움말 한 줄(입력칸 아래 안내 문구)
export const help = (t) => `<span class="text-[13px] text-erp-label">${t}</span>`;
// 필수 표시: 라벨 뒤 빨간 「*」(목업·디자인 시안의 .req 와 같다, 2026-10-02 재영).
// 색은 Figma 위험 빨강 #e93737 — DESIGN.md 가 한 번만 나오는 색은 쓰는 자리에 직접 적으라고 한다. 1팀 공통 컴포넌트에 필수 표시가 없어 컴포넌트 제안 대상.
export const REQ = ' <span aria-hidden="true" class="text-[#e93737]">*</span><span class="sr-only">(필수)</span>';
export const req = (label) => `${label}${REQ}`;

// 입력칸이 여럿인 항목(연락처 세 칸, 라디오 묶음, 주소). ui.field 는 <label> 이라 입력칸을 하나만 품을 수 있다.
export const group = (label, control, width) =>
  `<div role="group" aria-label="${label.replace(REQ, "")}" class="flex flex-col justify-center gap-[8px] ${width ?? "min-w-px flex-1"}"><span class="truncate text-[14px] font-medium text-erp-label">${label}</span>${control}</div>`;

// 비밀번호 칸 + 눈 아이콘(보기·숨기기). 1팀 컴포넌트에 비밀번호 칸이 없어 TextField 위에 아이콘 버튼을 겹쳤다 — 회원가입
// (guest.mjs eyeButton)과 같은 눈/눈-금지 아이콘 쌍이다(2026-10-26 사용자 지정 — 전엔 "보기"/"숨기기" 글자 버튼이었다).
// 안내(비밀번호 정책 조건)는 칸 안 placeholder 로 두고, 칸 아래는 error 가 있을 때만 — 실제 화면(FieldMessage)과 같은
// 모양(text-[13px] text-erp-off, role=alert)으로 보인다. 올바르면 아래에 아무것도 없다(2026-10-26 사용자 지정 — 전엔
// 조건 문구가 칸 아래 늘 남아 있었다).
export const pwField = (A, label, value, autocomplete, { placeholder = "", error = "" } = {}) =>
  group(
    req(label),
    `<div class="relative">${ui.textField({ type: "password", value, autocomplete, placeholder, "aria-label": label, "aria-invalid": error ? "true" : undefined })}<button type="button" aria-pressed="false" aria-label="비밀번호 보기" class="absolute top-0 right-0 grid h-[34px] w-[34px] place-items-center text-erp-label hover:text-erp-ink" onclick="const i=this.previousElementSibling,on=i.type==='password';i.type=on?'text':'password';this.setAttribute('aria-pressed',on);this.children[0].hidden=on;this.children[1].hidden=!on">${ui.img(A, "eye-on.svg", 16, 16)}${ui.img(A, "eye-off.svg", 16, 16).replace("<img", "<img hidden")}</button></div>` +
      (error ? `<p role="alert" class="text-[13px] leading-[1.5] text-erp-off">${error}</p>` : ""),
  );

// 연락처 세 칸. 세 칸 모두 숫자 4자리를 넘지 않는다.
export const tel = (a = "", b = "", c = "") =>
  `<div class="flex gap-[6px]">${[
    [a, "앞자리"],
    [b, "가운데자리"],
    [c, "끝자리"],
  ]
    .map(([v, l]) => ui.textField({ value: v, inputmode: "numeric", "aria-label": l, maxlength: 4 }))
    .join("")}</div>`;

// 주소: 검색어 + [주소 검색] / 우편번호 · 기본주소(읽기 전용) / 상세주소.
// labelExtra: 라벨 줄 바로 옆(같은 줄)에 붙이는 것 — "점포 주소와 같음" 체크박스 등(점포 등록 · 수정, 2026-10-16 점검).
// 안 주면 기존 group() 그대로라 다른 화면은 그대로다.
export const address = (A, label, { zip = "", base = "", detail = "" } = {}, { top = "", bottom = "", labelExtra = "" } = {}) => {
  const body =
    top +
    `<div class="flex gap-[6px]"><div class="flex-1">${ui.searchField(A, { placeholder: "지번/도로명을 입력해주세요.", label: `${label} 검색어` })}</div>${ui.button("주소 검색", { variant: "soft" })}</div>` +
    `<div class="flex gap-[6px]"><div class="w-[120px] shrink-0 text-center">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": `${label} 우편번호` })}</div>${ui.textField({ value: base, readonly: true, placeholder: "기본주소", "aria-label": `${label} 기본주소` })}</div>` +
    ui.textField({ value: detail, maxlength: 100, placeholder: base ? "상세주소" : "상세주소를 입력하세요.", "aria-label": `${label} 상세주소` }) +
    bottom;
  if (!labelExtra) return group(label, body);
  return `<div role="group" aria-label="${label}" class="flex min-w-px flex-1 flex-col justify-center gap-[8px]"><span class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label"><span>${label}</span>${labelExtra}</span>${body}</div>`;
};

// 안쪽 묶음 상자(사업자 번호 인증 상자 등). 두 바탕 규칙대로 #f8f9fb 바탕 + 패널 선.
// flat: 테두리·바탕·안쪽 여백을 뺀다. 바깥 묶음(formGroup)이 이미 흰 상자라 테두리가 겹쳐 보일 때 쓴다.
const BOX_CHROME = " rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]";
export const box = (id, title, right, body, hidden = false, flat = false) =>
  `<div id="${id}" class="flex flex-col gap-[18px]${flat ? "" : BOX_CHROME}"${hidden ? " hidden" : ""}><div class="flex items-center gap-[6px]"><h4 class="flex-1 text-[15px] font-semibold text-erp-ink">${title}</h4>${right}</div>${body}</div>`;

// 같은 자리의 두 묶음을 바꿔 보이는 버튼(접힌 버튼 ↔ 입력 상자 ↔ 인증 완료). swap 스크립트가 처리한다.
export const swapAttr = (from, to) => ({ "data-swap": `${from},${to}` });
export const SWAP_SCRIPT = `<script>document.addEventListener("click",(e)=>{const b=e.target.closest("[data-swap]");if(!b)return;const[f,t]=b.dataset.swap.split(",");document.getElementById(f).hidden=true;document.getElementById(t).hidden=false;});</script>`;

// 사업자 번호 인증 묶음. start: "fold"(인증 전·접힘) | "open"(인증 전·늘 펼침, 접기 없음) | "done"(인증 완료).
// values: [사업자등록번호, 대표자명, 개업일자], input: 입력 상자의 처음 값(없으면 values),
// reauthLocked: 재인증 때 번호·개업일자를 고정하고 대표자명만 받는다(점포 수정).
// inline: 점포 등록·수정의 배치. 입력칸을 한 줄에 두고 [인증하기] 를 줄 끝(개업일자 옆)에 붙이며,
//         인증을 마친 뒤의 사업자정보 상자도 같은 한 줄로 둔다 — 인증 전후로 생김새가 바뀌지 않게.
//         상자 테두리·바탕도 뺀다. 바깥 「점포 사업자정보」 묶음이 이미 흰 상자라 테두리가 두 겹으로 보인다.
export function bizAuth(A, p, { start = "fold", values = ["", "", ""], input = values, doneBadge = "인증 완료", reauthLocked = false, after = "", confirmReauth = false, inline = false } = {}) {
  const ids = { fold: `${p}-fold`, form: `${p}-form`, done: `${p}-done` };
  const [num, ceo, open] = input;
  // 접기 버튼은 두지 않는다(2026-10-06 피드백) — 재인증 상자는 인증하기로만 넘어간다.
  const fold = start === "open" ? "" : `<div id="${ids.fold}"${start === "fold" ? "" : " hidden"}>${ui.button("사업자 번호 인증하기", { variant: "soft", ...swapAttr(ids.fold, ids.form) })}</div>`;
  const authBtn = ui.button("인증하기", swapAttr(ids.form, ids.done));
  // inline 이 아니면(마이페이지 등) 사업자등록번호·대표자명·개업일자를 한 줄씩 세로로 쌓는다(2026-10-06 피드백).
  // inline 이면(점포 등록) 기존대로 한 줄에 두고 인증하기 버튼을 그 줄 끝에 붙여 상자 높이를 줄인다.
  const fields = reauthLocked
    ? ui.formRow(
        ui.field("사업자등록번호", ui.textField({ value: num, disabled: true })),
        ui.field("개업일자", ui.textField({ value: open, disabled: true })),
        ui.field("대표자명", ui.textField({ value: ceo })),
      ) + help("대표자 변경 시 새 대표자명으로 재인증해야 합니다.<br>사업자등록번호와 개업일자는 수정할 수 없으며, 인증 실패 시 기존 정보가 유지됩니다.")
    : inline
      ? ui.formRow(
          // 회원가입(biz-auth-section.tsx)과 같은 placeholder로 맞췄다(2026-10-16 점검, inline 은 점포 등록 · 수정만 쓴다)
          ui.field("사업자등록번호", ui.textField({ value: num, placeholder: "숫자 10자리" })),
          ui.field("대표자명", ui.textField({ value: ceo, placeholder: "대표자 이름" })),
          group("개업일자", ui.dateField(A, { label: "개업일자", value: open })),
          `<div class="shrink-0 self-end">${authBtn}</div>`,
        )
      : ui.field("사업자등록번호", ui.textField({ value: num, placeholder: "000-00-00000" })) +
        ui.field("대표자명", ui.textField({ value: ceo })) +
        group("개업일자", ui.dateField(A, { label: "개업일자", value: open }));
  const form = box(
    ids.form,
    start === "done" ? "사업자 번호 재인증" : "사업자 번호 인증",
    "",
    fields + (inline && !reauthLocked ? "" : `<div>${authBtn}</div>`),
    start !== "open",
    inline,
  );
  const [vn, vc, vo] = values;
  let reauth = ui.button("재인증", { variant: "soft", ...swapAttr(ids.done, ids.form) });
  let dialog = "";
  if (confirmReauth) {
    const d = `${p}-reauth`;
    reauth = x.dialogTrigger("재인증", d, "soft");
    dialog = x.dialog(
      d,
      "사업자정보를 다시 인증할까요?",
      confirmReauth,
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("재인증", { "data-close": true, ...swapAttr(ids.done, ids.form) }),
    );
  }
  const doneFields = [
    ui.field("사업자등록번호", ui.textField({ value: vn, disabled: true })),
    ui.field("대표자명", ui.textField({ value: vc, disabled: true })),
    ui.field("개업일자", ui.textField({ value: vo, disabled: true })),
  ];
  const done = box(
    ids.done,
    "사업자정보",
    doneBadge ? ui.badge("on", doneBadge) : "", // 묶음 제목에 이미 인증 배지가 있으면 doneBadge: "" 로 뺀다
    inline
      ? ui.formRow(...doneFields, `<div class="shrink-0 self-end">${reauth}</div>`) + after
      : doneFields.join("") + after + `<div>${reauth}</div>`,
    start !== "done",
    inline,
  );
  return fold + form + done + dialog;
}

// 폼 아래 버튼 줄(가운데). 1팀 등록 패널(panelButtons)과 같은 배치를 링크로.
export const formButtons = (...buttons) => `<div class="flex justify-center gap-[6px] pt-[6px]">${buttons.join("")}</div>`;

// 대표 이미지 칸(120px 정사각). src 가 없으면 "이미지 없음".
export const imageBox = (src, alt = "대표 이미지") =>
  src
    ? `<img src="${src}" alt="${alt}" width="120" height="120" class="size-[120px] shrink-0 rounded-[2px] border border-erp-field-line object-cover">`
    : `<div class="grid size-[120px] shrink-0 place-items-center rounded-[2px] border border-erp-field-line bg-erp-thead-bg text-[13px] text-erp-muted">이미지 없음</div>`;

// 비활성 버튼. 1팀 버튼에 비활성 생김새가 없어 검색 버튼(disabled:opacity-40)과 같은 값으로 흐리게 둔다. 이유는 말풍선(title).
export const disabledButton = (label, why, variant = "soft") => `<span class="opacity-40" title="${why}">${ui.button(label, { variant, disabled: true })}</span>`;

// 실패 · 막힘 안내 띠(빨강) — 화면 위에 하나만 선다(앱 stores/store-parts.tsx NoticeBand 와 같다, 2026-10-28)
export const noticeBand = (title) =>
  `<div role="alert" class="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off"><p class="font-medium">${title}</p></div>`;
// 소속 BP 가 탈퇴 · 미사용인 점포의 상세 · 수정 안내 — 상태 이름(공통코드 ACCOUNT_STATUS)을 밝힌다(앱 stores/[storeId]/page.tsx · store-form-view.tsx 와 같다, 2026-10-28)
export const bpBlockedText = (status) => `이 점포가 속한 BP가 ${status} 상태로, 조회 기능만 이용할 수 있습니다.`;

// 상세 표 제목 옆 배지
export const titleBadge = (title, tone, text) => `${title}<span class="ml-[10px] inline-flex align-middle">${ui.badge(tone, text)}</span>`;

// 층별 정보 표의 입력 한 줄. 표 줄 46px 안에 34px 입력칸을 둔다.
export const floorRow = ([pos, floor, py, m2, seats] = ["지상", "", "", "", ""]) => {
  const unit = (v, label, ph, u, w = "w-[96px]") =>
    `<div class="flex items-center justify-center gap-[6px]"><div class="${w}">${ui.textField({ value: v, placeholder: ph, "aria-label": label, inputmode: "decimal" })}</div>${u}</div>`;
  return [
    `<div class="flex items-center justify-center gap-[6px]"><div class="w-[80px]">${ui.select(["지상", "지하"], { value: pos, "aria-label": "지상·지하" })}</div><div class="w-[64px]">${ui.textField({ value: floor, placeholder: "1", "aria-label": "층", inputmode: "numeric" })}</div>층</div>`,
    unit(py, "매장평수", "18", "평"),
    unit(m2, "전용면적", "59.5", "㎡"),
    unit(seats, "좌석수", "32", "석", "w-[80px]"),
    ui.button("삭제", { variant: "off", "aria-label": "이 층 삭제", "data-floor-del": true }),
  ];
};
// 층별 정보 표 + [층 추가]. 추가·삭제는 erp.js 의 initFloors 가 아래 두 template 을 복제해 처리한다.
// 표와 단추를 한 묶음으로 내는 것은 둘을 잇는 단서(data-floors)가 둘을 함께 감싸야 해서다.
// 다섯 칸을 모두 같은 너비로 둔다 — 층구분만 너비 지정이 없으면 남는 폭을 혼자 다 먹는다(2026-10-19 점검).
const FLOOR_COLUMN_WIDTH = "w-[190px]";
const FLOOR_COLUMNS = [
  { header: "층구분", width: FLOOR_COLUMN_WIDTH },
  { header: "매장평수(평)", width: FLOOR_COLUMN_WIDTH },
  { header: "전용면적(㎡)", width: FLOOR_COLUMN_WIDTH },
  { header: "좌석 수", width: FLOOR_COLUMN_WIDTH },
  { header: "삭제", width: FLOOR_COLUMN_WIDTH },
];
export const floorTable = (rows) =>
  `<div data-floors class="flex flex-col gap-[18px]">` +
  // [층 추가]는 맨 왼쪽(2026-10-16 점검 — justify-end 였다).
  `<div>${ui.button("층 추가", { variant: "soft", "data-floor-add": true })}</div>` +
  ui.dataTable(FLOOR_COLUMNS, rows.map(floorRow)) +
  `<template data-floor-row>${ui.tableRow(FLOOR_COLUMNS, floorRow())}</template>` +
  `<template data-floor-empty>${ui.tableEmptyRow(FLOOR_COLUMNS)}</template>` +
  `</div>`;

// 사업자정보 인증 상자 — 앱의 공통 상자(src/components/site/biz-verification-box.tsx, manyfast S-VRNTHD 2026-10-22 사용자 확정)와
// 같은 생김새. 회색 상자 안에 세 칸 → 버튼 → 안내. 형식 오류 · 중복은 칸 아래, 빈 칸 묶음 · 그 밖의 실패는 버튼 바로 위 한 줄이다.
// 인증하면 세 칸을 잠그고(locked) [재인증]으로 연다. 점포는 인증 상태를 묶음 제목 배지(titleBadge)로 보이고 상자 머리를 두지 않는다.
// row: 세 칸을 한 줄에(점포 등록 · 수정), 아니면 한 줄씩 쌓는다(슬라이드 패널). locked: 잠근 칸 이름 목록("num" · "ceo" · "open").
// 사업자등록번호는 하이픈을 넣어 쳐도 받는다(12자, 저장은 숫자만).
export const bizVerifyBox = (A, { id, values = ["", "", ""], locked = [], row = false, buttons, guide, hidden = false }) => {
  const [num, ceo, open] = values;
  const lock = (k) => locked.includes(k);
  const cell = row ? "flex min-w-px flex-1 flex-col" : "flex flex-col";
  const numField = ui.field("사업자등록번호", ui.textField({ value: num, placeholder: "숫자 10자리", inputmode: "numeric", ...(lock("num") ? { readonly: true } : {}) }));
  const ceoField = ui.field("대표자명", ui.textField({ value: ceo, placeholder: "대표자 이름", maxlength: 50, ...(lock("ceo") ? { readonly: true } : {}) }));
  const openField = lock("open") ? ui.field("개업일자", ui.textField({ value: open, readonly: true })) : group("개업일자", ui.dateField(A, { label: "개업일자", value: open }));
  return (
    `<section id="${id}" aria-label="사업자 번호 인증" class="flex flex-col gap-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[18px]"${hidden ? " hidden" : ""}>` +
    // 나란히(row)일 땐 위로 맞춘다 — 한 칸에만 오류 문구가 붙으면 다른 칸이 늘어나 입력칸 줄이 어긋났다(앱 biz-verification-box.tsx 와 같다, 2026-10-23)
    `<div class="${row ? "flex items-start gap-[6px]" : "flex flex-col gap-[12px]"}"><div class="${cell}">${numField}</div><div class="${cell}">${ceoField}</div><div class="${cell}">${openField}</div></div>` +
    `<div class="flex gap-[6px]">${buttons}</div>` +
    `<p class="text-[13px] leading-[1.5] text-erp-label">${guide}</p>` +
    `</section>`
  );
};
export const BIZ_GUIDE = "사업자정보가 국세청에 등록된 정보와 일치하는지 확인합니다.";

