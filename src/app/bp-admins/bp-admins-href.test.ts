// node --test src/app/bp-admins/bp-admins-href.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { bpPath } from "../../lib/bp-path.ts";
import { bpAdminListQueryOf, bpAdminsHref, keepingPanel, parseBpAdminsQuery, withBpAdminFilter, withPickedStores, withScopeCondition, type BpAdminsQuery } from "./bp-admins-href.ts";

const base = parseBpAdminsQuery({});

test("주소 값이 틀리면 기본값으로 — api 에 400 · 500 을 일으키지 않는다", () => {
  assert.deepEqual(parseBpAdminsQuery({ page: "0", roleGroupId: "-3", admin: "1.5", accountStatus: "active", keyword: "   ", pageSize: "30" }), {
    page: 1,
    pageSize: 20,
    keyword: undefined,
    roleGroupId: undefined,
    accountStatus: undefined,
    storeIds: [],
    storesCleared: false,
    scope: null,
    admin: undefined,
    edit: undefined,
  });
  assert.equal(parseBpAdminsQuery({ page: "1234567890" }).page, 1);
  assert.equal(parseBpAdminsQuery({ page: ["2", "3"] }).page, 1);
  assert.equal(parseBpAdminsQuery({ pageSize: "50" }).pageSize, 50);
  assert.equal(parseBpAdminsQuery({ keyword: "a".repeat(19) + " bc" }).keyword, "a".repeat(19));
});

test("점포 조건 — 고른 점포 · 비운 「전체」 · 헤더 범위", () => {
  const picked = parseBpAdminsQuery({ storeIds: "3,x,3,7", scope: "DIRECT" });
  assert.deepEqual([picked.storeIds, picked.storesCleared, picked.scope], [[3, 7], false, null]);
  const cleared = parseBpAdminsQuery({ storeIds: "" });
  assert.deepEqual([cleared.storeIds, cleared.storesCleared, cleared.scope], [[], true, null]);
  assert.deepEqual(parseBpAdminsQuery({ scope: "STORE:9" }).scope, { type: "STORE", storeId: 9 });
});

test("만든 주소를 다시 읽으면 같은 조건 — 새로 고침 · 링크 공유에서 조건이 사라지지 않는다", () => {
  const query: BpAdminsQuery = {
    page: 3,
    pageSize: 50,
    keyword: "서아",
    roleGroupId: 4,
    accountStatus: "INACTIVE",
    storeIds: [3, 7],
    storesCleared: false,
    scope: null,
    admin: 15,
    edit: true,
  };
  assert.deepEqual(parseBpAdminsQuery(Object.fromEntries(new URL(bpAdminsHref(query), "http://x").searchParams)), query);
  const cleared = { ...base, storeIds: [], storesCleared: true };
  assert.deepEqual(parseBpAdminsQuery(Object.fromEntries(new URL(bpAdminsHref(cleared), "http://x").searchParams)), cleared);
});

test("탭 BP 주소 — 상세 · 수정, admin 없는 edit 은 버린다, 기본값은 뺀다", () => {
  assert.equal(bpPath(3, bpAdminsHref({ admin: 15 })), "/bp/3/bp-admins?admin=15");
  assert.equal(bpPath(3, bpAdminsHref({ admin: 15, edit: true })), "/bp/3/bp-admins?admin=15&edit=1");
  assert.equal(bpPath(3, bpAdminsHref({ edit: true })), "/bp/3/bp-admins");
  assert.equal(bpAdminsHref({ ...base, scope: { type: "ALL" } }), "/bp-admins?scope=ALL");
  assert.equal(bpAdminsHref({ page: 1, pageSize: 20, keyword: "a&b c" }), "/bp-admins?keyword=a%26b+c");
  assert.equal(parseBpAdminsQuery({ edit: "1" }).edit, undefined);
  assert.equal(parseBpAdminsQuery({ admin: "0", edit: "1" }).edit, undefined);
});

test("api 조건 — 고른 점포, 점포 하나 범위, 직영 · 가맹 범위는 유형으로", () => {
  assert.deepEqual(bpAdminListQueryOf({ ...base, storeIds: [3] }).storeIds, [3]);
  assert.deepEqual(bpAdminListQueryOf({ ...base, scope: { type: "STORE", storeId: 9 } }).storeIds, [9]);
  const direct = bpAdminListQueryOf({ ...base, scope: { type: "DIRECT" } });
  assert.deepEqual([direct.storeIds, direct.storeTypeCode], [[], "DIRECT"]);
  const all = bpAdminListQueryOf({ ...base, scope: { type: "ALL" } });
  assert.deepEqual([all.storeIds, all.storeTypeCode], [[], undefined]);
});

test("조건을 바꾸면 1쪽으로 돌리고 연 상세를 닫는다", () => {
  const open = { ...base, page: 4, admin: 15, edit: true, scope: { type: "DIRECT" as const } };
  const next = withBpAdminFilter(open, { keyword: "kim" });
  assert.deepEqual([next.page, next.admin, next.edit, next.keyword], [1, undefined, undefined, "kim"]);
  const picked = withPickedStores(open, [3]);
  assert.deepEqual([picked.storeIds, picked.storesCleared, picked.scope], [[3], false, null]);
  assert.equal(withPickedStores(open, []).storesCleared, true);
  const scoped = withScopeCondition({ ...base, storeIds: [3] }, { type: "ALL" });
  assert.deepEqual([scoped.storeIds, scoped.scope], [[], { type: "ALL" }]);
});

test("화면이 스스로 채우는 점포 조건은 열린 상세 · 수정을 닫지 않는다 — 상세 링크로 들어와도 패널이 남는다", () => {
  const deepLink = parseBpAdminsQuery({ admin: "5", edit: "1" });
  const filled = keepingPanel(deepLink, withScopeCondition(deepLink, { type: "DIRECT" }));
  assert.deepEqual([filled.admin, filled.edit, filled.scope], [5, true, { type: "DIRECT" }]);
  assert.equal(bpAdminsHref(filled), "/bp-admins?scope=DIRECT&admin=5&edit=1");
  const dropped = keepingPanel({ ...deepLink, storeIds: [3, 999] }, withPickedStores(deepLink, [3]));
  assert.deepEqual([dropped.admin, dropped.edit, dropped.storeIds], [5, true, [3]]);
  // 사용자가 조건을 바꾸면 그대로 닫는다
  assert.equal(withScopeCondition(deepLink, { type: "DIRECT" }).admin, undefined);
});

test("계정상태를 둘 다 끄면 NONE — 주소에 남고 api 조건에는 실리지 않는다", () => {
  const none = parseBpAdminsQuery({ accountStatus: "NONE" });
  assert.equal(none.accountStatus, "NONE");
  assert.equal(bpAdminsHref(none), "/bp-admins?accountStatus=NONE");
  assert.equal(bpAdminListQueryOf(none).accountStatus, undefined);
});
