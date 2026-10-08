// 플랫폼 관리자 수정. 목업 docs/mockup/system/admins-edit.html 의 기본 상태(platpark 박지우 · 일반)를 플랫폼 관리자로 본 것.
// 목업 제목 줄의 [취소][저장]은 화면 아래로 내렸다. 권한 선택의 묶음(optgroup)은 Select 가 받지 않아 한 줄 목록으로 폈다.
// 상세·등록·수정은 따로 화면(주소)이 없고 목록(system/admins.html)의 슬라이드 패널로만 연다(2026-10-08). 저장하면 상세 패널로 간다(erp.js data-save-panel).
import * as ui from "../ui.mjs";

// 1팀 컴포넌트에 없는 것들: 필수 표시, 입력칸 아래 도움말, 안내 문구, 묶음 제목 옆 보조 글. (admins-new 와 같은 모양)
const req = (label) => `${label} <span class="text-[#e93737]">*</span>`; // #e93737: DESIGN.md 위험 글자색
const sub = (t) => `<span class="ml-[6px] text-[13px] font-normal text-erp-label">${t}</span>`;
const tel = (a, b, c) =>
  `<div class="flex gap-[6px]">${[
    [a, "앞자리"],
    [b, "가운데자리"],
    [c, "끝자리"],
  ]
    .map(([v, l]) => ui.textField({ value: v, inputmode: "numeric", "aria-label": l }))
    .join("")}</div>`;
const stack = (...c) => `<div class="flex flex-col gap-[8px]">${c.join("")}</div>`;
const address = (A, zip, base, detail) =>
  `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">주소</span><div class="flex gap-[6px]"><div class="flex-1">${ui.searchField(A, { placeholder: "도로명, 건물명, 지번으로 검색", label: "주소 검색어" })}</div>${ui.button("주소 검색", { variant: "soft" })}</div><div class="flex gap-[6px]"><div class="w-[120px] shrink-0">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": "우편번호" })}</div>${ui.textField({ value: base, readonly: true, placeholder: "검색해서 고르면 채워집니다", "aria-label": "기본주소" })}</div>${ui.textField({ value: detail, maxlength: 100, placeholder: "상세주소", "aria-label": "상세주소" })}</div>`;

function platformAdminEditBody(A) {
  // 패널(464px)이라 두 칸 줄을 한 칸씩 세로로 쌓는다
  const row = (...cells) => cells.join("");

  const basic = ui.formGroup(
    "기본정보",
    row(
      ui.field(req("아이디"), stack(ui.textField({ value: "platpark", readonly: true }))),
      ui.field(req("이름"), ui.textField({ value: "박지우", maxlength: 20, placeholder: "한글 또는 영문 2~20자" })),
    ),
    row(
      ui.field(req("연락처"), tel("010", "7781", "3302")),
      ui.field(req("이메일"), stack(ui.textField({ value: "jiwoo.park@whale-erp.example", maxlength: 100 }))),
    ),
    row(
      ui.field("소속 부서", ui.textField({ value: "고객지원팀", maxlength: 30 })),
      ui.field("직책", ui.textField({ value: "매니저", maxlength: 30 })),
    ),
    address(A, "06236", "서울 강남구 테헤란로 152", "12층"),
  );

  const role = ui.formGroup(
    "사용자 권한 · 계정 상태",
    row(
      ui.field(
        "사용자 권한",
        stack(
          ui.select(["플랫폼 마스터 · PM000001", "플랫폼 관리자 · PA000001", "고객지원 담당 · PA000002", "정산 담당 · PA000003", "기준정보 조회 · PA000004"], {
            value: "고객지원 담당 · PA000002",
            "aria-label": "사용자 권한",
          }),
        ),
      ),
      ui.field(req("계정 상태"), ui.select(["사용", "미사용"], { "aria-label": "계정 상태" })),
    ),
  );

  // 저장하면 수정 패널을 닫아 아래 상세 패널을 보인다
  const buttons = `<div class="flex justify-center gap-[6px]">${ui.button("닫기", { variant: "off", "data-close": true })}${ui.button("저장", { "data-save-panel": "platform-admin-detail-panel" })}</div>`;
  return basic + role + buttons;
}

export const platformAdminEditPanel = (A, R) =>
  ui.slidePanel(
    "platform-admin-edit-panel",
    "플랫폼 관리자 수정",
    ui.sectionHead(`플랫폼 관리자 수정${sub("박지우 · platpark")}`) + platformAdminEditBody(A),
  );
