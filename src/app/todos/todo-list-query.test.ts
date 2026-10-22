// node --test src/app/todos/todo-list-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { fillScopeOf } from "../stores/stores-query.ts";
import {
  backHrefOf,
  DEFAULT_TODO_LIST_QUERY,
  emptyPageHref,
  hasTodoFilter,
  parseTodoListQuery,
  todoListApiSearch,
  toTodoListSearch,
  withBack,
  withFilter,
  withPickedStores,
  withScopeCondition,
} from "./todo-list-query.ts";

test("빈 URL 은 기본값 — 근무지 전체, 상태 셋 다, 담당 전체, 1쪽, 20건", () => {
  assert.deepEqual(parseTodoListQuery({}), DEFAULT_TODO_LIST_QUERY);
  assert.deepEqual(DEFAULT_TODO_LIST_QUERY.statuses, ["PENDING", "IN_PROGRESS", "DONE"]);
  assert.equal(toTodoListSearch(DEFAULT_TODO_LIST_QUERY), "");
});

test("parse(toSearch(q)) 는 q", () => {
  const q = {
    ...DEFAULT_TODO_LIST_QUERY,
    storeIds: [3, 7],
    statuses: ["PENDING" as const, "IN_PROGRESS" as const],
    assigneeType: "ALL" as const,
    urgentOnly: true,
    dueDateFrom: "2026-10-01",
    dueDateTo: "2026-10-31",
    page: 2,
    pageSize: 50 as const,
  };
  const params = Object.fromEntries(new URLSearchParams(toTodoListSearch(q)));
  assert.deepEqual(parseTodoListQuery(params), q);
});

test("상태는 화면 순서로 남고, 모두 끄면 빈 값으로 남는다", () => {
  assert.equal(new URLSearchParams(toTodoListSearch({ ...DEFAULT_TODO_LIST_QUERY, statuses: ["DONE", "PENDING"] })).get("status"), "PENDING,DONE");
  assert.equal(toTodoListSearch({ ...DEFAULT_TODO_LIST_QUERY, statuses: [] }), "?status=");
  assert.deepEqual(parseTodoListQuery({ status: "" }).statuses, []);
  assert.deepEqual(parseTodoListQuery({ status: "NOPE,DONE" }).statuses, ["DONE"]);
});

test("이상한 값은 그 칸만 기본값", () => {
  const q = parseTodoListQuery({ storeIds: "abc", assigneeType: "X", urgent: "maybe", dueDateFrom: "2026-02-30", dueDateTo: "10/31", page: "0", pageSize: "7" });
  assert.deepEqual(q.storeIds, []);
  assert.equal(q.assigneeType, "");
  assert.equal(q.urgentOnly, false);
  assert.equal(q.dueDateFrom, "");
  assert.equal(q.dueDateTo, "");
  assert.equal(q.page, 1);
  assert.equal(q.pageSize, 20);
  assert.deepEqual(parseTodoListQuery({ storeIds: "2147483648,5,5,0" }).storeIds, [5]);
  assert.equal(parseTodoListQuery({ page: "1000001" }).page, 1);
});

test("api 쿼리 — 상태는 같은 이름을 되풀이하고, 셋 다면 뺀다", () => {
  assert.equal(todoListApiSearch(DEFAULT_TODO_LIST_QUERY), "page=1&pageSize=20");
  const params = new URLSearchParams(
    todoListApiSearch({ ...DEFAULT_TODO_LIST_QUERY, storeIds: [7], statuses: ["PENDING", "IN_PROGRESS"], assigneeType: "INDIVIDUAL", urgentOnly: true, dueDateFrom: "2026-10-01", page: 3 }) ?? "",
  );
  assert.deepEqual(params.getAll("status"), ["PENDING", "IN_PROGRESS"]);
  assert.equal(params.get("storeIds"), "7");
  assert.equal(params.get("assigneeType"), "INDIVIDUAL");
  assert.equal(params.get("isUrgent"), "true");
  assert.equal(params.get("dueDateFrom"), "2026-10-01");
  assert.equal(params.has("dueDateTo"), false);
  assert.equal(params.get("page"), "3");
});

test("0건이 확실한 조건은 api 를 부르지 않는다 — 상태를 하나도 안 골랐거나 기간이 거꾸로", () => {
  assert.equal(todoListApiSearch({ ...DEFAULT_TODO_LIST_QUERY, statuses: [] }), null);
  assert.equal(todoListApiSearch({ ...DEFAULT_TODO_LIST_QUERY, dueDateFrom: "2026-10-31", dueDateTo: "2026-10-01" }), null);
  assert.notEqual(todoListApiSearch({ ...DEFAULT_TODO_LIST_QUERY, dueDateFrom: "2026-10-01", dueDateTo: "2026-10-01" }), null);
});

test("필터를 바꾸면 1쪽으로", () => {
  assert.equal(withFilter({ ...DEFAULT_TODO_LIST_QUERY, page: 4 }, { urgentOnly: true }).page, 1);
});

test("점포 조건 네 가지 — 주소 ↔ 조건", () => {
  const picked = parseTodoListQuery({ storeIds: "3,7", scope: "DIRECT" });
  assert.deepEqual([picked.storeIds, picked.storesCleared, picked.scope], [[3, 7], false, null]);
  assert.equal(toTodoListSearch(picked), "?storeIds=3%2C7");
  // 빈 storeIds 는 목록에서 비운 「전체」 — scope 가 함께 있어도 앞선다
  const cleared = parseTodoListQuery({ storeIds: "", scope: "FRANCHISE" });
  assert.deepEqual([cleared.storeIds, cleared.storesCleared, cleared.scope], [[], true, null]);
  assert.equal(toTodoListSearch(cleared), "?storeIds=");
  // 헤더 범위 — 전체도 scope=ALL 로 남는다
  for (const key of ["ALL", "DIRECT", "FRANCHISE", "STORE:12"]) {
    const q = parseTodoListQuery({ scope: key });
    assert.equal(q.storesCleared, false);
    assert.equal(toTodoListSearch(q), `?scope=${encodeURIComponent(key)}`);
  }
  // 정해지지 않음 — 모르는 범위도 여기에 든다
  assert.equal(parseTodoListQuery({}).scope, null);
  assert.equal(parseTodoListQuery({ scope: "NOPE" }).scope, null);
  // 옛 주소의 storeId 하나는 고른 점포로
  assert.deepEqual(parseTodoListQuery({ storeId: "4" }).storeIds, [4]);
  assert.deepEqual(parseTodoListQuery({ storeId: "4", storeIds: "9" }).storeIds, [9]);
  assert.equal(parseTodoListQuery({ storeId: "abc", scope: "DIRECT" }).scope?.type, "DIRECT");
});

test("점포 조건 → api — 고른 점포 · 점포 하나는 storeIds, 직영 · 가맹은 storeTypes, 전체 · 비운 것은 싣지 않는다", () => {
  const api = (raw: Record<string, string>) => new URLSearchParams(todoListApiSearch(parseTodoListQuery(raw)) ?? "");
  assert.equal(api({ storeIds: "3,7" }).get("storeIds"), "3,7");
  assert.equal(api({ storeIds: "3,7" }).has("storeTypes"), false);
  assert.equal(api({ scope: "STORE:12" }).get("storeIds"), "12");
  assert.equal(api({ scope: "DIRECT" }).get("storeTypes"), "DIRECT");
  assert.equal(api({ scope: "FRANCHISE" }).get("storeTypes"), "FRANCHISE");
  assert.equal(api({ scope: "FRANCHISE" }).has("storeIds"), false);
  for (const raw of [{ scope: "ALL" }, { storeIds: "" }, {}] as Record<string, string>[]) {
    const params = api(raw);
    assert.equal(params.has("storeIds") || params.has("storeTypes") || params.has("storeId"), false, JSON.stringify(raw));
  }
});

test("점포 조건을 바꾸면 짝이 맞고 1쪽으로 — 비우면 「전체」, 범위를 걸면 고른 점포를 비운다", () => {
  const q = { ...DEFAULT_TODO_LIST_QUERY, scope: { type: "DIRECT" as const }, page: 3 };
  assert.deepEqual(withPickedStores(q, [5]), { ...q, storeIds: [5], storesCleared: false, scope: null, page: 1 });
  assert.deepEqual(withPickedStores(q, []), { ...q, storeIds: [], storesCleared: true, scope: null, page: 1 });
  assert.deepEqual(withScopeCondition({ ...q, storeIds: [5] }, { type: "ALL" }), { ...q, storeIds: [], storesCleared: false, scope: { type: "ALL" }, page: 1 });
});

test("정해지지 않은 점포 조건만 헤더 범위로 채운다(전체 헤더는 채우지 않는다)", () => {
  const direct = { type: "DIRECT" as const };
  assert.deepEqual(fillScopeOf(parseTodoListQuery({}), direct), direct);
  assert.equal(fillScopeOf(parseTodoListQuery({}), { type: "ALL" }), null);
  assert.equal(fillScopeOf(parseTodoListQuery({ storeIds: "" }), direct), null);
  assert.equal(fillScopeOf(parseTodoListQuery({ storeIds: "3" }), direct), null);
  assert.equal(fillScopeOf(parseTodoListQuery({ scope: "ALL" }), direct), null);
});

test("상세 · 등록은 목록 주소를 ?back= 으로 받고, TO-DO 목록 주소만 돌아갈 곳으로 받는다", () => {
  assert.equal(withBack("/todos/5", "/todos"), "/todos/5");
  assert.equal(withBack("/todos/new", "/todos?storeIds=3%2C7&urgent=1"), "/todos/new?back=%2Ftodos%3FstoreIds%3D3%252C7%26urgent%3D1");
  assert.equal(backHrefOf("/todos?storeIds=3%2C7&urgent=1"), "/todos?storeIds=3%2C7&urgent=1");
  assert.equal(backHrefOf(undefined), "/todos");
  assert.equal(backHrefOf(["/todos?urgent=1"]), "/todos");
  for (const bad of ["//evil.example", "https://evil.example/todos", "/todos/5", "/todosx", "/stores?scope=ALL", "/todos#x"]) assert.equal(backHrefOf(bad), "/todos", bad);
});

test("거르는 조건이 있는가 — 쪽 · 건수는 조건이 아니다", () => {
  assert.equal(hasTodoFilter(DEFAULT_TODO_LIST_QUERY), false);
  assert.equal(hasTodoFilter({ ...DEFAULT_TODO_LIST_QUERY, page: 3, pageSize: 50 }), false);
  assert.equal(hasTodoFilter({ ...DEFAULT_TODO_LIST_QUERY, urgentOnly: true }), true);
  assert.equal(hasTodoFilter({ ...DEFAULT_TODO_LIST_QUERY, statuses: ["DONE"] }), true);
  assert.equal(hasTodoFilter({ ...DEFAULT_TODO_LIST_QUERY, dueDateTo: "2026-10-31" }), true);
  // 점포 「전체」(헤더 전체 · 목록에서 비움)는 조건이 아니고, 고른 점포 · 좁은 범위는 조건이다
  assert.equal(hasTodoFilter(parseTodoListQuery({ scope: "ALL" })), false);
  assert.equal(hasTodoFilter(parseTodoListQuery({ storeIds: "" })), false);
  assert.equal(hasTodoFilter(parseTodoListQuery({ storeIds: "3" })), true);
  assert.equal(hasTodoFilter(parseTodoListQuery({ scope: "DIRECT" })), true);
});

test("빈 쪽 — 1쪽이 아니면 남은 마지막 쪽(없으면 1쪽)으로, 조건은 그대로", () => {
  const q = { ...DEFAULT_TODO_LIST_QUERY, urgentOnly: true, page: 3 };
  // 3쪽의 마지막 줄을 지워 41 → 40건이 됐다(20건씩 2쪽)
  assert.equal(emptyPageHref(q, 0, 40), "/todos?urgent=1&page=2");
  assert.equal(emptyPageHref(q, 0, 0), "/todos?urgent=1");
  // 줄이 있거나 1쪽이면 그대로
  assert.equal(emptyPageHref(q, 1, 41), null);
  assert.equal(emptyPageHref({ ...q, page: 1 }, 0, 0), null);
});
