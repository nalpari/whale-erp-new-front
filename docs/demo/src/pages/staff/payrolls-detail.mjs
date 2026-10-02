// 급여명세서 검토. 목업 docs/mockup/staff/payrolls-detail.html(서지안 · 2026-08 · 검토 중)을 BP 마스터로 본 것.
// 표본이 정직원이라 파트타이머 명세서에만 서는 3.3% 원천징수 스위치와 칸은 넣지 않았다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const confirmId = x.dialogId();
  const money = (label, value, help) => p.fieldH(label, ui.textField({ value, inputmode: "numeric" }), help);
  const blank = (label, help = "직접 입력") => p.fieldH(label, ui.textField({ placeholder: "직접 입력", inputmode: "numeric" }), help);
  const groupHead = (title, right) => `<div class="flex items-center gap-[6px]"><span class="flex-1 text-[14px] font-medium text-erp-label">${title}</span>${right}</div>`;

  const head = ui.sectionHead(
    `서지안 <span class="pl-[6px] text-[14px] font-normal text-erp-label">2026-08 · 모리커피 서초점</span>`,
    p.tag("warn", "검토 중") +
      `<span class="w-[6px]"></span>` +
      ui.button("목록", { variant: "off", href: L("staff/payslips.html") }) +
      ui.button("임시저장", { variant: "soft" }) +
      x.dialogTrigger("확정", confirmId),
  );
  const warn = p.band("출퇴근 기록이 2일 누락되어 검토 대기로 분류되었습니다", {
    desc: "09-05 퇴근 미등록, 08-22 출근·퇴근 모두 없음. 확인한 뒤에는 경고가 있어도 확정할 수 있습니다.",
    actions: ui.button("출퇴근 보정", { variant: "soft", href: L("staff/attendance.html") }),
  });

  const pay = p.section(
    "지급 내역",
    p.tag("quiet", "2026-08-01 ~ 08-31") + `<span class="w-[6px]"></span>` + ui.button("출퇴근으로 다시 계산", { variant: "soft" }),
    `<div class="flex flex-col gap-[8px]">${x.toggle("연장·야간·휴일 가산 적용", true)}</div>`,
    ui.formGroup(
      "지급",
      ui.formRow(money("기본급", "2,840,000", "근로계약의 월급 · 계산값"), money("주휴수당", "0", "월급제는 기본급에 포함 · 계산값")),
      ui.formRow(money("연장수당", "128,000", "8.0h × 1.5배 · 가산 적용 · 계산값 96,000 을 128,000 으로 고침"), money("야간수당", "0", "직접 입력")),
      ui.formRow(money("휴일근무수당", "0", "직접 입력"), money("추가근무수당", "0", "직접 입력")),
      ui.formRow(money("연차수당", "0", "직접 입력"), money("상여", "0", "")),
    ),
    ui.formGroup(
      "지급 · 비과세",
      ui.formRow(money("식대", "58,000", "비과세"), money("자가운전보조금", "0", "비과세"), money("육아수당", "0", "비과세")),
    ),
    ui.formGroup(
      "공제 · 기본",
      groupHead("", ui.button("지난 명세서에서 불러오기", { variant: "soft" })),
      ui.formRow(blank("국민연금"), blank("건강보험")),
      ui.formRow(blank("고용보험"), blank("장기요양보험")),
      ui.formRow(blank("소득세"), blank("지방소득세")),
    ),
    ui.formGroup(
      "공제 · 추가",
      groupHead("", ui.button("항목 추가", { variant: "soft" })),
    ),
    p.total("실지급액", "₩3,026,000"),
    p.band("기본 공제 여섯 칸이 아직 비어 있습니다", {
      tone: "risk",
      desc: "지금 실지급액은 지급 총액과 같습니다. 기본 공제나 붙인 추가 공제가 비어 있으면 확정할 수 없습니다. 공제 대상이 아닌 항목에는 0 을 넣으세요.",
    }),
    p.bar("", ui.button("미리보기", { variant: "off" })),
  );

  const reasons = p.section(
    "검토 사유",
    p.tag("warn", "2건"),
    ui.dataTable(
      [{ header: "사유", width: "w-[120px]" }, { header: "내용", align: "left" }],
      [
        [p.tag("warn", "출퇴근 누락"), `출퇴근 기록 2일 누락 ${p.sub("09-05 퇴근 · 08-22 종일")}`],
        [p.tag("risk", "공제 미입력"), `공제 미입력 ${p.sub("4대보험 · 소득세 둘 다 비어 있음")}`],
      ],
    ),
    ui.detailTable("그 밖의 사유", [
      ["계약 만료 후 기록 포함", p.sub("해당 없음")],
      ["기간 중 계약 변경", p.sub("해당 없음")],
    ]),
  );
  const refs = p.section(
    "참조한 것",
    ui.button("출퇴근 기록 보기", { variant: "soft", href: L("staff/attendance.html") }),
    ui.detailTable("근로계약 · 출퇴근", [
      ["근로계약", `${ui.link("CTR-2026-0143", L("staff/contracts-detail.html"))} · 체결 완료`],
      ["계약 급여", "2,840,000 원 / 월"],
      ["출퇴근 기간", "2026-08-01 ~ 08-31"],
      ["집계 근로시간", `168.0h ${p.sub("(누락 2일 제외)")}`],
      ["근무스케줄 기준", "176.0h"],
    ]),
  );
  const log = p.section(
    "처리 이력",
    "",
    ui.dataTable(
      [{ header: "일시", width: "w-[110px]" }, { header: "구분", width: "w-[90px]" }, { header: "내용", align: "left" }],
      [
        ["09-03 14:40", "수정", "연장수당 96,000 → 128,000 · 소득세 12,400 → 15,900 · 정하윤"],
        ["09-03 10:12", "수정", "기본급 1,842,000 → 1,876,000 · 정하윤"],
        ["09-03 09:20", "수정", "3.3% 원천징수 적용 → 미적용 · 정하윤"],
        ["09-02 17:05", "수정", "연장·야간·휴일 가산 미적용 → 적용 · 정하윤"],
        ["09-01 09:00", "초안 생성", "초안 일괄 생성 · 검토 대기로 분류"],
      ],
    ),
  );

  const confirmDialog = x.dialog(
    confirmId,
    "급여명세서를 확정하시겠습니까?",
    "확정하면 수정할 수 없습니다. 확정 취소하면 검토 중으로 돌아옵니다. 발송은 급여명세서 목록에서 확정 건을 모아 보냅니다.",
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("확정", { "data-close": true }),
  );
  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${warn}</div>${p.cols(pay, reasons + refs + log)}${confirmDialog}`);
  return { title: "급여명세서 검토", html: ui.erpFrame({ header: erpHeader(A, R), title: "급여명세서 검토", body }) };
};
