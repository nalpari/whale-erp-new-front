// node --test src/app/payslips/payslip-list-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayslipListQuery, parsePayslipListQuery, payslipListHref, sendTargetOf, toPayslipListSearch, withFilter } from "./payslip-list-query.ts";

const TODAY = "2026-10-19";

test("빈 쿼리는 지난달 · 상태 전부 · 1쪽", () => {
  assert.deepEqual(parsePayslipListQuery({}, TODAY), defaultPayslipListQuery(TODAY));
  assert.equal(defaultPayslipListQuery(TODAY).month, "2026-09");
});

test("달은 늘 URL 에 싣고, 상태를 모두 골랐으면 뺀다", () => {
  assert.equal(toPayslipListSearch(defaultPayslipListQuery(TODAY)), "?month=2026-09");
});

test("왕복 — 달 · 상태 · 쪽 · 건수", () => {
  const search = "?month=2026-08&status=REVIEWING%2CCONFIRMED&page=2&pageSize=50";
  const query = parsePayslipListQuery(Object.fromEntries(new URLSearchParams(search)), TODAY);
  assert.deepEqual(query, {
    month: "2026-08",
    store: "",
    storeIds: [],
    staffName: "",
    statuses: ["REVIEWING", "CONFIRMED"],
    page: 2,
    pageSize: 50,
  });
  assert.equal(toPayslipListSearch(query), search);
});

test("이상한 달 · 쪽 · 건수는 기본값, 모르는 상태는 버린다 — 빈 값은 하나도 고르지 않은 것", () => {
  const q = parsePayslipListQuery({ month: "2026-13", page: "0", pageSize: "30", status: "SENT,UNKNOWN" }, TODAY);
  assert.deepEqual([q.month, q.page, q.pageSize, q.statuses], ["2026-09", 1, 20, ["SENT"]]);
  assert.deepEqual(parsePayslipListQuery({ status: "" }, TODAY).statuses, []);
  assert.equal(toPayslipListSearch(parsePayslipListQuery({ status: "" }, TODAY)), "?month=2026-09&status=");
});

test("왕복 — 점포명 · 점포 id · 직원명(직원 목록과 같은 이름), 같은 이름이 여럿이면 첫 값", () => {
  const q = parsePayslipListQuery({ store: " 서초 ", storeIds: "5,5,x,7", staffName: [" 서지안 ", "x"], month: ["2026-07", "2026-08"] }, TODAY);
  assert.deepEqual(q, { ...defaultPayslipListQuery(TODAY), month: "2026-07", store: "서초", storeIds: [5, 7], staffName: "서지안" });
  assert.equal(toPayslipListSearch(q), "?month=2026-07&store=%EC%84%9C%EC%B4%88&storeIds=5%2C7&staffName=%EC%84%9C%EC%A7%80%EC%95%88");
});

test("점포명 없이 온 점포 id 는 버리고, 점포명만 있고 id 가 없으면 null(필터가 채운다) · 빈 id 는 맞는 점포 없음", () => {
  assert.deepEqual(parsePayslipListQuery({ storeIds: "5" }, TODAY).storeIds, []);
  assert.equal(parsePayslipListQuery({ store: "서초" }, TODAY).storeIds, null);
  assert.deepEqual(parsePayslipListQuery({ store: "서초", storeIds: "" }, TODAY).storeIds, []);
  assert.equal(toPayslipListSearch({ ...defaultPayslipListQuery(TODAY), store: "서초", storeIds: null }), "?month=2026-09&store=%EC%84%9C%EC%B4%88");
});

test("검색어는 50자에서 자른다(api 상한)", () => {
  assert.equal(parsePayslipListQuery({ staffName: "가".repeat(60) }, TODAY).staffName.length, 50);
});

test("상세의 「목록」은 받은 조건을 다시 걸러 돌려준다", () => {
  assert.equal(payslipListHref({ month: "2026-08", page: "3", foo: "x" }, TODAY), "/payslips?month=2026-08&page=3");
});

test("필터를 바꾸면 1쪽으로", () => {
  assert.equal(withFilter({ ...defaultPayslipListQuery(TODAY), page: 4 }, { month: "2026-07" }).page, 1);
});

test("일괄 발송 대상 — 목록과 같은 달 · 점포(점포명으로 찾은 id) · 직원명", () => {
  assert.deepEqual(sendTargetOf(defaultPayslipListQuery(TODAY)), { month: "2026-09" });
  assert.deepEqual(sendTargetOf({ ...defaultPayslipListQuery(TODAY), store: "서초", storeIds: [5], staffName: "서지안" }), {
    month: "2026-09",
    storeIds: [5],
    staffName: "서지안",
  });
  // 점포명 없이 남은 id 는 쓰지 않는다
  assert.deepEqual(sendTargetOf({ ...defaultPayslipListQuery(TODAY), storeIds: [5] }), { month: "2026-09" });
});
