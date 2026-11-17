import assert from "node:assert/strict";
import { test } from "node:test";
import {
  END_TIMES,
  endOptionLabel,
  dayText,
  hasDefaults,
  nextToDate,
  rangeDates,
  rangeDays,
  rangeProblem,
  shiftBody,
  shiftOf,
  shiftOfDefaults,
  shiftProblem,
  START_TIMES,
  workMinutes,
} from "./schedule-form-model.ts";

test("선택지 — 시작 00:00~23:30, 종료 00:30~24:00, 30분 단위", () => {
  assert.equal(START_TIMES.length, 48);
  assert.deepEqual([START_TIMES[0], START_TIMES.at(-1)], ["00:00", "23:30"]);
  assert.deepEqual([END_TIMES[0], END_TIMES.at(-1)], ["00:30", "24:00"]);
  assert.equal(endOptionLabel("22:00", "02:00"), "익일 02:00");
  assert.equal(endOptionLabel("09:00", "24:00"), "24:00");
  assert.equal(endOptionLabel("", "02:00"), "02:00");
});

test("근무 길이 — 종료가 이르면 다음 날", () => {
  assert.equal(workMinutes("09:00", "18:00"), 540);
  assert.equal(workMinutes("22:00", "02:00"), 240);
  assert.equal(workMinutes("09:00", "24:00"), 900);
  assert.equal(workMinutes("09:00", "09:00"), 1440);
});

test("화면에서 막는 것 — 빈칸 · 24시간 · 휴게", () => {
  const ok = { startTime: "09:00", endTime: "18:00", breakMinutes: "60" };
  assert.equal(shiftProblem(ok), null);
  assert.equal(shiftProblem({ ...ok, endTime: "" }), "시작시간과 종료시간을 선택해 주세요.");
  assert.equal(shiftProblem({ ...ok, endTime: "09:00" }), "근무시간은 24시간보다 짧아야 합니다.");
  assert.equal(shiftProblem({ startTime: "00:00", endTime: "24:00", breakMinutes: "0" }), "근무시간은 24시간보다 짧아야 합니다.");
  assert.equal(shiftProblem({ ...ok, breakMinutes: "" }), "휴게시간을 0 이상의 분으로 넣어 주세요.");
  assert.equal(shiftProblem({ ...ok, breakMinutes: "-5" }), "휴게시간을 0 이상의 분으로 넣어 주세요.");
  assert.equal(shiftProblem({ ...ok, breakMinutes: "540" }), "휴게시간은 근무시간보다 짧아야 합니다.");
  assert.equal(shiftProblem({ startTime: "22:00", endTime: "02:00", breakMinutes: "30" }), null);
  assert.deepEqual(shiftBody(ok), { startTime: "09:00", endTime: "18:00", breakMinutes: 60 });
});

test("등록된 값 · 계약 값 → 입력칸 — 자정에 끝나면 24:00, 계약에 시간이 없으면 빈칸", () => {
  assert.deepEqual(shiftOf({ startTime: "16:00", endTime: "00:00", breakMinutes: 30 }), { startTime: "16:00", endTime: "24:00", breakMinutes: "30" });
  assert.deepEqual(shiftOfDefaults({ startTime: "09:00", endTime: "18:00", breakMinutes: 60 }), { startTime: "09:00", endTime: "18:00", breakMinutes: "60" });
  assert.deepEqual(shiftOfDefaults({ startTime: null, endTime: null, breakMinutes: null }), { startTime: "", endTime: "", breakMinutes: "" });
  assert.equal(hasDefaults({ startTime: "09:00", endTime: "18:00" }), true);
  assert.equal(hasDefaults({ startTime: null, endTime: null }), false);
  assert.equal(hasDefaults(null), false);
});

test("기간 등록 — 고른 요일의 날만 순서대로, 휴일도 든다(WHALEERP-730)", () => {
  // 2026-11-16(월) ~ 11-22(일) 가운데 월 · 수 · 금
  assert.deepEqual(rangeDates("2026-11-16", "2026-11-22", [1, 3, 5]), ["2026-11-16", "2026-11-18", "2026-11-20"]);
  assert.equal(rangeDays("2026-11-16", "2026-11-16"), 1);
  assert.equal(rangeDays("2026-10-01", "2026-12-31"), 92);
});

test("기간을 막는 이유 — 종료일 앞섬 · 92일 초과 · 요일 없음 · 날 없음 · 100명 · 500건 초과", () => {
  assert.equal(rangeProblem("2026-11-16", "", [1]), "종료일을 선택해 주세요.");
  assert.equal(rangeProblem("2026-11-16", "2026-11-15", [1]), "종료일이 시작일보다 앞섭니다.");
  assert.equal(rangeProblem("2026-10-01", "2027-01-01", [1]), "기간은 최대 92일까지 정할 수 있습니다.");
  assert.equal(rangeProblem("2026-11-16", "2026-11-22", []), "요일을 하나 이상 선택해 주세요.");
  // 11-16(월) 하루에 화요일만
  assert.equal(rangeProblem("2026-11-16", "2026-11-16", [2]), "기간 안에 고른 요일에 해당하는 날이 없습니다.");
  assert.match(rangeProblem("2026-10-01", "2026-12-31", [0, 1, 2, 3, 4, 5, 6], 6) ?? "", /500건까지/);
  assert.equal(rangeProblem("2026-10-01", "2026-12-31", [0, 1, 2, 3, 4, 5, 6], 5), null);
  // 하루 × 101명 — 건수는 한도 안이지만 직원 줄 100명 한도(api rows 1~100)
  assert.match(rangeProblem("2026-11-16", "2026-11-17", [1], 101) ?? "", /100명까지/);
});

test("시작일을 바꿀 때 종료일 — 하루 등록이면 따라가고, 기간이면 두되 앞서게 되면 시작일로 당긴다", () => {
  assert.equal(nextToDate("2026-11-16", "2026-11-16", "2026-11-18"), "2026-11-18");
  assert.equal(nextToDate("2026-11-16", "2026-11-30", "2026-11-18"), "2026-11-30");
  assert.equal(nextToDate("2026-11-16", "2026-11-30", "2026-12-05"), "2026-12-05");
  assert.equal(nextToDate("2026-11-16", "2026-11-30", ""), "2026-11-30");
  assert.equal(dayText("2026-11-17"), "11월 17일(화)");
});
