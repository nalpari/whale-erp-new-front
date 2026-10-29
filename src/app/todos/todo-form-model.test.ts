// node --test src/app/todos/todo-form-model.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { components } from "../../lib/api-types.generated.ts";
import { fromDetail, initialForm, matchStaff, problems, staffChipText, toCreateBody, toUpdateBody, type TodoForm } from "./todo-form-model.ts";

const TODAY = "2026-10-19";
// GET /todos/assignable-staff 한 줄 — 그 근무지에 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함)
const seo = { staffMemberId: 1, name: "서지안", phoneLast4: "7702", jobTitle: "바리스타" };
const oh = { staffMemberId: 2, name: "오세라", phoneLast4: "4418", jobTitle: "" };
const form = (over: Partial<TodoForm> = {}): TodoForm => ({ ...initialForm(TODAY, "3"), title: "냉장고 정리", ...over });

test("처음 값 — 근무지 전체 · 각자 수행 · 오늘 · 긴급 아님", () => {
  const f = initialForm(TODAY);
  assert.equal(f.assigneeType, "ALL");
  assert.equal(f.executionMode, "EACH");
  assert.equal(f.dueDate, TODAY);
  assert.equal(f.isUrgent, false);
  assert.equal(f.storeId, "");
});

test("다 채우면 막는 것이 없다", () => {
  assert.deepEqual(problems(form(), TODAY), []);
  assert.deepEqual(problems(form({ assigneeType: "INDIVIDUAL", staff: [seo] }), TODAY), []);
});

test("막는 것 — 제목 · 근무지 · 직원 0명 · 날짜 · 지난 날짜 · 시간 모양 · 길이", () => {
  assert.deepEqual(problems(form({ title: "  " }), TODAY), ["제목을 입력해 주세요."]);
  assert.deepEqual(problems(form({ storeId: "" }), TODAY), ["근무지를 골라 주세요."]);
  assert.deepEqual(problems(form({ assigneeType: "INDIVIDUAL", staff: [] }), TODAY), ["직원을 한 명 이상 골라 주세요."]);
  assert.deepEqual(problems(form({ dueDate: "" }), TODAY), ["수행 예정 날짜를 입력해 주세요."]);
  assert.deepEqual(problems(form({ dueDate: "2026-10-18" }), TODAY), ["지난 날짜는 고를 수 없습니다."]);
  assert.deepEqual(problems(form({ dueTime: "25:00" }), TODAY), ["수행 시간은 HH:mm 입니다."]);
  assert.deepEqual(problems(form({ title: "가".repeat(101) }), TODAY), ["제목은 100자까지입니다."]);
  assert.deepEqual(problems(form({ body: "가".repeat(2001) }), TODAY), ["내용은 2,000자까지입니다."]);
});

test("근무지 전체면 직원을 묻지 않는다 — 고른 채로 바꿔도 보내지 않는다", () => {
  assert.deepEqual(problems(form({ assigneeType: "ALL", staff: [] }), TODAY), []);
  const body = toCreateBody(form({ assigneeType: "ALL", executionMode: "ANY_ONE", staff: [seo] }));
  assert.equal(body.staffMemberIds, undefined);
  assert.equal(body.executionMode, "ANY_ONE");
});

test("등록 본문 — 개인은 직원 id, 수행 방식은 빼고(api 가 각자 수행), 빈 내용 · 시간은 null", () => {
  assert.deepEqual(toCreateBody(form({ title: " 냉장고 정리 ", body: "  ", assigneeType: "INDIVIDUAL", staff: [seo, oh], executionMode: "ANY_ONE", dueTime: "", isUrgent: true })), {
    title: "냉장고 정리",
    body: null,
    storeId: 3,
    assigneeType: "INDIVIDUAL",
    staffMemberIds: [1, 2],
    dueDate: TODAY,
    dueTime: null,
    isUrgent: true,
  });
});

type Detail = components["schemas"]["TodoDetailDto"];
const detail: Detail = {
  assignmentGroupId: null,
  storeName: "모리커피 서초점",
  body: "선반별로 비운다",
  assigneeType: "INDIVIDUAL",
  executionMode: "EACH",
  dueDate: "2026-10-10",
  dueTime: "18:00",
  status: "PENDING",
  completedAt: null,
  performer: null,
  createdByName: null,
  todoId: 5,
  storeId: 3,
  title: "냉장고 정리",
  isUrgent: false,
  createdBy: 1,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  assignees: [{ staffMemberId: 1, staffMemberName: "서지안", isCompleted: false, completedAt: null, isMasked: false }],
  groupTodos: [],
  histories: [],
};

test("수정 — 바꾼 칸만 보낸다. 지난 수행 예정 날짜도 그대로 두면 막지 않는다", () => {
  const f = fromDetail(detail);
  assert.equal(f.storeId, "3");
  // 수정은 배정을 바꾸지 않아 고른 직원을 채우지 않는다 — 배정 글자는 상세 값으로 그린다(가린 직원은 id · 이름이 없다)
  assert.deepEqual(f.staff, []);
  assert.deepEqual(toUpdateBody(detail, f), {});
  assert.deepEqual(problems(f, TODAY, detail), []);
  assert.deepEqual(toUpdateBody(detail, { ...f, title: "냉장고 비우기", isUrgent: true }), { title: "냉장고 비우기", isUrgent: true });
  assert.deepEqual(toUpdateBody(detail, { ...f, body: "", dueTime: "" }), { body: null, dueTime: null });
});

test("수정 — 날짜를 바꾸면 지난 날짜를 막는다", () => {
  const f = { ...fromDetail(detail), dueDate: "2026-10-11" };
  assert.deepEqual(problems(f, TODAY, detail), ["지난 날짜는 고를 수 없습니다."]);
  assert.deepEqual(toUpdateBody(detail, { ...f, dueDate: "2026-10-20" }), { dueDate: "2026-10-20" });
});

test("칩 — 이름 + 직무, 직무가 없으면 번호 끝자리", () => {
  assert.equal(staffChipText(seo), "서지안 · 바리스타");
  assert.equal(staffChipText(oh), "오세라 · 4418");
  assert.equal(staffChipText({ ...oh, phoneLast4: "" }), "오세라");
});

test("직원 찾기 — 이름이나 번호 끝자리, 이미 고른 직원은 뺀다", () => {
  const pool = [seo, oh];
  assert.deepEqual(matchStaff(pool, [], ""), pool);
  assert.deepEqual(matchStaff(pool, [], "세라"), [oh]);
  assert.deepEqual(matchStaff(pool, [], "7702"), [seo]);
  assert.deepEqual(matchStaff(pool, [seo], ""), [oh]);
});
