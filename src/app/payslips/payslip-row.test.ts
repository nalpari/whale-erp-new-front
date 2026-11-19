// node --test src/app/payslips/payslip-row.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { PayslipReviewReason } from "../../lib/payslips.ts";
import { attendanceCell, attendanceHref, detailReviewReasons, earningHelp, periodText, reviewBand, reviewDetailText, sentDateText, sortDeductions } from "./payslip-row.ts";

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
  assert.equal(earningHelp(item, false), "가산수당 미적용 · 1배로 계산 · 계산값");
  assert.equal(earningHelp({ ...item, adjustedAmount: 128_000 }, false), "가산수당 미적용 · 1배로 계산 · 계산값 96,000 을 128,000 으로 고침");
  assert.equal(earningHelp({ ...item, itemCode: "NIGHT_WORK_PAY", calculatedAmount: null }, false), "가산 대상 아님 · 넣어도 가산하지 않는다.");
  assert.equal(earningHelp({ ...item, itemCode: "HOLIDAY_WORK_PAY", calculatedAmount: null }, false), "가산 대상 아님 · 넣어도 가산하지 않는다.");
});

const reason = (reviewReason: PayslipReviewReason["reviewReason"], detail: string | null): PayslipReviewReason => ({
  payslipReviewReasonId: 1,
  reviewReason,
  detail,
  acknowledgedAt: null,
});

test("경고 띠 — 한 줄로 건수와 할 일만, 사유 내용은 오른쪽 표에(2026-11-19 사용자 지정)", () => {
  assert.deepEqual(reviewBand([reason("MISSING_ATTENDANCE", "출퇴근 기록 2일 누락"), reason("DEDUCTION_MISSING", "4대보험")]), {
    title: "검토가 필요한 사유가 2건 있습니다.",
    desc: "오른쪽 검토 사유를 확인하고, 문제가 없으면 [확정]해 주세요.",
    inline: true,
  });
  // 공제 미입력뿐이면 공제 칸 아래 띠가 말하므로 위 띠는 없다
  assert.equal(reviewBand([reason("DEDUCTION_MISSING", null)]), null);
  assert.equal(reviewBand([]), null);
});

test("경고 띠 — 이미 확인한 사유(확정 때 확인됨)는 세지 않는다", () => {
  const acknowledged = { ...reason("MISSING_ATTENDANCE", "출퇴근 기록 2일 누락"), acknowledgedAt: "2026-10-19T01:00:00.000Z" };
  assert.equal(reviewBand([acknowledged]), null);
  assert.equal(reviewBand([acknowledged, reason("CONTRACT_CHANGED", null)])?.title, "검토가 필요한 사유가 1건 있습니다.");
});

test("출퇴근 기록 확인 · 기록 보기 — 출·퇴근 현황 조회를 점포 · 직원 레코드 · 첫 주 월요일부터 급여 기간 끝까지 · 기간 기록 전체로, 퇴직자도 보이게 재직 상태 전체", () => {
  assert.equal(
    attendanceHref({ storeId: 5, staffMemberId: 30, staffName: "서 지안", periodStartDate: "2026-09-01", periodEndDate: "2026-09-30" }),
    "/attendance-records?storeIds=5&staff=%EC%84%9C+%EC%A7%80%EC%95%88&staffMemberId=30&employment=ALL&fixFrom=2026-08-31&fixTo=2026-09-30&fixAll=1",
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
    [attendance, { payslipReviewReasonId: 0, reviewReason: "DEDUCTION_MISSING", detail: "국민연금, 사업소득세, 기타공제", acknowledgedAt: null }],
  );
});

test("검토 사유 상세 — api 의 「확인 필요로 표시된 …(예시)」 문장을 「… 등의 사유로 확인이 필요한 …」으로 다듬는다(2026-11-19 사용자 지정)", () => {
  assert.equal(
    reviewDetailText("확인 필요로 표시된 출퇴근 기록이 1건 있습니다(근무지 반경 밖 퇴근, 위치 조작 감지 등)."),
    "근무지 반경 밖 퇴근, 위치 조작 감지 등의 사유로 확인이 필요한 출퇴근 기록이 1건 있습니다.",
  );
  assert.equal(
    reviewDetailText("이번 급여 기간과 첫 주에 포함된 지난달 날짜(9월 29일)에 확인 필요로 표시된 출퇴근 기록이 2건 있습니다."),
    "이번 급여 기간과 첫 주에 포함된 지난달 날짜(9월 29일)에 확인이 필요한 출퇴근 기록이 2건 있습니다.",
  );
  assert.equal(reviewDetailText("출퇴근 기록 2일 누락."), "출퇴근 기록 2일 누락.");
});


test("sortDeductions — 국민연금 · 건강보험 · 장기요양보험 · 고용보험 · 소득세 · 지방소득세, 모르는 코드는 뒤에", () => {
  const codes = ["EMPLOYMENT_INSURANCE", "UNKNOWN_A", "LOCAL_INCOME_TAX", "LONG_TERM_CARE_INSURANCE", "INCOME_TAX", "HEALTH_INSURANCE", "NATIONAL_PENSION", "UNKNOWN_B"];
  assert.deepEqual(
    sortDeductions(codes.map((itemCode) => ({ itemCode }))).map((i) => i.itemCode),
    ["NATIONAL_PENSION", "HEALTH_INSURANCE", "LONG_TERM_CARE_INSURANCE", "EMPLOYMENT_INSURANCE", "INCOME_TAX", "LOCAL_INCOME_TAX", "UNKNOWN_A", "UNKNOWN_B"],
  );
});
