// BP 권한 그룹 관리 데이터 접근(/bp-role-groups, 메뉴 MN000013). api 는 whale-erp-api `/bp-role-groups` 다.
// 메뉴 권한 · 역할(BP 마스터는 BA 그룹, 가맹 마스터는 본인 FA 그룹) · 본인 연결 · 기준 고정 권한(BM000001 · FM000001) · 본인 범위 상한은
// api 가 동작마다 판정한다 — 화면은 api 가 준 creatableRoleTypeCode · isEditable · 칸별 editable 로 미리 숨기거나 흐리게만 한다.
// 모든 요청에 이 탭의 BP(bpCodeId)를 싣는다 — 플랫폼 사용자는 고른 BP 를 조회만 하고, BP 쪽 사용자는 자기 BP 다(다른 BP 면 api 가 403).
// 메뉴 트리 · 미리보기 · 삭제 후보는 플랫폼 권한과 같은 모양이라 그 타입을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import type { DeletionCandidates, RevocationPreview, RoleGroupMenuCells, RoleGroupMenuTree } from "./platform-role-groups";

// shortcut: api 의 /bp-role-groups 가 아직 openapi.json 에 없어 요청서(BP 권한 그룹 API 요청서 · 2026-10-20) 모양대로 손으로 적었다.
// api 가 머지되면 pnpm openapi:types 로 생성한 components["schemas"] 의 BP DTO 로 바꾸고 이 타입들을 지운다.
type Actor = components["schemas"]["RoleGroupActorResponseDto"];
export type BpRoleType = "BA" | "FA";

export interface BpRoleGroup {
  roleGroupId: number;
  roleTypeCode: BpRoleType;
  roleCode: string;
  name: string;
  description: string | null;
  /** 관리계정ID — FA 그룹을 만든 가맹 마스터. BA 는 null */
  manager: { adminAccountId: number; loginId: string; name: string | null } | null;
  /** 호출자 본인이 연결된 그룹인가 — 「본인」 배지 */
  isSelfLinked: boolean;
  /** 조회가 켜진 메뉴 수 — 0 이면 「미등록」 */
  menuCount: number;
  adminCount: number;
  createdAt: string;
  createdBy: Actor | null;
  updatedAt: string;
  updatedBy: Actor | null;
}

export interface BpRoleGroupList {
  items: BpRoleGroup[];
  total: number;
  /** 등록하면 생길 유형 — BP 마스터는 BA, 가맹 마스터는 FA, 나머지 null(등록 불가). 메뉴 등록 권한은 보지 않아 화면이 합친다 */
  creatableRoleTypeCode: BpRoleType | null;
}

export type BpRoleGroupLockReason = "NO_PERMISSION" | "SELF_LINKED";
export interface BpRoleGroupDetail extends BpRoleGroup {
  isEditable: boolean;
  isDeletable: boolean;
  editBlockedReason: BpRoleGroupLockReason | null;
  deleteBlockedReason: BpRoleGroupLockReason | null;
}

export type BpRoleGroupInput = { name: string; description?: string | null };
export type CreatedBpRoleGroup = { roleGroupId: number; roleCode: string };
export type DeleteBpRoleGroupInput = { updatedAt: string; replacementRoleGroupId?: number };

/** 목록 쪽 크기 — api 기본값과 같다 */
export const BP_ROLE_PAGE_SIZE = 20;

const json = async (method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const at = (path: string, bpCodeId: number, extra?: Record<string, string>) => `/bp-role-groups${path}?${new URLSearchParams({ bpCodeId: String(bpCodeId), ...extra })}`;

/** GET /bp-role-groups — 보이는 BA · FA 그룹을 권한 코드순으로(고정 권한 · 지운 그룹은 없다). */
export async function getBpRoleGroups(bpCodeId: number, page: number): Promise<BpRoleGroupList> {
  return request(at("", bpCodeId, { page: String(page), pageSize: String(BP_ROLE_PAGE_SIZE) }), await json("GET"));
}

/** GET /bp-role-groups/{id} — 볼 수 없거나 지운 그룹은 404. */
export async function getBpRoleGroup(bpCodeId: number, id: number): Promise<BpRoleGroupDetail> {
  return request(at(`/${id}`, bpCodeId), await json("GET"));
}

/** POST /bp-role-groups — 유형은 등록자로 정해진다(BP 마스터 BA, 가맹 마스터 FA · 관리계정 = 본인). */
export async function createBpRoleGroup(bpCodeId: number, input: BpRoleGroupInput): Promise<CreatedBpRoleGroup> {
  return request(at("", bpCodeId), await json("POST", input));
}

/** PUT /bp-role-groups/{id} — 권한명 · 설명 + updatedAt(그 사이 고쳤으면 409). */
export async function updateBpRoleGroup(bpCodeId: number, id: number, input: BpRoleGroupInput & { updatedAt: string }): Promise<void> {
  await request(at(`/${id}`, bpCodeId), await json("PUT", input));
}

/** DELETE /bp-role-groups/{id} — 논리 삭제. 연결 사용자가 있으면 대체 그룹으로 옮긴 뒤 지운다. */
export async function deleteBpRoleGroup(bpCodeId: number, id: number, input: DeleteBpRoleGroupInput): Promise<void> {
  await request(at(`/${id}`, bpCodeId), await json("DELETE", input));
}

/** GET /bp-role-groups/{id}/deletion-candidates — BA 는 같은 BP 의 BA, FA 는 같은 관리계정의 FA 가 후보다. */
export async function getBpDeletionCandidates(bpCodeId: number, id: number): Promise<DeletionCandidates> {
  return request(at(`/${id}/deletion-candidates`, bpCodeId), await json("GET"));
}

/** GET /bp-role-groups/{id}/menus — WHALE_ERP 메뉴 트리, 칸마다 값 · 바꿀 수 있는지 · 막힌 이유. */
export async function getBpRoleGroupMenus(bpCodeId: number, id: number): Promise<RoleGroupMenuTree> {
  return request(at(`/${id}/menus`, bpCodeId), await json("GET"));
}

/** POST /bp-role-groups/{id}/menus/preview — 꺼지는 칸 · 영향 사용자 수. 쓰지 않는다. */
export async function previewBpRoleGroupMenus(bpCodeId: number, id: number, menus: RoleGroupMenuCells[]): Promise<RevocationPreview> {
  return request(at(`/${id}/menus/preview`, bpCodeId), await json("POST", { menus }));
}

/** PUT /bp-role-groups/{id}/menus — 메뉴별 네 칸 + updatedAt. */
export async function saveBpRoleGroupMenus(bpCodeId: number, id: number, menus: RoleGroupMenuCells[], updatedAt: string): Promise<{ updatedAt: string }> {
  return request(at(`/${id}/menus`, bpCodeId), await json("PUT", { menus, updatedAt }));
}

/** GET /bp-role-groups/franchise-master/menus — 가맹 마스터 고정 권한(FM000001)의 트리. 모든 칸이 읽기 전용이다. */
export async function getFranchiseMasterMenus(bpCodeId: number): Promise<RoleGroupMenuTree> {
  return request(at("/franchise-master/menus", bpCodeId), await json("GET"));
}
