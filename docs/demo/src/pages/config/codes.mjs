// BP 공통코드 관리. 목업 docs/mockup/config/codes.html 의 기본 상태(BP 마스터 · EMP_TYPE 고용 형태 선택)를 본 것.
// 목업 위쪽 검색 조건은 왼쪽 필터로, 그 오른쪽에 그룹 목록 카드와 상세 코드 카드를 나란히 둔다(system 공통코드와 같은 배치).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader } from "../../site.mjs";
import { floatingHelpTip } from "../../role-side.mjs";

// [그룹 코드, 그룹명, 관리 주체, 고를 수 있는지] — 플랫폼제공 그룹만 보인다. 플랫폼고정은 BP 가 고칠 것이 없어 뺐다(앱 bp-codes.ts, 2026-10-27 사용자 지정)
const GROUPS = [
  ["EMP_TYPE", "고용 형태", "플랫폼제공"],
  ["LEAVE_TYPE", "휴가 유형", "플랫폼제공", true],
  ["POSITION", "직급", "플랫폼제공", true],
  ["BANK", "은행", "플랫폼제공", true],
];
const SELECTED = 0;
// 관리주체 열 이름 옆 도움말(앱 bp-code-item-panel OWNER_HELP, 2026-10-27 사용자 지정)
const OWNER_HELP =
  '<span class="block whitespace-nowrap">· <b class="font-semibold">플랫폼제공</b> 웨일ERP 기본 코드입니다.</span><span class="block whitespace-nowrap pl-[10px]">(수정·삭제 가능)</span><span class="block whitespace-nowrap">· <b class="font-semibold">BP전용</b> 우리 회사만 사용하는 코드입니다.</span>';
const CODES = [
  ["FULL", "정직원", "플랫폼제공"],
  ["CONTRACT", "계약직", "플랫폼제공"],
  ["PART", "아르바이트", "플랫폼제공"],
  ["INTERN", "수습", "BP전용"],
];

// 두 카드의 머리 줄 높이를 버튼 높이(34px)로 맞춰, 왼쪽 그룹 표와 오른쪽 상세 코드 표가 같은 높이에서 시작하게 한다.
const head = (title, right) => ui.sectionHead(title, right).replace('class="flex items-end gap-[6px]"', 'class="flex h-[34px] items-end gap-[6px]"');
// 끌어서 순서 바꾸는 손잡이. 아이콘이 없어 글자 기호로 둔다(system 공통코드와 같다).
const handle = '<span title="끌어서 순서 바꾸기" aria-label="끌어서 순서 바꾸기" class="cursor-grab text-[16px] text-erp-label">≡</span>';

export default ({ A, R }) => {
  const filter = ui.filterPanel(A, [
    ui.filterSection("그룹 코드", ui.searchField(A, { placeholder: "예: EMP_TYPE", label: "그룹 코드" }), { tight: true }),
    // 관리주체 칸은 플랫폼 공통코드 관리에만 둔다(앱 code-group-filter.tsx showOwner, 2026-10-27)
    ui.filterSection("그룹명", ui.searchField(A, { placeholder: "예: 고용 형태", label: "그룹명" }), { tight: true, last: true }),
  ]);

  const groupCols = [
    { header: "그룹 코드", width: "w-[170px]", align: "left" },
    { header: "그룹명", align: "left" },
    { header: "관리주체", width: "w-[110px]" },
  ];
  const groupRows = GROUPS.map(([code, name, owner, pick], i) => [
    i === SELECTED ? `<b class="font-semibold" aria-current="true">${code}</b>` : pick ? ui.link(code, "#") : code,
    name,
    c.ownerTag(owner),
  ]);
  const left = c.card(
    "w-[560px] shrink-0",
    head(`공통코드 그룹${c.sub(`${GROUPS.length}개`)}`) +
      // 열 이름 줄까지 고정, 아래만 스크롤(2026-10-26). 쪽 넘김 없이 전부 보인다(앱과 같다, 2026-10-27 사용자 지정)
      ui.scrollTable(c.markCurrent(ui.dataTable(groupCols, groupRows, "조건에 맞는 공통코드 그룹이 없습니다."), SELECTED)),
  );

  const codeCols = [
    { header: "이동", width: "w-[60px]" },
    { header: "상세 코드", align: "left" }, // 남는 폭 — 300px 고정은 좁은 화면에서 코드명이 찌그러졌다(앱과 같다, 2026-10-27)
    { header: "코드명", width: "w-[160px]", align: "left" },
    { header: "표시 순서", width: "w-[90px]" },
    { header: "사용여부", width: "w-[110px]" },
    { header: `<span class="inline-flex items-center gap-[4px]">관리주체${floatingHelpTip(OWNER_HELP, "관리주체")}</span>`, width: "w-[110px]" },
  ];
  const codeRows = CODES.map(([code, name, owner], i) => [handle, code, ui.textField({ value: name, "aria-label": "코드명" }), i + 1, x.toggle("사용", true), c.ownerTag(owner)]);
  // 저장 전 새 행 — 상세 코드 칸에 입력 규칙을 안내 문구로 보인다(앱 CODE_PLACEHOLDER, 2026-10-27 사용자 지정)
  codeRows.push([
    '<button type="button" aria-label="새 행 빼기" class="text-[14px] text-erp-label">×</button>',
    ui.textField({ placeholder: "영문 대문자로 시작, 영문·숫자·언더바(_) (최대20자)", maxlength: 20, "aria-label": "새 행 상세 코드" }),
    ui.textField({ placeholder: "코드명", "aria-label": "새 행 코드명" }),
    CODES.length + 1,
    x.toggle("사용", true),
    c.ownerTag("BP전용"),
  ]);
  const right = c.card(
    "min-w-0 flex-1",
      head(
        `상세 코드${c.sub(`<span class="inline-flex items-baseline gap-[10px] align-baseline"><span class="inline-flex items-baseline gap-[6px]"><span class="text-erp-label">그룹코드</span><b class="font-semibold text-erp-ink">EMP_TYPE</b></span><span aria-hidden="true" class="h-[11px] w-px shrink-0 self-center bg-[#d9d9d9]"></span><span class="inline-flex items-baseline gap-[6px]"><span class="text-erp-label">그룹명</span><b class="font-semibold text-erp-ink">고용 형태</b></span><span aria-hidden="true" class="h-[11px] w-px shrink-0 self-center bg-[#d9d9d9]"></span>${c.ownerTag("플랫폼제공")}</span>`)}`, // 앱 code-panel GroupHead 와 같다(2026-10-27)
        ui.button("추가", { variant: "soft" }) + ui.button("저장"),
      ) +
      ui.scrollTable(ui.dataTable(codeCols, codeRows)),
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
