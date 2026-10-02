// 플랫폼 권한 관리. 목업 docs/mockup/system/roles.html 의 기본 선택(PA000002)을 플랫폼 관리자(PA000001 연결, 권한 관리 조회·등록·수정)로 본 것.
// 왼쪽 권한 목록 + 오른쪽 권한 상세. 신규 등록은 오른쪽에서 밀려 나오는 패널로, 행의 메뉴등록은 권한별 확인창으로 옮겼다.
// 플랫폼 관리자에게는 삭제 권한이 없어 삭제 버튼·삭제 확인창이 없다(목업 admin 권한과 같다).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { platformHeader, link } from "../../site.mjs";

// 1팀 컴포넌트에 없는 것들. 토큰으로만 그린다.
const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
const help = (t) => `<span class="text-[13px] leading-[1.5] text-erp-label">${t}</span>`;
const sub = (t) => `<span class="text-erp-label">${t}</span>`;
// 안내 띠(목업 band 의 제목 줄). 옅은 바탕 + 1px 선.
const band = (t) => `<div class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-ink">${t}</div>`;
// 2단 카드 본문의 카드 껍데기
const CARD = "flex min-h-0 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]";
// dataTable 결과의 n 번째 줄에 클래스를 얹는다(선택 줄 바탕).
const markRows = (table, idx, cls) => {
  let n = -1;
  return table.replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, (m) => (idx.includes(++n) ? m.replace('">', ` ${cls}">`) : m));
};

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
  PA000004: { PLATFORM: { MN000212: "R", MN000213: "R", MN000214: "R", MN000215: "R", MN000216: "R", MN000217: "R" }, ERP: {} },
  BM000001: { PLATFORM: {}, ERP: full("ERP", true) },
  FM000001: { PLATFORM: {}, ERP: { MN000001: "R", MN000002: "RU", MN000004: "R", MN000005: "RCU", MN000006: "R", MN000007: "RCU", MN000008: "RCU", MN000009: "R", MN000010: "RCU", MN000011: "R", MN000012: "RCU", MN000013: "RCU", MN000014: "R", MN000015: "RCUD" } },
};
// [권한유형, 코드, 권한명, 구분, 설명, 최종수정일시, 수정자, 등록일, 등록자, 기준 고정 권한, 기본 서비스, 아래 권한 그룹]
const ROLES = [
  ["플랫폼 마스터", "PM000001", "플랫폼 마스터", "고정", "전체 메뉴 허용 고정 · 조회 전용", "2025-01-06 09:00", "시스템", "2025-01-06", "시스템", null, "PLATFORM"],
  ["플랫폼 관리자", "PA000001", "플랫폼 관리자", "고정", "플랫폼 관리자 기본 권한 · 추가 권한의 상한", "2026-08-12 14:20", "platjung", "2025-01-06", "시스템", null, "PLATFORM"],
  ["BP 마스터", "BM000001", "BP 마스터", "고정", "BP 관리자 권한 그룹의 상한", "2026-09-01 11:05", "platkim", "2025-01-06", "시스템", null, "ERP", "BP 관리자 권한 그룹"],
  ["가맹 마스터", "FM000001", "가맹 마스터", "고정", "가맹 관리자 권한 그룹의 상한", "2026-07-15 16:30", "platjung", "2025-01-06", "시스템", null, "ERP", "가맹 관리자 권한 그룹"],
  ["플랫폼 관리자", "PA000002", "고객지원 담당", "추가", "커뮤니티관리·BP 조회", "2026-09-10 10:42", "platjung", "2025-06-02", "platjung", "PA000001", "PLATFORM"],
  ["플랫폼 관리자", "PA000003", "정산 담당", "추가", "서비스정산관리·BP 조회", "2025-11-17 13:30", "platkim", "2025-11-17", "platkim", "PA000001", "PLATFORM"],
  ["플랫폼 관리자", "PA000004", "기준정보 조회", "추가", "시스템관리 조회만", "2026-03-04 15:10", "platjung", "2026-03-04", "platjung", "PA000001", "PLATFORM"],
];
const OWN = "PA000001"; // 보는 사람(플랫폼 관리자)에게 연결된 권한
const SELECTED = "PA000002";

const has = (map, code, op) => !!map?.[code]?.includes(op);
const TIP = { base: "기준 고정 권한 밖", self: "본인 권한 범위 밖", bp: "BP 마스터·가맹 마스터 권한에는 플랫폼 관리 메뉴를 줄 수 없습니다" };
const SVC_OPTS = { PLATFORM: "Whale ERP 플랫폼 관리 · PLATFORM", ERP: "Whale ERP · WHALE_ERP" };

// 메뉴 등록 확인창 하나(권한 하나). 목업 스크립트가 그리던 표를 빌드 때 그린다.
function menuDialog(A, R, role, id) {
  const [type, code, name, kind, , , , , , base, svc] = role;
  const isBp = code.startsWith("BM") || code.startsWith("FM");
  const block = (m, op) => {
    if (code === "PM000001") return "fixed";
    if (code === OWN) return "own";
    if (isBp && svc === "PLATFORM") return "bp";
    if (base && !has(GRANT[base][svc], m[0], op)) return "base";
    if (!isBp && !has(GRANT[OWN][svc], m[0], op)) return "self";
    return null;
  };
  // 사용중지 메뉴와 그 아래는 뺀다
  let stopAt = 0;
  const vis = TREE[svc].filter((m) => {
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
  const map = GRANT[code][svc];
  const cell = (on, b, op) => {
    const box = ui.checkbox(A, "", on, { "aria-label": op, disabled: !!b });
    return `<span class="inline-flex${b ? " opacity-40" : ""}">${box}</span>`;
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
        return cell(open.length > 0 && n === open.length, gb, label);
      }
      const b = block(m, op);
      if (TIP[b]) reasons.add(TIP[b]);
      return cell(has(map, m[0], op), b, label);
    });
    const nm = `<span style="padding-left:${(m[1] - 1) * 18}px">${m[1] > 1 ? sub("└ ") : ""}${m[1] === 1 ? `<b class="font-semibold">${m[2]}</b>` : m[2]}</span> <span class="text-[13px] text-erp-label">${m[0]}</span>${[...reasons].map((r) => ` <span class="text-[13px] text-erp-label">· ${r}</span>`).join("")}`;
    return [sub(`${m[1]}단계`), nm, ui.badge("on", "사용"), ...cells];
  });
  // 머리칸 전체 선택: 고를 수 있는 칸이 모두 켜져 있으면 켜짐, 고를 칸이 없으면 흐리게
  const head = ([op, label]) => {
    const open = vis.filter((m) => !m[4] && !block(m, op));
    return `<span class="inline-flex${open.length ? "" : " opacity-40"}">${ui.checkbox(A, label, open.length > 0 && open.every((m) => has(map, m[0], op)), { "aria-label": `${label} 전체 선택`, disabled: !open.length })}</span>`;
  };
  const table = ui.dataTable(
    [{ header: "메뉴 계층", width: "w-[80px]" }, { header: "메뉴명", align: "left" }, { header: "사용 상태", width: "w-[90px]" }, ...OPS.map((o) => ({ header: head(o), width: "w-[84px]" }))],
    rows,
    "이 서비스에 등록된 메뉴가 없습니다.",
  );

  const bands = [];
  if (code === "PM000001") bands.push(band("플랫폼 마스터 권한은 전체 메뉴 허용으로 고정되어 조회만 됩니다"));
  else if (code === OWN) bands.push(band("본인이 연결된 권한이라 바꿀 수 없습니다"));
  else if (base) {
    bands.push(note(`추가 권한은 기준 고정 권한 ${base} 이 허용한 칸 안에서만 고릅니다. 흐린 칸은 기준 권한 밖입니다.`));
    bands.push(band(`본인 권한(${OWN}) 범위 밖 칸은 고를 수 없습니다`));
  } else if (isBp) {
    bands.push(band("BP 측 고정 권한이라 설정자 본인 범위 상한을 걸지 않습니다"));
    bands.push(note(`이 고정 권한이 ${role[11]}의 상한입니다. 칸을 빼고 저장하면 저장 전에 영향 범위를 보여 드립니다.`));
  }
  const canSave = code !== "PM000001" && code !== OWN;

  const body =
    `<div class="flex flex-col gap-[18px]">` +
    ui.detailTable("권한", [
      ["권한 유형", type],
      ["권한 구분", `${kind} 권한`],
      ["기준 고정 권한", base ? `${base} 플랫폼 관리자` : sub("없음 · 고정 권한")],
      ["권한명", `${name} ${sub(code)}`],
    ]) +
    ui.field("서비스", ui.select([SVC_OPTS.PLATFORM, SVC_OPTS.ERP, "POS · POS"], { value: SVC_OPTS[svc] }) + help("사용중지 서비스(예약관리)는 고를 수 없습니다. 메뉴가 없는 서비스는 빈 표로 보입니다."), "w-[360px]") +
    bands.join("") +
    table +
    note(
      `메뉴는 ${ui.link("플랫폼 메뉴 관리", link(R, "system/menus.html"))}에 등록된 사용 메뉴만 보이고 새로 부여할 수 있습니다. 사용중지 메뉴는 목록에 나오지 않으며, 기존 설정은 보존돼 다시 사용하면 그대로 보입니다. 등록·수정·삭제를 고르면 조회가 함께 켜지고, 조회를 끄면 그 줄이 모두 꺼집니다. 묶음 메뉴의 칸은 켜면 하위 메뉴 전체에 적용됩니다. 머리칸의 체크로 그 열의 고를 수 있는 칸을 한꺼번에 켜고 끕니다. 바꾼 칸은 <b class="font-semibold">저장</b>을 눌러야 한꺼번에 반영됩니다.`,
    ) +
    `</div>`;
  const foot = canSave
    ? ui.button("취소", { variant: "off", "data-close": true }) + ui.button("저장", { "data-close": true })
    : ui.button("닫기", { "data-close": true });
  // 확인창 폭 420px 은 표가 들어가지 않아 이 창만 넓힌다.
  return x.dialog(id, "메뉴 등록", body, foot).replace("w-[420px]", "w-[920px]");
}

export default ({ A, R }) => {
  const dialogs = [];
  const rows = ROLES.map((r) => {
    const [type, code, name, kind, desc, mod, modBy, reg, regBy] = r;
    const id = x.dialogId();
    dialogs.push(menuDialog(A, R, r, id));
    const n = Object.values(GRANT[code]).reduce((s, m) => s + Object.values(m).filter(Boolean).length, 0);
    return [
      type,
      code,
      `${name} ${sub(kind)}${code === OWN ? ` ${sub("· 본인")}` : ""}`,
      desc,
      `<span class="inline-flex">${ui.detailValues([mod, sub(modBy)])}</span>`,
      `<span class="inline-flex">${ui.detailValues([reg, sub(regBy)])}</span>`,
      n ? `${ui.badge("on", "등록")} ${sub(`메뉴 ${n}개`)}` : ui.badge("off", "미등록"),
      x.dialogTrigger("메뉴등록", id, "soft"),
    ];
  });
  const cols = [
    { header: "권한유형", width: "w-[110px]" },
    { header: "권한코드", width: "w-[96px]" },
    { header: "권한명", align: "left" },
    { header: "설명", align: "left" },
    { header: "최종수정일시 · 수정자", width: "w-[200px]" },
    { header: "등록일 · 등록자", width: "w-[170px]" },
    { header: "메뉴 등록 여부", width: "w-[130px]" },
    { header: "메뉴등록", width: "w-[124px]" },
  ];
  const table = markRows(ui.dataTable(cols, rows), [ROLES.findIndex((r) => r[1] === SELECTED)], "bg-erp-thead-bg");

  const left =
    `<section class="${CARD} flex-1">` +
    ui.sectionHead(`권한 목록 <span class="text-[14px] font-normal text-erp-label">7건 · 고정 4 · 추가 3</span>`, ui.slideTrigger("신규 등록", "role-new")) +
    table +
    note("권한과 메뉴 설정을 바꾸면 연결된 사용자에게 재로그인 없이 다음 요청부터 적용됩니다. 왼쪽 메뉴 구성은 다음 화면 이동이나 새로고침 때 바뀝니다. 변경 전후 값·변경자·변경 일시는 권한 변경 이력으로 남고 이 화면에는 보이지 않습니다.") +
    `</section>`;

  // 오른쪽 — 고른 권한(PA000002 · 추가 권한) 상세. 권한유형·코드는 읽기 전용, 권한명·설명만 고친다.
  const right =
    `<section class="${CARD} w-[464px] shrink-0">` +
    ui.sectionHead("권한 상세", `<span class="text-[14px] text-erp-label">추가 권한</span>`) +
    ui.detailTable("기본 정보", [
      ["권한유형", "플랫폼 관리자"],
      ["기준 고정 권한", "PA000001 플랫폼 관리자"],
      ["권한코드", "PA000002"],
      ["등록", ui.detailValues(["2025-06-02", "platjung"])],
      ["최종 수정", ui.detailValues(["2026-09-10 10:42", "platjung"])],
    ]) +
    `<div class="flex flex-col gap-[18px] pt-[6px]">` +
    ui.field("권한명 *", ui.textField({ value: "고객지원 담당" })) +
    ui.field("설명", ui.textarea({ rows: 4, value: "커뮤니티관리·BP 조회" })) +
    `</div>` +
    `<div class="flex justify-end gap-[6px]">${ui.button("저장")}</div>` +
    `</section>`;

  const panel = ui.slidePanel(
    "role-new",
    "신규 권한 등록",
    `<h2 class="text-[18px] font-semibold text-erp-ink">신규 권한 등록</h2>` +
      `<div class="flex flex-col gap-[18px]">` +
      ui.field("권한유형 *", ui.select(["플랫폼 관리자"]) + help("플랫폼 마스터·BP 마스터·가맹 마스터가 모두 등록되어 있어 플랫폼 관리자만 고를 수 있습니다.")) +
      ui.field("권한코드 · 자동 채번", ui.textField({ value: "PA000005", readonly: true }) + help("등록할 때 확정됩니다. 같은 유형을 동시에 등록하면 겹치지 않는 다음 순번이 붙습니다.")) +
      ui.field("기준 고정 권한", ui.textField({ value: "PA000001 · 플랫폼 관리자", readonly: true })) +
      ui.field("권한명 *", ui.textField({ placeholder: "예: 프로모션 담당" })) +
      ui.field("설명", ui.textarea({ rows: 4, placeholder: "이 권한으로 맡길 업무를 적습니다" })) +
      `</div>` +
      ui.panelButtons("취소", "등록"),
  );

  return {
    title: "플랫폼 권한 관리",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "플랫폼 권한 관리",
      body: `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${left}${right}</div>` + dialogs.join(""),
      panels: panel,
    }),
  };
};
