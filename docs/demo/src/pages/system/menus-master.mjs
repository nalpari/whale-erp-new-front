// 플랫폼 메뉴 관리(플랫폼 마스터 기준). 목업 docs/mockup/system/menus.html 의 「등록·수정」 권한 = 플랫폼 마스터로 본 것.
// 끌기 손잡이·신규 메뉴·저장·위치 옮기기가 있고 상세를 고칠 수 있다. 신규 메뉴 등록과 수정은 목업처럼 트리 오른쪽 칸에서 한다.
// 메뉴 삭제 버튼과 변경 이력은 목업처럼 두지 않는다(명세가 둘 다 제외) — 안 쓰는 메뉴는 사용중지로 돌린다.
// 관리자 기준 menus.mjs 도 목업 기본 권한(등록·수정)에 맞춰 이 화면을 헤더만 바꿔 그린다.
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
// 아래 셋은 1팀 컴포넌트에 없어 토큰으로 그렸다(admins-new·codes 와 같은 모양).
const req = (label) => `${label} <span class="text-[#e93737]">*</span>`; // #e93737: DESIGN.md 위험 글자색
const help = (t) => `<span class="text-[13px] leading-[1.5] text-erp-label">${t}</span>`;
const handle = '<span title="끌어서 옮기기" aria-label="끌어서 옮기기" class="cursor-grab text-[16px] text-erp-label">≡</span>';
const stack = (...c) => `<div class="flex flex-col gap-[8px]">${c.join("")}</div>`;
const ro = (value) => ui.textField({ value, readonly: true });
// 사용 상태 고르기(목업 seg) — 라디오 둘
const useRadios = (name, on) => `<div role="radiogroup" class="flex h-[34px] items-center gap-[18px]">${ui.radio("사용", name, on)}${ui.radio("사용중지", name, !on)}</div>`;
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

// 서비스 하나의 트리 + 오른쪽 칸(메뉴 상세·수정 / 신규 메뉴 등록 / 위치 옮기기)
// 목업처럼 등록과 수정 모두 오른쪽 칸에서 한다 — 따로 열리는 패널이 없다. 칸 바꾸기는 아래 MENU_SCRIPT 가 한다.
// 메뉴 코드는 서비스를 가리지 않고 가장 큰 번호의 다음을 쓴다(목업 규칙).
const NEXT_CODE = `MN${String(Math.max(...Object.values(SVC).flatMap((s) => s.src.map((r) => +r[0].slice(2)))) + 1).padStart(6, "0")}`;
const EG = { erp: ["예: 근무 교대 요청", "/staff/…"], plat: ["예: 플랫폼 배치 관리", "/platform/system/…"], resv: ["예: 예약 알림 설정", "/reservations/…"] };
// 갈 수 없는 쪽·작성 중에 누를 수 없는 버튼은 흐리게(1팀 버튼에 비활성 모양이 없어 덧붙인다)
const dim = (b) => b.replace('class="', 'class="disabled:pointer-events-none disabled:opacity-40 ');
const sideHead = (title, lvl, extra = "") =>
  ui.sectionHead(`${title} <span class="text-[14px] font-normal text-erp-label"><span data-f="lvl">${lvl}</span>단계${extra}</span>`);
const NO_DELETE = "메뉴는 지우지 않습니다. 쓰지 않는 메뉴는 사용중지로 돌립니다. 메뉴 등록·수정·이동 이력은 남기지 않습니다.";

function treeTab(key, s) {
  // 상위 메뉴·순서·묶음 여부를 적은 순서에서 계산한다
  const stackN = [];
  const nodes = s.src.map(([code, lvl, name, url, use]) => {
    const n = { code, lvl, name, url, use: !!use, parent: lvl > 1 ? stackN[lvl - 2] : null, kids: 0 };
    if (n.parent) n.parent.kids++;
    stackN.length = lvl - 1;
    stackN[lvl - 1] = n;
    return n;
  });
  const sibs = (p) => nodes.filter((m) => m.parent === p);
  nodes.forEach((n) => (n.order = sibs(n.parent).indexOf(n) + 1));
  const path = (n) => (n ? `${path(n.parent)}${n.parent ? " › " : ""}${n.name}` : "");
  // 자기나 그 위가 사용중지면 그 아래 메뉴는 사용자에게 보이지 않는다
  const hides = (n) => {
    for (let q = n; q; q = q.parent) if (!q.use) return true;
    return false;
  };
  const sel = nodes.find((n) => n.code === s.first);
  const [eg, urlEg] = EG[key];

  const rows = nodes.map((n) => [
    handle,
    `<span style="padding-left:${(n.lvl - 1) * 18}px">${n.lvl === 1 ? `<b class="font-semibold">${n.name}</b>` : n.name}${n.kids ? ` <span class="text-[13px] text-erp-label">묶음</span>` : ""}</span>`,
    n.code,
    n.url || "—",
    n.order,
    useBadge(n.use),
  ]);
  const cols = [
    { header: "이동", width: "w-[56px]" },
    { header: "노출 메뉴명", align: "left" },
    { header: "메뉴 코드", width: "w-[110px]" },
    { header: "메뉴 URL", align: "left", width: "w-[240px]" },
    { header: "순서", width: "w-[60px]" },
    { header: "사용 상태", width: "w-[100px]" },
  ];
  // 줄마다 스크립트가 읽을 단서를 단다 — 이 줄 아래에 새 메뉴를 만들 때의 단계·상위 표시·순서
  let i = -1;
  const table = ui.dataTable(cols, rows).replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, () => {
    const n = nodes[++i];
    const cls = ["cursor-pointer", n === sel ? "bg-erp-thead-bg" : "", n.use ? "" : "text-erp-muted"].filter(Boolean).join(" ");
    return `<tr class="h-[46px] border-b border-erp-thead-line ${cls}" data-row="${key}" data-code="${n.code}" data-lvl="${n.lvl}" data-name="${n.name}" data-label="${n.code} · ${path(n)}" data-kids="${n.kids}"${hides(n) ? " data-hides" : ""}>`;
  });

  const nameFields = (name, url, use, id, isNew) =>
    ui.field(req("노출 메뉴명"), ui.textField({ value: name, placeholder: eg, "data-new-name": isNew })) +
    ui.field(`메뉴 URL ${help("선택")}`, stack(ui.textField({ value: url, placeholder: urlEg }), help("하위 메뉴를 묶기만 하는 메뉴는 비워 둘 수 있습니다. 넣으면 누를 때 그 화면으로 갑니다."))) +
    `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">메뉴 사용 상태</span>${useRadios(id, use)}${help("사용중지하면 사용자 화면에서 빠지고 새로 권한을 줄 수 없습니다. 이미 준 권한은 남습니다.")}</div>`;

  // 메뉴 하나의 상세·수정 + 위치 옮기기. 고른 줄의 것만 보인다.
  const detailOf = (n) => {
    const p = n.parent;
    const sib = sibs(p), k = sib.indexOf(n), prev = sib[k - 1], next = sib[k + 1];
    const mv = (ok, label) => dim(ui.button(label, { variant: "soft", disabled: !ok }));
    return (
      `<div data-view="${n.code}" class="flex flex-col gap-[24px]"${n === sel ? "" : " hidden"}>` +
      `<section class="flex flex-col gap-[18px]">${sideHead("메뉴 상세", n.lvl)}` +
      ui.field("서비스 코드", ro(s.code)) +
      ui.field(
        "상위 메뉴",
        stack(
          ro(p ? `${p.code} · ${path(p)}` : "없음 · 최상위(1단계) 메뉴"),
          (p && hides(p) ? help("상위가 사용중지라 사용자에게는 보이지 않습니다.") : "") +
            help(`${n.lvl >= 3 ? "3단계 메뉴라 이 아래에는 하위 메뉴를 둘 수 없습니다. " : ""}상위 메뉴와 순서는 트리에서 끌거나 아래 ‘위치 옮기기’로 바꿉니다.`),
        ),
      ) +
      ui.formRow(ui.field("메뉴 코드", ro(n.code)), ui.field("메뉴 순서", ro(String(n.order)))) +
      nameFields(n.name, n.url, n.use, `use-${key}-${n.code}`, false) +
      `<div class="flex justify-end">${ui.button("저장")}</div>` +
      help(NO_DELETE) +
      `</section>` +
      `<section class="flex flex-col gap-[12px] border-t border-erp-divider pt-[24px]">${ui.sectionHead(`위치 옮기기 <span class="text-[14px] font-normal text-erp-label">누르면 바로 반영 · 저장과 따로</span>`)}` +
      `<div class="grid grid-cols-2 gap-[6px] [&>*]:w-full">${mv(prev, "위로")}${mv(next, "아래로")}${mv(p, "상위로 올리기")}${mv(prev && n.lvl < 3, "위 메뉴 안으로 넣기")}</div>` +
      help("끌어 놓기와 같은 규칙입니다 — 하위 메뉴가 함께 움직이고 3단계를 넘길 수 없습니다. 트리 행에서 Alt + ↑ ↓ ← → 로도 옮깁니다.") +
      `</section></div>`
    );
  };

  // 아무것도 고르지 않았을 때
  const empty =
    `<section data-view="empty" hidden class="flex flex-col gap-[18px]">${ui.sectionHead("메뉴 상세")}` +
    `<div class="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted"><p>왼쪽 트리에서 메뉴를 고르면 상세가 여기에 섭니다.</p><p class="text-[13px]">아무것도 고르지 않고 신규 메뉴를 누르면 최상위(1단계) 메뉴로 등록합니다.</p></div></section>`;

  // 신규 메뉴 등록 — 상위 메뉴·단계·순서는 스크립트가 고른 줄을 보고 채운다
  const self = (b) => dim(b).replace("inline-flex", "inline-flex self-start");
  const form =
    `<section data-view="new" hidden class="flex flex-col gap-[18px]">${sideHead("신규 메뉴 등록", 1, " · 저장 전")}` +
    ui.field("서비스 코드", ro(s.code)) +
    ui.field(
      "상위 메뉴",
      stack(
        ui.textField({ value: "", readonly: true, "data-f": "parent" }),
        `<span data-f="hide" hidden>${help("상위가 사용중지라 사용자에게는 보이지 않습니다.")}</span>`,
        self(ui.button("최상위 메뉴로 바꾸기", { variant: "off", "data-top": true })),
        self(ui.button("되돌리기", { variant: "off", "data-back": true })),
        `<span data-f="root" hidden>${help("고른 메뉴가 없어 최상위에 등록합니다.")}</span>`,
      ),
    ) +
    ui.formRow(ui.field(`메뉴 코드 ${help("자동 채번")}`, ro(NEXT_CODE)), ui.field("메뉴 순서", ui.textField({ value: "", readonly: true, "data-f": "order" }))) +
    help("코드는 저장할 때 확정됩니다. 순서는 상위 메뉴의 맨 끝이고, 저장 뒤 트리에서 옮깁니다.") +
    nameFields("", "", true, `new-${key}`, true) +
    `<div class="flex justify-end gap-[6px]">${ui.button("취소", { variant: "off", "data-cancel": true })}${ui.button("저장", { "data-save": true })}</div>` +
    help("저장한 메뉴는 권한 관리의 메뉴 등록 팝업에 바로 나타납니다. 권한은 거기서 따로 줍니다.") +
    `</section>`;

  return (
    (s.off ? band("사용중지 서비스입니다 — 메뉴는 편집할 수 있지만 사용자 화면에는 보이지 않습니다") : "") +
    `<div class="flex items-start gap-[24px]">` +
    `<section class="flex min-w-0 flex-1 flex-col gap-[12px]">${ui.sectionHead(
      `메뉴 트리 <span class="text-[14px] font-normal text-erp-label">${nodes.length}개 · 상위 메뉴 · 순서대로 · 최대 3단계</span>`,
      dim(ui.button("신규 메뉴", { "data-new": key })),
    )}${table}${
      s.count > nodes.length ? help(`… 외 ${s.count - nodes.length}개 메뉴 · 목업 표본에서 생략`) : ""
    }${help("손잡이를 끌어 같은 서비스 안에서 순서·상위 메뉴·단계를 바꿉니다. 행의 위·아래 끝에 놓으면 그 앞·뒤로, 가운데에 놓으면 그 메뉴 안 맨 끝으로 들어갑니다. 하위 메뉴는 함께 움직이고, 사용중지 메뉴는 흐리게 보입니다. 상위 메뉴가 사용중지면 그 아래 메뉴도 사용자 화면에 나오지 않습니다 — 하위의 사용 상태는 그대로 두어 상위를 다시 켜면 돌아옵니다.")}</section>` +
    `<div class="flex w-[440px] shrink-0 flex-col" data-side="${key}" data-roots="${sibs(null).length}" data-next="${NEXT_CODE}">` +
    nodes.map(detailOf).join("") +
    empty +
    form +
    `</div></div>`
  );
}

// 오른쪽 칸 바꾸기(이 화면 전용 — 공통 erp.js 는 건드리지 않는다).
// 줄을 누르면 그 메뉴 상세, 같은 줄을 다시 누르면 고른 것을 푼다. 신규 메뉴를 누르면 같은 칸이 등록 양식이 되고,
// 트리의 새 자리(고른 메뉴 맨 끝, 3단계를 고르면 그 상위 맨 끝)에 ‘작성 중’ 줄이 선다. 취소·저장하면 상세로 돌아간다(데모라 트리에 넣지는 않는다).
const MENU_SCRIPT = `<script>
(() => {
  const SEL = "bg-erp-thead-bg";
  document.querySelectorAll("[data-side]").forEach((side) => {
    const key = side.dataset.side;
    const rows = [...document.querySelectorAll('[data-row="' + key + '"]')];
    const body = rows[0].parentElement;
    const newBtn = document.querySelector('[data-new="' + key + '"]');
    const form = side.querySelector('[data-view="new"]');
    const f = (k) => form.querySelector('[data-f="' + k + '"]');
    const name = form.querySelector("[data-new-name]");
    const top = form.querySelector("[data-top]");
    const back = form.querySelector("[data-back]");
    const first = rows.find((r) => r.classList.contains(SEL));
    let cur = first ? first.dataset.code : null;
    let draft = null, from = null;
    const show = (v) => side.querySelectorAll("[data-view]").forEach((el) => (el.hidden = el.dataset.view !== v));
    const mark = () => rows.forEach((r) => r.classList.toggle(SEL, !draft && r.dataset.code === cur));
    const parentOf = (r) => {
      for (let i = rows.indexOf(r) - 1; i >= 0; i--) if (+rows[i].dataset.lvl < +r.dataset.lvl) return rows[i];
      return null;
    };
    const end = () => {
      if (draft) draft.remove();
      draft = null;
      newBtn.disabled = false;
      mark();
      show(cur || "empty");
    };
    // 새 자리: 상위 줄(p)의 마지막 하위 다음, 상위가 없으면 트리 맨 끝
    const place = (p) => {
      if (draft) draft.remove();
      const lvl = p ? +p.dataset.lvl + 1 : 1;
      const order = p ? +p.dataset.kids + 1 : +side.dataset.roots + 1;
      draft = document.createElement("tr");
      draft.className = "h-[46px] border-b border-erp-thead-line bg-erp-thead-bg";
      draft.innerHTML =
        '<td class="px-[10px] text-center"></td>' +
        '<td class="truncate px-[10px] text-left"><span style="padding-left:' + (lvl - 1) * 18 + 'px"><b class="font-semibold" data-draft-name></b> <span class="text-[13px] text-erp-label">작성 중</span></span></td>' +
        '<td class="px-[10px] text-center">' + side.dataset.next + '</td><td class="px-[10px] text-left">—</td>' +
        '<td class="px-[10px] text-center">' + order + '</td><td class="px-[10px] text-center text-[13px] text-erp-label">저장 전</td>';
      draft.querySelector("[data-draft-name]").textContent = name.value.trim() || "새 메뉴";
      let at = null;
      if (p) {
        let j = rows.indexOf(p) + 1;
        while (j < rows.length && +rows[j].dataset.lvl > +p.dataset.lvl) j++;
        at = rows[j] || null;
      }
      body.insertBefore(draft, at);
      f("lvl").textContent = lvl;
      f("parent").value = p ? p.dataset.label : "없음 · 최상위(1단계) 메뉴";
      f("order").value = order;
      f("hide").hidden = !(p && p.hasAttribute("data-hides"));
      top.hidden = !p;
      back.hidden = !!p || !from;
      if (from) back.textContent = "‘" + from.dataset.name + "’ 아래로 되돌리기";
      f("root").hidden = !!p || !!from;
    };
    rows.forEach((r) =>
      r.addEventListener("click", () => {
        if (draft) end();
        cur = cur === r.dataset.code ? null : r.dataset.code;
        mark();
        show(cur || "empty");
      }),
    );
    newBtn.addEventListener("click", () => {
      const c = rows.find((r) => r.dataset.code === cur) || null;
      from = c && +c.dataset.lvl >= 3 ? parentOf(c) : c;
      name.value = "";
      place(from);
      newBtn.disabled = true;
      mark();
      show("new");
      name.focus();
    });
    name.addEventListener("input", () => {
      if (draft) draft.querySelector("[data-draft-name]").textContent = name.value.trim() || "새 메뉴";
    });
    top.addEventListener("click", () => place(null));
    back.addEventListener("click", () => place(from));
    form.querySelector("[data-cancel]").addEventListener("click", end);
    form.querySelector("[data-save]").addEventListener("click", end);
  });
})();
</script>`;

export const render = ({ A, R }, { master = true } = {}) => {
  const tab = (k) => `${SVC[k].name}&nbsp;${sub(SVC[k].count)}${SVC[k].off ? `&nbsp;${ui.badge("off", "사용중지")}` : ""}`;
  const body = ui.detailBody(
    x.tabs([
      { id: "services", label: "서비스 목록", html: services() },
      { id: "erp", label: tab("erp"), html: treeTab("erp", SVC.erp) },
      { id: "plat", label: tab("plat"), html: treeTab("plat", SVC.plat) },
      { id: "resv", label: tab("resv"), html: treeTab("resv", SVC.resv) },
    ]),
  );
  return {
    title: "플랫폼 메뉴 관리",
    html: ui.erpFrame({ header: platformHeader(A, R, { master }), title: "플랫폼 메뉴 관리", body }) + MENU_SCRIPT,
  };
};

export default (ctx) => render(ctx);
