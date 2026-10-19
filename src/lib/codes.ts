// 플랫폼 공통코드 데이터 접근(/code-groups). api 는 whale-erp-api `/code-groups` 다.
// api 는 관리자 토큰(플랫폼 관리자 PM · PA)만 받는다 — 토큰은 authHeaders() 가 붙인다(로그인 전에는 개발용 토큰).
// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";

type Schemas = components["schemas"];
export type CodeGroup = Schemas["CodeGroupResponseDto"];
export type CodeGroupList = Schemas["CodeGroupListResponseDto"];
export type CodeItem = Schemas["CodeItemResponseDto"];
export type CodeItemList = Schemas["CodeItemListResponseDto"];
export type SaveCodeGroupsInput = Schemas["SaveCodeGroupsDto"];
export type SaveCodeItemsInput = Schemas["SaveCodeItemsDto"];
export type BpApplication = Schemas["BpApplicationResponseDto"];
export type UseStatus = Schemas["UseStatus"];
export type ManageOwnerCode = CodeGroup["manageOwnerCode"];

export const DEFAULT_PAGE_SIZE = 20;

const json = async (method: string, body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /code-groups — 플랫폼고정 · 플랫폼제공 그룹을 표시 순서대로 한 쪽씩. */
export async function getCodeGroups({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}): Promise<CodeGroupList> {
  return request(`/code-groups?page=${page}&pageSize=${pageSize}`, await json("GET"));
}

/** GET /code-groups/{groupCode}/items — 플랫폼 원본 상세 코드. BP전용 코드는 나오지 않는다. */
export async function getCodeItems(groupCode: string): Promise<CodeItemList> {
  return request(`/code-groups/${encodeURIComponent(groupCode)}/items`, await json("GET"));
}

/** PUT /code-groups — 그룹 목록 패널 저장. 고칠 수 있는 것은 그룹명 · 사용 상태 · 표시 순서뿐이다. */
export async function saveCodeGroups(input: SaveCodeGroupsInput): Promise<void> {
  await request("/code-groups", await json("PUT", input));
}

/** PUT /code-groups/{groupCode}/items — 상세 코드 목록 패널 저장. 고칠 수 있는 것은 코드명 · 사용 상태 · 표시 순서뿐이다. */
export async function saveCodeItems(groupCode: string, input: SaveCodeItemsInput): Promise<void> {
  await request(`/code-groups/${encodeURIComponent(groupCode)}/items`, await json("PUT", input));
}

/** POST /code-groups/{groupCode}/bp-application — 플랫폼제공 그룹만. BP 에 이미 있는 행은 건너뛰고 없는 행만 넣는다. */
export async function applyCodeGroupToBps(groupCode: string): Promise<BpApplication> {
  return request(`/code-groups/${encodeURIComponent(groupCode)}/bp-application`, await json("POST"));
}
