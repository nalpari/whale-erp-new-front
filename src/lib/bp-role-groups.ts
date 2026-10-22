// BP 권한 그룹 관리 데이터 접근(/bp-role-groups, 메뉴 MN000013). api 는 whale-erp-api `/bp-role-groups` 다.
// 메뉴 권한 · 역할(BP 마스터는 BA 그룹, 가맹 마스터는 본인 FA 그룹) · 본인 연결 · 기준 고정 권한(BM000001 · FM000001) · 본인 범위 상한은
// api 가 동작마다 판정한다 — 화면은 api 가 준 creatableRoleTypeCode · isEditable · 칸별 editable 로 미리 숨기거나 흐리게만 한다.
// 모든 요청에 이 탭의 BP 를 X-Bp-Code-Id 헤더로 싣는다(화면 주소 /bp/{id}, authHeaders) — 플랫폼 사용자는 고른 BP 를 조회만 하고,
// BP 쪽 사용자는 자기 BP 다(다른 BP 면 api 가 403).
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import type { DeletionCandidates, RevocationPreview, RoleGroupMenuCells } from "./platform-role-groups";

// 요청 · 응답 모양은 api openapi 에서 생성한 타입(pnpm openapi:types)이다. 목록 · 상세 · 메뉴 트리만 BP 전용 DTO 이고,
// 등록 · 수정 · 삭제 · 메뉴 저장 본문과 메뉴 칸 · 미리보기 · 삭제 후보는 플랫폼 권한과 같은 DTO 다.
type Schemas = components["schemas"];
export type BpRoleGroup = Schemas["BpRoleGroupSummaryResponseDto"];
export type BpRoleGroupList = Schemas["BpRoleGroupListResponseDto"];
export type BpRoleGroupDetail = Schemas["BpRoleGroupDetailResponseDto"];
export type BpRoleType = BpRoleGroup["roleTypeCode"];
export type BpRoleGroupMenuTree = Schemas["BpRoleGroupMenuTreeResponseDto"];
export type BpRoleGroupInput = Schemas["CreatePlatformRoleGroupDto"];
export type UpdateBpRoleGroupInput = Schemas["UpdatePlatformRoleGroupDto"];
export type CreatedBpRoleGroup = Schemas["CreatePlatformRoleGroupResponseDto"];
export type DeleteBpRoleGroupInput = Schemas["DeletePlatformRoleGroupDto"];

/** 목록 쪽 크기 — api 기본값과 같다 */
export const BP_ROLE_PAGE_SIZE = 20;

const json = async (method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});
// 탭 BP 는 쿼리가 아니라 헤더(X-Bp-Code-Id)로 간다 — authHeaders() 가 proxy 가 /bp/{id} 주소에서 넣은 값을 싣는다.
const at = (path: string, query?: Record<string, string>) => `/bp-role-groups${path}${query ? `?${new URLSearchParams(query)}` : ""}`;

/** GET /bp-role-groups — 보이는 BA · FA 그룹을 권한 코드순으로(고정 권한 · 지운 그룹은 없다). */
export async function getBpRoleGroups(page: number): Promise<BpRoleGroupList> {
  return request(at("", { page: String(page), pageSize: String(BP_ROLE_PAGE_SIZE) }), await json("GET"));
}

/** GET /bp-role-groups/{id} — 볼 수 없거나 지운 그룹은 404. */
export async function getBpRoleGroup(id: number): Promise<BpRoleGroupDetail> {
  return request(at(`/${id}`), await json("GET"));
}

/** POST /bp-role-groups — 유형은 등록자로 정해진다(BP 마스터 BA, 가맹 마스터 FA · 관리계정 = 본인). */
export async function createBpRoleGroup(input: BpRoleGroupInput): Promise<CreatedBpRoleGroup> {
  return request(at(""), await json("POST", input));
}

/** PUT /bp-role-groups/{id} — 권한명 · 설명 + updatedAt(그 사이 고쳤으면 409). */
export async function updateBpRoleGroup(id: number, input: UpdateBpRoleGroupInput): Promise<void> {
  await request(at(`/${id}`), await json("PUT", input));
}

/** DELETE /bp-role-groups/{id} — 논리 삭제. 연결 사용자가 있으면 대체 그룹으로 옮긴 뒤 지운다. */
export async function deleteBpRoleGroup(id: number, input: DeleteBpRoleGroupInput): Promise<void> {
  await request(at(`/${id}`), await json("DELETE", input));
}

/** GET /bp-role-groups/{id}/deletion-candidates — BA 는 같은 BP 의 BA, FA 는 같은 관리계정의 FA 가 후보다. */
export async function getBpDeletionCandidates(id: number): Promise<DeletionCandidates> {
  return request(at(`/${id}/deletion-candidates`), await json("GET"));
}

/** GET /bp-role-groups/{id}/menus — WHALE_ERP 메뉴 트리, 칸마다 값 · 바꿀 수 있는지 · 막힌 이유. */
export async function getBpRoleGroupMenus(id: number): Promise<BpRoleGroupMenuTree> {
  return request(at(`/${id}/menus`), await json("GET"));
}

/** POST /bp-role-groups/{id}/menus/preview — 꺼지는 칸 · 영향 사용자 수. 쓰지 않는다. */
export async function previewBpRoleGroupMenus(id: number, menus: RoleGroupMenuCells[]): Promise<RevocationPreview> {
  return request(at(`/${id}/menus/preview`), await json("POST", { menus }));
}

/** PUT /bp-role-groups/{id}/menus — 메뉴별 네 칸 + updatedAt. */
export async function saveBpRoleGroupMenus(id: number, menus: RoleGroupMenuCells[], updatedAt: string): Promise<Schemas["SaveRoleGroupMenusResponseDto"]> {
  return request(at(`/${id}/menus`), await json("PUT", { menus, updatedAt }));
}

/** GET /bp-role-groups/franchise-master/menus — 가맹 마스터 고정 권한(FM000001)의 트리. 모든 칸이 읽기 전용이다. */
export async function getFranchiseMasterMenus(): Promise<BpRoleGroupMenuTree> {
  return request(at("/franchise-master/menus"), await json("GET"));
}
