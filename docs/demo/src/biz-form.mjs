// 1팀 화면(점포·BP·MY PAGE) 폼이 같이 쓰는 임시 부품. 1팀 공통 컴포넌트에 없는 것들이라 컴포넌트 제안 대상이다.
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

// 연락처 세 칸
export const tel = (a = "", b = "", c = "") =>
  `<div class="flex gap-[6px]">${[
    [a, "앞자리"],
    [b, "가운데자리"],
    [c, "끝자리"],
  ]
    .map(([v, l]) => ui.textField({ value: v, inputmode: "numeric", "aria-label": l }))
    .join("")}</div>`;

// 주소: 검색어 + [주소 검색] / 우편번호 · 기본주소(읽기 전용) / 상세주소
export const address = (A, label, { zip = "", base = "", detail = "" } = {}, { top = "", bottom = "" } = {}) =>
  group(
    label,
    top +
      `<div class="flex gap-[6px]"><div class="flex-1">${ui.searchField(A, { placeholder: "도로명, 건물명, 지번으로 검색", label: `${label} 검색어` })}</div>${ui.button("주소 검색", { variant: "soft" })}</div>` +
      `<div class="flex gap-[6px]"><div class="w-[120px] shrink-0">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": `${label} 우편번호` })}</div>${ui.textField({ value: base, readonly: true, placeholder: "검색해서 고르면 채워집니다", "aria-label": `${label} 기본주소` })}</div>` +
      ui.textField({ value: detail, maxlength: 100, placeholder: "상세주소", "aria-label": `${label} 상세주소` }) +
      bottom,
  );

// 안쪽 묶음 상자(사업자 번호 인증 상자 등). 두 바탕 규칙대로 #f8f9fb 바탕 + 패널 선.
export const box = (id, title, right, body, hidden = false) =>
  `<div id="${id}" class="flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]"${hidden ? " hidden" : ""}><div class="flex items-center gap-[6px]"><h4 class="flex-1 text-[15px] font-semibold text-erp-ink">${title}</h4>${right}</div>${body}</div>`;

// 같은 자리의 두 묶음을 바꿔 보이는 버튼(접힌 버튼 ↔ 입력 상자 ↔ 인증 완료). swap 스크립트가 처리한다.
export const swapAttr = (from, to) => ({ "data-swap": `${from},${to}` });
export const SWAP_SCRIPT = `<script>document.addEventListener("click",(e)=>{const b=e.target.closest("[data-swap]");if(!b)return;const[f,t]=b.dataset.swap.split(",");document.getElementById(f).hidden=true;document.getElementById(t).hidden=false;});</script>`;

// 사업자 번호 인증 묶음. start: "fold"(인증 전·접힘) | "open"(인증 전·늘 펼침, 접기 없음) | "done"(인증 완료).
// values: [사업자등록번호, 대표자명, 개업일자], input: 입력 상자의 처음 값(없으면 values),
// reauthLocked: 재인증 때 번호·개업일자를 고정하고 대표자명만 받는다(점포 수정).
// inline: [인증하기] 를 입력칸 줄 끝(개업일자 옆)에 둬 상자 높이를 한 줄 줄인다(점포 등록).
export function bizAuth(A, p, { start = "fold", values = ["", "", ""], input = values, doneBadge = "인증 완료", reauthLocked = false, after = "", confirmReauth = false, inline = false } = {}) {
  const ids = { fold: `${p}-fold`, form: `${p}-form`, done: `${p}-done` };
  const [num, ceo, open] = input;
  const fold = start === "open" ? "" : `<div id="${ids.fold}"${start === "fold" ? "" : " hidden"}>${ui.button("사업자 번호 인증하기", { variant: "soft", ...swapAttr(ids.fold, ids.form) })}</div>`;
  const back = start === "fold" ? ids.fold : ids.done;
  const closeBtn = start === "open" ? "" : ui.button("접기", { variant: "off", ...swapAttr(ids.form, back) });
  const authBtn = ui.button("인증하기", swapAttr(ids.form, ids.done));
  const fields = reauthLocked
    ? ui.formRow(
        ui.field("사업자등록번호", ui.textField({ value: num, readonly: true })),
        ui.field("개업일자", ui.textField({ value: open, readonly: true })),
        ui.field("대표자명", ui.textField({ value: ceo })),
      ) + help("대표자가 바뀌었을 때 새 이름으로 다시 확인합니다. 번호와 개업일자는 바꿀 수 없습니다.")
    : ui.formRow(
        ui.field("사업자등록번호", ui.textField({ value: num })),
        ui.field("대표자명", ui.textField({ value: ceo })),
        group("개업일자", ui.dateField(A, { label: "개업일자", value: open })),
        inline ? `<div class="shrink-0 self-end">${authBtn}</div>` : "",
      );
  const form = box(
    ids.form,
    start === "done" ? "사업자 번호 재인증" : "사업자 번호 인증",
    closeBtn,
    fields + (inline && !reauthLocked ? "" : `<div>${authBtn}</div>`),
    start !== "open",
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
  const done = box(
    ids.done,
    "사업자정보",
    doneBadge ? ui.badge("on", doneBadge) : "", // 묶음 제목에 이미 인증 배지가 있으면 doneBadge: "" 로 뺀다
    ui.formRow(
      ui.field("사업자등록번호", ui.textField({ value: vn, readonly: true })),
      ui.field("대표자명", ui.textField({ value: vc, readonly: true })),
      ui.field("개업일자", ui.textField({ value: vo, readonly: true })),
    ) +
      after +
      `<div>${reauth}</div>`,
    start !== "done",
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
    ui.button("삭제", { variant: "off", "aria-label": "이 층 삭제" }),
  ];
};
export const floorTable = (rows) =>
  ui.dataTable([{ header: "층" }, { header: "매장평수" }, { header: "전용면적" }, { header: "좌석수" }, { header: "삭제", width: "w-[100px]" }], rows.map(floorRow));

