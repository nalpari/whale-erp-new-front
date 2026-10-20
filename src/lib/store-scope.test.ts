// node --test src/lib/store-scope.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminStore } from "./session.ts";
import { openStores, pickedListHref, restoredScope, scopedListHref, scopeKeyOf, scopeOfKey, scopeStores, usesStoreScope, withoutStoreIds } from "./store-scope.ts";

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

test("scopedListHref: 범위의 점포를 storeIds 로 싣고, 전체면 조건 없는 목록", () => {
  assert.equal(scopedListHref("/stores", { type: "ALL" }, stores), "/stores");
  assert.equal(scopedListHref("/stores", { type: "DIRECT" }, stores), "/stores?storeIds=1%2C3");
  assert.equal(scopedListHref("/stores", { type: "STORE", storeId: 2 }, stores), "/stores?storeIds=2");
  // 범위에 드는 점포가 없으면(로그인 정보에 없는 점포) 조건 없는 목록이다
  assert.equal(scopedListHref("/stores", { type: "STORE", storeId: 9 }, stores), "/stores");
});

test("usesStoreScope: 점포 검색 컴포넌트를 쓰는 목록 메뉴만", () => {
  assert.equal(usesStoreScope("/stores"), true);
  assert.equal(usesStoreScope("/staff-members"), false);
  assert.equal(usesStoreScope(null), false);
});

test("폐점 점포는 직영 · 가맹 전체에 들지 않지만 점포 하나로는 고를 수 있다", () => {
  assert.deepEqual(openStores(stores).map((s) => s.storeId), [1, 2, 3]);
  assert.deepEqual(scopeStores({ type: "DIRECT" }, stores).map((s) => s.storeId), [1, 3]);
  assert.deepEqual(scopeStores({ type: "STORE", storeId: 4 }, stores).map((s) => s.storeId), [4]);
});

test("withoutStoreIds: 고른 점포와 쪽만 빼고 다른 조건은 남긴다", () => {
  assert.equal(withoutStoreIds("/stores"), "/stores");
  assert.equal(withoutStoreIds("/stores?storeIds=1%2C2"), "/stores");
  assert.equal(withoutStoreIds("/stores?storeIds=1%2C2&statuses=CLOSED&page=3&view=table"), "/stores?statuses=CLOSED&view=table");
});

test("pickedListHref: 폐점 점포가 들면 점포상태를 「전체」로 싣는다 — 목록 기본 상태가 폐점을 빼 0건이 되지 않게", () => {
  assert.equal(pickedListHref("/stores", [], stores), "/stores");
  assert.equal(pickedListHref("/stores", [1, 3], stores), "/stores?storeIds=1%2C3");
  assert.equal(pickedListHref("/stores", [1, 4], stores), "/stores?storeIds=1%2C4&statuses=NOT_OPERATING%2COPERATING%2CCLOSED");
  assert.equal(scopedListHref("/stores", { type: "STORE", storeId: 4 }, stores), "/stores?storeIds=4&statuses=NOT_OPERATING%2COPERATING%2CCLOSED");
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
