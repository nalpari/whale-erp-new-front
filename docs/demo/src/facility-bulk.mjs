// 시설물·장비 일괄 등록 레이어 팝업(목록 화면의 [일괄 등록]으로 연다). 목업 docs/mockup/stores/facilities.html 의 #pop-bulk 를 옮겼다.
// 근거: 「시설물·장비 관리 정책서」 PL-7(저장 방식 · 줄 수는 제안). 팝업 두 단계 — ① 양식 내려받기 · 파일 선택 → [올리기]
// ② 같은 크기의 팝업에서 미리보기 검증 → [등록](오류가 있으면 막힘) 또는 [다시 올리기]. 데모는 ②를 「오류 있음」 견본으로 보인다.
// 폭은 1팀 변경이력 팝업과 같은 1000.
import * as ui from "./ui.mjs";
import * as x from "./extra.mjs";
import { tag } from "./config-parts.mjs";
import { noticeBand } from "./store-parts.mjs";

const muted = (t) => `<span class="text-erp-muted">${t}</span>`;
const help = (t) => `<p class="text-[14px] leading-[1.6] text-erp-label break-keep">${t}</p>`;
const box = (title, body) => `<section class="flex flex-col gap-[10px] rounded-[2px] border border-erp-panel-line bg-white p-[16px]"><h3 class="text-[15px] font-semibold text-erp-ink">${title}</h3>${body}</section>`;
const WIDE = "w-[1000px]";

// 미리보기 견본 — 엑셀 행 번호 · 결과 · 주요 칸 · 오류 사유(「칸: 사유」)
const ROWS = [
  [2, true, "모리커피 성수점", "점포 장비", "커피머신", "라마르조코 리네아 PB 2그룹", "2025-07-10", "2025-07-14", []],
  [3, false, "모리커피 성수점", "점포 장비", "스팀기", "호시자키 제빙기 IM-45", "2025-03-02", "2025-03-01", ["분류: 「점포 장비」에 없는 분류입니다.", "설치일: 구매일보다 앞설 수 없습니다."]],
  [4, true, "온기식당 판교점", "점포 시설물", "급수", "직수형 정수기", "2025-05-20", "2025-05-21", []],
  [5, false, "ST000012 (폐점)", "점포 시설물", "냉난방", "천장형 냉난방기", "", "", ["점포코드: 폐점 점포에는 등록할 수 없습니다.", "영업사원 전화번호: 숫자 9~12자리입니다."]],
];

// 목록 제목 줄에 둘 [일괄 등록] 버튼과 두 팝업
export const bulkUpload = () => {
  const pickId = ui.uid("dialog");
  const previewId = ui.uid("dialog");
  const button = x.dialogTrigger("일괄 등록", pickId, "soft");

  const pick = x.dialog(
    pickId,
    "시설물 · 장비 일괄 등록",
    `<div class="flex flex-col gap-[18px]">${box(
      "1. 양식 내려받기",
      help("운영상태 · 그룹 · 분류 · 점검 주기는 양식 안 드롭다운에서 고르고, 점포는 둘째 시트의 점포코드를 적어 주세요.<br>문서 · 관리 담당자 · A/S센터 주소는 등록한 뒤 수정 화면에서 넣습니다.") +
        `<div>${ui.button("양식 내려받기", { variant: "soft" })}</div>`,
    )}${box(
      "2. 파일 올리기",
      help("내려받은 양식으로 작성한 .xlsx 파일 1개, 한 번에 500건까지 올릴 수 있습니다. 올리면 바로 등록하지 않고 먼저 확인합니다.") +
        `<div class="flex items-center gap-[10px]">${ui.button("파일 선택", { variant: "soft" })}<span class="text-[14px] text-erp-ink">시설물장비_일괄등록_성수점.xlsx <span class="text-erp-label">· 24KB</span></span></div>`,
    )}</div>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("올리기", { "data-dialog": previewId, "data-close": true }),
    WIDE,
  );

  const bad = ROWS.filter((r) => !r[1]).length;
  const table = ui.dataTable(
    [
      { header: "행", width: "w-[50px]" },
      { header: "결과", width: "w-[70px]" },
      { header: "점포", width: "w-[140px]", align: "left" },
      { header: "그룹", width: "w-[100px]" },
      { header: "분류", width: "w-[80px]" },
      { header: "시설물/장비명", width: "w-[190px]", align: "left" },
      { header: "구매일", width: "w-[100px]" },
      { header: "설치일", width: "w-[100px]" },
      { header: "오류 사유", align: "left" },
    ],
    ROWS.map(([n, good, store, group, klass, name, buy, install, reasons]) => [
      n,
      good ? ui.badge("on", "정상") : ui.badge("off", "오류"),
      store,
      tag(group),
      klass,
      name,
      buy || muted("-"),
      install || muted("-"),
      good ? muted("-") : `<span class="block whitespace-normal leading-[1.5] text-erp-off">${reasons.join("<br>")}</span>`,
    ]),
  );
  const summary =
    `<div class="flex items-center gap-[10px] text-[14px]"><span class="flex-1 text-erp-label">시설물장비_일괄등록_성수점.xlsx</span>` +
    `<span>전체 <b class="font-semibold">${ROWS.length}</b>건</span><span class="h-[11px] w-px bg-[#d9d9d9]"></span>` +
    `<span>정상 <b class="font-semibold">${ROWS.length - bad}</b>건</span><span class="h-[11px] w-px bg-[#d9d9d9]"></span>` +
    `<span class="text-erp-off">오류 <b class="font-semibold">${bad}</b>건</span>${ui.button("오류 내용 내려받기", { variant: "soft" })}</div>`;
  // 오류가 한 줄이라도 있으면 [등록]을 막고 이유를 말풍선으로(공통 Blocked)
  const preview = x.dialog(
    previewId,
    "시설물 · 장비 일괄 등록 · 미리보기",
    `<div class="flex flex-col gap-[12px]">${summary}${noticeBand("risk", "오류를 고친 파일을 다시 올려 주세요.", "오류가 한 줄이라도 있으면 등록할 수 없습니다. 미리보기에서는 값을 고칠 수 없습니다.")}<div class="max-h-[360px] overflow-y-auto">${table}</div></div>`,
    ui.button("다시 올리기", { variant: "off", "data-dialog": pickId, "data-close": true }) + ui.blocked(ui.button("등록", { disabled: true }), "오류를 고친 파일을 다시 올려 주세요."),
    WIDE,
  );
  return { button, dialogs: pick + preview };
};
