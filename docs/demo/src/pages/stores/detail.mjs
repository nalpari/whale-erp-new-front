// 점포 상세. 목업 docs/mockup/stores/detail.html 의 기본 상태(모리커피 연남점 · 운영)를 BP 마스터로 본 것.
// 생김새는 1팀 /design/detail 샘플: 카드 안 묶음 제목 줄 + [버튼] 과 상세 표.
// render 의 bpStatus(「탈퇴」 · 「미사용」)를 주면 소속 BP 가 그 상태인 점포를 플랫폼 계정으로 본 것이다(detail-bp-withdrawn.mjs, 앱 stores/[storeId]/page.tsx 와 같다, 2026-10-28).
// code 로 견본 점포를 바꾼다 — ST000007 미운영(detail-not-operating.mjs) · ST000012 폐점(detail-closed.mjs). 2026-10-30 앱(front)대로 맞춤(재영).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { tag, warnBand } from "../../config-parts.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";
import { CLOSED_STORE, blocked, noticeBand, statusBadge } from "../../store-parts.mjs";

// DetailValues 로 값을 여럿 늘어놓는 줄들의 첫 칸 너비 — 사업자등록번호 · 대표자정보처럼 짝을 이루는 줄들이
// 값이 비어 있을 때도 구분선(|)이 들쑥날쑥하지 않게 맞춘다(2026-10-19 점검 — 실사용자 확인).
const FIRST_COL = "inline-block min-w-[140px]";
// 위치정보 줄의 위도 칸만 고정폭(100) — 경도는 값만큼, 출퇴근 위치적용이 가장 넓게 선다(앱과 같다, 2026-11-03).
const LAT_COL = "inline-block w-[100px] whitespace-nowrap";
// 대표 이미지 칸 — 사진 194px + 둘레 여백 18px 씩 = 230px, 사진 옆 다섯 줄(46 × 5)과 높이가 같다(앱과 같다, 2026-11-03).
const PHOTO_BOX = "size-[194px]";
// 변경이력 줄의 등록 칸 너비 — 이 줄은 사진 아래 카드 왼쪽 끝에서 시작한다. 사진 칸(230) + 위도 칸(100) = 330 으로 최종수정 앞
// 구분선이 위치정보 줄의 경도 앞 구분선과 같은 세로줄에 선다(앱 stores/[storeId]/page.tsx 와 같다, 2026-11-03 — 줄맞춤).
const REGISTERED_COL = "w-[330px]";
const muted = (t) => `<span class="text-erp-muted">${t}</span>`;
const dash = (v) => v || muted("-");

// 견본 점포의 상세 값(목록 STORES 에 없는 칸). history 는 변경이력 팝업의 첫 쪽(한 쪽 20건), historyTotal 은 전체 건수(이력이 있으면 한 쪽뿐이어도 쪽 이동 1).
// 변경자가 없는 줄(null)은 시스템이 바꾼 것이다(앱 history-dialog.tsx — 회색 「시스템」).
const DETAIL = {
  ST000006: {
    address: ["03991", "서울 마포구 동교로 256", "1층"],
    lat: "37.562104",
    lng: "126.925631",
    location: "사용",
    created: "2025-08-01 14:18 · 정하윤",
    updated: "2026-08-14 10:31 · 정하윤",
    // 최종 인증일시는 수정 화면 제목 배지(인증 완료 · 날짜)와 같은 값이다
    biz: { trade: "모리커피 연남", verifiedAt: "2025-08-01 14:22", ceo: "박서윤", ceoPhone: "010-5521-3380", open: "2019-05-10", category: "음식점업", item: "커피전문점" },
    floors: [
      ["지상 1층", "18평", "59.5㎡", "32석"],
      ["지상 2층", "12평", "39.7㎡", "20석"],
    ],
    history: [
      ["2026-08-14 10:31", "정하윤", "점포 연락처", "02-322-1100", "02-322-1180"],
      ["2026-06-18 11:05", "박서윤", "대표 이미지", "없음", "등록"],
      ["2026-05-07 09:40", "정하윤", "층별 정보", "지상 1층 18평", "지상 1층 18평 · 지상 2층 12평"],
      ["2026-03-02 16:45", "박서윤", "출퇴근 위치 적용 여부", "미사용", "사용"],
      ["2026-02-11 14:02", null, "위도 · 경도", "37.562000 · 126.925500", "37.562104 · 126.925631"],
      ["2025-12-04 10:18", "정하윤", "대표자 연락처", "010-5521-3300", "010-5521-3380"],
      ["2025-11-20 09:12", "박서윤", "대표자명", "박서연", "박서윤"],
      ["2025-09-15 13:27", "정하윤", "업태 · 종목", "음식점업 · 카페", "음식점업 · 커피전문점"],
      ["2025-08-20 11:00", "정하윤", "점포상태", "미운영", "운영"],
      ["2025-08-12 17:48", "정하윤", "상호명", "모리커피", "모리커피 연남"],
      ["2025-08-05 15:30", "정하윤", "점포 연락처", "", "02-322-1100"],
      ["2025-08-01 14:22", "박서윤", "사업자정보 인증", "미인증", "인증"],
      ["2025-07-28 10:12", null, "위도 · 경도", "", "37.562000 · 126.925500"],
      ["2025-07-28 10:10", "정하윤", "점포", "", "등록 · 모리커피 · 가맹점포"],
    ],
    historyTotal: 14,
    // 폐점을 막는 퇴근하지 않은 출근(앱 transition-check closing) · 폐점하면 함께 처리될 것
    openCheckIns: 1,
    closing: { retiringStaff: 8, pendingSignatureContracts: 1, unconfirmedPayslips: 2 },
  },
  // 미운영 · 사업자 미인증 · 이미지 없음 · 층별 정보 없음 · 고친 적 없음. 주소를 골라 좌표는 있다
  ST000007: {
    address: ["06062", "서울 강남구 도산대로 451", "2층"],
    lat: "37.524711",
    lng: "127.044350",
    location: "미사용",
    created: "2026-09-10 10:05 · 정하윤",
    updated: "",
    biz: null,
    floors: [],
    history: [],
    historyTotal: 0,
    openCheckIns: 0,
    closing: { retiringStaff: 0, draftContracts: 1 },
    missing: ["BUSINESS_VERIFICATION"],
  },
  ST000012: {
    address: ["48094", "부산 해운대구 해운대해변로 264", "1층"],
    lat: "35.158712",
    lng: "129.160384",
    location: "사용",
    created: "2026-09-22 09:30 · 정하윤",
    updated: "2026-10-20 18:02 · 정하윤",
    biz: { trade: "모리커피 해운대", verifiedAt: "2026-09-22 09:34", ceo: "김도현", ceoPhone: "010-3381-0942", open: "2026-09-01", category: "음식점업", item: "커피전문점" },
    floors: [["지상 1층", "15평", "49.6㎡", "24석"]],
    history: [
      ["2026-10-20 18:02", "정하윤", "점포상태", "운영", "폐점"],
      ["2026-09-24 11:20", "정하윤", "점포상태", "미운영", "운영"],
      ["2026-09-22 09:41", null, "위도 · 경도", "-", "35.158712 · 129.160384"],
    ],
    historyTotal: 3,
    openCheckIns: 0,
    closing: { retiringStaff: 0, draftContracts: 1 },
    closedDate: "2026-10-20",
  },
};
// 운영 조건 체크리스트 줄(한글은 GET /enums/StoreOperationRequirement — 목업과 같은 라벨)
const REQUIREMENTS = [
  ["BUSINESS_VERIFICATION", "사업자정보 인증", "미인증"],
  ["COORDINATES", "좌표(위도 · 경도)", "미저장"],
];
const addressLine = ([zip, base, detail]) =>
  `<span><span class="mr-[10px]"><span class="text-erp-label">[ 우편번호</span> ${zip} <span class="text-erp-label">]</span></span><b class="font-semibold">${base}</b>, ${detail}</span>`;
// 확인창 안에서 어떤 점포인지(앱 store-detail-actions.tsx WhoList)
const whoList = (rows) =>
  `<dl class="grid grid-cols-[60px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">${rows
    .map(([k, v]) => `<div class="contents"><dt class="text-erp-label">${k}</dt><dd>${v}</dd></div>`)
    .join("")}</dl>`;
const conditionBox = (title, items, attrs = "", after = "") =>
  `<div${attrs} class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]"><p class="font-semibold">${title}</p><ul class="mt-[6px] list-disc pl-[18px]">${items}</ul>${after}</div>`;

export const render = ({ A, R }, { bpStatus, code = "ST000006" } = {}) => {
  const [, name, type, state, biz, phone, staff, , , photo] = [CLOSED_STORE, ...STORES].find((s) => s[0] === code);
  const d = DETAIL[code];
  const statusId = x.dialogId();
  const closeId = x.dialogId();
  const deleteId = x.dialogId();
  const histId = x.dialogId();

  // 소속 BP 가 탈퇴 · 미사용이면 상태 변경 · 삭제 · 수정을 막고 이유는 위 띠와 같은 문장(앱 store-detail-actions.tsx 와 같다, 2026-10-28).
  // 폐점 점포는 [목록]만 둔다. 막힌 버튼은 공통 Blocked 처럼 감싸는 칸에 이유(title)를 단다
  const bpBlocked = bpStatus ? f.bpBlockedText(bpStatus) : "";
  const editHref = link(R, "stores/edit.html");
  const actions =
    state === "폐점"
      ? ""
      : bpBlocked
        ? blocked("상태 변경", bpBlocked) + blocked("삭제", bpBlocked) + blocked("수정", bpBlocked)
        : x.dialogTrigger("상태 변경", statusId, "soft") +
          (state === "미운영" ? x.dialogTrigger("삭제", deleteId, "soft") : blocked("삭제", "미운영 점포만 삭제할 수 있습니다. 점포 운영을 종료하려면 '상태 변경'에서 '폐점'으로 변경해 주세요.")) +
          ui.button("수정", { variant: "soft", href: editHref });
  // 점포명 · 점포코드 · 유형 · 폐점일 · 실행 버튼을 한 줄에 묶는다. 테두리 없이 점포명 20px — 대표 이미지는 점포 기본정보 카드로
  // 옮겼다(앱과 같다, 2026-11-03). 점포명과 점포코드 줄 사이는 6px, 점포코드 줄 안 간격은 10px.
  const head = `<div class="flex items-center gap-[18px] py-[6px]">
    <div class="flex min-w-0 flex-1 flex-col gap-[6px]">
      <h2 class="truncate text-[20px] font-semibold text-erp-ink">${name}</h2>
      <!-- 운영 상태 배지는 여기 두지 않는다 — 점포 기본정보 표의 점포상태 줄과 정보가 겹쳐 보였다(2026-10-19 점검). -->
      <div class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label">
        <span>점포코드 ${code}</span>
        <span class="h-[11px] w-px bg-[#d9d9d9]"></span>
        ${tag(type)}${d.closedDate ? `<span>폐점일 ${d.closedDate}</span>` : ""}
      </div>
    </div>
    <div class="flex shrink-0 gap-[6px]">
      ${actions}
      ${ui.button("목록", { href: link(R, "stores/index.html") })}
    </div>
  </div>`;

  // 점포 기본정보: 점포코드는 위 점포명 줄에 있어 다시 적지 않는다. 표 맨 위는 점포상태(2026-10-19 점검).
  const basicRows = [
    ["점포상태", statusBadge(state)],
    ["점포 연락처", phone],
    // 한 줄 「[ 우편번호 04104 ] 기본주소(볼드), 상세주소」 — 괄호·라벨은 라벨 색, 번호는 기존 데이터 색(검정)(2026-10-19 점검).
    ["점포주소", addressLine(d.address), true],
    // 위도 · 경도 · 출퇴근 위치적용 각각 라벨과 같은 회색 글자를 앞에 둔다(2026-10-16 점검).
    [
      "위치정보",
      ui.detailValues([
        `<span class="${LAT_COL}"><span class="mr-[10px] text-erp-label">위도</span>${d.lat}</span>`,
        `<span class="whitespace-nowrap"><span class="mr-[10px] text-erp-label">경도</span>${d.lng}</span>`,
        `<span class="mr-[10px] text-erp-label">출퇴근 위치적용</span>${d.location}`,
      ]),
    ],
    ["재직직원", `${staff}명`],
    // 등록 · 최종수정 두 칸 + [변경이력]. 고친 적 없으면 최종수정은 「-」(앱 wasUpdated). 처리자 이름이 길면 말줄임해 버튼은 자리를 지킨다(2026-10-19 점검).
    [
      "변경이력",
      `<span class="flex w-full items-center gap-[12px]"><span class="flex min-w-0 flex-1 items-center gap-[10px] overflow-hidden"><span class="${REGISTERED_COL} min-w-0 shrink-0 truncate"><span class="mr-[10px] text-erp-label">등록</span>${d.created}</span><span class="h-[11px] w-px shrink-0 bg-[#d9d9d9]"></span><span class="min-w-0 flex-1 truncate"><span class="mr-[10px] text-erp-label">최종수정</span>${dash(d.updated)}</span></span>${x.dialogTrigger("변경이력", histId, "outline")}</span>`,
    ],
  ];
  // 대표 이미지 — 점포 기본정보 카드 안 왼쪽 위(194px · 8px 모서리), 사진 옆은 재직직원까지 다섯 줄, 변경이력은 사진 아래에서 카드 폭을 다 쓴다.
  // 사진은 칸에 맞게 가운데를 잘라 채우고, 오른쪽 아래 돋보기를 누르면 원본을 크게 본다. 없으면 회색 바탕 · 점포 아이콘(앱과 같다, 2026-11-03)
  const zoomId = x.dialogId();
  const photoCell = photo
    ? `<button type="button" data-dialog="${zoomId}" aria-label="${name} 대표 이미지 크게 보기" class="group/photo relative block shrink-0 cursor-zoom-in overflow-hidden rounded-[8px] ${PHOTO_BOX}"><img src="${A}img/${photo}" alt="${name} 대표 이미지" class="size-full rounded-[8px] object-cover"><span class="pointer-events-none absolute right-[8px] bottom-[8px] grid size-[28px] place-items-center rounded-full bg-erp-nav/50 text-white transition-colors duration-150 ease-out group-hover/photo:bg-erp-nav/80"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" stroke-width="1.5"/><path d="M12.75 12.75 17 17M8.5 6v5M6 8.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span></button>`
    : `<span role="img" aria-label="대표 이미지 없음" class="grid shrink-0 place-items-center rounded-[8px] bg-erp-thead-bg text-erp-label ${PHOTO_BOX}"><svg viewBox="0 0 24 24" width="48" height="48" class="shrink-0 fill-none stroke-current" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${x.ICON.store}</svg></span>`;
  const basic = `<div class="w-full">${ui.detailTable("점포 기본정보", [])}<div class="flex"><div class="shrink-0 border-b border-l border-erp-thead-line bg-white p-[18px]">${photoCell}</div><div class="min-w-0 flex-1 [&_dt]:border-l-0">${ui.detailTable(null, basicRows.filter(([l]) => l !== "변경이력"))}</div></div>${ui.detailTable(null, basicRows.filter(([l]) => l === "변경이력"))}</div>`;
  const zoomDialog = photo
    ? x
        .dialog(zoomId, `${name} 대표 이미지`, `<img src="${A}img/${photo}" alt="${name} 대표 이미지" class="block max-h-[calc(100dvh-200px)] max-w-[min(960px,calc(100vw-80px))] rounded-[2px] object-contain">`, ui.button("닫기", { variant: "off", "data-close": true }))
        .replace("w-[420px]", "w-auto")
    : "";

  // 미인증이면 진위확인 세 값은 「-」다(앱과 같다). 순서는 상호명 · 사업자등록번호 · 대표자정보 · 개업일자 · 업태종목 · 사업자주소(2026-10-16 점검).
  const b = d.biz ?? {};
  const bizInfo = ui.detailTable(f.titleBadge("사업자정보", d.biz ? "on" : "off", d.biz ? "인증 완료" : "미인증"), [
    ["상호명", dash(b.trade)],
    ["사업자등록번호", ui.detailValues([`<span class="${FIRST_COL}">${d.biz ? biz : muted("-")}</span>`, `<span class="mr-[10px] text-erp-label">최종 인증일시</span>${dash(b.verifiedAt)}`])],
    ["대표자정보", ui.detailValues([`<span class="${FIRST_COL}">${dash(b.ceo)}</span>`, `<span class="mr-[10px] text-erp-label">대표자 연락처</span>${dash(b.ceoPhone)}`])],
    ["개업일자", dash(b.open)],
    ["업태 · 종목", d.biz ? ui.detailValues([b.category, b.item]) : muted("-")],
    ["사업자주소", d.biz ? addressLine(d.address) : muted("-"), true],
  ]);

  // 층구분 줄마다 지상 1층 · 매장평수(평) · 전용면적(㎡) · 좌석 수를 구분선(|)으로(okf/stores.md S-ALHLHW, 2026-10-16 점검). 없으면 한 줄 안내(앱과 같다)
  const floors = ui.detailTable(
    "점포 공간정보",
    d.floors.length ? d.floors.map((fl) => ["층구분", ui.detailValues(fl)]) : [["층구분", muted("등록한 층별 정보가 없습니다.")]],
  );

  // 변경 이력 표 — 팝업(x.historyDialog)이 열 이름 줄을 고정한 채 줄만 스크롤하고, 총 건수 · 한 쪽 건수(20 · 50) · 쪽 이동(1)을 붙인다
  // (앱 stores/[storeId]/history-dialog.tsx · WideDialog, 2026-11-04 사용자 지정 — 전엔 표를 5줄 높이 273px 로 묶고 한 쪽 10건). 불러오는 중 · 실패 띠는 데모에 두지 않는다
  const history = ui.dataTable(
    [{ header: "변경일시", width: "w-[140px]" }, { header: "변경자", width: "w-[140px]" }, { header: "항목", width: "w-[120px]", align: "left" }, { header: "변경 전", align: "left" }, { header: "변경 후", align: "left" }],
    d.history.map(([at, by, ...rest]) => [at, by ?? muted("시스템"), ...rest]),
    "변경이력이 없습니다.",
  );

  // 상태 변경(앱 ConfirmDialog wide · 480). 갈 수 있는 상태만 보인다 — 미운영 → 운영 · 폐점(라디오), 운영 → 폐점.
  // 운영은 운영 조건이 모자라면, 폐점은 퇴근하지 않은 출근이 있으면 확인 버튼이 막힌다(근로계약은 막지 않는다 — 대기 계약은 폐점이 닫는다, 2026-11-04).
  // 폐점은 확인 창(「폐점으로 변경하시겠습니까?」)을 한 번 더 거치고, 그 창에 폐점하면 함께 처리될 것을 빨간 상자로 보인다(앱 store-closing-parts.tsx).
  // 부가서비스 구독 · 정산 대기 금액은 1차 범위 밖이라 뺐다(2026-10-19 점검).
  // 막혀도 건수만 — 직원 이름 · 출근 시각(api 가 건수만 준다, 2026-11-04) · 할 일 안내(2026-11-05 사용자 지정)는 보이지 않는다
  const closeItem =
    `<li${d.openCheckIns ? ' class="text-erp-off"' : ""}>퇴근 기록이 없는 출근 <b class="font-semibold">${d.openCheckIns}건</b></li>`;
  // 폐점하면 함께 처리될 것 — 0건인 줄은 빼고, 줄마다 무슨 뜻인지 회색으로 덧붙인다(앱 closingCheckLines)
  const c = d.closing ?? {};
  const closingLines = [
    c.retiringStaff && `근무 중인 직원 : ${c.retiringStaff}명 퇴직 처리<span class="block text-[13px] text-erp-label">퇴직일이 없거나 오늘 이후인 직원의 퇴직일은 오늘로 변경됩니다.</span>`,
    c.draftContracts && `작성 중인 근로계약 : ${c.draftContracts}건 종료<span class="block text-[13px] text-erp-label">해당 근로계약은 더 이상 작성하거나 발송할 수 없습니다.</span>`,
    c.pendingSendContracts && `서명 요청 전인 근로계약 : ${c.pendingSendContracts}건 종료<span class="block text-[13px] text-erp-label">해당 근로계약은 발송할 수 없으며, 이미 보낸 계약 초대도 만료됩니다.</span>`,
    c.pendingSignatureContracts && `직원 서명 대기·직원 수정 요청 중인 근로계약 : ${c.pendingSignatureContracts}건 종료<span class="block text-[13px] text-erp-label">직원은 해당 근로계약에 더 이상 서명할 수 없습니다.</span>`,
  ].filter(Boolean);
  const closingList =
    `<div class="mt-[12px] flex flex-col gap-[6px]">` +
    (closingLines.length
      ? `<div class="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] text-erp-off"><p class="font-medium">폐점 시 다음 항목이 함께 처리됩니다.</p><ol class="mt-[6px] list-decimal pl-[18px]">${closingLines.map((l, i) => `<li${i ? ' class="mt-[6px]"' : ""}>${l}</li>`).join("")}</ol></div>`
      : `<p class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]">함께 처리할 직원 · 근로계약이 없습니다.</p>`) +
    // 확정하지 않은 급여명세서는 폐점이 처리하지 않아 상자 밖 회색 안내로 둔다(앱 closingPayslipText)
    `${c.unconfirmedPayslips ? `<p class="text-[13px] text-erp-label">확정되지 않은 급여명세서 ${c.unconfirmedPayslips}건은 폐점 후에도 처리할 수 있습니다.</p>` : ""}</div>`;
  const notOperating = state === "미운영";
  const missing = d.missing ?? [];
  const opItems = REQUIREMENTS.map(
    ([key, label, word]) => `<li>${label} - ${missing.includes(key) ? `<span class="text-erp-off">${word}</span>` : '<b class="font-semibold">완료</b>'}</li>`,
  ).join("");
  // 확인 버튼은 폐점일 때 폐점 확인 창을 열고 이 창을 닫는다(data-dialog + data-close). 운영으로 바꾸는 저장은 데모에서 하지 않는다
  const confirmBtn = (label, disabled) => ui.button(label, { "data-status-confirm": true, "data-dialog": closeId, "data-close": true, disabled });
  const statusBody = notOperating
    ? `<div class="flex flex-col gap-[12px]"><p class="flex items-center gap-[6px]">현재 상태 ${statusBadge(state)}</p>` +
      `<div role="radiogroup" aria-label="바꿀 상태" class="flex gap-[18px]">${ui.radio("운영", "storeStatus", true, { "data-target": "op" })}${ui.radio("폐점", "storeStatus", false, { "data-target": "close" })}</div>` +
      conditionBox("운영 조건", opItems, ' data-show="op"') +
      conditionBox("폐점 조건", closeItem, ' data-show="close" hidden') +
      `</div>`
    : `<div class="flex flex-col gap-[12px]"><p class="flex items-center gap-[6px]">현재 상태 ${statusBadge(state)}</p>${conditionBox("폐점 조건", closeItem)}</div>`;
  const statusDialog =
    state === "폐점" || bpBlocked
      ? ""
      : x.dialog(
          statusId,
          "상태 변경",
          statusBody,
          ui.button("취소", { variant: "off", "data-close": true }) +
            (notOperating ? confirmBtn("운영으로 변경", missing.length > 0) : confirmBtn("폐점으로 변경", d.openCheckIns > 0)),
          "w-[480px]",
        ) +
        // 라디오를 바꾸면 조건 상자 · 확인 버튼 글자 · 막힘을 바꾼다(앱은 상태로 다시 그린다)
        (notOperating
          ? `<script>(()=>{const d=document.getElementById("${statusId}"),c=d.querySelector("[data-status-confirm]");d.addEventListener("change",(e)=>{const t=e.target.dataset.target;if(!t)return;d.querySelectorAll("[data-show]").forEach((b)=>(b.hidden=b.dataset.show!==t));c.textContent=t==="op"?"운영으로 변경":"폐점으로 변경";c.disabled=t==="op"?${missing.length > 0}:${d.openCheckIns > 0};});})();</script>`
          : "") +
        // 폐점 확인 — [이전]은 조건 팝업으로 돌아간다(앱 store-detail-actions.tsx)
        x.dialog(
          closeId,
          "폐점으로 변경하시겠습니까?",
          "<p>폐점으로 변경하면 되돌릴 수 없습니다.</p><p>폐점일은 오늘(2026-11-03)로 설정됩니다.</p>" + closingList,
          ui.button("이전", { variant: "off", "data-dialog": statusId, "data-close": true }) + ui.button("폐점으로 변경", { href: link(R, "stores/detail-closed.html") }),
        );
  // 삭제 확인 — 미운영 점포만. 1팀 화면은 빨간 버튼을 쓰지 않아 확인 버튼도 기본 색(앱과 같다, 2026-11-03)
  const deleteDialog = notOperating && !bpBlocked
    ? x.dialog(
        deleteId,
        "점포를 삭제하시겠습니까?",
        `<div class="flex flex-col gap-[12px]">${whoList([["점포명", name], ["점포유형", type], ["점포코드", code]])}${warnBand("점포를 삭제하면 점포 목록과 상단 점포 선택 항목에서 제외됩니다.\n삭제된 점포는 복구할 수 없습니다.")}</div>`,
        ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "stores/index.html") }),
      )
    : "";

  // 변경이력 팝업 — 1팀 변경이력 팝업 공통(폭 1000, 2026-11-04 사용자 지정)
  const historyDialog = x.historyDialog(A, histId, history, { total: d.historyTotal });

  const body = ui.detailBody(
    // BP 탈퇴 · 미사용 안내는 점포명 머리 카드 위 맨 위, 폐점 안내(한 줄)는 머리 카드 아래(앱 stores/[storeId]/page.tsx 와 같다)
    // 등록 직후 대표 이미지만 실패했을 때의 띠(「점포는 저장했습니다.」)는 데모에 두지 않는다
    `<div class="flex flex-col gap-[12px]">${bpBlocked ? f.noticeBand(bpBlocked) : ""}${head}${
      state === "폐점" ? noticeBand("info", "폐점 점포는 조회만 할 수 있습니다. 영업을 다시 시작하려면 신규 점포로 등록해 주세요.") : ""
    }<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${bizInfo}</div></div>` +
      floors +
      statusDialog +
      deleteDialog +
      historyDialog +
      zoomDialog,
  );

  const title = bpStatus ? `점포 상세 · BP ${bpStatus}` : code === "ST000006" ? "점포 상세" : `점포 상세 · ${state}`;
  return { title, html: ui.erpFrame({ header: erpHeader(A, R, { bpStatus }), title: "점포 정보 관리", body }) };
};

export default (ctx) => render(ctx);
