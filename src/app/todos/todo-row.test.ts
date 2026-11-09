// node --test src/app/todos/todo-row.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { components } from "../../lib/api-types.generated.ts";
import { assigneeText, deletePreview, doneCountText, dueFullText, dueText, historyActorText, historyText, MASKED_STAFF, overallOf, staffNameText, statusCells, targetText } from "./todo-row.ts";

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

test("목록 수행 예정 — 늘 연도까지, 시간은 뒤에", () => {
  assert.equal(dueFullText("2026-11-09", null), "2026-11-09");
  assert.equal(dueFullText("2026-11-09", "10:00"), "2026-11-09 10:00");
});

test("상태 — 대기 회색 · 진행 중 파랑 · 완료 흐림, 그룹은 완료 건수를 붙인다", () => {
  assert.deepEqual(statusCells(item(), LABELS), [{ text: "대기", style: "badge-neutral" }]);
  assert.deepEqual(statusCells(item({ status: "IN_PROGRESS", todoCount: 5, doneCount: 2 }), LABELS), [{ text: "진행 중", style: "badge-on" }]);
  assert.equal(doneCountText(item({ todoCount: 5, doneCount: 2 })), "2 / 5명");
  assert.equal(doneCountText(item({ todoCount: 1, doneCount: 0 })), "0 / 1명");
  assert.deepEqual(statusCells(item({ status: "DONE" }), LABELS), [{ text: "완료", style: "muted" }]);
});

test("완료 / 배정 직원 — 한 명 수행은 행 하나에 붙은 대상 전원을 배정 직원으로 센다", () => {
  const all = [person(1, "서지안"), person(2, "오세라"), person(3, "권도윤")];
  assert.equal(doneCountText(item({ assigneeType: "ALL", executionMode: "ANY_ONE", todoCount: 1, doneCount: 0, assignees: all })), "0 / 3명");
  assert.equal(doneCountText(item({ assigneeType: "ALL", executionMode: "ANY_ONE", todoCount: 1, doneCount: 1, assignees: all })), "1 / 3명");
  // 각자 수행은 직원마다 행
  assert.equal(doneCountText(item({ assigneeType: "ALL", executionMode: "EACH", todoCount: 3, doneCount: 1, assignees: all })), "1 / 3명");
});

test("상세 머리 줄 전체 값 — 묶음은 모두 완료면 완료 · 모두 대기면 대기 · 그 밖은 진행 중, 완료 인원은 목록과 같다", () => {
  const group = (statuses: ("PENDING" | "IN_PROGRESS" | "DONE")[]) => ({
    status: statuses[0],
    assigneeType: "ALL" as const,
    executionMode: "EACH" as const,
    assignees: [],
    groupTodos: statuses.map((status, i) => ({ todoId: i + 1, status }) as Detail["groupTodos"][number]),
  });
  assert.deepEqual(overallOf(group(["IN_PROGRESS", "DONE", "PENDING"])), { status: "IN_PROGRESS", count: "1 / 3명" });
  assert.deepEqual(overallOf(group(["DONE", "DONE"])), { status: "DONE", count: "2 / 2명" });
  assert.deepEqual(overallOf(group(["PENDING", "PENDING"])), { status: "PENDING", count: "0 / 2명" });
  // 한 명 수행 — 행 하나에 대상 전원
  const all = [person(1, "서지안"), person(2, "오세라"), person(3, "권도윤")];
  assert.deepEqual(overallOf({ status: "DONE", assigneeType: "ALL", executionMode: "ANY_ONE", assignees: all.map((a) => ({ ...a, completedAt: null, isCompleted: false })), groupTodos: [] }), { status: "DONE", count: "1 / 3명" });
});

test("담당직원 — 개인은 「개인 · 이름」(여러 명이면 「외 N명」), 근무지 전체는 수행 방식", () => {
  assert.equal(targetText(item()), "개인 · 서지안");
  assert.equal(targetText(item({ assignees: [person(1, "서지안"), person(2, "오세라")] })), "개인 · 서지안 외 1명");
  assert.equal(targetText(item({ assignees: [masked] })), `개인 · ${MASKED_STAFF}`);
  assert.equal(targetText(item({ assignees: [] })), "개인 · -");
  assert.equal(targetText(item({ assigneeType: "ALL", executionMode: "EACH" })), "전체 · 각자 수행");
  assert.equal(targetText(item({ assigneeType: "ALL", executionMode: "ANY_ONE" })), "전체 · 한 명만 수행");
});

test("상태 — 한 명 수행을 완료해도 상태 하나만(수행자 이름은 상세에서)", () => {
  assert.deepEqual(statusCells(item({ assigneeType: "ALL", executionMode: "ANY_ONE", status: "DONE", performer: person(9, "문태경") }), LABELS), [{ text: "완료", style: "muted" }]);
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

test("가린 직원 — 급여명세서와 같은 짧은 「본사에 정보제공 미동의」", () => {
  assert.equal(MASKED_STAFF, "본사에 정보제공 미동의");
  assert.equal(staffNameText(masked), MASKED_STAFF);
  assert.equal(staffNameText(person(1, "서지안")), "서지안");
  // 담당 · 완료 수행자
  assert.equal(assigneeText(item({ assignees: [masked] })), MASKED_STAFF);
  assert.equal(assigneeText(item({ assignees: [masked, person(2, "오세라")] })), "본사에 정보제공 미동의 외 1명");
});

test("상태 이력 — 가린 직원은 바꾼 사람 · 배정 풀림 모두 가린 문구", () => {
  assert.equal(historyText(history({ fromStatus: "PENDING", toStatus: "PENDING", isUnassignedStaffMemberMasked: true }), LABELS), "배정 풀림 · 본사에 정보제공 미동의(퇴직)");
  assert.equal(historyActorText(history({ isStaffMemberMasked: true })), MASKED_STAFF);
  assert.equal(historyActorText(history({ staffMemberName: "서지안" })), "서지안");
  assert.equal(historyActorText(history({ changedByName: "김점장" })), "김점장");
  assert.equal(historyActorText(history()), "-");
});
