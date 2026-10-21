// node --test src/lib/store-scope.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminStore } from "./session.ts";
import { openStores, restoredScope, searchStoresByText, scopeKeyOf, scopeOfKey, scopeOfParam, scopeStores, withoutStoreSearch, withScope } from "./store-scope.ts";

const store = (storeId: number, storeTypeCode: string): AdminStore => ({
  storeId,
  storeCode: `ST${String(storeId).padStart(6, "0")}`,
  name: `점포${storeId}`,
  storeTypeCode,
  storeStatusCode: "OPERATING",
});
const stores = [store(1, "DIRECT"), store(2, "FRANCHISE"), store(3, "DIRECT"), { ...store(4, "DIRECT"), storeStatusCode: "CLOSED" }];

test("scopeStores: 전체는 조건 없음, 직영 · 가맹은 그 유형 점포 모두, 점포 하나는 그 점포", () => {
  assert.deepEqual(scopeStores({ type: "ALL" }, stores), []);
  assert.deepEqual(scopeStores({ type: "DIRECT" }, stores).map((s) => s.storeId), [1, 3]);
  assert.deepEqual(scopeStores({ type: "FRANCHISE" }, stores).map((s) => s.storeId), [2]);
  assert.deepEqual(scopeStores({ type: "STORE", storeId: 2 }, stores).map((s) => s.storeId), [2]);
  // 로그인 정보에 없는 점포(지워졌거나 범위 밖)는 고를 것이 없다
  assert.deepEqual(scopeStores({ type: "STORE", storeId: 9 }, stores), []);
});

test("폐점 점포는 직영 · 가맹 전체에 들지 않지만 점포 하나로는 고를 수 있다", () => {
  assert.deepEqual(openStores(stores).map((s) => s.storeId), [1, 2, 3]);
  assert.deepEqual(scopeStores({ type: "DIRECT" }, stores).map((s) => s.storeId), [1, 3]);
  assert.deepEqual(scopeStores({ type: "STORE", storeId: 4 }, stores).map((s) => s.storeId), [4]);
});

test("withScope: 헤더가 메뉴로 갈 때 범위를 scope 하나로 싣는다 — 전체면 싣지 않고, 점포가 많아도 길어지지 않는다", () => {
  assert.equal(withScope("/stores", { type: "ALL" }), "/stores");
  assert.equal(withScope("/stores", { type: "DIRECT" }), "/stores?scope=DIRECT");
  assert.equal(withScope("/staff-members", { type: "STORE", storeId: 12 }), "/staff-members?scope=STORE%3A12");
  // 메뉴 주소에 이미 쿼리가 있으면 이어 붙이고, 전체로 바꾸면 뺀다
  assert.equal(withScope("/stores?view=table", { type: "FRANCHISE" }), "/stores?view=table&scope=FRANCHISE");
  assert.equal(withScope("/stores?scope=DIRECT", { type: "ALL" }), "/stores");
  // 범위를 전체로 바꿔 이동할 때는 적는다 — 뒤로 · 앞으로 가기에도 헤더가 주소를 따라온다
  assert.equal(withScope("/stores?scope=DIRECT", { type: "ALL" }, true), "/stores?scope=ALL");
});

test("scopeOfParam: 주소의 scope 를 범위로 — 없거나 모르는 값은 null", () => {
  assert.deepEqual(scopeOfParam("STORE:12"), { type: "STORE", storeId: 12 });
  assert.deepEqual(scopeOfParam("ALL"), { type: "ALL" });
  assert.equal(scopeOfParam(undefined), null);
  assert.equal(scopeOfParam("NOPE"), null);
});

test("withoutStoreSearch: 등록 · 삭제 뒤 점포 검색을 「전체」로 — 빈 storeIds, 범위 · 쪽은 빼고 다른 조건은 남긴다(헤더 범위는 그대로)", () => {
  assert.equal(withoutStoreSearch("/stores"), "/stores?storeIds=");
  assert.equal(withoutStoreSearch("/stores?storeIds=1%2C2&statuses=CLOSED&page=3&view=table"), "/stores?storeIds=&statuses=CLOSED&view=table");
  assert.equal(withoutStoreSearch("/stores?scope=DIRECT"), "/stores?storeIds=");
});

test("searchStoresByText: 점포명 · 점포코드에 글자가 든 점포(대소문자 무시, 폐점 포함), 빈 글자면 없음", () => {
  assert.deepEqual(searchStoresByText(stores, "점포1").map((s) => s.storeId), [1]);
  assert.deepEqual(searchStoresByText(stores, "st000004").map((s) => s.storeId), [4]);
  assert.deepEqual(searchStoresByText(stores, "  "), []);
  const many = Array.from({ length: 30 }, (_, i) => store(i + 1, "DIRECT"));
  assert.equal(searchStoresByText(many, "점포").length, 20);
});

test("scopeKeyOf · scopeOfKey: 키와 범위를 오가고 모르는 키는 null", () => {
  for (const scope of [{ type: "ALL" }, { type: "DIRECT" }, { type: "FRANCHISE" }, { type: "STORE", storeId: 12 }] as const)
    assert.deepEqual(scopeOfKey(scopeKeyOf(scope)), scope);
  assert.equal(scopeOfKey("STORE:abc"), null);
  assert.equal(scopeOfKey("STORE:0"), null);
  assert.equal(scopeOfKey("STORE:1.5"), null);
  assert.equal(scopeOfKey("CLOSED"), null);
});

test("restoredScope: 없어진 점포 · 폐점만 남은 유형은 전체로 돌린다", () => {
  assert.deepEqual(restoredScope(null, stores), { type: "ALL" });
  assert.deepEqual(restoredScope({ type: "STORE", storeId: 9 }, stores), { type: "ALL" });
  assert.deepEqual(restoredScope({ type: "STORE", storeId: 4 }, stores), { type: "STORE", storeId: 4 });
  assert.deepEqual(restoredScope({ type: "DIRECT" }, stores), { type: "DIRECT" });
  const onlyClosedDirect = [store(2, "FRANCHISE"), { ...store(4, "DIRECT"), storeStatusCode: "CLOSED" }];
  assert.deepEqual(restoredScope({ type: "DIRECT" }, onlyClosedDirect), { type: "ALL" });
});
