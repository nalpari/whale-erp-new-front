// node --test "src/app/contracts/[contractId]/detail-format.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { insuranceText, kstDateTime, payDayText, weeklyHoursOf, workDayLines } from "./detail-format.ts";

const label = (d: string) => ({ MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일" })[d] ?? d;
const day = (weekday: "MON" | "TUE" | "WED", s: string, e: string, rest = true) => ({
  weekday,
  startTime: s,
  endTime: e,
  breakStartTime: rest ? "12:00" : null,
  breakEndTime: rest ? "13:00" : null,
});

test("주 소정근로시간은 휴게를 뺀 합이다", () => {
  assert.equal(weeklyHoursOf([day("MON", "09:00", "18:00"), day("TUE", "09:00", "18:00")]), 16);
  assert.equal(weeklyHoursOf([day("MON", "09:00", "13:30", false)]), 4.5);
  assert.equal(weeklyHoursOf([]), 0);
});

test("같은 시각인 요일끼리 한 줄로 묶는다", () => {
  assert.deepEqual(workDayLines([day("MON", "09:00", "18:00"), day("TUE", "09:00", "18:00"), day("WED", "10:00", "14:00", false)], label), [
    "월·화 09:00-18:00 · 휴게 12:00-13:00",
    "수 10:00-14:00",
  ]);
});

test("임금지급일 · 4대보험 표기", () => {
  assert.equal(payDayText("익월", 10), "익월 10일");
  assert.equal(payDayText("당월", 31), "당월 말일");
  assert.equal(payDayText(null, null), "-");
  assert.equal(insuranceText(true, true), "건강보험 · 국민연금, 고용보험 · 산재보험");
  assert.equal(insuranceText(false, false), "가입 안 함");
  assert.equal(insuranceText(null, null), "-");
});

test("이력 시각은 한국 시간", () => {
  assert.equal(kstDateTime("2026-10-12T15:30:00.000Z"), "2026-10-13 00:30");
});
