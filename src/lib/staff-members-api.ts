// 직원 목록 · 상세 · 퇴직 처리 api. 토큰은 authHeaders() 가 로그인 세션에서 붙인다.
// 메뉴 권한 · 업무 범위 · 본사 제공 동의(가림)는 api 가 요청마다 본다 — 이 파일은 그대로 전한다.
import { ApiError, authHeaders, request } from "./api";
import { staffListApiSearch, type RetirementPreview, type StaffListQuery, type StaffMember, type StaffMemberListResponse } from "./staff-members";

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
 * GET /staff-members/:id(WHALEERP-599). 없거나 · 업무 범위 밖 · 가린 직원은 404 라 null 이다 — 화면은 notFound().
 * TODO(599): :id 가 무엇을 가리키는지 599 설계가 확정되면 맞춘다. 지금은 목록의 staffMemberId 다.
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
