// node --test src/lib/store-scope.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminStore } from "./session.ts";
import {
  chipsKeyOf,
  isUnusableScope,
  openStores,
  restoredScope,
  sameStores,
  scopeFromAddress,
  scopeKeyOf,
  scopeOfKey,
  scopeOfParam,
  scopeStores,
  searchStoresByText,
  toPickedStore,
  withHeaderStoreSearch,
  withoutDeletedStore,
  withoutStoreSearch,
  withScope,
} from "./store-scope.ts";

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

test("withScope: 헤더가 메뉴로 갈 때 범위를 scope 하나로 싣는다 — 전체도 적고, 점포가 많아도 길어지지 않는다", () => {
  // 전체도 적는다 — 뒤로 · 앞으로 가기에도 헤더가 주소를 따라 전체로 돌아온다
  assert.equal(withScope("/stores", { type: "ALL" }), "/stores?scope=ALL");
  assert.equal(withScope("/stores", { type: "DIRECT" }), "/stores?scope=DIRECT");
  assert.equal(withScope("/staff-members", { type: "STORE", storeId: 12 }), "/staff-members?scope=STORE%3A12");
  // 메뉴 주소에 이미 쿼리가 있으면 이어 붙이고, 있던 범위는 바꾼다
  assert.equal(withScope("/stores?view=table", { type: "FRANCHISE" }), "/stores?view=table&scope=FRANCHISE");
  assert.equal(withScope("/stores?scope=DIRECT", { type: "ALL" }), "/stores?scope=ALL");
});

test("scopeOfParam: 주소의 scope 를 범위로 — 없거나 모르는 값은 null", () => {
  assert.deepEqual(scopeOfParam("STORE:12"), { type: "STORE", storeId: 12 });
  assert.deepEqual(scopeOfParam("ALL"), { type: "ALL" });
  assert.equal(scopeOfParam(undefined), null);
  assert.equal(scopeOfParam("NOPE"), null);
  // 주소에서 오므로 int4 양의 정수만 — 범위 밖 id 는 api 가 400 으로 막아 오류 화면이 된다
  for (const bad of ["STORE:9999999999", "STORE:1e3", "STORE:0x10", "STORE: 12", "STORE:12 ", "STORE:-1", "STORE:"]) assert.equal(scopeOfParam(bad), null, bad);
  assert.deepEqual(scopeOfParam("STORE:999999999"), { type: "STORE", storeId: 999_999_999 });
});

test("scopeFromAddress: 주소의 범위로 헤더를 바꿀 값 — 없거나 같거나 이 탭에서 쓸 수 없으면 그대로", () => {
  const all = { type: "ALL" } as const;
  assert.equal(scopeFromAddress(undefined, all, stores), null);
  assert.equal(scopeFromAddress("DIRECT", { type: "DIRECT" }, stores), null);
  assert.deepEqual(scopeFromAddress("DIRECT", all, stores), { type: "DIRECT" });
  // 로그인 정보에 없는 점포 · 폐점만 남은 유형은 따르지 않는다
  assert.equal(scopeFromAddress("STORE:99", all, stores), null);
  const onlyClosedDirect = [store(2, "FRANCHISE"), { ...store(4, "DIRECT"), storeStatusCode: "CLOSED" }];
  assert.equal(scopeFromAddress("DIRECT", all, onlyClosedDirect), null);
  // 범위를 전체로 바꾼 주소로 돌아오면 전체로 · 폐점 점포 하나는 따른다
  assert.deepEqual(scopeFromAddress("ALL", { type: "DIRECT" }, stores), all);
  assert.deepEqual(scopeFromAddress("STORE:4", all, stores), { type: "STORE", storeId: 4 });
});

test("isUnusableScope: 이 탭에 고를 점포가 없는 범위", () => {
  assert.equal(isUnusableScope({ type: "ALL" }, []), false);
  assert.equal(isUnusableScope({ type: "DIRECT" }, stores), false);
  assert.equal(isUnusableScope({ type: "DIRECT" }, [store(2, "FRANCHISE")]), true);
  assert.equal(isUnusableScope({ type: "STORE", storeId: 99 }, stores), true);
});

test("toPickedStore: 칩에 쓰는 칸 셋만", () => {
  assert.deepEqual(toPickedStore(stores[0]), { storeId: 1, name: "점포1", storeCode: "ST000001" });
});

test("chipsKeyOf: 점포가 늘거나 줄거나 이름이 바뀌면 달라진다 — 칩을 쥔 필터가 다시 맞추는 기준", () => {
  const direct = scopeStores({ type: "DIRECT" }, stores);
  const key = chipsKeyOf(direct);
  assert.equal(chipsKeyOf(scopeStores({ type: "DIRECT" }, stores.map((s) => ({ ...s })))), key);
  assert.notEqual(chipsKeyOf(scopeStores({ type: "DIRECT" }, [...stores, store(5, "DIRECT")])), key);
  assert.notEqual(chipsKeyOf(direct.slice(1)), key);
  assert.notEqual(chipsKeyOf([{ ...direct[0], name: "새 이름" }, ...direct.slice(1)]), key);
});

test("withHeaderStoreSearch: 등록 뒤 점포 조건 · 쪽을 지워 헤더 범위를 따르고, 다른 조건은 남긴다", () => {
  assert.equal(withHeaderStoreSearch("/stores?storeIds=1%2C2&statuses=CLOSED&page=3&view=table"), "/stores?statuses=CLOSED&view=table");
  assert.equal(withHeaderStoreSearch("/stores?storeIds="), "/stores");
  assert.equal(withHeaderStoreSearch("/stores?scope=DIRECT"), "/stores");
});

test("withoutDeletedStore: 고른 점포에서 지운 점포만 빼고, 남은 게 없으면 헤더 범위를 따른다", () => {
  const direct = { type: "DIRECT" } as const;
  // 고른 점포가 남으면 그것만 — 쪽은 뺀다
  assert.equal(withoutDeletedStore("/stores?storeIds=1%2C2%2C3&statuses=CLOSED&page=3", 2, direct), "/stores?statuses=CLOSED&storeIds=1%2C3");
  // 남은 게 없거나 목록에서 비운 「전체」 · 헤더가 실어 온 범위면 점포 조건을 지운다 — 필터가 헤더 범위로 다시 채운다
  assert.equal(withoutDeletedStore("/stores?storeIds=2&view=table", 2, direct), "/stores?view=table");
  assert.equal(withoutDeletedStore("/stores?storeIds=", 2, direct), "/stores");
  assert.equal(withoutDeletedStore("/stores?scope=DIRECT", 2, direct), "/stores");
  // 헤더 범위가 지운 그 점포면 전체로 적는다
  assert.equal(withoutDeletedStore("/stores?scope=STORE%3A2", 2, { type: "STORE", storeId: 2 }), "/stores?scope=ALL");
  assert.equal(withoutDeletedStore("/stores", 2, { type: "STORE", storeId: 7 }), "/stores");
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

test("sameStores: 화면에 보이는 칸 · 순서가 같을 때만 같다", () => {
  assert.equal(sameStores(stores, stores.map((s) => ({ ...s }))), true);
  assert.equal(sameStores([], []), true);
  // 등록 · 삭제
  assert.equal(sameStores(stores, [...stores, store(5, "DIRECT")]), false);
  assert.equal(sameStores(stores, stores.slice(1)), false);
  // 점포명 · 상태(폐점) 변경
  assert.equal(sameStores(stores, [{ ...stores[0], name: "새 이름" }, ...stores.slice(1)]), false);
  assert.equal(sameStores(stores, [{ ...stores[0], storeStatusCode: "CLOSED" }, ...stores.slice(1)]), false);
  // 이름이 바뀌어 순서가 달라졌다
  assert.equal(sameStores(stores, [stores[1], stores[0], ...stores.slice(2)]), false);
});

test("restoredScope: 없어진 점포 · 폐점만 남은 유형은 전체로 돌린다", () => {
  assert.deepEqual(restoredScope(null, stores), { type: "ALL" });
  assert.deepEqual(restoredScope({ type: "STORE", storeId: 9 }, stores), { type: "ALL" });
  assert.deepEqual(restoredScope({ type: "STORE", storeId: 4 }, stores), { type: "STORE", storeId: 4 });
  assert.deepEqual(restoredScope({ type: "DIRECT" }, stores), { type: "DIRECT" });
  const onlyClosedDirect = [store(2, "FRANCHISE"), { ...store(4, "DIRECT"), storeStatusCode: "CLOSED" }];
  assert.deepEqual(restoredScope({ type: "DIRECT" }, onlyClosedDirect), { type: "ALL" });
});
