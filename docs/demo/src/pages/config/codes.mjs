// BP 공통코드 관리. 목업 docs/mockup/config/codes.html 의 기본 상태(BP 마스터 · EMP_TYPE 고용 형태 선택)를 본 것.
// 목업 위쪽 검색 조건은 왼쪽 필터로, 그 오른쪽에 그룹 목록 카드와 상세 코드 카드를 나란히 둔다(system 공통코드와 같은 배치).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader } from "../../site.mjs";

// [그룹 코드, 그룹명, 관리 주체, 고를 수 있는지]
const GROUPS = [
  ["SERVICE", "서비스", "플랫폼고정"],
  ["ROLE_TYPE", "권한 유형", "플랫폼고정", true],
  ["ACCOUNT_STATUS", "계정 상태", "플랫폼고정"],
  ["JOIN_PATH", "가입경로", "플랫폼고정"],
  ["WITHDRAW_REASON", "탈퇴 사유", "플랫폼고정"],
  ["MAIL_TYPE", "메일 유형", "플랫폼고정"],
  ["TERMS_TYPE", "약관 유형", "플랫폼고정"],
  ["FLOOR_TYPE", "층수 구분", "플랫폼고정"],
  ["STORE_STATUS", "점포 상태", "플랫폼고정"],
  ["STORE_TYPE", "점포 유형", "플랫폼고정"],
  ["MANAGE_OWNER", "관리 주체", "플랫폼고정"],
  ["EMP_TYPE", "고용 형태", "플랫폼제공"],
  ["LEAVE_TYPE", "휴가 유형", "플랫폼제공", true],
];
const SELECTED = 11;
const CODES = [
  ["FULL", "정직원", "플랫폼제공"],
  ["CONTRACT", "계약직", "플랫폼제공"],
  ["PART", "아르바이트", "플랫폼제공"],
  ["INTERN", "수습", "BP전용"],
];

// 끌어서 순서 바꾸는 손잡이. 아이콘이 없어 글자 기호로 둔다(system 공통코드와 같다).
const handle = '<span title="끌어서 순서 바꾸기" aria-label="끌어서 순서 바꾸기" class="cursor-grab text-[16px] text-erp-label">≡</span>';

export default ({ A, R }) => {
  const filter = ui.filterPanel(A, [
    ui.filterSection("그룹 코드", ui.searchField(A, { placeholder: "예: EMP_TYPE", label: "그룹 코드" }) + c.help("일부만 입력해도 찾습니다 · 대소문자 구분 없음"), { tight: true }),
    ui.filterSection("그룹명", ui.searchField(A, { placeholder: "예: 고용 형태", label: "그룹명" }) + c.help("일부만 입력해도 찾습니다"), { tight: true, last: true }),
  ]);

  const groupCols = [
    { header: "그룹 코드", width: "w-[170px]", align: "left" },
    { header: "그룹명", align: "left" },
    { header: "관리 주체", width: "w-[110px]" },
    { header: "사용 상태", width: "w-[90px]" },
  ];
  const groupRows = GROUPS.map(([code, name, owner, pick], i) => [
    i === SELECTED ? `<b class="font-semibold" aria-current="true">${code}</b>` : pick ? ui.link(code, "#") : code,
    name,
    c.tag(owner),
    ui.badge("on", "사용"),
  ]);
  const left = c.card(
    "w-[560px] shrink-0",
    ui.sectionHead(`공통코드 그룹${c.sub(`${GROUPS.length}개 · 조회 전용`)}`) +
      c.markRow(ui.dataTable(groupCols, groupRows, "조건에 맞는 공통코드 그룹이 없습니다."), SELECTED) +
      `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
  );

  const codeCols = [
    { header: "이동", width: "w-[60px]" },
    { header: "상세 코드", width: "w-[150px]", align: "left" },
    { header: "코드명", align: "left" },
    { header: "표시 순서", width: "w-[90px]" },
    { header: "사용 상태", width: "w-[110px]" },
    { header: "관리 주체", width: "w-[110px]" },
  ];
  const codeRows = CODES.map(([code, name, owner], i) => [handle, code, ui.textField({ value: name, "aria-label": "코드명" }), i + 1, x.toggle("사용", true), c.tag(owner)]);
  const right = c.card(
    "min-w-0 flex-1",
    c.band("플랫폼제공 그룹 — 새로 추가하는 상세 코드는 BP전용으로 관리됩니다") +
      ui.sectionHead(
        `상세 코드${c.sub("EMP_TYPE · 고용 형태")}<span class="ml-[10px] inline-flex align-middle">${c.tag("플랫폼제공")}</span>`,
        ui.button("상세 코드 추가", { variant: "soft" }) + ui.button("저장"),
      ) +
      ui.dataTable(codeCols, codeRows) +
      c.note(
        "저장한 상세 코드는 한강상회의 관련 업무 화면 선택 항목에 반영되고, 등록·수정 이력은 보존되지만 이 화면에는 보이지 않습니다. 공통코드는 적용 서비스로 나누지 않아 검색 조건에도 적용 서비스가 없습니다.",
      ),
  );

  return {
    title: "BP 공통코드 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 공통코드 관리",
      body: `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${filter}${left}${right}</div>`,
    }),
  };
};
