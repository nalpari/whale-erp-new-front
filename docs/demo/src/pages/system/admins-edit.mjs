// 플랫폼 관리자 수정. 목업 docs/mockup/system/admins-edit.html 의 기본 상태(platpark 박지우 · 일반)를 플랫폼 관리자로 본 것.
// 목업 제목 줄의 [취소][저장]은 화면 아래로 내렸다. 권한 선택의 묶음(optgroup)은 Select 가 받지 않아 한 줄 목록으로 폈다.
import * as ui from "../../ui.mjs";
import { platformHeader, link } from "../../site.mjs";

// 1팀 컴포넌트에 없는 것들: 필수 표시, 입력칸 아래 도움말, 안내 문구, 묶음 제목 옆 보조 글. (admins-new 와 같은 모양)
const req = (label) => `${label} <span class="text-[#e93737]">*</span>`; // #e93737: DESIGN.md 위험 글자색
const help = (t) => `<span class="text-[13px] text-erp-label">${t}</span>`;
const sub = (t) => `<span class="ml-[6px] text-[13px] font-normal text-erp-label">${t}</span>`;
const tel = (a, b, c) =>
  `<div class="flex gap-[6px]">${[
    [a, "앞자리"],
    [b, "가운데자리"],
    [c, "끝자리"],
  ]
    .map(([v, l]) => ui.textField({ value: v, inputmode: "numeric", "aria-label": l }))
    .join("")}</div>`;
// 도움말 유무로 칸 높이가 달라도 라벨이 위에서 맞도록 위 정렬한 FormRow
const row = (...c) => ui.formRow(...c).replace('class="flex w-full gap-[6px]"', 'class="flex w-full items-start gap-[6px]"');
const stack = (...c) => `<div class="flex flex-col gap-[8px]">${c.join("")}</div>`;
const address = (A, zip, base, detail) =>
  `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">주소</span><div class="flex gap-[6px]"><div class="flex-1">${ui.searchField(A, { placeholder: "도로명, 건물명, 지번으로 검색", label: "주소 검색어" })}</div>${ui.button("주소 검색", { variant: "soft" })}</div><div class="flex gap-[6px]"><div class="w-[120px] shrink-0">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": "우편번호" })}</div>${ui.textField({ value: base, readonly: true, placeholder: "검색해서 고르면 채워집니다", "aria-label": "기본주소" })}</div>${ui.textField({ value: detail, maxlength: 100, placeholder: "상세주소", "aria-label": "상세주소" })}${help("검색 결과에서 고른 우편번호·기본주소만 들어갑니다. 상세주소는 직접 적습니다.")}</div>`;

export default ({ A, R }) => {
  const detail = link(R, "system/admins-detail.html");

  const basic = ui.formGroup(
    `기본정보${sub("* 표시가 필수 · 소속 부서·직책·주소는 선택")}`,
    row(
      ui.field(req("아이디"), stack(ui.textField({ value: "platpark", readonly: true }), help("아이디는 바꿀 수 없습니다"))),
      ui.field(req("이름"), ui.textField({ value: "박지우", maxlength: 20, placeholder: "한글 또는 영문 2~20자" })),
    ),
    row(
      ui.field(req("연락처"), tel("010", "7781", "3302")),
      ui.field(req("이메일"), stack(ui.textField({ value: "jiwoo.park@whale-erp.example", maxlength: 100 }), help("이메일 형식 · 100자 이하"))),
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
          help("바꾸면 이 계정의 다음 요청부터 새 권한으로 판정합니다."),
        ),
      ),
      ui.field(req("계정 상태"), ui.select(["사용", "미사용"], { "aria-label": "계정 상태" })),
    ),
    `<p class="text-[13px] text-erp-label">${ui.link("권한 구성은 플랫폼 권한 관리에서", link(R, "system/roles.html"))}</p>`,
  );

  const buttons = `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", href: detail })}${ui.button("저장", { href: detail })}</div>`;

  return {
    title: "플랫폼 관리자 수정",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "플랫폼 관리자 수정",
      titleRight: `<span class="text-[14px] text-erp-label">박지우 · platpark</span>`,
      body: ui.detailBody(basic + role + buttons),
    }),
  };
};
