// node --test src/components/common/busy-stack.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { busyTextOf, createBusyStore, currentBusyText, pushBusy, removeBusy, wrapAction, type BusyEntry } from "./busy-stack.ts";

test("kind 는 정해진 문구, text 는 그 문구, 없으면 처리중입니다", () => {
  assert.equal(busyTextOf({ kind: "create" }), "등록중입니다");
  assert.equal(busyTextOf({ kind: "update" }), "수정중입니다");
  assert.equal(busyTextOf({ kind: "delete" }), "삭제중입니다");
  assert.equal(busyTextOf({ text: "발송중입니다" }), "발송중입니다");
  assert.equal(busyTextOf(), "처리중입니다");
});

test("요청이 겹치면 마지막 것이 끝날 때 내려간다", () => {
  let s: BusyEntry[] = [];
  assert.equal(currentBusyText(s), null);
  s = pushBusy(s, { id: 1, text: "등록중입니다" });
  s = pushBusy(s, { id: 2, text: "수정중입니다" });
  assert.equal(currentBusyText(s), "수정중입니다");
  s = removeBusy(s, 2);
  assert.equal(currentBusyText(s), "등록중입니다");
  s = removeBusy(s, 1);
  assert.equal(currentBusyText(s), null);
});

test("같은 id 를 두 번 지워도 안전하다", () => {
  const s = removeBusy(removeBusy([{ id: 1, text: "a" }], 1), 1);
  assert.deepEqual(s, []);
});

test("저장소 — end 를 두 번 불러도 다른 요청은 지우지 않는다", () => {
  const store = createBusyStore();
  const endA = store.begin("A");
  store.begin("B");
  endA();
  endA();
  assert.equal(store.text(), "B");
});

test("저장소 — clear 뒤 옛 end 가 늦게 와도 새 요청의 덮개는 남는다(id 를 다시 쓰지 않는다)", () => {
  const store = createBusyStore();
  const oldEnd = store.begin("옛");
  store.clear();
  assert.equal(store.text(), null);
  store.begin("새");
  oldEnd();
  assert.equal(store.text(), "새");
});

test("저장소 — 바뀔 때만 listener 를 부르고, 비면 text 는 null", () => {
  const store = createBusyStore();
  let calls = 0;
  const off = store.subscribe(() => calls++);
  store.clear(); // 비어 있으면 바뀌지 않는다
  assert.equal(calls, 0);
  const end = store.begin("A");
  end();
  end(); // 이미 지운 end 는 바꾸지 않는다
  assert.equal(calls, 2);
  assert.equal(store.text(), null);
  off();
  store.begin("B");
  assert.equal(calls, 2);
});

test("wrapAction — 결과를 그대로 돌려주고 end 를 부른다", async () => {
  const store = createBusyStore();
  let during: string | null = null;
  const run = wrapAction(store.begin, "등록중입니다", async (n: number) => {
    during = store.text();
    return n * 2;
  });
  assert.equal(await run(21), 42);
  assert.equal(during, "등록중입니다");
  assert.equal(store.text(), null);
});

test("wrapAction — reject 여도 end 를 부르고 오류를 그대로 다시 던진다", async () => {
  const store = createBusyStore();
  const error = new Error("실패");
  const run = wrapAction(store.begin, "x", async () => {
    throw error;
  });
  await assert.rejects(run(), (e) => e === error);
  assert.equal(store.text(), null);
});

test("wrapAction — begin 이 없으면 덮개 없이 그냥 부른다", async () => {
  assert.equal(await wrapAction(null, "x", async () => "ok")(), "ok");
});
