// 시설물 및 장비 수리 이력 등록. 목업 docs/mockup/stores/repairs-new.html 의 「입력 중」 상태를 BP 마스터로 본 것(1.5차, 앱 화면 없음).
// 시설물·장비 등록(stores/facilities-new.mjs)처럼 별도 화면 — 취소 · 저장은 묶음 제목 줄 오른쪽, 아래 두 묶음(고장 정보 · 수리 정보)을 반씩.
// render 의 mode "edit" 는 수정 화면(repairs-edit.mjs) — 대상(점포 · 그룹 · 분류 · 시설물·장비)은 읽기 전용.
// errors 를 켜면 [저장]을 눌러 검사에 걸린 견본(repairs-new-error.mjs) — 걸린 칸 바로 아래 빨간 문구, 알럿 없음.
// 근거: 「시설물·장비 수리 이력 정책서」 PL-1 ~ PL-3.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { row } from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { GROUP_CODES, GROUP_SCRIPT, OPERATING_BY_CLASS, PAYMENT_METHODS, amount, classSelect, codeGroup, groupSelect, note, storePick } from "../../facility-parts.mjs";

const ERR = (t) => `<p role="alert" class="text-[13px] leading-[1.5] text-erp-off">${t}</p>`;

// 교체 부품 한 줄 — 부품명(필수, 50자) · 수량(1 이상 정수) · [삭제](확인창 없음, PL-3)
const partRow = (name = "", qty = "", error = "") =>
  `<li data-part class="flex flex-col gap-[8px]"><div class="flex gap-[6px]"><div class="min-w-px flex-1">${ui.textField({ value: name, maxlength: 50, placeholder: "부품명", "aria-label": "부품명" })}</div><div class="w-[90px] shrink-0">${ui.textField({ value: qty, inputmode: "numeric", placeholder: "수량", "aria-label": "수량" })}</div>${ui.button("삭제", { variant: "off", "data-part-del": true })}</div>${error ? ERR(error) : ""}</li>`;

// 그룹 → 분류는 GROUP_SCRIPT, 분류 → 시설물·장비(「운영」만)와 교체 부품 줄 추가 · 삭제는 이 화면 스크립트
const SCRIPT = `<script>
(() => {
  const FAC = ${JSON.stringify(OPERATING_BY_CLASS)};
  const fac = document.getElementById("rep-fac");
  const empty = document.getElementById("rep-fac-empty");
  const fill = (klass) => {
    if (!fac) return;
    const list = FAC[klass] || [];
    fac.innerHTML = ["선택", ...list].map((n) => "<option>" + n + "</option>").join("");
    fac.disabled = !list.length;
    // 분류를 골랐는데 「운영」인 시설물·장비가 없으면 선택칸 아래 안내(PL-1)
    if (empty) empty.hidden = !(klass && klass !== "선택" && !list.length);
  };
  document.addEventListener("change", (e) => {
    if (e.target.id === "rep-class") fill(e.target.value);
  });
  const list = document.querySelector("[data-parts]");
  const TEMPLATE = ${JSON.stringify(partRow())};
  document.addEventListener("click", (e) => {
    const del = e.target.closest("[data-part-del]");
    if (del) del.closest("[data-part]").remove();
    if (e.target.closest("[data-part-add]")) {
      list.insertAdjacentHTML("beforeend", TEMPLATE);
      list.lastElementChild.querySelector("input").focus();
    }
  });
})();
</script>`;

export const render = ({ A, R }, { mode = "create", errors = false } = {}) => {
  const edit = mode === "edit";

  // 대상 — 등록은 점포 자동완성(폐점 제외) → 그룹 → 분류 → 시설물·장비(「운영」만), 수정은 바꿀 수 없어 읽기 전용(PL-1)
  const target = edit
    ? [
        f.group("점포", ui.textField({ value: "모리커피 성수점", readonly: true, "aria-label": "점포" })),
        ui.formRow(
          f.group("그룹", ui.textField({ value: "점포 장비", readonly: true, "aria-label": "그룹" })),
          f.group("분류", ui.textField({ value: "그라인더", readonly: true, "aria-label": "분류" })),
        ),
        f.group(
          "시설물·장비",
          ui.textField({ value: "EK43S 전자동 원두 커피 그라인더", readonly: true, "aria-label": "시설물·장비" }) +
            note("등록한 뒤에는 대상을 바꿀 수 없습니다. 대상을 잘못 골랐다면 삭제하고 다시 등록해 주세요."),
        ),
      ]
    : [
        f.group(f.req("점포"), storePick(A, "모리커피 성수점")),
        ui.formRow(
          f.group(f.req("그룹"), groupSelect("rep-class", { first: "선택", value: "점포 장비" })),
          codeGroup(f.req("분류"), [GROUP_CODES["점포 장비"]], classSelect("rep-class", { first: "선택", group: "점포 장비", value: "그라인더" }), "rep-class"),
        ),
        f.group(
          f.req("시설물·장비"),
          ui.select(["선택", ...OPERATING_BY_CLASS["그라인더"]], { value: OPERATING_BY_CLASS["그라인더"][0], id: "rep-fac", "aria-label": "시설물·장비" }) +
            note("운영상태가 「운영」인 시설물·장비만 고를 수 있습니다.") +
            `<p id="rep-fac-empty" hidden role="alert" class="text-[13px] leading-[1.5] text-erp-off">시설물 및 장비 관리에서 먼저 시설물·장비를 등록해 주세요.</p>`,
        ),
      ];

  const faultGroup = ui.formGroup(
    "고장 정보",
    ...target,
    f.group(f.req("고장 내용"), ui.textarea({ rows: 3, value: "원두가 정상적인 굵기로 분쇄되지 않음", maxlength: 200, placeholder: "200자 이내로 입력해 주세요.", "aria-label": "고장 내용" })),
    f.group(f.req("고장 원인"), ui.textarea({ rows: 3, value: "원두 그라인더의 칼날 마모", maxlength: 200, placeholder: "200자 이내로 입력해 주세요.", "aria-label": "고장 원인" })),
    f.group(f.req("고장 일자"), ui.dateField(A, { label: "고장 일자", value: "2026-11-03" })),
  );

  const repairGroup = ui.formGroup(
    "수리 정보",
    // 수리 일자는 고장 일자보다 앞설 수 없다(PL-2)
    f.group("수리 일자", errors ? ui.dateField(A, { label: "수리 일자", value: "2026-11-01" }) + ERR("수리 일자는 고장 일자보다 앞설 수 없습니다.") : ui.dateField(A, { label: "수리 일자", value: "2026-11-05" })),
    // 오류 문구가 붙은 줄은 칸을 위로 맞춘다(config-parts row)
    row(
      ui.field("수리기사", ui.textField({ value: "홍길동", maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      f.group(
        "수리기사 전화번호",
        errors ? f.tel("010", "22", "") + ERR("수리기사 전화번호는 숫자 9~12자리입니다.") : f.tel("010", "2222", "3333"),
      ),
    ),
    // 수리비 — 시설물 구매액 칸과 같다(PL-2)
    `<div class="flex flex-col gap-[8px]"><span class="flex items-center gap-[18px] text-[14px] font-medium text-erp-label">수리비${x.toggle("부가세 포함", true)}</span>${amount("200,000", "수리비")}</div>`,
    f.group("수리비 결제 수단", ui.select(["선택", ...PAYMENT_METHODS], { value: "신용카드", "aria-label": "수리비 결제 수단" })),
    // 교체 부품 — 줄이 없어도 저장할 수 있다(PL-3)
    `<div role="group" aria-label="교체 부품" class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">교체 부품</span><ul data-parts class="flex flex-col gap-[6px]">${
      partRow("그라인더 모터", "1") + (errors ? partRow("", "2", "교체 부품명을 입력해 주세요.") : partRow("그라인더 칼날", "2"))
    }</ul><div>${ui.button("교체 부품 추가", { variant: "soft", "data-part-add": true })}</div></div>`,
  );

  const save = ui.button("저장", { href: link(R, "stores/repairs-detail.html") });
  const cancel = ui.button("취소", { variant: "off", href: link(R, edit ? "stores/repairs-detail.html" : "stores/repairs.html") });
  const body = ui.detailBody(
    ui.sectionHead(edit ? "수리 이력 수정" : "수리 이력 등록", cancel + save) +
      `<div class="grid grid-cols-2 items-start gap-[24px]">${faultGroup}${repairGroup}</div>` +
      GROUP_SCRIPT +
      SCRIPT,
  );
  return {
    title: edit ? "수리 이력 수정" : "수리 이력 등록",
    html: ui.erpFrame({ header: erpHeader(A, R), title: "시설물 및 장비 수리 이력", body }),
  };
};

export default (ctx) => render(ctx);
