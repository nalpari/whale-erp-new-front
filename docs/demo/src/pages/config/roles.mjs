// BP 권한 그룹 관리. 목업 docs/mockup/config/roles.html 의 기본 상태(BP 마스터 · BA000004 인사 담당 상세)를 본 것.
// 왼쪽 목록 카드 + 오른쪽 상세 카드. 목업에서 오른쪽 자리에 서던 수정·신규 등록은 1팀 슬라이드 패널로, 메뉴등록·가맹마스터 보기·삭제는 확인창으로 옮겼다.
// 권한 메뉴 표(체크 매트릭스)는 1팀 컴포넌트에 없어 이 화면에서 표 + 체크박스로 그린다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

// [유형, 코드, 권한명, 설명, 수정일시, 수정자, 메뉴 수]
const GROUPS = [
  ["BP 관리자", "BA000003", "운영 총괄", "점포·직원·환경설정 전반", "2026-08-28 16:40", "hangang01", 15],
  ["BP 관리자", "BA000004", "인사 담당", "직원관리 중심", "2026-09-15 11:20", "hangang01", 14],
  ["BP 관리자", "BA000005", "정산 조회", "조회 위주", "2025-07-15 13:50", "hangang01", 4],
  ["BP 관리자", "BA000006", "고객응대", "고객 문의 응대용", "2026-09-18 09:05", "hangang01", 4],
  ["BP 관리자", "BA000007", "점포 조회 전용", "점포 정보 조회만", "2026-06-30 17:10", "hangang01", 2],
  ["가맹 관리자", "FA000002", "모리 점장", "", "2026-09-02 14:15", "morinam01", 12],
  ["가맹 관리자", "FA000003", "모리 매니저", "", "2026-01-06 13:10", "morinam01", 8],
  ["가맹 관리자", "FA000004", "온기 점장", "", "2025-09-01 09:30", "ongifm", 5],
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
    { header: "메뉴 계층", width: "w-[90px]" },
    { header: "메뉴명", align: "left" },
    ...["조회", "등록", "수정", "삭제"].map((t) => ({ header: headCheck(A, t, ro), width: "w-[90px]" })),
  ];
  const body = rows.map(([lv, name, code, ...v]) => [
    c.muted(`${lv}단계`),
    menuName(lv, name, code),
    ...v.map((on, i) => cell(A, on, `${name} ${["조회", "등록", "수정", "삭제"][i]}`, ro)),
  ]);
  return `<div class="max-h-[420px] overflow-y-auto">${ui.dataTable(cols, body)}</div>`;
}

export default ({ A, R }) => {
  const menuId = x.dialogId();
  const fmId = x.dialogId();
  const delId = x.dialogId();
  const g = GROUPS[SELECTED];

  const cols = [
    { header: "권한 유형 · 코드", width: "w-[140px]", align: "left" },
    { header: "권한명", width: "w-[140px]", align: "left" },
    { header: "설명", align: "left" },
    { header: "최종 수정일시 · 수정자", width: "w-[170px]" },
    { header: "메뉴 등록 여부", width: "w-[160px]" },
    { header: "메뉴등록", width: "w-[130px]" },
  ];
  const rows = GROUPS.map(([type, code, name, desc, at, by, n], i) => [
    c.two(type, i === SELECTED ? `<b class="font-semibold" aria-current="true">${code}</b>` : ui.link(code, "#")),
    name,
    desc || c.muted("—"),
    c.two(at, c.muted(by)),
    `<span class="inline-flex items-center gap-[6px]">${ui.badge("on", "등록")}${c.muted(`메뉴 ${n}개`)}</span>`,
    i === SELECTED ? x.dialogTrigger("메뉴등록", menuId, "soft") : ui.button("메뉴등록", { variant: "soft" }),
  ]);
  // 두 줄 칸이 46px 줄에 들어가게 표 줄 높이는 그대로 두고 줄 간격만 좁힌다
  const table = c.markRow(ui.dataTable(cols, rows), SELECTED).replaceAll('<td class="truncate px-[10px]', '<td class="truncate px-[10px] leading-[1.3]');

  const left = c.card(
    "min-w-0 flex-1",
    ui.sectionHead(`권한 그룹 목록${c.sub(`${GROUPS.length}건`)}`, x.dialogTrigger("가맹마스터 보기", fmId, "soft") + ui.slideTrigger("신규 등록", "rg-new")) +
      table +
      `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>` +
      c.note(
        "권한 그룹과 메뉴 권한의 변경은 연결된 관리자에게 다시 로그인하지 않아도 다음 요청부터 적용되고, 왼쪽 메뉴 구성은 다음 화면 이동 때 바뀝니다. 권한 그룹 정보와 메뉴별 권한의 변경 전후 값은 운영 감사용 이력으로 남고 이 화면에서는 보여 주지 않습니다.",
      ),
  );

  const right = c.card(
    "w-[464px] shrink-0",
    ui.sectionHead(`권한 그룹 상세<span class="ml-[10px] inline-flex align-middle">${c.tag(g[0])}</span>`) +
      ui.detailTable(g[2], [
        ["권한 유형", g[0]],
        ["권한 코드", g[1]],
        ["권한명", g[2]],
        ["설명", g[3]],
        ["관리계정ID", c.muted("두지 않음 · BP 범위로만 구분")],
        ["생성", `2025-03-28 15:30 ${c.muted("· hangang01")}`],
        ["최종 수정", `2026-09-15 11:20 ${c.muted("· hangang01")}`],
      ]) +
      c.buttons(x.dialogTrigger("삭제", delId, "soft"), ui.slideTrigger("수정", "rg-edit")),
  );

  // 슬라이드 패널: 수정 · 신규 등록
  const v = (...f) => `<div class="flex flex-col gap-[18px]">${f.join("")}</div>`;
  const editPanel = ui.slidePanel(
    "rg-edit",
    "권한 그룹 수정",
    ui.sectionHead(`권한 그룹 수정<span class="ml-[10px] inline-flex align-middle">${c.tag("BP 관리자")}</span>`) +
      v(
        ui.field("권한 유형", ui.textField({ value: "BP 관리자", readonly: true })),
        ui.field("권한 코드", c.stack(ui.textField({ value: "BA000004", readonly: true }), c.help("권한 유형과 권한 코드는 등록한 뒤 바꿀 수 없습니다."))),
        ui.field(c.req("권한명"), ui.textField({ value: "인사 담당" })),
        ui.field("설명", ui.textarea({ rows: 4, value: "직원관리 중심" })),
      ) +
      ui.panelButtons(),
  );
  const newPanel = ui.slidePanel(
    "rg-new",
    "권한 그룹 신규 등록",
    ui.sectionHead("권한 그룹 신규 등록") +
      v(
        ui.field(c.req("권한 유형"), c.stack(ui.select(["BP 관리자"]), c.help("BP 마스터는 BP 관리자 권한 그룹만 만듭니다. 가맹 관리자 유형은 가맹 마스터만 등록할 수 있어 선택 항목에서 뺐습니다."))),
        ui.field("권한 코드 · 자동 채번", c.stack(ui.textField({ value: "BA000008", readonly: true }), c.help("저장하는 순간 순번이 확정되며, 누가 동시에 등록해도 번호가 겹치지 않습니다."))),
        ui.field(c.req("권한명"), ui.textField({ value: "매장 운영 지원" })),
        ui.field("설명", c.stack(ui.textarea({ rows: 4, value: "점포 정보 조회 · 근무스케줄" }), c.help("등록하면 바로 쓸 수 있습니다. 권한 그룹에는 사용 상태를 두지 않습니다."))),
      ) +
      ui.panelButtons("취소", "등록"),
  );

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
        ["서비스", `Whale ERP ${c.muted("WHALE_ERP · 허용 서비스가 하나라 고르지 않습니다")}`],
        ["상한", "BM000001 BP 마스터 고정 권한"],
        ["설정자 권한", `BM000001 ${c.muted("· 상한과 같음")}`],
      ])}${c.note("이 그룹은 BM000001 BP 마스터 고정 권한이 허용한 칸 안에서만 고릅니다. 설정자 본인 권한도 넘을 수 없습니다. 사용중지 메뉴는 목록에 나오지 않습니다.")}${matrix(A, MENU_BA, false)}${c.note(
        "등록·수정·삭제 칸을 켜면 같은 줄의 조회가 따라 켜지고, 조회를 끄면 그 줄의 나머지 칸도 모두 꺼집니다. 묶음 메뉴의 칸은 켜면 하위 메뉴 전체에 적용됩니다. 머리칸의 체크로 그 열에서 고를 수 있는 칸을 한꺼번에 켜고 끕니다 — 상한 밖·본인 범위 밖 칸은 바뀌지 않습니다. 사용중지 메뉴는 목록에 나오지 않고, 기존 설정은 보존돼 다시 사용하면 그대로 보입니다.",
      )}</div>`,
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
        ["권한 유형", "가맹 마스터 · 플랫폼 고정 권한"],
        ["권한명", "가맹 마스터"],
        ["서비스", `Whale ERP ${c.muted("WHALE_ERP · 허용 서비스가 하나라 고르지 않습니다")}`],
      ])}${c.band("가맹 마스터 고정 권한 FM000001 — 조회용입니다")}${matrix(A, MENU_FM, true)}</div>`,
      ui.button("닫기", { "data-close": true }),
    ),
    "w-[880px]",
  );

  const delDialog = x.dialog(
    delId,
    "권한 그룹 삭제",
    `<div class="flex flex-col gap-[12px] break-keep">${c.kv([
      ["권한 그룹", `인사 담당 ${c.muted("BA000004")}`],
      ["권한 유형", "BP 관리자"],
      ["연결 사용자", `1명 ${c.muted("· hghr 이서아")}`],
    ])}${ui.field(
      c.req("대체 권한 그룹"),
      c.stack(
        ui.select(["선택하세요", "BA000003 · 운영 총괄", "BA000005 · 정산 조회", "BA000006 · 고객응대", "BA000007 · 점포 조회 전용"]),
        c.help("변경 대상 사용자 <b class=\"font-semibold\">1명</b>의 권한 그룹을 고른 그룹으로 한꺼번에 바꾼 뒤 이 그룹을 지웁니다. 같은 BP·같은 권한 유형의 사용 중인 그룹만 나옵니다."),
      ),
    )}<p><b class="font-semibold">삭제한 권한 코드 BA000004 는 다시 쓰지 않습니다</b></p></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { "data-close": true }),
  );

  return {
    title: "BP 권한 그룹 관리",
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 권한 그룹 관리",
      body: `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${left}${right}</div>${menuDialog}${fmDialog}${delDialog}`,
      panels: editPanel + newPanel,
    }),
  };
};
