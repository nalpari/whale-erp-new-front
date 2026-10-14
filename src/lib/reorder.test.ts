// node --test src/lib/reorder.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { moveRow } from "./reorder.ts";

const rows = ["A", "B", "C", "D"].map((code, i) => ({ code, sortOrder: i + 1 }));
const codes = (list: { code: string }[]) => list.map((r) => r.code).join("");
const orders = (list: { sortOrder: number }[]) => list.map((r) => r.sortOrder);

test("앞으로 · 뒤로 옮기고 1부터 다시 매긴다", () => {
  assert.equal(codes(moveRow(rows, 0, 2)), "BCAD");
  assert.equal(codes(moveRow(rows, 3, 0)), "DABC");
  assert.deepEqual(orders(moveRow(rows, 3, 0)), [1, 2, 3, 4]);
});

test("쪽이 나뉜 목록은 그 쪽의 시작 번호부터 매긴다", () => {
  assert.deepEqual(orders(moveRow(rows, 0, 1, 20)), [21, 22, 23, 24]);
});

test("범위 밖이거나 제자리면 그대로 돌려준다", () => {
  assert.equal(moveRow(rows, 0, 0), rows);
  assert.equal(moveRow(rows, 0, -1), rows);
  assert.equal(moveRow(rows, 0, 4), rows);
});

test("원본 배열과 행은 고치지 않는다", () => {
  moveRow(rows, 0, 3);
  assert.equal(codes(rows), "ABCD");
  assert.deepEqual(orders(rows), [1, 2, 3, 4]);
});
