import assert from "node:assert/strict";
import { test } from "node:test";
import { END_TIMES, endOptionLabel, hasDefaults, shiftBody, shiftOf, shiftOfDefaults, shiftProblem, START_TIMES, workMinutes } from "./schedule-form-model.ts";

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
  assert.equal(shiftProblem({ ...ok, endTime: "" }), "시작과 종료를 골라 주세요.");
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
