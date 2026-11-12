// 시설물 및 장비 등록. 목업 docs/mockup/stores/facilities-new.html 의 「입력 중」 상태를 BP 마스터로 본 것(1.5차, 앱 화면 없음).
// 점포 등록(stores/new.mjs)처럼 별도 화면 — 취소 · 저장은 묶음 제목 줄 오른쪽, 아래 두 묶음(기본 정보 · 관리 정보)을 반씩.
// render 의 mode "edit" 는 수정 화면(facilities-edit.mjs) — 점포는 읽기 전용이다. 관리 정보는 따로 지우지 않고 칸을 비워 저장한다(PL-4).
// 근거: 「시설물·장비 관리 정책서」 PL-1 ~ PL-6. 입력 규칙은 점포 등록 화면과 같다 — [저장]을 누르면 걸린 칸 바로 아래 빨간 문구(알럿 없음).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { row } from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { address } from "../../store-parts.mjs";
import { CYCLES, CYCLE_CODE, GROUP_CODES, GROUP_SCRIPT, STATUSES, attachment, classSelect, codeGroup, groupSelect, memoField, note, priceFields, storePick, PRICE_SCRIPT } from "../../facility-parts.mjs";

// errors 를 켜면 [저장]을 눌러 검사에 걸린 견본이다(facilities-new-error.mjs) — 걸린 칸 바로 아래 빨간 문구, 알럿 없음(PL-5)
const ERR = (t) => `<p role="alert" class="text-[13px] leading-[1.5] text-erp-off">${t}</p>`;

export const render = ({ A, R }, { mode = "create", errors = false } = {}) => {
  const edit = mode === "edit";

  // 점포 — 등록은 점포명 · 점포코드 자동완성으로 하나(폐점 점포 제외), 수정은 바꿀 수 없어 읽기 전용(PL-1)
  const store = edit
    ? f.group("점포", ui.textField({ value: "모리커피 성수점", readonly: true, "aria-label": "점포" }) + note("등록한 뒤에는 점포를 바꿀 수 없습니다."))
    : f.group(f.req("점포"), storePick(A, "모리커피 성수점"));

  // 기본 정보 — 필수 다섯 칸만. 늘 펼쳐 둔다(2026-11-11 사용자 지정)
  const required = [
    store,
    ui.field(f.req("시설물/장비명"), ui.textField({ value: "EK43S 전자동 원두 커피 그라인더", maxlength: 100 })),
    // 운영상태 — 공통코드 「시설물 운영상태」, 처음 값 운영(PL-2)
    f.group(f.req("운영상태"), `<div role="radiogroup" aria-label="운영상태" class="flex h-[34px] items-center gap-[18px]">${STATUSES.map((s) => ui.radio(s, "facState", s === "운영")).join("")}</div>`),
    // 그룹 · 분류 — 그룹을 골라야 분류가 나오고, 그룹을 바꾸면 분류를 지운다(PL-3). 수정 화면의 미사용 분류는 지금 값으로 남는다
    row(
      f.group(f.req("그룹"), groupSelect("fac-form-class", { first: "선택", value: "점포 장비" })),
      codeGroup(
        f.req("분류"),
        [GROUP_CODES["점포 장비"]],
        edit
          ? ui.select(["선택", "그라인더 (미사용)", "커피머신", "제빙기"], { value: "그라인더 (미사용)", id: "fac-form-class", "aria-label": "분류", "data-first": "선택" }) +
              note("미사용으로 바뀐 분류입니다. 다른 분류로 바꾸면 다시 고를 수 없습니다.")
          : classSelect("fac-form-class", { first: "선택", group: "점포 장비", value: "그라인더" }),
        "fac-form-class",
      ),
    ),
  ];

  // 메모 — 선택, 200자까지. 칸 이름 옆에 글자 수(PL-5). 아무 때나 짧게 남기는 칸이라 접지 않고 기본 정보 오른쪽 운영상태 아래
  const memo = memoField(edit ? "주방 벽 쪽 전용 콘센트를 쓴다. 원두 투입구 덮개 분실 주의." : "");

  // 상세 정보 — 선택 입력을 쓰임새대로 네 묶음으로 나눠 접는다(2026-11-11 사용자 지정).
  // u() 로 감싼 칸 하나가 「입력 n / 전체」의 한 칸이다 — 값이 있거나(수량 · 총금액 제외) 올린 파일이 있으면 채운 칸으로 센다
  const u = (h) => `<div data-fill-unit class="contents">${h}</div>`;
  const product = [
    ui.formRow(u(ui.field("브랜드", ui.textField({ value: "말코닉" }))), u(ui.field("제조사", ui.textField({ value: "말코닉" })))),
    ui.formRow(u(ui.field("Serial number", ui.textField({ value: "SN1234567" }))), u(ui.field("설치 위치", ui.textField({ value: "주방" })))),
  ];
  const buy = [
    // 전화번호는 세 칸, 칸마다 숫자 4자리까지 — 이은 번호가 9~12자리가 아니면 칸 아래 빨간 문구(PL-5)
    ui.formRow(u(ui.field("구매처", ui.textField({ value: "다온컴퍼니" }))), u(f.group("구매처 전화번호", f.tel("02", "333", "4444")))),
    // 오류 문구가 붙은 줄은 칸을 위로 맞춘다(config-parts row) — 가운데 맞춤이면 옆 칸 라벨이 내려간다
    row(
      u(ui.field("영업사원", ui.textField({ value: "홍길동" }))),
      u(f.group("영업사원 전화번호", errors ? f.tel("010", "22", "") + ERR("영업사원 전화번호는 숫자 9~12자리입니다.") : f.tel("010", "2222", "3333"))),
    ),
    // 단가 · 수량 · 총금액 — 총금액은 단가 × 수량으로 채워지고 고칠 수 없다. 「부가세 포함」 처음 켜짐(PL-5)
    u(priceFields("10,000,000", 2)),
    // 설치일은 구매일보다 앞설 수 없다(PL-5)
    row(
      u(f.group("구매일", ui.dateField(A, { label: "구매일", value: "2025-01-03" }))),
      u(f.group("설치일", errors ? ui.dateField(A, { label: "설치일", value: "2025-01-01" }) + ERR("설치일은 구매일보다 앞설 수 없습니다.") : ui.dateField(A, { label: "설치일", value: "2025-01-05" }))),
    ),
  ];
  const doc = [
    ui.formRow(
      u(f.group("사용 유효기한", ui.dateField(A, { label: "사용 유효기한", value: "2030-01-01" }))),
      u(f.group("품질 보증기한", ui.dateField(A, { label: "품질 보증기한", value: "2027-01-01" }))),
    ),
    // 문서 3종 — 공통 첨부 칸, 종류마다 1개(PL-5). 맞지 않는 파일(형식 · 크기)은 입력 오류 견본에서 목록 아래 「└ 까닭」
    u(attachment("사용 매뉴얼", [["EK43S_사용매뉴얼.pdf", "1.8MB"]])),
    u(
      attachment(
        "주의사항",
        edit ? [["사용주의사항.pdf", "320KB"]] : [],
        errors ? [["사용주의사항_원본.hwp", "JPG, PNG, PDF 파일만 첨부할 수 있습니다."], ["주의사항_스캔본.pdf", "10MB 이하 파일만 첨부할 수 있습니다."]] : [],
      ),
    ),
    u(attachment("제품 보증서", [["제품보증서.png", "640KB", true]])),
  ];
  const manage = [
    // 관리 담당자 — 그 점포의 재직 직원, 고르면 전화번호 세 칸을 휴대폰 번호로 채운다(PL-6)
    ui.formRow(
      u(f.group("관리 담당자", ui.select(["선택", "서지안", "오세라", "김도윤"], { value: "서지안", "aria-label": "관리 담당자" }))),
      u(f.group("관리 담당자 전화번호", f.tel("010", "2323", "2323"))),
    ),
    // 점검 주기 — 공통코드 「시설물 점검 주기」, 처음 값 없음(「선택」, 2026-11-11 사용자 지정 — 전엔 매일)(PL-6)
    ui.formRow(u(codeGroup("점검 주기", [CYCLE_CODE], ui.select(["선택", ...CYCLES], { value: "매월", "aria-label": "점검 주기" }))), u(ui.field("점검 비고", ui.textField({ value: "매달 정기휴일에 점검" })))),
    // A/S센터 — 공통 주소 칸(점포 주소와 같다): 검색 → 우편번호 · 기본주소, 상세주소 100자, [지우기](PL-5)
    u(address(A, "A/S센터 주소", { zip: "04522", base: "서울 중구 삼봉로 98", detail: "1층 2호" })),
    u(f.group("A/S센터 전화번호", f.tel("02", "2222", "8888"))),
  ];

  const requiredBox = ui.formGroup(
    `기본 정보<span class="ml-[6px] text-[13px] font-medium text-erp-label">필수 칸은 * 표시</span>`,
    // 왼쪽에 점포 · 시설물/장비명 · 그룹 · 분류, 오른쪽에 운영상태 · 메모(2026-11-11 사용자 지정)
    `<div class="grid grid-cols-2 items-start gap-[24px]"><div class="flex flex-col gap-[18px]">${required[0]}${required[1]}${required[3]}</div><div class="flex flex-col gap-[18px]">${required[2]}${memo}</div></div>`,
  );

  // 묶음 하나 — 접힌 줄에 이름 · 「입력 n / 전체」(스크립트가 센다) · 안의 항목, 오른쪽에 펼치기 / 접기.
  // 등록은 모두 접힌 채로 시작한다. 수정은 값이 있는 묶음을 펼치고, 칸 오류가 있으면 그 묶음(구매 정보 · 기한 · 문서)을 펼친다
  const chevron = `<svg viewBox="0 0 10 6" aria-hidden="true" class="size-[10px] shrink-0 stroke-erp-label transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-open/fold:rotate-180 motion-reduce:transition-none"><path d="M1 1l4 4 4-4" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const fold = (title, hint, items, open) =>
    `<details data-fold${open ? " open" : ""} class="group/fold flex flex-col">` +
    `<summary class="flex h-[46px] cursor-pointer list-none items-center gap-[10px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] transition-colors duration-150 ease-out hover:border-erp-brand [&::-webkit-details-marker]:hidden">` +
    `<span class="shrink-0 text-[15px] font-semibold text-erp-ink">${title}</span><span data-fold-count class="shrink-0 text-[13px] font-medium text-erp-label"></span>` +
    `<span class="h-[11px] w-px shrink-0 bg-[#d9d9d9]"></span><span class="min-w-0 truncate text-[13px] text-erp-label">${hint}</span>` +
    `<span class="ml-auto shrink-0 text-[13px] font-medium text-erp-label group-open/fold:hidden">펼치기</span><span class="ml-auto hidden shrink-0 text-[13px] font-medium text-erp-label group-open/fold:inline">접기</span>${chevron}</summary>` +
    `<div class="mt-[10px] flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">${items.join("")}</div></details>`;
  const details =
    `<section class="flex flex-col gap-[10px]"><div class="flex items-center"><h3 class="flex-1 text-[15px] font-semibold text-erp-ink">상세 정보<span class="ml-[6px] text-[13px] font-medium text-erp-label">선택</span></h3>` +
    `<button type="button" data-fold-all class="text-[13px] font-medium text-erp-label underline-offset-2 hover:text-erp-ink hover:underline">${edit ? "모두 접기" : "모두 펼치기"}</button></div>` +
    `<div class="grid grid-cols-2 items-start gap-[24px]"><div class="flex flex-col gap-[12px]">` +
    fold("제품 정보", "브랜드 · 제조사 · Serial number · 설치 위치", product, edit) +
    fold("구매 정보", "구매처 · 영업사원 · 단가 · 수량 · 총금액 · 구매일 · 설치일", buy, edit || errors) +
    `</div><div class="flex flex-col gap-[12px]">` +
    fold("기한 · 문서", "사용 유효기한 · 품질 보증기한 · 사용 매뉴얼 · 주의사항 · 제품 보증서", doc, edit || errors) +
    fold("관리 · A/S", "관리 담당자 · 점검 주기 · 점검 비고 · A/S센터", manage, edit) +
    `</div></div></section>`;

  // 「입력 n / 전체」를 세고, [모두 펼치기 / 모두 접기]로 네 묶음을 한꺼번에 여닫는다
  const FOLD_SCRIPT = `<script>
(() => {
  const folds = [...document.querySelectorAll("[data-fold]")];
  const all = document.querySelector("[data-fold-all]");
  const filled = (unit) =>
    [...unit.querySelectorAll("input:not([type=radio]):not([type=checkbox]):not([readonly]):not([data-qty]), select, textarea")].some((i) => i.value.trim() && i.value !== "선택") ||
    !!unit.querySelector("li button");
  const count = () =>
    folds.forEach((d) => {
      const units = [...d.querySelectorAll("[data-fill-unit]")];
      d.querySelector("[data-fold-count]").textContent = "입력 " + units.filter(filled).length + " / " + units.length;
    });
  const label = () => (all.textContent = folds.every((d) => d.open) ? "모두 접기" : "모두 펼치기");
  all.addEventListener("click", () => {
    const open = !folds.every((d) => d.open);
    folds.forEach((d) => (d.open = open));
  });
  folds.forEach((d) => d.addEventListener("toggle", label));
  ["input", "change"].forEach((t) => document.addEventListener(t, count));
  count();
  label();
})();
</script>`;

  const save = ui.button("저장", { href: link(R, "stores/facilities-detail.html") });
  const cancel = ui.button("취소", { variant: "off", href: link(R, edit ? "stores/facilities-detail.html" : "stores/facilities.html") });

  const body = ui.detailBody(
    ui.sectionHead(edit ? "시설물 · 장비 수정" : "시설물 · 장비 등록", cancel + save) +
      `<div class="flex flex-col gap-[24px]">${requiredBox}${details}</div>` +
      GROUP_SCRIPT +
      PRICE_SCRIPT +
      FOLD_SCRIPT,
  );
  return {
    title: edit ? "시설물 및 장비 수정" : "시설물 및 장비 등록",
    html: ui.erpFrame({ header: erpHeader(A, R), title: "시설물 및 장비 관리", body }),
  };
};

export default (ctx) => render(ctx);
