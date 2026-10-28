// node --test src/components/common/load-group-state.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { INITIAL_LOAD_GROUP, isSettled, reduceLoadGroup, type LoadGroupAction } from "./load-group-state.ts";

// 화면처럼 — 쌓인 action 을 차례로 먹인 뒤, 끝났으면 풀기를 한 번 한다(effect)
function run(actions: LoadGroupAction[]) {
  let s = actions.reduce(reduceLoadGroup, INITIAL_LOAD_GROUP);
  if (isSettled(s)) s = reduceLoadGroup(s, "release");
  return s;
}

test("받는 중인 로더가 하나라도 남아 있으면 풀리지 않는다", () => {
  assert.equal(run(["begin", "begin", "ready", "end"]).released, false);
});

test("모두 끝나야 풀린다", () => {
  assert.equal(run(["begin", "begin", "ready", "end", "end"]).released, true);
});

test("끝나는 순서와 상관없이, 안쪽이 마운트되기 전에는 풀리지 않는다", () => {
  assert.equal(run(["begin", "end"]).released, false);
  assert.equal(run(["begin", "end", "ready"]).released, true);
});

test("실패해도 end 가 오므로 풀린다(성공 · 실패 구분 없음)", () => {
  assert.equal(run(["begin", "ready", "end"]).released, true);
});

test("부르지 않는 로더는 begin 을 하지 않으므로 붙잡지 않는다", () => {
  assert.equal(run(["ready"]).released, true);
});

test("release 액션(시간 제한이 부른다)은 남은 로더가 있어도 푼다", () => {
  const actions: LoadGroupAction[] = ["begin", "begin", "ready"];
  const s = actions.reduce(reduceLoadGroup, INITIAL_LOAD_GROUP);
  assert.equal(isSettled(s), false);
  assert.equal(reduceLoadGroup(s, "release").released, true);
});

test("한 번 풀린 뒤의 다시 받기(begin · end)는 묶지 않는다", () => {
  const released = run(["ready"]);
  const again = reduceLoadGroup(released, "begin");
  assert.equal(again.released, true);
  assert.equal(again.pending, 0);
  assert.equal(isSettled(again), false);
});

test("개발 모드의 effect 두 번 실행(begin · end · begin)에서도 중간에 풀리지 않는다", () => {
  assert.equal(run(["begin", "ready", "end", "begin", "ready"]).released, false);
  assert.equal(run(["begin", "ready", "end", "begin", "ready", "end"]).released, true);
});

test("end 가 begin 보다 많아도 음수가 되지 않는다", () => {
  assert.equal(run(["end", "end", "ready"]).pending, 0);
});

test("begin · end 짝이 어떤 순서로 와도 reducer 는 짝만큼 센다(순서 모형만 — 짝을 맞추는 것은 컴포넌트 쪽)", () => {
  // 영역은 active 일 때 begin, 도착하면 cleanup 으로 end 하는 한 effect 로 짝을 보장한다(LoadGroupArea). 여기서는 그 순서들을 먹여 본다
  assert.equal(run(["begin", "ready", "end"]).released, true);
  assert.equal(run(["begin", "begin", "end", "ready", "end"]).released, true);
});
