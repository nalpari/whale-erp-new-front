// 출·퇴근 현황 api(WHALEERP-217). 토큰은 authHeaders() 가 로그인 세션에서 붙인다.
// 메뉴 권한(출·퇴근 현황 조회 /attendance-records, MN000025) · 업무 범위 · 본사 제공 동의 가림은 api 가 요청마다 본다 — 이 파일은 그대로 전한다.
// 점포 조건(storeIds · storeTypes)은 화면이 만들어 넘긴다. 업무 범위 밖 점포는 api 가 빼고 오류를 내지 않는다.
import { authHeaders, request } from "./api";
import type { components } from "./api-types.generated";

type Schemas = components["schemas"];
export type DailyAttendance = Schemas["DailyAttendanceResponseDto"];
export type PeriodAttendance = Schemas["PeriodAttendanceResponseDto"];

const get = async (): Promise<RequestInit> => ({ method: "GET", headers: await authHeaders() });

/** GET /attendance-records/daily — 점포 조건 안 하루 */
export async function getDailyAttendance(stores: URLSearchParams, date: string): Promise<DailyAttendance> {
  const params = new URLSearchParams(stores);
  params.set("date", date);
  return request<DailyAttendance>(`/attendance-records/daily?${params}`, await get());
}

/** GET /attendance-records — 점포 조건 안 기간(92일 이하)의 직원 · 날 줄 */
export async function getPeriodAttendance(stores: URLSearchParams, from: string, to: string): Promise<PeriodAttendance> {
  const params = new URLSearchParams(stores);
  params.set("from", from);
  params.set("to", to);
  return request<PeriodAttendance>(`/attendance-records?${params}`, await get());
}

export type AttendanceEditResult = Schemas["AttendanceEditResultDto"];
export type AttendanceHistory = Schemas["AttendanceHistoryResponseDto"];
export type ProxyStaff = Schemas["ProxyStaffItemDto"];
export type CorrectAttendance = Schemas["CorrectAttendanceDto"];
export type ProxyAttendance = Schemas["ProxyAttendanceDto"];

const send = async (body?: unknown): Promise<RequestInit> => ({
  method: "POST",
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

/** POST /attendance-records/:id/correction — 짝의 출근 · 퇴근 보정(WHALEERP-218). 409 ATTENDANCE_CHANGED 는 그사이 다른 관리자가 고침 */
export async function correctAttendance(recordId: number, body: CorrectAttendance): Promise<AttendanceEditResult> {
  return request(`/attendance-records/${recordId}/correction`, await send(body));
}

/** POST /attendance-records/:id/review — 「이상 없음」(ATT-19) */
export async function reviewAttendance(recordId: number): Promise<AttendanceEditResult> {
  return request(`/attendance-records/${recordId}/review`, await send());
}

/** POST /attendance-records/proxy — 출퇴근 대신 등록(ATT-20 · 26) */
export async function proxyAttendance(body: ProxyAttendance): Promise<AttendanceEditResult> {
  return request("/attendance-records/proxy", await send(body));
}

/** GET /attendance-records/proxy-staff — 그날 대신 등록할 수 있는 직원 */
export async function getProxyStaff(stores: URLSearchParams, date: string): Promise<ProxyStaff[]> {
  const params = new URLSearchParams(stores);
  params.set("date", date);
  return (await request<Schemas["ProxyStaffResponseDto"]>(`/attendance-records/proxy-staff?${params}`, await get())).items;
}

/** GET /attendance-records/:id/history — 보정 이력과 대신 등록 */
export async function getAttendanceHistory(recordId: number): Promise<AttendanceHistory> {
  return request(`/attendance-records/${recordId}/history`, await get());
}
