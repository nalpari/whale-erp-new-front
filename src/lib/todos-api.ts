// TO-DO api(#109). 토큰은 authHeaders() 가 로그인 세션에서 붙인다.
// 메뉴 권한(TO-DO 리스트 관리 MN000026) · 업무 범위는 api 가 요청마다 본다 — 이 파일은 그대로 전한다.
import { ApiError, authHeaders, request } from "./api";
import type { components } from "./api-types.generated";
import { staffMemberIdOf } from "./staff-members-api";

type Schemas = components["schemas"];
export type TodoListResponse = Schemas["TodoListResponseDto"];
export type TodoDetail = Schemas["TodoDetailDto"];
export type TodoItemList = Schemas["TodoItemListResponseDto"];

const init = async (method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

/** 경로의 id. 1..2147483647 정수가 아니면 null — 직원 id 와 같은 규칙이다 */
export const todoIdOf = staffMemberIdOf;

/** GET /todos. search 는 todoListApiSearch 가 만든 쿼리다 — null(0건이 확실한 조건)이면 부르지 않는다 */
export async function getTodos(search: string | null): Promise<TodoListResponse> {
  if (search === null) return { items: [], total: 0 };
  return request(`/todos?${search}`, await init("GET"));
}

/** GET /todos/:todoId. 없거나 · 지웠거나 · 업무 범위 밖이면 404 라 null — 화면은 notFound() */
export async function getTodo(rawId: string): Promise<TodoDetail | null> {
  const id = todoIdOf(rawId);
  if (id === null) return null;
  try {
    return await request<TodoDetail>(`/todos/${id}`, await init("GET"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** POST /todos — 배정을 펼쳐 행을 만든다. 201 */
export async function createTodo(body: Schemas["CreateTodoDto"]): Promise<Schemas["CreatedTodoResponseDto"]> {
  return request("/todos", await init("POST", body));
}

/** PATCH /todos/:todoId — 제목 · 내용 · 수행 예정 일시 · 긴급. 그룹이면 그룹 전체 */
export async function updateTodo(id: number, body: Schemas["UpdateTodoDto"]): Promise<void> {
  await request(`/todos/${id}`, await init("PATCH", body));
}

/** PATCH /todos/:todoId/status — 관리자가 직원 대신 상태를 바꾼다(T-1). 그룹이면 이 행만. 409 TODO_ALREADY_DONE · TODO_STATUS_CONFLICT */
export async function changeTodoStatus(id: number, status: Schemas["TodoStatus"]): Promise<void> {
  await request(`/todos/${id}/status`, await init("PATCH", { status }));
}

/** DELETE /todos/:todoId — 대기만. 그룹이면 대기인 행만 지우고 건수를 돌려준다(T-2). 지울 것이 없으면 409 */
export async function deleteTodo(id: number): Promise<Schemas["TodoDeleteResponseDto"]> {
  return request(`/todos/${id}`, await init("DELETE"));
}

/** GET /staff-members/:id/todos — 직원 상세의 TO-DO 영역. 정렬은 api 순서(미완료 긴급 → 미완료 → 완료) */
export async function getStaffMemberTodos(staffMemberId: number, pageSize: number): Promise<TodoItemList> {
  return request(`/staff-members/${staffMemberId}/todos?${new URLSearchParams({ page: "1", pageSize: String(pageSize) })}`, await init("GET"));
}

/**
 * GET /todos/assignable-staff — 개인 배정으로 고를 직원. 그 근무지에 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함), 이름순.
 * 등록 권한(MN000026 create)으로 열리고 범위 밖 근무지는 404. 본사 제공 동의로 가리지 않는다.
 */
export async function getAssignableStaff(storeId: number): Promise<Schemas["AssignableStaffResponseDto"]> {
  return request(`/todos/assignable-staff?${new URLSearchParams({ storeId: String(storeId) })}`, await init("GET"));
}
