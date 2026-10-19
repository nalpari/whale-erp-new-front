// 점포 상세. 목업 docs/mockup/stores/detail.html 의 기본 상태(모리커피 연남점 · 운영)를 BP 마스터로 본 것.
// 생김새는 1팀 /design/detail 샘플: 카드 안 묶음 제목 줄 + [버튼] 과 상세 표.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { tag } from "../../config-parts.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const [code, name, type, state, biz, phone, staff, date, , photo] = STORES.find((s) => s[0] === "ST000006");
  const statusId = x.dialogId();
  const histId = x.dialogId();

  const head = ui.sectionHead(
    name,
    x.dialogTrigger("상태 변경", statusId, "soft") +
      f.disabledButton("삭제", "미운영 점포만 삭제할 수 있습니다. 운영을 끝내려면 상태 변경에서 폐점하세요.") +
      ui.button("수정", { variant: "soft", href: link(R, "stores/edit.html") }) +
      ui.button("목록", { href: link(R, "stores/index.html") }),
  );

  // 점포 기본정보: 실제 앱(page.tsx)과 같은 한 표다 — 대표 이미지는 사이드 칸이 아니라 표의 첫 줄(multiline)이고,
  // 그 아래로 점포코드 · 점포 연락처 · 점포 주소 · 좌표정보 · 재직직원 · 변경이력이 이어진다. 네 쪽 표를 <dl> 만
  // 떼어 나란히 붙이던 이전 방식은 각 <dl> 이 w-full 이라 겹쳐 넓이가 깨졌다(2026-10-19 점검 — 실사용자 확인).
  const basic = ui.detailTable(
    `점포 기본정보<span class="ml-[18px] inline-flex items-center gap-[8px] align-middle text-[14px] font-medium text-erp-label">${tag(type)}${ui.badge("on", state)}</span>`,
    [
      [
        "대표 이미지",
        `<img src="${A}img/${photo}" alt="${name} 대표 이미지" width="184" height="184" class="rounded-[2px] object-cover">`,
        true,
      ],
      ["점포코드", code],
      ["점포 연락처", phone],
      // 한 줄 「[우편번호 04104] 기본주소(볼드), 상세주소」(2026-10-19 점검 — 두 줄이던 걸 한 줄로).
      [
        "점포 주소",
        `<span><span class="mr-[10px] text-erp-label">[우편번호 03991]</span><b class="font-semibold">서울 마포구 동교로 256</b>, 1층</span>`,
        true,
      ],
      // 위도 · 경도 · 출퇴근 위치 적용 여부 각각 라벨과 같은 회색 글자를 앞에 두고, 데이터와 한 단 더 떨어뜨렸다
      // (2026-10-16 점검 — 그냥 띄어쓰기 한 칸은 너무 붙어 보였다).
      [
        "좌표정보",
        ui.detailValues([
          `<span class="mr-[10px] text-erp-label">위도</span>37.562104`,
          `<span class="mr-[10px] text-erp-label">경도</span>126.925631`,
          `<span class="mr-[10px] text-erp-label">출퇴근 위치 적용 여부</span>사용`,
        ]),
      ],
      ["재직직원", `${staff}명`],
      // 값은 BP 상세와 같은 「일시 | 사람」을 등록 · 최종수정 두 칸으로 나눠 한 행에 담는다. 등록 시각은
      // 사업자 최초 인증(14:22) 직전으로 잡았다. 「등록」·「최종수정」 글자는 라벨과 같은 회색이다. [변경이력
      // 보기] 버튼은 detailValues 밖에 따로 둬 앞에 구분선(|)이 안 붙게 하고, justify-between 으로 칸 맨
      // 오른쪽에 고정한다 — 칸 자체의 12px 오른쪽 여백이 있어 따로 더 주지 않는다(2026-10-16 점검).
      [
        "변경이력",
        `<span class="flex w-full items-center justify-between gap-[12px]">${ui.detailValues([
          `<span class="mr-[10px] text-erp-label">등록</span>${date} 14:18 · 정하윤`,
          `<span class="mr-[10px] text-erp-label">최종수정</span>2026-08-14 10:31 · 정하윤`,
        ])}${x.dialogTrigger("변경이력", histId, "soft")}</span>`,
      ],
    ],
  );
  const bizInfo = ui.detailTable(f.titleBadge("사업자정보", "on", "인증 완료"), [
    // 번호가 마지막으로 언제 인증됐는지 바로 옆에서 보이게 한 행으로 묶었고, 대표자명 · 대표자 연락처도 라벨과
    // 같은 회색 글자를 앞에 두는 모양으로 맞췄다. 순서는 상호명 · 사업자등록번호 · 대표자정보 · 개업일자 ·
    // 업태종목 · 사업자주소(2026-10-16 점검).
    ["상호명", "모리커피 연남"],
    ["사업자등록번호", ui.detailValues([biz, `<span class="mr-[10px] text-erp-label">최종 인증일시</span>2025-08-01 14:22`])],
    [
      "대표자정보",
      ui.detailValues([
        `<span class="mr-[10px] text-erp-label">대표자 이름</span>박서윤`,
        `<span class="mr-[10px] text-erp-label">대표자 연락처</span>010-5521-3380`,
      ]),
    ],
    ["개업일자", "2019-05-10"],
    ["업태 · 종목", ui.detailValues(["음식점업", "커피전문점"])],
    [
      "사업자주소",
      `<span><span class="mr-[10px] text-erp-label">[우편번호 03991]</span><b class="font-semibold">서울 마포구 동교로 256</b>, 1층</span>`,
    ],
  ]);

  // 점포 기본정보 · 사업자정보와 같은 DetailTable — 라벨은 "층구분"이고, 지상 1층 같은 값도 매장평수(평) ·
  // 전용면적(㎡) · 좌석 수와 함께 오른쪽 데이터 줄에 구분선(|)으로 나열한다. 매장평수와 전용면적은 같은
  // 면적의 단위 차이가 아니라 서로 다른 두 항목이다(okf/stores.md S-ALHLHW, 2026-10-16 점검).
  const floors = ui.detailTable("점포 공간정보", [
    ["층구분", ui.detailValues(["지상 1층", "18평", "59.5㎡", "32석"])],
    ["층구분", ui.detailValues(["지상 2층", "12평", "39.7㎡", "20석"])],
  ]);
  // 변경 이력: 한 쪽 10건, 2쪽(총 14건) 중 1쪽. 표는 5줄 높이(머리 42 + 줄 46×5)로 두고 넘치면 표 안에서 스크롤, 머리글은 고정.
  const history =
    `<div class="max-h-[273px] overflow-y-auto border-y border-erp-thead-line [&_thead]:sticky [&_thead]:top-0 [&_thead]:shadow-[0_1px_0_var(--color-erp-thead-line)] [&_thead_tr]:border-y-0 [&_tbody_tr:last-child]:border-b-0">${ui.dataTable(
      [{ header: "변경 일시", width: "w-[150px]" }, { header: "변경자", width: "w-[70px]" }, { header: "변경 항목", width: "w-[140px]", align: "left" }, { header: "변경 전", align: "left" }, { header: "변경 후", align: "left" }],
      [
        ["2026-08-14 10:31", "정하윤", "점포 연락처", "02-322-1100", "02-322-1180"],
        ["2026-06-18 11:05", "박서윤", "대표 이미지", "없음", "등록"],
        ["2026-05-07 09:40", "정하윤", "층별 정보", "지상 1층 18평", "지상 1층 18평 · 지상 2층 12평"],
        ["2026-03-02 16:45", "박서윤", "출퇴근 위치 적용 여부", "미사용", "사용"],
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

  // 변경이력 팝업(BP 상세 · 플랫폼 관리자 history-dialog 와 같은 생김새) — 기본정보의 [변경이력] 버튼으로 연다.
  // 등록 · 최종수정은 기본정보의 변경이력 행에 이미 보이므로 팝업에는 표를 바로 둔다. 표가 넓어 이 창만
  // 회원가입 약관동의 팝업(terms-dialog.tsx)과 같은 860 으로 넓힌다(2026-10-16 점검).
  const historyDialog = x
    .dialog(histId, "변경이력", history, ui.button("닫기", { variant: "off", "data-close": true }))
    .replace("w-[420px]", "w-[860px] max-h-[calc(100dvh-48px)] overflow-y-auto");

  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]">${head}<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${bizInfo}</div></div>` +
      floors +
      statusDialog +
      historyDialog,
  );

  return { title: "점포 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "점포 정보 관리", body }) };
};
