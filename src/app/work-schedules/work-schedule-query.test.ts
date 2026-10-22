import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addMonths,
  historyApiSearch,
  mondayOf,
  monthRange,
  parseScheduleQuery,
  scheduleApiSearch,
  toScheduleSearch,
  weekRange,
} from "./work-schedule-query.ts";

const TODAY = "2026-10-21"; // 수요일

test("주는 월~일, 월간은 그 달 1일이 든 주의 월요일부터 42일", () => {
  assert.equal(mondayOf("2026-10-21"), "2026-10-19");
  assert.equal(mondayOf("2026-10-25"), "2026-10-19"); // 일요일
  assert.equal(mondayOf("2026-10-26"), "2026-10-26");
  assert.deepEqual(weekRange("2026-10-19"), { from: "2026-10-19", to: "2026-10-25" });
  assert.deepEqual(monthRange("2026-10"), { from: "2026-09-28", to: "2026-11-08" });
  assert.equal(addMonths("2026-12", 1), "2027-01");
  assert.equal(addMonths("2026-01", -1), "2025-12");
});

test("기본값 — 이번 주 · 오늘, 기본값은 주소에서 뺀다", () => {
  const q = parseScheduleQuery({ store: "7" }, TODAY);
  assert.equal(q.storeId, 7);
  assert.equal(q.view, "week");
  assert.equal(q.week, "2026-10-19");
  assert.equal(q.day, TODAY);
  assert.equal(toScheduleSearch(q, TODAY), "?store=7");
});

test("주는 아무 날을 줘도 그 주 월요일로, 그 주 밖의 날은 월요일로", () => {
  const q = parseScheduleQuery({ store: "7", week: "2026-10-29", day: "2026-10-21" }, TODAY);
  assert.equal(q.week, "2026-10-26");
  assert.equal(q.day, "2026-10-26");
  assert.equal(toScheduleSearch(q, TODAY), "?store=7&week=2026-10-26");
  assert.equal(parseScheduleQuery({ store: "7", week: "2026-10-26", day: "2026-10-30" }, TODAY).day, "2026-10-30");
});

test("월간 — 그 달 밖의 날은 1일(이번 달이면 오늘)", () => {
  const q = parseScheduleQuery({ store: "7", view: "month", month: "2026-11", day: "2026-10-03" }, TODAY);
  assert.equal(q.day, "2026-11-01");
  assert.equal(toScheduleSearch(q, TODAY), "?store=7&view=month&month=2026-11");
  assert.equal(parseScheduleQuery({ store: "7", view: "month" }, TODAY).day, TODAY);
});

test("헤더 범위가 점포 하나면 그 점포 — ?store= 가 앞선다, 이상한 값은 버린다", () => {
  assert.equal(parseScheduleQuery({ scope: "STORE:12" }, TODAY).storeId, 12);
  assert.equal(parseScheduleQuery({ scope: "STORE:12", store: "3" }, TODAY).storeId, 3);
  assert.equal(parseScheduleQuery({ scope: "ALL" }, TODAY).storeId, null);
  assert.equal(parseScheduleQuery({ store: "0" }, TODAY).storeId, null);
  assert.equal(parseScheduleQuery({ store: "99999999999" }, TODAY).storeId, null);
  assert.equal(parseScheduleQuery({ store: "7", week: "2026-02-30" }, TODAY).week, "2026-10-19");
});

test("api 쿼리 — 주간 7일 · 월간 42일", () => {
  const week = parseScheduleQuery({ store: "7" }, TODAY);
  assert.equal(scheduleApiSearch({ ...week, storeId: 7 }), "storeId=7&from=2026-10-19&to=2026-10-25");
  const month = parseScheduleQuery({ store: "7", view: "month" }, TODAY);
  assert.equal(scheduleApiSearch({ ...month, storeId: 7 }), "storeId=7&from=2026-09-28&to=2026-11-08");
});

test("변경 이력 — 주소 ↔ api, 이상한 페이지당 건수는 20", () => {
  const q = parseScheduleQuery({ store: "7", history: "1", hfrom: "2026-10-01", hstaff: "41", hpage: "2", hsize: "50" }, TODAY);
  assert.equal(toScheduleSearch(q, TODAY), "?store=7&history=1&hfrom=2026-10-01&hstaff=41&hpage=2&hsize=50");
  assert.equal(historyApiSearch({ ...q, storeId: 7 }), "storeId=7&page=2&pageSize=50&from=2026-10-01&staffMemberId=41");
  assert.equal(parseScheduleQuery({ history: "1", hsize: "30" }, TODAY).historyPageSize, 20);
});
