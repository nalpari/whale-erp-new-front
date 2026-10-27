// 플랫폼 관리자 수정. 목업 docs/mockup/system/admins-edit.html 의 기본 상태(platpark 박지우 · 일반)를 플랫폼 관리자로 본 것.
// 목업 제목 줄의 [취소][저장]은 화면 아래로 내렸다. 권한 선택은 역할 묶음(optgroup)으로 나눈다(2026-10-27).
// 상세·등록·수정은 따로 화면(주소)이 없고 목록(system/admins.html)의 슬라이드 패널로만 연다(2026-10-08). 저장하면 상세 패널로 간다(erp.js data-save-panel).
import * as ui from "../ui.mjs";
import * as c from "../config-parts.mjs";

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
// 주소: 검색칸(치는 대로 바로 아래 층에 결과 — 앱 address-field.tsx, [주소 검색] 버튼 없음) / 우편번호·기본주소(검색 결과로만 채움) + [지우기] / 상세주소(주소를 고른 뒤에만 적는다) — 2026-10-13 앱 반영
// 우편번호는 검색으로만 채워지는 숫자 5자리라 좁게 둔다 — 넓게 두면 옆 기본주소 칸이 너무 좁아진다(2026-10-20 디자인 수정, 앱 address-field.tsx 와 같다).
const address = (A, zip, base, detail) =>
  `<div class="flex flex-col gap-[8px]" data-addr-live><span class="text-[14px] font-medium text-erp-label">주소</span><div class="relative" data-addr-box>${ui.searchField(A, { placeholder: "도로명, 건물명, 지번으로 검색", label: "주소 검색어" })}</div><div class="flex gap-[6px]"><div class="w-[80px] shrink-0">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": "우편번호" })}</div>${ui.textField({ value: base, readonly: true, placeholder: "검색해서 고르면 채워집니다", "aria-label": "기본주소" })}<span data-addr-clear${zip ? "" : " hidden"}>${ui.button("지우기", { variant: "off" })}</span></div>${ui.textField(base ? { value: detail, maxlength: 100, placeholder: "상세주소", "aria-label": "상세주소" } : { value: detail, maxlength: 100, placeholder: "주소를 검색해 고른 뒤 적습니다", "aria-label": "상세주소", disabled: true })}</div>`;

function platformAdminEditBody(A) {
  // 패널(464px)이라 두 칸 줄을 한 칸씩 세로로 쌓는다
  const row = (...cells) => cells.join("");

  // 아이디는 고칠 수 없고 패널 제목 줄에 이미 보이므로(sub) 칸을 다시 두지 않는다(2026-10-20 디자인 수정).
  // 권한명 · 계정상태는 기본정보 안 이메일 다음에 둔다(앱 admin-form-panel, 2026-10-27 사용자 지정 — 전엔 따로 묶음)
  const roleFields =
    row(
      ui.field(
        req("권한명"),
        stack(
          ui.select([{ group: "역할 · 플랫폼 마스터", options: ["플랫폼 마스터 · PM000001"] }, { group: "역할 · 플랫폼 관리자", options: ["플랫폼 관리자 · PA000001", "고객지원 담당 · PA000002", "정산 담당 · PA000003", "기준정보 조회 · PA000004"] }], {
            value: "고객지원 담당 · PA000002",
            "aria-label": "권한명",
          }),
        ),
      ),
      ui.field(req("계정상태"), ui.select(["사용", "미사용"], { "aria-label": "계정상태" })),
    );
  const basic = ui.formGroup(
    "기본정보",
    ui.field(req("이름"), ui.textField({ value: "박지우", maxlength: 20, placeholder: "한글 또는 영문 2~20자" })),
    row(
      ui.field(req("연락처"), tel("010", "7781", "3302")),
      ui.field(
        req("이메일"),
        // 아이디와 달리 바로 물어볼 중복확인 API 가 없어 형식만 본다 — erp.js initDupCheck 가 지연 없이 바로 답한다(2026-10-20).
        // 원래 이메일 그대로면 아무것도 띄우지 않는다(data-dup-keep, 앱 isOriginalEmail · 2026-10-23).
        stack(
          ui.textField({ value: "jiwoo.park@whale-erp.example", maxlength: 100, type: "email", "data-dupcheck": "mail", "data-dup-keep": "" }),
          `<p data-dup-message hidden></p>`,
        ),
      ),
    ),
    roleFields,
    row(
      ui.field("소속부서", ui.textField({ value: "고객지원팀", maxlength: 30 })),
      ui.field("직책", ui.textField({ value: "매니저", maxlength: 30 })),
    ),
    address(A, "06236", "서울 강남구 테헤란로 152", "12층"),
  );

  // 저장하면 수정 패널을 닫아 아래 상세 패널을 보인다
  const buttons = `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", "data-close": true })}${ui.button("저장", { "data-save-panel": "platform-admin-detail-panel" })}</div>`;
  return basic + buttons;
}

export const platformAdminEditPanel = (A, R) =>
  ui.slidePanel(
    "platform-admin-edit-panel",
    "플랫폼 관리자 수정",
    // 아이디 칸을 없앤 대신 제목 줄에 라벨을 달아 값만으로는 안 보이던 것을 바로 알게 한다(이름은 중복이라
    // 뺀다, 2026-10-20 디자인 수정). 공통 띠지(Tag) 모양이다.
    ui.sectionHead(
      `플랫폼 관리자 수정<span class="ml-[6px] inline-flex">${c.tag('아이디 · <b class="font-semibold">platpark</b>')}</span>`,
    ) + platformAdminEditBody(A),
  );

// 「내 정보」 패널은 이번 변경(2026-10-13 플랫폼 관리자 등록 · 수정의 주소 자동완성) 대상이 아니라 원래 주소 칸 그대로 둔다
const myAddress = (A, zip, base, detail) =>
  `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">주소</span><div class="flex gap-[6px]"><div class="flex-1">${ui.searchField(A, { placeholder: "도로명, 건물명, 지번으로 검색", label: "주소 검색어" })}</div>${ui.button("주소 검색", { variant: "soft" })}</div><div class="flex gap-[6px]"><div class="w-[120px] shrink-0">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": "우편번호" })}</div>${ui.textField({ value: base, readonly: true, placeholder: "검색해서 고르면 채워집니다", "aria-label": "기본주소" })}</div>${ui.textField({ value: detail, maxlength: 100, placeholder: "상세주소", "aria-label": "상세주소" })}</div>`;

// 플랫폼 헤더 MY PAGE 「내정보 관리」 — 로그인한 플랫폼 사용자 본인의 정보를 슬라이드에서 고친다(2026-10-08).
// 플랫폼 관리자 수정과 같은 입력칸이고, 본인 권한·계정 상태는 스스로 바꿀 수 없어 사용자 권한은 읽기 전용으로만 보인다.
const ME = {
  admin: { id: "platjiyoung", name: "김지영", tel: ["010", "5520", "3141"], mail: "jiyoung.kim@whale-erp.example", dept: "플랫폼운영팀", title: "매니저", role: "플랫폼 관리자 · PA000001" },
  master: { id: "platkim", name: "김서연", tel: ["010", "3321", "0981"], mail: "seoyeon.kim@whale-erp.example", dept: "플랫폼운영팀", title: "파트장", role: "플랫폼 마스터 · PM000001" },
};
export const platformMyPanel = (A, { master = false } = {}) => {
  const me = master ? ME.master : ME.admin;
  const basic = ui.formGroup(
    "기본정보",
    ui.field(req("아이디"), ui.textField({ value: me.id, readonly: true })),
    ui.field(req("이름"), ui.textField({ value: me.name, maxlength: 20, placeholder: "한글 또는 영문 2~20자" })),
    ui.field(req("연락처"), tel(...me.tel)),
    ui.field(req("이메일"), ui.textField({ value: me.mail, maxlength: 100 })),
    ui.field("소속부서", ui.textField({ value: me.dept, maxlength: 30 })),
    ui.field("직책", ui.textField({ value: me.title, maxlength: 30 })),
    myAddress(A, "13529", "경기 성남시 분당구 판교역로 166", "7층"),
  );
  const role = ui.formGroup("사용자 권한", ui.field("사용자 권한", ui.textField({ value: me.role, readonly: true })));
  const buttons = `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", "data-close": true })}${ui.button("저장", { "data-close": true })}</div>`;
  return ui.slidePanel("platform-mypage-panel", "내 정보", ui.sectionHead(`내 정보${sub(`${me.name} · ${me.id}`)}`) + basic + role + buttons);
};
