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
export type CreateCodeGroupsInput = Schemas["CreateCodeGroupsDto"];
export type UpdateCodeGroupsInput = Schemas["UpdateCodeGroupsDto"];
export type CreateCodeItemsInput = Schemas["CreateCodeItemsDto"];
export type UpdateCodeItemsInput = Schemas["UpdateCodeItemsDto"];
export type DeleteCodeItemsInput = Schemas["DeleteCodeItemsDto"];
/**
 * 패널 하나의 저장 내용 — 바뀐 기존 행(updates)과 새 행(creates), 상세 코드는 지울 행(deletes)도. api 에는 수정 · 삭제 · 등록으로
 * 나눠 { items } · { itemCodes } 로 보낸다(front 전용 모양).
 */
export type SaveCodeGroupsInput = { updates: UpdateCodeGroupsInput["items"]; creates: CreateCodeGroupsInput["items"] };
export type SaveCodeItemsInput = {
  updates: UpdateCodeItemsInput["items"];
  creates: CreateCodeItemsInput["items"];
  deletes: DeleteCodeItemsInput["itemCodes"];
};
export type BpApplication = Schemas["BpApplicationResponseDto"];
export type UseStatus = Schemas["UseStatus"];
export type ManageOwnerCode = CodeGroup["manageOwnerCode"];

/** api 목록의 쪽 크기 상한(네이밍 규칙 「목록 응답」 pageSize 최대 200). 그룹 목록은 쪽을 나누지 않고 이 크기로 끝까지 받아 이어 붙인다. */
const API_PAGE_MAX = 200;

const json = async (method: string, body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/**
 * GET /code-groups — 플랫폼고정 · 플랫폼제공 그룹을 표시 순서대로 전부. 쪽을 나누지 않고 한 목록으로 보인다(2026-10-27 사용자 지정) —
 * api 쪽 크기 상한씩 끝까지 받아 이어 붙인다. 그룹 코드 · 그룹명은 일부 일치(대소문자 무시)이고 빈 값은 보내지 않는다. 관리주체를 주면 그 그룹만.
 */
export async function getCodeGroups({
  groupCode = "",
  groupName = "",
  manageOwnerCode,
}: { groupCode?: string; groupName?: string; manageOwnerCode?: string } = {}): Promise<CodeGroupList> {
  const items: CodeGroupList["items"] = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(API_PAGE_MAX) });
    if (groupCode) query.set("groupCode", groupCode);
    if (groupName) query.set("groupName", groupName);
    if (manageOwnerCode) query.set("manageOwnerCodes", manageOwnerCode);
    const list: CodeGroupList = await request(`/code-groups?${query}`, await json("GET"));
    items.push(...list.items);
    // 빈 쪽이면 멈춘다 — 받는 사이 그룹이 줄어 total 에 못 미쳐도 끝없이 돌지 않는다
    if (list.items.length === 0 || items.length >= list.total) return { items, total: items.length };
  }
}

/** GET /code-groups/{groupCode}/items — 플랫폼 원본 상세 코드. BP전용 코드는 나오지 않는다. */
export async function getCodeItems(groupCode: string): Promise<CodeItemList> {
  return request(`/code-groups/${encodeURIComponent(groupCode)}/items`, await json("GET"));
}

// 등록 · 수정 · 삭제는 각자 한 트랜잭션이고 응답은 204 다. 한 요청 안에서 하나라도 막히면 아무것도 바뀌지 않는다.

/** POST /code-groups — 새 그룹 등록(등록 권한). */
export async function createCodeGroups(input: CreateCodeGroupsInput): Promise<void> {
  await request("/code-groups", await json("POST", input));
}

/** PUT /code-groups — 기존 그룹 수정(수정 권한). 고칠 수 있는 것은 그룹명 · 사용 상태 · 표시 순서뿐이다. */
export async function updateCodeGroups(input: UpdateCodeGroupsInput): Promise<void> {
  await request("/code-groups", await json("PUT", input));
}

/** POST /code-groups/{groupCode}/items — 새 상세 코드 등록(등록 권한). */
export async function createCodeItems(groupCode: string, input: CreateCodeItemsInput): Promise<void> {
  await request(`/code-groups/${encodeURIComponent(groupCode)}/items`, await json("POST", input));
}

/** PUT /code-groups/{groupCode}/items — 기존 상세 코드 수정(수정 권한). 고칠 수 있는 것은 코드명 · 사용 상태 · 표시 순서뿐이다. */
export async function updateCodeItems(groupCode: string, input: UpdateCodeItemsInput): Promise<void> {
  await request(`/code-groups/${encodeURIComponent(groupCode)}/items`, await json("PUT", input));
}

/** DELETE /code-groups/{groupCode}/items — 상세 코드 삭제(논리 · 삭제 권한). 플랫폼제공 그룹의 코드는 어느 것이든 지운다(플랫폼고정 그룹은 api 가 409 로 막는다 — 사용 상태로만 관리). 지운 코드를 다시 등록(createCodeItems)하면 api 가 삭제를 풀어 되살린다. */
export async function deleteCodeItems(groupCode: string, input: DeleteCodeItemsInput): Promise<void> {
  await request(`/code-groups/${encodeURIComponent(groupCode)}/items`, await json("DELETE", input));
}

/** POST /code-groups/{groupCode}/bp-application — 플랫폼제공 그룹만. BP 에 이미 있는 행은 건너뛰고 없는 행만 넣는다. */
export async function applyCodeGroupToBps(groupCode: string): Promise<BpApplication> {
  return request(`/code-groups/${encodeURIComponent(groupCode)}/bp-application`, await json("POST"));
}
