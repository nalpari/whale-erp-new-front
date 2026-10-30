// 점포 상세. 목업 docs/mockup/stores/detail.html 의 기본 상태(모리커피 연남점 · 운영)를 BP 마스터로 본 것.
// 생김새는 1팀 /design/detail 샘플: 카드 안 묶음 제목 줄 + [버튼] 과 상세 표.
// render 의 bpStatus(「탈퇴」 · 「미사용」)를 주면 소속 BP 가 그 상태인 점포를 플랫폼 계정으로 본 것이다(detail-bp-withdrawn.mjs, 앱 stores/[storeId]/page.tsx 와 같다, 2026-10-28).
// code 로 견본 점포를 바꾼다 — ST000007 미운영(detail-not-operating.mjs) · ST000012 폐점(detail-closed.mjs). 2026-10-30 앱(front)대로 맞춤(재영).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { tag } from "../../config-parts.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";
import { CLOSED_STORE, blocked, noticeBand, statusBadge, storeImage } from "../../store-parts.mjs";

// DetailValues 로 값을 여럿 늘어놓는 줄들의 첫 칸(들) 너비 — 위치정보 · 변경이력처럼 짝을 이루는 줄들이
// 값이 비어 있을 때도 구분선(|)이 들쑥날쑥하지 않게 맞춘다(2026-10-19 점검 — 실사용자 확인).
const FIRST_COL = "inline-block min-w-[140px]";
// 변경이력 줄의 등록 칸 너비 — 위치정보 줄의 위도 · 경도 두 칸(140 + 10 + 구분선 1 + 10 + 140)과 같아, 최종수정 앞 구분선이 바로 위
// 줄 출퇴근 위치 적용 여부 앞 구분선과 같은 세로줄에 선다(2026-10-23 사용자 요청 — 앱 stores/[storeId]/page.tsx 와 같다).
const REGISTERED_COL = "w-[301px]";
const muted = (t) => `<span class="text-erp-muted">${t}</span>`;
const dash = (v) => v || muted("-");

// 견본 점포의 상세 값(목록 STORES 에 없는 칸). history 는 변경이력 팝업의 첫 쪽, historyTotal 은 전체 건수(10건 넘을 때만 쪽 넘기기).
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
    ],
    historyTotal: 14,
    contracts: 6,
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
    contracts: 0,
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
    contracts: 0,
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
const conditionBox = (title, items, attrs = "") =>
  `<div${attrs} class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]"><p class="font-semibold">${title}</p><ul class="mt-[6px] list-disc pl-[18px]">${items}</ul></div>`;

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
          (state === "미운영" ? x.dialogTrigger("삭제", deleteId, "soft") : blocked("삭제", "미운영 점포만 삭제할 수 있습니다. 운영을 끝내려면 상태 변경에서 폐점하세요.")) +
          ui.button("수정", { variant: "soft", href: editHref });
  // 대표 이미지 · 점포명 · 점포코드 · 유형 · 폐점일 · 실행 버튼을 한 머리 카드에 묶는다(2026-10-19 점검 —
  // 실사용자 확인, 디자인 데모 1안 채택). 이미지가 없으면 48px 아이콘(목록 카드와 같은 크기)이 72px 자리 대신 선다(앱과 같다).
  // 점포명과 점포코드 줄 사이는 6px, 점포코드 줄 안 간격은 10px(앱과 같다).
  const head = `<div class="flex items-center gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[18px]">
    ${photo ? storeImage(72, `${A}img/${photo}`, name) : storeImage(48)}
    <div class="flex min-w-0 flex-1 flex-col gap-[6px]">
      <h2 class="truncate text-[18px] font-semibold text-erp-ink">${name}</h2>
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

  // 점포 기본정보: 대표 이미지 · 점포코드는 위 머리 카드로 옮겨 다시 적지 않는다. 표 맨 위는 점포상태(2026-10-19 점검).
  const basic = ui.detailTable("점포 기본정보", [
    ["점포상태", statusBadge(state)],
    ["점포 연락처", phone],
    // 한 줄 「[ 우편번호 04104 ] 기본주소(볼드), 상세주소」 — 괄호·라벨은 라벨 색, 번호는 기존 데이터 색(검정)(2026-10-19 점검).
    ["점포주소", addressLine(d.address), true],
    // 위도 · 경도 · 출퇴근 위치 적용 여부 각각 라벨과 같은 회색 글자를 앞에 둔다(2026-10-16 점검).
    [
      "위치정보",
      ui.detailValues([
        `<span class="${FIRST_COL}"><span class="mr-[10px] text-erp-label">위도</span>${d.lat}</span>`,
        `<span class="${FIRST_COL}"><span class="mr-[10px] text-erp-label">경도</span>${d.lng}</span>`,
        `<span class="mr-[10px] text-erp-label">출퇴근 위치 적용 여부</span>${d.location}`,
      ]),
    ],
    ["재직직원", `${staff}명`],
    // 등록 · 최종수정 두 칸 + [변경이력]. 고친 적 없으면 최종수정은 「-」(앱 wasUpdated). 처리자 이름이 길면 말줄임해 버튼은 자리를 지킨다(2026-10-19 점검).
    [
      "변경이력",
      `<span class="flex w-full items-center gap-[12px]"><span class="flex min-w-0 flex-1 items-center gap-[10px] overflow-hidden"><span class="${REGISTERED_COL} min-w-0 shrink-0 truncate"><span class="mr-[10px] text-erp-label">등록</span>${d.created}</span><span class="h-[11px] w-px shrink-0 bg-[#d9d9d9]"></span><span class="min-w-0 flex-1 truncate"><span class="mr-[10px] text-erp-label">최종수정</span>${dash(d.updated)}</span></span>${x.dialogTrigger("변경이력", histId, "soft")}</span>`,
    ],
  ]);
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

  // 변경 이력: 한 쪽 10건. 표는 5줄 높이(머리 42 + 줄 46×5)로 두고 넘치면 표 안에서 스크롤, 머리글은 고정.
  // 쪽 넘기기는 10건이 넘을 때만, 표와 6px 띄운다(앱 history-dialog.tsx). 불러오는 중(「불러오는 중입니다.」) · 실패 띠는 데모에 두지 않는다
  const history =
    `<div class="max-h-[273px] overflow-y-auto border-y border-erp-thead-line [&_thead]:sticky [&_thead]:top-0 [&_thead]:shadow-[0_1px_0_var(--color-erp-thead-line)] [&_thead_tr]:border-y-0 [&_tbody_tr:last-child]:border-b-0">${ui.dataTable(
      [{ header: "변경일시", width: "w-[140px]" }, { header: "변경자", width: "w-[70px]" }, { header: "항목", width: "w-[140px]", align: "left" }, { header: "변경 전", align: "left" }, { header: "변경 후", align: "left" }],
      d.history.map(([at, by, ...rest]) => [at, by ?? muted("시스템"), ...rest]),
      "변경이력이 없습니다.",
    )}</div>` + (d.historyTotal > 10 ? `<div class="pt-[6px]">${ui.pagination(A, 1, Math.ceil(d.historyTotal / 10))}</div>` : "");

  // 상태 변경(앱 ConfirmDialog wide · 480). 갈 수 있는 상태만 보인다 — 미운영 → 운영 · 폐점(라디오), 운영 → 폐점.
  // 운영은 운영 조건이 모자라면, 폐점은 진행 중인 근로계약이 있으면 확인 버튼이 막힌다. 폐점은 확인 창(「폐점으로 변경할까요?」)을 한 번 더 거친다.
  // 부가서비스 구독 · 정산 대기 금액은 1차 범위 밖이라 뺐다(2026-10-19 점검).
  const closeItem = `<li${d.contracts ? ' class="text-erp-off"' : ""}>진행 중인 근로계약 <b class="font-semibold">${d.contracts}건</b>${d.contracts ? " — 정리해야 할 근로계약이 있습니다." : ""}</li>`;
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
            (notOperating ? confirmBtn("운영으로 변경", missing.length > 0) : confirmBtn("폐점으로 변경", d.contracts > 0)),
          "w-[480px]",
        ) +
        // 라디오를 바꾸면 조건 상자 · 확인 버튼 글자 · 막힘을 바꾼다(앱은 상태로 다시 그린다)
        (notOperating
          ? `<script>(()=>{const d=document.getElementById("${statusId}"),c=d.querySelector("[data-status-confirm]");d.addEventListener("change",(e)=>{const t=e.target.dataset.target;if(!t)return;d.querySelectorAll("[data-show]").forEach((b)=>(b.hidden=b.dataset.show!==t));c.textContent=t==="op"?"운영으로 변경":"폐점으로 변경";c.disabled=t==="op"?${missing.length > 0}:${d.contracts > 0};});})();</script>`
          : "") +
        // 폐점 확인 — [이전]은 조건 팝업으로 돌아간다(앱 store-detail-actions.tsx)
        x.dialog(
          closeId,
          "폐점으로 변경할까요?",
          "<p>폐점일은 오늘로 정해지고 되돌릴 수 없습니다. 다음 날부터 이 점포에는 BP 휴일이 적용되지 않습니다.</p>",
          ui.button("이전", { variant: "off", "data-dialog": statusId, "data-close": true }) + ui.button("폐점으로 변경", { href: link(R, "stores/detail-closed.html") }),
        );
  // 삭제 확인 — 미운영 점포만. 확인 버튼만 위험 색(앱과 같다, 2026-10-29 사용자 결정)
  const deleteDialog = notOperating && !bpBlocked
    ? x.dialog(
        deleteId,
        "점포를 삭제하시겠습니까?",
        `<div class="flex flex-col gap-[12px]">${whoList([["점포명", name], ["점포유형", type], ["점포코드", code]])}<p>삭제한 점포는 복구할 수 없습니다.</p></div>`,
        ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { variant: "danger", href: link(R, "stores/index.html") }),
      )
    : "";

  // 변경이력 팝업(BP 상세 · 플랫폼 관리자 history-dialog 와 같은 생김새) — 표가 넓어 이 창만 860 으로 넓힌다(2026-10-16 점검).
  const historyDialog = x
    .dialog(histId, "변경이력", `<div class="flex flex-col gap-[12px]">${history}</div>`, ui.button("닫기", { variant: "off", "data-close": true }))
    .replace("w-[420px]", "w-[860px] max-h-[calc(100dvh-48px)] overflow-y-auto");

  const body = ui.detailBody(
    // BP 탈퇴 · 미사용 안내는 점포명 머리 카드 위 맨 위, 폐점 안내는 머리 카드 아래(앱 stores/[storeId]/page.tsx 와 같다)
    // 등록 직후 대표 이미지만 실패했을 때의 띠(「점포는 저장했습니다.」)는 데모에 두지 않는다
    `<div class="flex flex-col gap-[12px]">${bpBlocked ? f.noticeBand(bpBlocked) : ""}${head}${
      state === "폐점" ? noticeBand("info", "폐점한 점포는 조회만 가능하며, 수정할 수 없습니다. 다시 운영하려면 신규 점포로 등록해 주세요.") : ""
    }<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${bizInfo}</div></div>` +
      floors +
      statusDialog +
      deleteDialog +
      historyDialog,
  );

  const title = bpStatus ? `점포 상세 · BP ${bpStatus}` : code === "ST000006" ? "점포 상세" : `점포 상세 · ${state}`;
  return { title, html: ui.erpFrame({ header: erpHeader(A, R, { bpStatus }), title: "점포 정보 관리", body }) };
};

export default (ctx) => render(ctx);
