// node --test src/lib/payslips.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { PAYSLIP_STATUSES, isItemShown, monthLabel, parseAmount, payslipListApiSearch, payslipTotals, previousMonth, shiftMonth, type PayslipListQuery } from "./payslips.ts";

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
  const basic = (itemCode: string) => ({ itemCategory: "BASIC" as const, itemCode });
  const withholding = { itemCategory: "WITHHOLDING" as const, itemCode: "BUSINESS_INCOME_TAX" };
  assert.equal(isItemShown(basic("INCOME_TAX"), true), false);
  assert.equal(isItemShown(basic("LOCAL_INCOME_TAX"), true), false);
  assert.equal(isItemShown(basic("NATIONAL_PENSION"), true), true);
  assert.equal(isItemShown(withholding, true), true);
  assert.equal(isItemShown(basic("INCOME_TAX"), false), true);
  assert.equal(isItemShown(withholding, false), false);
});

test("합계 — 지급은 비과세 포함, 공제는 보이는 줄만, 비어 있는 공제가 있으면 표시한다", () => {
  const items = [
    { payslipItemId: 1, itemCategory: "EARNING" as const, itemCode: "BASE_PAY" },
    { payslipItemId: 2, itemCategory: "EARNING" as const, itemCode: "MEAL_ALLOWANCE" },
    { payslipItemId: 3, itemCategory: "BASIC" as const, itemCode: "NATIONAL_PENSION" },
    { payslipItemId: 4, itemCategory: "BASIC" as const, itemCode: "INCOME_TAX" },
    { payslipItemId: 5, itemCategory: "WITHHOLDING" as const, itemCode: "BUSINESS_INCOME_TAX" },
  ];
  const amounts = new Map<number, number | null>([
    [1, 1_000_000],
    [2, 58_000],
    [3, 45_000],
    [4, null],
    [5, 31_740],
  ]);
  // 꺼짐: 소득세가 비어 있다 — 원천징수 줄은 세지 않는다
  assert.deepEqual(payslipTotals(items, amounts, false), { gross: 1_058_000, deduction: 45_000, net: 1_013_000, blankDeductions: 1 });
  // 켬: 소득세 줄이 빠져 비어 있는 공제가 없다
  assert.deepEqual(payslipTotals(items, amounts, true), { gross: 1_058_000, deduction: 76_740, net: 981_260, blankDeductions: 0 });
  // 0 은 넣은 값이다(공제 미입력과 다르다)
  assert.equal(payslipTotals(items, new Map([...amounts, [4, 0]]), false).blankDeductions, 0);
});

const base: PayslipListQuery = { month: "2026-09", store: "", storeIds: [], staffName: "", statuses: [...PAYSLIP_STATUSES], page: 1, pageSize: 20 };

test("api 쿼리 — 달 · 쪽 · 건수는 늘 싣고, 상태는 모두 골랐으면 뺀다", () => {
  assert.equal(payslipListApiSearch(base), "month=2026-09&page=1&pageSize=20");
  assert.equal(
    payslipListApiSearch({ ...base, statuses: ["CONFIRMED", "REVIEWING"], page: 2, pageSize: 50 }),
    "month=2026-09&status=REVIEWING%2CCONFIRMED&page=2&pageSize=50",
  );
});

test("api 쿼리 — 상태를 하나도 고르지 않았으면 status 를 뺀다(빈 값은 api 가 400)", () => {
  assert.equal(payslipListApiSearch({ ...base, statuses: [] }), "month=2026-09&page=1&pageSize=20");
});

test("api 쿼리 — 점포명이 있으면 맞는 점포 id 를, 직원명은 그대로 싣는다", () => {
  assert.equal(
    payslipListApiSearch({ ...base, store: "서초", storeIds: [5, 7], staffName: "서지안" }),
    "month=2026-09&storeIds=5%2C7&staffName=%EC%84%9C%EC%A7%80%EC%95%88&page=1&pageSize=20",
  );
  // 점포명이 없으면 점포 id 는 싣지 않는다(관리 범위 전체)
  assert.equal(payslipListApiSearch({ ...base, storeIds: [5] }), "month=2026-09&page=1&pageSize=20");
});

test("api 쿼리 — 맞는 점포가 없거나 아직 찾지 않았거나 너무 많으면 부르지 않는다(null → 0건)", () => {
  assert.equal(payslipListApiSearch({ ...base, store: "없는점", storeIds: [] }), null);
  assert.equal(payslipListApiSearch({ ...base, store: "서초", storeIds: null }), null);
  assert.equal(payslipListApiSearch({ ...base, store: "점", storeIds: Array.from({ length: 501 }, (_, i) => i + 1) }), null);
});
