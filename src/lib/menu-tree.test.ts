// node --test src/lib/menu-tree.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlacement, descendantCountOf, endSpot, flatten, heightOf, judgeMove, pathNamesOf, placeLabel, spotOf, stepSpot, zoneAt, type TreeNode } from "./menu-tree.ts";

const node = (menuId: number, depth: number, children: TreeNode[] = []): TreeNode => ({ menuId, name: `메뉴${menuId}`, depth, children });

// 1 ─ 11 ─ 111
//   └ 12
// 2 ─ 21
// 3
const tree = (): TreeNode[] => [node(1, 1, [node(11, 2, [node(111, 3)]), node(12, 2)]), node(2, 1, [node(21, 2)]), node(3, 1)];

test("flatten — 위에서부터, 상위와 형제 안 자리", () => {
  const rows = flatten(tree());
  assert.deepEqual(
    rows.map((r) => [r.node.menuId, r.parent?.menuId ?? null, r.index]),
    [
      [1, null, 0],
      [11, 1, 0],
      [111, 11, 0],
      [12, 1, 1],
      [2, null, 1],
      [21, 2, 0],
      [3, null, 2],
    ],
  );
});

test("heightOf · descendantCountOf", () => {
  const [one, two, three] = tree();
  assert.equal(heightOf(one), 3);
  assert.equal(heightOf(two), 2);
  assert.equal(heightOf(three), 1);
  assert.equal(descendantCountOf(one), 3);
  assert.equal(descendantCountOf(three), 0);
});

test("zoneAt — 위 30% · 가운데 · 아래 30%", () => {
  assert.equal(zoneAt(0.1), "before");
  assert.equal(zoneAt(0.5), "inside");
  assert.equal(zoneAt(0.9), "after");
});

test("spotOf — 앞 · 안 맨 끝 · 뒤(하위가 있으면 그 안 맨 앞)", () => {
  const t = tree();
  assert.deepEqual(spotOf(t, 12, "before"), { parentMenuId: 1, index: 1 });
  assert.deepEqual(spotOf(t, 1, "inside"), { parentMenuId: 1, index: 2 });
  assert.deepEqual(spotOf(t, 3, "after"), { parentMenuId: null, index: 3 });
  assert.deepEqual(spotOf(t, 2, "after"), { parentMenuId: 2, index: 0 });
  assert.equal(spotOf(t, 999, "before"), null);
  assert.deepEqual(endSpot(t), { parentMenuId: null, index: 3 });
});

test("judgeMove — 제자리는 noop", () => {
  const t = tree();
  assert.deepEqual(judgeMove(t, 12, { parentMenuId: 1, index: 1 }), { kind: "noop" });
  assert.deepEqual(judgeMove(t, 12, { parentMenuId: 1, index: 2 }), { kind: "noop" });
});

test("judgeMove — 자기 자신이나 하위 아래는 cycle", () => {
  const t = tree();
  assert.deepEqual(judgeMove(t, 1, { parentMenuId: 1, index: 0 }), { kind: "cycle" });
  assert.deepEqual(judgeMove(t, 1, { parentMenuId: 111, index: 0 }), { kind: "cycle" });
});

test("judgeMove — 하위 높이까지 3단계를 넘으면 depth", () => {
  const t = tree();
  // 11(높이 2)을 21 아래에 → 3단계, 그 하위 111 은 4단계
  assert.deepEqual(judgeMove(t, 11, { parentMenuId: 21, index: 0 }), { kind: "depth", level: 3, deep: 4 });
  // 2(높이 2)를 12 아래에 → 3단계, 하위 4단계
  assert.deepEqual(judgeMove(t, 2, { parentMenuId: 12, index: 0 }), { kind: "depth", level: 3, deep: 4 });
});

test("judgeMove — ok 의 index 는 옮기는 메뉴를 뺀 형제 기준", () => {
  const t = tree();
  // 같은 상위 안에서 뒤로: 1 을 3 뒤(옮기기 전 index 3)로 → 빼고 나면 2
  assert.deepEqual(judgeMove(t, 1, { parentMenuId: null, index: 3 }), { kind: "ok", level: 1, deep: 3, index: 2 });
  // 같은 상위 안에서 앞으로: 3 을 맨 앞으로 → 0 그대로
  assert.deepEqual(judgeMove(t, 3, { parentMenuId: null, index: 0 }), { kind: "ok", level: 1, deep: 1, index: 0 });
  // 다른 상위로: 111 을 2 안 맨 끝으로 → 2단계
  assert.deepEqual(judgeMove(t, 111, { parentMenuId: 2, index: 1 }), { kind: "ok", level: 2, deep: 2, index: 1 });
  // 없는 메뉴는 아무 일 없음
  assert.deepEqual(judgeMove(t, 999, { parentMenuId: null, index: 0 }), { kind: "noop" });
});

test("stepSpot — 위로 · 아래로 · 상위로 · 안으로", () => {
  const t = tree();
  assert.deepEqual(stepSpot(t, 12, "up"), { parentMenuId: 1, index: 0 });
  assert.equal(stepSpot(t, 11, "up"), null);
  assert.deepEqual(stepSpot(t, 11, "down"), { parentMenuId: 1, index: 2 });
  assert.equal(stepSpot(t, 12, "down"), null);
  assert.deepEqual(stepSpot(t, 111, "out"), { parentMenuId: 1, index: 1 });
  assert.equal(stepSpot(t, 1, "out"), null);
  assert.deepEqual(stepSpot(t, 12, "into"), { parentMenuId: 11, index: 1 });
  assert.equal(stepSpot(t, 1, "into"), null);
  // 아래로 · 위로는 judgeMove 가 한 칸 옮김으로 본다
  assert.deepEqual(judgeMove(t, 11, stepSpot(t, 11, "down")!), { kind: "ok", level: 2, deep: 3, index: 1 });
  assert.deepEqual(judgeMove(t, 12, stepSpot(t, 12, "up")!), { kind: "ok", level: 2, deep: 2, index: 0 });
});

test("createPlacement — 고른 것 없음 · 1·2단계 · 3단계", () => {
  const t = tree();
  assert.deepEqual(createPlacement(t, null), { parent: null, depth: 1, order: 4, afterId: 3 });
  const inOne = createPlacement(t, 1);
  assert.deepEqual([inOne.parent?.menuId, inOne.depth, inOne.order, inOne.afterId], [1, 2, 3, 12]);
  const inLeaf = createPlacement(t, 3);
  assert.deepEqual([inLeaf.parent?.menuId, inLeaf.depth, inLeaf.order, inLeaf.afterId], [3, 2, 1, 3]);
  const third = createPlacement(t, 111);
  assert.deepEqual([third.parent?.menuId, third.depth, third.order, third.afterId], [11, 3, 2, 111]);
  assert.deepEqual(createPlacement([], null), { parent: null, depth: 1, order: 1, afterId: null });
});

test("placeLabel", () => {
  assert.equal(placeLabel(tree(), 1, 3), "‘메뉴1’ 아래 3번째");
  assert.equal(placeLabel(tree(), null, 1), "최상위 1번째");
});

test("pathNamesOf — 최상위부터", () => {
  assert.deepEqual(pathNamesOf(tree(), 111), ["메뉴1", "메뉴11", "메뉴111"]);
  assert.deepEqual(pathNamesOf(tree(), 999), []);
});
