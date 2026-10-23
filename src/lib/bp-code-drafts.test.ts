// node --test src/lib/bp-code-drafts.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { bpCodePanelAccess, bpCodesHref, bpDeletable, bpPanelLock, newBpItemDraft, toBpItemDraft } from "./bp-code-drafts.ts";
import { searchTerm } from "./code-drafts.ts";

const open = { manageOwnerCode: "PLATFORM_PROVIDED" } as const;

test("bpPanelLock — 플랫폼 사용자가 먼저, 그다음 플랫폼고정 그룹", () => {
  assert.equal(bpPanelLock(open, true), "platform-user");
  assert.equal(bpPanelLock({ manageOwnerCode: "PLATFORM_FIXED" }, true), "platform-user");
  assert.equal(bpPanelLock({ manageOwnerCode: "PLATFORM_FIXED" }, false), "fixed");
  assert.equal(bpPanelLock(open, false), null);
  assert.equal(bpPanelLock(undefined, false), null);
});

test("bpCodePanelAccess — 막히면 권한이 있어도 고치기 · 추가 · 삭제 · 저장을 모두 막는다", () => {
  const all = { update: true, create: true, delete: true };
  assert.deepEqual(bpCodePanelAccess({ lock: null, ...all }), { manage: true, canAdd: true, canDelete: true, canSave: true });
  const closed = { manage: false, canAdd: false, canDelete: false, canSave: false };
  for (const lock of ["platform-user", "fixed"] as const) assert.deepEqual(bpCodePanelAccess({ lock, ...all }), closed);
  assert.deepEqual(bpCodePanelAccess({ lock: null, ...all, loadFailed: true }), closed);
});

test("bpDeletable — 저장된 플랫폼제공 · BP전용 코드를 지운다. 플랫폼고정 · 새 행은 아니다", () => {
  assert.equal(bpDeletable({ added: false, manageOwnerCode: "BP_ONLY" }), true);
  assert.equal(bpDeletable({ added: false, manageOwnerCode: "PLATFORM_PROVIDED" }), true);
  assert.equal(bpDeletable({ added: false, manageOwnerCode: "PLATFORM_FIXED" }), false);
  assert.equal(bpDeletable({ added: true, manageOwnerCode: "BP_ONLY" }), false); // 새 행은 [×]로 뺀다
});

test("newBpItemDraft · toBpItemDraft — 새 행은 BP전용 · 사용, 받은 행은 코드가 키", () => {
  const d = newBpItemDraft("new-1");
  assert.equal(d.manageOwnerCode, "BP_ONLY");
  assert.equal(d.status, "ACTIVE");
  assert.equal(d.added, true);
  const item = { itemCode: "A", label: "가", status: "ACTIVE", sortOrder: 1, manageOwnerCode: "PLATFORM_PROVIDED", isPlatformInactive: false } as const;
  assert.deepEqual(toBpItemDraft(item), { ...item, key: "A", added: false });
});

test("bpCodesHref — 기본값(1쪽 · 빈 검색)은 빼고 순서를 고정한다", () => {
  assert.equal(bpCodesHref({}), "/bp-code-groups");
  assert.equal(bpCodesHref({ page: 1, groupCode: "" }), "/bp-code-groups");
  assert.equal(
    bpCodesHref({ page: 2, group: "EMP_TYPE", groupCode: "EMP", groupName: "고용" }),
    "/bp-code-groups?groupCode=EMP&groupName=%EA%B3%A0%EC%9A%A9&page=2&group=EMP_TYPE",
  );
});

test("searchTerm — 앞뒤 공백을 빼고 상한으로 자른다. 문자열이 아니면 빈 값", () => {
  assert.equal(searchTerm("  emp ", 20), "emp");
  assert.equal(searchTerm("a".repeat(30), 20), "a".repeat(20));
  assert.equal(searchTerm(["a", "b"], 20), "");
  assert.equal(searchTerm(undefined, 20), "");
});
