// BP 권한 그룹 관리. 목업 docs/mockup/config/roles.html 의 기본 상태(BP 마스터 · BA000004 인사 담당 상세)를 본 것.
// 왼쪽 목록 카드 + 오른쪽 상세 카드. 목업처럼 줄을 고르면 오른쪽에 그 그룹 상세가 서고, BP 관리자 그룹은 그 자리에서 권한명·설명을 바로 고쳐 저장한다.
// 신규 등록도 같은 오른쪽 칸에서 한다(플랫폼 권한 관리와 같다 · 2026-10-07). 메뉴설정·가맹마스터 메뉴설정 보기·삭제는 확인창이다.
// 권한 메뉴 표(체크 매트릭스)는 1팀 컴포넌트에 없어 이 화면에서 표 + 체크박스로 그린다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { recordCard, roleHead, sideHead, depthRows, menuScroll, tagRows, newButton, ROLE_SCRIPT } from "../../role-side.mjs";

// [유형, 코드, 권한명, 설명, 수정일시, 수정자, 메뉴 수, 생성일시, 생성자, 가맹마스터 계정, 연결 사용자] — 목업 표본과 같다
const GROUPS = [
  ["BP 관리자", "BA000003", "운영 총괄", "점포·직원·환경설정 전반", "2026-08-28 16:40", "hangang01", 15, "2025-02-07 14:10", "hangang01", null, ["hgops 김도윤"]],
  ["BP 관리자", "BA000004", "인사 담당", "직원관리 중심", "2026-09-15 11:20", "hangang01", 14, "2025-03-28 15:30", "hangang01", null, ["hghr 이서아"]],
  ["BP 관리자", "BA000005", "정산 조회", "조회 위주", "2025-07-15 13:50", "hangang01", 4, "2025-07-15 13:48", "hangang01", null, ["hgacct 최민호(미사용)"]],
  ["BP 관리자", "BA000006", "고객응대", "고객 문의 응대용", "2026-09-18 09:05", "hangang01", 4, "2026-09-18 09:05", "hangang01", null, []],
  ["BP 관리자", "BA000007", "점포 조회 전용", "점포 정보 조회만", "2026-06-30 17:10", "hangang01", 0, "2025-11-03 10:00", "hangang01", null, []],
  ["가맹 관리자", "FA000002", "모리 점장", "", "2026-09-02 14:15", "morinam01", 12, "2025-08-08 16:20", "morinam01", "morinam01 박서윤", ["moriyn 한지수"]],
  ["가맹 관리자", "FA000003", "모리 매니저", "", "2026-01-06 13:10", "morinam01", 8, "2026-01-05 18:00", "morinam01", "morinam01 박서윤", ["moricd 윤재희"]],
  ["가맹 관리자", "FA000004", "온기 점장", "", "2025-09-01 09:30", "ongifm", 5, "2025-08-29 11:00", "ongifm", "ongifm 오태민", ["ongids 서동현(미사용)"]],
];
const SELECTED = null; // 처음 진입은 고른 그룹 없이 오른쪽에 안내를 보인다(플랫폼 메뉴·권한 관리와 같다 · 2026-10-08)
const MENU_ROW = 1; // [메뉴설정] 확인창 표본은 BA000004 인사 담당 줄

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
// top: 1단계 줄 — 켜진 칸 · 일부 켜진 칸을 「등록」 배지 모양(연한 파랑 바탕 · 파랑)으로(앱 role-menu-dialog 와 같다, 2026-10-26 사용자 지정)
const cell = (A, v, label, ro, top = false) =>
  `<span class="inline-flex justify-center${top ? " [&_input:checked]:border-erp-on [&_input:checked]:bg-erp-on-bg [&_input:checked]:bg-[url(icons/check-on.svg)] [&_input:checked]:bg-center [&_input:checked]:bg-no-repeat [&_img]:hidden [&>span]:border-erp-on [&>span]:bg-erp-on-bg [&>span>span]:bg-erp-on" : ""}">${v === "m" ? partial(label) : ui.checkbox(A, "", !!v, { "aria-label": label, disabled: ro })}</span>`;
const menuName = (lv, name, code) =>
  `<span class="flex items-center gap-[6px]" style="padding-left:${(lv - 1) * 16}px">${lv > 1 ? c.muted("└") : ""}<span class="${lv === 1 ? "font-semibold" : ""}">${name}</span></span>`;
// 머리칸 체크박스는 칸 가운데(본문 체크박스와 같은 세로줄), 글자는 그 오른쪽(앱 role-menu-dialog.tsx 와 같다, 2026-10-26 사용자 지정)
const headCheck = (A, t, ro) =>
  `<span class="grid grid-cols-[1fr_auto_1fr] items-center gap-[6px]"><span></span><span class="inline-flex">${ui.checkbox(A, "", false, { "aria-label": `${t} 전체 선택`, disabled: ro })}</span><span class="justify-self-start whitespace-nowrap">${t}</span></span>`;
function matrix(A, rows, ro) {
  const cols = [
    { header: "메뉴명", align: "left" },
    { header: "메뉴단계", width: "w-[80px]" },
    ...["조회", "등록", "수정", "삭제"].map((t) => ({ header: headCheck(A, t, ro), width: "w-[100px]" })),
  ];
  const body = rows.map(([lv, name, code, ...v]) => [
    menuName(lv, name, code),
    c.muted(`${lv}단계`),
    ...v.map((on, i) => cell(A, on, `${name} ${["조회", "등록", "수정", "삭제"][i]}`, ro, lv === 1)),
  ]);
  return menuScroll(depthRows(ui.dataTable(cols, body, "이 서비스에 등록된 메뉴가 없습니다."), rows.map(([lv]) => lv)));
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
    // 권한유형 · 코드를 한 칸에 — BP 권한 그룹 관리(앱 bp-role-groups)와 같은 모양(2026-10-26 사용자 지정)
    { header: "권한유형 · 코드", width: "w-[170px]", align: "left" },
    { header: "권한명", width: "w-[180px]", align: "left" }, // 설명 글자가 칸 한가운데서 시작하지 않게 권한명을 넓혀 고정한다(앱 bp-role-groups 와 같다, 2026-10-26 사용자 지정)
    { header: "설명", align: "left" },
    { header: "최종수정", width: "w-[220px]", align: "left" }, // 앱 bp-role-groups 와 같이 한 줄 「일시 · 사람」(2026-10-26 사용자 지정)
    { header: "메뉴설정", width: "w-[124px]" }, // 버튼 열을 상태 앞에(앱 bp-role-groups 와 같다, 2026-10-26 사용자 지정)
    { header: "메뉴설정 여부", width: "w-[120px]" },
  ];
  const rows = GROUPS.map(([type, code, name, desc, at, by, n], i) => [
    `${type} <span class="text-erp-label">· ${code}</span>`,
    `<span class="text-erp-link hover:underline">${name}</span>`, // 권한명은 링크색 — 앱 bp-role-groups 와 같다(2026-10-26)
    desc || c.muted("-"),
    `${at} ${c.muted(`· ${by}`)}`,
    i === MENU_ROW ? x.dialogTrigger("설정", menuId, "soft") : ui.button("설정", { variant: "soft" }),
    // 메뉴 권한이 하나도 없으면 미등록(상태 빨강) — BA000007 이 미등록 표본(2026-10-08)
    n ? ui.badge("on", "등록") : ui.badge("off", "미등록"),
  ]);
  // 줄을 누르면 오른쪽 칸이 그 그룹 상세로 바뀐다(ROLE_SCRIPT). 최종수정이 한 줄 「일시 · 사람」이 되어 줄 간격을 좁히던 처리는 뺐다(2026-10-26).
  const table = tagRows(ui.dataTable(cols, rows), GROUPS, GROUPS[SELECTED]?.[1]);

  const left = c.card(
    "min-w-0 flex-1",
    ui.sectionHead(`권한 그룹 목록${c.sub(`${GROUPS.length}건`)}`, x.dialogTrigger("가맹마스터 메뉴설정 보기", fmId, "soft") + newButton()) +
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
            ["권한명", `${name} ${c.muted(`· ${code}`)}`],
            ["권한 유형", type],
            ["연결 사용자", `${users.length}명 ${c.muted(`· ${users.join(", ")}`)}`],
          ]) +
          ui.field(
            c.req("대체 권한 그룹"),
            ui.select(["선택하세요", ...others]),
          )
        : c.kv([
            ["권한명", `${name} ${c.muted(`· ${code}`)}`],
            ["권한 유형", type],
            ["연결 사용자", "없음"],
          ]) + `<p class="text-erp-label">연결된 사용자가 없어 바로 삭제할 수 있습니다.<br>삭제된 권한 그룹은 복구할 수 없습니다.</p>`;
      return x.dialog(
        id,
        "권한 그룹을 삭제하시겠습니까?", // 점포 삭제 확인창과 같은 물음(앱 role-delete-dialog.tsx, 2026-10-26 사용자 지정)
        `<div class="flex flex-col gap-[12px] break-keep">${body}<p><b class="font-semibold">삭제한 권한 코드 ${code} 는 다시 쓰지 않습니다</b></p></div>`,
        ui.button("닫기", { variant: "off", "data-close": true }) + ui.button("삭제", { "data-toast": "삭제되었습니다.", "data-close-after": "1200" }), // 앱과 같다(2026-10-26)
      );
    })
    .join("");

  // 오른쪽 칸 — 그룹 상세(고를 때마다 바뀐다) / 신규 등록. 보는 사람은 BP 마스터라 BP 관리자 그룹만 고친다.
  const view = ([type, code, name, desc, at, by, , regAt, regBy, owner], i) => {
    const editable = type === "BP 관리자";
    const rowsInfo = editable ? [] : [["권한명", name], ["설명", desc || c.muted("-")]];
    // 고칠 수 없는 값 상자 — 가맹마스터 계정은 가맹 관리자 그룹을 만든 가맹 마스터(아이디 · 이름), BP 관리자 그룹은 「-」(앱과 같다)
    const record = recordCard({ manager: owner ? owner.replace(" ", " · ") : null, reg: [regAt, regBy], mod: [at, by] });
    const edit = editable
      ? `<div class="flex flex-col gap-[18px]">${ui.field(c.req("권한명"), ui.textField({ placeholder: "권한명을 입력해 주세요. (예: 프로모션 담당자)", value: name }))}${ui.field("설명", ui.textarea({ rows: 2, placeholder: "해당 권한에 대한 역할과 담당 업무를 입력해 주세요.", value: desc }))}</div>` +
        record +
        `<div class="flex justify-center gap-[6px]">${x.dialogTrigger("삭제", del[code], "soft")}${ui.button("저장")}</div>`
      : plainTable(rowsInfo) + record;
    return (
      `<div data-role-view="${code}" class="flex flex-col gap-[18px]"${i === SELECTED ? "" : " hidden"}>` +
      sideHead(`권한 그룹 상세<span class="ml-[10px] inline-flex items-center gap-[6px] align-middle">${c.tag(`<span class="font-normal">권한유형 ·</span> <b class="font-semibold">${type}</b>`)}${c.muted(code)}</span>`) +
      // 고칠 수 있는 그룹은 입력칸 아래에 생성·최종 수정을 둔다(목업과 같은 순서)
      edit +
      `</div>`
    );
  };
  const form =
    `<div data-role-view="new" class="flex flex-col gap-[18px]" hidden>` +
    // 앱 role-form.tsx 와 같다 — 제목 「권한 등록」, 권한유형은 등록자로 정해져 읽기 전용 칸(2026-10-26 데모를 앱에 맞춤)
    sideHead("권한 등록") +
    ui.field(c.req("권한유형"), ui.textField({ value: "BP 관리자", readonly: true })) +
    ui.field(c.req("권한명"), ui.textField({ placeholder: "권한명을 입력해 주세요. (예: 프로모션 담당자)", "data-role-name": true })) +
    ui.field("설명", ui.textarea({ rows: 2, placeholder: "해당 권한에 대한 역할과 담당 업무를 입력해 주세요." })) +
    `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", "data-role-cancel": true })}${ui.button("저장", { "data-role-save": true })}</div>` +
    `</div>`;
  // 처음 진입 · 고른 그룹 없음(2026-10-26 사용자 지정 문구 — 앱 bp-role-groups/role-side.tsx 와 같다. 목록이 빈 경우의 문구는 앱에만 있다: 데모는 늘 목록이 있다)
  const empty =
    `<div data-role-view="empty" class="flex flex-col gap-[18px]"${SELECTED === null ? "" : " hidden"}>${sideHead("권한 그룹 상세")}` +
    `<div class="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted"><p>왼쪽 목록에서 [권한명]을 클릭하면 상세 정보가 표시됩니다.</p></div></div>`;
  const right = c.card("w-[464px] shrink-0", empty + GROUPS.map(view).join("") + form).replace("<section ", "<section data-role-side ");

  // 권한별 메뉴설정(BA000004)
  const menuDialog = c.wide(
    x.dialog(
      menuId,
      "권한별 메뉴설정",
      `<div class="flex flex-col gap-[12px]">${roleHead("BP 관리자", "BA000004", "인사 담당")}${svcTabs(A, MENU_BA, false)}</div>`,
      ui.button("닫기", { variant: "off", "data-close": true }) + ui.button("저장"), // 저장해도 팝업을 닫지 않고 안에 알림(앱과 같다, 2026-10-26)
    ),
    "w-[880px]",
  );

  // 가맹 마스터 고정 권한(조회용)
  const fmDialog = c.wide(
    x.dialog(
      fmId,
      `권한별 메뉴설정<span class="ml-[10px] inline-flex align-middle">${c.tag("가맹 마스터 권한용")}</span>`,
      `<div class="flex flex-col gap-[12px]">${roleHead("", "FM000001", "가맹 마스터")}${svcTabs(A, MENU_FM, true)}</div>`,
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
