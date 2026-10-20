// node --test src/app/stores/stores-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { backHrefOf, DEFAULT_STORES_QUERY, detailHrefOf, MAX_PICKED_STORES, parseStoresQuery, storesExcelHref, storesHref, withStoreFilter, type StoresQuery } from "./stores-query.ts";

test("기본값 — 폐점 제외 · 두 유형 · 카드 · 20건", () => {
  assert.deepEqual(parseStoresQuery({}), DEFAULT_STORES_QUERY);
  assert.equal(storesHref(DEFAULT_STORES_QUERY), "/stores");
});

test("틀린 값은 기본값으로 — api 400 · 500 을 일으키지 않는다", () => {
  const q = parseStoresQuery({ page: "0", pageSize: "30", storeIds: "1,x,-3,1234567890,2", view: "grid", bizRegistrationNumber: "123-45-6789012" });
  assert.equal(q.page, 1);
  assert.equal(q.pageSize, 20);
  assert.deepEqual(q.storeIds, [1, 2]);
  assert.equal(q.view, "cards");
  assert.equal(q.bizRegistrationNumber, "1234567890");
});

test("체크 목록 — 빈 값이면 하나도 고르지 않은 것, 모르는 값은 버린다", () => {
  assert.deepEqual(parseStoresQuery({ statuses: "" }).statuses, []);
  assert.deepEqual(parseStoresQuery({ statuses: "CLOSED,NOPE,OPERATING" }).statuses, ["OPERATING", "CLOSED"]);
  assert.deepEqual(parseStoresQuery({ storeTypes: "FRANCHISE" }).storeTypes, ["FRANCHISE"]);
});

test("만든 주소를 다시 읽으면 같은 조건 — 새로 고침 · 상세에서 돌아오기", () => {
  const q: StoresQuery = {
    page: 3,
    pageSize: 50,
    storeIds: [12, 5],
    bizRegistrationNumber: "12345",
    statuses: ["CLOSED"],
    storeTypes: ["DIRECT"],
    view: "table",
  };
  assert.deepEqual(parseStoresQuery(Object.fromEntries(new URL(storesHref(q), "http://x").searchParams)), q);
});

test("필터를 바꾸면 1쪽으로", () => {
  assert.equal(withStoreFilter({ ...DEFAULT_STORES_QUERY, page: 4 }, { storeTypes: ["DIRECT"] }).page, 1);
});

test("엑셀 주소 — 조건만 싣고 쪽 · 보기 · 건수는 뺀다", () => {
  const q: StoresQuery = { ...DEFAULT_STORES_QUERY, page: 3, pageSize: 50, view: "table", storeIds: [4, 2], statuses: ["CLOSED"] };
  assert.equal(storesExcelHref(q), "/stores/excel?storeIds=4%2C2&statuses=CLOSED");
  assert.equal(storesExcelHref(DEFAULT_STORES_QUERY), "/stores/excel");
});

test("쪽 번호가 api 상한(1천만)을 넘으면 첫 쪽", () => {
  assert.equal(parseStoresQuery({ page: "99999999" }).page, 1);
  assert.equal(parseStoresQuery({ page: "10000000" }).page, 10_000_000);
});

test("돌아갈 목록 주소는 점포 목록만 — 다른 곳으로 보내려는 값은 기본 목록", () => {
  for (const bad of ["//evil.com", "https://e/stores", "/stores/1", "/stores#a", "/storesx", "javascript:alert(1)", undefined, ["/stores?page=2"]]) {
    assert.equal(backHrefOf(bad), "/stores", String(bad));
  }
  assert.equal(backHrefOf("/stores?page=2&view=table"), "/stores?page=2&view=table");
});

test("상세로 넘긴 목록 주소가 ?back= 를 거쳐 그대로 돌아온다", () => {
  const list = storesHref({ ...DEFAULT_STORES_QUERY, page: 3, view: "table", storeIds: [4, 2] });
  const detail = detailHrefOf(list)(12);
  const back = new URL(detail, "http://x").searchParams.get("back") ?? undefined;
  assert.equal(backHrefOf(back), list);
  assert.equal(detailHrefOf("/stores")(12), "/stores/12");
});

test("상태 · 유형을 모두 끈 목록 왕복 — 새로 고침에 기본값(폐점 제외)으로 되살아나지 않고, 엑셀도 같은 조건을 보낸다", () => {
  const off: StoresQuery = { ...DEFAULT_STORES_QUERY, statuses: [], storeTypes: [] };
  const read = parseStoresQuery(Object.fromEntries(new URL(storesHref(off), "http://x").searchParams));
  assert.deepEqual(read.statuses, []);
  assert.deepEqual(read.storeTypes, []);
  const excel = new URL(storesExcelHref({ ...DEFAULT_STORES_QUERY, statuses: [] }), "http://x").searchParams;
  assert.equal(excel.get("statuses"), "");
});

test("고른 점포는 api 상한(1000개)까지 받는다 — 헤더 직영 · 가맹 범위가 그 유형 점포를 모두 싣는다", () => {
  const ids = Array.from({ length: 1200 }, (_, i) => i + 1);
  assert.equal(MAX_PICKED_STORES, 1000);
  assert.deepEqual(parseStoresQuery({ storeIds: ids.join(",") }).storeIds, ids.slice(0, 1000));
  assert.deepEqual(parseStoresQuery({ storeIds: "3,3,1" }).storeIds, [3, 1]);
});
