// 플랫폼 관리자 계정 데이터 접근(/platform-admins). api 는 whale-erp-api `/platform-admins` 다.
// 메뉴 권한(조회 · 등록 · 수정 · 삭제)과 마스터 보호 · 본인 보호는 api 가 동작마다 판정한다 — 화면은 미리 숨기거나 흐리게만 한다.
// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import { ADMIN_PAGE_SIZE, HISTORY_PAGE_SIZE } from "./platform-admin-paging";

type Schemas = components["schemas"];
export type PlatformAdmin = Schemas["PlatformAdminSummaryResponseDto"];
export type PlatformAdminList = Schemas["PlatformAdminListResponseDto"];
export type PlatformAdminDetail = Schemas["PlatformAdminDetailResponseDto"];
export type PlatformAdminHistory = Schemas["PlatformAdminHistoryResponseDto"];
export type PlatformAdminHistoryList = Schemas["PlatformAdminHistoryListResponseDto"];
export type PlatformRoleGroup = Schemas["PlatformRoleGroupResponseDto"];
export type CreatePlatformAdminInput = Schemas["CreatePlatformAdminDto"];
export type UpdatePlatformAdminInput = Schemas["UpdatePlatformAdminDto"];
export type CreatePlatformAdminResult = Schemas["CreatePlatformAdminResponseDto"];
export type ResetPasswordResult = Schemas["ResetPasswordResponseDto"];
export type AdminStatus = PlatformAdmin["accountStatus"];

export type PlatformAdminQuery = {
  page?: number;
  /** 아이디 · 이름 포함 검색 */
  keyword?: string;
  roleGroupId?: number;
  /** 주지 않으면 사용 · 미사용 둘 다 */
  statuses?: AdminStatus[];
};

const json = async (method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /platform-admins — 지우지 않은 플랫폼 마스터 · 플랫폼 관리자, 등록일시 최신순. */
export async function getPlatformAdmins({ page = 1, keyword, roleGroupId, statuses }: PlatformAdminQuery = {}): Promise<PlatformAdminList> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(ADMIN_PAGE_SIZE) });
  if (keyword) params.set("keyword", keyword);
  if (roleGroupId) params.set("roleGroupId", String(roleGroupId));
  if (statuses?.length) params.set("statuses", statuses.join(","));
  return request(`/platform-admins?${params}`, await json("GET"));
}

/** GET /platform-admins/role-groups — 사용자 권한 선택지. 플랫폼 관리자에게는 플랫폼 마스터 권한을 빼고 준다. */
export async function getPlatformRoleGroups(): Promise<PlatformRoleGroup[]> {
  return (await request<Schemas["PlatformRoleGroupListResponseDto"]>("/platform-admins/role-groups", await json("GET"))).items;
}

/** GET /platform-admins/{id} — 지운 계정은 404. */
export async function getPlatformAdmin(id: number): Promise<PlatformAdminDetail> {
  return request(`/platform-admins/${id}`, await json("GET"));
}

/** GET /platform-admins/{id}/histories — 생성 · 변경 이력, 최신순. */
export async function getPlatformAdminHistories(id: number, page = 1): Promise<PlatformAdminHistoryList> {
  return request(`/platform-admins/${id}/histories?page=${page}&pageSize=${HISTORY_PAGE_SIZE}`, await json("GET"));
}

/** GET /platform-admins/login-id-availability — 삭제한 계정의 아이디도 쓸 수 없다. 등록 권한이 필요하다. */
export async function checkLoginIdAvailable(loginId: string): Promise<boolean> {
  const params = new URLSearchParams({ loginId });
  return (await request<Schemas["LoginIdAvailabilityResponseDto"]>(`/platform-admins/login-id-availability?${params}`, await json("GET"))).available;
}

/** POST /platform-admins — 늘 사용으로 만들고 초기 비밀번호를 메일로만 보낸다. 메일이 실패해도 계정은 만들어진다. */
export async function createPlatformAdmin(input: CreatePlatformAdminInput): Promise<CreatePlatformAdminResult> {
  return request("/platform-admins", await json("POST", input));
}

/** PUT /platform-admins/{id} — 상세에서 받은 updatedAt 을 함께 보낸다. 그 사이 다른 사람이 고쳤으면 409. */
export async function updatePlatformAdmin(id: number, input: UpdatePlatformAdminInput): Promise<void> {
  await request(`/platform-admins/${id}`, await json("PUT", input));
}

/** DELETE /platform-admins/{id} — 논리 삭제. 되살리지 않는다. */
export async function deletePlatformAdmin(id: number): Promise<void> {
  await request(`/platform-admins/${id}`, await json("DELETE"));
}

/** POST /platform-admins/{id}/password-reset — 새 초기 비밀번호를 그 계정 이메일로만 보낸다. */
export async function resetPlatformAdminPassword(id: number): Promise<ResetPasswordResult> {
  return request(`/platform-admins/${id}/password-reset`, await json("POST"));
}
