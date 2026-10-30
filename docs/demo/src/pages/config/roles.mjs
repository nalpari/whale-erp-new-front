// BP 권한 그룹 관리. 앱 src/app/bp-role-groups(roles-screen · role-side) + components/role-groups 대로 그린다(2026-10-30 재영 「front대로」).
// 왼쪽 목록 카드 + 오른쪽 고정 칸. 권한명 링크를 누르면 오른쪽에 그 그룹 상세가 서고(줄 클릭은 없다), BP 관리자 그룹은 그 자리에서 권한명 · 설명을 고쳐 저장한다.
// 신규 등록도 같은 오른쪽 칸에서 한다. 메뉴설정 · 가맹마스터 메뉴설정 보기 · 삭제는 확인창이다.
// 보는 사람은 BP 마스터(정하윤 · hangang01)다. 연결된 권한이 BM000001 이라 목록에 「본인」 꼬리표가 붙는 줄은 없고, 가맹 관리자에게만 숨기는
// [가맹마스터 메뉴설정 보기]는 늘 보인다(데모에 역할 전환이 없다).
// render 의 platform 은 플랫폼 계정으로 본 견본(조회만), groups 는 목록 견본, open 은 화면을 열 때 차례로 누를 버튼 id 다(roles-*.mjs 가 쓴다).
// 권한 메뉴 표(체크 매트릭스)는 1팀 컴포넌트에 없어 이 화면에서 표 + 체크박스로 그린다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader } from "../../site.mjs";
import { partialBox, roleHead, sideHead, depthRows, menuScroll, revokeDialog, MENU_SAVE_SCRIPT, newButton, createdToast, band, floatingHelpTip } from "../../role-side.mjs";

// 권한유형 한글 — 공통코드 ROLE_TYPE 라벨(붙여 쓴다, 앱 CodeLabel)
const TYPE = { BA: "BP관리자", FA: "가맹관리자", FM: "가맹마스터" };
// 등록자 · 수정자는 이름으로 보인다(앱 role-parts.tsx actorOf). 목업 NAME 과 같다
const NAME = { hangang01: "정하윤", morinam01: "박서윤", ongifm: "오태민" };
// [유형, 코드, 권한명, 설명, 수정일시, 수정자, 메뉴 수, 등록일시, 등록자, 가맹마스터 계정, 연결 사용자, 새로 등록] — 목업 표본과 같다.
// 수정일시가 등록일시와 같으면 고친 적 없는 그룹이다(최종수정 「-」, 앱 wasUpdated). BA000008 은 [등록] → [저장] 하면 나타나는 줄이다(「새로 등록」 꼬리표)
export const GROUPS = [
  ["BA", "BA000003", "운영 총괄", "점포·직원·환경설정 전반", "2026-08-28 16:40", "hangang01", 15, "2025-02-07 14:10", "hangang01", null, ["hgops 김도윤"]],
  ["BA", "BA000004", "인사 담당", "직원관리 중심", "2026-09-15 11:20", "hangang01", 14, "2025-03-28 15:30", "hangang01", null, ["hghr 이서아"]],
  ["BA", "BA000005", "정산 조회", "조회 위주", "2025-07-15 13:50", "hangang01", 4, "2025-07-15 13:48", "hangang01", null, ["hgacct 최민호(미사용)"]],
  ["BA", "BA000006", "고객응대", "고객 문의 응대용", "2026-09-18 09:05", "hangang01", 4, "2026-09-18 09:05", "hangang01", null, []],
  ["BA", "BA000007", "점포 조회 전용", "점포 정보 조회만", "2026-06-30 17:10", "hangang01", 0, "2025-11-03 10:00", "hangang01", null, []],
  ["FA", "FA000002", "모리 점장", "", "2026-09-02 14:15", "morinam01", 12, "2025-08-08 16:20", "morinam01", "morinam01", ["moriyn 한지수"]],
  ["FA", "FA000003", "모리 매니저", "", "2026-01-06 13:10", "morinam01", 8, "2026-01-05 18:00", "morinam01", "morinam01", ["moricd 윤재희"]],
  ["FA", "FA000004", "온기 점장", "", "2025-09-01 09:30", "ongifm", 5, "2025-08-29 11:00", "ongifm", "ongifm", ["ongids 서동현(미사용)"]],
  ["BA", "BA000008", "", "", "2026-10-30 10:42", "hangang01", 0, "2026-10-30 10:42", "hangang01", null, [], true],
];
const MENU_CODE = "BA000004"; // [메뉴설정] 확인창 표본은 BA000004 인사 담당 줄

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
// 앱은 내 권한 밖 칸의 체크박스를 숨기지만(이미 켜진 칸만 흐린 체크) BP 마스터에게는 범위 밖 메뉴가 없어 그리지 않는다
const cell = (A, v, label, ro, top = false) =>
  `<span class="inline-flex justify-center${top ? " [&_input:checked]:border-erp-on [&_input:checked]:bg-erp-on-bg [&_input:checked]:bg-[url(icons/check-on.svg)] [&_input:checked]:bg-center [&_input:checked]:bg-no-repeat [&_img]:hidden [&>span]:border-erp-on [&>span]:bg-erp-on-bg [&>span>span]:bg-erp-on" : ""}">${v === "m" ? partial(label) : ui.checkbox(A, "", !!v, { "aria-label": label, disabled: ro })}</span>`;
// 들여쓰기 (단계-1)×18px, 「└ 」는 라벨 회색 글자로 붙여 쓴다(앱 role-menu-dialog.tsx 와 같다, 2026-10-26)
const menuName = (lv, name) =>
  `<span style="padding-left:${(lv - 1) * 18}px">${lv > 1 ? '<span class="text-erp-label">└ </span>' : ""}${lv === 1 ? `<b class="font-semibold">${name}</b>` : name}</span>`;
// 머리칸 체크박스는 칸 가운데(본문 체크박스와 같은 세로줄), 글자는 그 오른쪽(앱 role-menu-dialog.tsx 와 같다, 2026-10-26 사용자 지정)
// 일부만 켜졌으면 1단계 줄과 같은 하늘색 「–」, 모두 켜졌으면 켜짐(앱 role-menu-dialog 머리칸과 같다, 2026-10-27 사용자 지정)
const headCheck = (A, t, ro, state) =>
  `<span class="grid grid-cols-[1fr_auto_1fr] items-center gap-[6px]"><span></span><span class="inline-flex">${state === "mixed" ? partialBox(`${t} 전체 선택`) : ui.checkbox(A, "", state === "on", { "aria-label": `${t} 전체 선택`, disabled: ro })}</span><span class="justify-self-start whitespace-nowrap">${t}</span></span>`;
function matrix(A, rows, ro) {
  const cols = [
    { header: "메뉴명", align: "left" },
    { header: "메뉴단계", width: "w-[80px]" },
    ...["조회", "등록", "수정", "삭제"].map((t, i) => {
      // 잎 메뉴(다음 줄이 더 깊지 않은 줄)의 값으로 셈한다
      const leaves = rows.filter((r, k) => !(rows[k + 1] && rows[k + 1][0] > r[0]));
      const on = leaves.filter((r) => r[3 + i] === 1).length;
      const state = leaves.length && on === leaves.length ? "on" : on > 0 ? "mixed" : "off";
      return { header: headCheck(A, t, ro, state), width: "w-[100px]" };
    }),
  ];
  const body = rows.map(([lv, name, , ...v]) => [
    menuName(lv, name),
    `<span class="text-erp-label">${lv}단계</span>`, // 단계 칸은 라벨 회색(앱 role-menu-dialog.tsx 와 같다, 2026-10-26)
    ...v.map((on, i) => cell(A, on, `${name} ${["조회", "등록", "수정", "삭제"][i]}`, ro, lv === 1)),
  ]);
  return menuScroll(depthRows(ui.dataTable(cols, body, "이 서비스에 등록된 메뉴가 없습니다."), rows.map(([lv]) => lv)));
}
// 서비스 탭. 이 BP 에 허용된 서비스만 나온다 — 지금은 웨일ERP 하나다(부가서비스 구독이 생기면 그 서비스도 탭으로 나온다, 앱 ServiceTabs).
const svcTabs = (A, rows, ro) => x.tabs([{ id: `${x.dialogId()}-erp`, label: "웨일ERP", html: matrix(A, rows, ro) }]);

// BP 권한 그룹 [메뉴설정] [저장] — 앱 role-menu-dialog 처럼 바뀐 칸이 없어도 늘 누를 수 있다(2026-10-30 재영). 공용 스크립트는 플랫폼 권한 관리도 써서
// 이 화면 것만 「바뀐 칸이 없으면 막기」 두 줄을 뺀다
const BP_MENU_SAVE_SCRIPT = MENU_SAVE_SCRIPT.replace("if (b) b.disabled = true;", "").replace("if (b) b.disabled = !dirty(d);", "");
// 회수 확인창 — 영향받는 사용자는 표본 그룹(BA000004)의 연결 사용자 수. BP 관리자 그룹은 아래 그룹이 없어 하위 권한 그룹 줄은 숨는다(공용 스크립트)
const BP_REVOKE = revokeDialog().replace("<b class=\"font-semibold\">2명</b>", "<b class=\"font-semibold\">1명</b>");

const who = ([at, by]) => `<span class="truncate">${at} <span class="text-erp-label">· ${NAME[by]}</span></span>`;
const nameError = '<p data-role-name-error role="alert" hidden class="text-[13px] leading-[1.5] text-erp-off">권한명을 입력해 주세요.</p>';
const nameField = (value) =>
  `<div class="flex flex-col gap-[8px]">${ui.field(c.req("권한명"), ui.textField({ placeholder: "권한명을 입력해 주세요. (예: 프로모션 담당자)", value, "data-role-name": true }))}${nameError}</div>`;
const descField = (value) => ui.field("설명", ui.textarea({ rows: 2, placeholder: "해당 권한에 대한 역할과 담당 업무를 입력해 주세요.", value, "data-role-desc": true }));

export const render = ({ A, R }, { title = "BP 권한 그룹 관리", platform = false, groups = GROUPS, open = [] } = {}) => {
  const menuId = x.dialogId();
  const fmId = x.dialogId();
  const listed = groups.filter((g) => !g[11]);
  const canCreate = !platform; // 등록 유형(creatableRoleTypeCode)은 BP 마스터 BA, 플랫폼 계정은 null(앱 roles-screen.tsx)

  const cols = [
    // 권한유형 · 코드를 한 칸에 — 가운데 정렬(앱 roles-screen.tsx, 2026-10-27)
    { header: "권한유형 · 코드", width: "w-[260px]" },
    { header: "권한명", width: "w-[260px]", align: "left" },
    { header: "설명", align: "left" },
    { header: "최종수정", width: "w-[260px]", align: "left" }, // 한 줄 「일시 · 사람」, 고친 적 없으면 「-」(2026-10-27)
    { header: "메뉴설정", width: "w-[124px]" },
    { header: "메뉴설정 여부", width: "w-[120px]" },
  ];
  const rows = groups.map(([type, code, name, desc, at, by, n, regAt, , , , fresh]) => [
    `${TYPE[type]} <span class="text-[12px] text-erp-label">· ${code}</span>`,
    // 권한명 링크로만 상세를 연다(앱 roles-screen.tsx). 「새로 등록」은 이 화면에서 방금 등록한 그룹(「본인」은 내 계정에 연결된 그룹 — 이 견본엔 없다)
    `<span class="flex min-w-0 items-center gap-[6px]"><button type="button" id="role-pick-${code}" data-role-pick="${code}" class="min-w-0 truncate text-erp-link hover:underline">${name}</button>${fresh ? c.tag("새로 등록") : ""}</span>`,
    desc || c.muted("-"),
    at === regAt ? c.muted("-") : who([at, by]),
    code === MENU_CODE ? x.dialogTrigger("설정", menuId, "soft") : ui.button("설정", { variant: "soft" }),
    // 메뉴 권한이 하나도 없으면 미등록, 등록이면 메뉴 수를 함께(앱 roles-screen.tsx)
    n ? ui.badge("on", `등록 ${n.toLocaleString("ko-KR")}개`) : ui.badge("off", "미등록"),
  ]);
  let k = -1;
  const table = ui.dataTable(cols, rows).replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, () => {
    const g = groups[++k];
    return `<tr class="h-[46px] border-b border-erp-thead-line" data-role-row="${g[1]}"${g[11] ? " data-role-fresh hidden" : ""}>`;
  });

  // [등록]은 제목 줄, 카드 머리에는 [가맹마스터 메뉴설정 보기]만(앱 roles-screen.tsx)
  const left = c.card(
    "min-w-0 flex-1",
    sideHead(`권한 그룹 목록 <span class="ml-[6px] text-[14px] font-normal text-erp-label"><span data-role-count>${listed.length}</span>건</span>`, x.dialogTrigger("가맹마스터 메뉴설정 보기", fmId, "soft")) +
      table +
      ui.pagination(A, 1, 1),
  );

  // 삭제 확인창 — BP 관리자 그룹마다(앱 role-delete-dialog.tsx). 대체 후보는 같은 유형의 다른 그룹이다.
  // 연결 사용자가 없으면 두 줄 안내, 있으면 표 + 대체 권한(골라야 [삭제]가 켜진다 — data-needs-choice · erp.js) + 복구 불가 안내,
  // 후보가 없으면 빨간 상자 두 줄에 [삭제]가 막힌다. 지우면 확인창 안에 「삭제되었습니다.」를 보이고 닫는다(data-close-after).
  const del = {};
  const delDialogs = platform
    ? ""
    : groups
        .filter((g) => g[0] === "BA")
        .map(([type, code, name, , , , , , , , users]) => {
          const id = (del[code] = x.dialogId());
          const others = groups.filter((g) => g[0] === type && g[1] !== code && !g[11]).map((g) => `${g[1]} · ${g[2]}`);
          const nameRow = ["권한명", `${name} <span class="text-erp-label">· ${code}</span>`];
          const blocked = users.length > 0 && others.length === 0;
          const body = !users.length
            ? c.kv([nameRow, ["연결 사용자", "없음"]], 84) + `<div class="text-erp-label"><p>연결된 사용자가 없어 바로 삭제할 수 있습니다.</p><p>삭제된 권한 그룹은 복구할 수 없습니다.</p></div>`
            : c.kv([nameRow, ["연결 사용자", `${users.length}명`]], 84) +
              c.linkedUsersTable(users) +
              (blocked
                ? c.warnBand(`대체 권한 그룹이 없어 삭제할 수 없습니다.\nBP관리자 권한 그룹을 추가한 후 다시 시도해 주세요.`)
                : ui.field(c.req("대체 권한"), ui.select(["선택하세요", ...others])) +
                  '<p class="text-erp-label">삭제된 권한 그룹은 복구할 수 없습니다.</p>' +
                  band("변경된 권한은 다시 로그인하지 않아도, 사용자가 화면을 새로고침하거나 이동하면 적용됩니다."));
          return x.dialog(
            id,
            "권한 그룹을 삭제하시겠습니까?",
            `<div class="flex flex-col gap-[12px] break-keep">${body}</div>`,
            ui.button("닫기", { variant: "off", "data-close": true }) +
              ui.button("삭제", blocked ? { disabled: true } : { "data-toast": "삭제되었습니다.", "data-close-after": "1200", ...(users.length ? { disabled: true, "data-needs-choice": true } : {}) }),
            "w-[480px]",
          );
        })
        .join("");

  // 오른쪽 칸 — 그룹 상세(고를 때마다 바뀐다) / 신규 등록. BP 마스터는 BP 관리자 그룹만 고친다(가맹 관리자 그룹은 가맹 마스터 몫).
  // 그 밖의 NO_PERMISSION 「선택한 권한 그룹에 대한 수정 권한이 없습니다.」는 BP 마스터에게 생기지 않아 견본이 없다.
  const view = ([type, code, name, desc, at, by, , regAt, regBy, owner]) => {
    const editable = !platform && type === "BA";
    // 가맹마스터 계정 · 등록 · 최종수정도 상세 표의 줄로(앱 role-side.tsx, 2026-10-28). 도움말 i 는 값 칸 맨 앞, BP 관리자 그룹은 값 없이 i 만
    const recordRows = [
      [
        "가맹마스터 계정",
        `<span class="flex min-w-0 items-center gap-[6px]">${floatingHelpTip("가맹관리자 권한을 생성한 가맹마스터의 정보가 표시됩니다.", "가맹마스터 계정")}${owner ? `<span class="truncate">${owner}<span class="text-erp-label"> · ${NAME[owner]}</span></span>` : ""}</span>`,
      ],
      ["등록", who([regAt, regBy])],
      ["최종수정", at === regAt ? c.muted("-") : who([at, by])],
    ];
    // 고칠 수 있으면 입력칸 아래 기록 표, [삭제](Soft) · [저장] 가운데. [저장]은 고친 것이 없어도 늘 누를 수 있다(앱 role-form.tsx, 2026-10-30 재영)
    const body = editable
      ? `<div class="flex flex-col gap-[18px]">${nameField(name)}${descField(desc)}</div>` +
        plainTable(recordRows) +
        `<div class="flex justify-center gap-[6px]">${ui.button("삭제", { variant: "soft", "data-dialog": del[code], id: `role-delete-${code}` })}${ui.button("저장", { "data-role-edit-save": true, "data-toast": "" })}</div>`
      : // 고칠 수 없으면 이유 상자 + 권한명 · 설명 · 기록을 표 하나에(앱 role-side.tsx). 플랫폼 계정은 회색 안내 한 줄(2026-10-30 재영)
        (platform ? band("플랫폼 계정은 BP 권한 그룹을 조회만 합니다.") : c.warnBand("내 계정은 가맹관리자 권한 그룹을 수정할 수 없습니다.")) +
        plainTable([["권한명", name], ["설명", desc || c.muted("-")], ...recordRows]);
    return (
      `<div data-role-view="${code}" class="flex flex-col gap-[18px]" hidden>` +
      sideHead(`권한 그룹 상세<span class="ml-[10px] inline-flex items-center gap-[10px] align-middle">${c.tag(`<span class="font-normal">권한유형 ·</span> <b class="font-semibold">${TYPE[type]}</b>`)}<span aria-hidden="true" class="h-[11px] w-px bg-[#d9d9d9]"></span><span class="text-[14px] font-normal"><span class="text-erp-label">권한코드</span> <b class="font-semibold">${code}</b></span></span>`) +
      body +
      `</div>`
    );
  };
  // 앱 role-form.tsx 와 같다 — 제목 「권한 등록」, 권한유형은 등록자로 정해져 읽기 전용 칸
  const form = canCreate
    ? `<div data-role-view="new" class="flex flex-col gap-[18px]" hidden>` +
      sideHead("권한 등록") +
      ui.field(c.req("권한유형"), ui.textField({ value: TYPE.BA, readonly: true })) +
      nameField("") +
      descField("") +
      `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", "data-role-cancel": true })}${ui.button("저장", { "data-role-save": true, "data-toast": "" })}</div>` +
      `</div>`
    : "";
  // 처음 진입 · 고른 그룹 없음. 목록이 아예 비었으면 다른 문구, [등록] 안내는 그 버튼이 보일 때만(앱 role-side.tsx)
  const emptyText = listed.length
    ? "<p>왼쪽 목록에서 [권한명]을 클릭하면 상세 정보가 표시됩니다.</p>"
    : `<p>상세 정보를 표시할 권한 그룹이 없습니다.</p>${canCreate ? "<p>새로운 권한 그룹을 추가하려면 [등록] 버튼을 클릭해 주세요.</p>" : ""}`;
  const empty =
    `<div data-role-view="empty" class="flex flex-col gap-[18px]">${sideHead("권한 그룹 상세")}` +
    `<div class="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted">${emptyText}</div></div>`;
  const right = c.card("w-[464px] shrink-0", empty + groups.map(view).join("") + form).replace("<section ", "<section data-role-side ");

  // 권한별 메뉴설정(BA000004). 플랫폼 계정은 칸이 막히고 [닫기]만(잠긴 팝업의 안내 띠는 두지 않는다 — 앱 roles-screen.tsx note={null})
  const menuDialog = c.wide(
    x.dialog(
      menuId,
      "권한별 메뉴설정",
      `<div class="flex flex-col gap-[12px]">${roleHead(TYPE.BA, "BA000004", "인사 담당")}${svcTabs(A, MENU_BA, platform)}</div>`,
      platform ? ui.button("닫기", { "data-close": true }) : ui.button("닫기", { variant: "off", "data-close": true }) + ui.button("저장", { "data-menu-save": true, "data-role-name": "인사 담당", "data-toast": "" }),
    ),
    "w-[880px] max-h-[calc(100dvh-48px)] overflow-y-auto",
  );

  // 가맹 마스터 고정 권한(조회용) — 제목은 [메뉴설정] 팝업과 같고 띠지로 가른다
  const fmDialog = c.wide(
    x.dialog(
      fmId,
      `권한별 메뉴설정<span class="ml-[10px] inline-flex align-middle">${c.tag("가맹 마스터 권한용")}</span>`,
      `<div class="flex flex-col gap-[12px]">${roleHead(TYPE.FM, "FM000001", TYPE.FM)}${svcTabs(A, MENU_FM, true)}</div>`,
      ui.button("닫기", { "data-close": true }),
    ),
    "w-[880px] max-h-[calc(100dvh-48px)] overflow-y-auto",
  );

  return {
    title,
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 권한 그룹 관리",
      titleRight: canCreate ? newButton() : "",
      body:
        `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${left}${right}</div>${menuDialog}${fmDialog}` +
        (platform ? "" : BP_REVOKE + BP_MENU_SAVE_SCRIPT + delDialogs) +
        `<script>window.ROLE_CREATED=${JSON.stringify(createdToast("BA000008"))}</script>${BP_ROLE_SCRIPT}` +
        (open.length ? `<script>addEventListener("load",()=>${JSON.stringify(open)}.forEach((id)=>document.getElementById(id)?.click()));</script>` : ""),
    }),
  };
};

export default (ctx) => render(ctx);

// 오른쪽 칸 바꾸기(이 화면 전용). 권한명 링크를 누르면 그 그룹 상세, [등록]을 누르면 등록 양식(목록의 고른 줄 표시가 풀린다).
// 권한명이 비면 칸 아래 「권한명을 입력해 주세요.」(앱 validateRoleForm). 등록하면 숨겨 둔 BA000008 줄이 「새로 등록」 꼬리표와 함께 나타나고 그 상세가 선다.
const BP_ROLE_SCRIPT = `<script>
(() => {
  const SEL = "bg-erp-thead-bg";
  const side = document.querySelector("[data-role-side]");
  const rows = [...document.querySelectorAll("[data-role-row]")];
  const newBtn = document.querySelector("[data-role-new]");
  let cur = null;
  const show = (v) => side.querySelectorAll("[data-role-view]").forEach((el) => (el.hidden = el.dataset.roleView !== v));
  const select = (code) => {
    cur = code;
    if (newBtn) newBtn.disabled = false;
    rows.forEach((r) => {
      const on = r.dataset.roleRow === cur;
      r.classList.toggle(SEL, on);
      const pick = r.querySelector("[data-role-pick]");
      if (on) pick.setAttribute("aria-current", "true");
      else pick.removeAttribute("aria-current");
    });
    show(cur || "empty");
  };
  const nameOk = (view) => {
    const input = view.querySelector("[data-role-name]");
    const bad = !input.value.trim();
    view.querySelector("[data-role-name-error]").hidden = !bad;
    input.toggleAttribute("aria-invalid", bad);
    if (bad) input.focus();
    return !bad;
  };
  document.addEventListener("input", (e) => {
    if (!e.target.matches?.("[data-role-name]")) return;
    e.target.removeAttribute("aria-invalid");
    e.target.closest("[data-role-view]").querySelector("[data-role-name-error]").hidden = true;
  });
  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-role-pick]");
    if (pick) return select(pick.dataset.rolePick);
    const edit = e.target.closest("[data-role-edit-save]");
    if (edit) {
      const view = edit.closest("[data-role-view]");
      if (!nameOk(view)) return;
      const name = view.querySelector("[data-role-name]").value.trim();
      document.querySelector('[data-role-pick="' + view.dataset.roleView + '"]').textContent = name;
      window.erpToast?.("수정되었습니다.");
    }
  });
  newBtn?.addEventListener("click", () => {
    const form = side.querySelector('[data-role-view="new"]');
    form.querySelectorAll("[data-role-name], [data-role-desc]").forEach((i) => (i.value = ""));
    form.querySelector("[data-role-name-error]").hidden = true;
    rows.forEach((r) => r.classList.remove(SEL));
    newBtn.disabled = true;
    show("new");
    side.scrollTop = 0;
    form.querySelector("[data-role-name]").focus();
  });
  side.querySelector("[data-role-cancel]")?.addEventListener("click", () => select(cur));
  side.querySelector("[data-role-save]")?.addEventListener("click", () => {
    const form = side.querySelector('[data-role-view="new"]');
    if (!nameOk(form)) return;
    const fresh = document.querySelector("[data-role-fresh]");
    const code = fresh.dataset.roleRow;
    const name = form.querySelector("[data-role-name]").value.trim();
    const desc = form.querySelector("[data-role-desc]").value.trim();
    if (fresh.hidden) {
      fresh.hidden = false;
      const count = document.querySelector("[data-role-count]");
      count.textContent = Number(count.textContent) + 1;
    }
    fresh.querySelector("[data-role-pick]").textContent = name;
    const descCell = fresh.children[2];
    descCell.innerHTML = desc ? "" : '<span class="text-erp-muted">-</span>';
    if (desc) descCell.textContent = desc;
    const view = side.querySelector('[data-role-view="' + code + '"]');
    view.querySelector("[data-role-name]").value = view.querySelector("[data-role-name]").defaultValue = name;
    view.querySelector("[data-role-desc]").value = view.querySelector("[data-role-desc]").defaultValue = desc;
    window.erpToast?.(window.ROLE_CREATED);
    select(code);
  });
})();
</script>`;
