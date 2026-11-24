// node --test src/lib/payslips.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { PAYSLIP_STATUSES, isItemShown, monthLabel, parseAmount, payslipListApiSearch, payslipTotals, previousMonth, shiftMonth, withholdingNeedsCheck, type PayslipListQuery } from "./payslips.ts";

/** 4대보험 가입 여부(WHALEERP-756) — 예전 시험은 둘 다 가입(4대보험 줄이 모두 보이던 때)으로 본다 */
const BOTH = { isHealthPensionInsured: true, isEmploymentInjuryInsured: true };
const NONE = { isHealthPensionInsured: false, isEmploymentInjuryInsured: false };
/** 저장된 금액이 없는 줄(미입력) — 숨는지는 저장된 값으로 본다 */
const BLANK = { isEntered: false, adjustedAmount: null, calculatedAmount: null };

test("지난달 · 달 이동은 해를 넘긴다", () => {
  assert.equal(previousMonth("2026-10-19"), "2026-09");
  assert.equal(previousMonth("2026-01-05"), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-03", -14), "2025-01");
});

test("달 글자", () => {
  assert.equal(monthLabel("2026-08"), "2026년 8월");
});

test("금액 입력 — 쉼표는 지우고, 빈 칸은 넣지 않음(null), 숫자 아닌 것은 NaN", () => {
  assert.equal(parseAmount("2,840,000"), 2_840_000);
  assert.equal(parseAmount("0"), 0);
  assert.equal(parseAmount(" "), null);
  assert.ok(Number.isNaN(parseAmount("12a")));
  assert.ok(Number.isNaN(parseAmount("-100")));
});

test("3.3% 를 켜면 소득세 · 지방소득세가 빠지고 원천징수 둘이 선다", () => {
  const basic = (itemCode: string) => ({ itemCategory: "BASIC" as const, itemCode, ...BLANK });
  const withholding = { itemCategory: "WITHHOLDING" as const, itemCode: "BUSINESS_INCOME_TAX", ...BLANK };
  assert.equal(isItemShown(basic("INCOME_TAX"), true, BOTH), false);
  assert.equal(isItemShown(basic("LOCAL_INCOME_TAX"), true, BOTH), false);
  assert.equal(isItemShown(basic("NATIONAL_PENSION"), true, BOTH), true);
  assert.equal(isItemShown(withholding, true, BOTH), true);
  assert.equal(isItemShown(basic("INCOME_TAX"), false, BOTH), true);
  assert.equal(isItemShown(withholding, false, BOTH), false);
});

test("합계 — 지급은 비과세 포함, 공제는 보이는 줄만, 비어 있는 공제가 있으면 표시한다", () => {
  const items = [
    { payslipItemId: 1, itemCategory: "EARNING" as const, itemCode: "BASE_PAY", ...BLANK },
    { payslipItemId: 2, itemCategory: "EARNING" as const, itemCode: "MEAL_ALLOWANCE", ...BLANK },
    { payslipItemId: 3, itemCategory: "BASIC" as const, itemCode: "NATIONAL_PENSION", ...BLANK },
    { payslipItemId: 4, itemCategory: "BASIC" as const, itemCode: "INCOME_TAX", ...BLANK },
    { payslipItemId: 5, itemCategory: "WITHHOLDING" as const, itemCode: "BUSINESS_INCOME_TAX", ...BLANK },
  ];
  const amounts = new Map<number, number | null>([
    [1, 1_000_000],
    [2, 58_000],
    [3, 45_000],
    [4, null],
    [5, 31_740],
  ]);
  // 꺼짐: 소득세가 비어 있다 — 원천징수 줄은 세지 않는다
  assert.deepEqual(payslipTotals(items, amounts, false, BOTH), { gross: 1_058_000, deduction: 45_000, net: 1_013_000, blankDeductions: 1 });
  // 켬: 소득세 줄이 빠져 비어 있는 공제가 없다
  assert.deepEqual(payslipTotals(items, amounts, true, BOTH), { gross: 1_058_000, deduction: 76_740, net: 981_260, blankDeductions: 0 });
  // 0 은 넣은 값이다(공제 미입력과 다르다)
  assert.equal(payslipTotals(items, new Map([...amounts, [4, 0]]), false, BOTH).blankDeductions, 0);
});

test("4대보험 줄은 근로계약의 가입 체크대로 — 미가입 · 건강보험 · 국민연금만 · 고용보험 · 산재보험만(WHALEERP-756)", () => {
  const codes = ["NATIONAL_PENSION", "HEALTH_INSURANCE", "EMPLOYMENT_INSURANCE", "LONG_TERM_CARE_INSURANCE", "INCOME_TAX", "LOCAL_INCOME_TAX"];
  const shown = (withholding: boolean, health: boolean, employment: boolean) =>
    codes.filter((itemCode) => isItemShown({ itemCategory: "BASIC", itemCode, ...BLANK }, withholding, { isHealthPensionInsured: health, isEmploymentInjuryInsured: employment }));
  assert.deepEqual(shown(false, false, false), ["INCOME_TAX", "LOCAL_INCOME_TAX"]);
  assert.deepEqual(shown(true, false, false), []);
  assert.deepEqual(shown(false, true, false), ["NATIONAL_PENSION", "HEALTH_INSURANCE", "LONG_TERM_CARE_INSURANCE", "INCOME_TAX", "LOCAL_INCOME_TAX"]);
  assert.deepEqual(shown(false, false, true), ["EMPLOYMENT_INSURANCE", "INCOME_TAX", "LOCAL_INCOME_TAX"]);
  // 3.3% 를 켜도 가입한 보험 줄은 그대로
  assert.deepEqual(shown(true, true, true), ["NATIONAL_PENSION", "HEALTH_INSURANCE", "EMPLOYMENT_INSURANCE", "LONG_TERM_CARE_INSURANCE"]);
  // 지급 · 추가 공제는 가입과 관계없다
  assert.equal(isItemShown({ itemCategory: "ADDITIONAL", itemCode: "ETC", ...BLANK }, false, NONE), true);
  assert.equal(isItemShown({ itemCategory: "EARNING", itemCode: "BASE_PAY", ...BLANK }, false, NONE), true);
});

test("미가입 4대보험 줄은 저장된 금액이 0 이 아니면 보이고 합계에 든다 — 0 · 미입력이면 숨는다(2026-11-24 사용자 결정)", () => {
  const pension = (over: object) => ({ itemCategory: "BASIC" as const, itemCode: "NATIONAL_PENSION", ...BLANK, isEntered: true, ...over });
  assert.equal(isItemShown(pension({ adjustedAmount: 45_000 }), false, NONE), true);
  assert.equal(isItemShown(pension({ calculatedAmount: 45_000 }), false, NONE), true);
  assert.equal(isItemShown(pension({ adjustedAmount: 0 }), false, NONE), false);
  assert.equal(isItemShown(pension({ isEntered: false }), false, NONE), false);
  // 입력 중 값(amounts)이 아니라 저장된 값으로 숨는지 본다 — 칸을 0 으로 지워도 저장 전에는 줄이 그대로이고 합계는 입력 값을 센다
  const items = [
    { payslipItemId: 1, itemCategory: "EARNING" as const, itemCode: "BASE_PAY", ...BLANK },
    { payslipItemId: 2, ...pension({ adjustedAmount: 45_000 }) },
  ];
  assert.deepEqual(payslipTotals(items, new Map([[1, 1_000_000], [2, 45_000]]), false, NONE), { gross: 1_000_000, deduction: 45_000, net: 955_000, blankDeductions: 0 });
  assert.deepEqual(payslipTotals(items, new Map([[1, 1_000_000], [2, 0]]), false, NONE), { gross: 1_000_000, deduction: 0, net: 1_000_000, blankDeductions: 0 });
  // 저장된 값이 미입력인 미가입 줄은 비어 있어도 확정을 막지 않는다
  assert.equal(payslipTotals([{ payslipItemId: 2, ...pension({ isEntered: false }) }], new Map([[2, null]]), false, NONE).blankDeductions, 0);
});

test("합계 — 가입하지 않은 4대보험 줄은 저장 값이 비었으면 숨어 빈 칸으로도, 입력 중 값으로도 세지 않는다(WHALEERP-756)", () => {
  const items = [
    { payslipItemId: 1, itemCategory: "EARNING" as const, itemCode: "BASE_PAY", ...BLANK },
    { payslipItemId: 2, itemCategory: "BASIC" as const, itemCode: "NATIONAL_PENSION", ...BLANK },
    { payslipItemId: 3, itemCategory: "BASIC" as const, itemCode: "EMPLOYMENT_INSURANCE", ...BLANK },
    { payslipItemId: 4, itemCategory: "BASIC" as const, itemCode: "INCOME_TAX", ...BLANK },
  ];
  const amounts = new Map<number, number | null>([
    [1, 1_000_000],
    [2, 45_000],
    [3, null],
    [4, 10_000],
  ]);
  assert.deepEqual(payslipTotals(items, amounts, false, NONE), { gross: 1_000_000, deduction: 10_000, net: 990_000, blankDeductions: 0 });
  assert.deepEqual(payslipTotals(items, amounts, false, { isHealthPensionInsured: true, isEmploymentInjuryInsured: false }), {
    gross: 1_000_000,
    deduction: 55_000,
    net: 945_000,
    blankDeductions: 0,
  });
  assert.equal(payslipTotals(items, amounts, false, { isHealthPensionInsured: false, isEmploymentInjuryInsured: true }).blankDeductions, 1);
});

test("3.3% 를 켜고 4대보험에 가입한 직원이면 안내한다 — 끄거나 미가입이면 안내하지 않는다(WHALEERP-756)", () => {
  assert.equal(withholdingNeedsCheck(true, BOTH), true);
  assert.equal(withholdingNeedsCheck(true, { isHealthPensionInsured: true, isEmploymentInjuryInsured: false }), true);
  assert.equal(withholdingNeedsCheck(true, { isHealthPensionInsured: false, isEmploymentInjuryInsured: true }), true);
  assert.equal(withholdingNeedsCheck(true, NONE), false);
  assert.equal(withholdingNeedsCheck(false, BOTH), false);
});

const base: PayslipListQuery = {
  reviewPending: false,
  month: "2026-09",
  storeIds: [],
  storesCleared: false,
  scope: null,
  staffName: "",
  statuses: [...PAYSLIP_STATUSES],
  page: 1,
  pageSize: 20,
};

test("api 쿼리 — 달 · 쪽 · 건수는 늘 싣고, 상태는 모두 골랐으면 뺀다", () => {
  assert.equal(payslipListApiSearch(base), "month=2026-09&page=1&pageSize=20");
  assert.equal(
    payslipListApiSearch({ ...base, statuses: ["CONFIRMED", "REVIEWING"], page: 2, pageSize: 50 }),
    "month=2026-09&status=REVIEWING%2CCONFIRMED&page=2&pageSize=50",
  );
});

test("api 쿼리 — 검토 대기만이면 reviewPending=true, 아니면 싣지 않는다", () => {
  assert.equal(payslipListApiSearch({ ...base, reviewPending: true }), "month=2026-09&reviewPending=true&page=1&pageSize=20");
});

test("api 쿼리 — 상태를 하나도 고르지 않았으면 status 를 뺀다(빈 값은 api 가 400)", () => {
  assert.equal(payslipListApiSearch({ ...base, statuses: [] }), "month=2026-09&page=1&pageSize=20");
});

test("api 쿼리 — 고른 점포는 storeIds, 직원명은 그대로 싣는다", () => {
  assert.equal(
    payslipListApiSearch({ ...base, storeIds: [5, 7], staffName: "서지안" }),
    "month=2026-09&storeIds=5%2C7&staffName=%EC%84%9C%EC%A7%80%EC%95%88&page=1&pageSize=20",
  );
});

test("api 쿼리 — 상단 범위: 점포 하나는 storeIds, 직영 · 가맹은 storeTypes, 전체 · 비운 전체는 조건 없음", () => {
  assert.equal(payslipListApiSearch({ ...base, scope: { type: "STORE", storeId: 9 } }), "month=2026-09&storeIds=9&page=1&pageSize=20");
  assert.equal(payslipListApiSearch({ ...base, scope: { type: "FRANCHISE" } }), "month=2026-09&storeTypes=FRANCHISE&page=1&pageSize=20");
  assert.equal(payslipListApiSearch({ ...base, scope: { type: "ALL" } }), "month=2026-09&page=1&pageSize=20");
  assert.equal(payslipListApiSearch({ ...base, storesCleared: true, scope: { type: "DIRECT" } }), "month=2026-09&page=1&pageSize=20");
});
