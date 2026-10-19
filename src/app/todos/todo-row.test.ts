// node --test src/app/todos/todo-row.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { components } from "../../lib/api-types.generated.ts";
import { assigneeText, deletePreview, deleteResultMessage, dueText, historyActorText, historyText, MASKED_STAFF, staffNameText, statusCells } from "./todo-row.ts";

type Item = components["schemas"]["TodoListItemDto"];
type Detail = components["schemas"]["TodoDetailDto"];
type History = components["schemas"]["TodoStatusHistoryDto"];

const LABELS = [
  { value: "PENDING", label: "대기", order: 1 },
  { value: "IN_PROGRESS", label: "진행 중", order: 2 },
  { value: "DONE", label: "완료", order: 3 },
];
const person = (staffMemberId: number, staffMemberName: string) => ({ staffMemberId, staffMemberName, isMasked: false });
// 본사 역할 + 가맹 점포 + 본사 제공 동의 안 함 — api 가 id · 이름을 비운다
const masked = { staffMemberId: null, staffMemberName: null, isMasked: true };
const item = (over: Partial<Item> = {}): Item => ({
  assigneeType: "INDIVIDUAL",
  executionMode: "EACH",
  dueDate: "2026-10-20",
  dueTime: null,
  status: "PENDING",
  performer: null,
  todoId: 1,
  assignmentGroupId: null,
  storeId: 1,
  storeName: "모리커피 서초점",
  title: "신규 원두 시음 기록 제출",
  isUrgent: false,
  todoCount: 1,
  doneCount: 0,
  assignees: [person(1, "서지안")],
  createdAt: "2026-10-19T00:00:00Z",
  ...over,
});

test("담당 — 근무지 전체는 수행 방식으로, 개인은 이름", () => {
  assert.equal(assigneeText(item({ assigneeType: "ALL", executionMode: "EACH" })), "전체 · 각자");
  assert.equal(assigneeText(item({ assigneeType: "ALL", executionMode: "ANY_ONE" })), "전체 · 한 명");
  assert.equal(assigneeText(item()), "서지안");
  assert.equal(assigneeText(item({ assignees: [person(1, "서지안"), person(2, "오세라"), person(3, "권도윤")] })), "서지안 외 2명");
  // 퇴직으로 배정이 모두 풀린 줄
  assert.equal(assigneeText(item({ assignees: [] })), "-");
});

test("수행 예정 — 올해면 MM-DD, 시간이 있으면 붙이고, 다른 해면 연도까지", () => {
  assert.equal(dueText("2026-10-20", null, "2026-10-19"), "10-20");
  assert.equal(dueText("2026-10-20", "18:00", "2026-10-19"), "10-20 18:00");
  assert.equal(dueText("2027-01-05", "09:30", "2026-12-30"), "2027-01-05 09:30");
});

test("상태 — 대기 회색 · 진행 중 파랑 · 완료 흐림, 그룹은 완료 건수를 붙인다", () => {
  assert.deepEqual(statusCells(item(), LABELS), [{ text: "대기", style: "badge-neutral" }]);
  assert.deepEqual(statusCells(item({ status: "IN_PROGRESS", todoCount: 5, doneCount: 2 }), LABELS), [{ text: "진행 중 · 2/5", style: "badge-on" }]);
  assert.deepEqual(statusCells(item({ status: "DONE" }), LABELS), [{ text: "완료", style: "muted" }]);
});

test("상태 — 한 명 수행을 완료하면 수행자 이름을 옆에", () => {
  assert.deepEqual(statusCells(item({ assigneeType: "ALL", executionMode: "ANY_ONE", status: "DONE", performer: person(9, "문태경") }), LABELS), [
    { text: "완료", style: "muted" },
    { text: "문태경", style: "muted" },
  ]);
});

const detail = (over: Partial<Detail> = {}): Detail => ({
  assignmentGroupId: null,
  storeName: "모리커피 서초점",
  body: null,
  assigneeType: "INDIVIDUAL",
  executionMode: "EACH",
  dueDate: "2026-10-20",
  dueTime: null,
  status: "PENDING",
  completedAt: null,
  performer: null,
  createdByName: "김점장",
  todoId: 1,
  storeId: 1,
  title: "냉장고 정리",
  isUrgent: false,
  createdBy: 1,
  createdAt: "2026-10-19T00:00:00Z",
  updatedAt: "2026-10-19T00:00:00Z",
  assignees: [],
  groupTodos: [],
  histories: [],
  ...over,
});
const row = (todoId: number, status: Detail["status"]) => ({ todoId, status, staffMemberId: todoId, staffMemberName: `직원${todoId}`, completedAt: null, isMasked: false });

test("삭제 미리 보기 — 그룹은 대기 행만 지우고 나머지는 남는다(T-2)", () => {
  assert.deepEqual(deletePreview(detail()), { pending: 1, remaining: 0 });
  assert.deepEqual(deletePreview(detail({ status: "IN_PROGRESS" })), { pending: 0, remaining: 1 });
  assert.deepEqual(
    deletePreview(detail({ assignmentGroupId: 1, groupTodos: [row(1, "PENDING"), row(2, "PENDING"), row(3, "IN_PROGRESS"), row(4, "DONE")] })),
    { pending: 2, remaining: 2 },
  );
});

test("삭제 결과 문구 — 남은 건이 있으면 함께 알린다", () => {
  assert.equal(deleteResultMessage({ deleted: 1, remaining: 0 }), "삭제되었습니다.");
  assert.equal(deleteResultMessage({ deleted: 3, remaining: 2 }), "대기 3건을 삭제했습니다. 진행 중 · 완료 2건은 남았습니다.");
});

const history = (over: Partial<History> = {}): History => ({
  fromStatus: "PENDING",
  toStatus: "IN_PROGRESS",
  changedBy: null,
  changedByName: null,
  staffMemberId: null,
  staffMemberName: null,
  unassignedStaffMemberId: null,
  unassignedStaffMemberName: null,
  isUrgentChanged: false,
  isStaffMemberMasked: false,
  isUnassignedStaffMemberMasked: false,
  changedAt: "2026-10-19T00:00:00Z",
  ...over,
});

test("상태 이력 한 줄 — 등록 · 상태 변경 · 긴급 변경 · 배정 풀림", () => {
  assert.equal(historyText(history({ fromStatus: null, toStatus: "PENDING" }), LABELS), "등록 · 대기");
  assert.equal(historyText(history(), LABELS), "대기 → 진행 중");
  assert.equal(historyText(history({ fromStatus: "DONE", toStatus: "DONE", isUrgentChanged: true }), LABELS), "긴급 표시 변경");
  assert.equal(historyText(history({ fromStatus: "PENDING", toStatus: "PENDING", unassignedStaffMemberName: "오세라" }), LABELS), "배정 풀림 · 오세라(퇴직)");
});

test("가린 직원 — 직원 목록과 같은 「본사 제공 동의 없음」", () => {
  assert.equal(MASKED_STAFF, "본사 제공 동의 없음");
  assert.equal(staffNameText(masked), MASKED_STAFF);
  assert.equal(staffNameText(person(1, "서지안")), "서지안");
  // 담당 · 완료 수행자
  assert.equal(assigneeText(item({ assignees: [masked] })), MASKED_STAFF);
  assert.equal(assigneeText(item({ assignees: [masked, person(2, "오세라")] })), "본사 제공 동의 없음 외 1명");
  assert.deepEqual(statusCells(item({ assigneeType: "ALL", executionMode: "ANY_ONE", status: "DONE", performer: masked }), LABELS)[1], { text: MASKED_STAFF, style: "muted" });
});

test("상태 이력 — 가린 직원은 바꾼 사람 · 배정 풀림 모두 가린 문구", () => {
  assert.equal(historyText(history({ fromStatus: "PENDING", toStatus: "PENDING", isUnassignedStaffMemberMasked: true }), LABELS), "배정 풀림 · 본사 제공 동의 없음(퇴직)");
  assert.equal(historyActorText(history({ isStaffMemberMasked: true })), MASKED_STAFF);
  assert.equal(historyActorText(history({ staffMemberName: "서지안" })), "서지안");
  assert.equal(historyActorText(history({ changedByName: "김점장" })), "김점장");
  assert.equal(historyActorText(history()), "-");
});
