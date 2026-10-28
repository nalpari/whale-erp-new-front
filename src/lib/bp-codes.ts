// BP 공통코드 데이터 접근(/bp-code-groups). api 는 whale-erp-api `/bp-code-groups` 다(메뉴 MN000014 · 메뉴 권한은 api 가 본다).
// 대상 BP 는 탭 BP 다 — 화면 주소(/bp/{id}/bp-code-groups)에서 proxy 가 헤더로 싣고 authHeaders() 가 api 에 X-Bp-Code-Id 로 넘긴다.
// 그룹은 플랫폼이 만든다 — BP 는 상세 코드만 등록 · 수정 · 삭제한다(그룹 추가 · 수정 · 삭제 api 는 없다). 지울 수 있는 것은 플랫폼제공 · BP전용 코드다.
// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다. 저장 요청 모양은 플랫폼 공통코드와 같다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import type { SaveCodeItemsInput } from "./codes";

type Schemas = components["schemas"];
export type BpCodeGroup = Schemas["BpCodeGroupResponseDto"];
export type BpCodeGroupList = Schemas["BpCodeGroupListResponseDto"];
export type BpCodeItem = Schemas["BpCodeItemResponseDto"];
export type BpCodeItemList = Schemas["BpCodeItemListResponseDto"];
/**
 * 상세 코드의 관리 주체. api #165 부터 BP 에게 플랫폼고정은 오지 않아(목록 · 상세에서 뺀다) 생성 타입에 없지만,
 * 막는 판단(bp-code-drafts.ts 의 bpPanelLock · bpDeletable)은 옛 응답 대비로 남겨 두므로 값으로 받아 둔다.
 */
export type BpManageOwnerCode = BpCodeItem["manageOwnerCode"] | "PLATFORM_FIXED";
export type { SaveCodeItemsInput };

/** api 목록의 쪽 크기 상한(네이밍 규칙 「목록 응답」 pageSize 최대 200). 화면은 쪽을 나누지 않고 이 크기로 끝까지 받아 이어 붙인다. */
const API_PAGE_MAX = 200;

const json = async (method: string, body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/**
 * GET /bp-code-groups — 이 BP 가 관리하는 플랫폼제공 그룹(사용 중인 것 — BP 적용 여부는 보지 않는다)을 표시 순서대로 전부.
 * 플랫폼고정 그룹은 BP 가 고칠 것이 없어 화면에 보이지 않는다(2026-10-27 사용자 지정) — api 의 관리주체 조건으로 거른다.
 * 쪽을 나누지 않고 한 목록으로 보인다(2026-10-27 사용자 지정) — api 쪽 크기 상한씩 끝까지 받아 이어 붙인다.
 * 그룹 코드 · 그룹명은 일부 일치 · 대소문자 무시로 거른다.
 */
export async function getBpCodeGroups({ groupCode = "", groupName = "" }: { groupCode?: string; groupName?: string } = {}): Promise<BpCodeGroupList> {
  const items: BpCodeGroup[] = [];
  for (let page = 1; ; page++) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(API_PAGE_MAX), manageOwnerCodes: "PLATFORM_PROVIDED" });
    if (groupCode) params.set("groupCode", groupCode);
    if (groupName) params.set("groupName", groupName);
    const list: BpCodeGroupList = await request(`/bp-code-groups?${params}`, await json("GET"));
    items.push(...list.items);
    if (items.length >= list.total) return { items, total: items.length };
    // 빈 쪽이면 멈춘다 — 받는 사이 그룹이 줄어 total 에 못 미쳐도 끝없이 돌지 않는다. 덜 받은 것은 기록을 남긴다
    if (list.items.length === 0) {
      console.warn("공통코드 그룹 목록을 끝까지 받지 못했습니다", { received: items.length, total: list.total });
      return { items, total: items.length };
    }
  }
}

/** GET /bp-code-groups/{groupCode}/items — 플랫폼고정이면 플랫폼 원본, 플랫폼제공이면 이 BP 의 행(복사된 코드 · BP전용). 사용중지 포함, 쪽 나눔 없음. */
export async function getBpCodeItems(groupCode: string): Promise<BpCodeItemList> {
  return request(`/bp-code-groups/${encodeURIComponent(groupCode)}/items`, await json("GET"));
}

// 등록 · 수정 · 삭제는 각자 한 트랜잭션이고 응답은 204 다. 한 요청 안에서 하나라도 막히면 아무것도 바뀌지 않는다.
// 플랫폼고정 그룹(409), 사용중지 · 없는 그룹(404), 플랫폼 사용자(403)는 api 가 막는다.

/** POST /bp-code-groups/{groupCode}/items — 새 상세 코드 등록(등록 권한). 관리 주체는 api 가 BP전용으로 저장한다. */
export async function createBpCodeItems(groupCode: string, input: { items: SaveCodeItemsInput["creates"] }): Promise<void> {
  await request(`/bp-code-groups/${encodeURIComponent(groupCode)}/items`, await json("POST", input));
}

/** PUT /bp-code-groups/{groupCode}/items — 이 BP 의 상세 코드 수정(수정 권한). 고칠 수 있는 것은 코드명 · 사용 상태 · 표시 순서뿐이다. */
export async function updateBpCodeItems(groupCode: string, input: { items: SaveCodeItemsInput["updates"] }): Promise<void> {
  await request(`/bp-code-groups/${encodeURIComponent(groupCode)}/items`, await json("PUT", input));
}

/** DELETE /bp-code-groups/{groupCode}/items — 이 BP 의 플랫폼제공 · BP전용 코드 삭제(논리 · 삭제 권한). 지운 코드를 다시 등록할 때의 처리는 api 가 정한다. */
export async function deleteBpCodeItems(groupCode: string, input: { itemCodes: SaveCodeItemsInput["deletes"] }): Promise<void> {
  await request(`/bp-code-groups/${encodeURIComponent(groupCode)}/items`, await json("DELETE", input));
}
