// 플랫폼 권한 관리 데이터 접근(/platform-role-groups, 메뉴 MN000214). api 는 whale-erp-api `/platform-role-groups` 다.
// 메뉴 권한(조회 · 등록 · 수정 · 삭제) · 플랫폼 계정 여부 · 본인 연결 · 고정 권한 · 본인 범위 상한은 api 가 동작마다 판정한다 —
// 화면은 api 가 준 isEditable · isDeletable · 칸별 editable 로 미리 숨기거나 흐리게만 한다.
// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";

type Schemas = components["schemas"];
export type RoleGroup = Schemas["PlatformRoleGroupSummaryResponseDto"];
export type RoleGroupDetail = Schemas["PlatformRoleGroupDetailResponseDto"];
export type RoleGroupMenuTree = Schemas["RoleGroupMenuTreeResponseDto"];
export type RoleGroupMenuNode = Schemas["RoleGroupMenuNodeResponseDto"];
export type RoleGroupMenuCells = Schemas["RoleGroupMenuCellsDto"];
export type RevocationPreview = Schemas["RoleGroupMenuRevocationPreviewResponseDto"];
export type DeletionCandidates = Schemas["RoleGroupDeletionCandidatesResponseDto"];
export type CreatedRoleGroup = Schemas["CreatePlatformRoleGroupResponseDto"];
export type CreateRoleGroupInput = Schemas["CreatePlatformRoleGroupDto"];
export type UpdateRoleGroupInput = Schemas["UpdatePlatformRoleGroupDto"];
export type DeleteRoleGroupInput = Schemas["DeletePlatformRoleGroupDto"];

const json = async (method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /platform-role-groups — 고정 권한(PM000001 · BM000001 · FM000001, `isMaster`) 다음 플랫폼 관리자(PA) 권한을 코드 순으로. 쪽 나눔이 없다. */
export async function getRoleGroups(): Promise<RoleGroup[]> {
  return (await request<Schemas["PlatformRoleGroupSummaryListResponseDto"]>("/platform-role-groups", await json("GET"))).items;
}

/** GET /platform-role-groups/{id} — 고칠 수 있는지 · 지울 수 있는지와 막힌 이유를 함께 준다. 지운 권한은 404. */
export async function getRoleGroup(id: number): Promise<RoleGroupDetail> {
  return request(`/platform-role-groups/${id}`, await json("GET"));
}

/** POST /platform-role-groups — 플랫폼 관리자(PA) 추가 권한만 만든다. 권한 코드는 api 가 PA + 6자리로 매긴다. */
export async function createRoleGroup(input: CreateRoleGroupInput): Promise<CreatedRoleGroup> {
  return request("/platform-role-groups", await json("POST", input));
}

/** PUT /platform-role-groups/{id} — 권한명 · 설명. 상세의 updatedAt 을 함께 보낸다(그 사이 고쳤으면 409). */
export async function updateRoleGroup(id: number, input: UpdateRoleGroupInput): Promise<void> {
  await request(`/platform-role-groups/${id}`, await json("PUT", input));
}

/** DELETE /platform-role-groups/{id} — 추가 권한만(논리 삭제). 연결 사용자가 있으면 대체 권한으로 옮긴 뒤 지운다. */
export async function deleteRoleGroup(id: number, input: DeleteRoleGroupInput): Promise<void> {
  await request(`/platform-role-groups/${id}`, await json("DELETE", input));
}

/** GET /platform-role-groups/{id}/deletion-candidates — 옮길 연결 사용자와 대체 권한 후보(지우지 않은 다른 추가 권한 — 고정 권한은 빠진다, api 가 고른다). */
export async function getDeletionCandidates(id: number): Promise<DeletionCandidates> {
  return request(`/platform-role-groups/${id}/deletion-candidates`, await json("GET"));
}

/** GET /platform-role-groups/{id}/menus — 사용 중 서비스별 메뉴 트리, 칸마다 현재 값 · 바꿀 수 있는지 · 막힌 이유. */
export async function getRoleGroupMenus(id: number): Promise<RoleGroupMenuTree> {
  return request(`/platform-role-groups/${id}/menus`, await json("GET"));
}

/** POST /platform-role-groups/{id}/menus/preview — 저장할 목록으로 꺼지는 칸 · 함께 빠지는 하위 권한 그룹 · 사용자 수. 쓰지 않는다. */
export async function previewRoleGroupMenus(id: number, menus: RoleGroupMenuCells[]): Promise<RevocationPreview> {
  return request(`/platform-role-groups/${id}/menus/preview`, await json("POST", { menus }));
}

/** PUT /platform-role-groups/{id}/menus — 메뉴별 네 칸 + updatedAt. 돌려받은 updatedAt 으로 다음 저장을 한다. */
export async function saveRoleGroupMenus(id: number, menus: RoleGroupMenuCells[], updatedAt: string): Promise<{ updatedAt: string }> {
  return request(`/platform-role-groups/${id}/menus`, await json("PUT", { menus, updatedAt }));
}
