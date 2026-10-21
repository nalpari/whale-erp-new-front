// node --test "src/app/payslips/[payslipId]/payslip-edit.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import type { PayslipItem, PayslipPrevious } from "../../../lib/payslips.ts";
import { addAdditionalLine, applyPrevious, removeLine, saveItems } from "./payslip-edit.ts";

const item = (over: Partial<PayslipItem>): PayslipItem => ({
  payslipItemId: 1,
  itemCategory: "EARNING",
  payslipItemMasterId: 1,
  itemCode: "BASE_PAY",
  itemName: "기본급",
  isTaxFree: false,
  calculatedAmount: null,
  adjustedAmount: null,
  isEntered: false,
  ...over,
});

const lines = [
  item({ payslipItemId: 101, payslipItemMasterId: 1, calculatedAmount: 1_000_000, isEntered: true }),
  item({ payslipItemId: 108, payslipItemMasterId: 8, itemCode: "BONUS", itemName: "상여" }),
  item({ payslipItemId: 112, payslipItemMasterId: 12, itemCategory: "BASIC", itemCode: "NATIONAL_PENSION", itemName: "국민연금" }),
];

test("임시저장 본문 — 줄마다 급여 항목 id 와 금액(빈 칸은 null, 쉼표 무시), 숫자가 아니면 그 이름을 돌려준다", () => {
  const texts = new Map([
    [101, "1,000,000"],
    [108, ""],
    [112, "0"],
  ]);
  assert.deepEqual(saveItems(lines, texts), {
    items: [
      { payslipItemMasterId: 1, amount: 1_000_000 },
      { payslipItemMasterId: 8, amount: null },
      { payslipItemMasterId: 12, amount: 0 },
    ],
    invalid: [],
  });
  assert.deepEqual(saveItems(lines, new Map([[108, "12a"]])).invalid, ["상여"]);
});

test("추가 공제 붙이기 · 떼기 — 새 줄은 음수 임시 id(급여 항목 id 의 음수), 빈 칸으로 선다", () => {
  const added = addAdditionalLine(lines, { payslipItemMasterId: 18, itemCode: "YEAR_END_SETTLEMENT", name: "연말(중도)정산" });
  assert.equal(added.length, 4);
  assert.deepEqual(added[3], item({
    payslipItemId: -18,
    payslipItemMasterId: 18,
    itemCategory: "ADDITIONAL",
    itemCode: "YEAR_END_SETTLEMENT",
    itemName: "연말(중도)정산",
  }));
  // 이미 붙은 항목은 다시 붙이지 않는다
  assert.equal(addAdditionalLine(added, { payslipItemMasterId: 18, itemCode: "YEAR_END_SETTLEMENT", name: "연말(중도)정산" }).length, 4);
  assert.deepEqual(removeLine(added, -18), added.slice(0, 3));
});

test("지난 명세서 불러오기 — 같은 급여 항목 칸을 채우고, 없는 추가 공제는 붙인다. 시스템 계산 칸은 건드리지 않는다", () => {
  const previous: PayslipPrevious = {
    payslipId: 39,
    periodStartDate: "2026-09-01",
    periodEndDate: "2026-09-30",
    items: [
      { payslipItemMasterId: 8, itemCode: "BONUS", itemName: "상여", itemCategory: "EARNING", amount: 100_000 },
      { payslipItemMasterId: 12, itemCode: "NATIONAL_PENSION", itemName: "국민연금", itemCategory: "BASIC", amount: 0 },
      { payslipItemMasterId: 27, itemCode: "STOCK_OPTION", itemName: "스톡옵션", itemCategory: "ADDITIONAL", amount: 7_000 },
      // 이 명세서에 없는 지급 · 기본 공제 줄(예: 정직원 명세서의 원천징수)은 버린다
      { payslipItemMasterId: 28, itemCode: "BUSINESS_INCOME_TAX", itemName: "사업소득세(3%)", itemCategory: "WITHHOLDING", amount: 3 },
    ],
  };
  const result = applyPrevious(lines, new Map([[101, "1,000,000"]]), previous);
  assert.equal(result.filled, 3);
  assert.deepEqual(result.lines.map((l) => l.payslipItemId), [101, 108, 112, -27]);
  assert.deepEqual([...result.texts], [
    [101, "1,000,000"],
    [108, "100,000"],
    [112, "0"],
    [-27, "7,000"],
  ]);
});
