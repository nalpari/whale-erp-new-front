// BP 관리자 관리 목록(앱 src/app/bp-admins/ admins-screen · admin-filter · admin-table). BP 마스터로 본 것.
// 상세 · 등록 · 수정은 따로 화면이 없고 이 목록 위 슬라이드 패널로만 연다(앱과 같다, 2026-10-30 「front대로」 재영) — 조각은 src/admin-parts.mjs.
// render 의 detail 은 상세 패널에 싣는 견본 계정(목록의 어느 이름을 눌러도 그 상세가 열린다), open 은 화면을 열 때 차례로 누를 버튼 id 다
// (config/admins-*.html 이 저마다 견본 상태의 패널을 열어 둔다). 역할 · 계정상태 체크박스는 목록을 실제로 거른다.
import * as ui from "../../ui.mjs";
import { erpHeader } from "../../site.mjs";
import { storeFilter } from "../../store-filter.mjs";
import { DETAILS, GROUPS, adminDetailPanel, adminEditPanel, adminNewPanel } from "../../admin-parts.mjs";

const UNSENT = "unsent";
// [아이디, 이름, 역할, 권한명 · 코드, 계정상태, 대상점포, 최근 로그인(null 은 로그인한 적 없음, UNSENT 는 초기 비밀번호 메일 실패)] — 등록일시 최신순
const ADMINS = [
  ["hgpay", "장하린", "BP관리자", "정산 조회 · BA000005", "사용", "2", UNSENT],
  ["hgcs", "문가은", "BP관리자", "고객응대 · BA000006", "사용", "전체", null],
  ["moricd", "윤재희", "가맹관리자", "모리 매니저 · FA000003", "사용", "2", "2026-09-18 22:41"],
  ["ongids", "서동현", "가맹관리자", "온기 점장 · FA000004", "미사용", "1", "2026-06-12 21:15"],
  ["moriyn", "한지수", "가맹관리자", "모리 점장 · FA000002", "사용", "1", "2026-09-21 07:58"],
  ["hgacct", "최민호", "BP관리자", "정산 조회 · BA000005", "미사용", "전체", "2026-03-31 18:10"],
  ["ongifm", "오태민", "가맹마스터", "가맹 마스터(고정) · FM000001", "사용", "3", "2026-09-19 20:02"],
  ["hghr", "이서아", "BP관리자", "인사 담당 · BA000004", "사용", "6", "2026-09-20 17:55"],
  ["morinam01", "박서윤", "가맹마스터", "가맹 마스터(고정) · FM000001", "사용", "4", "2026-09-21 09:12"],
  ["hgops", "김도윤", "BP관리자", "운영 총괄 · BA000003", "사용", "전체", "2026-09-21 08:30"],
];
const ROLES = Object.keys(GROUPS);

// 빈 문구 3종(앱 admin-table.tsx) — 계정상태를 다 끈 이유가 먼저다
const EMPTY = {
  status: "선택한 계정상태가 없어 표시할 관리자 계정이 없습니다. 계정상태를 하나 이상 선택해 주세요.",
  role: "선택한 역할이 없어 표시할 관리자 계정이 없습니다. 역할을 하나 이상 선택해 주세요.",
  none: "조건에 맞는 관리자 계정이 없습니다.",
};

export const render = ({ A, R }, { title = "BP 관리자 관리", detail = "hghr", open = [], edit = {}, newOpts = {} } = {}) => {
  // 권한명 선택지 — 켠 역할의 것만(아래 스크립트가 숨긴다)
  const groupSel = ui
    .select(["전체", ...ROLES.flatMap((r) => GROUPS[r])], { "aria-label": "권한명", "data-group-filter": true })
    .replace(/<option( selected)?>([^<]*)<\/option>/g, (m, sel, t) => {
      const role = ROLES.find((r) => GROUPS[r].includes(t));
      return role ? `<option data-role="${role}"${sel ?? ""}>${t}</option>` : m;
    });
  const filter = ui.filterPanel(A, [
    ui.filterSection("점포", storeFilter(A), { tight: true }),
    ui.filterSection("아이디 · 이름", ui.searchField(A, { placeholder: "아이디 또는 이름 일부", label: "아이디 · 이름" }), { tight: true }),
    ui.filterSection("역할", ROLES.map((r) => ui.checkbox(A, r, true, { "data-role-filter": r })).join(""), { tight: true }),
    ui.filterSection("권한명", groupSel, { tight: true }),
    ui.filterSection("계정상태", ["사용", "미사용"].map((s) => ui.checkbox(A, s, true, { "data-status-filter": s })).join(""), { last: true }),
  ]);

  const cols = [
    { header: "아이디", width: "w-[180px]" },
    { header: "이름", width: "w-[220px]" },
    { header: "역할", width: "w-[120px]" },
    { header: "대상점포", width: "w-[110px]" },
    { header: "권한명 · 코드", align: "left" },
    { header: "계정상태", width: "w-[100px]" },
    { header: "최근 로그인" },
  ];
  const rows = ADMINS.map(([id, name, role, group, state, stores, login]) => {
    const [g, code] = group.split(" · ");
    return [
      id,
      `<button type="button" id="admin-open-${id}" aria-controls="admin-detail-panel" aria-expanded="false" class="max-w-full truncate text-erp-link hover:underline">${name}</button>`,
      role,
      stores,
      `<span class="truncate">${g} <span class="text-[12px] text-erp-muted">· ${code}</span></span>`,
      ui.badge(state === "사용" ? "on" : "off", state),
      // 사용 계정의 메일 실패는 빨간 글자, 로그인한 적 없으면 회색 「-」
      login === UNSENT ? (state === "사용" ? '<span class="text-erp-off">초기화 비밀번호 미발송</span>' : '<span class="text-erp-muted">-</span>') : (login ?? '<span class="text-erp-muted">-</span>'),
    ];
  });
  // 줄마다 거를 값을 달고, 미사용은 흐리게(이름 링크 · 배지는 제 색), 상세를 연 줄은 표 머리 바탕(앱 rowState selected)
  let n = -1;
  const table = ui
    .dataTable(cols, rows, EMPTY.none)
    .replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, () => {
      const [, , role, , state] = ADMINS[++n];
      return `<tr data-role="${role}" data-status="${state}" class="h-[46px] border-b border-erp-thead-line has-aria-expanded:bg-erp-thead-bg${state === "미사용" ? " text-erp-muted" : ""}">`;
    })
    .replace("</tbody>", ui.tableEmptyRow(cols, "").replace("<tr ", "<tr data-empty hidden ") + "</tbody>");

  const toolbar = ui.listToolbar(ADMINS.length, `<div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div>`);
  const d = DETAILS[detail];

  return {
    title,
    html: ui.erpFrame({
      header: erpHeader(A, R),
      title: "BP 관리자 관리",
      titleRight: ui.button("등록", { id: "admin-new-open", "aria-expanded": "false", "aria-controls": "admin-new-panel" }),
      body: ui.listBody(filter, toolbar + table + `<div class="pt-[14px]">${ui.pagination(A, 1, 1)}</div>`) + FILTER_SCRIPT,
      panels:
        adminNewPanel(A, R, newOpts) +
        adminDetailPanel(A, R, detail) +
        (d.canUpdate ? adminEditPanel(A, R, detail, edit) : "") +
        (open.length ? `<script>addEventListener("load",()=>${JSON.stringify(open)}.forEach((id)=>document.getElementById(id)?.click()));</script>` : ""),
    }),
  };
};

// 역할 · 계정상태로 줄을 거르고 건수 · 빈 문구를 바꾼다. 끈 역할의 권한명은 선택지에서 숨기고, 골라 둔 것이면 「전체」로 돌린다
const FILTER_SCRIPT = `<script>(()=>{const roles=[...document.querySelectorAll("[data-role-filter]")],states=[...document.querySelectorAll("[data-status-filter]")],sel=document.querySelector("[data-group-filter]"),rows=[...document.querySelectorAll("tr[data-role]")],empty=document.querySelector("tr[data-empty]"),total=document.querySelector("main p b"),E=${JSON.stringify(
  EMPTY,
)};const on=(list,k)=>list.filter((b)=>b.checked).map((b)=>b.dataset[k]);const sync=()=>{const r=on(roles,"roleFilter"),s=on(states,"statusFilter");for(const o of sel.options){if(!o.dataset.role)continue;o.hidden=!r.includes(o.dataset.role);if(o.hidden&&o.selected)sel.selectedIndex=0;}let n=0;rows.forEach((tr)=>{const show=r.includes(tr.dataset.role)&&s.includes(tr.dataset.status);tr.hidden=!show;n+=show;});total.textContent=n;empty.hidden=n>0;empty.firstElementChild.textContent=!s.length?E.status:!r.length?E.role:E.none;};[...roles,...states].forEach((b)=>b.addEventListener("change",sync));})();</script>`;

export default (ctx) => render(ctx);
