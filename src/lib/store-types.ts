// 점포 정보 관리 api(whale-erp-api `/stores`)의 요청 · 응답 타입. 손으로 짓지 않고 api 의 openapi.json 에서 만든 것
// (api-types.generated.ts)을 쓴다(네이밍 규칙 「요청·응답 타입」). 여기에는 그 별칭과 화면이 쓰는 값 목록만 둔다.
// 클라이언트 컴포넌트도 가져다 쓰므로 next/headers 를 쓰는 모듈을 import 하지 않는다.
import type { components } from "./api-types.generated.ts";

type Schemas = components["schemas"];

export type StoreSummary = Schemas["StoreSummaryResponseDto"];
export type StoreList = Schemas["StoreListResponseDto"];
export type StoreDetail = Schemas["StoreDetailResponseDto"];
export type StoreBusiness = Schemas["StoreBusinessResponseDto"];
/** 대표 이미지 — url 은 5분 동안만 열리는 서명 주소이고, 저장소를 쓸 수 없으면 url 만 null 이다 */
export type StoreImage = Schemas["StoreImageResponseDto"];
/** enum StoreImageFileType — 허용 형식 목록은 GET /enums 에서 받는다 */
export type StoreImageFileType = Schemas["StoreImageFileType"];
/** 층 한 줄 — floorTypeCode 는 api 가 글자로 준다(GROUND · BASEMENT). 표시는 floorTypeOf 로 좁히고, 수정 요청에는 받은 글자를 그대로 돌려보낸다 */
export type StoreFloor = Schemas["StoreFloorResponseDto"];
/** 운영 · 폐점 · 삭제를 할 수 있는지 — 상세 응답의 transitions 와 GET /stores/:id/transition-check 가 같은 모양이다 */
export type StoreTransitions = Schemas["StoreTransitionCheckResponseDto"];
export type StoreHistory = Schemas["StoreHistoryResponseDto"];
export type StoreHistoryList = Schemas["StoreHistoryListResponseDto"];
export type CreateStoreInput = Schemas["CreateStoreDto"];
export type CreateStoreResult = Schemas["CreateStoreResponseDto"];
/** PUT /stores/:id — 화면 전체를 보낸다(빠진 선택 칸은 지운다). 층별 정보는 보낸 목록으로 통째로 바뀐다 */
export type UpdateStoreInput = Schemas["UpdateStoreDto"];
export type StoreBusinessInput = Schemas["StoreBusinessInputDto"];
/** POST /stores/business-verifications — 진위확인 세 값 + 수정 중이면 storeId. 서버가 저장할 때 국세청에 다시 확인한다. 연동 전에는 503 */
export type BusinessVerificationInput = Schemas["VerifyStoreBusinessDto"];
export type BusinessVerificationResult = Schemas["StoreBusinessVerificationResponseDto"];

/** 공통코드 STORE_STATUS */
export type StoreStatus = StoreSummary["storeStatusCode"];
/** 공통코드 STORE_TYPE */
export type StoreType = StoreSummary["storeTypeCode"];
/** 공통코드 FLOOR_TYPE — 요청 DTO 가 받는 값(응답은 글자로 준다) */
export type FloorType = NonNullable<Schemas["StoreFloorInputDto"]["floorTypeCode"]>;

/**
 * 화면에 늘어놓는 순서. 값마다 순서를 적게 해 두어(satisfies Record) 생성 타입에 값이 더해지거나 빠지면 컴파일이 깨진다 —
 * 목록에서 조용히 빠지지 않게. 서버(주소 쿼리 읽기)도 쓰므로 값 목록은 여기 두고, 한글은 화면이 공통코드에서 읽는다(code-label.tsx).
 */
const orderOf = <T extends string>(order: Record<T, number>): readonly T[] =>
  (Object.keys(order) as T[]).sort((a, b) => order[a] - order[b]);
export const STORE_STATUSES = orderOf({ NOT_OPERATING: 1, OPERATING: 2, CLOSED: 3 } satisfies Record<StoreStatus, number>);
export const STORE_TYPES = orderOf({ DIRECT: 1, FRANCHISE: 2 } satisfies Record<StoreType, number>);
export const FLOOR_TYPES = orderOf({ GROUND: 1, BASEMENT: 2 } satisfies Record<FloorType, number>);
/** 페이지당 건수 — api 는 이 셋 밖이면 400 이다 */
export const STORE_PAGE_SIZES = [20, 50, 100] as const;
export type StorePageSize = (typeof STORE_PAGE_SIZES)[number];
export const STORE_HISTORY_PAGE_SIZE = 10;
/** 대표 이미지 한 장의 상한 — 정책 「JPG · PNG 5MB 이하」, api 와 DB CHECK 가 같은 값으로 막는다 */
export const STORE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** api 가 글자로 준 층 구분을 화면의 두 값으로 좁힌다. 모르는 값이면 null */
export const floorTypeOf = (value: string | null | undefined): FloorType | null =>
  FLOOR_TYPES.find((t) => t === value) ?? null;
