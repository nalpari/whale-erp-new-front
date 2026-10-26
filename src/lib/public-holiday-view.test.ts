// node --test src/lib/public-holiday-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarWeeks, holidaysHref, needsAnnouncementNote, parseHolidayQuery, shiftHolidayMonth, weekdayOf, YEAR_OPTIONS } from "./public-holiday-view.ts";

const TODAY = "2026-10-26";

test("주소가 없으면 오늘의 연월 캘린더", () => {
  assert.deepEqual(parseHolidayQuery({}, TODAY), { year: 2026, month: 10, view: "calendar" });
});

test("범위 밖 · 깨진 값은 오늘로", () => {
  assert.deepEqual(parseHolidayQuery({ year: "1999", month: "13", view: "grid" }, TODAY), { year: 2026, month: 10, view: "calendar" });
  assert.deepEqual(parseHolidayQuery({ year: "2101", month: "0" }, TODAY), { year: 2026, month: 10, view: "calendar" });
  assert.deepEqual(parseHolidayQuery({ year: ["2030"], month: "abc" }, TODAY), { year: 2026, month: 10, view: "calendar" });
});

test("고른 연도 · 월 · 목록 보기를 읽는다", () => {
  assert.deepEqual(parseHolidayQuery({ year: "2000", month: "1", view: "list" }, TODAY), { year: 2000, month: 1, view: "list" });
  assert.deepEqual(parseHolidayQuery({ year: "2100", month: "12" }, TODAY), { year: 2100, month: 12, view: "calendar" });
});

test("주소는 목록일 때만 view 를 남긴다", () => {
  assert.equal(holidaysHref({ year: 2026, month: 9, view: "calendar" }), "/public-holidays?year=2026&month=9");
  assert.equal(holidaysHref({ year: 2026, month: 9, view: "list" }), "/public-holidays?year=2026&month=9&view=list");
});

test("달 이동은 해를 넘기고 2000년 1월 · 2100년 12월에서 멈춘다", () => {
  const q = { year: 2026, month: 1, view: "calendar" } as const;
  assert.deepEqual(shiftHolidayMonth(q, -1), { year: 2025, month: 12, view: "calendar" });
  assert.deepEqual(shiftHolidayMonth({ ...q, month: 12 }, 1), { year: 2027, month: 1, view: "calendar" });
  assert.equal(shiftHolidayMonth({ ...q, year: 2000 }, -1), null);
  assert.equal(shiftHolidayMonth({ ...q, year: 2100, month: 12 }, 1), null);
});

test("달력 칸은 앞뒤 달을 비우고 주 단위로 끊는다", () => {
  // 2026년 9월 1일은 화요일, 30일까지 — 5주
  const weeks = calendarWeeks(2026, 9);
  assert.equal(weeks.length, 5);
  assert.deepEqual(weeks[0], [null, null, 1, 2, 3, 4, 5]);
  assert.deepEqual(weeks[4], [27, 28, 29, 30, null, null, null]);
  // 2015년 2월은 일요일에 시작해 28일 — 꼭 4주
  assert.equal(calendarWeeks(2015, 2).length, 4);
  // 2026년 8월은 토요일에 시작해 31일 — 6주
  assert.equal(calendarWeeks(2026, 8).length, 6);
});

test("요일은 날짜만 보고 정한다", () => {
  assert.equal(weekdayOf("2026-09-24"), "목");
  assert.equal(weekdayOf("2026-03-01"), "일");
  assert.equal(weekdayOf("2026-9-24"), "");
});

test("정부 발표 안내는 다다음 해부터", () => {
  assert.equal(needsAnnouncementNote(2027, 2026), false);
  assert.equal(needsAnnouncementNote(2028, 2026), true);
  assert.equal(needsAnnouncementNote(2020, 2026), false);
});

test("연도 선택지는 2000~2100", () => {
  assert.equal(YEAR_OPTIONS[0], 2000);
  assert.equal(YEAR_OPTIONS.at(-1), 2100);
  assert.equal(YEAR_OPTIONS.length, 101);
});
