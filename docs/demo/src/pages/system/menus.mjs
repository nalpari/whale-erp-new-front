// 플랫폼 메뉴 관리. 목업 docs/mockup/system/menus.html 을 플랫폼 관리자로 본 것.
// 표본에서 플랫폼 관리자(PA000001)는 이 메뉴에 조회만 있어 목업의 「조회만」 권한으로 그렸다 — 끌기 손잡이·신규 메뉴·저장·위치 옮기기가 없고 상세는 읽기만 한다.
// 목업의 서비스 목록 ↔ 서비스별 트리 전환은 탭으로 옮겼다(서비스 목록의 코드·이름을 누르면 그 서비스 탭이 열린다).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { platformHeader } from "../../site.mjs";

const sub = (t) => `<span class="text-erp-label">${t}</span>`;
// 안내 띠(목업 band 의 제목 줄). 옅은 바탕 + 1px 선.
const band = (t) => `<div class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-ink">${t}</div>`;
// dataTable 결과의 n 번째 줄에 클래스를 얹는다(사용중지 줄 흐리게 · 고른 줄 바탕).
const markRows = (table, marks) => {
  let n = -1;
  return table.replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, (m) => {
    const cls = marks(++n);
    return cls ? m.replace('">', ` ${cls}">`) : m;
  });
};
const useBadge = (on) => (on ? ui.badge("on", "사용") : ui.badge("off", "사용중지"));

// [메뉴 코드, 단계, 노출 메뉴명, 메뉴 URL, 사용] — 적은 순서가 메뉴 순서다.
const SVC = {
  erp: {
    code: "WHALE_ERP", name: "Whale ERP", count: 48, first: "MN000008",
    src: [
      ["MN000001", 1, "점포관리", "", 1],
      ["MN000002", 2, "점포 정보 관리", "/stores", 1],
      ["MN000003", 2, "계약서 템플릿 관리", "/stores/contract-templates", 0],
      ["MN000004", 1, "직원관리", "", 1],
      ["MN000005", 2, "직원 정보 관리", "/staff", 1],
      ["MN000006", 2, "근로계약 관리", "", 1],
      ["MN000007", 3, "계약 목록", "/staff/contracts", 1],
      ["MN000008", 3, "근로계약서 초안 작성", "/staff/contracts/new", 1],
      ["MN000009", 2, "급여명세서 관리", "/staff/payrolls", 1],
      ["MN000010", 2, "근무스케줄 관리", "/staff/schedules", 1],
      ["MN000011", 1, "환경설정", "", 1],
      ["MN000012", 2, "BP 관리자 관리", "/settings/admins", 1],
      ["MN000013", 2, "BP 권한 그룹 관리", "/settings/roles", 1],
      ["MN000014", 2, "BP 공통코드 관리", "/settings/codes", 1],
      ["MN000015", 2, "BP 휴일 관리", "/settings/holidays", 1],
    ],
  },
  plat: {
    code: "PLATFORM", name: "Whale ERP 플랫폼 관리", count: 22, first: "MN000214",
    src: [
      ["MN000201", 1, "회원관리", "", 0],
      ["MN000202", 2, "회원 정보 관리", "", 0],
      ["MN000203", 1, "BP 마스터 계정 관리", "/platform/bp", 1],
      ["MN000204", 1, "서비스정산관리", "", 0],
      ["MN000205", 2, "부가서비스 주문 내역", "", 0],
      ["MN000206", 2, "부가서비스 정산", "", 0],
      ["MN000207", 1, "부가서비스관리", "", 0],
      ["MN000208", 2, "부가 서비스 정보 관리", "", 0],
      ["MN000209", 1, "프로모션관리", "", 0],
      ["MN000210", 2, "쿠폰 관리", "", 0],
      ["MN000211", 2, "포인트 관리", "", 0],
      ["MN000212", 1, "시스템관리", "", 1],
      ["MN000213", 2, "플랫폼 관리자 관리", "/platform/system/admins", 1],
      ["MN000214", 2, "플랫폼 권한 관리", "/platform/system/roles", 1],
      ["MN000215", 2, "플랫폼 메뉴 관리", "/platform/system/menus", 1],
      ["MN000216", 2, "플랫폼 공통코드 관리", "/platform/system/codes", 1],
      ["MN000217", 2, "플랫폼 휴일 관리", "/platform/system/holidays", 1],
      ["MN000218", 1, "커뮤니티관리", "", 1],
      ["MN000219", 2, "공지사항", "/platform/community/notices", 1],
      ["MN000220", 2, "FAQ", "/platform/community/faq", 1],
      ["MN000221", 2, "문의사항", "/platform/community/inquiries", 1],
      ["MN000222", 2, "도입문의", "/platform/community/leads", 1],
    ],
  },
  resv: {
    code: "RESERVATION", name: "예약관리", count: 3, first: "MN000302", off: true,
    src: [
      ["MN000301", 1, "예약관리", "", 1],
      ["MN000302", 2, "예약 현황", "/reservations", 1],
      ["MN000303", 2, "예약 설정", "/reservations/settings", 1],
    ],
  },
};

// 서비스 목록 탭
function services() {
  const go = (t, id) => ui.link(t, `#${id}`);
  const plain = [
    ["POS", "POS"], ["KIOSK", "KIOSK"], ["TABLE_ORDER", "Table Order"], ["PICK_UP_ORDER", "Pick Up Order"], ["QR_ORDER", "QR Order"],
    ["RECIPE_MANAGEMENT", "레시피관리"], ["ORDER_MANAGEMENT", "발주관리"], ["STORE_INVENTORY", "점포재고관리"], ["WAITING_MANAGEMENT", "대기순번관리"],
  ];
  const rows = [
    [1, go("WHALE_ERP", "erp"), go("Whale ERP", "erp"), useBadge(true), 48],
    [2, go("PLATFORM", "plat"), go("Whale ERP 플랫폼 관리", "plat"), useBadge(true), 22],
    ...plain.map(([c, n], i) => [i + 3, c, n, useBadge(true), 0]),
    [12, go("RESERVATION", "resv"), go("예약관리", "resv"), `${useBadge(false)} <span class="text-[13px]">사용자 화면·권한 부여 제외 · 메뉴는 편집 가능</span>`, 3],
  ];
  const cols = [
    { header: "순서", width: "w-[70px]" },
    { header: "서비스 코드", width: "w-[240px]" },
    { header: "서비스명", align: "left" },
    { header: "서비스 사용 상태", align: "left", width: "w-[420px]" },
    { header: "등록 메뉴 수", width: "w-[130px]" },
  ];
  return (
    ui.sectionHead(`서비스 <span class="text-[14px] font-normal text-erp-label">12개 · 사용 11 · 사용중지 1 · 공통코드 표시 순서</span>`) +
    markRows(ui.dataTable(cols, rows), (n) => (n === 11 ? "text-erp-muted" : ""))
  );
}

// 서비스 하나의 트리 + 고른 메뉴 상세
function treeTab(s) {
  // 상위 메뉴·순서·묶음 여부를 적은 순서에서 계산한다
  const stack = [];
  const nodes = s.src.map(([code, lvl, name, url, use]) => {
    const n = { code, lvl, name, url, use: !!use, parent: lvl > 1 ? stack[lvl - 2] : null, kids: 0 };
    if (n.parent) n.parent.kids++;
    stack.length = lvl - 1;
    stack[lvl - 1] = n;
    return n;
  });
  nodes.forEach((n) => (n.order = nodes.filter((m) => m.parent === n.parent && nodes.indexOf(m) <= nodes.indexOf(n)).length));
  const path = (n) => (n ? `${path(n.parent)}${n.parent ? " › " : ""}${n.name}` : "");
  const sel = nodes.find((n) => n.code === s.first);

  const rows = nodes.map((n) => [
    `<span style="padding-left:${(n.lvl - 1) * 18}px">${n.lvl === 1 ? `<b class="font-semibold">${n.name}</b>` : n.name}${n.kids ? ` <span class="text-[13px] text-erp-label">묶음</span>` : ""}</span>`,
    n.code,
    n.url || "—",
    n.order,
    useBadge(n.use),
  ]);
  const cols = [
    { header: "노출 메뉴명", align: "left" },
    { header: "메뉴 코드", width: "w-[110px]" },
    { header: "메뉴 URL", align: "left", width: "w-[260px]" },
    { header: "순서", width: "w-[60px]" },
    { header: "사용 상태", width: "w-[100px]" },
  ];
  const table = markRows(ui.dataTable(cols, rows), (i) => [nodes[i] === sel ? "bg-erp-thead-bg" : "", nodes[i].use ? "" : "text-erp-muted"].filter(Boolean).join(" "));

  const p = sel.parent;
  const detail = ui.detailTable("메뉴 정보", [
    ["서비스 코드", s.code],
    ["상위 메뉴", p ? `${p.code} ${path(p)}` : sub("없음 · 최상위 메뉴")],
    ["메뉴 코드", sel.code],
    ["메뉴 순서", sel.order],
    ["노출 메뉴명", sel.name],
    ["메뉴 URL", sel.url || sub("—")],
    ["메뉴 사용 상태", useBadge(sel.use)],
  ]);

  return (
    (s.off ? band("사용중지 서비스입니다 — 메뉴는 편집할 수 있지만 사용자 화면에는 보이지 않습니다") : "") +
    `<div class="flex items-start gap-[24px]">` +
    `<section class="flex min-w-0 flex-1 flex-col gap-[12px]">${ui.sectionHead(`메뉴 트리 <span class="text-[14px] font-normal text-erp-label">${nodes.length}개 · 상위 메뉴 · 순서대로 · 최대 3단계</span>`)}${table}</section>` +
    `<section class="flex w-[440px] shrink-0 flex-col gap-[12px]">${ui.sectionHead(`메뉴 상세 <span class="text-[14px] font-normal text-erp-label">${sel.lvl}단계</span>`)}${detail}</section>` +
    `</div>`
  );
}

export default ({ A, R }) => {
  const tab = (k) => `${SVC[k].name}&nbsp;${sub(SVC[k].count)}${SVC[k].off ? `&nbsp;${ui.badge("off", "사용중지")}` : ""}`;
  const body = ui.detailBody(
    x.tabs([
      { id: "services", label: "서비스 목록", html: services() },
      { id: "erp", label: tab("erp"), html: treeTab(SVC.erp) },
      { id: "plat", label: tab("plat"), html: treeTab(SVC.plat) },
      { id: "resv", label: tab("resv"), html: treeTab(SVC.resv) },
    ]),
  );
  return {
    title: "플랫폼 메뉴 관리",
    html: ui.erpFrame({ header: platformHeader(A, R), title: "플랫폼 메뉴 관리", body }),
  };
};
