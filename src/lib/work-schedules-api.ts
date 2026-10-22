// 근무스케줄 api(#196). 토큰은 authHeaders() 가 로그인 세션에서 붙인다.
// 메뉴 권한(근무스케줄 관리 /work-schedules, MN000010) · 업무 범위 · 본사 제공 동의 가림은 api 가 요청마다 본다 — 이 파일은 그대로 전한다.
import { ApiError, authHeaders, request } from "./api";
import type { components } from "./api-types.generated";

type Schemas = components["schemas"];
export type WorkScheduleList = Schemas["WorkScheduleListResponseDto"];
export type WorkScheduleHistoryList = Schemas["WorkScheduleHistoryListResponseDto"];

const get = async (): Promise<RequestInit> => ({ method: "GET", headers: await authHeaders() });

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
