// node --test src/app/payslips/payslip-row.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { PayslipReviewReason } from "../../lib/payslips.ts";
import { attendanceCell, earningHelp, periodText, reviewBand, sentDateText } from "./payslip-row.ts";

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

test("가산을 끄면 연장수당은 계산하지 않고 야간 · 휴일근무수당은 가산 대상 아님", () => {
  assert.equal(earningHelp(item, false), "가산 미적용이라 연장수당을 계산하지 않는다");
  assert.equal(earningHelp({ ...item, itemCode: "NIGHT_WORK_PAY", calculatedAmount: null }, false), "가산 대상 아님 · 넣어도 가산하지 않는다");
  assert.equal(earningHelp({ ...item, itemCode: "HOLIDAY_WORK_PAY", calculatedAmount: null }, false), "가산 대상 아님 · 넣어도 가산하지 않는다");
});

const reason = (reviewReason: PayslipReviewReason["reviewReason"], detail: string | null): PayslipReviewReason => ({
  payslipReviewReasonId: 1,
  reviewReason,
  detail,
  acknowledgedAt: null,
});
const label = (v: string) => ({ CONTRACT_CHANGED: "기간 중 계약 변경" })[v] ?? v;

test("경고 띠 — 출퇴근 누락은 데모 문구, 공제 미입력만 있으면 띠가 없다", () => {
  assert.deepEqual(reviewBand([reason("MISSING_ATTENDANCE", "출퇴근 기록 2일 누락"), reason("DEDUCTION_MISSING", "4대보험")], label), {
    title: "출퇴근 기록이 누락되어 검토 대기로 분류되었습니다",
    desc: "출퇴근 기록 2일 누락. 확인한 뒤에는 경고가 있어도 확정할 수 있습니다.",
  });
  assert.equal(reviewBand([reason("DEDUCTION_MISSING", null)], label), null);
  assert.equal(reviewBand([], label), null);
});

test("경고 띠 — 다른 사유는 사유 한글로, 상세가 없으면 한글을 쓴다", () => {
  assert.deepEqual(reviewBand([reason("CONTRACT_CHANGED", null)], label), {
    title: "기간 중 계약 변경 사유로 검토 대기로 분류되었습니다",
    desc: "기간 중 계약 변경. 확인한 뒤에는 경고가 있어도 확정할 수 있습니다.",
  });
});
