import assert from "node:assert/strict";
import { test } from "node:test";
import { barOf, durationLabel, gapsOf, historyLine, hourCells, shiftLabel } from "./work-schedule-view.ts";

/** 30분 칸 48개 — [시작 칸, 끝 칸) 구간마다 인원을 더한다 */
const cov = (...spans: [number, number][]) => {
  const c = new Array<number>(48).fill(0);
  for (const [s, e] of spans) for (let i = s; i < e; i += 1) c[i] += 1;
  return c;
};

test("막대 — 시작 · 길이 비율, 자정을 넘으면 24시에서 자르고 「익일」", () => {
  assert.deepEqual(barOf({ startTime: "09:00", endTime: "18:00" }), { left: 37.5, width: 37.5, label: "09:00~18:00" });
  const night = barOf({ startTime: "22:00", endTime: "02:00" });
  assert.equal(night.left, (22 / 24) * 100);
  assert.equal(night.width, (2 / 24) * 100);
  assert.equal(night.label, "22:00~익일 02:00");
  assert.equal(shiftLabel({ startTime: "18:00", endTime: "00:00" }), "18:00~24:00");
});

test("인원 줄 — 한 시간 칸은 30분 두 칸 중 작은 값, 근무 전 · 후는 빈칸", () => {
  // 09:00-13:00 1명, 12:00-12:30 1명 더
  const cells = hourCells(cov([18, 26], [24, 25]));
  assert.equal(cells[8], null);
  assert.equal(cells[9], 1);
  assert.equal(cells[12], 1); // 12:00 2명 · 12:30 1명 → 1
  assert.equal(cells[13], null);
});

test("인원 줄 — 30분 공백도 0, 걸친 시간은 근무 안쪽 칸만 본다", () => {
  // 09:30-12:00, 12:30-15:00
  const cells = hourCells(cov([19, 24], [25, 30]));
  assert.equal(cells[9], 1); // 09:00 칸은 근무 전이라 09:30 만 본다
  assert.equal(cells[12], 0); // 12:00-12:30 공백
  assert.equal(cells[14], 1);
  assert.equal(cells[15], null);
});

test("인원 줄 — 아무도 없으면 모두 빈칸", () => {
  assert.ok(hourCells(cov()).every((c) => c === null));
});

test("공백 — 첫 근무~마지막 근무 사이 0 인 구간, 30분 단위", () => {
  assert.deepEqual(gapsOf(cov([18, 26], [30, 44])), [{ from: "13:00", to: "15:00", minutes: 120 }]);
  assert.deepEqual(gapsOf(cov([19, 24], [25, 30])), [{ from: "12:00", to: "12:30", minutes: 30 }]);
  assert.deepEqual(gapsOf(cov([18, 26])), []);
  assert.deepEqual(gapsOf(cov()), []);
  assert.equal(durationLabel(90), "1시간 30분");
  assert.equal(durationLabel(120), "2시간");
  assert.equal(durationLabel(30), "30분");
});

const v = (workDate: string, startTime: string, endTime: string, breakMinutes = 0) => ({ workDate, startTime, endTime, breakMinutes });
const by = { name: "정하윤" };

test("이력 한 줄 — 추가 · 수정 · 삭제 · 휴게만 · 날짜 바뀜 · 옛 데이터", () => {
  assert.equal(
    historyLine({ changeType: "UPDATED", staffName: "서지안", changedBy: by, before: v("2026-09-04", "13:00", "21:30"), after: v("2026-09-04", "09:00", "17:00") }),
    "서지안 09-04 13:00-21:30 → 09:00-17:00 · 정하윤",
  );
  assert.equal(
    historyLine({ changeType: "UPDATED", staffName: "서지안", changedBy: by, before: v("2026-09-04", "09:00", "13:00"), after: v("2026-09-05", "09:00", "13:00") }),
    "서지안 09-04 09:00-13:00 → 09-05 09:00-13:00 · 정하윤",
  );
  assert.equal(
    historyLine({ changeType: "UPDATED", staffName: "서지안", changedBy: by, before: v("2026-09-04", "09:00", "13:00", 30), after: v("2026-09-04", "09:00", "13:00", 60) }),
    "서지안 09-04 09:00-13:00 휴게 30분 → 60분 · 정하윤",
  );
  assert.equal(
    historyLine({ changeType: "CREATED", staffName: "유하람", changedBy: { name: null }, before: null, after: v("2026-09-04", "22:00", "02:00") }),
    "유하람 09-04 22:00-익일 02:00 · 관리자",
  );
  assert.equal(
    historyLine({ changeType: "DELETED", staffName: "배정숙", changedBy: by, before: v("2026-08-30", "16:00", "22:00"), after: null }),
    "배정숙 08-30 16:00-22:00 삭제 · 정하윤",
  );
  assert.equal(historyLine({ changeType: "DELETED", staffName: "배정숙", changedBy: by, before: null, after: null }), "배정숙 — 삭제 · 정하윤");
});
