// 직원 목록 · 상세 · 퇴직 처리 · 비밀번호 재설정 링크 api. 토큰은 authHeaders() 가 로그인 세션에서 붙인다.
// 메뉴 권한 · 업무 범위 · 본사 제공 동의(가림)는 api 가 요청마다 본다 — 이 파일은 그대로 전한다.
import { ApiError, authHeaders, request } from "./api";
import { staffListApiSearch, type RetirementPreview, type StaffListQuery, type StaffMember, type StaffMemberListResponse } from "./staff-members";
import type { components } from "./api-types.generated";

type Schemas = components["schemas"];

const MAX_ID = 2_147_483_647;

const init = async (method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

/** 경로의 id. 숫자가 아니거나 1..2147483647 밖이면 null — api 에 보내면 400 이라 화면이 먼저 404 로 받는다. */
export function staffMemberIdOf(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return id <= MAX_ID ? id : null;
}

/** GET /staff-members. 0건이 확실한 조건(staffListApiSearch 가 null)이면 부르지 않는다. */
export async function getStaffMembers(query: StaffListQuery): Promise<StaffMemberListResponse> {
  const search = staffListApiSearch(query);
  if (search === null) return { items: [], total: 0 };
  return request(`/staff-members?${search}`, await init("GET"));
}

/**
 * GET /staff-members/:id(WHALEERP-599) — :id 는 목록의 staffMemberId 다. 없거나 · 업무 범위 밖 · 가린 직원은 404 라 null 이다 — 화면은 notFound().
 */
export async function getStaffMember(rawId: string): Promise<StaffMember | null> {
  const id = staffMemberIdOf(rawId);
  if (id === null) return null;
  try {
    return await request<StaffMember>(`/staff-members/${id}`, await init("GET"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// 직원 상세 요약(api #183, WHALEERP-183). 영역마다 경로가 따로라 한 영역이 실패해도 나머지는 온다. 직원 정보 관리 조회 + 그 영역
// 메뉴 조회 권한이 필요하고, 영역 권한이 없으면 그 영역만 403 「조회 권한이 없습니다.」다. 없는 직원 · 범위 밖 · 가려지는 직원은 404.

/** GET /staff-members/:id/summary/contracts — 가장 최근 계약 하나. 없으면 { contract: null }. 근로계약 관리 조회 권한 */
export async function getStaffMemberContractSummary(id: number): Promise<Schemas["StaffMemberContractSummaryResponseDto"]> {
  return request(`/staff-members/${id}/summary/contracts`, await init("GET"));
}

/**
 * GET /staff-members/:id/summary/work-schedules — 그 주(월~일)의 근무스케줄(시작 일시 순)과 주간 근무시간 합계. weekStart 는 그 주 월요일.
 * 근무스케줄 관리 조회 권한이 없으면 403 「조회 권한이 없습니다.」(영역 권한), 없는 직원 · 범위 밖은 404, 이상한 날짜는 400.
 */
export async function getStaffMemberWeekSchedule(id: number, weekStart: string): Promise<Schemas["StaffMemberWeekScheduleResponseDto"]> {
  return request(`/staff-members/${id}/summary/work-schedules?${new URLSearchParams({ weekStart })}`, await init("GET"));
}

/** GET /staff-members/:id/summary/payslips — 최근 명세서 3건(급여 기간 시작일 최신순)과 미발송 건수. 급여명세서 관리 조회 권한 */
export async function getStaffMemberPayslipSummary(id: number): Promise<Schemas["StaffMemberPayslipSummaryResponseDto"]> {
  return request(`/staff-members/${id}/summary/payslips`, await init("GET"));
}

/** GET /staff-members/:id/summary/todos — 배정된 TO-DO 의 전체 · 완료 · 미완료 건수와 최근 처리 이력. TO-DO 관리 조회 권한 */
export async function getStaffMemberTodoSummary(id: number): Promise<Schemas["StaffMemberTodoSummaryResponseDto"]> {
  return request(`/staff-members/${id}/summary/todos`, await init("GET"));
}

/** GET /staff-members/:id/retirement-preview — 퇴직일이 지나면 정리될 건수. 날짜 · 입사일 · 가입 전 · 이미 퇴직이면 400 · 409 */
export async function getRetirementPreview(id: number, retiredDate: string): Promise<RetirementPreview> {
  return request(`/staff-members/${id}/retirement-preview?${new URLSearchParams({ retiredDate })}`, await init("GET"));
}

/** POST /staff-members/:id/retirement — 퇴직일만 저장한다(퇴직 예정). 지난 날짜면 그 자리에서 정리된다. 204 */
export async function retireStaffMember(id: number, retiredDate: string): Promise<void> {
  await request(`/staff-members/${id}/retirement`, await init("POST", { retiredDate }));
}

/** PUT /staff-members/:id/retirement — 퇴직일 변경. 퇴직일 전날까지만. 204 */
export async function changeRetirementDate(id: number, retiredDate: string): Promise<void> {
  await request(`/staff-members/${id}/retirement`, await init("PUT", { retiredDate }));
}

/** DELETE /staff-members/:id/retirement — 퇴직 처리 취소. 퇴직일 전날까지만. 204 */
export async function cancelRetirement(id: number): Promise<void> {
  await request(`/staff-members/${id}/retirement`, await init("DELETE"));
}

/**
 * POST /staff-members/:id/password-reset-links(WHALEERP-177) — 직원 계정 이메일로 재설정 링크를 보낸다. 201.
 * 403 수정 권한 없음 · 사용 중이 아닌 관리자 계정 · 404 없는 직원 · 관리 범위 밖 · 409 가입 전 · 퇴직 · 탈퇴 · 429 1분 안에 다시 ·
 * 503 링크 주소 · 발송기 없음 · 발송 실패. 응답의 보낸 시각 · 기한은 지금 쓰지 않는다 — 발송 이력은 이메일 발송 로그 테이블과 함께
 * 따로 다룬다(2026-10-16 노영주).
 */
export async function issuePasswordResetLink(id: number): Promise<void> {
  await request(`/staff-members/${id}/password-reset-links`, await init("POST"));
}
