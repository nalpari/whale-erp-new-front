import { test } from "node:test";
import assert from "node:assert/strict";
import { failureView, isStaleConflict, partialSaved, planSave, saveInOrder, savedNote, type SaveFailed, type SaveStep } from "./code-save.ts";
import { withKeptPending, type ItemDraft } from "./code-drafts.ts";

const itemDraftOf = (key: string, label: string): ItemDraft => ({ key, itemCode: key, label, status: "ACTIVE", sortOrder: 1, added: false });

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
    anySaved: false,
    saved: [],
    failed: "수정",
    skipped: ["삭제", "등록"],
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
    anySaved: true,
    saved: ["수정"],
    failed: "등록",
    skipped: [],
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
  assert.deepEqual(!result.ok && [result.saved, result.failed, result.skipped, result.anySaved], [["수정"], "삭제", ["등록"], true]);
  assert.equal(h.refreshes(), 1);
});

test("삭제만 저장되고 등록이 실패해도 저장된 것이 있다 — 무효화하고 새 행을 이어 둔다", async () => {
  const h = harness({ createFails: true });
  const result = await saveInOrder({ ...h.deps, update: null, remove: h.remove, create: h.create });
  assert.deepEqual(h.calls, ["remove", "create"]);
  assert.deepEqual(!result.ok && [result.saved, result.failed, result.skipped, result.anySaved], [["삭제"], "등록", [], true]);
  assert.equal(h.refreshes(), 1);
});

test("삭제만 보낸 저장이 실패하면 저장된 것이 없다 — 무효화하지 않는다", async () => {
  const h = harness({ removeFails: true });
  const result = await saveInOrder({ ...h.deps, update: null, remove: h.remove, create: null });
  assert.deepEqual(!result.ok && [result.saved, result.failed, result.skipped, result.anySaved], [[], "삭제", [], false]);
  assert.equal(h.refreshes(), 0);
});

test("failureOf 는 실패 앞에서 저장된 단계를 받는다 — 서버 로그에 남긴다", async () => {
  const got: (readonly SaveStep[])[] = [];
  const h = harness({ createFails: true });
  await saveInOrder({
    ...h.deps,
    failureOf: (_error, _what, saved) => (got.push(saved), { message: "x" }),
    update: h.update,
    remove: h.remove,
    create: h.create,
  });
  assert.deepEqual(got, [["수정", "삭제"]]);
  assert.equal(savedNote(["수정", "삭제"]), "(수정 · 삭제분은 저장됨)");
  assert.equal(savedNote([]), "");
});

test("등록만 보낸 저장이 실패하면 저장된 것이 없다 — 무효화하지 않는다", async () => {
  const h = harness({ createFails: true });
  assert.deepEqual(await saveInOrder({ ...h.deps, update: null, create: h.create }), {
    ok: false,
    anySaved: false,
    saved: [],
    failed: "등록",
    skipped: [],
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
    // 더 붙은 필드가 있어도 ok · anySaved 는 이 함수가 정한다
    failureOf: () => ({ message: "x", ok: true, anySaved: true }) as unknown as { message: string },
  });
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.anySaved, false);
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
  assert.equal(partialSaved(["수정"], "등록"), "기존 행 수정은 저장했습니다. 새 행은 등록하지 못했습니다.");
  assert.equal(partialSaved(["수정", "삭제"], "등록"), "기존 행 수정과 삭제는 저장했습니다. 새 행은 등록하지 못했습니다.");
  assert.equal(partialSaved(["삭제"], "등록"), "행 삭제는 저장했습니다. 새 행은 등록하지 못했습니다.");
  assert.equal(partialSaved(["수정"], "삭제"), "기존 행 수정은 저장했습니다. 지울 행은 삭제하지 못했습니다.");
  // 삭제가 실패해 등록을 보내지 않았으면 새 행도 저장되지 않았다고 덧붙인다
  assert.equal(partialSaved(["수정"], "삭제", ["등록"]), "기존 행 수정은 저장했습니다. 지울 행은 삭제하지 못했습니다. 새 행도 등록하지 않았습니다.");
});

const failed = (rest: { status?: number; message: string; saved: SaveStep[]; failed: SaveStep; skipped?: SaveStep[] }): SaveFailed => ({
  ok: false,
  anySaved: rest.saved.length > 0,
  skipped: [],
  refreshed: true,
  ...rest,
});

test("failureView — 409 는 칸 오류, 그 밖은 띠. 앞 단계가 저장됐으면 띠에 먼저 적는다", () => {
  const partial = partialSaved(["수정"], "등록");
  assert.deepEqual(failureView(failed({ status: 409, message: "겹칩니다: A", saved: [], failed: "등록" })), { band: null, conflict: "겹칩니다: A", stale: false });
  assert.deepEqual(failureView(failed({ status: 403, message: "권한이 없습니다", saved: [], failed: "수정" })), { band: "권한이 없습니다", conflict: null, stale: false });
  assert.deepEqual(failureView(failed({ status: 409, message: "겹칩니다: A", saved: ["수정"], failed: "등록" })), { band: partial, conflict: "겹칩니다: A", stale: false });
  assert.deepEqual(failureView(failed({ message: "저장하지 못했습니다.", saved: ["수정"], failed: "등록" })), {
    band: `${partial} 저장하지 못했습니다.`,
    conflict: null,
    stale: false,
  });
  assert.deepEqual(failureView(failed({ message: "x", saved: ["수정"], failed: "삭제", skipped: ["등록"] })), {
    band: `${partialSaved(["수정"], "삭제", ["등록"])} x`,
    conflict: null,
    stale: false,
  });
  // 삭제만 저장되고 등록이 409 면 띠는 삭제를 저장했다고 알리고, 겹친 코드는 칸 오류로 간다
  assert.deepEqual(failureView(failed({ status: 409, message: "겹칩니다: B", saved: ["삭제"], failed: "등록" })), {
    band: partialSaved(["삭제"], "등록"),
    conflict: "겹칩니다: B",
    stale: false,
  });
  // 아무것도 저장되지 않은 삭제 단계 409(막힌 그룹 등)는 띠 없이 칸 오류(표 아래 한 줄)로 보인다
  assert.deepEqual(failureView(failed({ status: 409, message: "막힌 그룹입니다", saved: [], failed: "삭제" })), { band: null, conflict: "막힌 그룹입니다", stale: false });
});

test("failureView — 그 사이 고쳤거나 지운 409 는 칸 오류가 아니라 띠(최신 정보로 다시 채움)", () => {
  const changed = "다른 관리자가 먼저 수정했습니다. 최신 정보를 불러온 뒤 다시 저장해 주세요.";
  assert.deepEqual(failureView(failed({ status: 409, message: changed, saved: [], failed: "수정" })), { band: changed, conflict: null, stale: true });
  const gone = "다른 관리자가 먼저 지운 상세 코드가 있습니다(G1). 다시 불러온 뒤 저장해 주세요.";
  assert.deepEqual(failureView(failed({ status: 409, message: gone, saved: ["수정"], failed: "삭제" })), {
    band: `${partialSaved(["수정"], "삭제")} ${gone}`,
    conflict: null,
    stale: true,
  });
  assert.equal(isStaleConflict("이 그룹에 이미 있는 상세 코드입니다(A)."), false, "중복은 그 사이 바뀜이 아니다");
  // 이미 지운 행을 고치거나 지우면 api 는 읽기 단계에서 404 — 같은 「그 사이 바뀜」으로 다시 받는다(PR #206 리뷰)
  const missing = "상세 코드를 찾을 수 없습니다(G2).";
  assert.deepEqual(failureView(failed({ status: 404, message: missing, saved: [], failed: "수정" })), { band: missing, conflict: null, stale: true });
  assert.equal(isStaleConflict(missing), false, "404 는 문구가 아니라 상태 코드로 가른다");
  // 앞 단계가 저장된 뒤의 404 도 띠 앞에 저장한 것을 먼저 적는다
  assert.deepEqual(failureView(failed({ status: 404, message: missing, saved: ["수정"], failed: "삭제" })), {
    band: `${partialSaved(["수정"], "삭제")} ${missing}`,
    conflict: null,
    stale: true,
  });
  // 문구 꼴이 다른 404(배포가 어긋난 Nest 기본 문구 등)도 그 사이 바뀜으로 본다 — 화면은 판정 값(stale)으로 아랫줄을 고른다
  assert.equal(failureView(failed({ status: 404, message: "Cannot PUT /code-groups/X/items", saved: [], failed: "수정" })).stale, true);
});

test("withKeptPending — 이어 두면 기존 행은 최신 값으로, 보내지 않은 새 행 · 지울 행 표시는 남긴다(그 사이 바뀜 409 뒤)", () => {
  const fresh = [itemDraftOf("A", "새 이름"), itemDraftOf("B", "비")];
  const current = [{ ...itemDraftOf("A", "내가 고친 이름") }, { ...itemDraftOf("B", "비"), deleted: true }, { ...itemDraftOf("new-1", "인턴"), itemCode: "INTERN", added: true }];
  const kept = withKeptPending(fresh, current, true);
  assert.deepEqual(kept.map((d) => [d.key, d.label, !!d.deleted, d.added]), [
    ["A", "새 이름", false, false],
    ["B", "비", true, false],
    ["new-1", "인턴", false, true],
  ]);
  assert.deepEqual(withKeptPending(fresh, current, false), fresh, "잇지 않으면 받은 목록 그대로");
});
