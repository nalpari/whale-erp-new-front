// 플랫폼 권한 관리. 목업 docs/mockup/system/roles.html 의 기본 선택(PA000002)을 플랫폼 관리자(PA000001 연결, 권한 관리 조회·등록·수정)로 본 것.
// 왼쪽 권한 목록 + 오른쪽 권한 상세. 목업처럼 줄을 누르면 오른쪽에 그 권한 상세가, 신규 등록을 누르면 같은 칸에 등록 양식이 선다(role-side.mjs).
// 행의 [메뉴설정]은 권한별 확인창으로 옮겼다.
// 플랫폼 관리자에게는 삭제 권한이 없어 삭제 버튼·삭제 확인창이 없다(목업 admin 권한과 같다).
import * as ui from "../../ui.mjs";
import { req } from "../../biz-form.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { platformHeader, link } from "../../site.mjs";
import { roleSide, roleHead, sideHead, depthRows, menuScroll, partialBox, menuSaveButton, revokeDialog, MENU_SAVE_SCRIPT, tagRows, newButton, scrollTabs, SVC_TABS_SCRIPT } from "../../role-side.mjs";

// 1팀 컴포넌트에 없는 것들. 토큰으로만 그린다.
const sub = (t) => `<span class="text-erp-label">${t}</span>`;
// 2단 카드 본문의 카드 껍데기
const CARD = "flex min-h-0 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]";

// 메뉴 트리 표본(플랫폼 메뉴 관리와 같다). [코드, 단계, 메뉴명, 사용, 묶음]
const TREE = {
  PLATFORM: [
    ["MN000201", 1, "회원관리", 0, 1], ["MN000202", 2, "회원 정보 관리", 0, 0],
    ["MN000203", 1, "BP 마스터 계정 관리", 1, 0],
    ["MN000204", 1, "서비스정산관리", 0, 1], ["MN000205", 2, "부가서비스 주문 내역", 0, 0], ["MN000206", 2, "부가서비스 정산", 0, 0],
    ["MN000207", 1, "부가서비스관리", 0, 1], ["MN000208", 2, "부가 서비스 정보 관리", 0, 0],
    ["MN000209", 1, "프로모션관리", 0, 1], ["MN000210", 2, "쿠폰 관리", 0, 0], ["MN000211", 2, "포인트 관리", 0, 0],
    ["MN000212", 1, "시스템관리", 1, 1],
    ["MN000213", 2, "플랫폼 관리자 관리", 1, 0], ["MN000214", 2, "플랫폼 권한 관리", 1, 0], ["MN000215", 2, "플랫폼 메뉴 관리", 1, 0],
    ["MN000216", 2, "플랫폼 공통코드 관리", 1, 0], ["MN000217", 2, "플랫폼 휴일 관리", 1, 0],
    ["MN000218", 1, "커뮤니티관리", 1, 1],
    ["MN000219", 2, "공지사항", 1, 0], ["MN000220", 2, "FAQ", 1, 0], ["MN000221", 2, "문의사항", 1, 0], ["MN000222", 2, "도입문의", 1, 0],
  ],
  ERP: [
    ["MN000001", 1, "점포관리", 1, 1], ["MN000002", 2, "점포 정보 관리", 1, 0], ["MN000003", 2, "계약서 템플릿 관리", 0, 0],
    ["MN000004", 1, "직원관리", 1, 1], ["MN000005", 2, "직원 정보 관리", 1, 0],
    ["MN000006", 2, "근로계약 관리", 1, 1], ["MN000007", 3, "계약 목록", 1, 0], ["MN000008", 3, "근로계약서 초안 작성", 1, 0],
    ["MN000009", 2, "급여명세서 관리", 1, 0], ["MN000010", 2, "근무스케줄 관리", 1, 0],
    ["MN000011", 1, "환경설정", 1, 1], ["MN000012", 2, "BP 관리자 관리", 1, 0], ["MN000013", 2, "BP 권한 그룹 관리", 1, 0], ["MN000014", 2, "BP 공통코드 관리", 1, 0], ["MN000015", 2, "BP 휴일 관리", 1, 0],
  ],
};
const ALL = "RCUD";
const full = (svc, usedOnly) => Object.fromEntries(TREE[svc].filter((m) => !usedOnly || m[3]).map((m) => [m[0], m[4] ? "R" : ALL]));
const GRANT = {
  PM000001: { PLATFORM: full("PLATFORM"), ERP: full("ERP") },
  PA000001: { PLATFORM: { MN000203: "RCU", MN000204: "R", MN000205: "R", MN000206: "R", MN000212: "R", MN000213: "RCU", MN000214: "RCU", MN000215: "R", MN000216: "R", MN000217: "R", MN000218: "R", MN000219: ALL, MN000220: ALL, MN000221: ALL, MN000222: ALL }, ERP: {} },
  PA000002: { PLATFORM: { MN000203: "R", MN000218: "R", MN000219: "RCU", MN000220: "RCU", MN000221: "RCU", MN000222: "RCU" }, ERP: {} },
  PA000003: { PLATFORM: { MN000203: "R", MN000204: "R", MN000205: "R", MN000206: "R" }, ERP: {} },
  // PA000004 는 메뉴 미등록 표본 — 메뉴 권한을 아직 정하지 않았다(2026-10-08)
  PA000004: { PLATFORM: {}, ERP: {} },
  BM000001: { PLATFORM: {}, ERP: full("ERP", true) },
  FM000001: { PLATFORM: {}, ERP: { MN000001: "R", MN000002: "RU", MN000004: "R", MN000005: "RCU", MN000006: "R", MN000007: "RCU", MN000008: "RCU", MN000009: "R", MN000010: "RCU", MN000011: "R", MN000012: "RCU", MN000013: "RCU", MN000014: "R", MN000015: "RCUD" } },
};
// [권한유형, 코드, 권한명, 구분, 설명, 최종수정일시, 수정자, 등록일시, 등록자, 소속 고정 권한(추가 권한만), 기본 서비스, 아래 권한 그룹]
const ROLES = [
  ["플랫폼 마스터", "PM000001", "플랫폼 마스터", "고정", "시스템 최상위 권한, 모든 메뉴의 접근·관리 권한이 자동 부여됨", "2025-01-06 09:00", "시스템", "2025-01-06 09:00", "시스템", null, "PLATFORM"],
  ["플랫폼 관리자", "PA000001", "플랫폼 관리자", "고정", "플랫폼 관리자 기본 권한 · 추가 권한의 상한", "2026-08-12 14:20", "platjung", "2025-01-06 09:00", "시스템", null, "PLATFORM"],
  ["BP 마스터", "BM000001", "BP 마스터", "고정", "BP 관리자 권한 그룹의 상한", "2026-09-01 11:05", "platkim", "2025-01-06 09:00", "시스템", null, "ERP", "BP 관리자 권한 그룹"],
  ["가맹 마스터", "FM000001", "가맹 마스터", "고정", "가맹 관리자 권한 그룹의 상한", "2026-07-15 16:30", "platjung", "2025-01-06 09:00", "시스템", null, "ERP", "가맹 관리자 권한 그룹"],
  ["플랫폼 관리자", "PA000002", "고객지원 담당", "추가", "커뮤니티관리·BP 조회", "2026-09-10 10:42", "platjung", "2025-06-02 10:05", "platjung", "PA000001", "PLATFORM"],
  ["플랫폼 관리자", "PA000003", "정산 담당", "추가", "서비스정산관리·BP 조회", "2025-11-17 13:30", "platkim", "2025-11-17 13:30", "platkim", "PA000001", "PLATFORM"],
  ["플랫폼 관리자", "PA000004", "기준정보 조회", "추가", "시스템관리 조회만", "2026-03-04 15:10", "platjung", "2026-03-04 15:10", "platjung", "PA000001", "PLATFORM"],
];
const OWN = "PA000001"; // 보는 사람(플랫폼 관리자)에게 연결된 권한
const SELECTED = null; // 처음 진입은 고른 권한 없이 빈 안내를 보인다

const has = (map, code, op) => !!map?.[code]?.includes(op);
const TIP = { self: "본인 권한 범위 밖", bp: "BP 마스터·가맹 마스터 권한에는 플랫폼 관리 메뉴를 줄 수 없습니다" };
// [메뉴설정] 팝업의 서비스 탭. POS 는 아직 메뉴가 없어 빈 표다
// 공통코드 SERVICE 순서 그대로(2026-10-15). 탭이 팝업 폭을 넘으면 한 줄을 지키고 가로로 스크롤해 고른다(scrollTabs).
// 메뉴가 아직 없는 서비스는 빈 표다
const SVC_TABS = [
  ["ERP", "Whale ERP"], ["PLATFORM", "Whale ERP 플랫폼 관리"], ["POS", "POS"], ["KIOSK", "KIOSK"], ["TABLE_ORDER", "Table Order"], ["PICK_UP_ORDER", "Pick Up Order"],
  ["QR_ORDER", "QR Order"], ["RECIPE_MANAGEMENT", "레시피관리"], ["ORDER_MANAGEMENT", "발주관리"], ["STORE_INVENTORY", "점포재고관리"], ["WAITING_MANAGEMENT", "대기순번관리"], ["RESERVATION", "예약관리"],
];

// [메뉴설정] 확인창 하나(권한 하나). 목업 스크립트가 그리던 표를 빌드 때 그린다.
function menuDialog(A, R, role, id) {
  const [type, code, name, , , , , , , base, svc] = role; // base: 추가 권한인지 가리는 데만 쓴다(상한은 설정자 본인 권한뿐 · 확정 2026-10-06)
  const isBp = code.startsWith("BM") || code.startsWith("FM");
  // 서비스 하나의 메뉴 표. block 은 그 서비스 기준으로 막힌 칸을 가린다
  const svcTable = (svc) => {
    const block = (m, op) => {
      if (code === "PM000001") return "fixed";
      if (code === OWN) return "own";
      if (isBp && svc === "PLATFORM") return "bp";
      if (!isBp && !has(GRANT[OWN][svc], m[0], op)) return "self";
      return null;
    };
    // 사용중지 메뉴와 그 아래는 뺀다
    let stopAt = 0;
    const vis = (TREE[svc] || []).filter((m) => {
      if (stopAt && m[1] > stopAt) return false;
      stopAt = 0;
      if (!m[3]) return !(stopAt = m[1]);
      return true;
    });
    const kidsOf = (i) => {
      const out = [];
      for (let j = i + 1; j < vis.length && vis[j][1] > vis[i][1]; j++) if (!vis[j][4]) out.push(vis[j]);
      return out;
    };
    const map = GRANT[code][svc] || {};
    // top: 1단계 줄 — 켜진 칸을 「등록」 배지 모양(연한 파랑 바탕 · 파랑 테두리 · 파랑 체크)으로(앱 role-menu-dialog 와 같다, 2026-10-26 사용자 지정)
    const cell = (on, b, op, top = false) => {
      const box = ui.checkbox(A, "", on, { "aria-label": op, disabled: !!b });
      return `<span class="inline-flex${b ? " opacity-40" : ""}${top ? " [&_input:checked]:border-erp-on [&_input:checked]:bg-erp-on-bg [&_input:checked]:bg-[url(icons/check-on.svg)] [&_input:checked]:bg-center [&_input:checked]:bg-no-repeat [&_img]:hidden" : ""}">${box}</span>`;
    };
    const OPS = [["R", "조회"], ["C", "등록"], ["U", "수정"], ["D", "삭제"]];
    const rows = vis.map((m, i) => {
      const reasons = new Set();
      const cells = OPS.map(([op, label]) => {
        if (m[4]) {
          const kids = kidsOf(i);
          const open = kids.filter((k) => !block(k, op));
          const gb = open.length ? null : kids.length ? block(kids[0], op) : "view";
          const n = open.filter((k) => has(map, k[0], op)).length;
          if (TIP[gb]) reasons.add(TIP[gb]);
          // 일부만 켜졌으면 「–」(머리칸은 「–」 없이 해제 — 아래 head)
          if (n > 0 && n < open.length) return `<span class="inline-flex">${partialBox(label)}</span>`;
          return cell(open.length > 0 && n === open.length, gb, label, m[1] === 1);
        }
        const b = block(m, op);
        if (TIP[b]) reasons.add(TIP[b]);
        return cell(has(map, m[0], op), b, label, m[1] === 1);
      });
      const nm = `<span style="padding-left:${(m[1] - 1) * 18}px">${m[1] > 1 ? sub("└ ") : ""}${m[1] === 1 ? `<b class="font-semibold">${m[2]}</b>` : m[2]}</span>${[...reasons].map((r) => ` <span class="text-[13px] text-erp-label">· ${r}</span>`).join("")}`;
      return [nm, sub(`${m[1]}단계`), ...cells];
    });
    // 머리칸 전체 선택: 고를 수 있는 칸이 모두 켜져 있으면 켜짐, 고를 칸이 없으면 흐리게
    const head = ([op, label]) => {
      const open = vis.filter((m) => !m[4] && !block(m, op));
      // 체크박스는 칸 가운데(본문과 같은 세로줄), 글자는 그 오른쪽(앱 role-menu-dialog.tsx 와 같다, 2026-10-26 사용자 지정)
      return `<span class="grid grid-cols-[1fr_auto_1fr] items-center gap-[6px]"><span></span><span class="inline-flex${open.length ? "" : " opacity-40"}">${ui.checkbox(A, "", open.length > 0 && open.every((m) => has(map, m[0], op)), { "aria-label": `${label} 전체 선택`, disabled: !open.length })}</span><span class="justify-self-start whitespace-nowrap">${label}</span></span>`;
    };
    // 메뉴 영역은 BP 권한별 메뉴설정처럼 높이를 고정하고 넘치면 그 안에서 스크롤한다
    return menuScroll(depthRows(ui.dataTable(
      [{ header: "메뉴명", align: "left" }, { header: "메뉴단계", width: "w-[80px]" }, ...OPS.map((o) => ({ header: head(o), width: "w-[100px]" }))],
      rows,
      "이 서비스에 등록된 메뉴가 없습니다.",
    ), vis.map((m) => m[1])));
  };
  // 서비스는 표 위 탭으로 고른다(BP 권한별 메뉴설정과 같다 · 2026-10-08). 처음엔 그 권한의 기본 서비스 탭이 열린다
  const tabs = scrollTabs(x.tabs(
    SVC_TABS.map(([key, label]) => ({ id: `${id}-${key}`, label, html: svcTable(key) })),
    `${id}-${svc}`,
  ));

  const canSave = code !== "PM000001" && code !== OWN;

  const body =
    `<div class="flex flex-col gap-[12px]">` +
    roleHead(type, code, name) +
    // 잠긴 팝업의 안내 띠(앱 role-menu-dialog lockedText 와 같다, 2026-10-26)
    (canSave ? "" : `<p class="flex min-h-[42px] items-center rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[12px] py-[8px] text-[14px] font-medium text-erp-ink">${code === "PM000001" ? "플랫폼마스터는 시스템 최상위 권한으로, 모든 메뉴의 접근·관리 권한이 자동 부여되며 현재 화면에서는 조작할 수 없습니다." : "본인 계정에 연결된 권한 그룹이라 수정할 수 없습니다."}</p>`) +
    tabs +
    `</div>`;
  const foot = canSave
    ? ui.button("닫기", { variant: "off", "data-close": true }) + menuSaveButton(name) // 저장해도 팝업을 닫지 않고 안에 알림(앱과 같다, 2026-10-26)
    : ui.button("닫기", { "data-close": true });
  // 화면보다 길면 팝업 안에서 스크롤한다(앱 role-menu-dialog.tsx 의 max-h · overflow 와 같다, 2026-10-26)
  return c.wide(x.dialog(id, "권한별 메뉴설정", body, foot), "w-[880px] max-h-[calc(100dvh-48px)] overflow-y-auto");
}

export default ({ A, R }) => {
  const dialogs = [];
  const rows = ROLES.map((r) => {
    const [type, code, name, , desc, mod, modBy] = r;
    const id = x.dialogId();
    dialogs.push(menuDialog(A, R, r, id));
    const n = Object.values(GRANT[code]).reduce((s, m) => s + Object.values(m).filter(Boolean).length, 0);
    return [
      `${type} <span class="text-erp-label">· ${code}</span>`,
      `<span class="text-erp-link hover:underline">${name}</span>`, // 권한명은 링크색 — 앱(platform-role-groups · bp-role-groups)과 같다(2026-10-26 사용자 지정)
      desc,
      // 등록일시 열은 뺐다 — 앱 platform-role-groups 와 같이 최종수정만(2026-10-26 사용자 지정)
      `${mod} <span class="text-erp-label">· ${modBy}</span>`,
      x.dialogTrigger("설정", id, "soft"),
      // 등록 / 미등록만 보인다. 미등록은 상태 빨강 배지
      n ? ui.badge("on", "등록") : ui.badge("off", "미등록"),
    ];
  });
  const cols = [
    // 권한유형 · 코드를 한 칸에 — BP 권한 그룹 관리(앱 bp-role-groups)와 같은 모양(2026-10-26 사용자 지정)
    { header: "권한유형 · 코드", width: "w-[200px]", align: "left" },
    { header: "권한명", width: "w-[180px]", align: "left" }, // 설명이 칸 한가운데서 시작하지 않게 고정한다(앱 platform-role-groups 와 같다, 2026-10-26 사용자 지정)
    { header: "설명", align: "left" },
    { header: "최종수정", width: "w-[220px]", align: "left" },
    { header: "메뉴설정", width: "w-[124px]" }, // 버튼 열을 상태 앞에(앱 platform-role-groups 와 같다, 2026-10-26 사용자 지정)
    { header: "메뉴설정 여부", width: "w-[120px]" },
  ];
  const table = tagRows(ui.dataTable(cols, rows), ROLES, SELECTED).replaceAll('<td class="truncate px-[10px]', '<td class="truncate px-[10px] leading-[1.3]');

  const left =
    `<section class="${CARD} flex-1">` +
    // [등록]은 제목 줄로 옮겼다(앱 roles-screen.tsx 와 같다, 2026-10-26). 머리는 버튼이 없어도 34px, 건수는 제목에서 6px
    sideHead(`권한 그룹 목록 <span class="ml-[6px] text-[14px] font-normal text-erp-label">${ROLES.length}건</span>`) +
    table +
    `</section>`;

  // 오른쪽 — 고른 권한 상세·수정 / 신규 권한 등록. 권한유형·코드는 읽기 전용, 권한명·설명만 고친다.
  const right = roleSide({ roles: ROLES, own: OWN, master: false, selected: SELECTED, card: CARD });

  return {
    title: "플랫폼 권한 관리",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "플랫폼 권한 관리",
      titleRight: newButton(),
      body: `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${left}${right}</div>` + dialogs.join("") + revokeDialog() + MENU_SAVE_SCRIPT + SVC_TABS_SCRIPT,
    }),
  };
};
