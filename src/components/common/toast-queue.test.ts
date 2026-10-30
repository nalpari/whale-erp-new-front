// node --test src/components/common/toast-queue.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_TOAST_QUEUE, onToastExpire, onToastShow, type ToastQueue } from "./toast-queue.ts";

/** 문구를 차례로 보내고 마지막 상태와 바로 띄운 문구들을 돌려준다 */
function showAll(texts: string[], from: ToastQueue = EMPTY_TOAST_QUEUE) {
  let state = from;
  const presented: string[] = [];
  for (const t of texts) {
    const r = onToastShow(state, t);
    state = r.state;
    if (r.present) presented.push(t);
  }
  return { state, presented };
}

test("onToastShow: 떠 있는 것이 없으면 바로 띄운다", () => {
  assert.deepEqual(onToastShow(EMPTY_TOAST_QUEUE, "저장되었습니다."), { state: { current: "저장되었습니다.", queue: [] }, present: true });
});

test("onToastShow: 떠 있는 동안 다른 문구는 뒤에 세우고, 이미 기다리는 문구는 또 쌓지 않는다", () => {
  const { state, presented } = showAll(["A", "B", "B", "C"]);
  assert.deepEqual(presented, ["A"]);
  assert.deepEqual(state, { current: "A", queue: ["B", "C"] });
});

test("onToastShow: 같은 문구는 기다리는 것이 없을 때만 다시 센다", () => {
  assert.equal(onToastShow({ current: "A", queue: [] }, "A").present, true);
  // 기다리는 것이 있으면 버린다 — 큐도 그대로
  assert.deepEqual(onToastShow({ current: "A", queue: ["B"] }, "A"), { state: { current: "A", queue: ["B"] }, present: false });
});

test("onToastExpire: 차례로 넘어가고 마지막 뒤에는 비운다 — 비지 않으면 그 뒤 토스트가 영영 뜨지 않는다", () => {
  let { state } = showAll(["A", "B", "C"]);
  const order = [state.current];
  for (;;) {
    const r = onToastExpire(state);
    state = r.state;
    if (r.next === null) break;
    order.push(r.next);
  }
  assert.deepEqual(order, ["A", "B", "C"]);
  assert.deepEqual(state, EMPTY_TOAST_QUEUE);
  assert.equal(onToastShow(state, "D").present, true);
});

test("다음 문구로 넘어가는 사이(닫힘 전환)에 그 문구가 다시 오면 바로 띄운다", () => {
  const { state } = onToastExpire({ current: "A", queue: ["B"] });
  assert.deepEqual(state, { current: "B", queue: [] });
  assert.equal(onToastShow(state, "B").present, true);
});
