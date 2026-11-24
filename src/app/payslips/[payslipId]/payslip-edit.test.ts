// node --test "src/app/payslips/[payslipId]/payslip-edit.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAmount, type PayslipItem, type PayslipPrevious } from "../../../lib/payslips.ts";
import {
  addAdditionalLine,
  applyPrevious,
  blockedRecheck,
  confirmBlockedUntil,
  msUntilNextKstDay,
  nextRecheckMs,
  RECHECK_FIRST_MS,
  RECHECK_MAX_MS,
  removeLine,
  saveItems,
  editSnapshot,
  HOURS_INPUT,
  notHalfHours,
  HOURS_MAX_MINUTES,
  hoursTextOf,
  loadedHoursAmount,
  overHours,
  parseHours,
} from "./payslip-edit.ts";

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
  workMinutes: null,
  calculationText: null,
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

test("야간 · 휴일근무수당은 근무시간 칸을 분으로 싣는다 — 0.5시간 단위, 빈 칸은 null(WHALEERP-755)", () => {
  const night = item({ payslipItemId: 104, payslipItemMasterId: 4, itemCode: "NIGHT_WORK_PAY", itemName: "야간수당" });
  const holiday = item({ payslipItemId: 105, payslipItemMasterId: 5, itemCode: "HOLIDAY_WORK_PAY", itemName: "휴일근무수당" });
  const texts = new Map([
    [104, "30,000"],
    [105, ""],
  ]);
  assert.deepEqual(saveItems([night, holiday, lines[1]], texts, new Map([[104, "2.5"]])), {
    items: [
      { payslipItemMasterId: 4, amount: 30_000, workMinutes: 150 },
      { payslipItemMasterId: 5, amount: null, workMinutes: null },
      { payslipItemMasterId: 8, amount: null },
    ],
    invalid: [],
  });
  // 끝이 점인 「2.」은 치다 만 값 — 2시간으로 받지 않고 잘못된 입력(PR #336 재검사)
  assert.deepEqual(saveItems([night], texts, new Map([[104, "2."]])).invalid, ["야간수당 시간"]);
  assert.ok(Number.isNaN(parseHours("2.")));
  assert.equal(parseHours(".5"), 30);
  assert.equal(parseHours("2.5"), 150);
  // 「2.3」은 분으로 받고(138분) 0.5시간 단위 검사가 막는다
  assert.equal(parseHours("2.3"), 138);
  assert.deepEqual(saveItems([night], texts, new Map([[104, "2.3"]])).invalid, []);
  assert.deepEqual(notHalfHours([night, holiday], new Map([[104, "2.3"], [105, "2.5"]])), ["야간수당"]);
  assert.deepEqual(notHalfHours([night], new Map([[104, "2."]])), []);
  // 아주 긴 숫자(Infinity)는 잘못된 입력 — 스냅샷이 빈 칸과 같아지지 않게
  const huge = "9".repeat(400);
  assert.ok(Number.isNaN(parseHours(huge)));
  assert.ok(Number.isNaN(parseAmount(huge)));
  assert.equal(parseAmount("9".repeat(20)), 1e20);
  assert.notEqual(editSnapshot([night], texts, new Map([[104, huge]]), true, false), editSnapshot([night], texts, new Map([[104, ""]]), true, false));
  assert.notEqual(editSnapshot([night], new Map([[104, huge]]), new Map(), true, false), editSnapshot([night], new Map([[104, ""]]), new Map(), true, false));
  assert.ok(Number.isNaN(parseHours(".")));
  assert.equal(parseHours(" "), null);
  assert.ok(Number.isNaN(parseHours("-1")));
  assert.equal(hoursTextOf(90), "1.5");
  assert.equal(hoursTextOf(null), "");
  // 칸은 숫자와 .0 · .5 만 받는다
  // 치는 중에는 소수 자리를 묻지 않는다 — 「2.3」의 「3」을 거부하면 「2.」가 남았다
  assert.ok(HOURS_INPUT.test("12.5") && HOURS_INPUT.test("3.") && HOURS_INPUT.test("") && HOURS_INPUT.test("2.3") && HOURS_INPUT.test(".5"));
  assert.ok(!HOURS_INPUT.test("1.2.3") && !HOURS_INPUT.test("-1") && !HOURS_INPUT.test("a"));
  // 744시간(api 와 같은 한 달 상한)까지 — 넘으면 화면이 이름을 모아 막는다
  assert.deepEqual(overHours([night, holiday, lines[1]], new Map([[104, "744"], [105, "744.5"]])), ["휴일근무수당"]);
  assert.equal(HOURS_MAX_MINUTES, 44_640);
});

test("바뀜 스냅샷 — 잘못 친 근무시간 · 금액은 빈 칸과 다르게 남아 저장 전 검사를 탄다(PR #336 리뷰)", () => {
  const night = item({ payslipItemId: 104, payslipItemMasterId: 4, itemCode: "NIGHT_WORK_PAY", itemName: "야간수당" });
  const texts = new Map([[104, "30,000"]]);
  const saved = editSnapshot([night], texts, new Map([[104, ""]]), true, false);
  assert.notEqual(editSnapshot([night], texts, new Map([[104, "."]]), true, false), saved);
  assert.notEqual(editSnapshot([night], new Map([[104, "1,2a"]]), new Map([[104, ""]]), true, false), editSnapshot([night], new Map([[104, ""]]), new Map([[104, ""]]), true, false));
  // 같은 값이면 같다 — 스위치는 따로 본다
  assert.equal(editSnapshot([night], texts, new Map([[104, ""]]), true, false), saved);
  assert.notEqual(editSnapshot([night], texts, new Map([[104, ""]]), false, false), saved);
});

test("지난 명세서에서 야간 · 휴일근무수당 금액을 채웠을 때만 시간을 넣으라고 알린다(WHALEERP-755)", () => {
  const previous = (amount: number): PayslipPrevious => ({
    payslipId: 39,
    periodStartDate: "2026-09-01",
    periodEndDate: "2026-09-30",
    items: [
      { payslipItemMasterId: 8, itemCode: "BONUS", itemName: "상여", itemCategory: "EARNING", amount: 100_000 },
      { payslipItemMasterId: 4, itemCode: "NIGHT_WORK_PAY", itemName: "야간수당", itemCategory: "EARNING", amount },
    ],
  });
  assert.equal(loadedHoursAmount(previous(30_000)), true);
  assert.equal(loadedHoursAmount(previous(0)), false);
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

test("확정할 수 있는 첫날 전이면 그날을, 그날부터는 null — 확정할 수 없는 상태(null)도 null(WHALEERP-690)", () => {
  assert.equal(confirmBlockedUntil("2026-12-01", "2026-11-30"), "2026-12-01");
  assert.equal(confirmBlockedUntil("2026-12-01", "2026-12-01"), null);
  assert.equal(confirmBlockedUntil("2026-12-01", "2026-12-02"), null);
  assert.equal(confirmBlockedUntil(null, "2026-11-30"), null);
});

test("다음 한국 자정까지 남은 시간 — UTC 15시가 한국 자정이고, 자정 바로 그때는 0 이 아니라 하루(연달아 새로 받지 않게)", () => {
  assert.equal(msUntilNextKstDay(new Date("2026-11-30T14:59:00.000Z")), 60_000);
  assert.equal(msUntilNextKstDay(new Date("2026-11-30T15:00:00.000Z")), 24 * 60 * 60 * 1000);
  assert.equal(msUntilNextKstDay(new Date("2026-11-30T15:00:00.001Z")), 24 * 60 * 60 * 1000 - 1);
  assert.equal(msUntilNextKstDay(new Date("2026-11-30T03:00:00.000Z")), 12 * 60 * 60 * 1000);
});

test("막힌 [확정] 다시 보기 — 확정 가능일 전에는 받지 않고 다음 한국 자정에, 그날이 되면 받고 재시도 간격 뒤에", () => {
  // 2026-11-29 12:00 KST — 확정 가능일 12-01 전이라 받지 않고 다음 한국 자정(11-30 00:00, 12시간 뒤 +1초)에 다시 본다
  assert.deepEqual(blockedRecheck("2026-12-01", new Date("2026-11-29T03:00:00.000Z"), RECHECK_FIRST_MS), {
    refresh: false,
    delayMs: 12 * 60 * 60 * 1000 + 1000,
  });
  // 2026-11-30 23:59:59.999 KST — 아직 전날이라 받지 않는다(경계 바로 앞)
  assert.equal(blockedRecheck("2026-12-01", new Date("2026-11-30T14:59:59.999Z"), RECHECK_FIRST_MS).refresh, false);
  // 2026-12-01 00:00 KST — 그날이 되었으니 받는다
  assert.deepEqual(blockedRecheck("2026-12-01", new Date("2026-11-30T15:00:00.000Z"), RECHECK_FIRST_MS), {
    refresh: true,
    delayMs: RECHECK_FIRST_MS,
  });
  // 확정 가능일을 지난 날도 받는다(브라우저 시계가 빠른 경우)
  assert.equal(blockedRecheck("2026-12-01", new Date("2026-12-03T03:00:00.000Z"), RECHECK_FIRST_MS).refresh, true);
});

test("재시도 간격은 두 배씩 늘고 30분에서 멈춘다", () => {
  assert.equal(nextRecheckMs(RECHECK_FIRST_MS), 2 * 60_000);
  assert.equal(nextRecheckMs(16 * 60_000), RECHECK_MAX_MS);
  assert.equal(nextRecheckMs(RECHECK_MAX_MS), RECHECK_MAX_MS);
});
