"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { changeTodoStatus, createTodo, deleteTodo, getAssignableStaff, updateTodo } from "@/lib/todos-api";
import type { ActionFailure, ActionResult } from "../staff-members/[id]/actions";
import { type CreateTodoBody, type PickedStaff, type UpdateTodoBody } from "./todo-form-model";
import { TODO_STATUSES } from "./todo-list-query";

// TO-DO 등록 · 수정 · 상태 변경(T-1) · 삭제(T-2)와 개인 배정 직원 목록. 메뉴 권한(TO-DO 리스트 관리) · 업무 범위 · 입력은 api 가
// 다시 본다. server action 은 공개 엔드포인트라 경로에 넣는 id 와 상태 값만 다시 본다. 실패 모양은 직원 상세와 같아 useFailure 를 같이 쓴다.

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
/** 등록 결과를 모를 때의 문구. 화면이 서버 액션 호출 자체가 끊긴 경우에도 같은 문구를 쓴다 */
const CREATE_UNKNOWN = "등록 결과를 확인하지 못했습니다. 목록에서 등록됐는지 확인해 주세요.";
const NOT_FOUND: ActionFailure = { ok: false, status: 404, message: "TO-DO 를 찾을 수 없습니다." };

/** api 의 400 · 403 · 404 · 409 문장은 한국어라 그대로 보인다. 401 은 고정 문구, 5xx · 연결 실패는 결과 모름(status 없음 → 화면을 다시 받는다) */
function failureOf(error: unknown, what: string, todoId?: number): ActionFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status < 500) return { ok: false, status: error.status, message: error.message };
  }
  console.error(`TO-DO ${what} 결과 모름`, { todoId }, error);
  return { ok: false, message: `${what} 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요.` };
}

/** 처리 뒤 목록 · 상세를 새로 받는다. 무효화가 실패해도 처리는 끝났으므로 성공으로 돌려준다 */
function refresh() {
  try {
    revalidatePath("/todos", "layout");
  } catch (error) {
    console.error("TO-DO 화면 갱신 실패", error);
  }
}

/**
 * 등록. 결과 모름(5xx · 연결 끊김)이면 status 없이 「목록에서 확인」 문구를 돌려준다 — 화면은 다시 저장하게 두지 않고 목록으로 보낸다.
 * api 가 이미 만들었다면 다시 저장할 때 직원 수만큼 한 번 더 생긴다.
 */
export async function createTodoAction(body: CreateTodoBody): Promise<ActionResult> {
  try {
    await createTodo(body);
    refresh();
    return { ok: true };
  } catch (error) {
    const failure = failureOf(error, "등록");
    return failure.status === undefined ? { ...failure, message: CREATE_UNKNOWN } : failure;
  }
}

export async function updateTodoAction(id: unknown, body: UpdateTodoBody): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateTodo(id, body);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정", id);
  }
}

export async function changeTodoStatusAction(id: unknown, status: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  if (!TODO_STATUSES.includes(status as never)) return { ok: false, status: 400, message: "상태를 골라 주세요." };
  try {
    await changeTodoStatus(id, status as (typeof TODO_STATUSES)[number]);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "상태 변경", id);
  }
}

export async function deleteTodoAction(id: unknown): Promise<ActionResult<{ deleted: number; remaining: number }>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    const result = await deleteTodo(id);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "삭제", id);
  }
}

/** 개인 배정으로 고를 직원 — 그 근무지에 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함)(GET /todos/assignable-staff). 문구는 화면이 정한다 */
export async function getAssignableStaffAction(storeId: unknown): Promise<ActionResult<{ staff: PickedStaff[] }>> {
  if (!validId(storeId)) return { ok: false, status: 404, message: "근무지를 찾을 수 없습니다." };
  try {
    return { ok: true, staff: (await getAssignableStaff(storeId)).items };
  } catch (error) {
    return failureOf(error, "직원 목록 조회");
  }
}
