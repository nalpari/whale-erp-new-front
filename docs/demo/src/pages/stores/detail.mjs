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
    x.dialogTrigger("상태 변경", statusId, "soft") +
      f.disabledButton("삭제", "미운영 점포만 삭제할 수 있습니다. 운영을 끝내려면 상태 변경에서 폐점하세요.") +
      ui.button("수정", { variant: "soft", href: link(R, "stores/edit.html") }) +
      ui.button("목록", { href: link(R, "stores/index.html") }),
  );

  // 점포 기본정보: 위 네 줄(점포코드 · 유형 · 상태 · 근무직원 수) 왼쪽에 대표 이미지 칸을 두고, 그 아래 줄은 표 폭 그대로 이어 간다.
  // 1팀 DetailTable 은 그대로 두고 그 머리글과 줄 묶음(dl)만 꺼내 이어 붙인다.
  const part = (rows) => ui.detailTable("", rows).match(/<dl[\s\S]*<\/dl>/)[0];
  const basicHead = ui.detailTable("점포 기본정보", []).match(/<h3[\s\S]*<\/h3>/)[0];
  const photoCell = `<div class="h-[184px] w-[184px] shrink-0 border-l border-b border-erp-thead-line bg-white p-[8px]"><img src="${A}img/${photo}" alt="${name} 대표 이미지" class="size-full rounded-[2px] object-cover"></div>`;
  const basic =
    `<div class="w-full">${basicHead}<div class="flex">${photoCell}${part([
      ["점포코드", code],
      ["점포유형", type],
      ["점포상태", ui.badge("on", state)],
      ["근무직원 수", `${staff}명 <span class="text-erp-label">재직 직원</span>`],
    ])}</div>${part([
      ["점포 연락처", phone],
      ["주소", "03991 서울 마포구 동교로 256, 1층"],
    ])}<div class="flex">${part([["위도 · 경도", ui.detailValues(["37.562104", "126.925631"])]])}${part([["위치 적용 여부", "사용"]])}</div><div class="flex">${part([
      // 값은 BP 상세와 같은 「일시 | 사람」, 라벨은 일시만 적는다. 등록과 최종 수정을 한 줄에 반씩 둔다(위도 · 경도 | 위치 적용 여부도 같은 방식). 등록 시각은 사업자 최초 인증(14:22) 직전으로 잡았다.
      ["등록일시", ui.detailValues([`${date} 14:18`, "정하윤"])],
    ])}${part([["최종수정일시", ui.detailValues(["2026-08-14 10:31", "정하윤"])]])}</div></div>`;
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

  const floors = ui.dataTable(
    [{ header: "층" }, { header: "매장평수" }, { header: "전용면적" }, { header: "좌석수" }],
    [
      ["지상 1층", "18평", "59.5㎡", "32석"],
      ["지상 2층", "12평", "39.7㎡", "20석"],
    ],
    "등록한 층별 정보가 없습니다.",
  );
  // 변경 이력: 한 쪽 10건, 2쪽(총 14건) 중 1쪽. 표는 5줄 높이(머리 42 + 줄 46×5)로 두고 넘치면 표 안에서 스크롤, 머리글은 고정.
  const history =
    `<div class="max-h-[273px] overflow-y-auto border-y border-erp-thead-line [&_thead]:sticky [&_thead]:top-0 [&_thead]:shadow-[0_1px_0_var(--color-erp-thead-line)] [&_thead_tr]:border-y-0 [&_tbody_tr:last-child]:border-b-0">${ui.dataTable(
      [{ header: "변경 일시", width: "w-[180px]" }, { header: "변경자", width: "w-[140px]" }, { header: "변경 항목", width: "w-[180px]" }, { header: "변경 전" }, { header: "변경 후" }],
      [
        ["2026-08-14 10:31", "정하윤", "점포 연락처", "02-322-1100", "02-322-1180"],
        ["2026-06-18 11:05", "박서윤", "대표 이미지", "없음", "등록"],
        ["2026-05-07 09:40", "정하윤", "층별 정보", "지상 1층 18평", "지상 1층 18평 · 지상 2층 12평"],
        ["2026-03-02 16:45", "박서윤", "위치 적용 여부", "미사용", "사용"],
        ["2026-02-11 14:02", "정하윤", "위도 · 경도", "37.562000 · 126.925500", "37.562104 · 126.925631"],
        ["2025-12-04 10:18", "정하윤", "대표자 연락처", "010-5521-3300", "010-5521-3380"],
        ["2025-11-20 09:12", "박서윤", "대표자명", "박서연", "박서윤"],
        ["2025-09-15 13:27", "정하윤", "업태 · 종목", "음식점업 · 카페", "음식점업 · 커피전문점"],
        ["2025-08-20 11:00", "정하윤", "점포상태", "미운영", "운영"],
        ["2025-08-12 17:48", "정하윤", "상호명", "모리커피", "모리커피 연남"],
      ],
      "변경 이력이 없습니다.",
    )}</div>` + `<div class="pt-[12px]">${ui.pagination(A, 1, 2)}</div>`;

  // 운영 점포의 상태 변경: 갈 수 있는 곳은 폐점뿐이고, 기본 상태는 폐점 조건을 못 채운 경우다.
  const statusDialog = x.dialog(
    statusId,
    "상태 변경",
    `<p>현재 상태 ${ui.badge("on", "운영")}</p>` +
      `<div class="mt-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]"><p class="font-semibold">폐점 조건</p><ul class="mt-[6px] list-disc pl-[18px]"><li>진행 중인 근로계약 <b class="font-semibold">6건</b> — 정리해야 할 근로계약이 있습니다</li><li class="text-erp-label">이용 중인 부가서비스 구독 — 1차 범위 밖</li><li class="text-erp-label">정산 대기 금액 — 1차 범위 밖</li></ul></div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + f.disabledButton("폐점으로 변경", "폐점 조건을 채우지 못했습니다.", "primary"),
  );

  const section = (title, body) => `<div class="flex flex-col gap-[12px]">${ui.sectionHead(title)}${body}</div>`;
  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]">${head}<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${bizInfo}</div></div>` +
      section("기타 정보 · 층별", floors) +
      section(`변경 이력 <span class="text-[14px] font-medium text-erp-label">총 14건</span>`, history) +
      statusDialog,
  );

  return { title: "점포 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "점포 정보 관리", body }) };
};
