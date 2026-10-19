// 플랫폼 메뉴 관리 데이터 접근(/platform/system/menus, 메뉴 MN000215). api 는 whale-erp-api `/platform-menus` 다.
// 메뉴 권한(조회 · 등록 · 수정 — 옮기기는 수정)과 플랫폼 계정 여부는 api 가 동작마다 판정한다. 메뉴 삭제는 없다(안 쓰는 메뉴는 미사용).
// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";

type Schemas = components["schemas"];
export type MenuService = Schemas["PlatformMenuServiceResponseDto"];
export type MenuTree = Schemas["PlatformMenuTreeResponseDto"];
export type MenuNode = Schemas["PlatformMenuNodeResponseDto"];
export type MenuDetail = Schemas["PlatformMenuDetailResponseDto"];
export type CreatedMenu = Schemas["CreatePlatformMenuResponseDto"];
export type CreateMenuInput = Schemas["CreatePlatformMenuDto"];
export type UpdateMenuInput = Schemas["UpdatePlatformMenuDto"];
export type MoveMenuInput = Schemas["MovePlatformMenuDto"];

const json = async (method: "GET" | "POST" | "PUT", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /platform-menus/services — 서비스 탭. 공통코드 SERVICE 전부(사용중지 포함)를 공통코드 순서로, 서비스별 메뉴 수와 함께. */
export async function getMenuServices(): Promise<MenuService[]> {
  return (await request<Schemas["PlatformMenuServiceListResponseDto"]>("/platform-menus/services", await json("GET"))).items;
}

/** GET /platform-menus?serviceCode= — 서비스 하나의 메뉴 트리 전부(쪽 나눔 · 검색 없음). 없는 서비스는 404. */
export async function getMenuTree(serviceCode: string): Promise<MenuTree> {
  return request(`/platform-menus?serviceCode=${encodeURIComponent(serviceCode)}`, await json("GET"));
}

/** GET /platform-menus/{id} — 상위 · 경로 · 등록자 · 수정자. 저장할 때 updatedAt 을 그대로 돌려보낸다. 지운 메뉴는 404. */
export async function getMenu(id: number): Promise<MenuDetail> {
  return request(`/platform-menus/${id}`, await json("GET"));
}

/** POST /platform-menus — 고른 상위(없으면 최상위)의 맨 끝에. 메뉴 코드는 api 가 저장할 때 매기고, 플랫폼 마스터 권한 행을 함께 넣는다. */
export async function createMenu(input: CreateMenuInput): Promise<CreatedMenu> {
  return request("/platform-menus", await json("POST", input));
}

/** PUT /platform-menus/{id} — 노출 메뉴명 · URL · 사용 상태를 통째로(URL 을 빼면 비운다). 그 사이 고쳤으면 409. */
export async function updateMenu(id: number, input: UpdateMenuInput): Promise<void> {
  await request(`/platform-menus/${id}`, await json("PUT", input));
}

/** POST /platform-menus/{id}/move — 새 상위(null 이면 최상위) 아래 index 자리로(옮기는 메뉴를 뺀 형제 기준, 0 이 맨 앞). 하위가 함께 가고 바로 저장된다. */
export async function moveMenu(id: number, input: MoveMenuInput): Promise<void> {
  await request(`/platform-menus/${id}/move`, await json("POST", input));
}
