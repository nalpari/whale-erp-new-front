// node --test src/app/payslips/payslip-row.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { PayslipReviewReason } from "../../lib/payslips.ts";
import { attendanceCell, attendanceHref, detailReviewReasons, earningHelp, periodText, reviewBand, sentDateText } from "./payslip-row.ts";

test("목록 칸 — 급여 기간, 출퇴근 확인 전은 「누락」 · 확인은 「확인」 · 가린 줄은 null", () => {
  assert.equal(periodText({ periodStartDate: "2026-09-01", periodEndDate: "2026-09-30" }), "2026-09-01 ~ 2026-09-30");
  assert.deepEqual(attendanceCell({ isAttendanceConfirmed: false }), { text: "누락", style: "mark-off" });
  assert.deepEqual(attendanceCell({ isAttendanceConfirmed: true }), { text: "확인", style: "mark-on" });
  assert.equal(attendanceCell({ isAttendanceConfirmed: null }), null);
});

test("발송일 — 한국 날짜 MM-DD, 발송 전이면 「-」", () => {
  assert.equal(sentDateText({ lastSentAt: "2026-09-10T10:00:00+09:00" }), "09-10");
  // UTC 로 전날이어도 한국 날짜로 끊는다
  assert.equal(sentDateText({ lastSentAt: "2026-09-09T16:30:00Z" }), "09-10");
  assert.equal(sentDateText({ lastSentAt: null }), "-");
});

const item = { itemCode: "OVERTIME_PAY", isTaxFree: false, calculatedAmount: 96_000, adjustedAmount: null };

test("지급 도움말 — 계산값, 고친 값, 직접 입력, 비과세", () => {
  assert.equal(earningHelp(item, true), "계산값");
  assert.equal(earningHelp({ ...item, adjustedAmount: 128_000 }, true), "계산값 96,000 을 128,000 으로 고침");
  // 고친 값이 계산값과 같으면 고친 것이 아니다
  assert.equal(earningHelp({ ...item, adjustedAmount: 96_000 }, true), "계산값");
  assert.equal(earningHelp({ ...item, itemCode: "BONUS", calculatedAmount: null }, true), "직접 입력");
  assert.equal(earningHelp({ ...item, itemCode: "MEAL_ALLOWANCE", isTaxFree: true, calculatedAmount: null }, true), "비과세");
});

test("가산을 끄면 연장수당은 1배로 계산하고 야간 · 휴일근무수당은 가산 대상 아님", () => {
  assert.equal(earningHelp(item, false), "가산 미적용 · 1배로 계산 · 계산값");
  assert.equal(earningHelp({ ...item, adjustedAmount: 128_000 }, false), "가산 미적용 · 1배로 계산 · 계산값 96,000 을 128,000 으로 고침");
  assert.equal(earningHelp({ ...item, itemCode: "NIGHT_WORK_PAY", calculatedAmount: null }, false), "가산 대상 아님 · 넣어도 가산하지 않는다.");
  assert.equal(earningHelp({ ...item, itemCode: "HOLIDAY_WORK_PAY", calculatedAmount: null }, false), "가산 대상 아님 · 넣어도 가산하지 않는다.");
});

const reason = (reviewReason: PayslipReviewReason["reviewReason"], detail: string | null): PayslipReviewReason => ({
  payslipReviewReasonId: 1,
  reviewReason,
  detail,
  acknowledgedAt: null,
});
const label = (v: string) => ({ CONTRACT_CHANGED: "기간 중 계약 변경" })[v] ?? v;

test("경고 띠 — 출퇴근 누락은 사유별 제목, 공제 미입력만 있으면 띠가 없다", () => {
  assert.deepEqual(reviewBand([reason("MISSING_ATTENDANCE", "출퇴근 기록 2일 누락"), reason("DEDUCTION_MISSING", "4대보험")], label), {
    title: "출퇴근 기록이 등록되지 않은 날이 있어 검토가 필요합니다.",
    desc: "출퇴근 기록 2일 누락. 내용을 확인하고 문제가 없으면 그대로 확정할 수 있습니다.",
  });
  assert.equal(reviewBand([reason("DEDUCTION_MISSING", null)], label), null);
  assert.equal(reviewBand([], label), null);
});

test("경고 띠 — 이미 확인한 사유(확정 때 확인됨)는 띠에 세우지 않는다", () => {
  const acknowledged = { ...reason("MISSING_ATTENDANCE", "출퇴근 기록 2일 누락"), acknowledgedAt: "2026-10-19T01:00:00.000Z" };
  assert.equal(reviewBand([acknowledged], label), null);
  assert.equal(reviewBand([acknowledged, reason("CONTRACT_CHANGED", null)], label)?.title, "급여 기간 중 근로계약이 변경되어 검토가 필요합니다.");
});

test("경고 띠 — 사유마다 제목 문장, 상세가 없으면 사유 한글에 마침표를 붙인다", () => {
  assert.deepEqual(reviewBand([reason("CONTRACT_CHANGED", null)], label), {
    title: "급여 기간 중 근로계약이 변경되어 검토가 필요합니다.",
    desc: "기간 중 계약 변경. 내용을 확인하고 문제가 없으면 그대로 확정할 수 있습니다.",
  });
  assert.equal(reviewBand([reason("AFTER_CONTRACT_END", "x.")], label)?.title, "근로계약 종료일 이후의 출퇴근 기록이 있어 검토가 필요합니다.");
  assert.equal(reviewBand([reason("ATTENDANCE_NEEDS_REVIEW", "x.")], label)?.title, "확인 필요로 표시된 출퇴근 기록이 있어 검토가 필요합니다.");
  // 표에 없는 사유는 사유 이름을 끼운 틀
  assert.equal(reviewBand([reason("NEW_REASON" as PayslipReviewReason["reviewReason"], "x.")], label)?.title, "NEW_REASON 사유로 검토 대기로 분류되었습니다.");
});

test("경고 띠 — 빈 상세 · 끝 공백은 사유 이름이나 다듬은 문장으로, 물음표 등으로 끝나면 마침표를 붙이지 않는다", () => {
  assert.equal(reviewBand([reason("CONTRACT_CHANGED", "")], label)?.desc, "기간 중 계약 변경. 내용을 확인하고 문제가 없으면 그대로 확정할 수 있습니다.");
  assert.equal(reviewBand([reason("CONTRACT_CHANGED", "A. ")], label)?.desc, "A. 내용을 확인하고 문제가 없으면 그대로 확정할 수 있습니다.");
  assert.equal(reviewBand([reason("CONTRACT_CHANGED", "A?")], label)?.desc, "A? 내용을 확인하고 문제가 없으면 그대로 확정할 수 있습니다.");
});

test("경고 띠 — 마침표로 끝나는 상세는 빈칸 하나로 잇는다(「..」 없음)", () => {
  assert.equal(
    reviewBand(
      [
        reason("MISSING_ATTENDANCE", "출퇴근 기록이 등록되지 않은 날이 1일 있습니다(10월 9일 출근·퇴근 미등록)."),
        reason("CONTRACT_CHANGED", "급여 기간 중 적용된 근로계약이 2건이어서, 날짜별로 해당 계약을 기준으로 나누어 계산했습니다."),
      ],
      label,
    )?.desc,
    "출퇴근 기록이 등록되지 않은 날이 1일 있습니다(10월 9일 출근·퇴근 미등록). 급여 기간 중 적용된 근로계약이 2건이어서, 날짜별로 해당 계약을 기준으로 나누어 계산했습니다. 내용을 확인하고 문제가 없으면 그대로 확정할 수 있습니다.",
  );
});

test("출퇴근 기록 확인 · 기록 보기 — 출·퇴근 현황 조회를 점포 · 직원 레코드 · 급여 기간으로, 퇴직자도 보이게 재직 상태 전체", () => {
  assert.equal(
    attendanceHref({ storeId: 5, staffMemberId: 30, staffName: "서 지안", periodStartDate: "2026-09-01", periodEndDate: "2026-09-30" }),
    "/attendance-records?storeIds=5&staff=%EC%84%9C+%EC%A7%80%EC%95%88&staffMemberId=30&employment=ALL&fixFrom=2026-09-01&fixTo=2026-09-30",
  );
});

test("상세 검토 사유 — 작성 중 · 검토 중이고 보이는 공제 칸이 비었으면 「공제 미입력」 줄을 더한다(v221 PAY-06)", () => {
  const line = (itemCategory: "EARNING" | "BASIC" | "ADDITIONAL" | "WITHHOLDING", itemCode: string, itemName: string, isEntered: boolean) => ({
    payslipItemId: itemName.length,
    itemCategory,
    payslipItemMasterId: 1,
    itemCode,
    itemName,
    isTaxFree: false,
    calculatedAmount: null,
    adjustedAmount: null,
    isEntered,
  });
  const attendance: PayslipReviewReason = {
    payslipReviewReasonId: 7,
    reviewReason: "MISSING_ATTENDANCE",
    detail: "출퇴근 기록 2일 누락",
    acknowledgedAt: null,
  };
  const base = {
    status: "REVIEWING" as const,
    isWithholdingApplied: false,
    reviewReasons: [attendance],
    items: [line("EARNING", "BONUS", "상여", false), line("BASIC", "NATIONAL_PENSION", "국민연금", false), line("ADDITIONAL", "ETC", "기타공제", false), line("BASIC", "INCOME_TAX", "소득세", true)],
  };
  // 지급 칸은 빈 것을 세지 않는다
  assert.deepEqual(detailReviewReasons(base), [
    attendance,
    { payslipReviewReasonId: 0, reviewReason: "DEDUCTION_MISSING", detail: "국민연금, 기타공제", acknowledgedAt: null },
  ]);
  // 3.3% 를 켜면 소득세 · 지방소득세는 숨어 비어도 세지 않고, 원천징수 칸을 센다
  const withholding = {
    ...base,
    isWithholdingApplied: true,
    items: [line("BASIC", "INCOME_TAX", "소득세", false), line("WITHHOLDING", "BUSINESS_INCOME_TAX", "사업소득세", false)],
  };
  assert.equal(detailReviewReasons(withholding).at(-1)?.detail, "사업소득세");
  assert.deepEqual(detailReviewReasons({ ...withholding, isWithholdingApplied: false, items: [line("WITHHOLDING", "BUSINESS_INCOME_TAX", "사업소득세", false)] }), [attendance]);
  // 공제가 모두 있거나, 확정 · 발송 완료면 사유 줄 그대로
  assert.deepEqual(detailReviewReasons({ ...base, items: [line("BASIC", "NATIONAL_PENSION", "국민연금", true)] }), [attendance]);
  assert.deepEqual(detailReviewReasons({ ...base, status: "CONFIRMED" }), [attendance]);
  assert.equal(detailReviewReasons({ ...base, status: "DRAFTING" }).length, 2);
  // 예전에 저장된 공제 미입력 줄은 공제 칸 판정으로 바꾼다
  const stale: PayslipReviewReason = { payslipReviewReasonId: 9, reviewReason: "DEDUCTION_MISSING", detail: null, acknowledgedAt: null };
  assert.deepEqual(detailReviewReasons({ ...base, reviewReasons: [attendance, stale], items: [] }), [attendance]);
  assert.deepEqual(detailReviewReasons({ ...base, reviewReasons: [attendance, stale] }), [
    attendance,
    { payslipReviewReasonId: 0, reviewReason: "DEDUCTION_MISSING", detail: "국민연금, 기타공제", acknowledgedAt: null },
  ]);
  assert.deepEqual(detailReviewReasons({ ...base, status: "CONFIRMED", reviewReasons: [attendance, stale] }), [attendance]);
  // 3.3% 를 켜도 4대보험 · 추가 공제 · 원천징수의 빈 칸을 센다(소득세 · 지방소득세만 숨는다)
  assert.deepEqual(
    detailReviewReasons({
      ...base,
      isWithholdingApplied: true,
      items: [
        line("BASIC", "NATIONAL_PENSION", "국민연금", false),
        line("BASIC", "LOCAL_INCOME_TAX", "지방소득세", false),
        line("ADDITIONAL", "ETC", "기타공제", false),
        line("WITHHOLDING", "BUSINESS_INCOME_TAX", "사업소득세", false),
        line("EARNING", "BONUS", "상여", false),
      ],
    }),
    [attendance, { payslipReviewReasonId: 0, reviewReason: "DEDUCTION_MISSING", detail: "국민연금, 기타공제, 사업소득세", acknowledgedAt: null }],
  );
});
