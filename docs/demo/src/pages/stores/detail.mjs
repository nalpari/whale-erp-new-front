// 점포 상세. 목업 docs/mockup/stores/detail.html 의 기본 상태(모리커피 연남점 · 운영)를 BP 마스터로 본 것.
// 생김새는 1팀 /design/detail 샘플: 카드 안 묶음 제목 줄 + [버튼] 과 상세 표.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const [code, name, type, state, biz, phone, staff, date, , photo] = STORES.find((s) => s[0] === "ST000006");
  const statusId = x.dialogId();

  const head = ui.sectionHead(
    name,
    x.dialogTrigger("점포 상태 변경", statusId, "soft") +
      f.disabledButton("점포 삭제", "미운영 점포만 삭제할 수 있습니다. 운영을 끝내려면 점포 상태 변경에서 폐점하세요.") +
      ui.button("점포 정보 수정", { variant: "soft", href: link(R, "stores/edit.html") }) +
      ui.button("목록", { href: link(R, "stores/index.html") }),
  );

  const basic = ui.detailTable("점포 기본정보", [
    
    ["점포코드", code],
    ["점포유형", type],
    ["점포상태", ui.badge("on", state)],
    ["점포 연락처", phone],
    ["주소", "03991 서울 마포구 동교로 256, 1층"],
    ["위도 · 경도", ui.detailValues(["37.562104", "126.925631"])],
    ["위치 적용 여부", "사용"],
    ["등록일", date],
    ["등록자", "정하윤"],
    ["최근 수정일시", "2026-08-14 10:31"],
    ["최근 수정자", "정하윤"],
  ]);
  const bizInfo = ui.detailTable(f.titleBadge("점포 사업자정보", "on", "인증 완료"), [
    ["사업자등록번호", biz],
    ["대표자명", "박서윤"],
    ["상호명", "모리커피 연남"],
    ["사업자주소", "03991 서울 마포구 동교로 256, 1층"],
    ["업태 · 종목", ui.detailValues(["음식점업", "커피전문점"])],
    ["개업일자", "2019-05-10"],
    ["대표자 연락처", "010-5521-3380"],
    ["최종 인증일시", "2025-08-01 14:22"],
  ]);
  const linked = ui.detailTable("연계 관리정보", [["근무직원 수", `${staff}명 <span class="text-erp-label">재직 직원</span>`]]);

  const floors = ui.dataTable(
    [{ header: "층" }, { header: "매장평수" }, { header: "전용면적" }, { header: "좌석수" }],
    [
      ["지상 1층", "18평", "59.5㎡", "32석"],
      ["지상 2층", "12평", "39.7㎡", "20석"],
    ],
    "등록한 층별 정보가 없습니다.",
  );
  const history = ui.dataTable(
    [{ header: "변경 일시", width: "w-[180px]" }, { header: "변경자", width: "w-[140px]" }, { header: "변경 항목", width: "w-[180px]" }, { header: "변경 전" }, { header: "변경 후" }],
    [
      ["2026-08-14 10:31", "정하윤", "점포 연락처", "02-322-1100", "02-322-1180"],
      ["2026-03-02 16:45", "박서윤", "위치 적용 여부", "미사용", "사용"],
      ["2025-11-20 09:12", "박서윤", "대표자명", "박서연", "박서윤"],
      ["2025-08-20 11:00", "정하윤", "점포상태", "미운영", "운영"],
    ],
    "변경 이력이 없습니다.",
  );

  // 운영 점포의 상태 변경: 갈 수 있는 곳은 폐점뿐이고, 기본 상태는 폐점 조건을 못 채운 경우다.
  const statusDialog = x.dialog(
    statusId,
    "점포 상태 변경",
    `<p>현재 상태 ${ui.badge("on", "운영")} — 운영은 미운영으로 되돌릴 수 없어 <b class="font-semibold">폐점</b>만 고를 수 있습니다.</p>` +
      `<div class="mt-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]"><p class="font-semibold">폐점 조건</p><ul class="mt-[6px] list-disc pl-[18px]"><li>진행 중인 근로계약 <b class="font-semibold">6건</b> — 정리해야 할 근로계약이 있습니다</li><li class="text-erp-label">이용 중인 부가서비스 구독 — 1차 범위 밖</li><li class="text-erp-label">정산 대기 금액 — 1차 범위 밖</li></ul></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + f.disabledButton("폐점으로 변경", "폐점 조건을 채우지 못했습니다.", "primary"),
  );

  const section = (title, body) => `<div class="flex flex-col gap-[12px]">${ui.sectionHead(title)}${body}</div>`;
  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]">${head}<div class="grid grid-cols-2 items-start gap-[24px]"><div class="flex items-start gap-[12px]">${f.imageBox(`${A}img/${photo}`, `${name} 대표 이미지`)}<div class="min-w-px flex-1">${basic}</div></div><div class="flex flex-col gap-[24px]">${bizInfo}${linked}</div></div></div>` +
      section("기타 정보 · 층별", floors) +
      section("변경 이력", history) +
      statusDialog,
  );

  return { title: "점포 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "점포 정보 관리", body }) };
};
