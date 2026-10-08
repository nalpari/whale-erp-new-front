// 플랫폼 관리자 등록. 목업 docs/mockup/system/admins-new.html 의 기본 상태(입력)를 플랫폼 관리자(등록 권한)로 본 것.
// 플랫폼 관리자라 사용자 권한 목록에 플랫폼 마스터가 없다. 목업 제목 줄의 [취소][저장]은 화면 아래로 내렸다.
// 상세·등록·수정은 따로 화면(주소)이 없고 목록(system/admins.html)의 슬라이드 패널로만 연다(2026-10-08). 저장하면 상세 패널로 간다(erp.js data-save-panel).
import * as ui from "../ui.mjs";

// 1팀 컴포넌트에 없는 것들: 필수 표시, 입력칸 아래 도움말, 안내 문구, 묶음 제목 옆 보조 글.
const req = (label) => `${label} <span class="text-[#e93737]">*</span>`; // #e93737: DESIGN.md 위험 글자색
const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
// 휴대전화번호 세 칸
const tel = (a, b, c) =>
  `<div class="flex gap-[6px]">${[
    [a, "앞자리"],
    [b, "가운데자리"],
    [c, "끝자리"],
  ]
    .map(([v, l]) => ui.textField({ value: v, inputmode: "numeric", "aria-label": l }))
    .join("")}</div>`;
const BLANK = `<div class="min-w-px flex-1"></div>`;
const stack = (...c) => `<div class="flex flex-col gap-[8px]">${c.join("")}</div>`;
// 주소: 검색칸 + [주소 검색] / 우편번호·기본주소(검색 결과로만 채움) / 상세주소
const address = (A, zip, base, detail) =>
  `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">주소</span><div class="flex gap-[6px]"><div class="flex-1">${ui.searchField(A, { placeholder: "도로명, 건물명, 지번으로 검색", label: "주소 검색어" })}</div>${ui.button("주소 검색", { variant: "soft" })}</div><div class="flex gap-[6px]"><div class="w-[120px] shrink-0">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": "우편번호" })}</div>${ui.textField({ value: base, readonly: true, placeholder: "검색해서 고르면 채워집니다", "aria-label": "기본주소" })}</div>${ui.textField({ value: detail, maxlength: 100, placeholder: "상세주소", "aria-label": "상세주소" })}</div>`;

function platformAdminNewBody(A) {
  // 패널(464px)이라 두 칸 줄을 한 칸씩 세로로 쌓는다
  const row = (...cells) => cells.filter((c) => c !== BLANK).join("");
  const basic = ui.formGroup(
    "기본정보",
    row(
      ui.field(
        req("아이디"),
        stack(ui.textField({ value: "platyoon", maxlength: 20, placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요." })),
      ),
      ui.field(req("이름"), ui.textField({ value: "윤채원", maxlength: 20, placeholder: "한글 또는 영문 2~20자" })),
    ),
    row(
      ui.field(req("연락처"), tel("010", "9013", "5528")),
      ui.field(req("이메일"), stack(ui.textField({ value: "chaewon.yoon@whale-erp.example", maxlength: 100 }))),
    ),
    row(
      ui.field("소속 부서", stack(ui.textField({ value: "플랫폼운영팀", maxlength: 30 }))),
      ui.field("직책", stack(ui.textField({ value: "사원", maxlength: 30 }))),
    ),
    address(A, "13529", "경기 성남시 분당구 판교역로 166", "7층"),
  );

  const role = ui.formGroup(
    "사용자 권한",
    row(
      ui.field(
        req("사용자 권한"),
        stack(
          ui.select(["플랫폼 관리자 · PA000001", "고객지원 담당 · PA000002", "정산 담당 · PA000003", "기준정보 조회 · PA000004"], { "aria-label": "사용자 권한" }),
        ),
      ),
      BLANK,
    ),
  );

  // 저장하면 등록 패널을 닫고 상세 패널을 연다
  const buttons = `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", "data-close": true })}${ui.button("저장", { "data-save-panel": "platform-admin-detail-panel" })}</div>`;
  return basic + role + note("초기 비밀번호를 등록 이메일로 발송합니다.") + buttons;
}

export const platformAdminNewPanel = (A, R) =>
  ui.slidePanel("platform-admin-new-panel", "플랫폼 관리자 등록", ui.sectionHead("플랫폼 관리자 등록") + platformAdminNewBody(A));
