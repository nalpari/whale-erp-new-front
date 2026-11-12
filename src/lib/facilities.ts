// 시설물 및 장비 관리 데이터 접근(/facilities, MN000022). api 는 whale-erp-api `/facilities` 다.
// 메뉴 권한 · 관리 점포 범위 · 폐점 점포 조회만은 api 가 요청마다 본다. 플랫폼 계정은 X-Bp-Code-Id 가 꼭 있어야 한다(없으면 400) —
// 화면 주소가 탭 BP 주소(/bp/{id}/facilities)라 proxy 가 싣고, authHeaders() 가 api 로 넘긴다(BP_PATH_SCREENS).
// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request, send } from "./api";

type Schemas = components["schemas"];
export type FacilityListItem = Schemas["FacilityListItemDto"];
export type FacilityList = Schemas["FacilityListResponseDto"];
export type FacilityStoreOption = Schemas["FacilityStoreOptionDto"];
export type FacilityManagerOption = Schemas["FacilityManagerOptionDto"];
export type FacilityDetail = Schemas["FacilityDetailResponseDto"];
export type FacilityDocument = Schemas["FacilityDocumentDto"];
export type FacilityDocumentKind = Schemas["FacilityDocumentKind"];
export type CreateFacilityInput = Schemas["CreateFacilityDto"];
export type UpdateFacilityInput = Schemas["UpdateFacilityDto"];
export type UpdateFacilityResult = Schemas["UpdateFacilityResponseDto"];

/** GET /facilities — 쿼리는 목록 화면이 만든다(facility-list-query.ts 의 facilityListApiSearch) */
export async function getFacilities(search: string): Promise<FacilityList> {
  return request(`/facilities?${search}`, { headers: await authHeaders() });
}

/** GET /facilities/:id — 지운 것 · 범위 밖은 404 */
export async function getFacility(id: number): Promise<FacilityDetail> {
  return request(`/facilities/${id}`, { headers: await authHeaders() });
}

/** GET /facilities/store-options — 등록 화면은 폐점을 빼고(기본), 목록 필터는 includeClosed=true */
export async function getFacilityStoreOptions(includeClosed: boolean): Promise<FacilityStoreOption[]> {
  const query = includeClosed ? "?includeClosed=true" : "";
  return (await request<Schemas["FacilityStoreOptionListResponseDto"]>(`/facilities/store-options${query}`, { headers: await authHeaders() })).items;
}

/** GET /facilities/manager-options?storeId= — 그 점포의 재직 직원(이름 · 휴대폰, 숫자만) */
export async function getFacilityManagerOptions(storeId: number): Promise<FacilityManagerOption[]> {
  const query = new URLSearchParams({ storeId: String(storeId) });
  return (await request<Schemas["FacilityManagerOptionListResponseDto"]>(`/facilities/manager-options?${query}`, { headers: await authHeaders() })).items;
}

/** POST /facilities — 문서는 받은 facilityId 로 종류마다 따로 올린다(PUT /facilities/:id/documents/:kind) */
export async function createFacility(input: CreateFacilityInput): Promise<{ facilityId: number }> {
  return send("/facilities", "POST", input);
}

/** PUT /facilities/:id — 화면 전체를 다시 보낸다. 상세의 updatedAt 을 함께 보내고, 그 사이 누가 고쳤으면 409. 점포(storeId)는 보내지 않는다(보내면 400) */
export async function updateFacility(id: number, input: UpdateFacilityInput): Promise<UpdateFacilityResult> {
  return send(`/facilities/${id}`, "PUT", input);
}

/** DELETE /facilities/:id — 논리 삭제. 폐점 점포의 것은 409 */
export async function deleteFacility(id: number): Promise<void> {
  await send(`/facilities/${id}`, "DELETE");
}

/** DELETE /facilities/:id/documents/:kind — 문서 빼기. 없어도 204 */
export async function deleteFacilityDocument(id: number, kind: FacilityDocumentKind): Promise<void> {
  await send(`/facilities/${id}/documents/${kind}`, "DELETE");
}
