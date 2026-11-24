// node --test src/app/payslips/payslip-row.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { PayslipReviewReason } from "../../lib/payslips.ts";
import { attendanceCell, attendanceHref, deductionAnchor, detailReviewReasons, earningFormula, earningHelp, periodText, retirementCell, reviewBand, reviewDetailText, sentDateText, sortDeductions } from "./payslip-row.ts";

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

const item = { itemCode: "OVERTIME_PAY", isTaxFree: false, calculatedAmount: 96_000, adjustedAmount: null, calculationText: null, workMinutes: null };

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

test("지급 도움말 — api 의 한 줄 계산식이 있으면 「계산값」 자리에 그 식, 고쳤으면 고친 내용을 뒤에(WHALEERP-755)", () => {
  const formula = { ...item, calculatedAmount: 123_840, calculationText: "8.0시간 × 10,320원 × 1.5배" };
  assert.equal(earningHelp(formula, true), "8.0시간 × 10,320원 × 1.5배");
  // 가산을 끄면 api 가 「× 1배」 식을 준다 — 머리말 없이 직원 앱 · PDF 와 같은 글자
  assert.equal(earningHelp({ ...formula, calculationText: "8.0시간 × 10,320원 × 1배" }, false), "8.0시간 × 10,320원 × 1배");
  assert.equal(
    earningHelp({ ...formula, adjustedAmount: 130_000, calculationText: "8.0시간 · 직접 입력" }, true),
    "8.0시간 · 직접 입력 · 계산값 123,840 을 130,000 으로 고침",
  );
  // 야간 · 휴일근무수당은 넣은 시간
  assert.equal(earningHelp({ ...item, itemCode: "NIGHT_WORK_PAY", calculatedAmount: null, calculationText: "2.0시간" }, true), "2.0시간");
  // 가산을 꺼도 넣은 시간은 앞에 — 세 곳 글자가 같게
  assert.equal(
    earningHelp({ ...item, itemCode: "HOLIDAY_WORK_PAY", calculatedAmount: null, calculationText: "2.0시간" }, false),
    "2.0시간 · 가산 대상 아님 · 넣어도 가산하지 않는다.",
  );
  // 가산 스위치를 바꾸고 아직 저장하지 않았으면 연장수당의 저장된 식은 맞지 않아 지금 스위치의 글자로(PR #336 리뷰)
  assert.equal(earningHelp(formula, false, true), "가산수당 미적용 · 1배로 계산 · 계산값");
  assert.equal(earningHelp({ ...formula, calculationText: "8.0시간 × 10,320원 × 1배" }, true, false), "계산값");
  assert.equal(earningHelp(formula, true, true), "8.0시간 × 10,320원 × 1.5배");
  // 야간 · 휴일근무수당은 지금 스위치로 가산 대상 아님을 알리고, 넣은 시간은 그대로
  assert.equal(
    earningHelp({ ...item, itemCode: "NIGHT_WORK_PAY", calculatedAmount: null, calculationText: "2.0시간" }, false, true),
    "2.0시간 · 가산 대상 아님 · 넣어도 가산하지 않는다.",
  );
  // 근무시간 칸을 바꿨으면 저장된 「2.0시간」 대신 지금 입력 — 맞으면 그 시간, 비었거나 잘못되면 식 없음(PR #336 재검사)
  const night = { ...item, itemCode: "NIGHT_WORK_PAY", calculatedAmount: null, adjustedAmount: 30_000, calculationText: "2.0시간", workMinutes: 120 };
  assert.equal(earningHelp(night, true, true, 120), "2.0시간");
  assert.equal(earningHelp(night, true, true, 210), "3.5시간");
  assert.equal(earningHelp(night, true, true, null), "직접 입력");
  assert.equal(earningHelp(night, true, true, Number.NaN), "직접 입력");
  assert.equal(earningHelp(night, false, false, 210), "3.5시간 · 가산 대상 아님 · 넣어도 가산하지 않는다.");
  assert.equal(earningFormula(night, true, true, 210), "3.5시간");
  assert.equal(earningFormula(night, true, true, null), null);
  // 응답에 칸이 없는 옛 api — 식 없음으로, 도움말은 전처럼
  const old = { ...item, calculationText: undefined, workMinutes: undefined } as unknown as typeof item;
  assert.equal(earningFormula(old, true, true), null);
  assert.equal(earningHelp(old, true, true), "계산값");
  // 식이 없으면(2026-11-24 전 명세서) 지금처럼
  assert.equal(earningHelp({ ...formula, calculationText: null }, true), "계산값");
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
  // 확정 가능일 전이면 [확정]하라고 하지 않고 그날을 알린다
  assert.equal(reviewBand([reason("MISSING_ATTENDANCE", "출퇴근 기록 없음")], "2026-12-01")?.desc, "오른쪽 검토 사유를 확인해 주세요. 2026-12-01부터 확정할 수 있습니다.");
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
    workMinutes: null,
    calculationText: null,
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
    isHealthPensionInsured: true,
    isEmploymentInjuryInsured: true,
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
  // 4대보험에 가입하지 않았으면 그 줄은 비어 있어도 공제 미입력이 아니다(WHALEERP-756)
  const insuranceLines = [
    line("BASIC", "NATIONAL_PENSION", "국민연금", false),
    line("BASIC", "HEALTH_INSURANCE", "건강보험", false),
    line("BASIC", "LONG_TERM_CARE_INSURANCE", "장기요양보험", false),
    line("BASIC", "EMPLOYMENT_INSURANCE", "고용보험", false),
    line("BASIC", "INCOME_TAX", "소득세", true),
  ];
  const insured = (isHealthPensionInsured: boolean, isEmploymentInjuryInsured: boolean) =>
    detailReviewReasons({ ...base, isHealthPensionInsured, isEmploymentInjuryInsured, items: insuranceLines });
  assert.deepEqual(insured(false, false), [attendance]);
  assert.equal(insured(true, false).at(-1)?.detail, "국민연금, 건강보험, 장기요양보험");
  assert.equal(insured(false, true).at(-1)?.detail, "고용보험");
});

test("검토 사유 상세 — 「확인 필요 기록 포함」 문장은 api 가 준 그대로 보인다(WHALEERP-757)", () => {
  const basic = "근무지 반경 밖 퇴근, 위치 조작 감지 등의 사유로 확인이 필요한 출퇴근 기록이 1건 있습니다.";
  assert.equal(reviewDetailText(basic), basic);
  const lead = "이번 급여 기간과 첫 주에 포함된 지난달 날짜(9월 28일~9월 30일)에 확인이 필요한 출퇴근 기록이 2건 있습니다.";
  assert.equal(reviewDetailText(lead), lead);
  assert.equal(reviewDetailText("출퇴근 기록 2일 누락."), "출퇴근 기록 2일 누락.");
});


test("sortDeductions — 국민연금 · 건강보험 · 장기요양보험 · 고용보험 · 소득세 · 지방소득세, 모르는 코드는 뒤에", () => {
  const codes = ["EMPLOYMENT_INSURANCE", "UNKNOWN_A", "LOCAL_INCOME_TAX", "LONG_TERM_CARE_INSURANCE", "INCOME_TAX", "HEALTH_INSURANCE", "NATIONAL_PENSION", "UNKNOWN_B"];
  assert.deepEqual(
    sortDeductions(codes.map((itemCode) => ({ itemCode }))).map((i) => i.itemCode),
    ["NATIONAL_PENSION", "HEALTH_INSURANCE", "LONG_TERM_CARE_INSURANCE", "EMPLOYMENT_INSURANCE", "INCOME_TAX", "LOCAL_INCOME_TAX", "UNKNOWN_A", "UNKNOWN_B"],
  );
});

const BOTH = { isHealthPensionInsured: true, isEmploymentInjuryInsured: true };

test("deductionAnchor — 추가 공제만 비었으면 추가 공제 상자, 기본 공제가 비었으면 기본 공제 상자", () => {
  const line = (itemCategory: "EARNING" | "BASIC" | "ADDITIONAL" | "WITHHOLDING", itemCode: string, isEntered: boolean) => ({ itemCategory, itemCode, isEntered }) as never;
  assert.equal(deductionAnchor({ isWithholdingApplied: false, ...BOTH, items: [line("BASIC", "NATIONAL_PENSION", true), line("ADDITIONAL", "ETC", false)] }), "#deduction-additional");
  assert.equal(deductionAnchor({ isWithholdingApplied: false, ...BOTH, items: [line("BASIC", "NATIONAL_PENSION", false), line("ADDITIONAL", "ETC", false)] }), "#deduction-basic");
  // 3.3% 를 켜면 숨는 소득세가 비어도 세지 않는다
  assert.equal(deductionAnchor({ isWithholdingApplied: true, ...BOTH, items: [line("BASIC", "INCOME_TAX", false), line("ADDITIONAL", "ETC", false)] }), "#deduction-additional");
  // 가입하지 않은 4대보험 줄도 세지 않는다(WHALEERP-756)
  assert.equal(
    deductionAnchor({ isWithholdingApplied: false, isHealthPensionInsured: false, isEmploymentInjuryInsured: false, items: [line("BASIC", "NATIONAL_PENSION", false), line("ADDITIONAL", "ETC", false)] }),
    "#deduction-additional",
  );
});

test("검토 사유 상세 — 날짜 목록은 「있습니다.」 아래 유형마다 한 줄, 이어지는 문장은 줄바꿈", () => {
  assert.equal(
    reviewDetailText("출퇴근 기록이 등록되지 않은 날이 3일 있습니다(11월 7일 출근·퇴근 미등록, 11월 5일 퇴근 미등록, 11월 3일 출근·퇴근 미등록).", "2026-11-01"),
    "출퇴근 기록이 등록되지 않은 날이 3일 있습니다.\n· 출근 · 퇴근 기록 없음: 11월 3일(화), 11월 7일(토)\n· 퇴근 기록 없음: 11월 5일(목)",
  );
  // 1월 명세서의 첫 주에 걸친 12월은 앞 해, 「외 N일」은 마지막 줄
  assert.equal(
    reviewDetailText("출퇴근 기록이 등록되지 않은 날이 3일 있습니다(1월 2일 퇴근 미등록, 12월 31일 출근·퇴근 미등록 외 1일).", "2027-01-01"),
    "출퇴근 기록이 등록되지 않은 날이 3일 있습니다.\n· 출근 · 퇴근 기록 없음: 12월 31일(목)\n· 퇴근 기록 없음: 1월 2일(토)\n· 외 1일",
  );
  // 12월 명세서의 출퇴근 기간이 다음 해 1월로 넘어가면 1월은 다음 해(리뷰 지적)
  assert.equal(
    reviewDetailText("출퇴근 기록이 등록되지 않은 날이 2일 있습니다(1월 2일 퇴근 미등록, 12월 30일 퇴근 미등록).", "2026-12-01"),
    "출퇴근 기록이 등록되지 않은 날이 2일 있습니다.\n· 퇴근 기록 없음: 12월 30일(수), 1월 2일(토)",
  );
  // 계약 만료 후 기록 — 유형 없이 날짜만 한 줄
  assert.equal(
    reviewDetailText("근로계약 종료일(2026년 11월 20일) 이후의 출퇴근 기록이 2일 있습니다(11월 22일, 11월 21일).", "2026-11-01"),
    "근로계약 종료일(2026년 11월 20일) 이후의 출퇴근 기록이 2일 있습니다.\n· 11월 21일(토), 11월 22일(일)",
  );
  // 날짜로 못 읽으면 괄호째 다음 줄
  assert.equal(reviewDetailText("무언가가 있습니다(알 수 없음)."), "무언가가 있습니다.\n(알 수 없음)");
  assert.equal(reviewDetailText("이번 급여 기간에 등록된 출퇴근 기록이 없습니다."), "이번 급여 기간에 등록된 출퇴근 기록이 없습니다.");
  assert.equal(
    reviewDetailText("급여 기간 중 정직원 계약과 파트타이머 계약이 함께 있어 기본급 · 주휴수당 · 연장수당은 자동 계산되지 않았습니다. 금액을 직접 입력해 주세요."),
    "급여 기간 중 정직원 계약과 파트타이머 계약이 함께 있어 기본급 · 주휴수당 · 연장수당은 자동 계산되지 않았습니다.\n금액을 직접 입력해 주세요.",
  );
});

test("퇴직 꼬리표 — 퇴직일이 오늘(한국) 전이면 회색 「퇴직」, 오늘 · 앞으로면 빨간 「퇴직 예정」, 없으면 null(WHALEERP-764)", () => {
  const today = "2026-11-24";
  assert.equal(retirementCell(null, today), null);
  assert.deepEqual(retirementCell("2026-11-23", today), { text: "퇴직 2026-11-23", style: "muted" });
  // 오늘은 아직 일하는 날이다 — 직원 정보 관리의 퇴직 처리와 같은 판정(isSettledNow)
  assert.deepEqual(retirementCell("2026-11-24", today), { text: "퇴직 예정 2026-11-24", style: "badge-off" });
  assert.deepEqual(retirementCell("2026-12-31", today), { text: "퇴직 예정 2026-12-31", style: "badge-off" });
});

test("퇴직 꼬리표 짧은 표기 — 작성 팝업은 「퇴직 M/D」 · 「예정 M/D」(앞 0 없이), 판정은 같다(WHALEERP-764)", () => {
  const today = "2026-11-24";
  const short = { short: true };
  assert.equal(retirementCell(null, today, short), null);
  assert.deepEqual(retirementCell("2026-11-15", today, short), { text: "퇴직 11/15", style: "muted" });
  assert.deepEqual(retirementCell("2026-11-24", today, short), { text: "예정 11/24", style: "badge-off" });
  assert.deepEqual(retirementCell("2027-01-05", today, short), { text: "예정 1/5", style: "badge-off" });
});
