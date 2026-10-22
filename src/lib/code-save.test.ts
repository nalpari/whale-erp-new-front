import { test } from "node:test";
import assert from "node:assert/strict";
import { failureView, PARTIAL_SAVED, partialSaved, planSave, saveInOrder, type SaveStep } from "./code-save.ts";

// 부른 순서와 화면 무효화 횟수를 남기는 가짜 api. 실패하면 던진 오류의 문구와 409 를 결과로 옮긴다 —
// failureOf 가 어느 단계의 어떤 오류를 받았는지까지 결과에서 보인다.
function harness({ updateFails = false, removeFails = false, createFails = false, refreshed = true } = {}) {
  const calls: string[] = [];
  let refreshes = 0;
  const call = (name: string, fails: boolean) => async () => {
    calls.push(name);
    if (fails) throw new Error(`${name} 오류`);
  };
  return {
    calls,
    refreshes: () => refreshes,
    deps: {
      failureOf: (error: unknown, what: SaveStep) => ({ status: 409, message: `${what}: ${(error as Error).message}` }),
      refresh: () => {
        refreshes++;
        return refreshed;
      },
    },
    update: call("update", updateFails),
    remove: call("remove", removeFails),
    create: call("create", createFails),
  };
}

test("모두 있으면 수정 → 삭제 → 등록 순서로 부르고 한 번 무효화한다", async () => {
  const h = harness();
  assert.deepEqual(await saveInOrder({ ...h.deps, update: h.update, remove: h.remove, create: h.create }), { ok: true, refreshed: true });
  assert.deepEqual(h.calls, ["update", "remove", "create"]);
  assert.equal(h.refreshes(), 1);
});

test("비어 있는 쪽은 부르지 않는다 — 수정만 · 등록만 · 삭제만", async () => {
  const onlyUpdate = harness();
  assert.deepEqual(await saveInOrder({ ...onlyUpdate.deps, update: onlyUpdate.update, create: null }), { ok: true, refreshed: true });
  assert.deepEqual(onlyUpdate.calls, ["update"]);

  const onlyCreate = harness();
  assert.deepEqual(await saveInOrder({ ...onlyCreate.deps, update: null, create: onlyCreate.create }), { ok: true, refreshed: true });
  assert.deepEqual(onlyCreate.calls, ["create"]);

  const onlyRemove = harness();
  assert.deepEqual(await saveInOrder({ ...onlyRemove.deps, update: null, remove: onlyRemove.remove, create: null }), { ok: true, refreshed: true });
  assert.deepEqual(onlyRemove.calls, ["remove"]);
});

test("보낼 것이 없으면 아무것도 하지 않는다 — 무효화도 하지 않는다", async () => {
  const h = harness();
  assert.deepEqual(await saveInOrder({ ...h.deps, update: null, remove: null, create: null }), { ok: true, refreshed: false });
  assert.equal(h.refreshes(), 0);
});

test("수정이 실패하면 뒤 단계는 보내지 않고 무효화도 하지 않는다", async () => {
  const h = harness({ updateFails: true });
  assert.deepEqual(await saveInOrder({ ...h.deps, update: h.update, remove: h.remove, create: h.create }), {
    ok: false,
    updatesSaved: false,
    saved: [],
    failed: "수정",
    refreshed: false,
    status: 409,
    message: "수정: update 오류",
  });
  assert.deepEqual(h.calls, ["update"]);
  assert.equal(h.refreshes(), 0);
});

test("등록만 실패하면 수정분은 저장됐다고 알리고 무효화한다", async () => {
  const h = harness({ createFails: true });
  assert.deepEqual(await saveInOrder({ ...h.deps, update: h.update, create: h.create }), {
    ok: false,
    updatesSaved: true,
    saved: ["수정"],
    failed: "등록",
    refreshed: true,
    status: 409,
    message: "등록: create 오류",
  });
  assert.deepEqual(h.calls, ["update", "create"]);
  assert.equal(h.refreshes(), 1);
});

test("삭제가 실패하면 등록은 보내지 않는다 — 수정분은 저장됐다고 알린다", async () => {
  const h = harness({ removeFails: true });
  const result = await saveInOrder({ ...h.deps, update: h.update, remove: h.remove, create: h.create });
  assert.deepEqual(h.calls, ["update", "remove"]);
  assert.equal(result.ok, false);
  assert.deepEqual(!result.ok && [result.saved, result.failed, result.updatesSaved], [["수정"], "삭제", true]);
  assert.equal(h.refreshes(), 1);
});

test("등록만 보낸 저장이 실패하면 저장된 것이 없다 — 무효화하지 않는다", async () => {
  const h = harness({ createFails: true });
  assert.deepEqual(await saveInOrder({ ...h.deps, update: null, create: h.create }), {
    ok: false,
    updatesSaved: false,
    saved: [],
    failed: "등록",
    refreshed: false,
    status: 409,
    message: "등록: create 오류",
  });
  assert.equal(h.refreshes(), 0);
});

test("무효화를 마치지 못하면 refreshed 로 알린다 — 화면이 직접 다시 받는다", async () => {
  const ok = harness({ refreshed: false });
  assert.deepEqual(await saveInOrder({ ...ok.deps, update: ok.update, create: null }), { ok: true, refreshed: false });

  const partial = harness({ createFails: true, refreshed: false });
  const result = await saveInOrder({ ...partial.deps, update: partial.update, create: partial.create });
  assert.equal(result.ok, false);
  assert.equal(result.refreshed, false);
});

test("failureOf 가 판별 필드를 덮지 못한다", async () => {
  const h = harness({ updateFails: true });
  const result = await saveInOrder({
    update: h.update,
    create: h.create,
    refresh: h.deps.refresh,
    // 더 붙은 필드가 있어도 ok · updatesSaved 는 이 함수가 정한다
    failureOf: () => ({ message: "x", ok: true, updatesSaved: true }) as unknown as { message: string },
  });
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.updatesSaved, false);
});

test("planSave — updates 는 수정, creates 는 등록에 { items } 로, deletes 는 삭제에 { itemCodes } 로 잇고, 빈 쪽은 null", async () => {
  const sent: { to: string; body: unknown }[] = [];
  const api = {
    update: async (body: { items: string[] }) => void sent.push({ to: "update", body }),
    create: async (body: { items: number[] }) => void sent.push({ to: "create", body }),
    remove: async (body: { itemCodes: string[] }) => void sent.push({ to: "remove", body }),
  };
  const plan = planSave({ updates: ["A"], creates: [1, 2], deletes: ["X"] }, api);
  await plan.update?.();
  await plan.remove?.();
  await plan.create?.();
  assert.deepEqual(sent, [
    { to: "update", body: { items: ["A"] } },
    { to: "remove", body: { itemCodes: ["X"] } },
    { to: "create", body: { items: [1, 2] } },
  ]);

  const onlyCreate = planSave({ updates: [], creates: [1] }, api);
  assert.equal(onlyCreate.update, null);
  assert.equal(onlyCreate.remove, null);
  assert.notEqual(onlyCreate.create, null);
  assert.deepEqual(planSave({ updates: [], creates: [], deletes: [] }, api), { update: null, create: null, remove: null });
  // 삭제 api 가 없는 패널(그룹)은 deletes 가 있어도 보내지 않는다
  assert.equal(planSave({ updates: [], creates: [], deletes: ["X"] }, { update: api.update, create: api.create }).remove, null);
});

test("partialSaved — 저장된 단계와 실패한 단계를 함께 알린다", () => {
  assert.equal(PARTIAL_SAVED, "기존 행 수정은 저장했습니다. 새 행은 등록하지 못했습니다.");
  assert.equal(partialSaved(["수정", "삭제"], "등록"), "기존 행 수정과 삭제는 저장했습니다. 새 행은 등록하지 못했습니다.");
  assert.equal(partialSaved(["삭제"], "등록"), "행 삭제는 저장했습니다. 새 행은 등록하지 못했습니다.");
  assert.equal(partialSaved(["수정"], "삭제"), "기존 행 수정은 저장했습니다. 지울 행은 삭제하지 못했습니다.");
});

test("failureView — 409 는 칸 오류, 그 밖은 띠. 앞 단계가 저장됐으면 띠에 먼저 적는다", () => {
  assert.deepEqual(failureView({ status: 409, message: "겹칩니다: A", updatesSaved: false }), { band: null, conflict: "겹칩니다: A" });
  assert.deepEqual(failureView({ status: 403, message: "권한이 없습니다", updatesSaved: false }), { band: "권한이 없습니다", conflict: null });
  assert.deepEqual(failureView({ status: 409, message: "겹칩니다: A", updatesSaved: true }), { band: PARTIAL_SAVED, conflict: "겹칩니다: A" });
  assert.deepEqual(failureView({ message: "저장하지 못했습니다.", updatesSaved: true }), { band: `${PARTIAL_SAVED} 저장하지 못했습니다.`, conflict: null });
  assert.deepEqual(failureView({ message: "x", updatesSaved: true, saved: ["수정"], failed: "삭제" }), {
    band: `${partialSaved(["수정"], "삭제")} x`,
    conflict: null,
  });
});
