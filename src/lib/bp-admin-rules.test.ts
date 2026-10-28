// node --test src/lib/bp-admin-rules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { BpAdminActions } from "./bp-admins.ts";
import { allowsAllStores, andOthers, canCreateBpAdmin, cascadeOf, creatableRolesOf, detailButtonsOf, editLocksOf } from "./bp-admin-rules.ts";

const all: BpAdminActions = { isSelf: false, canUpdate: true, canResetPassword: true, canChangeScope: true, canChangeRoleGroup: true };
const none: BpAdminActions = { isSelf: false, canUpdate: false, canResetPassword: false, canChangeScope: false, canChangeRoleGroup: false };

test("[등록] 은 등록 권한이 있고 가맹 관리자가 아닐 때", () => {
  assert.equal(canCreateBpAdmin({ roleTypeCode: "BM" }, { create: true, update: true }), true);
  assert.equal(canCreateBpAdmin({ roleTypeCode: "BM" }, { create: false, update: true }), false);
  assert.equal(canCreateBpAdmin({ roleTypeCode: "FA" }, { create: true, update: true }), false);
});

test("등록할 수 있는 역할 — 가맹 마스터는 가맹 관리자만", () => {
  assert.deepEqual(creatableRolesOf({ roleTypeCode: "BA" }), ["BA", "FM"]);
  assert.deepEqual(creatableRolesOf({ roleTypeCode: "PM" }), ["BA", "FM"]);
  assert.deepEqual(creatableRolesOf({ roleTypeCode: "FM" }), ["FA"]);
  assert.equal(allowsAllStores("BA"), true);
  assert.equal(allowsAllStores("FM"), false);
  assert.equal(allowsAllStores(""), false);
});

test("상세 버튼 — 메뉴 권한과 api actions 를 함께 본다", () => {
  assert.deepEqual(detailButtonsOf(all, { update: true }), { canUpdate: true, showReset: true, resetBlocked: false });
  assert.deepEqual(detailButtonsOf(all, { update: false }), { canUpdate: false, showReset: false, resetBlocked: false });
  // 가맹 관리자 줄을 BP 쪽에서 보면 — api 가 막아 둘 다 숨는다
  assert.deepEqual(detailButtonsOf(none, { update: true }), { canUpdate: false, showReset: false, resetBlocked: true });
});

test("본인 계정 — 수정은 열리고 초기화는 보이되 막힌다", () => {
  const self: BpAdminActions = { isSelf: true, canUpdate: true, canResetPassword: false, canChangeScope: false, canChangeRoleGroup: false };
  assert.deepEqual(detailButtonsOf(self, { update: true }), { canUpdate: true, showReset: true, resetBlocked: true });
  assert.deepEqual(editLocksOf({ roleTypeCode: "BA", actions: self }), { roleGroup: true, status: true, scope: true, stores: true });
  // 가맹 관리자 본인 — 수정 권한이 없으면 초기화 버튼도 없다
  assert.deepEqual(detailButtonsOf({ ...self, canUpdate: false }, { update: true }), { canUpdate: false, showReset: false, resetBlocked: true });
});

test("수정 칸 잠금 — 범위는 BP 관리자이고 api 가 허락할 때만", () => {
  assert.deepEqual(editLocksOf({ roleTypeCode: "BA", actions: all }), { roleGroup: false, status: false, scope: false, stores: false });
  assert.equal(editLocksOf({ roleTypeCode: "BA", actions: { ...all, canChangeScope: false } }).scope, true);
  assert.equal(editLocksOf({ roleTypeCode: "FM", actions: all }).scope, true);
  assert.equal(editLocksOf({ roleTypeCode: "BA", actions: { ...all, canChangeRoleGroup: false } }).roleGroup, true);
});

test("가맹 마스터 저장의 연쇄 — 사용 → 미사용, 내 범위 안 점포 빼기만 센다", () => {
  const stores = [
    { storeId: 1, isOutOfScope: false },
    { storeId: 2, isOutOfScope: false },
    { storeId: 9, isOutOfScope: true },
  ];
  const fm = { roleTypeCode: "FM" as const, accountStatus: "ACTIVE" as const, stores };
  // 폼은 범위 밖 점포(9)를 싣지 않는다 — 그대로 저장하면 연쇄가 없다
  assert.deepEqual(cascadeOf(fm, { accountStatus: "ACTIVE", storeIds: [1, 2] }), { deactivating: false, removed: [] });
  assert.equal(cascadeOf(fm, { accountStatus: "INACTIVE", storeIds: [1, 2] }).deactivating, true);
  assert.deepEqual(cascadeOf(fm, { accountStatus: "ACTIVE", storeIds: [2] }).removed, [stores[0]]);
  // 이미 미사용인 계정은 다시 미사용으로 저장해도 번지지 않는다
  assert.equal(cascadeOf({ ...fm, accountStatus: "INACTIVE" }, { accountStatus: "INACTIVE", storeIds: [1, 2] }).deactivating, false);
  // BP 관리자 · 가맹 관리자는 번지지 않는다
  assert.deepEqual(cascadeOf({ ...fm, roleTypeCode: "BA" }, { accountStatus: "INACTIVE", storeIds: [] }), { deactivating: false, removed: [] });
  assert.deepEqual(cascadeOf({ ...fm, roleTypeCode: "FA" }, { accountStatus: "INACTIVE", storeIds: [] }), { deactivating: false, removed: [] });
});

test("「외 N명」 — 첫 아이디만, 없으면 수만", () => {
  assert.equal(andOthers("moriyn", 1), "moriyn");
  assert.equal(andOthers("moriyn", 3), "moriyn 외 2명");
  assert.equal(andOthers(null, 2), "2명");
});
