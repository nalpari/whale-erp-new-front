// node --test src/lib/public-holiday-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calendarCells,
  calendarWeeks,
  dateKey,
  holidaysHref,
  moveHolidayQuery,
  needsAnnouncementNote,
  parseHolidayQuery,
  publicHolidaysApiPath,
  shiftHolidayMonth,
  showsSyncFailure,
  weekdayOf,
  YEAR_OPTIONS,
  type HolidayQuery,
} from "./public-holiday-view.ts";

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
  // 형식은 맞지만 없는 날짜
  assert.equal(weekdayOf("2026-02-30"), "");
  assert.equal(weekdayOf("2026-13-01"), "");
  assert.equal(weekdayOf("2024-02-29"), "목");
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

test("연도와 월은 따로 되돌린다", () => {
  assert.deepEqual(parseHolidayQuery({ year: "2030", month: "13" }, TODAY), { year: 2030, month: 10, view: "calendar" });
  assert.deepEqual(parseHolidayQuery({ year: "1999", month: "3", view: "list" }, TODAY), { year: 2026, month: 3, view: "list" });
  assert.deepEqual(parseHolidayQuery({ year: "2026", month: "03" }, TODAY), { year: 2026, month: 3, view: "calendar" });
});

test("만든 주소를 다시 읽으면 같은 상태다", () => {
  const cases: HolidayQuery[] = [
    { year: 2000, month: 1, view: "calendar" },
    { year: 2100, month: 12, view: "list" },
    { year: 2026, month: 9, view: "list" },
  ];
  for (const q of cases) {
    const params = Object.fromEntries(new URL(holidaysHref(q), "http://x").searchParams);
    assert.deepEqual(parseHolidayQuery(params, TODAY), q);
  }
});

test("api 경로 — 캘린더는 그 달, 목록은 그 해 전체", () => {
  assert.equal(publicHolidaysApiPath({ year: 2026, month: 10, view: "calendar" }), "/public-holidays?year=2026&month=10");
  assert.equal(publicHolidaysApiPath({ year: 2026, month: 10, view: "list" }), "/public-holidays?year=2026");
});

test("달 이동은 경계 바로 안쪽까지 가고 보기를 지킨다", () => {
  assert.deepEqual(shiftHolidayMonth({ year: 2000, month: 2, view: "list" }, -1), { year: 2000, month: 1, view: "list" });
  assert.deepEqual(shiftHolidayMonth({ year: 2100, month: 11, view: "calendar" }, 1), { year: 2100, month: 12, view: "calendar" });
  assert.deepEqual(shiftHolidayMonth({ year: 2026, month: 1, view: "calendar" }, -13), { year: 2024, month: 12, view: "calendar" });
});

test("상태 옮기기 — 덮어쓰고 달을 옮긴다", () => {
  const q: HolidayQuery = { year: 2027, month: 1, view: "calendar" };
  assert.deepEqual(moveHolidayQuery(q, { view: "list" }), { year: 2027, month: 1, view: "list" });
  assert.deepEqual(moveHolidayQuery(q, { shift: -1 }), { year: 2026, month: 12, view: "calendar" });
  assert.deepEqual(moveHolidayQuery(q, { year: 2026, month: 10 }), { year: 2026, month: 10, view: "calendar" });
  assert.equal(moveHolidayQuery({ ...q, year: 2000 }, { shift: -1 }), null);
});

test("윤년 · 12월 달력의 마지막 날", () => {
  const lastDay = (y: number, m: number) => Math.max(...calendarWeeks(y, m).flat().filter((d): d is number => d !== null));
  assert.equal(lastDay(2024, 2), 29);
  assert.equal(lastDay(2100, 2), 28); // 2100년은 평년
  assert.equal(lastDay(2000, 2), 29); // 400 으로 나뉘면 윤년
  assert.equal(lastDay(2026, 12), 31);
  for (const week of calendarWeeks(2026, 12)) assert.equal(week.length, 7);
});

test("날짜 키는 api 의 holidayDate 와 같은 모양", () => {
  assert.equal(dateKey(2026, 1, 5), "2026-01-05");
  assert.equal(dateKey(2026, 12, 25), "2026-12-25");
});

test("달력 칸에 휴일과 오늘을 붙인다", () => {
  const holidays = [
    { holidayDate: "2026-10-03", name: "개천절" },
    { holidayDate: "2026-10-09", name: "한글날" },
  ];
  const cells = calendarCells(2026, 10, holidays, "2026-10-26").flat();
  const of = (day: number) => cells.find((c) => c?.day === day);
  assert.equal(of(3)?.holiday?.name, "개천절");
  assert.equal(of(3)?.isToday, false);
  assert.equal(of(26)?.isToday, true);
  assert.equal(of(26)?.holiday, undefined);
  assert.equal(cells.filter((c) => c?.isToday).length, 1);
  assert.equal(cells.filter((c) => c?.holiday).length, 2);
  // 2026년 10월 1일은 목요일 — 앞의 네 칸은 앞 달이라 비운다
  assert.deepEqual(cells.slice(0, 4), [null, null, null, null]);
});

test("오늘이 휴일이면 둘 다 붙는다", () => {
  const [cell] = calendarCells(2026, 10, [{ holidayDate: "2026-10-09", name: "한글날" }], "2026-10-09")
    .flat()
    .filter((c) => c?.day === 9);
  assert.equal(cell?.holiday?.name, "한글날");
  assert.equal(cell?.isToday, true);
});

test("다른 달의 휴일 · 오늘은 붙지 않는다", () => {
  const cells = calendarCells(2026, 9, [{ holidayDate: "2026-10-03", name: "개천절" }], "2026-10-03").flat();
  assert.equal(cells.some((c) => c?.holiday || c?.isToday), false);
});

test("동기화 실패 안내는 고른 해가 실패 목록에 있을 때만", () => {
  assert.equal(showsSyncFailure([2027], 2027), true);
  assert.equal(showsSyncFailure([2027], 2026), false);
  assert.equal(showsSyncFailure([], 2026), false);
});
