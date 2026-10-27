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
// 주소: 검색칸(치는 대로 바로 아래 층에 결과 — 앱 address-field.tsx, [주소 검색] 버튼 없음) / 우편번호·기본주소(검색 결과로만 채움) + [지우기] / 상세주소(주소를 고른 뒤에만 적는다) — 2026-10-13 앱 반영
// 우편번호는 검색으로만 채워지는 숫자 5자리라 좁게 둔다 — 넓게 두면 옆 기본주소 칸이 너무 좁아진다(2026-10-20 디자인 수정, 앱 address-field.tsx 와 같다).
const address = (A, zip, base, detail) =>
  `<div class="flex flex-col gap-[8px]" data-addr-live><span class="text-[14px] font-medium text-erp-label">주소</span><div class="relative" data-addr-box>${ui.searchField(A, { placeholder: "도로명, 건물명, 지번으로 검색", label: "주소 검색어" })}</div><div class="flex gap-[6px]"><div class="w-[80px] shrink-0">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": "우편번호" })}</div>${ui.textField({ value: base, readonly: true, placeholder: "검색해서 고르면 채워집니다", "aria-label": "기본주소" })}<span data-addr-clear${zip ? "" : " hidden"}>${ui.button("지우기", { variant: "off" })}</span></div>${ui.textField(base ? { value: detail, maxlength: 100, placeholder: "상세주소", "aria-label": "상세주소" } : { value: detail, maxlength: 100, placeholder: "주소를 검색해 고른 뒤 적습니다", "aria-label": "상세주소", disabled: true })}</div>`;

function platformAdminNewBody(A) {
  // 패널(464px)이라 두 칸 줄을 한 칸씩 세로로 쌓는다
  const row = (...cells) => cells.filter((c) => c !== BLANK).join("");
  const basic = ui.formGroup(
    "기본정보",
    row(
      ui.field(
        req("아이디"),
        // 칸을 벗어나거나 Enter 를 치면 형식 · 중복을 확인해 칸 아래에 알린다(erp.js data-dupcheck, 앱 admin-form-panel.tsx).
        // 데모의 ‘이미 있는 아이디’는 data-taken 값이고, fail 로 시작하는 아이디는 확인 요청 실패를 흉내 낸다(data-fail-prefix).
        // 확인 중 · 사용 가능 · 중복 · 확인 실패를 data-dup-message 하나로 그린다 — 클래스 · 내용은 erp.js initDupCheck 가 바꾼다.
        stack(
          ui.textField({ value: "platyoon", maxlength: 20, placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요.", "data-dupcheck": "id", "data-taken": "plathan,whaleadmin", "data-fail-prefix": "fail" }),
          `<p data-dup-message hidden></p>`,
        ),
      ),
      ui.field(req("이름"), ui.textField({ value: "윤채원", maxlength: 20, placeholder: "한글 또는 영문 2~20자로 입력해 주세요." })),
    ),
    row(
      ui.field(req("연락처"), tel("010", "9013", "5528")),
      ui.field(
        req("이메일"),
        // 아이디와 달리 바로 물어볼 중복확인 API 가 없어 형식만 본다 — erp.js initDupCheck 가 지연 없이 바로 답한다(2026-10-20).
        stack(
          ui.textField({ value: "chaewon.yoon@whale-erp.example", maxlength: 100, type: "email", "data-dupcheck": "mail" }),
          `<p data-dup-message hidden></p>`,
        ),
      ),
    ),
    row(
      ui.field("소속부서", stack(ui.textField({ value: "플랫폼운영팀", maxlength: 30 }))),
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
          ui.select(["플랫폼 관리자 · PA000001 (역할-플랫폼 관리자)", "고객지원 담당 · PA000002 (역할-플랫폼 관리자)", "정산 담당 · PA000003 (역할-플랫폼 관리자)", "기준정보 조회 · PA000004 (역할-플랫폼 관리자)"], { "aria-label": "사용자 권한" }),
        ),
      ),
      BLANK,
    ),
  );

  // 저장하면 등록 패널을 닫고 상세 패널을 연다
  const buttons = `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", "data-close": true })}${ui.button("저장", { "data-save-panel": "platform-admin-detail-panel" })}</div>`;
  return basic + role + note("관리자 계정의 초기 비밀번호는 등록된 이메일로 발송됩니다.") + buttons;
}

export const platformAdminNewPanel = (A, R) =>
  ui.slidePanel("platform-admin-new-panel", "플랫폼 관리자 등록", ui.sectionHead("플랫폼 관리자 등록") + platformAdminNewBody(A));
