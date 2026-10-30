// BP 관리자 관리(config/admins*)만 쓰는 조각. 앱 src/app/bp-admins/ 의 상세 · 등록 · 수정 슬라이드 패널을 옮겼다(2026-10-30 「front대로」 재영).
// 상세 · 등록 · 수정은 따로 화면이 없고 목록 위 슬라이드 패널로만 연다(앱과 같다) — config/admins-*.html 은 목록에 그 패널을 열어 둔 견본 상태다.
// 데모는 BP 마스터(정하윤)로 본다. 역할 한글은 공통코드 ROLE_TYPE 그대로 붙여 쓴다(BP관리자 · 가맹마스터 · 가맹관리자).
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import * as c from "./config-parts.mjs";
import { STORES, link } from "./site.mjs";
import { statusBadge } from "./store-parts.mjs";
import { group as fieldGroup } from "./biz-form.mjs";

// 역할별 권한명 · 코드(권한 그룹 관리 견본과 같다)
export const GROUPS = {
  BP관리자: ["운영 총괄 · BA000003", "인사 담당 · BA000004", "정산 조회 · BA000005", "고객응대 · BA000006", "점포 조회 전용 · BA000007"],
  가맹마스터: ["가맹 마스터(고정) · FM000001"],
  가맹관리자: ["모리 점장 · FA000002", "모리 매니저 · FA000003", "온기 점장 · FA000004"],
};
const store = (code) => {
  const s = STORES.find((r) => r[0] === code);
  return [s[1], s[0], s[3]]; // [점포명, 점포코드, 점포상태]
};

// 상세를 여는 견본 계정. 목록의 다른 줄도 그 화면의 상세 패널을 연다(견본은 화면마다 하나).
// unsent: 초기 비밀번호 메일 실패 · login null: 로그인한 적 없음 · all: 전체 점포 · master: 가맹 관리자의 연결 가맹마스터
// canUpdate: BP 마스터가 고칠 수 있는가(가맹 관리자는 연결된 가맹마스터만 고친다) — 고칠 수 없으면 초기화 버튼도 없다
export const DETAILS = {
  hghr: {
    loginId: "hghr",
    name: "이서아",
    role: "BP관리자",
    group: "인사 담당 · BA000004",
    phone: ["010", "2290", "5173"],
    email: "seoa.lee@hangang.co.kr",
    login: "2026-09-20 17:55",
    created: ["2025-04-01 09:12", "정하윤"],
    updated: ["2026-02-03 15:10", "정하윤"],
    stores: ["ST000001", "ST000002", "ST000003", "ST000004", "ST000005", "ST000006"].map(store),
    canUpdate: true,
    // 목업 admins-detail.html 변경이력 팝업과 같다 — 변경자는 이름, 비밀번호 줄은 「초기화」 · 「강제 변경」(발송 결과 · 값은 남기지 않는다)
    history: [
      ["2026-06-18 17:40", "이서아", "비밀번호", "", "강제 변경"],
      ["2026-06-18 17:25", "정하윤", "비밀번호", "", "초기화"],
      ["2026-02-03 15:10", "정하윤", "점포", "일부 · ST000001~002", "일부 · ST000001~006"],
      ["2025-09-15 11:02", "정하윤", "권한 그룹", `정산 조회 ${c.muted("BA000005")}`, `인사 담당 ${c.muted("BA000004")}`],
      ["2025-04-01 09:12", "정하윤", "계정", "", `사용 · BP 관리자 · 정산 조회 ${c.muted("BA000005")}`],
    ],
  },
  hgpay: {
    loginId: "hgpay",
    name: "장하린",
    role: "BP관리자",
    group: "정산 조회 · BA000005",
    phone: ["010", "4127", "8830"],
    email: "harin.jang@hangang.co.kr",
    login: null,
    unsent: true,
    created: ["2026-10-28 14:05", "정하윤"],
    updated: null,
    stores: ["ST000005", "ST000006"].map(store),
    canUpdate: true,
    history: [["2026-10-28 14:05", "정하윤", "계정", "", `사용 · BP 관리자 · 정산 조회 ${c.muted("BA000005")}`]],
  },
  hgcs: {
    loginId: "hgcs",
    name: "문가은",
    role: "BP관리자",
    group: "고객응대 · BA000006",
    phone: ["010", "3308", "6214"],
    email: "gaeun.moon@hangang.co.kr",
    login: null,
    all: true,
    created: ["2026-09-21 10:30", "정하윤"],
    updated: null,
    stores: [],
    canUpdate: true,
    history: [["2026-09-21 10:30", "정하윤", "계정", "", `사용 · BP 관리자 · 고객응대 ${c.muted("BA000006")} · 전체 점포`]],
  },
  moriyn: {
    loginId: "moriyn",
    name: "한지수",
    role: "가맹관리자",
    group: "모리 점장 · FA000002",
    phone: ["010", "6614", "2087"],
    email: "jisu.han@morinam.kr",
    login: "2026-09-21 07:58",
    created: ["2025-08-11 10:05", "박서윤"],
    updated: null,
    stores: ["ST000006"].map(store),
    master: ["morinam01", "박서윤"],
    canUpdate: false,
    history: [["2025-08-11 10:05", "박서윤", "계정", "", `사용 · 가맹 관리자 · 모리 점장 ${c.muted("FA000002")}`]],
  },
  morinam01: {
    loginId: "morinam01",
    name: "박서윤",
    role: "가맹마스터",
    group: "가맹 마스터(고정) · FM000001",
    phone: ["010", "5521", "3380"],
    email: "seoyun.park@morinam.kr",
    login: "2026-09-21 09:12",
    created: ["2025-03-03 11:00", "정하윤"],
    updated: ["2025-08-01 14:20", "정하윤"],
    stores: ["ST000005", "ST000006", "ST000007", "ST000008"].map(store),
    canUpdate: true,
    // 미사용으로 저장하면 함께 멈추는 가맹 관리자(앱 update-impact) — 첫 아이디와 수
    linked: ["moricd", 2],
    history: [["2025-03-03 11:00", "정하윤", "계정", "", `사용 · 가맹 마스터 · 가맹 마스터(고정) ${c.muted("FM000001")}`]],
  },
};
const groupName = (g) => g.split(" · ")[0];

// 안내 상자(앱 side-parts.tsx WarnBand · InfoBand · SuccessBand). 줄바꿈은 \n(whitespace-pre-line)
const warnBand = (t) => `<div class="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] whitespace-pre-line text-erp-off">${t}</div>`;
const infoBand = (t, a = "") => `<div${a} class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-ink">${t}</div>`;
const successBand = (t) => `<div class="rounded-[2px] border border-erp-on bg-erp-on-bg px-[16px] py-[12px] text-[14px] whitespace-pre-line text-erp-on">${t}</div>`;
// 칸 오류 문구(앱 FieldMessage)
const fieldMessage = (t) => `<p role="alert" class="text-[13px] leading-[1.5] text-erp-off">${t}</p>`;

// ── 상세(앱 admin-detail-panel.tsx) ──
function detailBody(A, R, key) {
  const d = DETAILS[key];
  const resetId = x.dialogId();
  const histId = x.dialogId();
  const dash = c.muted("-");
  const canReset = d.canUpdate;
  const when = ([at, who]) => `<span class="truncate">${at} <span class="text-erp-label">· ${who}</span></span>`;

  // 이름 아랫줄에 「역할 | 권한명 | 상태 배지」 — 제목(h2)은 이름만
  const head = `<div class="flex flex-col items-start gap-[6px]"><h2 class="text-[18px] font-semibold text-erp-ink">${d.name}</h2><span class="text-[14px]">${c.headValues([
    ["역할", d.role],
    ["권한명", groupName(d.group)],
    ["", ui.badge("on", "사용")],
  ])}</span></div>`;

  // 안내 상자 묶음(10px 간격). 본인 계정 「내 계정입니다.」는 가맹 마스터 · 가맹 관리자가 자기 계정을 볼 때라 BP 마스터로 보는 데모에는 없다.
  // 「초기화 비밀번호를 발송했습니다.」는 이 상세에서 방금 초기화했거나 만든 지 1시간 안일 때 — 데모 견본에는 없다
  const boxes = [
    d.unsent ? warnBand(`초기화 비밀번호가 발송되지 않았습니다.${canReset ? "\n비밀번호 [초기화] 버튼을 눌러 다시 발송해 주세요." : ""}`) : "",
    d.role === "가맹관리자" && !d.canUpdate ? warnBand('이 계정은 <strong class="font-semibold">[연결된 가맹마스터]</strong>만 수정할 수 있습니다.') : "",
    !d.unsent && !d.login ? successBand(`아직 로그인하지 않은 계정입니다.${canReset ? "\n비밀번호 초기화가 필요합니다." : ""}`) : "",
  ].join("");

  const info = ui.detailTable("기본정보", [
    ["아이디", d.loginId],
    ["이름", d.name],
    ["연락처", d.phone.join("-")],
    ["이메일", d.email],
    // 미사용 · 본인 · 초기화 권한 없음이면 「-」
    ["비밀번호", canReset ? x.dialogTrigger("초기화", resetId, "soft") : dash],
    ["최근 로그인", d.login ?? dash],
    ["등록", when(d.created)],
    ["최종수정", d.updated ? when(d.updated) : dash],
    ...(d.master ? [["연결 가맹마스터", `<span>${d.master[0]}<span class="text-erp-label"> · ${d.master[1]}</span></span>`]] : []),
  ]);

  // 대상점포 — 열 이름 줄 없는 표(headVariant none). 전체 점포면 안내 두 줄, 여섯 개부터 다섯 줄 높이 안에서 스크롤
  const many = d.stores.length > 5;
  const table = ui
    .dataTable(
      [{ header: "점포명", align: "left" }, { header: "점포코드", width: "w-[110px]" }, { header: "점포 상태", width: "w-[90px]" }],
      d.stores.map(([n, code, state]) => [n, `<span class="text-[12px] text-erp-muted">${code}</span>`, statusBadge(state)]),
      "매핑된 점포가 없습니다.",
    )
    .replace("<thead>", '<thead class="sr-only">')
    .replace('class="w-full table-fixed border-collapse border-x', 'class="w-full table-fixed border-collapse border-t border-x');
  const scope = d.all ? `전체 점포 · 지금 ${STORES.length}개점` : `일부 점포 · ${d.stores.length}개점`;
  const storesHead = `<h3 class="flex h-[42px] items-center rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink"><span class="flex items-baseline gap-[10px]">대상점포<span class="text-[14px] font-normal text-erp-label">${scope}</span></span></h3>`;
  const storesBody = d.all
    ? `<div class="rounded-b-[2px] border border-erp-thead-line px-[16px] py-[14px] text-[14px] text-erp-label"><p>소속BP의 모든 점포를 관리합니다.</p><p>신규 등록된 점포도 관리 대상에 자동으로 포함됩니다.</p></div>`
    : many
      ? `<div class="relative"><div class="max-h-[231px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">${table}</div><span aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden [scrollbar-gutter:stable]"><span class="absolute inset-x-0 top-0 h-px bg-erp-thead-line"></span><span class="absolute inset-x-0 bottom-0 h-px bg-erp-thead-line"></span></span></div>`
      : table;
  const stores = `<section class="flex flex-col">${many ? `<div class="overflow-hidden [scrollbar-gutter:stable]">${storesHead}</div>` : storesHead}${storesBody}</section>`;

  const resetDialog = canReset
    ? x.dialog(
        resetId,
        "비밀번호를 초기화하시겠습니까?",
        `<div class="flex flex-col gap-[12px] break-keep">${c.kv([["아이디", d.loginId], ["이름", d.name], ["이메일", d.email]], 60)}${warnBand(
          "비밀번호 초기화 시 새로운 비밀번호가 등록된 이메일로 발송됩니다.\n새 비밀번호는 1시간 동안 유효하며, 로그인 시 변경해야 합니다.\n기존 비밀번호는 즉시 사용할 수 없게 됩니다.",
        )}</div>`,
        ui.button("취소", { variant: "off", "data-close": true }) + ui.button("초기화", { "data-close": true }),
        "w-[480px]",
      )
    : "";

  // 변경이력(앱 platform-admins/history-dialog.tsx) — 폭 760, 쪽 넘기기는 10건 넘을 때만이라 견본에는 없다
  const history = ui.dataTable(
    [
      { header: "변경일시", width: "w-[140px]" },
      { header: "변경자", width: "w-[80px]" },
      { header: "항목", width: "w-[120px]", align: "left" },
      { header: "변경 전", align: "left" },
      { header: "변경 후", align: "left" },
    ],
    d.history,
    "변경이력이 없습니다.",
  );
  const historyDialog = x
    .dialog(histId, "변경이력", `<div class="flex flex-col gap-[12px]">${history}</div>`, ui.button("닫기", { variant: "off", "data-close": true }))
    .replace("w-[420px]", "w-[760px] max-h-[calc(100dvh-48px)] overflow-y-auto");

  const edit = d.canUpdate ? ui.button("수정", { id: "admin-edit-open", "aria-expanded": "false", "aria-controls": "admin-edit-panel" }) : "";
  const buttons = `<div class="flex flex-wrap items-center gap-[6px] pt-[8px]">${ui.button("닫기", { variant: "off", "data-close": true })}<span class="flex-1"></span>${edit}${x.dialogTrigger("변경이력", histId, "soft")}</div>`;

  return head + (boxes ? `<div class="flex flex-col gap-[10px]">${boxes}</div>` : "") + info + stores + buttons + resetDialog + historyDialog;
}

export const adminDetailPanel = (A, R, key) => ui.slidePanel("admin-detail-panel", "관리자 상세", detailBody(A, R, key));

// ── 등록 · 수정(앱 admin-form-panel.tsx) ──
// 점포 찾기 후보 — 폐점 점포는 api 가 주지 않아 후보에 없다(흐리게 두지 않는다)
const BULK = [...STORES].sort((a, b) => a[1].localeCompare(b[1])).map(([code, name, type]) => [name, code, type]);

// 점포 고르기. [전체 제거]는 보통 Soft 버튼(고른 점포가 없으면 막힘), blocked 면 계정 역할을 고르기 전이라 찾기 · 일괄 검색을 막는다
function picker(A, picked, blocked = false) {
  let h = c
    .storePicker(A, { clearLabel: "전체 제거", bulk: BULK, picked: picked.map(([n, code]) => [n, code, STORES.find((s) => s[0] === code)[2]]) })
    .replace(
      /<button type="button" data-spick-clear[^>]*>전체 제거<\/button>/,
      `<span class="ml-auto">${ui.button("전체 제거", { variant: "soft", "data-spick-clear": true, "data-spick-clear-empty": true, disabled: !picked.length })}</span>`,
    );
  if (blocked) h = h.replace('placeholder="점포명 또는 점포코드"', 'placeholder="계정역할을 먼저 선택하세요." disabled').replace(/(<button type="button" data-spick-open="[^"]*")/, "$1 disabled");
  return h;
}

// 입력칸 + 그 아래 오류 문구(앱 Labeled)
const labeled = (field, message = "", width = "") => `<div class="flex flex-col gap-[8px] ${width ? `shrink-0 ${width}` : "min-w-px flex-1"}">${field}${message}</div>`;
// 라벨 옆 짧은 도움말 칸(앱 HintedField) — 범위
const hinted = (label, hint, control) =>
  `<label class="flex flex-col justify-center gap-[8px]"><span class="flex min-w-0 items-baseline gap-[10px] text-[14px] font-medium text-erp-label"><span class="shrink-0">${label}</span><span data-scope-hint class="truncate text-[13px] font-normal"${hint ? "" : " hidden"}>${hint}</span></span>${control}</label>`;
const scopeHint = (role) => (role === "가맹마스터" || role === "가맹관리자" ? `${role}는 '일부 점포'만 선택할 수 있습니다.` : "");

// 계정 역할 · 권한명 한 줄(기본정보 맨 아래). roleControl: 등록은 선택칸, 수정은 읽기 전용 칸
function roleRow(R, role, group, { roleControl, noRoleGroup = false, required = true }) {
  const groups = GROUPS[role] ?? [];
  // 권한명이 하나뿐이면 골라 둔다(앱 withRole). 고르지 않았으면 맨 위에 「선택」 · 역할 전이면 「계정역할을 먼저 선택하세요.」
  const picked = group || (groups.length === 1 ? groups[0] : "");
  const options = [...(picked ? [] : [role ? "선택" : "계정역할을 먼저 선택하세요."]), ...(noRoleGroup ? [] : groups)];
  const groupField = ui.field(required ? c.req("권한명") : "권한명", ui.select(options, { value: picked || options[0], disabled: !role, "data-admin-group": true }));
  const message = noRoleGroup
    ? `<span class="flex items-center gap-[10px]">${fieldMessage("선택할 수 있는 권한명이 없습니다. 먼저 권한명을 등록해 주세요.")}${ui.button("이동", { variant: "soft", href: link(R, "config/roles.html") })}</span>`
    : "";
  return `<div class="flex w-full items-start gap-[6px]">${labeled(roleControl, "", "w-[130px]")}${labeled(groupField, message)}</div>`;
}

// 대상점포 묶음 — 범위 + 점포 고르기(전체 점포면 erp.js 가 숨긴다) + 범위 밖 매핑 표
function storesGroup(A, role, { all = false, picked = [], outOfScope = [], scopeRequired = true }) {
  const allowsAll = role === "BP관리자";
  const scopeSel = ui.select(["전체 점포", "일부 점포"], { value: all ? "전체 점포" : "일부 점포", disabled: !allowsAll, "data-spick-scope": true });
  const out = outOfScope.length
    ? `<div class="flex flex-col gap-[8px]"><p class="text-[14px] font-medium text-erp-ink">범위 밖 매핑 <span class="font-normal text-erp-label">${outOfScope.length}개점</span></p>${c.note(
        "내 관리 범위 밖이라 여기서 빼거나 바꿀 수 없습니다. 저장해도 그대로 남습니다.",
      )}${ui.dataTable(
        [{ header: "점포명", align: "left" }, { header: "점포코드", width: "w-[100px]" }, { header: "상태", width: "w-[80px]" }],
        outOfScope.map(([n, code, state]) => [n, code, statusBadge(state)]),
      )}</div>`
    : "";
  return ui.formGroup("대상점포", hinted(scopeRequired ? c.req("범위") : "범위", scopeHint(role), scopeSel), picker(A, picked, !role), ...(out ? [out] : []));
}

// 막힌 선택칸만 회색(앱 [&_select:disabled]:bg-erp-thead-bg)
const formWrap = (...groups) => `<div class="flex flex-col gap-[24px] [&_select:disabled]:bg-erp-thead-bg">${groups.join("")}</div>`;

// 등록. role: 처음 고른 계정 역할(빈 값이면 「선택」), taken: 아이디 · 이메일 중복 문구를 칸 아래에 보인 상태
// 가맹 마스터가 등록할 때(계정 역할 가맹관리자 고정 읽기 전용)는 BP 마스터로 보는 데모라 두지 않는다
export function adminNewPanel(A, R, { role = "", group = "", noRoleGroup = false, values = {}, taken = false } = {}) {
  const v = { loginId: "", name: "", phone: ["010", "", ""], email: "", ...values };
  const roleSel = ui.field(c.req("계정 역할"), ui.select(["선택", "BP관리자", "가맹마스터"], { value: role || "선택", "data-admin-role": true }));
  const basic = ui.formGroup(
    "기본정보",
    labeled(
      ui.field(c.req("아이디"), ui.textField({ value: v.loginId, maxlength: 20, placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요.", "aria-invalid": taken ? "true" : null, autocomplete: "off" })),
      taken ? fieldMessage("이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.") : "",
    ),
    labeled(ui.field(c.req("이름"), ui.textField({ value: v.name, maxlength: 20, placeholder: "한글 또는 영문 2~20자" }))),
    labeled(fieldGroup(c.req("연락처"), c.tel(...v.phone))),
    labeled(
      ui.field(c.req("이메일"), ui.textField({ type: "email", value: v.email, maxlength: 100, "aria-invalid": taken ? "true" : null })),
      taken ? fieldMessage("이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요.") : "",
    ),
    roleRow(R, role, group, { roleControl: roleSel, noRoleGroup }),
  );
  // 저장하면 등록 패널을 닫고 상세 패널을 연다(erp.js data-save-panel). 권한명이 없으면 저장할 수 없다
  const save = ui.button("저장", { "data-save-panel": "admin-detail-panel", disabled: noRoleGroup });
  const body =
    ui.sectionHead("관리자 등록") +
    formWrap(basic, storesGroup(A, role, {})) +
    c.note("초기화 비밀번호는 등록한 이메일로 발송됩니다.") +
    c.buttons(ui.button("취소", { variant: "off", "data-close": true }), save) +
    // 권한명이 없는 상태는 고른 역할을 바꿔도 그대로 둔다(그 상태를 보이려는 화면이라)
    (noRoleGroup ? "" : ROLE_SCRIPT);
  return ui.slidePanel("admin-new-panel", "관리자 등록", body);
}

// 계정 역할을 고르면 권한명 선택지 · 범위 · 점포 찾기를 바꾼다(앱 changeRole · withRole — 고른 점포는 비운다)
const ROLE_SCRIPT = `<script>(()=>{const p=document.getElementById("admin-new-panel"),r=p.querySelector("[data-admin-role]"),g=p.querySelector("[data-admin-group]"),sc=p.querySelector("[data-spick-scope]"),hint=p.querySelector("[data-scope-hint]"),box=p.querySelector("[data-spick]"),find=box.querySelector("[data-spick-find] input"),bulk=box.querySelector("[data-spick-open]"),G=${JSON.stringify(
  GROUPS,
)};r.addEventListener("change",()=>{const v=r.value==="선택"?"":r.value,list=G[v]||[],all=v==="BP관리자";g.innerHTML=(list.length===1?"":"<option>"+(v?"선택":"계정역할을 먼저 선택하세요.")+"</option>")+list.map((o)=>"<option>"+o+"</option>").join("");g.disabled=!v;if(!all)sc.value="일부 점포";sc.disabled=!all;sc.dispatchEvent(new Event("change"));hint.hidden=!v||all;hint.textContent=v+"는 '일부 점포'만 선택할 수 있습니다.";find.disabled=bulk.disabled=!v;find.placeholder=v?"점포명 또는 점포코드":"계정역할을 먼저 선택하세요.";box.querySelector("[data-spick-list]").innerHTML="";box.querySelector("[data-spick-count]").textContent="0개점";box.querySelector("[data-spick-none]").hidden=false;box.querySelector("[data-spick-clear]").disabled=true;});})();</script>`;

// 수정. status: 처음 고른 계정상태(가맹 마스터 미사용 견본은 「미사용」), outOfScope: 내 관리 범위 밖에 이미 매핑된 점포
export function adminEditPanel(A, R, key, { status = "사용", outOfScope = [] } = {}) {
  const d = DETAILS[key];
  const inactive = status === "미사용";
  const fm = d.role === "가맹마스터";
  const outCodes = outOfScope.map((s) => s[1]);
  const cascadeId = fm && d.linked ? x.dialogId() : "";

  const basic = ui.formGroup(
    "기본정보",
    labeled(ui.field(c.req("이름"), ui.textField({ value: d.name, maxlength: 20, placeholder: "한글 또는 영문 2~20자" }))),
    labeled(fieldGroup(c.req("연락처"), c.tel(...d.phone))),
    labeled(ui.field(c.req("이메일"), ui.textField({ type: "email", value: d.email, maxlength: 100 }))),
    ui.field(c.req("계정상태"), ui.select(["사용", "미사용"], { value: status, "data-admin-status": true })),
    // 가맹 마스터를 미사용으로 고르면 함께 멈추는 가맹 관리자(앱 deactivationImpact)
    cascadeId
      ? infoBand(
          `<p>가맹 마스터를 미사용으로 저장하면 연결된 가맹 관리자 계정도 함께 멈춥니다.</p><p class="font-normal text-erp-label">가맹 관리자 ${andOthers(d.linked)} → 미사용</p>`,
          ` data-when-inactive${inactive ? "" : " hidden"}`,
        )
      : "",
    roleRow(R, d.role, d.group, { roleControl: ui.field("계정 역할", ui.textField({ value: d.role, readonly: true })) }),
  );

  // 함께 바뀌는 가맹 관리자가 있으면 [저장]이 확인창을 먼저 연다(아래 스크립트가 계정상태에 따라 바꾼다)
  const save = ui.button("저장", { "data-admin-save": true, "data-save-panel": "admin-detail-panel", "data-cascade": cascadeId || null });
  const cascade = cascadeId
    ? x.dialog(
        cascadeId,
        "가맹 마스터를 미사용으로 저장",
        `<div class="flex flex-col gap-[12px] break-keep"><dl class="grid grid-cols-[84px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]"><dt class="text-erp-label">대상</dt><dd>${d.loginId} ${d.name} · ${d.role}</dd><dt class="text-erp-label">함께 미사용</dt><dd>가맹 관리자 ${andOthers(d.linked)}</dd></dl>` +
          `<p class="text-[13px] text-erp-label">아이디는 첫 계정만 보입니다.</p>` +
          `<p>함께 미사용이 되는 계정의 로그인이 막힙니다. 열려 있는 세션은 닫지 않습니다. 나중에 가맹 마스터를 사용으로 돌려도 가맹 관리자는 미사용으로 남습니다.</p>` +
          `<p>가맹 관리자 변경이력에는 저장하는 사람이 처리자로 남고, 변경 후 값에 사유가 붙습니다.</p></div>`,
        ui.button("취소", { variant: "off", "data-close": true }) + ui.button("미사용으로 저장", { "data-close": true }),
        "w-[480px]",
      )
    : "";

  const title = `관리자 수정<span class="ml-[6px] inline-flex">${c.tag(`아이디 · <b class="font-semibold">${d.loginId}</b>`)}</span>`;
  const body =
    ui.sectionHead(title) +
    formWrap(basic, storesGroup(A, d.role, { all: d.all, picked: d.stores.filter((s) => !outCodes.includes(s[1])), outOfScope, scopeRequired: !fm })) +
    // 사용 계정을 미사용으로 고르면 [취소][저장] 위 안내
    c.note("미사용으로 변경하면 해당 계정의 로그인 및 서비스 접근이 즉시 차단됩니다.<br>단, 현재 로그인 중인 세션은 유지됩니다.").replace("<p ", `<p data-when-inactive${inactive ? "" : " hidden"} `) +
    c.buttons(ui.button("취소", { variant: "off", "data-close": true }), save) +
    cascade +
    STATUS_SCRIPT;
  return ui.slidePanel("admin-edit-panel", "관리자 수정", body);
}
const andOthers = ([first, count]) => `${first}${count > 1 ? ` 외 ${count - 1}명` : ""}`;

// 계정상태를 바꾸면 미사용 안내를 보이고 숨긴다. 연쇄 확인창이 있으면 미사용일 때만 [저장]이 그 창을 연다
const STATUS_SCRIPT = `<script>(()=>{const p=document.getElementById("admin-edit-panel"),s=p.querySelector("[data-admin-status]"),b=p.querySelector("[data-admin-save]");const sync=()=>{const off=s.value==="미사용";p.querySelectorAll("[data-when-inactive]").forEach((e)=>(e.hidden=!off));if(b.dataset.cascade){if(off){b.dataset.dialog=b.dataset.cascade;delete b.dataset.savePanel;}else{delete b.dataset.dialog;b.dataset.savePanel="admin-detail-panel";}}};s.addEventListener("change",sync);sync();})();</script>`;
