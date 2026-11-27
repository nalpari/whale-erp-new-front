// node --test src/components/common/date-math.test.ts
// Node 24 가 타입을 벗겨 그대로 실행한다. 테스트 도구를 따로 깔지 않는다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, colonizeTime, hyphenateDate, isTime, iso, monthGrid, parse, parseTime, shiftMonth } from "./date-math.ts";

test("parse 는 사람이 치는 모양까지 받고, 없는 날짜는 버린다", () => {
  assert.equal(iso(parse("2020-08-28")!), "2020-08-28");
  assert.equal(iso(parse("2020-8-5")!), "2020-08-05");
  assert.equal(iso(parse("2020/08/28")!), "2020-08-28");
  assert.equal(parse("2025-02-30"), null, "2월 30일은 3월로 넘어가면 안 된다");
  assert.equal(parse("2020-13-01"), null);
  assert.equal(parse("20200828"), null);
  assert.equal(parse(""), null);
});

test("iso 는 지역 시간 기준이다", () => {
  // toISOString() 이면 한국 시간 09:00 이전이 하루 앞으로 밀린다.
  assert.equal(iso(new Date(2020, 7, 28, 0, 30)), "2020-08-28");
});

test("shiftMonth 는 날짜를 지키고 넘치면 말일로 당긴다", () => {
  assert.equal(iso(shiftMonth(parse("2020-01-31")!, 1)), "2020-02-29");
  assert.equal(iso(shiftMonth(parse("2021-01-31")!, 1)), "2021-02-28");
  assert.equal(iso(shiftMonth(parse("2020-03-15")!, -1)), "2020-02-15");
  assert.equal(iso(shiftMonth(parse("2020-12-15")!, 1)), "2021-01-15");
});

test("monthGrid 는 일요일에서 시작하는 42칸이다", () => {
  const grid = monthGrid(parse("2020-08-28")!);
  assert.equal(grid.length, 42);
  assert.equal(grid[0].getDay(), 0);
  assert.equal(iso(grid[0]), "2020-07-26");
  assert.equal(iso(grid[41]), "2020-09-05");
  assert.ok(grid.some((d) => iso(d) === "2020-08-01"));
  assert.ok(grid.some((d) => iso(d) === "2020-08-31"));
});

test("addDays 는 달과 해를 넘긴다", () => {
  assert.equal(iso(addDays(parse("2020-12-31")!, 1)), "2021-01-01");
  assert.equal(iso(addDays(parse("2020-03-01")!, -1)), "2020-02-29");
});

test("hyphenateDate 는 숫자를 칠 때 YYYY-MM-DD 로 하이픈을 넣고, 다음 숫자가 와야 붙인다", () => {
  assert.equal(hyphenateDate("1998"), "1998");
  assert.equal(hyphenateDate("19980"), "1998-0");
  assert.equal(hyphenateDate("199807"), "1998-07");
  assert.equal(hyphenateDate("1998071"), "1998-07-1");
  assert.equal(hyphenateDate("19980712"), "1998-07-12");
  // 지울 때: "1998-07-" 에서 하나 지우면 "1998-07" 이 되고 하이픈이 다시 붙지 않는다
  assert.equal(hyphenateDate("1998-07"), "1998-07");
  assert.equal(hyphenateDate("1998-0712"), "1998-07-12");
  assert.equal(hyphenateDate("199807123"), "1998-07-12");
  assert.equal(hyphenateDate(""), "");
});

test("hyphenateDate 는 하이픈을 두 번 친 값(한 자리 달 · 날)을 그대로 둔다 (2026-8-5 를 parse 가 받는다)", () => {
  assert.equal(hyphenateDate("2026-8-"), "2026-8-");
  assert.equal(hyphenateDate("2026-8-5"), "2026-8-5");
  assert.equal(hyphenateDate("1998-07-12"), "1998-07-12");
  assert.equal(hyphenateDate("1998-07-123"), "1998-07-12");
});

test("hyphenateDate 는 / · . 로 친 값은 그대로 둔다 (2020/8/5 를 parse 가 받는다)", () => {
  assert.equal(hyphenateDate("2020/8/5"), "2020/8/5");
  assert.equal(hyphenateDate("2020.08.05"), "2020.08.05");
});

test("colonizeTime 은 숫자만 쳐도 HH:MM 으로 쌍점을 넣는다", () => {
  assert.equal(colonizeTime("09"), "09");
  assert.equal(colonizeTime("093"), "09:3");
  assert.equal(colonizeTime("0930"), "09:30");
  assert.equal(colonizeTime("093015"), "09:30", "네 자리 넘게 치면 자른다");
  assert.equal(colonizeTime("9:5"), "9:5", "쌍점을 직접 친 모양은 그대로");
  assert.equal(colonizeTime("09:3a0"), "09:30");
});

test("parseTime 은 사람이 치는 모양을 HH:MM 으로 맞추고 범위 밖은 버린다", () => {
  assert.equal(parseTime("09:30"), "09:30");
  assert.equal(parseTime("9:5"), "09:05");
  assert.equal(parseTime("9.05"), "09:05");
  assert.equal(parseTime("0905"), "09:05");
  assert.equal(parseTime("905"), "09:05");
  assert.equal(parseTime("9"), "09:00");
  assert.equal(parseTime("23:59"), "23:59");
  assert.equal(parseTime("24:00"), null);
  assert.equal(parseTime("12:60"), null);
  assert.equal(parseTime("가나"), null);
  assert.equal(parseTime(""), null);
  assert.equal(isTime("09:30"), true);
  assert.equal(isTime("9:30"), false);
});
