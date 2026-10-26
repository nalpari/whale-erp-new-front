// 플랫폼 권한 관리의 오른쪽 칸(권한 상세·수정 / 권한 등록). roles.mjs(플랫폼 관리자)·roles-master.mjs(플랫폼 마스터)가 함께 쓴다.
// 목업 docs/mockup/system/roles.html 처럼 등록과 수정 모두 오른쪽 칸에서 한다 — 따로 열리는 패널이 없다.
// 목록 줄을 누르면 그 권한 상세가, 신규 등록을 누르면 같은 칸이 등록 양식이 된다. 칸 바꾸기는 ROLE_SCRIPT 가 한다.
import * as ui from "./ui.mjs";
import { req } from "./biz-form.mjs";
import * as x from "./extra.mjs";
import * as c from "./config-parts.mjs";

const band = (t) => `<div class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-ink">${t}</div>`;

// 제목 없는 상세 표 — 「기본 정보」 같은 제목 줄 없이 항목만(BP 권한 그룹 관리와 같다)
const plainTable = (rows) =>
  ui.detailTable("", rows).replace(/<h3[^>]*><\/h3>/, "").replace('<dl class="flex w-full flex-col">', '<dl class="flex w-full flex-col rounded-t-[2px] border-t border-erp-thead-line">');


// 목록 표의 줄에 고른 권한을 가리키는 단서를 단다. 고른 줄은 바탕을 깐다.
export function tagRows(table, roles, selected) {
  let n = -1;
  return table.replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, () => {
    const code = roles[++n][1];
    return `<tr class="h-[46px] cursor-pointer border-b border-erp-thead-line${code === selected ? " bg-erp-thead-bg" : ""}" data-role-row="${code}">`;
  });
}

// 권한별 메뉴설정 팝업 머리 — 권한유형 · 권한코드 · 권한명 한 줄(앱 role-menu-dialog.tsx 와 같다, 2026-10-26 사용자 지정)
export const roleHead = (type, code, name) =>
  `<div class="flex h-[42px] items-center gap-[10px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px]">` +
  [type && ["권한유형", type, true], ["권한코드", code], ["권한명", name, true]]
    .filter(Boolean)
    .map(([l, v, b]) => `<span class="flex items-center gap-[6px]"><span class="text-erp-label">${l}</span><span${b ? ' class="font-semibold"' : ""}>${v}</span></span>`)
    .join('<span aria-hidden="true" class="h-[11px] w-px bg-[#d9d9d9]"></span>') +
  `</div>`;

// 오른쪽 칸 제목 — 왼쪽 목록 머리(버튼 34px)와 같은 높이로 둬 첫 칸이 표 시작선에 서게 한다(앱과 같다, 2026-10-26 사용자 지정)
export const sideHead = (title) => ui.sectionHead(title).replace('class="flex items-end', 'class="flex min-h-[34px] items-end');

// 권한별 메뉴설정 표 모양(앱 role-menu-dialog.tsx 와 같다, 2026-10-26 사용자 지정) — 머리는 erp-subtle 바탕 · 600 먹색 · 칸 여백 4px,
// 본문 줄은 42px, 1단계 줄에만 회청 바탕. depths: 줄마다 단계
export function depthRows(table, depths) {
  let n = -1;
  return table
    .replace('<tr class="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">', '<tr class="h-[42px] border-y border-erp-thead-line bg-erp-subtle">')
    .replaceAll('class="px-[10px] font-medium text-erp-thead-text"', 'class="px-[4px] font-semibold text-erp-ink"')
    .replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, () =>
      depths[++n] === 1 ? '<tr class="h-[42px] border-b border-erp-thead-line bg-erp-thead-bg">' : '<tr class="h-[42px] border-b border-erp-thead-line">',
    );
}

// 권한별 메뉴설정 표를 머리 표(고정) + 본문 표(스크롤)로 나눈다 — 스크롤바가 머리 아래에서 시작한다(앱 role-menu-dialog.tsx 와 같다,
// 2026-10-26 사용자 지정). 두 칸 모두 스크롤바 자리를 비워 머리 · 본문 열이 어긋나지 않는다. table: ui.dataTable 결과
export function menuScroll(table) {
  const open = table.slice(0, table.indexOf(">") + 1);
  const pick = (tag) => table.slice(table.indexOf(`<${tag}`), table.indexOf(`</${tag}>`) + tag.length + 3);
  const cols = pick("colgroup");
  return (
    `<div class="flex h-[420px] flex-col">` +
    `<div class="shrink-0 overflow-hidden [scrollbar-gutter:stable]">${open}${cols}${pick("thead")}</table></div>` +
    `<div class="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">${open}${cols}${pick("tbody")}</table></div>` +
    `</div>`
  );
}

// 권한 그룹 상세의 고칠 수 없는 값 상자 — MY PAGE 「계정 정보」 모양에서 제목 바만 뺐다(앱 components/common/readonly-card.tsx, 2026-10-26 사용자 지정).
// manager: 가맹마스터 계정 — undefined 면 줄 없음(플랫폼), null 이면 「-」(BP 관리자 그룹), 값이면 가맹 마스터 아이디 · 이름. reg · mod: [일시, 사람]
// 라벨 옆 도움말(?) — 마우스를 올리거나 키보드로 닿으면 안내가 뜬다(앱 components/common/help-tip.tsx 와 같다, 2026-10-26 사용자 지정)
const helpTip = (text, label) =>
  `<span class="group/help relative inline-flex shrink-0"><button type="button" aria-label="${label} 도움말" class="grid size-[16px] place-items-center rounded-full text-erp-muted transition-colors duration-150 group-hover/help:text-erp-brand focus-visible:text-erp-brand"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><rect x="7.3" y="7" width="1.4" height="5" rx="0.7" fill="#fff"/><circle cx="8" cy="4.8" r="0.9" fill="#fff"/></svg></button>` +
  `<span role="tooltip" class="pointer-events-none absolute top-[calc(100%+6px)] left-[-8px] z-10 w-max max-w-[260px] rounded-[2px] border border-[#ebebeb] bg-white px-[12px] py-[8px] text-[13px] leading-[1.5] font-normal break-keep whitespace-normal text-erp-ink opacity-0 shadow-[0_2px_6px_rgba(40,47,55,0.08)] transition-opacity duration-150 group-focus-within/help:opacity-100 group-hover/help:opacity-100">${text}</span></span>`;
const helpField = (label, value, text) =>
  `<div class="flex min-w-px flex-1 flex-col gap-[4px]"><span class="flex min-w-0 items-center gap-[4px]"><span class="truncate text-[14px] font-medium text-erp-label">${label}</span>${helpTip(text, label)}</span><span class="truncate text-[14px] text-erp-ink font-semibold">${value}</span></div>`;
export function recordCard({ manager, reg, mod }) {
  const when = ([at, by]) => `${at} <span class="font-normal text-erp-label">· ${by}</span>`;
  const rows = [
    ...(manager === undefined ? [] : [ui.formRow(helpField("가맹마스터 계정", manager ?? '<span class="font-normal text-erp-muted">-</span>', "가맹관리자 권한을 생성한 가맹마스터의 정보가 표시됩니다."))]),
    ui.formRow(ui.readonlyField("등록", when(reg), true), ui.readonlyField("최종수정", when(mod), true)),
  ];
  return (
    `<div class="flex w-full flex-col gap-[18px] rounded-[2px] border border-erp-thead-line bg-white px-[16px] py-[20px]">${rows.join('<hr class="border-erp-divider">')}</div>`
  );
}

// 등록 버튼(목록 머리 오른쪽)
export const newButton = () => ui.button("등록", { "data-role-new": true }).replace('class="', 'class="disabled:pointer-events-none disabled:opacity-40 ');

// roles: [권한유형, 코드, 권한명, 구분, 설명, 최종수정일시, 수정자, 등록일, 등록자, 소속 고정 권한(추가 권한만), 기본 서비스, 아래 권한 그룹]
// own: 보는 사람에게 연결된 권한(고칠 수 없다). master: 플랫폼 마스터로 보는지(추가 권한 삭제가 있다). del: { 권한코드: 삭제 확인창 id }
export function roleSide({ roles, own, master, selected, del = {}, card }) {
  const view = (r) => {
    const [type, code, name, kind, desc, mod, modBy, reg, regBy] = r;
    const locked = code === own;
    // 제목 옆에 권한유형 · 코드, 입력칸 아래 「등록 정보」 카드(앱과 같다, 2026-10-26).
    // 본인 권한은 고칠 수 없어 권한명 · 설명을 제목 없는 표에 싣는다.
    const rows = locked ? [["권한명", name], ["설명", desc || c.muted("-")]] : [];
    const fields = locked ? "" : `<div class="flex flex-col gap-[18px]">${ui.field(req("권한명"), ui.textField({ placeholder: "권한명을 입력해 주세요. (예: 프로모션 담당자)", value: name }))}${ui.field("설명", ui.textarea({ rows: 2, placeholder: "해당 권한에 대한 역할과 담당 업무를 입력해 주세요.", value: desc }))}</div>`;
    const canDelete = master && kind === "추가";
    const foot = locked
      ? ""
      : `<div class="flex justify-center gap-[6px]">${canDelete ? x.dialogTrigger("삭제", del[code], "soft") : ""}${ui.button("저장")}</div>`;
    return (
      `<div data-role-view="${code}" class="flex flex-col gap-[18px]"${code === selected ? "" : " hidden"}>` +
      sideHead(`권한 그룹 상세<span class="ml-[10px] inline-flex items-center gap-[6px] align-middle">${c.tag(`<span class="font-normal">권한유형 ·</span> <b class="font-semibold">${type}</b>`)}${c.muted(code)}</span>`) +
      (locked ? band("본인이 연결된 권한이라 고칠 수 없습니다") : "") +
      fields +
      (rows.length ? plainTable(rows) : "") +
      recordCard({ reg: [reg, regBy], mod: [mod, modBy] }) +
      foot +
      `</div>`
    );
  };

  // 신규 등록 — 마스터 유형 셋이 모두 있어 플랫폼 관리자만 고른다(목업 new 상태)
  const form =
    `<div data-role-view="new" class="flex flex-col gap-[18px]" hidden>` +
    sideHead("권한 등록") +
    `<div class="flex flex-col gap-[18px]">` +
    ui.field(req("권한유형"), ui.textField({ value: "플랫폼 관리자", readonly: true })) +
    ui.field(req("권한명"), ui.textField({ placeholder: "권한명을 입력해 주세요. (예: 프로모션 담당자)", "data-role-name": true })) +
    ui.field("설명", ui.textarea({ rows: 2, placeholder: "해당 권한에 대한 역할과 담당 업무를 입력해 주세요." })) +
    `</div>` +
    `<div class="flex justify-center gap-[6px]">${ui.button("취소", { variant: "off", "data-role-cancel": true })}${ui.button("저장", { "data-role-save": true })}</div>` +
    `</div>`;

  // 처음 진입 · 고른 권한 없음(2026-10-26 사용자 지정 문구 — 앱 platform-role-groups/role-side.tsx 와 같다. 목록이 빈 경우의 문구는 앱에만 있다)
  const empty =
    `<div data-role-view="empty" class="flex flex-col gap-[18px]"${selected ? " hidden" : ""}>${sideHead("권한 그룹 상세")}` +
    `<div class="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted"><p>왼쪽 목록에서 [권한명]을 클릭하면 상세 정보가 표시됩니다.</p></div></div>`;

  return `<section class="${card} w-[464px] shrink-0" data-role-side>${empty}${roles.map(view).join("")}${form}</section>` + ROLE_SCRIPT;
}

// 메뉴 등록 팝업의 서비스 탭을 가로 스크롤 줄로(2026-10-15). 공통 x.tabs 는 다른 화면도 써서 그 결과의 탭 줄만 바꾼다.
// 사용 중 서비스(공통코드 SERVICE)가 많아도 한 줄을 지키고, 스크롤바는 숨기고, 넘치는 쪽만 끝을 흐리게 한 뒤 ‹ › 를 둔다.
// 탭 전환은 그대로 공통 erp.js 가 한다. 스크롤 · 흐림 · 화살표는 SVC_TABS_SCRIPT 가 맡는다.
const ARROW = "grid h-[42px] w-[28px] shrink-0 place-items-center text-[18px] text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink";
export function scrollTabs(html) {
  return html
    .replace(
      '<div role="tablist" class="flex shrink-0 border-b border-erp-bar-line">',
      // 스크롤바는 잘라낸다 — 안쪽 줄을 42 + 24 높이로 두고(스크롤바는 그 아래 여백에 생긴다) 바깥 42 상자가 넘친 아래를 가린다.
      // 데모 틀이 스크롤바를 얇게 덮어써도 보이지 않는다. 이동은 ‹ › · 휠 · 탭 고르기로 한다.
      `<div class="flex shrink-0 items-stretch border-b border-erp-bar-line" data-svc-scroll><button type="button" tabindex="-1" aria-label="앞 서비스 보기" class="${ARROW}" data-svc-prev hidden>‹</button><div class="h-[42px] min-w-0 flex-1 overflow-hidden"><div role="tablist" aria-label="서비스" class="box-content flex h-[42px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-[24px] [-ms-overflow-style:none] [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden">`,
    )
    .replace(/(<button type="button" role="tab"[^>]*?class=")/g, "$1shrink-0 whitespace-nowrap ")
    .replace('</div><div role="tabpanel"', `</div></div><button type="button" tabindex="-1" aria-label="다음 서비스 보기" class="${ARROW}" data-svc-next hidden>›</button></div><div role="tabpanel"`);
}

export const SVC_TABS_SCRIPT = `<script>
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MASK = {
    left: "linear-gradient(to right, transparent, black 32px)",
    right: "linear-gradient(to left, transparent, black 32px)",
    both: "linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)",
  };
  document.querySelectorAll("[data-svc-scroll]").forEach((box) => {
    const list = box.querySelector('[role="tablist"]');
    const prev = box.querySelector("[data-svc-prev]");
    const next = box.querySelector("[data-svc-next]");
    const measure = () => {
      const left = list.scrollLeft > 1;
      const right = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
      prev.hidden = !left;
      next.hidden = !right;
      const m = left && right ? MASK.both : left ? MASK.left : right ? MASK.right : "";
      list.style.maskImage = m;
      list.style.webkitMaskImage = m;
    };
    // 팝업이 닫혀 있는 동안은 폭이 0 이라, 열려 폭이 생길 때 다시 잰다
    new ResizeObserver(measure).observe(list);
    list.addEventListener("scroll", measure, { passive: true });
    // 가로 휠이 없는 마우스도 넘길 수 있게 세로 휠을 가로로 바꾼다
    // 줄이 실제로 가로로 넘칠 때만 막는다 — 막지 않으면 팝업이 세로로 넘치는 작은 화면에서 팝업까지 내려간다
    list.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      // 그 방향으로 더 갈 수 있을 때만 막는다 — 끝까지 갔으면 휠이 팝업을 세로로 내리게 둔다
      const canMove = e.deltaY > 0 ? list.scrollLeft + list.clientWidth < list.scrollWidth - 1 : list.scrollLeft > 1;
      if (!canMove) return;
      e.preventDefault();
      list.scrollLeft += e.deltaY;
    }, { passive: false });
    const by = (dir) => list.scrollBy({ left: dir * list.clientWidth * 0.6, behavior: reduce ? "auto" : "smooth" });
    prev.addEventListener("click", () => by(-1));
    next.addEventListener("click", () => by(1));
    // 고른 탭은 보이는 자리로 끌어오고, Tab 키는 고른 탭 하나에만 서게 한다(roving tabindex)
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const roving = () => tabs.forEach((t) => (t.tabIndex = t.getAttribute("aria-selected") === "true" ? 0 : -1));
    roving();
    // 주소 해시로 탭이 골라질 때(공통 erp.js 의 load · hashchange)도 Tab 키 자리를 다시 맞춘다
    addEventListener("hashchange", () => requestAnimationFrame(roving));
    addEventListener("load", () => requestAnimationFrame(roving));
    list.addEventListener("click", (e) => {
      const t = e.target.closest('[role="tab"]');
      if (!t) return;
      t.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
      requestAnimationFrame(roving);
    });
    // 좌우 화살표 · Home · End 로 옮겨 고른다
    list.addEventListener("keydown", (e) => {
      const at = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
      const next = e.key === "ArrowRight" ? (at + 1) % tabs.length : e.key === "ArrowLeft" ? (at - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
      if (next < 0) return;
      e.preventDefault();
      tabs[next].click();
      tabs[next].focus();
    });
  });
})();
</script>`;

// 오른쪽 칸 바꾸기(이 화면 전용 — 공통 erp.js 는 건드리지 않는다).
// 줄을 누르면 그 권한 상세. 신규 등록을 누르면 등록 양식이 되고 목록의 고른 줄 표시가 풀린다. 취소·등록하면 고르던 권한으로 돌아간다(데모라 목록에 넣지는 않는다).
export const ROLE_SCRIPT = `<script>
(() => {
  const SEL = "bg-erp-thead-bg";
  const side = document.querySelector("[data-role-side]");
  const rows = [...document.querySelectorAll("[data-role-row]")];
  const newBtn = document.querySelector("[data-role-new]");
  const first = rows.find((r) => r.classList.contains(SEL));
  let cur = first ? first.dataset.roleRow : null;
  let editing = false;
  const show = (v) => side.querySelectorAll("[data-role-view]").forEach((el) => (el.hidden = el.dataset.roleView !== v));
  const mark = () => rows.forEach((r) => r.classList.toggle(SEL, !editing && r.dataset.roleRow === cur));
  const back = () => {
    editing = false;
    newBtn.disabled = false;
    mark();
    show(cur || "empty");
  };
  rows.forEach((r) =>
    r.addEventListener("click", (e) => {
      if (e.target.closest("button, a, input, label")) return; // [메뉴설정] 버튼은 그대로 확인창을 연다
      cur = r.dataset.roleRow;
      back();
    }),
  );
  newBtn.addEventListener("click", () => {
    editing = true;
    newBtn.disabled = true;
    side.querySelector("[data-role-name]").value = "";
    mark();
    show("new");
    side.scrollTop = 0;
    side.querySelector("[data-role-name]").focus();
  });
  side.querySelector("[data-role-cancel]").addEventListener("click", back);
  side.querySelector("[data-role-save]").addEventListener("click", back);
})();
</script>`;
