// 점포 정보 관리 데이터 접근(/stores). api 는 whale-erp-api `/stores` 다.
// 메뉴 권한(MN000002 조회 · 등록 · 수정 · 삭제), 관리 점포 범위, 가맹 역할 등록 막기, 폐점 · BP 미사용 쓰기 막기는 api 가
// 동작마다 판정한다 — 화면은 미리 숨기거나 흐리게만 한다. 서버에서만 부른다(next/headers 를 쓰는 api.ts 를 쓴다).
import { authHeaders, getEnum, request, requestRaw } from "./api";
import { storeImageTypesOf } from "./store-image";
import {
  STORE_HISTORY_PAGE_SIZE,
  type BusinessVerificationInput,
  type BusinessVerificationResult,
  type CreateStoreInput,
  type CreateStoreResult,
  type StoreDetail,
  type StoreHistoryList,
  type StoreImage,
  type StoreImageFileType,
  type StoreList,
  type StorePageSize,
  type StoreStatus,
  type StoreTransitions,
  type StoreType,
  type UpdateStoreInput,
} from "./store-types";

export type StoreListQuery = {
  page: number;
  pageSize: StorePageSize;
  /** 고른 점포. 비면 전체 */
  storeIds: number[];
  /** 하이픈 없이, 일부만 넣어도 찾는다 */
  bizRegistrationNumber: string;
  statuses: StoreStatus[];
  storeTypes: StoreType[];
};

const json = async (method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** 목록 · 엑셀이 같이 쓰는 검색 조건(쪽 빼고) */
function conditionParams(query: Omit<StoreListQuery, "page" | "pageSize">): URLSearchParams {
  const params = new URLSearchParams();
  if (query.storeIds.length) params.set("storeIds", query.storeIds.join(","));
  if (query.bizRegistrationNumber) params.set("bizRegistrationNumber", query.bizRegistrationNumber);
  params.set("statuses", query.statuses.join(","));
  params.set("storeTypes", query.storeTypes.join(","));
  return params;
}

/** GET /stores — 관리 점포 범위, 등록일 최신순. 상태 · 유형을 하나도 고르지 않았으면 api 에 묻지 않고 0건이다. */
export async function getStores(query: StoreListQuery): Promise<StoreList> {
  if (!query.statuses.length || !query.storeTypes.length) return { items: [], total: 0 };
  const params = conditionParams(query);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return request(`/stores?${params}`, await json("GET"));
}

/**
 * GET /stores/excel — 목록과 같은 조건 · 순서의 xlsx(쪽 나눔 없음). 응답을 그대로 돌려준다(파일을 흘려보내려고).
 * 1만 건 이상 400 · 한 사람 1분에 한 번(429) · 메뉴 조회 권한.
 */
export async function getStoresExcel(query: Omit<StoreListQuery, "page" | "pageSize">): Promise<Response> {
  return requestRaw(`/stores/excel?${conditionParams(query)}`, await json("GET"));
}

/** GET /stores/:id — 없거나 범위 밖 · 지운 점포는 404 */
export async function getStore(id: number): Promise<StoreDetail> {
  return request(`/stores/${id}`, await json("GET"));
}

/** GET /stores/:id/histories — 최신순, 한 쪽 10건 */
export async function getStoreHistories(id: number, page = 1): Promise<StoreHistoryList> {
  return request(`/stores/${id}/histories?page=${page}&pageSize=${STORE_HISTORY_PAGE_SIZE}`, await json("GET"));
}

/** GET /stores/:id/transition-check — 운영 · 폐점 · 삭제 가능 여부를 지금 기준으로 다시 본다 */
export async function getStoreTransitions(id: number): Promise<StoreTransitions> {
  return request(`/stores/${id}/transition-check`, await json("GET"));
}

/** POST /stores — 미운영으로 생기고 점포코드(ST+6자리)는 서버가 매긴다 */
export async function createStore(input: CreateStoreInput): Promise<CreateStoreResult> {
  return request("/stores", await json("POST", input));
}

/** PUT /stores/:id — 상세에서 받은 updatedAt 을 함께 보낸다. 그 사이 다른 사람이 고쳤으면 409 */
export async function updateStore(id: number, input: UpdateStoreInput): Promise<void> {
  await request(`/stores/${id}`, await json("PUT", input));
}

/** DELETE /stores/:id — 미운영이면서 진행 중 근로계약이 없는 점포만. 논리 삭제 */
export async function deleteStore(id: number): Promise<void> {
  await request(`/stores/${id}`, await json("DELETE"));
}

/**
 * PUT /stores/:id/image — 대표 이미지 올리기 · 바꾸기(점포당 1장). multipart 의 `file` 하나, JPG · PNG 5MB 이하.
 * Content-Type 은 적지 않는다 — fetch 가 FormData 의 경계(boundary)를 붙여 채운다. 저장소 설정이 없으면 503.
 */
export async function putStoreImage(id: number, file: File): Promise<StoreImage> {
  const body = new FormData();
  body.append("file", file, file.name);
  return request(`/stores/${id}/image`, { method: "PUT", headers: await authHeaders(), body });
}

/**
 * 대표 이미지로 올릴 수 있는 형식(enum StoreImageFileType — JPG · PNG). 화면이 목록을 따로 적지 않고 GET /enums 에서 받는다.
 * 받지 못하면 빈 목록 — 폼은 이미지 칸만 막고 나머지는 그대로 쓴다.
 */
export async function getStoreImageTypes(): Promise<StoreImageFileType[]> {
  try {
    const values = (await getEnum("StoreImageFileType")).map((e) => e.value);
    const types = storeImageTypesOf(values);
    // 이름이 바뀌었거나 화면이 모르는 값만 오면 이미지 칸이 막힌다 — 새로고침으로 풀리지 않으니 원인을 남긴다
    if (!types.length) console.error("대표 이미지 형식이 비어 있습니다 — GET /enums/StoreImageFileType 응답 값:", values);
    return types;
  } catch (error) {
    console.error("대표 이미지 형식 조회 실패", error);
    return [];
  }
}

/** DELETE /stores/:id/image — 이미지가 없어도 204 */
export async function deleteStoreImage(id: number): Promise<void> {
  await request(`/stores/${id}/image`, await json("DELETE"));
}

/** POST /stores/business-verifications — 국세청 진위확인. 연동이 없거나 실패하면 503 */
export async function verifyStoreBusiness(input: BusinessVerificationInput): Promise<BusinessVerificationResult> {
  return request("/stores/business-verifications", await json("POST", input));
}
