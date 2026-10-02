// 플랫폼 관리자 등록 · 플랫폼 마스터 기준. admins-new.mjs 를 목업 role "pm" 으로 본 것 — 사용자 권한 목록에 플랫폼 마스터가 들어간다.
// 목업 제목 줄의 [취소][등록]은 화면 아래로 내렸다.
import * as ui from "../../ui.mjs";
import { platformHeader, link } from "../../site.mjs";

// 1팀 컴포넌트에 없는 것들: 필수 표시, 입력칸 아래 도움말, 안내 문구, 묶음 제목 옆 보조 글.
const req = (label) => `${label} <span class="text-[#e93737]">*</span>`; // #e93737: DESIGN.md 위험 글자색
const help = (t) => `<span class="text-[13px] text-erp-label">${t}</span>`;
const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
const sub = (t) => `<span class="ml-[6px] text-[13px] font-normal text-erp-label">${t}</span>`;
// 휴대전화번호 세 칸
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
// 주소: 검색칸 + [주소 검색] / 우편번호·기본주소(검색 결과로만 채움) / 상세주소
const address = (A, zip, base, detail) =>
  `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">주소</span><div class="flex gap-[6px]"><div class="flex-1">${ui.searchField(A, { placeholder: "도로명, 건물명, 지번으로 검색", label: "주소 검색어" })}</div>${ui.button("주소 검색", { variant: "soft" })}</div><div class="flex gap-[6px]"><div class="w-[120px] shrink-0">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": "우편번호" })}</div>${ui.textField({ value: base, readonly: true, placeholder: "검색해서 고르면 채워집니다", "aria-label": "기본주소" })}</div>${ui.textField({ value: detail, maxlength: 100, placeholder: "상세주소", "aria-label": "상세주소" })}${help("검색 결과에서 고른 우편번호·기본주소만 들어갑니다. 상세주소는 직접 적습니다.")}</div>`;

export default ({ A, R }) => {
  const basic = ui.formGroup(
    `기본정보${sub("* 표시가 필수 · 소속 부서·직책·주소는 선택")}`,
    row(
      ui.field(req("아이디"), stack(ui.textField({ value: "platyoon", maxlength: 20 }), help("영문 또는 영문·숫자 4~20자 · 등록한 뒤에는 바꿀 수 없습니다"))),
      ui.field(req("이름"), stack(ui.textField({ value: "윤채원", maxlength: 20 }), help("한글 또는 영문 2~20자"))),
    ),
    row(
      ui.field(req("연락처"), stack(tel("010", "9013", "5528"), help("세 칸을 합쳐 숫자 10~11자리"))),
      ui.field(req("이메일"), stack(ui.textField({ value: "chaewon.yoon@whale-erp.example", maxlength: 100 }), help("100자 이하 · 초기 비밀번호가 이 주소로 갑니다"))),
    ),
    row(
      ui.field("소속 부서", stack(ui.textField({ value: "플랫폼운영팀", maxlength: 30 }), help("1~30자 · 비워 두어도 됩니다"))),
      ui.field("직책", stack(ui.textField({ value: "사원", maxlength: 30 }), help("1~30자 · 비워 두어도 됩니다"))),
    ),
    address(A, "13529", "경기 성남시 분당구 판교역로 166", "7층"),
  );

  const role = ui.formGroup(
    "사용자 권한",
    row(
      ui.field(
        req("사용자 권한"),
        stack(
          ui.select(["플랫폼 마스터 · PM000001", "플랫폼 관리자 · PA000001", "고객지원 담당 · PA000002", "정산 담당 · PA000003", "기준정보 조회 · PA000004"], { "aria-label": "사용자 권한", value: "플랫폼 관리자 · PA000001" }),
          help("플랫폼 마스터는 여러 명 둘 수 있습니다."),
        ),
      ),
      `<div class="min-w-px flex-1"></div>`,
    ),
    `<p class="text-[13px] text-erp-label">BP 마스터·가맹 마스터 같은 BP 쪽 권한은 플랫폼 관리자 계정에 연결할 수 없습니다. ${ui.link("권한 구성은 플랫폼 권한 관리에서", link(R, "system/roles-master.html"))}</p>`,
  );

  const buttons = `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", href: link(R, "system/admins.html") })}${ui.button("등록", { href: link(R, "system/admins-detail.html") })}</div>`;

  return {
    title: "플랫폼 관리자 등록",
    html: ui.erpFrame({
      header: platformHeader(A, R, { master: true }),
      title: "플랫폼 관리자 등록",
      body: ui.detailBody(basic + role + note("초기 비밀번호를 등록 이메일로 발송합니다.") + buttons),
    }),
  };
};
