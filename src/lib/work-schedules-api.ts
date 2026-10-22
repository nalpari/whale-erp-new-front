// 근무스케줄 api(#196). 토큰은 authHeaders() 가 로그인 세션에서 붙인다.
// 메뉴 권한(근무스케줄 관리 /work-schedules, MN000010) · 업무 범위 · 본사 제공 동의 가림은 api 가 요청마다 본다 — 이 파일은 그대로 전한다.
import { ApiError, authHeaders, request } from "./api";
import type { components } from "./api-types.generated";

type Schemas = components["schemas"];
export type WorkScheduleList = Schemas["WorkScheduleListResponseDto"];
export type WorkScheduleHistoryList = Schemas["WorkScheduleHistoryListResponseDto"];
export type WorkSchedule = Schemas["WorkScheduleDto"];
export type ScheduleStaff = Schemas["WorkScheduleStaffItemDto"];
export type ScheduleDefaults = Schemas["WorkScheduleDefaultsDto"];
export type ScheduleFields = Schemas["UpdateWorkScheduleDto"];
export type BulkResult = Schemas["BulkCreateWorkSchedulesResponseDto"];

const get = async (): Promise<RequestInit> => ({ method: "GET", headers: await authHeaders() });
const send = async (method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

/** GET /work-schedules — 주간 · 월간(42일 이하). 점포가 업무 범위 밖이면 404 라 null — 화면은 notFound() */
export async function getWorkSchedules(search: string): Promise<WorkScheduleList | null> {
  try {
    return await request<WorkScheduleList>(`/work-schedules?${search}`, await get());
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /work-schedules/histories — 변경 이력(새것부터). 가려진 직원을 고른 필터 · 범위 밖 점포는 404 라 빈 목록 */
export async function getWorkScheduleHistories(search: string): Promise<WorkScheduleHistoryList> {
  try {
    return await request<WorkScheduleHistoryList>(`/work-schedules/histories?${search}`, await get());
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { items: [], total: 0 };
    throw error;
  }
}

/** GET /work-schedules/assignable-staff — 그 근무일에 받을 수 있는 직원(체결 완료 계약 · 가입 · 퇴직일 전, STAFF-29). 본사에게 가려진 직원은 빠진다 */
export async function getScheduleStaff(storeId: number, workDate: string): Promise<ScheduleStaff[]> {
  const res = await request<Schemas["WorkScheduleStaffResponseDto"]>(`/work-schedules/assignable-staff?${new URLSearchParams({ storeId: String(storeId), workDate })}`, await get());
  return res.items;
}

/** GET /work-schedules/defaults — 그 근무일 계약의 근무시간(STAFF-14). 계약에 근무시간이 없으면 칸이 null */
export async function getScheduleDefaults(staffMemberId: number, workDate: string): Promise<ScheduleDefaults> {
  return request(`/work-schedules/defaults?${new URLSearchParams({ staffMemberId: String(staffMemberId), workDate })}`, await get());
}

/** POST /work-schedules — 한 명 등록. 400(규칙 · 코드) · 404 · 409 WORK_SCHEDULE_OVERLAP */
export async function createSchedule(body: Schemas["CreateWorkScheduleDto"]): Promise<WorkSchedule> {
  return request("/work-schedules", await send("POST", body));
}

/** POST /work-schedules/bulk — 여러 명 일괄. 규칙에 걸린 줄만 failed 로 오고 나머지는 저장된다 */
export async function bulkCreateSchedules(body: Schemas["BulkCreateWorkSchedulesDto"]): Promise<BulkResult> {
  return request("/work-schedules/bulk", await send("POST", body));
}

/** PATCH /work-schedules/:id — 근무일 · 시각 · 휴게. 직원은 못 바꾼다 */
export async function updateSchedule(id: number, body: ScheduleFields): Promise<WorkSchedule> {
  return request(`/work-schedules/${id}`, await send("PATCH", body));
}

/** DELETE /work-schedules/:id */
export async function deleteSchedule(id: number): Promise<void> {
  await request(`/work-schedules/${id}`, await send("DELETE"));
}
