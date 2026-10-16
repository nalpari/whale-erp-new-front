// node --test src/lib/role-menu-grid.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { aggregate, blockedReasonsOf, changedMenus, editableOf, hasRevocation, initialValues, toggle, toggleAll, type MenuNode } from "./role-menu-grid.ts";

const cell = (value: boolean, editable = true, blockedReason: string | null = null) => ({ value, editable, blockedReason });
const leaf = (menuId: number, r = false, c = false, u = false, d = false, editable = true, reason: string | null = null): MenuNode => ({
  menuId,
  isGroup: false,
  read: cell(r, editable, reason),
  create: cell(c, editable, reason),
  update: cell(u, editable, reason),
  delete: cell(d, editable, reason),
  children: [],
});
const group = (menuId: number, children: MenuNode[]): MenuNode => ({ ...leaf(menuId), isGroup: true, children });

test("값은 잎만 쥔다 — 묶음 메뉴는 빠진다", () => {
  const tree = [group(1, [leaf(2, true), group(3, [leaf(4)])])];
  assert.deepEqual(Object.keys(initialValues(tree)).map(Number), [2, 4]);
});

test("조회를 끄면 나머지도 꺼지고, 나머지를 켜면 조회가 켜진다", () => {
  const a = leaf(2, true, true, true, true);
  const off = toggle(initialValues([a]), a, "read", false);
  assert.deepEqual(off[2], { read: false, create: false, update: false, delete: false });
  const on = toggle(off, a, "update", true);
  assert.deepEqual(on[2], { read: true, create: false, update: true, delete: false });
});

test("바꿀 수 없는 칸은 누르거나 전체 선택해도 그대로", () => {
  const locked = leaf(2, false, false, false, false, false, "SELF_SCOPE");
  const v = initialValues([locked]);
  assert.equal(toggle(v, locked, "read", true), v);
  assert.deepEqual(toggleAll(v, [locked], "read", true)[2].read, false);
});

test("묶음을 누르면 아래 잎의 바꿀 수 있는 칸만 바뀌고, 상태는 그 칸들로 보인다", () => {
  const open = leaf(2);
  const locked = leaf(3, false, false, false, false, false, "BP_PLATFORM");
  const g = group(1, [open, locked]);
  const v = toggle(initialValues([g]), g, "create", true);
  assert.deepEqual(v[2], { read: true, create: true, update: false, delete: false });
  assert.equal(v[3].create, false);
  assert.deepEqual(aggregate(v, [g], "create"), { checked: true, disabled: false });
  assert.deepEqual(aggregate(v, [locked], "create"), { checked: false, disabled: true });
  assert.deepEqual(aggregate(v, [], "read", true), { checked: true, disabled: true });
});

test("바뀐 잎만 보내고, 켜진 칸을 끈 것이 있으면 회수다", () => {
  const a = leaf(2, true);
  const b = leaf(3);
  const initial = initialValues([a, b]);
  const added = toggle(initial, b, "read", true);
  assert.deepEqual(changedMenus(initial, added), [{ menuId: 3, read: true, create: false, update: false, delete: false }]);
  assert.equal(hasRevocation(initial, added), false);
  assert.equal(hasRevocation(initial, toggle(added, a, "read", false)), true);
});

test("막힌 이유는 중복 없이, 묶음은 아래 잎 것까지", () => {
  const g = group(1, [leaf(2, false, false, false, false, false, "SELF_SCOPE"), leaf(3, false, false, false, false, false, "SELF_SCOPE")]);
  assert.deepEqual(blockedReasonsOf(g), ["SELF_SCOPE"]);
});

test("바꿀 수 없는 등록 · 수정 · 삭제 칸이 켜진 줄은 조회도 막는다 — 끄면 api 가 400", () => {
  const row: MenuNode = { ...leaf(2, true, false, false, true), delete: cell(true, false, "OUT_OF_SCOPE") };
  assert.equal(editableOf(row, "read"), false);
  assert.equal(editableOf(row, "create"), true);
  const v = initialValues([row]);
  assert.equal(toggle(v, row, "read", false), v);
  assert.deepEqual(aggregate(v, [row], "read"), { checked: true, disabled: true });
});

test("조회가 꺼진 채 바꿀 수 없는 줄은 등록 · 수정 · 삭제도 켤 수 없다 — 켜면 「조회 없는 등록」으로 api 가 400", () => {
  const row: MenuNode = { ...leaf(2), read: cell(false, false, "OUT_OF_SCOPE") };
  assert.equal(editableOf(row, "create"), false);
  const v = initialValues([row]);
  assert.equal(toggle(v, row, "create", true), v);
  // 조회가 켜진 채 잠겨 있으면 나머지는 켤 수 있다
  const readOn: MenuNode = { ...leaf(3, true), read: cell(true, false, "OUT_OF_SCOPE") };
  assert.equal(editableOf(readOn, "create"), true);
});

test("값이 비어 있는 잎을 눌러도 서버 값에서 시작해 네 칸을 모두 쥔다", () => {
  const a = leaf(2, true);
  assert.deepEqual(toggle({}, a, "update", true)[2], { read: true, create: false, update: true, delete: false });
});
