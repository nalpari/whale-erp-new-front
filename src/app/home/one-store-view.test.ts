// node --test src/app/home/one-store-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminStore } from "../../lib/session.ts";
import type { StaffMemberListItem } from "../../lib/staff-members.ts";
import { oneStoreIdOf, oneStorePaths, oneStoreStatusCells, staffCountsOf, todoSummaryOf } from "./one-store-view.ts";

const store = (storeId: number) => ({ storeId }) as AdminStore;
const staff = (over: Partial<StaffMemberListItem>) =>
  ({ isMasked: false, joinState: "JOINED", employmentStatus: "EMPLOYED", retiredDate: null, ...over }) as StaffMemberListItem;

test("점포 하나 판정 — 범위가 점포 하나면 그 점포, 가맹 역할은 점포가 하나면 「전체」여도 그 점포", () => {
  assert.equal(oneStoreIdOf({ type: "STORE", storeId: 7 }, "BM", [store(1), store(7)]), 7);
  assert.equal(oneStoreIdOf({ type: "ALL" }, "BM", [store(1)]), null);
  assert.equal(oneStoreIdOf({ type: "ALL" }, "FA", [store(3)]), 3);
  assert.equal(oneStoreIdOf({ type: "ALL" }, "FM", [store(3), store(4)]), null);
  assert.equal(oneStoreIdOf({ type: "DIRECT" }, "BA", [store(3)]), null);
});

test("api 경로 — TO-DO 는 그 점포 · 오늘 · 완료 · 긴급(대기 · 진행 중), 직원은 그 점포 재직 100명", () => {
  const p = oneStorePaths(5, "2026-10-27");
  const q = (path: string) => new URL(path, "http://x").searchParams;
  assert.deepEqual([q(p.todoToday).get("storeIds"), q(p.todoToday).get("dueDateFrom"), q(p.todoToday).get("dueDateTo"), q(p.todoToday).get("pageSize")], ["5", "2026-10-27", "2026-10-27", "2"]);
  assert.deepEqual(q(p.todoTodayDone).getAll("status"), ["DONE"]);
  assert.deepEqual([q(p.todoUrgent).get("isUrgent"), q(p.todoUrgent).getAll("status")], ["true", ["PENDING", "IN_PROGRESS"]]);
  assert.equal(q(p.todoUrgent).get("dueDateFrom"), null);
  assert.deepEqual(q(p.inquiriesWaiting).getAll("status"), ["RECEIVED", "IN_PROGRESS"]);
  assert.deepEqual([q(p.staff).get("storeIds"), q(p.staff).get("employmentStatus"), q(p.staff).get("pageSize")], ["5", "EMPLOYED", "100"]);
  assert.equal(p.store, "/stores/5");
});

test("TO-DO 숫자 — 대기 · 진행 중은 오늘 전체 − 오늘 완료, 0건이면 막대 0%", () => {
  assert.deepEqual(todoSummaryOf(12, 7, 1), { today: 12, done: 7, open: 5, urgent: 1, percent: 58 });
  assert.deepEqual(todoSummaryOf(0, 0, 2), { today: 0, done: 0, open: 0, urgent: 2, percent: 0 });
});

test("직원 상태 칸 — 미가입은 가입 대기, 가입은 재직 · 퇴직 예정, 가린 행은 비움", () => {
  assert.deepEqual(oneStoreStatusCells(staff({ joinState: "INVITED" })), [{ text: "가입 대기", style: "muted" }]);
  assert.deepEqual(oneStoreStatusCells(staff({ joinState: "AFFILIATION_PENDING" })), [{ text: "가입 대기", style: "muted" }]);
  assert.deepEqual(
    oneStoreStatusCells(staff({ retiredDate: "2026-11-30" })).map((c) => c.text),
    ["재직", "퇴직 예정 11-30"],
  );
  assert.deepEqual(oneStoreStatusCells(staff({ isMasked: true, joinState: null })), []);
  assert.deepEqual(staffCountsOf([staff({}), staff({ joinState: "EXPIRED" }), staff({ isMasked: true, joinState: null })]), { employed: 1, waiting: 1, masked: 1 });
});
