// node --test src/lib/platform-admin-actions.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { adminActionsOf } from "./platform-admin-actions.ts";

const all = { update: true, delete: true };
const pa = { adminAccountId: 1, roleTypeCode: "PA" };

test("플랫폼 관리자가 플랫폼 마스터 계정을 보면 수정 · 삭제를 모두 숨긴다", () => {
  assert.deepEqual(adminActionsOf(pa, { adminAccountId: 2, roleTypeCode: "PM" }, all), { canUpdate: false, canDelete: false, isSelf: false });
});

test("플랫폼 마스터는 플랫폼 마스터 계정도 고친다", () => {
  const pm = { adminAccountId: 9, roleTypeCode: "PM" };
  assert.deepEqual(adminActionsOf(pm, { adminAccountId: 2, roleTypeCode: "PM" }, all), { canUpdate: true, canDelete: true, isSelf: false });
});

test("수정 권한만 있으면 삭제는 숨긴다", () => {
  assert.deepEqual(adminActionsOf(pa, { adminAccountId: 3, roleTypeCode: "PA" }, { update: true, delete: false }), { canUpdate: true, canDelete: false, isSelf: false });
});

test("본인 계정이면 isSelf — 삭제 · 초기화를 흐리게 둔다", () => {
  assert.equal(adminActionsOf(pa, { adminAccountId: 1, roleTypeCode: "PA" }, all).isSelf, true);
});
