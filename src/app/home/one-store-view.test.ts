// node --test src/app/home/one-store-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminStore } from "../../lib/session.ts";
import type { StaffMemberListItem } from "../../lib/staff-members.ts";
import { latestNotices, oneStoreIdOf, oneStorePaths, oneStoreStatusCells, staffCountsOf, staffRowsOf, todoSummaryOf } from "./one-store-view.ts";

const store = (storeId: number) => ({ storeId }) as AdminStore;
const staff = (over: Partial<StaffMemberListItem>) =>
  ({ isMasked: false, joinState: "JOINED", employmentStatus: "EMPLOYED", retiredDate: null, ...over }) as StaffMemberListItem;

test("점포 하나 판정 — 범위가 점포 하나면 그 점포, 가맹 역할은 점포가 하나면 범위(전체 · 가맹)와 상관없이 그 점포", () => {
  assert.equal(oneStoreIdOf({ type: "STORE", storeId: 7 }, "BM", [store(1), store(7)]), 7);
  assert.equal(oneStoreIdOf({ type: "ALL" }, "BM", [store(1)]), null);
  assert.equal(oneStoreIdOf({ type: "ALL" }, "FA", [store(3)]), 3);
  assert.equal(oneStoreIdOf({ type: "FRANCHISE" }, "FM", [store(3)]), 3);
  assert.equal(oneStoreIdOf({ type: "FRANCHISE" }, "FA", [store(3)]), 3);
  assert.equal(oneStoreIdOf({ type: "FRANCHISE" }, "BM", [store(3)]), null);
  assert.equal(oneStoreIdOf({ type: "ALL" }, "FM", [store(3), store(4)]), null);
  assert.equal(oneStoreIdOf({ type: "DIRECT" }, "BA", [store(3)]), null);
});

test("api 경로 — TO-DO 는 그 점포 오늘 전부 · 긴급(대기 · 진행 중), 직원은 그 점포 재직 100명(임시저장 · 연결 보류 제외), 공지는 20건", () => {
  const p = oneStorePaths(5, "2026-10-27");
  const q = (path: string) => new URL(path, "http://x").searchParams;
  assert.deepEqual([q(p.todoToday).get("storeIds"), q(p.todoToday).get("dueDateFrom"), q(p.todoToday).get("dueDateTo"), q(p.todoToday).get("pageSize")], ["5", "2026-10-27", "2026-10-27", "200"]);
  assert.deepEqual(q(p.todoToday).getAll("status"), []);
  assert.deepEqual([q(p.todoUrgent).get("isUrgent"), q(p.todoUrgent).getAll("status")], ["true", ["PENDING", "IN_PROGRESS"]]);
  assert.equal(q(p.todoUrgent).get("dueDateFrom"), null);
  assert.deepEqual(q(p.inquiriesWaiting).getAll("status"), ["RECEIVED", "IN_PROGRESS"]);
  assert.deepEqual([q(p.staff).get("storeIds"), q(p.staff).get("employmentStatus"), q(p.staff).get("pageSize")], ["5", "EMPLOYED", "100"]);
  // 가입 상태 조건을 실으면 본사 역할에게 가린 줄이 api 에서 통째로 빠진다(filtersPersonal)
  assert.equal(q(p.staff).get("joinState"), null);
  assert.equal(q(p.notices).get("pageSize"), "20");
  assert.equal(p.store, "/stores/5");
});

test("TO-DO 숫자 — 완료는 줄의 묶음 상태(한 명만 끝낸 근무지 전체는 진행 중), 대기 · 진행 중은 전체 − 완료, 0건이면 막대 0%", () => {
  const items = [{ status: "DONE" }, { status: "IN_PROGRESS" }, { status: "PENDING" }, { status: "DONE" }];
  assert.deepEqual(todoSummaryOf({ items, total: 4 }, 1), { today: 4, done: 2, open: 2, urgent: 1, percent: 50, partial: false });
  assert.deepEqual(todoSummaryOf({ items: [], total: 0 }, 2), { today: 0, done: 0, open: 0, urgent: 2, percent: 0, partial: false });
  assert.equal(todoSummaryOf({ items, total: 250 }, 0).partial, true);
});

test("공지 띠 — 고정 공지가 먼저 와도 게시일 최신 3건, 같은 날이면 나중 글", () => {
  const n = (postId: number, postedDate: string) => ({ postId, postedDate });
  // api 순서: 고정(오래된 것) → 나머지 게시일 최신순
  const got = latestNotices([n(1, "2026-09-01"), n(2, "2026-08-01"), n(5, "2026-10-20"), n(4, "2026-10-20"), n(3, "2026-10-10")]);
  assert.deepEqual(got.map((p) => p.postId), [5, 4, 3]);
});

test("직원 상태 칸 — 초대 발송 · 만료 · 거절 · 소속 추가 확인 · 복귀 확인은 가입 대기, 만 19세 미만은 가입 불가, 가입은 재직 · 퇴직 예정, 가린 행은 비움", () => {
  assert.deepEqual(oneStoreStatusCells(staff({ joinState: "INVITED" })), [{ text: "가입 대기", style: "muted" }]);
  assert.deepEqual(oneStoreStatusCells(staff({ joinState: "AFFILIATION_PENDING" })), [{ text: "가입 대기", style: "muted" }]);
  assert.deepEqual(
    oneStoreStatusCells(staff({ retiredDate: "2026-11-30" })).map((c) => c.text),
    ["재직", "퇴직 예정 11-30"],
  );
  assert.deepEqual(oneStoreStatusCells(staff({ joinState: "RETURN_PENDING" })), [{ text: "가입 대기", style: "muted" }]);
  assert.deepEqual(oneStoreStatusCells(staff({ joinState: "UNDER_AGE" })), [{ text: "가입 불가(만 19세 미만)", style: "badge-off" }]);
  assert.deepEqual(oneStoreStatusCells(staff({ isMasked: true, joinState: null })), []);
  const items = [staff({}), staff({ joinState: "EXPIRED" }), staff({ joinState: "UNDER_AGE" }), staff({ isMasked: true, joinState: null })];
  assert.deepEqual(staffCountsOf({ items, total: 4 }), { employed: 1, waiting: 1, underAge: 1, masked: 1, partial: false });
  assert.equal(staffCountsOf({ items, total: 120 }).partial, true);
});

test("본사 역할 · 가맹 점포 — 가린 줄(joinState null)은 남아 「가려진 직원」으로 세고, 보이는 임시저장 · 연결 보류 줄은 뺀다", () => {
  const masked = staff({ isMasked: true, joinState: null, employmentStatus: null });
  const draft = staff({ joinState: "DRAFT" });
  const linkHold = staff({ joinState: "LINK_HOLD" });
  const items = [staff({}), masked, masked, draft, linkHold, staff({ joinState: "INVITED" })];
  assert.deepEqual(staffRowsOf(items), [items[0], masked, masked, items[5]]);
  assert.deepEqual(staffCountsOf({ items, total: 6 }), { employed: 1, waiting: 1, underAge: 0, masked: 2, partial: false });
  // 앞 100명인지는 거르기 전 받은 줄 수로 본다
  assert.equal(staffCountsOf({ items, total: 7 }).partial, true);
});
