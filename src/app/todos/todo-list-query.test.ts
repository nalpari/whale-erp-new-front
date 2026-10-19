// node --test src/app/todos/todo-list-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_TODO_LIST_QUERY, emptyPageHref, hasTodoFilter, parseTodoListQuery, todoListApiSearch, todoListHref, toTodoListSearch, withFilter } from "./todo-list-query.ts";

test("빈 URL 은 기본값 — 근무지 전체, 상태 셋 다, 담당 전체, 1쪽, 20건", () => {
  assert.deepEqual(parseTodoListQuery({}), DEFAULT_TODO_LIST_QUERY);
  assert.deepEqual(DEFAULT_TODO_LIST_QUERY.statuses, ["PENDING", "IN_PROGRESS", "DONE"]);
  assert.equal(toTodoListSearch(DEFAULT_TODO_LIST_QUERY), "");
});

test("parse(toSearch(q)) 는 q", () => {
  const q = {
    ...DEFAULT_TODO_LIST_QUERY,
    storeId: 3,
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
  const q = parseTodoListQuery({ storeId: "abc", assigneeType: "X", urgent: "maybe", dueDateFrom: "2026-02-30", dueDateTo: "10/31", page: "0", pageSize: "7" });
  assert.equal(q.storeId, null);
  assert.equal(q.assigneeType, "");
  assert.equal(q.urgentOnly, false);
  assert.equal(q.dueDateFrom, "");
  assert.equal(q.dueDateTo, "");
  assert.equal(q.page, 1);
  assert.equal(q.pageSize, 20);
  assert.equal(parseTodoListQuery({ storeId: "2147483648" }).storeId, null);
  assert.equal(parseTodoListQuery({ page: "1000001" }).page, 1);
});

test("api 쿼리 — 상태는 같은 이름을 되풀이하고, 셋 다면 뺀다", () => {
  assert.equal(todoListApiSearch(DEFAULT_TODO_LIST_QUERY), "page=1&pageSize=20");
  const params = new URLSearchParams(
    todoListApiSearch({ ...DEFAULT_TODO_LIST_QUERY, storeId: 7, statuses: ["PENDING", "IN_PROGRESS"], assigneeType: "INDIVIDUAL", urgentOnly: true, dueDateFrom: "2026-10-01", page: 3 }) ?? "",
  );
  assert.deepEqual(params.getAll("status"), ["PENDING", "IN_PROGRESS"]);
  assert.equal(params.get("storeId"), "7");
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

test("상세의 「목록」은 들고 온 조건을 거른 뒤 돌려준다", () => {
  assert.equal(todoListHref({}), "/todos");
  assert.equal(todoListHref({ urgent: "1", page: "2", next: "//evil.example" }), "/todos?urgent=1&page=2");
});

test("거르는 조건이 있는가 — 쪽 · 건수는 조건이 아니다", () => {
  assert.equal(hasTodoFilter(DEFAULT_TODO_LIST_QUERY), false);
  assert.equal(hasTodoFilter({ ...DEFAULT_TODO_LIST_QUERY, page: 3, pageSize: 50 }), false);
  assert.equal(hasTodoFilter({ ...DEFAULT_TODO_LIST_QUERY, urgentOnly: true }), true);
  assert.equal(hasTodoFilter({ ...DEFAULT_TODO_LIST_QUERY, statuses: ["DONE"] }), true);
  assert.equal(hasTodoFilter({ ...DEFAULT_TODO_LIST_QUERY, dueDateTo: "2026-10-31" }), true);
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
