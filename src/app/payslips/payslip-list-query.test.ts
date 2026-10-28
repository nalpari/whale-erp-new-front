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
    storeIds: [],
    storesCleared: false,
    scope: null,
    staffName: "",
    statuses: ["REVIEWING", "CONFIRMED"],
    reviewPending: false,
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

test("왕복 — 고른 점포 · 직원명, 같은 이름이 여럿이면 첫 값 · 겹친 점포는 하나만", () => {
  const q = parsePayslipListQuery({ storeIds: "5,5,x,7", staffName: [" 서지안 ", "x"], month: ["2026-07", "2026-08"] }, TODAY);
  assert.deepEqual(q, { ...defaultPayslipListQuery(TODAY), month: "2026-07", storeIds: [5, 7], staffName: "서지안" });
  assert.equal(toPayslipListSearch(q), "?month=2026-07&storeIds=5%2C7&staffName=%EC%84%9C%EC%A7%80%EC%95%88");
});

test("점포 조건 — 빈 storeIds 는 비운 「전체」, scope 는 헤더 범위, 고른 점포가 있으면 범위는 읽지 않는다", () => {
  const cleared = parsePayslipListQuery({ storeIds: "", scope: "DIRECT" }, TODAY);
  assert.deepEqual([cleared.storeIds, cleared.storesCleared, cleared.scope], [[], true, null]);
  assert.equal(toPayslipListSearch(cleared), "?month=2026-09&storeIds=");
  const scoped = parsePayslipListQuery({ scope: "FRANCHISE" }, TODAY);
  assert.deepEqual(scoped.scope, { type: "FRANCHISE" });
  assert.equal(toPayslipListSearch(scoped), "?month=2026-09&scope=FRANCHISE");
  assert.equal(parsePayslipListQuery({ storeIds: "5", scope: "DIRECT" }, TODAY).scope, null);
});

test("예전 점포명 주소(?store=)는 점포 조건을 읽지 않는다 — 함께 실린 storeIds 도 버리고 필터가 상단 범위로 채운다", () => {
  const q = parsePayslipListQuery({ store: "서초", storeIds: "5", scope: "DIRECT" }, TODAY);
  assert.deepEqual([q.storeIds, q.storesCleared, q.scope], [[], false, null]);
  assert.equal(toPayslipListSearch(q), "?month=2026-09");
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

test("일괄 발송 대상 — 목록과 같은 달 · 점포 조건 · 직원명", () => {
  const base = defaultPayslipListQuery(TODAY);
  assert.deepEqual(sendTargetOf(base), { month: "2026-09" });
  assert.deepEqual(sendTargetOf({ ...base, storeIds: [5], staffName: "서지안" }), { month: "2026-09", storeIds: [5], staffName: "서지안" });
  // 범위가 점포 하나면 그 점포, 직영 · 가맹이면 점포 유형, 비운 「전체」 · 범위 「전체」는 조건 없음
  assert.deepEqual(sendTargetOf({ ...base, scope: { type: "STORE", storeId: 9 } }), { month: "2026-09", storeIds: [9] });
  assert.deepEqual(sendTargetOf({ ...base, scope: { type: "DIRECT" } }), { month: "2026-09", storeTypes: ["DIRECT"] });
  assert.deepEqual(sendTargetOf({ ...base, storesCleared: true }), { month: "2026-09" });
  assert.deepEqual(sendTargetOf({ ...base, scope: { type: "ALL" } }), { month: "2026-09" });
});

test("왕복 — 검토 대기만은 reviewPending=true, 다른 값은 거르지 않는다", () => {
  const q = parsePayslipListQuery({ reviewPending: "true" }, TODAY);
  assert.equal(q.reviewPending, true);
  assert.equal(toPayslipListSearch(q), "?month=2026-09&reviewPending=true");
  assert.equal(parsePayslipListQuery({ reviewPending: "1" }, TODAY).reviewPending, false);
});
