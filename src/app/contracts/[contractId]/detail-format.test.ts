// node --test "src/app/contracts/[contractId]/detail-format.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { insuranceText, kstDateTime, partTimeRows, payDayText, probationText, weeklyHoursOf, workDayLines } from "./detail-format.ts";
import type { ContractDetail } from "../new/contract-form-model.ts";

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

test("수습 표기 — 없음 · 기간과 감액률 · 수습 중 시급", () => {
  assert.equal(probationText(null, null, 11200), "없음");
  assert.equal(probationText(3, 10, 11200), "3개월 · 감액 10% (수습 중 시급 10,080원)");
  assert.equal(probationText(1, 0, null), "1개월 · 감액 0%");
});

test("partTimeRows — 요일마다 저장한 시각 · 시간 · 소계를 보이고 소계 · 주휴수당 · 주급 · 월급여 줄을 붙인다", () => {
  const detail = {
    wageAmount: 10000,
    workDays: [day("MON", "09:00", "18:00"), day("TUE", "09:00", "13:00", false), day("WED", "10:00", "16:00")],
  } as unknown as ContractDetail;
  const rows = partTimeRows(detail, label);
  assert.deepEqual(rows.slice(0, 3), [
    { key: "MON", label: "월", start: "09:00", end: "18:00", restStart: "12:00", restEnd: "13:00", hours: "8", wage: "10,000", amount: "80,000" },
    { key: "TUE", label: "화", start: "09:00", end: "13:00", restStart: "-", restEnd: "-", hours: "4", wage: "10,000", amount: "40,000" },
    { key: "WED", label: "수", start: "10:00", end: "16:00", restStart: "12:00", restEnd: "13:00", hours: "5", wage: "10,000", amount: "50,000" },
  ]);
  // 근무하지 않는 요일
  assert.deepEqual(rows[3], { key: "THU", label: "목", start: "-", end: "-", restStart: "-", restEnd: "-", amount: "-" });
  // 주 17시간 → 주휴 3.4시간(÷5) · 34,000, 주급 204,000, 월급여 × 4.345
  assert.deepEqual(rows.slice(7), [
    { key: "work", label: "소계", hours: "17", amount: "170,000" },
    { key: "holiday", label: "주휴수당", hours: "3.4", amount: "34,000" },
    { key: "weekly", label: "주급", amount: "204,000" },
    { key: "monthly", label: "월급여", amount: "886,380" },
  ]);
});

test("partTimeRows — 주 15시간 미만이면 주휴수당이 없고, 시급이 비면 금액은 0 · 시급 칸은 「-」", () => {
  const rows = partTimeRows({ wageAmount: null, workDays: [day("MON", "09:00", "13:00", false)] } as unknown as ContractDetail, label);
  assert.equal(rows[0].wage, "-");
  assert.deepEqual(rows.find((r) => r.key === "holiday"), { key: "holiday", label: "주휴수당", hours: "0", amount: "0" });
});
