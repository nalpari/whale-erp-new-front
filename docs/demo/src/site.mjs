// 데모 전체가 같이 쓰는 것: 로그인한 사람, 헤더 메뉴, 범위 선택기 값.
// ERP 화면은 목업의 ERP 콘솔(BP 마스터 기준)을 따른다. 플랫폼 화면은 PLATFORM 쪽을 쓴다.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import * as f from "./biz-form.mjs";

const pages = join(dirname(fileURLToPath(import.meta.url)), "pages");
// 아직 만들지 않은 화면은 # 로 둔다. 링크가 죽은 페이지로 가지 않게.
const to = (R, path) => {
  if (!path) return "#";
  const [file, hash = ""] = path.split("#");
  return existsSync(join(pages, file.replace(/\.html$/, ".mjs"))) ? `${R}${file}${hash && `#${hash}`}` : "#";
};

const ERP_MENUS = [
  ["기초정보관리", [["상품 정보 관리"], ["가격 정보 관리"], ["카테고리 정보 관리"], ["자재 정보 관리"]]],
  ["점포관리", [["점포 정보 관리", "stores/index.html"], ["계약서 템플릿 관리"], ["계약서 관리"], ["시설물 및 장비 관리"], ["점검표 템플릿 관리"], ["점검 결과 관리"]]],
  [
    "직원관리",
    [
      ["직원 정보 관리", "staff/index.html"],
      ["근로계약 관리", "staff/contracts.html"],
      ["급여명세서 관리", "staff/payslips.html"],
      ["근무스케줄 관리", "staff/work-schedules.html"],
      ["출·퇴근 현황 조회", "staff/attendance.html"],
      ["TO-DO 리스트 관리", "staff/todos.html"],
    ],
  ],
  ["매출조회", [["매출 조회"], ["매출 통계"]]],
  ["재무관리", [["입·출금 관리"], ["매출/매입 거래 등록"], ["계정별 현황 조회"]]],
  ["환경설정", [["BP 관리자 관리", "config/admins.html"], ["BP 권한 그룹 관리", "config/roles.html"], ["BP 공통코드 관리", "config/codes.html"], ["BP 휴일 관리", "config/holidays.html"]]],
  ["고객지원", [["부가서비스 구독 관리"], ["구독료 청구 및 납부 현황"], ["결제수단 관리"], ["정산 현황 조회"], ["공지사항", "support/notices.html"], ["FAQ", "support/faq.html"], ["문의하기", "support/inquiries.html"]]],
];

// 목업 점포 목록의 BP(㈜한강상회)와 점포들. 서초점은 점포 목록 목업에 없지만 홈·직원·환경설정·알림 목업이 쓰는 점포라 더했다(2026-10-02 재영: 데이터는 한쪽으로 맞춘다). 재직 직원 합계 63명. 줄: 코드·이름·유형·상태·사업자등록번호·연락처·근무직원수·등록일·지역·대표 이미지(assets/img, 없으면 빈칸). 범위 선택기는 1팀 공통정책 2번의 표기를 따른다.
export const BP = { name: "㈜한강상회", code: "BP000017" };
export const STORES = [
  ["ST000007", "모리커피 청담점", "가맹점포", "미운영", "-", "02-514-2270", 0, "2026-09-10", "서울 강남구", ""],
  ["ST000011", "온기식당 일산점", "가맹점포", "운영", "128-27-90456", "031-906-4415", 5, "2026-02-23", "경기 고양시", "store-photo-2.jpg"],
  ["ST000010", "온기식당 서면점", "가맹점포", "운영", "602-19-33845", "051-803-7712", 6, "2026-01-09", "부산 부산진구", "store-photo-3.jpg"],
  ["ST000009", "온기식당 둔산점", "가맹점포", "운영", "305-14-72210", "042-485-3390", 6, "2025-11-18", "대전 서구", ""],
  ["ST000008", "모리커피 부평점", "가맹점포", "운영", "122-31-60021", "032-512-6604", 5, "2025-10-06", "인천 부평구", "store-photo-4.jpg"],
  ["ST000006", "모리커피 연남점", "가맹점포", "운영", "105-22-81934", "02-322-1180", 6, "2025-08-01", "서울 마포구", "store-photo-1.jpg"],
  ["ST000005", "모리커피 을지로점", "가맹점포", "운영", "201-12-34567", "02-2265-0917", 5, "2025-07-15", "서울 중구", "store-photo-5.jpg"],
  ["ST000004", "온기식당 광화문점", "직영점포", "운영", "104-81-55120", "02-734-5528", 6, "2025-06-02", "서울 종로구", "store-photo-6.jpg"],
  ["ST000003", "온기식당 판교점", "직영점포", "운영", "131-81-44710", "031-8017-2231", 7, "2025-05-20", "경기 성남시", "store-ongi.svg"],
  ["ST000002", "모리커피 성수점", "직영점포", "운영", "101-81-22302", "02-462-7719", 8, "2025-04-11", "서울 성동구", "store-mori.svg"],
  ["ST000001", "모리커피 서초점", "직영점포", "운영", "114-81-90215", "02-3474-1290", 9, "2025-03-17", "서울 서초구", "store-bread.svg"],
];
export const USER = "정하윤 (BP 마스터)";

// 헤더의 점포 범위 드롭다운 — 목업(F-TLJOCK)처럼 전체·직영·가맹 묶음 + 직영·가맹 점포 목록 + 이름 검색으로 그린다.
// BP 변경 버튼은 넣지 않는다 — 실제로는 플랫폼 마스터·플랫폼 관리자에게만 있고, 이 데모는 BP 마스터(정하윤) 기준이다.
function scopeDropdown(A) {
  const id = ui.uid("scope");
  const dir = STORES.filter((s) => s[2] === "직영점포");
  const fr = STORES.filter((s) => s[2] === "가맹점포");
  const initial = `전체 ${STORES.length}개점`;

  const opt = (label, meta, q, selected) =>
    `<button type="button" role="option" aria-selected="${selected}" data-scope-label="${label}" data-scope-q="${q}" class="group flex w-full items-start gap-[10px] rounded-[8px] px-[12px] py-[8px] text-left transition-colors duration-150 ease-out hover:bg-erp-thead-bg"><span class="flex min-w-0 flex-1 flex-col gap-[2px]"><b class="truncate text-[13px] font-semibold text-erp-ink">${label}</b><span class="truncate text-[11.5px] text-erp-muted">${meta}</span></span><span class="hidden shrink-0 text-[14px] font-semibold text-erp-brand group-aria-selected:inline">✓</span></button>`;
  const storeOpt = (s) => opt(s[1], s[0], `${s[1]} ${s[0]}`, false);
  const sect = (title, items) =>
    items.length
      ? `<div class="flex flex-col gap-[1px]" data-scope-sect>${title ? `<p class="px-[12px] pt-[10px] pb-[4px] text-[11px] font-semibold tracking-[0.04em] text-erp-muted uppercase">${title}</p>` : ""}${items.join("")}</div>`
      : "";

  const list =
    sect(
      BP.name,
      [
        opt(initial, `직영 ${dir.length} · 가맹 ${fr.length}`, initial, true),
        dir.length ? opt(`직영 ${dir.length}개점`, "직영점포 전체", `직영 ${dir.length}개점`, false) : "",
        fr.length ? opt(`가맹 ${fr.length}개점`, "가맹점포 전체", `가맹 ${fr.length}개점`, false) : "",
      ].filter(Boolean),
    ) +
    sect(`직영 ${dir.length}`, dir.map(storeOpt)) +
    sect(`가맹 ${fr.length}`, fr.map(storeOpt));

  const search = `<div class="mb-[6px] flex items-center gap-[8px] border-b border-erp-divider px-[12px] pb-[8px]">${ui.img(A, "search.svg", 12, 12)}<input type="search" placeholder="점포 이름으로 찾기" aria-label="점포 찾기" class="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-erp-ink outline-none placeholder:text-erp-label" data-scope-q-input></div>`;

  const trigger = `<button type="button" aria-expanded="false" aria-controls="${id}" aria-label="점포: ${initial}" class="flex h-[42px] w-[420px] items-center gap-[8px] rounded-full border border-erp-field-line bg-erp-thead-bg px-[18px] text-left text-[14px] text-erp-ink"><b class="shrink-0 font-semibold">${BP.name}</b><span class="text-erp-label">·</span><span class="flex-1 truncate" data-scope-value>${initial}</span>${ui.img(A, "chevron-small-brand.svg", 5, 8, `transition-transform duration-200 ${ui.EASE_OUT} -rotate-90`)}</button>`;

  return `<div class="relative flex-1">${trigger}${ui.popup(
    id,
    "fold",
    "left-0 w-[304px] rounded-[12px]! border-erp-field-line! p-[6px]! shadow-[0_2px_6px_rgba(40,47,55,0.08)]",
    `${search}<div class="max-h-[328px] overflow-y-auto" data-scope-list>${list}<p class="hidden px-[12px] py-[14px] text-center text-[13px] text-erp-label" data-scope-none>맞는 점포가 없습니다.</p></div>`,
  )}</div>`;
}

// 저장 버튼 줄. 패널(closeSave)에서는 왼쪽에 [닫기]를 둔다 — 저장·비밀번호 변경 버튼은 패널을 닫지 않고 토스트로만 알린다(2026-10-06 피드백).
const saveRow = (label, closeSave, toast) =>
  `<div class="flex justify-end gap-[6px]">${closeSave ? ui.button("닫기", { variant: "off", "data-close": true }) : ""}${ui.button(label, { "data-toast": toast })}</div>`;

// 내 정보 입력칸(기본정보·사업자정보 탭). MY PAGE 전체 화면(mypage/profile.mjs)과 GNB 슬라이드 패널이 같은 내용을 쓴다.
// idPrefix: 사업자 인증 상자 id 접두 — 전체 화면과 패널이 한 페이지(mypage/profile.html)에 같이 실릴 수 있어 서로 다르게 둔다.
// tabPrefix: 탭 id 접두. closeSave: 저장 버튼이 패널을 닫을지(패널에서는 닫는다, 전체 화면에서는 그대로 머문다).
export function mypageBody(A, { idPrefix = "pb", tabPrefix = "", closeSave = false } = {}) {
  const save = saveRow("저장", closeSave, "저장되었습니다.");
  const basic =
    ui.formGroup(
      "계정 정보",
      ui.formRow(ui.field("아이디", ui.textField({ value: "hangang01", disabled: true })), ui.field("사용자 권한", ui.textField({ value: "BP 마스터", disabled: true }))),
      ui.formRow(ui.field("가입일", ui.textField({ value: "2026-03-04", disabled: true })), ui.field("최근 로그인 일시", ui.textField({ value: "2026-09-22 09:12", disabled: true }))),
    ) +
    ui.formGroup(
      "기본정보",
      ui.field(f.req("이름"), ui.textField({ value: "정하윤", maxlength: 20 }) + f.help("한글 또는 영문 2~20자")),
      f.group(f.req("연락처"), f.tel("010", "4821", "7730") + f.help("휴대전화 · 숫자 10~11자리")),
      ui.field(f.req("이메일"), ui.textField({ type: "email", value: "hayoon@hangang.co.kr", maxlength: 100 })),
      save,
    );

  const biz = ui.formGroup(
    f.titleBadge("사업자정보", "on", "인증 완료"),
    f.help("국세청 API 로 사업자등록번호·대표자명·개업일자의 진위만 확인합니다."),
    f.bizAuth(A, idPrefix, { start: "done", values: ["211-87-01234", "남도현", "2021-03-15"], doneBadge: "인증 완료 · 2026-03-04" }),
    ui.field(f.req("상호명"), ui.textField({ value: "㈜한강상회", maxlength: 50 }) + f.help("1~50자")),
    f.group("대표자 연락처", f.tel("010", "5530", "1182")),
    ui.field("대표자 이메일", ui.textField({ type: "email", value: "ceo@hangang.co.kr", maxlength: 100 })),
    f.address(A, "사업장 주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "3층" }),
    ui.formRow(ui.field("업태", ui.textField({ value: "도소매업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "식자재 유통", maxlength: 50 }))),
    save,
  );

  return (
    x.tabs([
      { id: `${tabPrefix}basic`, label: "기본정보", html: basic },
      { id: `${tabPrefix}biz`, label: "사업자정보", html: biz },
    ]) + f.SWAP_SCRIPT
  );
}

// GNB 「내정보 관리」가 여는 슬라이드 패널 — 입력칸이 몇 안 되는 화면이라 전체 페이지 전환 대신 패널로 연다(2026-10-06 피드백).
// 모든 ERP 화면의 헤더에 실리므로(erpHeader), id("mypage-panel")는 화면마다 한 번만 쓰인다. 전체 화면(mypage/profile.html)은
// 회원 탈퇴 화면의 "취소"가 돌아갈 곳으로 그대로 둔다.
export function mypagePanel(A) {
  return ui.slidePanel("mypage-panel", "내 정보", ui.sectionHead("내 정보") + mypageBody(A, { idPrefix: "mpb", tabPrefix: "mp-", closeSave: true }));
}

// MY PAGE 전체 화면(mypage/password.mjs)과 GNB 슬라이드 패널이 같은 내용을 쓴다. 비밀번호 칸(보기 토글)은 biz-form.mjs 의 pwField.
export function passwordBody({ closeSave = false } = {}) {
  return ui.formGroup(
    "새 비밀번호 설정",
    f.pwField("현재 비밀번호", "whale-2026!", "current-password", "지금 쓰고 있는 비밀번호를 입력하세요"),
    f.pwField("새 비밀번호", "hangang-0922#", "new-password", "영문·숫자·특수문자 각 1자 이상 8~20자 · 특수문자는 ! @ # $ % ^ &amp; * ( ) - _ = + [ ] { } ? 만, 공백 불가"),
    f.pwField("새 비밀번호 확인", "hangang-0922#", "new-password", "새 비밀번호를 한 번 더 입력하세요"),
    saveRow("비밀번호 변경", closeSave, "비밀번호가 변경되었습니다."),
  );
}
export function passwordPanel(A) {
  return ui.slidePanel("password-panel", "비밀번호 변경", ui.sectionHead("비밀번호 변경") + passwordBody({ closeSave: true }));
}

// 회원 탈퇴. MY PAGE 전체 화면(mypage/withdraw.mjs)과 GNB 슬라이드 패널이 같은 내용을 쓴다.
// panel 이 true 면: "취소"는 페이지 이동 대신 패널을 닫고, 비밀번호 확인은 따로 뜨는 확인창이 아니라 패널 맨 앞 단계로 넣는다
// (2026-10-06 피드백) — 맞게 입력하고 [확인]을 누르면(데모라 항상 통과) 같은 패널 안에서 회원 탈퇴 내용으로 바뀐다.
// 전체 화면에서는 기존대로 페이지에 들어오면 비밀번호 확인창이 뜬다.
export function withdrawBody(R, { panel = false } = {}) {
  const confirmId = x.dialogId();
  const doneId = x.dialogId();
  // text 는 문단 하나(string), 여러 문단(array), 또는 소제목+문단({head,text})을 섞은 array 를 받는다.
  const notice = (title, text, danger) => {
    const blocks = Array.isArray(text) ? text : [text];
    const body = blocks
      .map((b) =>
        typeof b === "object"
          ? `<p class="mt-[14px] font-semibold text-erp-ink">${b.head}</p><p class="mt-[4px] leading-[1.6] text-erp-ink">${b.text}</p>`
          : `<p class="mt-[6px] leading-[1.6] text-erp-ink">${b}</p>`,
      )
      .join("");
    return `<div class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px] text-[14px]"><p class="font-semibold ${danger ? "text-[#e93737]" : "text-erp-ink"}">${title}</p>${body}</div>`;
  };

  // 실제 값으로 바뀌는 자리(BP 이름·계정 수·점포 수)는 굵게 + 밑줄로 표시한다.
  const live = (t) => `<b class="font-semibold underline">${t}</b>`;
  const warn = notice(
    "탈퇴 전 꼭 확인해 주세요",
    [
      `탈퇴하면 ${live(BP.name)}의 서비스 이용이 종료됩니다. 동일한 BP에 속한 관리자·가맹 계정 ${live("6개")}도 함께 탈퇴되어 더 이상 로그인할 수 없습니다.`,
      {
        head: `점포 ${live("11개")}가 모두 폐점 처리됩니다`,
        text: `점포 보유 여부는 탈퇴를 제한하지 않습니다.<br>탈퇴 처리 시 점포의 현재 운영 상태나 폐점 조건을 별도로 확인하지 않고, 운영·미운영 점포 ${live("11개")}를 모두 폐점 처리합니다.`,
      },
      {
        head: "개인정보가 삭제됩니다",
        text: "탈퇴 계정의 이름·연락처·이메일과 대표자의 연락처·이메일은 즉시 삭제되며, 아이디만 보관됩니다. 직원·계약·정산 정보와 변경 이력은 보존 정책에 따라 보관됩니다.",
      },
      "탈퇴한 계정은 복구할 수 없습니다.<br>정말 탈퇴하시겠습니까?",
    ],
    true, // #e93737: DESIGN.md 의 위험 글자색
  );

  // 표(조건·내용·상태 열) 대신 아이콘 + 제목 + 설명 한 줄짜리 목록으로 보인다(2026-10-06 피드백) — 열 이름 없이 충족 여부는 앞 표시(—/✓)로만 말한다.
  // icon·iconCls 로 상태별 색을 따로 준다: 막는 조건은 빨강, 충족한 조건은 파랑, 그 밖(확인 안 함)은 무채색.
  const condRow = (icon, iconCls, title, desc) => {
    const lines = (Array.isArray(desc) ? desc : [desc]).map((d) => `<p class="text-[13px] text-erp-label">${d}</p>`).join("");
    return `<div class="flex items-start gap-[10px] border-b border-erp-divider py-[14px] last:border-b-0"><span class="w-[16px] shrink-0 text-center text-[14px] font-semibold ${iconCls}">${icon}</span><div class="flex flex-col gap-[2px]"><p class="text-[15px] font-semibold text-erp-ink">${title}</p>${lines}</div></div>`;
  };
  const conditions =
    condRow("–", "text-[#e93737]", "부가서비스 구독 해지", ["1차 범위 밖 — 1차에서는 확인하지 않습니다.", "직원추가 구독중"]) +
    condRow("–", "text-erp-muted font-normal", "미정산 금액 없음", "1차 범위 밖 — 1차에서는 확인하지 않습니다.") +
    condRow("✓", "text-erp-link", "진행 중인 근로계약 없음", "진행 중인 근로계약이 없습니다.");

  // 탈퇴 사유를 "직접입력"으로 고를 때만 상세 사유 칸을 보인다. select 는 data-when(라디오 전용)을 못 쓰므로 onchange 로 직접 토글한다.
  const detailId = ui.uid("wd-detail");
  const reason = ui.formGroup(
    "탈퇴 사유",
    ui.field(
      f.req("탈퇴 사유"),
      `<div class="w-[360px]">${ui.select(["탈퇴 사유를 선택하세요", "폐업·사업 종료", "다른 서비스 이용", "비용 부담", "기능 부족", "이용이 어려움", "직접입력"], {
        onchange: `document.getElementById('${detailId}').hidden=this.value!=='직접입력'`,
      })}</div>`,
    ),
    `<div id="${detailId}" hidden>${ui.field("상세 사유", ui.textarea({ rows: 4, maxlength: 500 }))}</div>`,
  );

  const dismiss = panel ? { "data-close": true } : { href: to(R, "mypage/profile.html") };
  const confirmDoneDialogs =
    x.dialog(
      confirmId,
      "회원 탈퇴",
      `<p>정말로 탈퇴하시겠습니까? 회원 탈퇴 시 웨일ERP를 더 이상 이용할 수 없습니다.</p><p class="mt-[6px] text-erp-label">필요한 순간에 다시 웨일ERP와 함께해 주세요.</p>`,
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("회원 탈퇴", { "data-close": true, "data-dialog": doneId }),
    ) +
    x.dialog(doneId, "회원 탈퇴가 완료되었습니다.", `<p class="text-erp-label">등록한 이메일로 탈퇴 완료 안내를 보냈습니다. 웨일ERP 첫 화면으로 이동합니다.</p>`, ui.button("확인", { href: to(R, "home/index.html") }));

  const withdrawContent =
    warn +
    `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`탈퇴 조건<span class="ml-[10px] inline-flex align-middle">${ui.badge("on", "모두 충족")}</span>`)}${conditions}</div>` +
    reason +
    f.formButtons(ui.button("닫기", { variant: "off", ...dismiss }), x.dialogTrigger("회원 탈퇴", confirmId)) +
    confirmDoneDialogs;

  if (!panel) {
    const pwId = x.dialogId();
    const pwDialog = x.dialog(
      pwId,
      "비밀번호 확인",
      `<p>회원 탈퇴를 하려면 현재 비밀번호를 입력해 주세요.</p><div class="mt-[12px]">${ui.field("현재 비밀번호", ui.textField({ type: "password", value: "whale-2026!", autocomplete: "current-password" }))}</div>`,
      ui.button("닫기", { variant: "off", href: to(R, "mypage/profile.html") }) + ui.button("확인", { "data-close": true }),
    );
    return { html: withdrawContent + pwDialog + `<script>document.getElementById("${pwId}").showModal()</script>` };
  }

  // 패널 모드: 비밀번호 확인을 패널의 첫 단계로 넣는다. [확인]을 누르면(데모라 항상 통과) 탈퇴 내용으로 바뀐다.
  const contentId = ui.uid("wd-content");
  const pwStepId = ui.uid("wd-pw");
  const pwStep = `<div id="${pwStepId}" class="flex flex-col gap-[18px]"><p class="text-[14px] text-erp-ink">회원 탈퇴를 하려면 현재 비밀번호를 입력해 주세요.</p>${ui.field(
    "현재 비밀번호",
    ui.textField({ type: "password", value: "whale-2026!", autocomplete: "current-password" }),
  )}<div class="flex justify-center gap-[6px]">${ui.button("닫기", { variant: "off", "data-close": true })}${ui.button("확인", f.swapAttr(pwStepId, contentId))}</div></div>`;
  return { html: pwStep + `<div id="${contentId}" hidden class="flex flex-col gap-[18px]">${withdrawContent}</div>` };
}
export function withdrawPanel(A, R) {
  const { html } = withdrawBody(R, { panel: true });
  return ui.slidePanel("withdraw-panel", "회원 탈퇴", ui.sectionHead("회원 탈퇴") + html + f.SWAP_SCRIPT);
}

export function erpHeader(A, R) {
  const menus = ERP_MENUS.map(([label, items]) => ({ label, items: items.map(([l, p]) => ({ label: l, href: to(R, p) })) }));
  const user = [
    { label: "내정보 관리", panel: "mypage-panel" },
    { label: "비밀번호 변경", panel: "password-panel" },
    { label: "회원 탈퇴", panel: "withdraw-panel" },
    { label: "로그아웃", href: to(R, "auth/login.html"), danger: true },
  ];
  return (
    ui.globalHeader(
      A,
      menus,
      scopeDropdown(A) +
        ui.serviceLinks(A, { erp: to(R, "home/signed-in.html"), platform: to(R, "bp/index.html") }) +
        ui.alarmLink(A, to(R, "notify/index.html")) +
        ui.userPop(A, USER, user),
      to(R, "home/signed-in.html"),
    ) + mypagePanel(A) + passwordPanel(A) + withdrawPanel(A, R)
  );
}

export const link = to;

// 플랫폼 콘솔(목업 Platform). 상단 선택칸은 BP 를 고른다(1팀 공통정책 2번의 BP 변경).
const PLATFORM_MENUS = [
  ["회원관리", [["회원 정보 관리"]]],
  ["BP 마스터 계정 관리", [["BP 마스터 계정 목록", "bp/index.html"]]],
  ["서비스정산관리", [["부가서비스 주문 내역"], ["부가서비스 정산"]]],
  ["부가서비스관리", [["부가 서비스 정보 관리"]]],
  ["프로모션관리", [["쿠폰 관리"], ["포인트 관리"]]],
  [
    "시스템관리",
    [
      ["플랫폼 관리자 관리", "system/admins.html"],
      ["플랫폼 권한 관리", "system/roles.html"],
      ["플랫폼 메뉴 관리", "system/menus.html"],
      ["플랫폼 공통코드 관리", "system/codes.html"],
      ["플랫폼 휴일 관리", "system/holidays.html"],
    ],
  ],
  [
    "커뮤니티관리",
    [
      ["공지사항", "support/community-notices.html"],
      ["FAQ", "support/community-faq.html"],
      ["문의사항", "support/community-asks.html"],
      ["도입문의", "support/community-leads.html"],
    ],
  ],
];
const BPS = ["BP 선택", `${BP.name} · ${BP.code}`, "㈜모리푸드 · BP000021", "㈜온기에프앤비 · BP000009"];
export const PLATFORM_USER = "김지영 (플랫폼 관리자)";
export const PLATFORM_MASTER = "김서연 (플랫폼 마스터)"; // system/admins 목록의 platkim

// master: true 면 플랫폼 마스터로 로그인한 헤더(마스터 기준 화면용).
export function platformHeader(A, R, { master = false } = {}) {
  const menus = PLATFORM_MENUS.map(([label, items]) => ({ label, items: items.map(([l, p]) => ({ label: l, href: to(R, p) })) }));
  const user = [
    { label: "내정보 관리", href: to(R, "mypage/profile.html") },
    { label: "비밀번호 변경", href: to(R, "mypage/password.html") },
    { label: "로그아웃", href: to(R, "auth/login.html"), danger: true },
  ];
  return ui.globalHeader(
    A,
    menus,
    ui.storeSelect(A, BPS, BPS[0], "BP") +
      ui.serviceLinks(A, { erp: to(R, "home/signed-in.html"), platform: to(R, "bp/index.html") }) +
      ui.alarmLink(A, "#") +
      ui.userPop(A, master ? PLATFORM_MASTER : PLATFORM_USER, user),
    to(R, "bp/index.html"),
  );
}
