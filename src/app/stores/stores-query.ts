// 점포 목록 URL 쿼리 ↔ 쿼리 객체. 검색 조건 · 쪽 · 보기는 URL 에만 둔다 — 상세에서 돌아와도, 새로 고쳐도 같은 목록이다(S-BAYAJS).
// 기본값은 URL 에서 뺀다. 이상한 값은 오류 없이 기본값으로 돌린다. 체크 목록은 모르는 값만 버린다 — 남는 게 없으면
// 하나도 고르지 않은 것(0건)이다. node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { StoreListQuery } from "../../lib/stores.ts";
import { STORE_PAGE_SIZES, STORE_STATUSES, STORE_TYPES, type StoreStatus, type StoreType } from "../../lib/store-types.ts";

export type StoreView = "cards" | "table";
export type StoresQuery = StoreListQuery & { view: StoreView };

type RawSearch = Record<string, string | string[] | undefined>;

/** 처음엔 폐점을 뺀다 */
const DEFAULT_STATUSES: StoreStatus[] = ["NOT_OPERATING", "OPERATING"];

export const DEFAULT_STORES_QUERY: StoresQuery = {
  page: 1,
  pageSize: 20,
  storeIds: [],
  bizRegistrationNumber: "",
  statuses: DEFAULT_STATUSES,
  storeTypes: [...STORE_TYPES],
  view: "cards",
};

/** 고를 수 있는 점포 수 — api 상한(ListStoresQueryDto storeIds 1000개)과 같다. 헤더의 직영 · 가맹 범위가 그 유형 점포를 모두 싣는다 */
export const MAX_PICKED_STORES = 1000;

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined);

/** 쉼표 목록. 파라미터가 없으면 기본값, 빈 값이면 하나도 고르지 않은 것. 순서는 화면 순서로 맞춘다 */
function listOf<T extends string>(raw: string | undefined, allowed: readonly T[], fallback: readonly T[]): T[] {
  if (raw === undefined) return [...fallback];
  const picked = new Set(raw.split(","));
  return allowed.filter((a) => picked.has(a));
}

/** api 목록의 쪽 번호 상한 */
const MAX_PAGE = 10_000_000;
/** int4 양의 정수만 — 9자리까지 받아 api 의 정수 범위를 넘기지 않는다 */
const positiveInt = (v: string) => (/^\d{1,9}$/.test(v) && Number(v) >= 1 ? Number(v) : null);

export function parseStoresQuery(raw: RawSearch): StoresQuery {
  // 상한을 넘으면 api 가 400 이라 오류 화면으로 떨어지므로 첫 쪽으로 돌린다
  const page = positiveInt(first(raw.page) ?? "");
  const safePage = page !== null && page <= MAX_PAGE ? page : null;
  const pageSize = Number(first(raw.pageSize));
  const storeIds = [
    ...new Set(
      (first(raw.storeIds) ?? "")
        .split(",")
        .map(positiveInt)
        .filter((id): id is number => id !== null),
    ),
  ].slice(0, MAX_PICKED_STORES);
  return {
    page: safePage ?? 1,
    pageSize: STORE_PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_STORES_QUERY.pageSize,
    storeIds,
    // 하이픈은 빼고 숫자만 — api 가 일부만 넣어도 찾는다
    bizRegistrationNumber: (first(raw.bizRegistrationNumber) ?? "").replace(/[^0-9]/g, "").slice(0, 10),
    statuses: listOf(first(raw.statuses), STORE_STATUSES, DEFAULT_STATUSES),
    storeTypes: listOf<StoreType>(first(raw.storeTypes), STORE_TYPES, STORE_TYPES),
    view: first(raw.view) === "table" ? "table" : "cards",
  };
}

const sameList = <T>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((x) => b.includes(x));

/** 지금 검색 조건의 엑셀 주소(front 중계 경로). 쪽 · 보기는 빼고 조건만 싣는다 */
export function storesExcelHref(query: StoresQuery): string {
  return storesHref({ ...query, view: "cards", page: 1, pageSize: DEFAULT_STORES_QUERY.pageSize }).replace(/^\/stores/, "/stores/excel");
}

export function storesHref(query: StoresQuery): string {
  const params = new URLSearchParams();
  if (query.storeIds.length) params.set("storeIds", query.storeIds.join(","));
  if (query.bizRegistrationNumber) params.set("bizRegistrationNumber", query.bizRegistrationNumber);
  if (!sameList(query.statuses, DEFAULT_STATUSES)) params.set("statuses", STORE_STATUSES.filter((s) => query.statuses.includes(s)).join(","));
  if (!sameList(query.storeTypes, STORE_TYPES)) params.set("storeTypes", STORE_TYPES.filter((t) => query.storeTypes.includes(t)).join(","));
  if (query.view !== "cards") params.set("view", query.view);
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_STORES_QUERY.pageSize) params.set("pageSize", String(query.pageSize));
  const search = params.toString();
  return `/stores${search ? `?${search}` : ""}`;
}

/** 상세로 갈 때 지금 목록 주소를 함께 넘긴다 — 상세의 [목록]이 같은 조건 · 쪽으로 돌아온다(S-BAYAJS) */
export const detailHrefOf = (listHref: string) => (id: number) =>
  listHref === "/stores" ? `/stores/${id}` : `/stores/${id}?back=${encodeURIComponent(listHref)}`;

/** 상세 · 수정에서 돌아갈 목록 주소. 넘어온 값이 점포 목록 주소가 아니면(다른 곳으로 보내려는 값) 기본 목록으로 */
export function backHrefOf(raw: string | string[] | undefined): string {
  const value = typeof raw === "string" ? raw : "";
  return /^\/stores(\?[^#]*)?$/.test(value) ? value : "/stores";
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다 — 4쪽에서 거르면 빈 쪽이 보인다 */
export function withStoreFilter(query: StoresQuery, next: Partial<StoresQuery>): StoresQuery {
  return { ...query, ...next, page: 1 };
}
