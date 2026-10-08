// BP 권한 그룹 관리. 목업 docs/mockup/config/roles.html 의 기본 상태(BP 마스터 · BA000004 인사 담당 상세)를 본 것.
// 왼쪽 목록 카드 + 오른쪽 상세 카드. 목업처럼 줄을 고르면 오른쪽에 그 그룹 상세가 서고, BP 관리자 그룹은 그 자리에서 권한명·설명을 바로 고쳐 저장한다.
// 신규 등록도 같은 오른쪽 칸에서 한다(플랫폼 권한 관리와 같다 · 2026-10-07). 메뉴등록·가맹마스터 보기·삭제는 확인창이다.
// 권한 메뉴 표(체크 매트릭스)는 1팀 컴포넌트에 없어 이 화면에서 표 + 체크박스로 그린다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { tagRows, newButton, ROLE_SCRIPT } from "../../role-side.mjs";

// [유형, 코드, 권한명, 설명, 수정일시, 수정자, 메뉴 수, 생성일시, 생성자, 관리계정ID, 연결 사용자] — 목업 표본과 같다
const GROUPS = [
  ["BP 관리자", "BA000003", "운영 총괄", "점포·직원·환경설정 전반", "2026-08-28 16:40", "hangang01", 15, "2025-02-07 14:10", "hangang01", null, ["hgops 김도윤"]],
  ["BP 관리자", "BA000004", "인사 담당", "직원관리 중심", "2026-09-15 11:20", "hangang01", 14, "2025-03-28 15:30", "hangang01", null, ["hghr 이서아"]],
  ["BP 관리자", "BA000005", "정산 조회", "조회 위주", "2025-07-15 13:50", "hangang01", 4, "2025-07-15 13:48", "hangang01", null, ["hgacct 최민호(미사용)"]],
  ["BP 관리자", "BA000006", "고객응대", "고객 문의 응대용", "2026-09-18 09:05", "hangang01", 4, "2026-09-18 09:05", "hangang01", null, []],
  ["BP 관리자", "BA000007", "점포 조회 전용", "점포 정보 조회만", "2026-06-30 17:10", "hangang01", 2, "2025-11-03 10:00", "hangang01", null, []],
  ["가맹 관리자", "FA000002", "모리 점장", "", "2026-09-02 14:15", "morinam01", 12, "2025-08-08 16:20", "morinam01", "morinam01 박서윤", ["moriyn 한지수"]],
  ["가맹 관리자", "FA000003", "모리 매니저", "", "2026-01-06 13:10", "morinam01", 8, "2026-01-05 18:00", "morinam01", "morinam01 박서윤", ["moricd 윤재희"]],
  ["가맹 관리자", "FA000004", "온기 점장", "", "2025-09-01 09:30", "ongifm", 5, "2025-08-29 11:00", "ongifm", "ongifm 오태민", ["ongids 서동현(미사용)"]],
];
const SELECTED = 1;

// 메뉴 표. [계층, 메뉴명, 코드, 조회, 등록, 수정, 삭제] — 1 켜짐, 0 꺼짐, "m" 하위 일부만 켜짐
const MENU_BA = [
  [1, "점포관리", "MN000001", 1, 0, 0, 0],
  [2, "점포 정보 관리", "MN000002", 1, 0, 0, 0],
  [1, "직원관리", "MN000004", 1, 1, 1, 0],
  [2, "직원 정보 관리", "MN000005", 1, 1, 1, 0],
  [2, "근로계약 관리", "MN000006", 1, 1, 1, 0],
  [3, "계약 목록", "MN000007", 1, 1, 1, 0],
  [3, "근로계약서 초안 작성", "MN000008", 1, 1, 1, 0],
  [2, "급여명세서 관리", "MN000009", 1, 1, 1, 0],
  [2, "근무스케줄 관리", "MN000010", 1, 1, 1, 0],
  [1, "환경설정", "MN000011", 1, "m", "m", "m"],
  [2, "BP 관리자 관리", "MN000012", 1, 0, 0, 0],
  [2, "BP 권한 그룹 관리", "MN000013", 1, 0, 0, 0],
  [2, "BP 공통코드 관리", "MN000014", 1, 0, 0, 0],
  [2, "BP 휴일 관리", "MN000015", 1, 1, 1, 1],
];
const MENU_FM = [
  [1, "점포관리", "MN000001", 0, 0, 0, 0],
  [2, "점포 정보 관리", "MN000002", 1, 0, 1, 0],
  [1, "직원관리", "MN000004", 0, 0, 0, 0],
  [2, "직원 정보 관리", "MN000005", 1, 1, 1, 0],
  [2, "근로계약 관리", "MN000006", 0, 0, 0, 0],
  [3, "계약 목록", "MN000007", 1, 1, 1, 0],
  [3, "근로계약서 초안 작성", "MN000008", 1, 1, 1, 0],
  [2, "급여명세서 관리", "MN000009", 1, 0, 0, 0],
  [2, "근무스케줄 관리", "MN000010", 1, 1, 1, 0],
  [1, "환경설정", "MN000011", 0, 0, 0, 0],
  [2, "BP 관리자 관리", "MN000012", 1, 1, 1, 0],
  [2, "BP 권한 그룹 관리", "MN000013", 1, 1, 1, 0],
  [2, "BP 공통코드 관리", "MN000014", 1, 0, 0, 0],
  [2, "BP 휴일 관리", "MN000015", 1, 1, 1, 1],
];

// 제목 없는 상세 표 — 「기본 정보」 같은 제목 줄 없이 항목만(2026-10-07)
const plainTable = (rows) =>
  ui.detailTable("", rows).replace(/<h3[^>]*><\/h3>/, "").replace('<dl class="flex w-full flex-col">', '<dl class="flex w-full flex-col rounded-t-[2px] border-t border-erp-thead-line">');
// 반쯤 켜진 체크(하위 메뉴 일부만 켜짐). 1팀 체크박스에 indeterminate 모양이 없어 같은 칸에 막대를 그린다.
const partial = (label) =>
  `<span role="checkbox" aria-checked="mixed" aria-label="${label}" tabindex="0" class="grid size-[20px] place-items-center rounded-[2px] border border-erp-brand bg-white"><span class="h-[2px] w-[10px] bg-erp-brand"></span></span>`;
const cell = (A, v, label, ro) =>
  `<span class="inline-flex justify-center">${v === "m" ? partial(label) : ui.checkbox(A, "", !!v, { "aria-label": label, disabled: ro })}</span>`;
const menuName = (lv, name, code) =>
  `<span class="flex items-center gap-[6px]" style="padding-left:${(lv - 1) * 16}px">${lv > 1 ? c.muted("└") : ""}<span class="${lv === 1 ? "font-semibold" : ""}">${name}</span>${c.muted(code)}</span>`;
const headCheck = (A, t, ro) => `<span class="inline-flex justify-center">${ui.checkbox(A, t, false, { "aria-label": `${t} 전체 선택`, disabled: ro })}</span>`;
function matrix(A, rows, ro) {
  const cols = [
    { header: "메뉴명", align: "left" },
    { header: "메뉴 계층", width: "w-[90px]" },
    ...["조회", "등록", "수정", "삭제"].map((t) => ({ header: headCheck(A, t, ro), width: "w-[90px]" })),
  ];
  const body = rows.map(([lv, name, code, ...v]) => [
    menuName(lv, name, code),
    c.muted(`${lv}단계`),
    ...v.map((on, i) => cell(A, on, `${name} ${["조회", "등록", "수정", "삭제"][i]}`, ro)),
  ]);
  return `<div class="h-[420px] overflow-y-auto">${ui.dataTable(cols, body, "이 서비스에 등록된 메뉴가 없습니다.")}</div>`;
}
// 서비스 탭. 이 BP 에 허용된 서비스만 나오고, 탭을 바꾸면 그 서비스의 메뉴 표가 선다(플랫폼 권한 관리 메뉴 등록과 같다 · 2026-10-07).
// 메뉴 영역은 높이를 고정하고 넘치면 스크롤한다. 점포 재고관리는 아직 등록된 메뉴가 없어 빈 표다.
const svcTabs = (A, rows, ro) => {
  const key = x.dialogId();
  return x.tabs([
    { id: `${key}-erp`, label: "Whale ERP", html: matrix(A, rows, ro) },
    { id: `${key}-inv`, label: "점포 재고관리", html: matrix(A, [], ro) },
  ]);
};

export default ({ A, R }) => {
  const menuId = x.dialogId();
  const fmId = x.dialogId();

  const cols = [
    { header: "권한 코드", width: "w-[110px]" },
    { header: "권한 유형", width: "w-[110px]" },
    { header: "권한명", width: "w-[140px]", align: "left" },
    { header: "설명", align: "left" },
    { header: "최종 수정일시 · 수정자", width: "w-[170px]" },
    { header: "메뉴 등록 여부", width: "w-[160px]" },
    { header: "메뉴등록", width: "w-[130px]" },
  ];
  const rows = GROUPS.map(([type, code, name, desc, at, by], i) => [
    code,
    type,
    name,
    desc || c.muted("—"),
    c.two(at, c.muted(by)),
    ui.badge("on", "등록"),
    i === SELECTED ? x.dialogTrigger("메뉴등록", menuId, "soft") : ui.button("메뉴등록", { variant: "soft" }),
  ]);
  // 줄을 누르면 오른쪽 칸이 그 그룹 상세로 바뀐다(ROLE_SCRIPT). 두 줄 칸이 46px 줄에 들어가게 줄 간격만 좁힌다.
  const table = tagRows(ui.dataTable(cols, rows), GROUPS, GROUPS[SELECTED][1]).replaceAll('<td class="truncate px-[10px]', '<td class="truncate px-[10px] leading-[1.3]');

  const left = c.card(
    "min-w-0 flex-1",
    ui.sectionHead(`권한 그룹 목록${c.sub(`${GROUPS.length}건`)}`, x.dialogTrigger("가맹마스터 보기", fmId, "soft") + newButton()) +
      table +
      `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`,
  );

  // 삭제 확인창 — BP 관리자 그룹마다. 대체 후보는 같은 BP·같은 유형의 다른 그룹이다.
  const del = {};
  const delDialogs = GROUPS.filter((g) => g[0] === "BP 관리자")
    .map(([type, code, name, , , , , , , , users]) => {
      const id = (del[code] = x.dialogId());
      const others = GROUPS.filter((g) => g[0] === type && g[1] !== code).map((g) => `${g[1]} · ${g[2]}`);
      const body = users.length
        ? c.kv([
            ["권한 그룹", `${name} ${c.muted(code)}`],
            ["권한 유형", type],
            ["연결 사용자", `${users.length}명 ${c.muted(`· ${users.join(", ")}`)}`],
          ]) +
          ui.field(
            c.req("대체 권한 그룹"),
            ui.select(["선택하세요", ...others]),
          )
        : c.kv([
            ["권한 그룹", `${name} ${c.muted(code)}`],
            ["권한 유형", type],
            ["연결 사용자", "없음"],
          ]);
      return x.dialog(
        id,
        "권한 그룹 삭제",
        `<div class="flex flex-col gap-[12px] break-keep">${body}<p><b class="font-semibold">삭제한 권한 코드 ${code} 는 다시 쓰지 않습니다</b></p></div>`,
        ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { "data-close": true }),
      );
    })
    .join("");

  // 오른쪽 칸 — 그룹 상세(고를 때마다 바뀐다) / 신규 등록. 보는 사람은 BP 마스터라 BP 관리자 그룹만 고친다.
  const view = ([type, code, name, desc, at, by, , regAt, regBy, owner], i) => {
    const editable = type === "BP 관리자";
    const rowsInfo = [
      ...(editable ? [] : [["권한명", name], ["설명", desc || c.muted("—")]]),
      ["등록일시", `${regAt} ${c.muted(`| ${regBy}`)}`],
      ["최종수정일시", `${at} ${c.muted(`| ${by}`)}`],
    ];
    const edit = editable
      ? `<div class="flex flex-col gap-[18px]">${ui.field(c.req("권한명"), ui.textField({ value: name }))}${ui.field("설명", ui.textarea({ rows: 4, value: desc }))}</div>` +
        plainTable(rowsInfo) +
        `<div class="flex gap-[6px]">${x.dialogTrigger("삭제", del[code], "soft")}<span class="flex-1"></span>${ui.button("저장")}</div>`
      : plainTable(rowsInfo);
    return (
      `<div data-role-view="${code}" class="flex flex-col gap-[18px]"${i === SELECTED ? "" : " hidden"}>` +
      ui.sectionHead(`${editable ? "권한 그룹 수정" : "권한 그룹 상세"}<span class="ml-[10px] inline-flex items-center gap-[6px] align-middle">${c.muted(code)}${c.tag(type)}</span>`) +
      // 고칠 수 있는 그룹은 입력칸 아래에 생성·최종 수정을 둔다(목업과 같은 순서)
      edit +
      `</div>`
    );
  };
  const form =
    `<div data-role-view="new" class="flex flex-col gap-[18px]" hidden>` +
    ui.sectionHead("권한 그룹 등록") +
    ui.field(c.req("권한 유형"), ui.select(["BP 관리자"])) +
    ui.field(c.req("권한명"), ui.textField({ placeholder: "예: 매장 운영 지원", "data-role-name": true })) +
    ui.field("설명", ui.textarea({ rows: 4, placeholder: "이 그룹에 맡길 업무를 적습니다" })) +
    `<div class="flex justify-end gap-[6px]">${ui.button("취소", { variant: "off", "data-role-cancel": true })}${ui.button("저장", { "data-role-save": true })}</div>` +
    `</div>`;
  const right = c.card("w-[464px] shrink-0", GROUPS.map(view).join("") + form).replace("<section ", "<section data-role-side ");

  // 권한 메뉴 등록(BA000004)
  const head = (rows) => c.kv(rows, 84);
  const menuDialog = c.wide(
    x.dialog(
      menuId,
      "권한 메뉴 등록",
      `<div class="flex flex-col gap-[12px]">${head([
        ["권한 코드", "BA000004"],
        ["권한 유형", "BP 관리자"],
        ["권한명", "인사 담당"],
      ])}${svcTabs(A, MENU_BA, false)}</div>`,
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("저장", { "data-close": true }),
    ),
    "w-[880px]",
  );

  // 가맹 마스터 고정 권한(조회용)
  const fmDialog = c.wide(
    x.dialog(
      fmId,
      `권한 메뉴 등록<span class="ml-[10px] inline-flex align-middle">${c.tag("조회용")}</span>`,
      `<div class="flex flex-col gap-[12px]">${head([
        ["권한 코드", "FM000001"],
        ["권한명", "가맹 마스터"],
      ])}${svcTabs(A, MENU_FM, true)}</div>`,
      ui.button("닫기", { "data-close": true }),
    ),
    "w-[880px]",
  );

  return {
    title: "BP 권한 그룹 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 권한 그룹 관리",
      body: `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${left}${right}</div>${menuDialog}${fmDialog}${delDialogs}${ROLE_SCRIPT}`,
    }),
  };
};
