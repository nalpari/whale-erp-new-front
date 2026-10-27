// node --test src/lib/bp-admin-rules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { BpAdminActions } from "./bp-admins.ts";
import { allowsAllStores, canCreateBpAdmin, creatableRolesOf, detailButtonsOf, editLocksOf } from "./bp-admin-rules.ts";

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
