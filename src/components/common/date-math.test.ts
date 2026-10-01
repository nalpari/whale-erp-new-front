// node --test src/components/common/date-math.test.ts
// Node 24 가 타입을 벗겨 그대로 실행한다. 테스트 도구를 따로 깔지 않는다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, iso, monthGrid, parse, shiftMonth } from "./date-math.ts";

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
