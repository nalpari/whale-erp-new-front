// 데모 전체가 같이 쓰는 것: 로그인한 사람, 헤더 메뉴, 범위 선택기 값.
// ERP 화면은 목업의 ERP 콘솔(BP 마스터 기준)을 따른다. 플랫폼 화면은 PLATFORM 쪽을 쓴다.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import { platformMyPanel } from "./platform-admin/edit.mjs";
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
// ERP 헤더에는 웨일ERP 바로가기의 BP 선택을 두지 않는다 — 실제로는 플랫폼 마스터·플랫폼 관리자에게만 열리고, 이 데모의 ERP 화면은 BP 마스터(정하윤) 기준이다.
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

  // 검색 줄 높이는 목업(pop__search · 36.5px)에 맞춘다 — 위 6 · 아래 8 여백, 입력칸 줄 높이 1.5 + 위아래 1px
  const search = `<div class="mb-[6px] flex items-center gap-[8px] border-b border-erp-divider px-[10px] pt-[6px] pb-[8px]">${ui.img(A, "search.svg", 14, 14)}<input type="search" placeholder="점포 이름으로 찾기" aria-label="점포 찾기" class="min-w-0 flex-1 border-0 bg-transparent px-[2px] py-[1px] text-[13px] leading-[1.5] text-erp-ink outline-none placeholder:text-erp-label" data-scope-q-input></div>`;

  const trigger = `<button type="button" aria-expanded="false" aria-controls="${id}" aria-label="점포: ${initial}" class="flex h-[42px] w-[420px] items-center gap-[8px] rounded-full border border-erp-field-line bg-erp-thead-bg px-[18px] text-left text-[14px] text-erp-ink"><b class="shrink-0 font-semibold">${BP.name}</b><span class="text-erp-label">·</span><span class="flex-1 truncate" data-scope-value>${initial}</span>${ui.img(A, "chevron-small-brand.svg", 5, 8, `transition-transform duration-200 ${ui.EASE_OUT} -rotate-90`)}</button>`;

  return `<div class="relative flex-1">${trigger}${ui.popup(
    id,
    "fold",
    "left-0 w-[304px] rounded-[12px]! border-erp-field-line! p-[6px]! shadow-[0_2px_6px_rgba(40,47,55,0.08)]",
    `${search}<div class="max-h-[328px] overflow-y-auto" data-scope-list>${list}<p class="hidden px-[12px] py-[14px] text-center text-[13px] text-erp-label" data-scope-none>맞는 점포가 없습니다.</p></div>`,
  )}</div>`;
}

// 저장 버튼 줄. 패널(closeSave)에서는 왼쪽에 [닫기]를 둔다 — 저장·비밀번호 변경 버튼은 패널을 닫지 않고 토스트로만 알린다(2026-10-06 피드백).
// 버튼 줄은 가운데(앱 my-page-panel.tsx 와 같다, 2026-10-26) — 입력 묶음 밖, 탭 내용 아래에 둔다
const saveRow = (label, closeSave, toast) =>
  `<div class="flex justify-center gap-[6px]">${closeSave ? ui.button("닫기", { variant: "off", "data-close": true }) : ""}${ui.button(label, { "data-toast": toast })}</div>`;

// 내 정보 입력칸(기본정보·사업자정보 탭). 마이페이지 전체 화면(mypage/profile.mjs)과 GNB 슬라이드 패널이 같은 내용을 쓴다.
// idPrefix: 사업자 인증 상자 id 접두 — 전체 화면과 패널이 한 페이지(mypage/profile.html)에 같이 실릴 수 있어 서로 다르게 둔다.
// tabPrefix: 탭 id 접두. closeSave: 저장 버튼이 패널을 닫을지(패널에서는 닫는다, 전체 화면에서는 그대로 머문다).
export function mypageBody(A, { idPrefix = "pb", tabPrefix = "", closeSave = false } = {}) {
  const save = saveRow("저장", closeSave, "저장되었습니다.");
  // 계정 정보는 FormGroup 의 기본 제목(배경 없음) 대신 DetailTable 제목 줄과 같은 회색 바를 쓴다
  // (사용자 디자인 피드백, 2026-10-21). 본문 카드는 FormGroup 과 같은 토큰으로 직접 짠다.
  // 아이콘을 넣어 봤지만 24px 로는 너무 작아 뺐다(사용자 지정, 2026-10-21).
  // 글자 크기 · 굵기는 DetailTable 이 아니라 바로 아래 「기본정보」(FormGroup) 제목과 맞춘다(2026-10-21 피드백).
  const accountInfo =
    `<div class="w-full"><h3 class="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">계정 정보</h3>` +
    `<div class="flex flex-col gap-[18px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[20px]">` +
    ui.formRow(ui.readonlyField("아이디", "hangang01", true), ui.readonlyField("사용자 권한", "BP 마스터", true)) +
    `<hr class="border-erp-divider">` +
    ui.formRow(ui.readonlyField("최근 로그인", "2026-09-22 09:12", true), ui.readonlyField("가입일", "2026-03-04", true)) +
    `</div></div>`;
  // 입력 예시 문구는 앱 my-page-panel.tsx 그대로(2026-10-26). [닫기][저장] 줄은 「기본정보」 묶음 밖에 둔다(앱과 같다)
  const basic =
    accountInfo +
    ui.formGroup(
      "기본정보",
      ui.field(f.req("이름"), ui.textField({ value: "정하윤", maxlength: 20, placeholder: "한글 또는 영문 2~20자로 입력해 주세요." })),
      f.group(f.req("연락처"), f.tel("010", "4821", "7730")),
      ui.field(f.req("이메일"), ui.textField({ type: "email", value: "hayoon@hangang.co.kr", maxlength: 100, placeholder: "example@company.com" })),
    ) +
    save;

  // 사업자정보 인증 상자 — 네 화면 공통 컴포넌트(BizVerificationBox, S-VRNTHD)를 그대로 옮긴 모양이다.
  // 상자 머리(「사업자정보」 · 인증 상태)까지 같은 회색 박스 안에 있다(2026-10-23 — 전엔 제목 줄과 본문을
  // 따로 두었는데, 공통 상자로 옮기며 하나가 됐다). 세 칸은 한 줄에 나란히 두되 값 길이에 맞춰 폭을
  // 다르게 준다 — 사업자등록번호(하이픈 넣어 최대 12자)·개업일자(입력칸 안 달력 아이콘까지 있어 자리를
  // 더 쓴다)는 넓게, 대표자명은 보통 짧아 좁게(compactRow, 2026-10-23 사용자가 실제 화면으로 맞춘 값).
  // DOM maxlength 는 사업자등록번호에 안 둔다 — 하이픈 섞어 붙여넣으면 거르기 전에 잘리기 때문이다.
  //
  // 인증은 검사만 하고, 저장(아래 「저장」 버튼)을 눌러야 반영된다(점포 사업자정보와 같은 두 단계, 2026-10-22
  // 사용자 결정). 인증이 끝나 있으면(locked) 세 칸이 읽기 전용으로 잠기고 [재인증][사용안함]만 보인다 —
  // 「재인증」을 누르면 값은 그대로 둔 채 세 칸이 한꺼번에 열리고, 「인증하기」로 다시 검사해야 다시 잠긴다.
  // 「사용안함」을 누르면(struck) 확인창 없이 바로 세 칸이 지워질 값에 취소선을 긋고 잠기며, 「인증하기」
  // 버튼은 사라지고 「사용안함 취소」 하나만 남는다 — 저장을 눌러야 실제로 지워진다(점포는 저장 뒤 번호 ·
  // 개업일자가 고정이라 이 기능 자체가 없다, 마이페이지 전용, 2026-10-23 사용자 결정).
  const struckField = (value) =>
    `<div class="flex h-[34px] w-full items-center rounded-[2px] border border-erp-field-line bg-erp-thead-bg pl-[10px] text-[14px] text-erp-label"><span class="truncate line-through">${value || "&nbsp;"}</span></div>`;
  const bizFields = (state, num, ceo, open) => {
    const locked = state === "locked";
    const struck = state === "struck";
    return (
      `<div class="flex gap-[6px]">` +
      ui.field(
        "사업자등록번호",
        struck ? struckField(num) : ui.textField({ value: num, readonly: locked, placeholder: locked ? undefined : "숫자 10자리", inputmode: "numeric" }),
        "min-w-px flex-[1.0]",
      ) +
      ui.field(
        "대표자명",
        struck ? struckField(ceo) : ui.textField({ value: ceo, readonly: locked, placeholder: locked ? undefined : "대표자 이름", maxlength: 50 }),
        "min-w-px flex-[0.85]",
      ) +
      f.group(
        "개업일자",
        struck ? struckField(open) : locked ? ui.textField({ value: open, readonly: true, "aria-label": "개업일자" }) : ui.dateField(A, { label: "개업일자", value: open }),
        "min-w-px flex-[1.3]",
      ) +
      `</div>`
    );
  };
  // 버튼 줄 — locked: [재인증][사용안함]. struck("사용안함" 뒤): [사용안함 취소] 하나뿐(인증하기도 숨긴다 —
  // 지워질 값을 두고 재인증하는 건 말이 안 되니, 바꿔 타려면 먼저 되돌려야 한다). 그 밖(미인증): [인증하기] 하나 —
  // [지우기]는 입력값이 있을 때만 보이는데(앱 BizVerificationBox onClear) 표본 미인증 상태는 세 칸이 비어 있어 두지 않는다(2026-10-26).
  const bizButtons = (state) =>
    `<div class="flex gap-[6px]">${
      state === "locked"
        ? ui.button("재인증", { variant: "soft" }) + ui.button("사용안함", { variant: "soft" })
        : state === "struck"
          ? ui.button("사용안함 취소", { variant: "soft" })
          : ui.button("인증하기", { variant: "soft" })
    }</div>`;
  const bizGuide =
    `<p class="text-[13px] leading-[1.5] text-erp-label">` +
    `사업자정보가 국세청에 등록된 정보와 일치하는지 확인합니다.</p>`;
  const bizStruckGuide = `<p class="text-[13px] leading-[1.5] text-erp-label">하단의 [저장] 버튼을 클릭하면 인증 정보가 삭제됩니다.</p>`;
  // 머리(「사업자정보」 · 인증 상태)는 기본정보 탭 「계정 정보」와 같은 회색 제목 바로 떼어 내고, 본문은 흰 바탕에
  // 둔다(사용자 지정, 2026-10-26). 본문 위아래 여백은 계정 정보(20px)보다 줄인 16px — 좌우와 같다(비교 화면으로 고름).
  const bizAuthBox = (state, num, ceo, open, date) =>
    `<section aria-label="사업자 번호 인증" class="w-full">` +
    `<h3 class="flex h-[42px] items-center justify-between rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink"><span>사업자정보</span>${
      state === "new" || state === "struck" ? ui.badge("off", "미인증") : ui.badge("on", `인증 완료 · ${date}`)
    }</h3>` +
    `<div class="flex flex-col gap-[12px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[16px]">` +
    bizFields(state, num, ceo, open) +
    bizButtons(state) +
    (state === "struck" ? bizStruckGuide : state === "new" ? bizGuide : "") /* 국세청 안내는 인증 전에만(앱 BizVerificationBox, 2026-10-28) */ +
    `</div></section>`;
  // sameAsBasic: 대표자 연락처 · 이메일 칸에 "기본정보와 동일" 체크박스 — 체크하면 기본정보(이름 탭) 값을 그대로 쓴다(2026-10-22 사용자 지정).
  const ceoContact = (idp, checked) =>
    `<div role="group" aria-label="대표자 연락처" class="flex min-w-px flex-1 flex-col gap-[8px]"><span class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label"><span>대표자 연락처</span>${ui.checkbox(A, "기본정보와 동일", checked, { id: `${idp}-phone-same` })}</span>${f.tel(checked ? "010" : "010", "5530", "1182")}</div>` +
    `<div role="group" aria-label="대표자 이메일" class="flex min-w-px flex-1 flex-col gap-[8px]"><span class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label"><span>대표자 이메일</span>${ui.checkbox(A, "기본정보와 동일", checked, { id: `${idp}-email-same` })}</span>${ui.textField({ type: "email", value: "ceo@hangang.co.kr", maxlength: 100, disabled: checked })}</div>`;

  const bizRest = (idp) =>
    `<section aria-label="상호명 등" class="flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">` +
    ui.field(f.req("상호명"), ui.textField({ value: "㈜한강상회", maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })) +
    ceoContact(idp, false) +
    ui.formRow(ui.field("업태", ui.textField({ value: "도소매업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "식자재 유통", maxlength: 50 }))) +
    // 주소는 업태 · 종목 다음, 라벨 「사업자주소」(앱 bp-profile-tab.tsx 와 같다, 2026-10-26)
    f.address(A, "사업자주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "3층" }) +
    `</section>`;

  const biz = `<div class="flex flex-col gap-[18px]">${bizAuthBox("locked", "211-87-01234", "남도현", "2021-03-15", "2026-10-20 14:32")}${bizRest(`${idPrefix}-done`)}</div>${save}`;

  // 가입 직후처럼 아직 사업자 인증을 받지 않은 초기 상태 — 인증완료 탭과 생김새를 견주어 보려고 따로 둔다(2026-10-07 피드백).
  const bizNew = `<div class="flex flex-col gap-[18px]">${bizAuthBox("new", "", "", "")}${bizRest(`${idPrefix}-new`)}</div>${save}`;

  // 「사용안함」을 누른 뒤 — 저장을 눌러야 실제로 지워진다. 인증완료 탭과 생김새를 견주어 보려고 따로 둔다(2026-10-23).
  const bizDisabled = `<div class="flex flex-col gap-[18px]">${bizAuthBox("struck", "211-87-01234", "남도현", "2021-03-15")}${bizRest(`${idPrefix}-disabled`)}</div>${save}`;

  return (
    mypageTabs(
      x.tabs([
        { id: `${tabPrefix}basic`, label: "기본정보", html: basic },
        { id: `${tabPrefix}biz`, label: "사업자정보", html: biz },
        { id: `${tabPrefix}biz-new`, label: "사업자정보(인증 전)", html: bizNew },
        { id: `${tabPrefix}biz-disabled`, label: "사업자정보(사용안함)", html: bizDisabled },
      ]),
    ) + f.SWAP_SCRIPT
  );
}

// 마이페이지 탭 줄만 앱 my-page-panel.tsx TabBar 모양으로 — 14px 500, 탭 사이 18px, 좌우 여백 없음, 아래 선 erp-thead-line.
// 탭 내용 묶음 사이는 16px(계정 정보 ↔ 기본정보, 앱과 같다). 공통 x.tabs 는 다른 화면도 써서 그 결과를 여기서만 바꾼다(2026-10-26).
// 탭 전환은 공통 erp.js 가 data-on · data-off 클래스로 한다.
function mypageTabs(html) {
  const end = html.indexOf("</div>"); // 첫 </div> 가 탭 줄의 끝이다(탭 단추 안에는 div 가 없다)
  const bar = html
    .slice(0, end)
    .replace('<div role="tablist" class="flex shrink-0 border-b border-erp-bar-line">', '<div role="tablist" aria-label="내정보 관리" class="flex h-[42px] shrink-0 gap-[18px] border-b border-erp-thead-line">')
    .replaceAll("-mb-px flex h-[42px] items-center border-b-2 px-[18px] text-[15px]", "h-[42px] border-b-2 text-[14px]")
    .replaceAll("border-erp-brand font-semibold text-erp-ink", "border-erp-brand font-medium text-erp-ink");
  const panels = html.slice(end).replace(/(<div role="tabpanel"[^>]*?class=")flex min-h-0 flex-1 flex-col gap-\[12px\]"/g, '$1flex min-h-0 flex-1 flex-col gap-[16px]"');
  return bar + panels;
}

// GNB 「내정보 관리」가 여는 슬라이드 패널 — 입력칸이 몇 안 되는 화면이라 전체 페이지 전환 대신 패널로 연다(2026-10-06 피드백).
// 모든 ERP 화면의 헤더에 실리므로(erpHeader), id("mypage-panel")는 화면마다 한 번만 쓰인다. 전체 화면(mypage/profile.html)은
// 회원 탈퇴 화면의 "취소"가 돌아갈 곳으로 그대로 둔다.
export function mypagePanel(A) {
  return ui.slidePanel("mypage-panel", "내정보 관리", ui.sectionHead("내정보 관리") + mypageBody(A, { idPrefix: "mpb", tabPrefix: "mp-", closeSave: true }));
}

// 마이페이지 전체 화면(mypage/password.mjs)과 GNB 슬라이드 패널이 같은 내용을 쓴다. 비밀번호 칸(눈 아이콘 보기 토글)은
// biz-form.mjs 의 pwField. 안내 문구는 전부 칸 안 placeholder 로 두고, 칸 아래는 error 가 있을 때만 보인다(2026-10-26
// 사용자 지정 — 전엔 긴 조건 문구가 칸 아래 늘 남아 있었다). errors 의 칸(current · newPassword · confirm)에 값이
// 있으면 그 pwField 가 그 문구를 칸 아래에 보인다.
// 비밀번호 변경 완료 — 제목은 그대로 두고 입력칸 자리에 큰 체크 + 안내를 둔다(2026-10-26 사용자 지정, C안: 연한 파랑 원 + 파랑 체크).
// 「색은 상태다」 규칙대로 완료 상태에 상태 파랑(#5e8ce9 · 바탕 #f4f9ff)을 쓴다. 전엔 토스트로만 알렸다.
const PW_DONE_ICON =
  '<svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="28" fill="#f4f9ff"/><path d="M17 28.5l7.5 7.5L39.5 21" fill="none" stroke="#5e8ce9" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PW_SCRIPT = `<script>
(() => {
  if (window.__pwDone) return;
  window.__pwDone = true;
  document.addEventListener("click", (e) => {
    const submit = e.target.closest("[data-pw-submit]");
    const reset = e.target.closest("[data-pw-reset]");
    const root = (submit || reset)?.closest("[data-pw]");
    if (!root) return;
    root.querySelector("[data-pw-form]").hidden = Boolean(submit);
    root.querySelector("[data-pw-done]").hidden = !submit;
    if (submit) root.querySelector("[data-pw-done] button")?.focus();
  });
})();
</script>`;
export function passwordBody(A, { closeSave = false, errors = {} } = {}) {
  const done =
    `<div data-pw-done hidden class="flex flex-col gap-[18px]">` +
    `<div role="status" class="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center">` +
    `<span class="mb-[12px]">${PW_DONE_ICON}</span>` +
    `<p class="text-[16px] font-semibold text-erp-ink">비밀번호가 변경되었습니다.</p>` +
    `<p class="text-[14px] text-erp-muted">다음 로그인부터 변경된 비밀번호로 로그인해 주세요.</p></div>` +
    // 패널은 [닫기](닫으면 다음에 열 때 입력칸으로 돌아온다), 전체 화면은 [확인]으로 입력칸으로 돌아간다
    `<div class="flex justify-center">${closeSave ? ui.button("닫기", { "data-close": true, "data-pw-reset": true }) : ui.button("확인", { "data-pw-reset": true })}</div></div>`;
  return `<div data-pw class="flex flex-col gap-[18px]"><div data-pw-form>` + ui.formGroup(
    "새 비밀번호 설정",
    // value 를 비워 둔다 — 안내문구가 placeholder 라 값이 차 있으면 안 보인다(코드 리뷰로 찾음, 2026-10-26).
    f.pwField(A, "현재 비밀번호", "", "current-password", {
      placeholder: "지금 쓰고 있는 비밀번호를 입력해 주세요.",
      error: errors.current,
    }),
    // 회원가입(signup.mjs passwordField)과 같은 짧은 문구 — 긴 조건 문구는 칸 너비에 다 안 들어가 뒤가 잘렸다
    // (사용자가 찾음, 2026-10-26). 세 칸 모두 마침표로 끝맺는다(사용자 지정).
    f.pwField(A, "새 비밀번호", "", "new-password", {
      placeholder: "영문·숫자·특수문자를 조합하여 8~20자로 입력해 주세요.",
      error: errors.newPassword,
    }),
    f.pwField(A, "새 비밀번호 확인", "", "new-password", {
      placeholder: "새 비밀번호를 한 번 더 입력해 주세요.",
      error: errors.confirm,
    }),
    // [비밀번호 변경] 은 토스트 대신 완료 상자로 바꾼다(C안) — 버튼 줄 모양은 saveRow 와 같다
    `<div class="flex justify-center gap-[6px]">${closeSave ? ui.button("닫기", { variant: "off", "data-close": true }) : ""}${ui.button("비밀번호 변경", { "data-pw-submit": true })}</div>`,
  ) + `</div>${done}</div>` + PW_SCRIPT;
}
export function passwordPanel(A) {
  return ui.slidePanel("password-panel", "비밀번호 변경", ui.sectionHead("비밀번호 변경") + passwordBody(A, { closeSave: true }));
}

// 회원 탈퇴. 마이페이지 전체 화면(mypage/withdraw.mjs)과 GNB 슬라이드 패널이 같은 내용을 쓴다.
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
        text: "탈퇴 계정의 이름·연락처·이메일과 대표자의 연락처·이메일은 즉시 삭제되며, 아이디만 보관됩니다. 직원·계약·정산 정보와 변경이력은 보존 정책에 따라 보관됩니다.",
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

// 플랫폼 계정이 탈퇴 · 미사용 BP 를 보고 있으면 범위 선택기 바로 오른쪽에 빨간 상태 배지와 한 줄을 둔다(앱 admin-header.tsx BpStatusNote 와 같다, 2026-10-28).
// 기본 화면은 사용 중인 BP 라 그리지 않는다 — bpStatus(「탈퇴」 · 「미사용」)를 넘기는 화면(점포 BP 탈퇴 · 미사용 보기)만 보인다.
const bpStatusNote = (status) =>
  `<span role="status" class="flex shrink-0 items-center gap-[6px] text-[14px] text-erp-off">${ui.badge("off", status)}조회 기능만 이용할 수 있는 BP입니다.</span>`;

export function erpHeader(A, R, { bpStatus } = {}) {
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
      // 상태 안내가 있으면 범위 선택기를 칸 폭(420)만큼 감싸 그 오른쪽에 붙인다 — 묶음이 남는 폭을 받는다(앱 admin-header.tsx 와 같다, 2026-10-28)
      (bpStatus
        ? `<div class="flex min-w-0 flex-1 items-center gap-[12px]">${scopeDropdown(A).replace('<div class="relative flex-1">', '<div class="relative w-[420px] shrink-0">')}${bpStatusNote(bpStatus)}</div>`
        : scopeDropdown(A)) +
        ui.serviceLinks(A, { erp: to(R, "home/signed-in.html"), platform: to(R, "bp/index.html") }) +
        ui.alarmLink(A, to(R, "notify/index.html")) +
        ui.userPop(A, USER, user),
      to(R, "home/signed-in.html"),
    ) + mypagePanel(A) + passwordPanel(A) + withdrawPanel(A, R)
  );
}

export const link = to;

// 플랫폼 콘솔(목업 Platform). BP 는 서비스 바로가기 「웨일ERP」의 BP 선택 확인창으로 골라 새 탭으로 연다(F-TLJOCK).
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
      // 알림 템플릿 관리는 3팀 화면, NOTIFY-7 · 2026-10-07 재영, 1팀 전달 사항 14번
      ["알림 템플릿 관리", "notify/templates.html"],
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
export const PLATFORM_USER = "김지영 (플랫폼 관리자)";
export const PLATFORM_MASTER = "김서연 (플랫폼 마스터)"; // system/admins 목록의 platkim

// 플랫폼 콘솔에서 "웨일ERP" 바로가기를 누르면 여는 "BP 선택" 확인창(F-TLJOCK, 앱 bp-select-dialog.tsx) — 어떤 BP 의 웨일ERP 를 새 탭으로 열지 고른다.
// 상호 · BP코드로 찾고([검색] 또는 Enter, 1쪽으로) 10건씩 넘긴다. 줄을 눌러도 고르고, 쪽을 넘기거나 검색하면 고른 것을 비운다. 고르기 전에는 [이동]이 막혀 있다.
// 점포는 고르지 않는다 — 고른 BP 의 전체 점포로 열고, 범위는 ERP 헤더의 점포 선택 드롭다운에서 바꾼다(2026-10-20 재영). 거르기 · 쪽 넘김은 erp.js.
// 줄: BP코드 · 상호 · 상태. BP 마스터 계정 목록(bp/index)의 BP 에 예시 BP 를 더해 2쪽이 생기게 했다. 플랫폼 탭의 지금 BP 는 플랫폼 BP 라 「(현재)」 줄이 없다.
const PLATFORM_BPS = [
  ["BP000003", "모리커피 본사", "사용"],
  ["BP000008", "국밥24", "탈퇴"],
  ["BP000010", "카페눈", "사용"],
  ["BP000012", "솥밥상회", "미사용"],
  ["BP000017", "㈜한강상회", "사용"],
  ["BP000021", "㈜바다푸드", "사용"],
  ["BP000030", "브레드랩", "사용"],
  ["BP000031", "브레드랩 2호", "사용"],
  ["BP000032", "하루국수", "미사용"],
  ["BP000033", "㈜청솔푸드", "사용"],
  ["BP000034", "소금빵공방", "사용"],
  ["BP000035", "㈜온기에프앤비", "사용"],
];
function platformScopeDialog(A, R, id) {
  const columns = [{ header: "BP코드", width: "w-[110px]" }, { header: "상호명", align: "left" }, { header: "계정상태", width: "w-[80px]" }];
  // 사용 BP 만 상호명을 굵게(앱 bp-select-dialog.tsx 와 같다, 2026-10-29)
  const rows = PLATFORM_BPS.map(([code, name, status]) => {
    const radio = ui.radio(name, `${id}-bp`, false, { "data-bp-code": code, "data-bp-name": name });
    return [code, status === "사용" ? `<div class="font-semibold">${radio}</div>` : radio, status];
  });
  const table = ui.dataTable(columns, rows).replace("</tbody>", `${ui.tableEmptyRow(columns).replace("<tr ", "<tr hidden data-bp-none ")}</tbody>`);
  const body =
    // 「총 N 건」 · 찾기 칸 · 한 쪽 건수를 한 줄에, 결과 자리는 높이 고정 · 열 이름 줄 고정 스크롤(앱과 같다, 2026-10-29)
    `<div class="flex flex-col gap-[12px]"><p>BP를 선택하면 웨일ERP가 새 탭으로 열립니다.</p>` +
    `<div class="flex items-center gap-[6px]"><p class="mr-[6px] shrink-0 text-[14px] text-erp-ink">총 <b class="font-semibold">${PLATFORM_BPS.length}</b> 건</p><div class="min-w-0 flex-1">${ui.searchField(A, { placeholder: "상호명 또는 BP코드", label: "BP 찾기" })}</div><div class="w-[80px] shrink-0">${ui.select(["20", "50", "100"], { "aria-label": "페이지당 건수" })}</div></div>` +
    `<div class="flex h-[506px] flex-col [&_tbody_tr]:cursor-pointer [&_tbody_tr:has(:checked)]:bg-erp-thead-bg" data-bp-table>${ui.scrollTable(table)}</div>${ui.pagination(A, 1, Math.ceil(PLATFORM_BPS.length / 20), 5)}</div>`;

  return `<dialog id="${id}" data-scope-popup data-scope-all="전체 ${STORES.length}개점" aria-labelledby="${id}-t" class="m-auto w-[480px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"><h2 id="${id}-t" class="text-[18px] font-semibold">BP 선택</h2><div class="mt-[12px] text-[14px] leading-[1.6] text-erp-ink">${body}</div><div class="mt-[24px] flex justify-end gap-[6px]">${ui.button(
    "취소",
    { variant: "off", "data-close": true },
  )}${ui.button("이동", { "data-scope-apply": to(R, "home/signed-in.html"), disabled: true }).replace('class="', 'class="disabled:pointer-events-none disabled:opacity-40 ')}</div></dialog>`;
}

// master: true 면 플랫폼 마스터로 로그인한 헤더(마스터 기준 화면용).
// noMenu: true 면 접근할 플랫폼 메뉴가 없는 계정의 헤더(권한 요청 안내 화면용) — 메뉴 줄이 비고 로고 · 플랫폼관리 바로가기가 안내 화면을 가리킨다.
// 플랫폼은 홈이 없어 로고 · 플랫폼관리 바로가기는 GNB 순서상 첫 메뉴(BP 마스터 계정 관리)로 간다(2026-10-28 재영).
export function platformHeader(A, R, { master = false, noMenu = false } = {}) {
  const home = to(R, noMenu ? "auth/platform-no-menu.html" : "bp/index.html");
  const menus = noMenu ? [] : PLATFORM_MENUS.map(([label, items]) => ({ label, items: items.map(([l, p]) => ({ label: l, href: to(R, p) })) }));
  const user = [
    // 내정보 관리 · 비밀번호 변경은 화면을 옮기지 않고 슬라이드에서 한다(ERP 헤더와 같다 · 2026-10-08)
    { label: "내정보 관리", panel: "platform-mypage-panel" },
    { label: "비밀번호 변경", panel: "password-panel" },
    { label: "로그아웃", href: to(R, "auth/login.html"), danger: true },
  ];
  const scopeId = ui.uid("scope-dlg");
  return (
    ui.globalHeader(
      A,
      menus,
      // 플랫폼 콘솔에는 BP 선택 드롭다운을 두지 않는다 — BP 는 서비스 바로가기 「웨일ERP」로 고른다(2026-10-19 재영). 빈 칸이 오른쪽 컨트롤을 민다.
      `<div class="flex-1"></div>` +
        ui.serviceLinks(A, { erp: to(R, "home/signed-in.html"), platform: home, scopeDialog: scopeId, hideAddon: true }) +
        ui.alarmLink(A, "#") +
        ui.userPop(A, master ? PLATFORM_MASTER : PLATFORM_USER, user),
      home,
    ) + platformScopeDialog(A, R, scopeId) + platformMyPanel(A, { master }) + passwordPanel(A)
  );
}
