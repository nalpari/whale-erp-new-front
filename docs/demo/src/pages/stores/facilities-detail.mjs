// 시설물 및 장비 상세. 목업 docs/mockup/stores/facilities-detail.html 을 BP 마스터로 본 것(1.5차, 앱 화면 없음).
// 생김새는 점포 상세(stores/detail.mjs): 테두리 없는 이름 줄 + 실행 버튼, 그 아래 상세 표 두 개(기본 정보 · 관리 정보).
// render 의 sample: "base"(운영 · 이력 없음) · "history"(수리 이력이 있어 삭제가 막힘, facilities-detail-history.mjs) · "closed"(폐점 점포, facilities-detail-closed.mjs).
// 근거: 「시설물·장비 관리 정책서」 PL-1 · PL-4 · PL-5. 저장된 값이 있는 항목만 보인다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { tag, warnBand } from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { blocked, noticeBand } from "../../store-parts.mjs";
import { facilityBadge } from "../../facility-parts.mjs";

const SAMPLES = {
  base: { name: "EK43S 전자동 원두 커피 그라인더", store: "모리커피 성수점", state: "운영", group: "점포 장비", klass: "그라인더", brand: ["말코닉", "말코닉"], serial: "SN1234567", place: "주방", vendor: ["다온컴퍼니", "02-333-4444"], sales: ["홍길동", "010-2222-3333"], buy: ["20,000,000원", "2025-01-01", "2025-01-03"] },
  history: { name: "라마르조코 리네아 PB 2그룹", store: "모리커피 을지로점", state: "운영", group: "점포 장비", klass: "커피머신", brand: ["라마르조코", "라마르조코"], serial: "LM-PB2-88213", place: "바 카운터", vendor: ["커피앤머신", "02-2265-1100"], sales: ["김도현", "010-4411-2290"], buy: ["32,500,000원", "2025-07-10", "2025-07-14"] },
  closed: { name: "천장형 냉난방기", store: "모리커피 해운대점", state: "운영", group: "점포 시설물", klass: "냉난방", brand: ["삼성전자", "삼성전자"], serial: "AC-4WAY-2210", place: "홀 천장", vendor: ["해운대공조", "051-746-3300"], sales: ["이준서", "010-7788-1234"], buy: ["4,800,000원", "2025-02-20", "2025-03-02"] },
};
const sub = (t) => `<span class="text-erp-label">${t}</span>`;

export const render = ({ A, R }, { sample = "base" } = {}) => {
  const d = SAMPLES[sample];
  const closed = sample === "closed";
  const deleteId = ui.uid("dialog");

  // 실행 버튼 — 폐점 점포는 [목록]만(조회만, PL-1). 수리 이력 · 점검 결과가 있으면 [삭제]를 막고 폐기로 안내(PL-4). [목록]은 늘 Primary
  const actions =
    (closed
      ? ""
      : (sample === "history"
          ? blocked("삭제", "수리 이력이나 점검 결과가 있는 시설물·장비는 삭제할 수 없습니다. 운영상태를 폐기로 바꿔 주세요.")
          : x.dialogTrigger("삭제", deleteId, "soft")) + ui.button("수정", { variant: "soft", href: link(R, "stores/facilities-edit.html") })) +
    ui.button("목록", { href: link(R, "stores/facilities.html") });

  const head = `<div class="flex items-center gap-[18px] py-[6px]">
    <div class="flex min-w-0 flex-1 flex-col gap-[6px]">
      <h2 class="truncate text-[20px] font-semibold text-erp-ink">${d.name}</h2>
      <div class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label">${facilityBadge(d.state)}<span class="h-[11px] w-px bg-[#d9d9d9]"></span><span>${d.store}</span>${closed ? ui.badge("closed", "폐점") : ""}</div>
    </div>
    <div class="flex shrink-0 gap-[6px]">${actions}</div>
  </div>`;

  const basic = ui.detailTable("기본 정보", [
    ["점포", d.store],
    ["운영상태", facilityBadge(d.state)],
    ["그룹 · 분류", ui.detailValues([tag(d.group), d.klass])],
    ["브랜드 · 제조사", ui.detailValues(d.brand)],
    ["Serial number", d.serial],
    ["설치 위치", d.place],
    ["구매처", ui.detailValues(d.vendor)],
    ["영업사원", ui.detailValues(d.sales)],
    ["구매 · 설치", ui.detailValues([`${d.buy[0]} ${sub("(부가세 포함)")}`, `${sub("구매일")} ${d.buy[1]}`, `${sub("설치일")} ${d.buy[2]}`])],
    ["변경이력", ui.detailValues([`${sub("등록")} 2026-11-02 10:12 · 정하윤`, `${sub("최종수정")} 2026-11-05 15:40 · 정하윤`])],
  ]);
  // 문서는 공통 첨부 칸의 읽기 전용 모양 — 이름(누르면 내려받기) · 크기. A/S센터는 관리 정보 묶음에 둔다(정책서 화면 배치)
  const file = (name, size) => `${ui.link(name, "#")}<span class="text-erp-label">${size}</span>`;
  const manage = ui.detailTable("관리 정보", [
    ["사용 유효기한", "2030-01-01"],
    ["품질 보증기한", "2027-01-01"],
    ["사용 매뉴얼", file("사용매뉴얼.pdf", "1.8MB")],
    ["주의사항", file("사용주의사항.pdf", "320KB")],
    ["제품 보증서", file("제품보증서.png", "640KB")],
    ["관리 담당자", ui.detailValues(["서지안", "010-2323-2323"])],
    ["점검 주기", ui.detailValues(["매월", "매달 정기휴일에 점검"])],
    ["A/S센터", `<span class="truncate">${sub("[ 우편번호")} 04522 ${sub("]")} 서울 중구 삼봉로 98, 1층 2호</span><span class="h-[11px] w-px shrink-0 bg-[#d9d9d9]"></span><span class="shrink-0">02-2222-8888</span>`],
  ]);

  // 삭제 확인 — 논리 삭제. 1팀 화면은 빨간 버튼을 쓰지 않아 확인 버튼도 기본 색(점포 삭제와 같다)
  const deleteDialog =
    closed || sample === "history"
      ? ""
      : x.dialog(
          deleteId,
          "시설물·장비를 삭제하시겠습니까?",
          `<div class="flex flex-col gap-[12px]"><dl class="grid grid-cols-[90px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]"><dt class="text-erp-label">시설물/장비명</dt><dd>${d.name}</dd><dt class="text-erp-label">점포</dt><dd>${d.store}</dd><dt class="text-erp-label">그룹 · 분류</dt><dd>${d.group} · ${d.klass}</dd></dl>${warnBand("삭제하면 시설물·장비 목록에서 제외되고 복구할 수 없습니다.\n잘못 등록한 것이 아니라면 운영상태를 폐기로 바꿔 주세요.")}</div>`,
          ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "stores/facilities.html") }),
        );

  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]">${head}${closed ? noticeBand("info", "폐점 점포의 시설물·장비는 조회만 할 수 있습니다.") : ""}<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${manage}</div></div>` +
      deleteDialog,
  );
  const title = sample === "history" ? "시설물 및 장비 상세 · 수리 이력 있음" : closed ? "시설물 및 장비 상세 · 폐점 점포" : "시설물 및 장비 상세";
  return { title, html: ui.erpFrame({ header: erpHeader(A, R), title: "시설물 및 장비 관리", body }) };
};

export default (ctx) => render(ctx);
