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

// 등록 버튼(목록 머리 오른쪽)
export const newButton = () => ui.button("등록", { "data-role-new": true }).replace('class="', 'class="disabled:pointer-events-none disabled:opacity-40 ');

// roles: [권한유형, 코드, 권한명, 구분, 설명, 최종수정일시, 수정자, 등록일, 등록자, 소속 고정 권한(추가 권한만), 기본 서비스, 아래 권한 그룹]
// own: 보는 사람에게 연결된 권한(고칠 수 없다). master: 플랫폼 마스터로 보는지(추가 권한 삭제가 있다). del: { 권한코드: 삭제 확인창 id }
export function roleSide({ roles, own, master, selected, del = {}, card }) {
  const view = (r) => {
    const [type, code, name, kind, desc, mod, modBy, reg, regBy] = r;
    const locked = code === own;
    // BP 권한 그룹 수정과 같은 모양(2026-10-08): 제목 옆에 권한코드 · 권한유형, 입력칸 아래 제목 없는 표에 등록일시 · 최종수정일시.
    // 본인 권한은 고칠 수 없어 권한 상세로 두고 권한명 · 설명을 표에 싣는다.
    const rows = [
      ...(locked ? [["권한명", name], ["설명", desc || c.muted("—")]] : []),
      ["등록일시", `${reg} ${c.muted(`| ${regBy}`)}`],
      ["최종수정일시", `${mod} ${c.muted(`| ${modBy}`)}`],
    ];
    const fields = locked ? "" : `<div class="flex flex-col gap-[18px]">${ui.field(req("권한명"), ui.textField({ value: name }))}${ui.field("설명", ui.textarea({ rows: 4, value: desc }))}</div>`;
    const canDelete = master && kind === "추가";
    const foot = locked
      ? ""
      : `<div class="flex gap-[6px]">${canDelete ? x.dialogTrigger("삭제", del[code], "soft") : ""}<span class="flex-1"></span>${ui.button("저장")}</div>`;
    return (
      `<div data-role-view="${code}" class="flex flex-col gap-[18px]"${code === selected ? "" : " hidden"}>` +
      ui.sectionHead(`${locked ? "권한 상세" : "권한 수정"}<span class="ml-[10px] inline-flex items-center gap-[6px] align-middle">${c.muted(code)}${c.tag(type)}</span>`) +
      (locked ? band("본인이 연결된 권한이라 고칠 수 없습니다") : "") +
      fields +
      plainTable(rows) +
      foot +
      `</div>`
    );
  };

  // 신규 등록 — 마스터 유형 셋이 모두 있어 플랫폼 관리자만 고른다(목업 new 상태)
  const form =
    `<div data-role-view="new" class="flex flex-col gap-[18px]" hidden>` +
    ui.sectionHead("권한 등록") +
    `<div class="flex flex-col gap-[18px]">` +
    ui.field(req("권한유형"), ui.select(["플랫폼 관리자"])) +
    ui.field(req("권한명"), ui.textField({ placeholder: "예: 프로모션 담당", "data-role-name": true })) +
    ui.field("설명", ui.textarea({ rows: 4, placeholder: "이 권한으로 맡길 업무를 적습니다" })) +
    `</div>` +
    `<div class="flex justify-end gap-[6px]">${ui.button("취소", { variant: "off", "data-role-cancel": true })}${ui.button("저장", { "data-role-save": true })}</div>` +
    `</div>`;

  // 처음 진입 · 고른 권한 없음 — 메뉴 관리의 빈 상세와 같은 안내(2026-10-08)
  const empty =
    `<div data-role-view="empty" class="flex flex-col gap-[18px]"${selected ? " hidden" : ""}>${ui.sectionHead("권한 수정")}` +
    `<div class="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted"><p>왼쪽 목록에서 권한을 고르면 수정 화면이 여기에 섭니다.</p><p class="text-[13px]">아무것도 고르지 않고 등록을 누르면</p><p class="text-[13px]">플랫폼 관리자 유형의 새 권한을 등록합니다.</p></div></div>`;

  return `<section class="${card} w-[464px] shrink-0" data-role-side>${empty}${roles.map(view).join("")}${form}</section>` + ROLE_SCRIPT;
}

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
      if (e.target.closest("button, a, input, label")) return; // 메뉴등록 버튼은 그대로 확인창을 연다
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
