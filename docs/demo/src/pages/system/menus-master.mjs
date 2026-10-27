// 플랫폼 메뉴 관리(플랫폼 마스터 기준). 목업 docs/mockup/system/menus.html 의 「등록·수정」 권한 = 플랫폼 마스터로 본 것.
// 끌기 손잡이·신규 메뉴·저장·위치 옮기기가 있고 상세를 고칠 수 있다. 신규 메뉴 등록과 수정은 목업처럼 트리 오른쪽 칸에서 한다.
// 메뉴 삭제 버튼과 변경 이력은 목업처럼 두지 않는다(명세가 둘 다 제외) — 안 쓰는 메뉴는 미사용으로 돌린다.
// 관리자 기준 menus.mjs 도 목업 기본 권한(등록·수정)에 맞춰 이 화면을 헤더만 바꿔 그린다.
// 서비스별 트리는 탭으로 고른다. 서비스 목록은 두지 않고 첫 탭(Whale ERP)의 메뉴가 처음 보인다(2026-10-08).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { platformHeader } from "../../site.mjs";

const sub = (t) => `<span class="text-erp-label">${t}</span>`;
// 아래 셋은 1팀 컴포넌트에 없어 토큰으로 그렸다(admins-new·codes 와 같은 모양).
const req = (label) => `${label} <span class="text-[#e93737]">*</span>`; // #e93737: DESIGN.md 위험 글자색
const help = (t) => `<span class="text-[13px] leading-[1.5] text-erp-label">${t}</span>`;
const handle = '<span title="끌어서 옮기기" aria-label="끌어서 옮기기" class="cursor-grab text-[16px] text-erp-label">≡</span>';
const stack = (...c) => `<div class="flex flex-col gap-[8px]">${c.join("")}</div>`;
const ro = (value) => ui.textField({ value, readonly: true });
// 사용 상태 고르기(목업 seg) — 라디오 둘
const useRadios = (name, on) => `<div role="radiogroup" class="flex h-[34px] items-center gap-[18px]">${ui.radio("사용", name, on)}${ui.radio("미사용", name, !on)}</div>`;
const useBadge = (on) => (on ? ui.badge("on", "사용") : ui.badge("off", "미사용"));
// 앱 공통 Tag 와 같은 꼬리표
const UPPER_OFF_TAG = '<span class="inline-block rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub">상위 미사용</span>';

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
      ["MN000012", 2, "BP 관리자 관리", "/bp-admins", 1],
      ["MN000013", 2, "BP 권한 그룹 관리", "/bp-role-groups", 1],
      ["MN000014", 2, "BP 공통코드 관리", "/bp-code-groups", 1],
      ["MN000015", 2, "BP 휴일 관리", "/bp-holidays", 1],
    ],
  },
  plat: {
    code: "PLATFORM", name: "Whale ERP 플랫폼 관리", count: 22, first: "MN000214",
    src: [
      ["MN000201", 1, "회원관리", "", 0],
      ["MN000202", 2, "회원 정보 관리", "", 0],
      ["MN000203", 1, "BP 마스터 계정 관리", "/bp-masters", 1],
      ["MN000204", 1, "서비스정산관리", "", 0],
      ["MN000205", 2, "부가서비스 주문 내역", "", 0],
      ["MN000206", 2, "부가서비스 정산", "", 0],
      ["MN000207", 1, "부가서비스관리", "", 0],
      ["MN000208", 2, "부가 서비스 정보 관리", "", 0],
      ["MN000209", 1, "프로모션관리", "", 0],
      ["MN000210", 2, "쿠폰 관리", "", 0],
      ["MN000211", 2, "포인트 관리", "", 0],
      ["MN000212", 1, "시스템관리", "", 1],
      ["MN000213", 2, "플랫폼 관리자 관리", "/platform-admins", 1],
      ["MN000214", 2, "플랫폼 권한 관리", "/platform-role-groups", 1],
      ["MN000215", 2, "플랫폼 메뉴 관리", "/platform-menus", 1],
      ["MN000216", 2, "플랫폼 공통코드 관리", "/code-groups", 1],
      ["MN000217", 2, "플랫폼 휴일 관리", "/public-holidays", 1],
      ["MN000218", 1, "커뮤니티관리", "", 1],
      ["MN000219", 2, "공지사항", "/platform-notices", 1],
      ["MN000220", 2, "FAQ", "/platform-faqs", 1],
      ["MN000221", 2, "문의사항", "/platform-inquiries", 1],
      ["MN000222", 2, "도입문의", "/platform-leads", 1],
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


// 서비스 하나의 트리 + 오른쪽 칸(메뉴 상세·수정 / 신규 메뉴 등록 / 위치 옮기기)
// 목업처럼 등록과 수정 모두 오른쪽 칸에서 한다 — 따로 열리는 패널이 없다. 칸 바꾸기는 아래 MENU_SCRIPT 가 한다.
// 메뉴 코드는 서비스를 가리지 않고 가장 큰 번호의 다음을 저장할 때 매긴다(api) — 등록 양식에는 미리 보이지 않는다(2026-10-16).
const NEXT_CODE = "자동 채번";
// 등록 알림의 메뉴 코드 — 서비스를 가리지 않고 가장 큰 번호(표본 MN000303)의 다음
const CREATED_CODE = "MN000304";
// 갈 수 없는 쪽·작성 중에 누를 수 없는 버튼은 흐리게(1팀 버튼에 비활성 모양이 없어 덧붙인다)
const dim = (b) => b.replace('class="', 'class="disabled:pointer-events-none disabled:opacity-40 ');
// 오른쪽 칸 제목 — 제목 뒤 4px 띄워 단계(앱 menu-side.tsx heading 과 같다, 2026-10-26)
const sideHead = (title, lvl) =>
  `<h2 class="text-[18px] font-semibold text-erp-ink">${title} <span class="ml-[4px] text-[14px] font-normal text-erp-label"><span data-f="lvl">${lvl}</span>단계</span></h2>`;
// 두 카드 껍데기(앱 components/site/side-parts.tsx 의 CARD 와 같다)
const CARD = "flex min-h-0 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0";

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
  // 자기나 그 위가 미사용이면 그 아래 메뉴는 사용자에게 보이지 않는다
  const hides = (n) => {
    for (let q = n; q; q = q.parent) if (!q.use) return true;
    return false;
  };
  const sel = null; // 처음 진입은 고른 메뉴 없이 오른쪽에 안내를 보인다(2026-10-08)

  const rows = nodes.map((n) => [
    handle,
    `<span style="padding-left:${(n.lvl - 1) * 18}px">${n.lvl === 1 ? `<b class="font-semibold">${n.name}</b>` : n.name}${n.kids ? ` <span class="text-[13px] text-erp-label">묶음</span>` : ""}</span>`,
    n.code,
    sub(`${n.lvl}단계`),
    n.url || '<span class="text-erp-muted">—</span>', // 빈 URL 은 옅은 줄표(앱 menus-screen.tsx 와 같다, 2026-10-26)
    n.order,
    // 위 단계가 미사용이면 자기 값 배지 옆에 회색 꼬리표 「상위 미사용」(앱 menus-screen.tsx 와 같다, 2026-10-27 사용자 지정)
    `<span class="inline-flex items-center gap-[6px]">${useBadge(n.use)}${n.parent && hides(n.parent) ? UPPER_OFF_TAG : ""}</span>`,
  ]);
  const cols = [
    { header: "이동", width: "w-[56px]" },
    { header: "메뉴명", align: "left", width: "w-[250px]" }, // 폭을 안 주면 남는 칸을 다 먹어 메뉴코드 칸과 벌어진다(사용자 지적, 2026-10-26)
    { header: "메뉴 코드", width: "w-[110px]" },
    { header: "메뉴단계", width: "w-[90px]" },
    { header: "메뉴 URL", align: "left", width: "w-[240px]" },
    { header: "순서", width: "w-[60px]" },
    { header: "사용여부", width: "w-[180px]" }, // 「사용 + 상위 미사용」이 한 줄에 들게(앱과 같다, 2026-10-27)
  ];
  // 줄마다 스크립트가 읽을 단서를 단다 — 이 줄 아래에 새 메뉴를 만들 때의 단계·상위 표시·순서
  let i = -1;
  // 머리는 권한별 메뉴설정 팝업과 같은 색(erp-subtle 바탕 · 600 먹색, 앱 DataTable headVariant subtle — 2026-10-26)
  const table = ui
    .dataTable(cols, rows)
    .replace('<tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">', '<tr class="h-[42px] border-y border-erp-thead-line bg-erp-subtle">')
    .replaceAll('class="px-[10px] font-medium text-erp-thead-text"', 'class="px-[10px] font-semibold text-erp-ink"')
    .replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, () => {
    const n = nodes[++i];
    // 1단계 줄은 권한별 메뉴설정 팝업과 같은 바탕(2026-10-26 사용자 지정)
    // 고른 줄은 한 단계 어두운 바탕 + 왼쪽 브랜드색 3px 선(앱 DataTable current 와 같다, 2026-10-26)
    const cls = ["cursor-pointer", n === sel ? "bg-erp-subtle [&>td:first-child]:shadow-[inset_3px_0_0_var(--color-erp-brand)]" : n.lvl === 1 ? "bg-erp-thead-bg" : "", n.use ? "" : "text-erp-muted"].filter(Boolean).join(" ");
    return `<tr class="h-[46px] border-b border-erp-thead-line ${cls}" data-row="${key}" data-code="${n.code}" data-lvl="${n.lvl}" data-name="${n.name}" data-label="${n.code} · ${path(n)}" data-kids="${n.kids}"${hides(n) ? " data-hides" : ""}>`;
  });

  // 라벨 · 입력 예시는 앱 menu-side.tsx 그대로 — 메뉴명 예시는 등록에만, URL 예시는 등록 · 수정 모두(2026-10-26)
  // 미사용 안내 빨간 박스는 use 값(처음 그릴 때 상태)에 맞춰서만 보인다 — 데모는 라디오를 눌러도 다시 그리지
  // 않아 앱처럼 그 자리에서 즉시 뜨고 꺼지지는 않는다(사용자 지정, 2026-10-26 · 앱 menu-side.tsx 와 같은 문구).
  const kidsWarn = (kids) =>
    kids ? `<br>하위 메뉴 ${kids}개도 함께 표시되지 않습니다. 하위 메뉴의 사용여부는 바뀌지 않아, 다시 '사용'으로 바꾸면 하위 메뉴도 그대로 보입니다.` : "";
  const useWarn = (kids) => `<div class="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] text-erp-off">미사용으로 변경하면 사용자 화면과 [권한관리 &gt; 메뉴 설정]에 표시되지 않습니다.<br>다시 '사용'으로 변경하면 기존 설정값이 그대로 적용됩니다.${kidsWarn(kids)}</div>`;
  const nameFields = (name, url, use, id, isNew, kids = 0) =>
    ui.field(req("메뉴명"), ui.textField({ value: name, placeholder: isNew ? "예: 플랫폼 배치 관리" : undefined, "data-new-name": isNew })) +
    ui.field("메뉴 URL (선택)", ui.textField({ value: url, placeholder: "예: /staff-content" })) +
    `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">사용여부</span>${useRadios(id, use)}${use ? "" : useWarn(kids)}</div>`;

  // 메뉴 하나의 수정 칸. 고른 줄의 것만 보인다(위치 옮기기는 두지 않는다 · 2026-10-08).
  // [저장]은 칸을 하나라도 고쳐야 켜지고 저장하면 「수정되었습니다.」(앱 menu-side.tsx 의 isDirty · toast 와 같다, 2026-10-26 · erp.js data-dirty-save)
  const detailOf = (n) => {
    const p = n.parent;
    return (
      `<section data-view="${n.code}" data-dirty-scope class="flex flex-col gap-[18px]"${n === sel ? "" : " hidden"}>${sideHead("메뉴 수정", n.lvl)}` +
      ui.field("서비스 코드", ro(s.code)) +
      ui.field("상위 메뉴", ro(p ? `${p.code} · ${path(p)}` : "없음 · 최상위(1단계) 메뉴")) +
      ui.formRow(ui.field("메뉴 코드", ro(n.code)), ui.field("메뉴 순서", ro(String(n.order)))) +
      nameFields(n.name, n.url, n.use, `use-${key}-${n.code}`, false, nodes.filter((m) => { for (let q = m; q.parent; q = q.parent) { if (!q.use) return false; if (q.parent === n) return true; } return false; }).length) +
      `<div class="flex justify-end gap-[6px]">${ui.button("저장", { "data-dirty-save": true, "data-toast": "수정되었습니다.", disabled: true })}</div>` +
      `</section>`
    );
  };

  // 아무것도 고르지 않았을 때
  const empty =
    `<section data-view="empty"${sel ? " hidden" : ""} class="flex flex-col gap-[18px]"><h2 class="text-[18px] font-semibold text-erp-ink">메뉴 수정</h2>` +
    `<div class="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted"><p>왼쪽 메뉴 트리에서 [메뉴명]을 클릭하면 상세 정보가 표시됩니다.</p><div class="mt-[12px]"><p>신규 메뉴는 [등록] 버튼을 클릭하여 추가할 수 있습니다.</p><p>메뉴를 선택하지 않고 [등록]하면 최상위(1단계) 메뉴로 등록됩니다.</p></div></div></section>`;

  // 신규 메뉴 등록 — 상위 메뉴·단계·순서는 스크립트가 고른 줄을 보고 채운다
  const form =
    `<section data-view="new" hidden class="flex flex-col gap-[18px]">${sideHead("메뉴 등록", 1)}` +
    ui.field("서비스 코드", ro(s.code)) +
    ui.field(
      "상위 메뉴",
      stack(
        ui.textField({ value: "", readonly: true, "data-f": "parent" }),
        `<span data-f="hide" hidden></span>`,
        `<span data-f="root" hidden></span>`,
      ),
    ) +
    ui.formRow(ui.field("메뉴 코드", ui.textField({ value: "", placeholder: "저장 시 자동채번", readonly: true })), ui.field("메뉴 순서", ui.textField({ value: "", readonly: true, "data-f": "order" }))) +
    nameFields("", "", true, `new-${key}`, true) +
    // 등록 알림은 앱 menu-side.tsx 문구 그대로(2026-10-26)
    `<div class="flex justify-end gap-[6px]">${ui.button("취소", { variant: "off", "data-cancel": true })}${ui.button("저장", { "data-save": true, "data-toast": `등록했습니다. 메뉴 코드 ${CREATED_CODE} — 권한은 플랫폼 권한 관리 목록의 메뉴설정 [설정]에서 줍니다.` })}</div>` +
    `</section>`;

  // 트리 카드(남는 폭) + 오른쪽 카드(464px)를 12px 띄워 나란히 — 앱 menus-screen.tsx 와 같다(2026-10-26, 전엔 카드 하나 안에 24px 간격).
  // 트리는 남는 높이를 채우고 머리 줄을 고정한 채 아래만 스크롤한다(앱 DataTable scroll). 카드의 [&>*]:shrink-0 를 이 칸만 푼다.
  // [등록]은 제목 줄로 옮겼다(앱과 같다) — 트리 머리에는 제목 · 건수만
  return (
    `<section class="${CARD} min-w-0 flex-1" aria-label="메뉴 트리"><div class="flex items-end gap-[6px]"><h2 class="text-[18px] font-semibold text-erp-ink">메뉴 트리 <span class="ml-[6px] text-[14px] font-normal text-erp-label">${nodes.length}개</span></h2></div>` +
    `<div class="relative flex min-h-0 flex-1 shrink! flex-col">${ui.scrollTable(table)}</div>${
      s.count > nodes.length ? help(`… 외 ${s.count - nodes.length}개 메뉴 · 목업 표본에서 생략`) : ""
    }</section>` +
    `<section class="${CARD} w-[464px] shrink-0" data-side="${key}" data-roots="${sibs(null).length}" data-next="${NEXT_CODE}">` +
    nodes.map(detailOf).join("") +
    empty +
    form +
    `</section>`
  );
}

// 오른쪽 칸 바꾸기(이 화면 전용 — 공통 erp.js 는 건드리지 않는다).
// 줄을 누르면 그 메뉴 상세, 같은 줄을 다시 누르면 고른 것을 푼다. 신규 메뉴를 누르면 같은 칸이 등록 양식이 되고,
// 트리의 새 자리(고른 메뉴 맨 끝, 3단계를 고르면 그 상위 맨 끝)에 ‘작성 중’ 줄이 선다. 취소·저장하면 상세로 돌아간다(데모라 트리에 넣지는 않는다).
const MENU_SCRIPT = `<script>
(() => {
  // 고른 줄 표시 — 1단계 줄 바탕(bg-erp-thead-bg)과 겹치지 않게 다른 바탕 + 왼쪽 선(앱 DataTable current 와 같다)
  const SEL = "bg-erp-subtle";
  const BAR = "[&>td:first-child]:shadow-[inset_3px_0_0_var(--color-erp-brand)]";
  document.querySelectorAll("[data-side]").forEach((side) => {
    const key = side.dataset.side;
    const rows = [...document.querySelectorAll('[data-row="' + key + '"]')];
    const body = rows[0].parentElement;
    // [등록]은 제목 줄에 하나 — 보이는 서비스 탭의 칸만 받는다(2026-10-26)
    const newBtn = document.querySelector("[data-new]");
    const panel = side.closest('[role="tabpanel"]');
    const form = side.querySelector('[data-view="new"]');
    const f = (k) => form.querySelector('[data-f="' + k + '"]');
    const name = form.querySelector("[data-new-name]");
    const first = rows.find((r) => r.classList.contains(SEL));
    let cur = first ? first.dataset.code : null;
    let draft = null, from = null;
    const show = (v) => side.querySelectorAll("[data-view]").forEach((el) => (el.hidden = el.dataset.view !== v));
    const mark = () =>
      rows.forEach((r) => {
        const on = !draft && r.dataset.code === cur;
        r.classList.toggle(SEL, on);
        r.classList.toggle(BAR, on);
        r.classList.toggle("bg-erp-thead-bg", !on && r.dataset.lvl === "1");
      });
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
        '<td class="px-[10px] text-center">' + side.dataset.next + '</td><td class="px-[10px] text-center text-erp-label">' + lvl + '단계</td><td class="px-[10px] text-left"><span class="text-erp-muted">—</span></td>' +
        '<td class="px-[10px] text-center">' + order + '</td><td class="px-[10px] text-center text-erp-muted">—</td>';
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
      if (panel && panel.hidden) return;
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
    // 다른 서비스 탭으로 가면 작성 중인 새 메뉴를 버린다(앱 handleServiceSelect 와 같다)
    document.querySelectorAll('[role="tab"]').forEach((t) => t.addEventListener("click", () => draft && end()));
    form.querySelector("[data-cancel]").addEventListener("click", end);
    form.querySelector("[data-save]").addEventListener("click", end);
  });
})();
</script>`;

export const render = ({ A, R }, { master = true } = {}) => {
  const tab = (k) => `${SVC[k].name}&nbsp;${sub(SVC[k].count)}${SVC[k].off ? `&nbsp;${ui.badge("off", "미사용")}` : ""}`;
  // 서비스 탭은 카드 밖, 그 아래 탭 패널이 두 카드를 가로로 놓는다(앱 menus-screen.tsx 와 같다, 2026-10-26)
  const tabs = x
    .tabs([
      { id: "erp", label: tab("erp"), html: treeTab("erp", SVC.erp) },
      { id: "plat", label: tab("plat"), html: treeTab("plat", SVC.plat) },
      { id: "resv", label: tab("resv"), html: treeTab("resv", SVC.resv) },
    ])
    .replace(/(<div role="tabpanel"[^>]*?class=")flex min-h-0 flex-1 flex-col gap-\[12px\]"/g, '$1flex min-h-0 flex-1 gap-[12px]"');
  const body = `<div class="flex min-h-0 flex-1 flex-col gap-[12px] p-[24px]">${tabs}</div>`;
  return {
    title: "플랫폼 메뉴 관리",
    html:
      ui.erpFrame({
        header: platformHeader(A, R, { master }),
        title: "플랫폼 메뉴 관리",
        titleRight: dim(ui.button("등록", { "data-new": true })), // 제목 줄 오른쪽(앱 menus-screen.tsx PageBar, 2026-10-23)
        body,
      }) + MENU_SCRIPT,
  };
};

export default (ctx) => render(ctx);
