// 플랫폼 권한 관리 · 플랫폼 마스터 기준. 목업 docs/mockup/system/roles.html 의 기본 상태(목업 권한 master, PA000002 선택)를 본 것.
// roles.mjs(플랫폼 관리자 기준)와 다른 점: 본인 권한이 PM000001, 권한 상세에 [삭제]와 권한 삭제 확인창이 있고,
// 메뉴등록에서 본인 범위 상한이 걸리지 않으며 PA000001 고정 권한도 고칠 수 있다.
import * as ui from "../../ui.mjs";
import { req } from "../../biz-form.mjs";
import * as x from "../../extra.mjs";
import * as c from "../../config-parts.mjs";
import { platformHeader, link } from "../../site.mjs";
import { roleSide, tagRows, newButton } from "../../role-side.mjs";

// 1팀 컴포넌트에 없는 것들. 토큰으로만 그린다.
const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
const help = (t) => `<span class="text-[13px] leading-[1.5] text-erp-label">${t}</span>`;
const sub = (t) => `<span class="text-erp-label">${t}</span>`;
// 확인창 안의 짧은 항목·값 목록(목업 .kv). admins-detail 과 같은 모양.
const kv = (rows) =>
  `<dl class="grid grid-cols-[84px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">${rows
    .map(([k, v]) => `<dt class="text-erp-label">${k}</dt><dd>${v}</dd>`)
    .join("")}</dl>`;
// 안내 띠(목업 band 의 제목 줄). 옅은 바탕 + 1px 선.
const band = (t) => `<div class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-ink">${t}</div>`;
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
  ["플랫폼 마스터", "PM000001", "플랫폼 마스터", "고정", "전체 메뉴 허용 고정 · 조회 전용", "2025-01-06 09:00", "시스템", "2025-01-06 09:00", "시스템", null, "PLATFORM"],
  ["플랫폼 관리자", "PA000001", "플랫폼 관리자", "고정", "플랫폼 관리자 기본 권한 · 추가 권한의 상한", "2026-08-12 14:20", "platjung", "2025-01-06 09:00", "시스템", null, "PLATFORM", "플랫폼 관리자 추가 권한"],
  ["BP 마스터", "BM000001", "BP 마스터", "고정", "BP 관리자 권한 그룹의 상한", "2026-09-01 11:05", "platkim", "2025-01-06 09:00", "시스템", null, "ERP", "BP 관리자 권한 그룹"],
  ["가맹 마스터", "FM000001", "가맹 마스터", "고정", "가맹 관리자 권한 그룹의 상한", "2026-07-15 16:30", "platjung", "2025-01-06 09:00", "시스템", null, "ERP", "가맹 관리자 권한 그룹"],
  ["플랫폼 관리자", "PA000002", "고객지원 담당", "추가", "커뮤니티관리·BP 조회", "2026-09-10 10:42", "platjung", "2025-06-02 10:05", "platjung", "PA000001", "PLATFORM"],
  ["플랫폼 관리자", "PA000003", "정산 담당", "추가", "서비스정산관리·BP 조회", "2025-11-17 13:30", "platkim", "2025-11-17 13:30", "platkim", "PA000001", "PLATFORM"],
  ["플랫폼 관리자", "PA000004", "기준정보 조회", "추가", "시스템관리 조회만", "2026-03-04 15:10", "platjung", "2026-03-04 15:10", "platjung", "PA000001", "PLATFORM"],
];
const OWN = "PM000001"; // 보는 사람(플랫폼 마스터)에게 연결된 권한
const SELECTED = null; // 처음 진입은 고른 권한 없이 빈 안내를 보인다

const has = (map, code, op) => !!map?.[code]?.includes(op);
const TIP = { self: "본인 권한 범위 밖", bp: "BP 마스터·가맹 마스터 권한에는 플랫폼 관리 메뉴를 줄 수 없습니다" };
// 메뉴 등록 팝업의 서비스 탭. POS 는 아직 메뉴가 없어 빈 표다
const SVC_TABS = [["PLATFORM", "Whale ERP 플랫폼 관리"], ["ERP", "Whale ERP"], ["POS", "POS"]];

// 메뉴 등록 확인창 하나(권한 하나). 목업 스크립트가 그리던 표를 빌드 때 그린다.
function menuDialog(A, R, role, id) {
  const [type, code, name, , , , , , , base, svc] = role; // base: 추가 권한인지 가리는 데만 쓴다(상한은 설정자 본인 권한뿐 · 확정 2026-10-06)
  const isBp = code.startsWith("BM") || code.startsWith("FM");
  // 서비스 하나의 메뉴 표. block 은 그 서비스 기준으로 막힌 칸을 가린다
  const svcTable = (svc) => {
    const block = (m, op) => {
      if (code === "PM000001") return "fixed";
      if (code === OWN) return "own";
      if (isBp && svc === "PLATFORM") return "bp";
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
      const nm = `<span style="padding-left:${(m[1] - 1) * 18}px">${m[1] > 1 ? sub("└ ") : ""}${m[1] === 1 ? `<b class="font-semibold">${m[2]}</b>` : m[2]}</span>${[...reasons].map((r) => ` <span class="text-[13px] text-erp-label">· ${r}</span>`).join("")}`;
      return [nm, sub(`${m[1]}단계`), ...cells];
    });
    // 머리칸 전체 선택: 고를 수 있는 칸이 모두 켜져 있으면 켜짐, 고를 칸이 없으면 흐리게
    const head = ([op, label]) => {
      const open = vis.filter((m) => !m[4] && !block(m, op));
      return `<span class="inline-flex${open.length ? "" : " opacity-40"}">${ui.checkbox(A, label, open.length > 0 && open.every((m) => has(map, m[0], op)), { "aria-label": `${label} 전체 선택`, disabled: !open.length })}</span>`;
    };
    // 메뉴 영역은 BP 권한 메뉴 등록처럼 높이를 고정하고 넘치면 그 안에서 스크롤한다
    return `<div class="h-[420px] overflow-y-auto">${ui.dataTable(
      [{ header: "메뉴명", align: "left" }, { header: "메뉴 계층", width: "w-[90px]" }, ...OPS.map((o) => ({ header: head(o), width: "w-[90px]" }))],
      rows,
      "이 서비스에 등록된 메뉴가 없습니다.",
    )}</div>`;
  };
  // 서비스는 표 위 탭으로 고른다(BP 권한 메뉴 등록과 같다 · 2026-10-08). 처음엔 그 권한의 기본 서비스 탭이 열린다
  const tabs = x.tabs(
    SVC_TABS.map(([key, label]) => ({ id: `${id}-${key}`, label, html: svcTable(key) })),
    `${id}-${svc}`,
  );

  const canSave = code !== "PM000001" && code !== OWN;

  const body =
    `<div class="flex flex-col gap-[12px]">` +
    c.kv(
      [
        ["권한 코드", code],
        ["권한 유형", type],
        ["권한명", name],
      ],
      84,
    ) +
    tabs +
    `</div>`;
  const foot = canSave
    ? ui.button("취소", { variant: "off", "data-close": true }) + ui.button("저장", { "data-close": true })
    : ui.button("닫기", { "data-close": true });
  return c.wide(x.dialog(id, "권한 메뉴 등록", body, foot), "w-[880px]");
}

export default ({ A, R }) => {
  const dialogs = [];
  const rows = ROLES.map((r) => {
    const [type, code, name, kind, desc, mod, modBy, reg, regBy] = r;
    const id = x.dialogId();
    dialogs.push(menuDialog(A, R, r, id));
    const n = Object.values(GRANT[code]).reduce((s, m) => s + Object.values(m).filter(Boolean).length, 0);
    return [
      code,
      type,
      name,
      desc,
      // BP 권한 그룹 관리 목록처럼 한 칸에 두 줄(일시 / 아이디)
      c.two(mod, c.muted(modBy)),
      c.two(reg, c.muted(regBy)),
      // 등록 / 미등록만 보인다. 미등록은 상태 빨강 배지
      n ? ui.badge("on", "등록") : ui.badge("off", "미등록"),
      x.dialogTrigger("메뉴등록", id, "soft"),
    ];
  });
  const cols = [
    { header: "권한코드", width: "w-[96px]" },
    { header: "권한유형", width: "w-[110px]" },
    { header: "권한명", align: "left" },
    { header: "설명", align: "left" },
    { header: "최종 수정일시 · 수정자", width: "w-[170px]" },
    { header: "등록일시 · 등록자", width: "w-[170px]" },
    { header: "메뉴 등록 여부", width: "w-[130px]" },
    { header: "메뉴등록", width: "w-[124px]" },
  ];
  const table = tagRows(ui.dataTable(cols, rows), ROLES, SELECTED).replaceAll('<td class="truncate px-[10px]', '<td class="truncate px-[10px] leading-[1.3]');

  const left =
    `<section class="${CARD} flex-1">` +
    ui.sectionHead(`권한 목록 <span class="text-[14px] font-normal text-erp-label">7건</span>`, newButton()) +
    table +
    `</section>`;

  // 권한 삭제 확인창(목업 pop-del 의 첫 단계) — 추가 권한마다 하나. 연결 사용자는 플랫폼 관리자 목록 표본(admins.mjs)을 따른다.
  // 대체 권한은 다른 추가 권한만 고른다 — 고정 권한 PA000001 로 옮기면 권한이 플랫폼 관리자 기본 권한까지 넓어진다.
  const USERS = { PA000002: ["platpark 박지우", "platchoi 최유나(미사용)"], PA000003: ["plathan 한승우"], PA000004: [] };
  const del = {};
  const delDialogs = ROLES.filter((r) => r[3] === "추가")
    .map(([, code, name]) => {
      const id = (del[code] = x.dialogId());
      const users = USERS[code];
      const others = ROLES.filter((r) => r[3] === "추가" && r[1] !== code).map((r) => `${r[1]} · ${r[2]}`);
      const body = users.length
        ? kv([
            ["권한", `${name} ${sub(code)}`],
            ["연결 사용자", `${users.length}명 ${sub(`· ${users.join(", ")}`)}`],
          ]) +
          ui.field(req("대체 권한"), ui.select(["선택하세요", ...others]) + help(`변경 대상 사용자 ${users.length}명의 권한을 고른 권한으로 한꺼번에 바꾼 뒤 삭제합니다. 고정 권한 PA000001 플랫폼 관리자는 고를 수 없습니다 — 옮기면 권한이 플랫폼 관리자 기본 권한까지 넓어집니다.`)) +
          band(`로그인 중인 사용자도 다음 요청부터 새 권한으로 판정됩니다`)
        : kv([
            ["권한", `${name} ${sub(code)}`],
            ["연결 사용자", "없음"],
          ]) + note("연결된 사용자가 없어 바로 삭제합니다. 되돌릴 수 없습니다.");
      return x.dialog(id, "권한 삭제", `<div class="flex flex-col gap-[12px] break-keep">${body}</div>`, ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { "data-close": true }));
    })
    .join("");

  // 오른쪽 — 고른 권한 상세·수정 / 신규 권한 등록. 권한유형·코드는 읽기 전용, 권한명·설명만 고친다.
  const right = roleSide({ roles: ROLES, own: OWN, master: true, selected: SELECTED, del, card: CARD });

  return {
    title: "플랫폼 권한 관리",
    html: ui.erpFrame({
      header: platformHeader(A, R, { master: true }),
      title: "플랫폼 권한 관리",
      body: `<div class="flex min-h-0 flex-1 gap-[12px] p-[24px]">${left}${right}</div>` + dialogs.join("") + delDialogs,
    }),
  };
};
