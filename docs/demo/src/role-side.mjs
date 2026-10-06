// 플랫폼 권한 관리의 오른쪽 칸(권한 상세·수정 / 신규 권한 등록). roles.mjs(플랫폼 관리자)·roles-master.mjs(플랫폼 마스터)가 함께 쓴다.
// 목업 docs/mockup/system/roles.html 처럼 등록과 수정 모두 오른쪽 칸에서 한다 — 따로 열리는 패널이 없다.
// 목록 줄을 누르면 그 권한 상세가, 신규 등록을 누르면 같은 칸이 등록 양식이 된다. 칸 바꾸기는 ROLE_SCRIPT 가 한다.
import * as ui from "./ui.mjs";
import { req } from "./biz-form.mjs";
import * as x from "./extra.mjs";

const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
const help = (t) => `<span class="text-[13px] leading-[1.5] text-erp-label">${t}</span>`;
const sub = (t) => `<span class="text-erp-label">${t}</span>`;
const band = (t) => `<div class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-ink">${t}</div>`;

// 고정 권한마다 상세 표에 더 보이는 줄(목업 kv)
const EXTRA = {
  PM000001: [["메뉴 권한", `전체 메뉴 허용으로 고정 ${sub("· 조회만")}`]],
};

// 목록 표의 줄에 고른 권한을 가리키는 단서를 단다. 고른 줄은 바탕을 깐다.
export function tagRows(table, roles, selected) {
  let n = -1;
  return table.replace(/<tr class="h-\[46px\] border-b border-erp-thead-line">/g, () => {
    const code = roles[++n][1];
    return `<tr class="h-[46px] cursor-pointer border-b border-erp-thead-line${code === selected ? " bg-erp-thead-bg" : ""}" data-role-row="${code}">`;
  });
}

// 신규 등록 버튼(목록 머리 오른쪽)
export const newButton = () => ui.button("신규 등록", { "data-role-new": true }).replace('class="', 'class="disabled:pointer-events-none disabled:opacity-40 ');

// roles: [권한유형, 코드, 권한명, 구분, 설명, 최종수정일시, 수정자, 등록일, 등록자, 소속 고정 권한(추가 권한만), 기본 서비스, 아래 권한 그룹]
// own: 보는 사람에게 연결된 권한(고칠 수 없다). master: 플랫폼 마스터로 보는지(추가 권한 삭제가 있다). del: { 권한코드: 삭제 확인창 id }
export function roleSide({ roles, own, master, selected, del = {}, card }) {
  const view = (r) => {
    const [type, code, name, kind, desc, mod, modBy, reg, regBy, , , lower] = r;
    const locked = code === own;
    const rows = [["권한유형", type]];
    rows.push(["권한코드", code], ...(EXTRA[code] || []), ["등록", ui.detailValues([reg, sub(regBy)])], ["최종 수정", ui.detailValues([mod, sub(modBy)])]);
    const fields = locked
      ? ui.field("권한명", ui.textField({ value: name, readonly: true })) + ui.field("설명", ui.textarea({ rows: 4, value: desc, readonly: true }))
      : ui.field(req("권한명"), ui.textField({ value: name })) + ui.field("설명", ui.textarea({ rows: 4, value: desc }));
    const canDelete = master && kind === "추가";
    const foot = locked
      ? ""
      : `<div class="flex gap-[6px]">${canDelete ? x.dialogTrigger("삭제", del[code], "soft") : ""}<span class="flex-1"></span>${ui.button("저장")}</div>`;
    const notes = [];
    if (kind === "고정") notes.push("고정 권한은 삭제 항목이 없습니다. 플랫폼 관리자 유형의 권한만 삭제할 수 있습니다.");
    else if (!master) notes.push("권한 관리 메뉴의 삭제 권한이 없어 삭제 항목이 보이지 않습니다.");
    if (lower && !locked) notes.push(`이 권한의 메뉴 설정이 ${lower}의 상한이 됩니다. 메뉴등록은 권한 관리 메뉴의 수정 권한만 있으면 열 수 있습니다.`);
    return (
      `<div data-role-view="${code}" class="flex flex-col gap-[18px]"${code === selected ? "" : " hidden"}>` +
      ui.sectionHead("권한 상세", `<span class="text-[14px] text-erp-label">${kind} 권한${locked ? " · 본인" : ""}</span>`) +
      (locked
        ? band("본인이 연결된 권한이라 고칠 수 없습니다") +
          note(`권한명·설명 수정과 메뉴 권한 저장이 모두 막힙니다. 다른 ${type}${code.startsWith("PM") ? "가" : "나 플랫폼 마스터가"} 처리해야 합니다.`)
        : "") +
      ui.detailTable("기본 정보", rows) +
      `<div class="flex flex-col gap-[18px] pt-[6px]">${fields}</div>` +
      foot +
      notes.map(note).join("") +
      `</div>`
    );
  };

  // 신규 등록 — 마스터 유형 셋이 모두 있어 플랫폼 관리자만 고른다(목업 new 상태)
  const form =
    `<div data-role-view="new" class="flex flex-col gap-[18px]" hidden>` +
    ui.sectionHead("신규 권한 등록", `<span class="text-[14px] text-erp-label">저장 전</span>`) +
    `<div class="flex flex-col gap-[18px]">` +
    ui.field(req("권한유형"), ui.select(["플랫폼 관리자"]) + help("플랫폼 마스터·BP 마스터·가맹 마스터가 모두 등록되어 있어 플랫폼 관리자만 고를 수 있습니다.")) +
    ui.field(`권한코드 ${help("자동 채번")}`, ui.textField({ value: "PA000005", readonly: true }) + help("등록할 때 확정됩니다. 같은 유형을 동시에 등록하면 겹치지 않는 다음 순번이 붙습니다.")) +
    ui.field(req("권한명"), ui.textField({ placeholder: "예: 프로모션 담당", "data-role-name": true })) +
    ui.field("설명", ui.textarea({ rows: 4, placeholder: "이 권한으로 맡길 업무를 적습니다" })) +
    `</div>` +
    `<div class="flex justify-end gap-[6px]">${ui.button("취소", { variant: "off", "data-role-cancel": true })}${ui.button("등록", { "data-role-save": true })}</div>` +
    note("등록한 뒤 목록의 메뉴등록에서 메뉴별 권한을 정합니다. 설정하는 사람 본인이 가진 메뉴·CRUD 안에서만 고를 수 있습니다.") +
    `</div>`;

  return `<section class="${card} w-[464px] shrink-0" data-role-side>${roles.map(view).join("")}${form}</section>` + ROLE_SCRIPT;
}

// 오른쪽 칸 바꾸기(이 화면 전용 — 공통 erp.js 는 건드리지 않는다).
// 줄을 누르면 그 권한 상세. 신규 등록을 누르면 등록 양식이 되고 목록의 고른 줄 표시가 풀린다. 취소·등록하면 고르던 권한으로 돌아간다(데모라 목록에 넣지는 않는다).
const ROLE_SCRIPT = `<script>
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
    show(cur);
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
