// 점포 목록 URL 쿼리 ↔ 쿼리 객체. 검색 조건 · 쪽 · 보기는 URL 에만 둔다 — 상세에서 돌아와도, 새로 고쳐도 같은 목록이다(S-BAYAJS).
// 점포 조건은 둘이다: 목록에서 고른 점포(storeIds)와 헤더 범위(scope — 헤더가 메뉴로 이동할 때 싣는다, store-scope.ts). storeIds 가
// 있으면 그것을(빈 값이면 「전체」 — 쿼리 객체에서는 scope ALL), 없으면 scope 를 쓴다. 둘 다 없으면 점포 조건이 정해지지 않은 것이라
// 필터가 헤더 범위로 채운다(store-filter.tsx).
// 기본값은 URL 에서 뺀다. 이상한 값은 오류 없이 기본값으로 돌린다. 체크 목록은 모르는 값만 버린다 — 남는 게 없으면
// 하나도 고르지 않은 것(0건)이다. node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "../../lib/browser-storage.ts";
import { SCOPE_PARAM, scopeKeyOf, scopeOfParam } from "../../lib/store-scope.ts";
import type { StoreListQuery } from "../../lib/stores.ts";
import { STORE_PAGE_SIZES, STORE_STATUSES, STORE_TYPES, type StoreStatus, type StoreType } from "../../lib/store-types.ts";

export type StoreView = "cards" | "table";
/**
 * storeIds 는 목록에서 고른 점포, scope 는 헤더 범위(null 이면 주소에 없음). api 에 보낼 조건은 storeListQueryOf 로 만든다.
 * statusesDefault 는 점포상태를 주소에 적지 않은 것 — 그 값은 서버가 고른 점포의 지금 상태로 정한다(withDefaultStatuses). 브라우저는
 * 폐점 여부를 세지 않는다: 로그인 정보의 점포 상태는 세션 동안 바뀌지 않아, 이 메뉴에서 폐점 처리한 점포를 서버와 다르게 본다.
 */
export type StoresQuery = StoreListQuery & { view: StoreView; scope: Scope | null; statusesDefault: boolean };
/** 주소에서 읽은 그대로 — 점포상태가 주소에 없으면 null 이고, 고른 점포에 폐점이 있는지 알아야 기본값이 정해진다(withDefaultStatuses) */
export type ParsedStoresQuery = Omit<StoresQuery, "statuses" | "statusesDefault"> & { statuses: StoreStatus[] | null };

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
  scope: null,
  statusesDefault: true,
};

/** 고를 수 있는 점포 수 — api 상한(ListStoresQueryDto storeIds 1000개)과 같다 */
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

const sameList = <T>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((x) => b.includes(x));

/** 점포상태 기본값 — 처음엔 폐점을 빼지만, 고른 점포에 폐점이 있으면 「전체」다(빼면 그 점포가 0건이 된다) */
export const defaultStatusesOf = (hasClosedStore: boolean): StoreStatus[] => (hasClosedStore ? [...STORE_STATUSES] : [...DEFAULT_STATUSES]);

export function parseStoresQuery(raw: RawSearch): ParsedStoresQuery {
  // 상한을 넘으면 api 가 400 이라 오류 화면으로 떨어지므로 첫 쪽으로 돌린다
  const page = positiveInt(first(raw.page) ?? "");
  const safePage = page !== null && page <= MAX_PAGE ? page : null;
  const pageSize = Number(first(raw.pageSize));
  const rawStoreIds = first(raw.storeIds);
  const storeIds = [
    ...new Set(
      (rawStoreIds ?? "")
        .split(",")
        .map(positiveInt)
        .filter((id): id is number => id !== null),
    ),
  ].slice(0, MAX_PICKED_STORES);
  const statuses = first(raw.statuses);
  return {
    page: safePage ?? 1,
    pageSize: STORE_PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_STORES_QUERY.pageSize,
    storeIds,
    // 하이픈은 빼고 숫자만 — api 가 일부만 넣어도 찾는다
    bizRegistrationNumber: (first(raw.bizRegistrationNumber) ?? "").replace(/[^0-9]/g, "").slice(0, 10),
    statuses: statuses === undefined ? null : listOf(statuses, STORE_STATUSES, DEFAULT_STATUSES),
    storeTypes: listOf<StoreType>(first(raw.storeTypes), STORE_TYPES, STORE_TYPES),
    view: first(raw.view) === "table" ? "table" : "cards",
    // 목록에서 고른 점포가 있으면 범위는 쓰지 않는다. 빈 storeIds 는 목록에서 비운 것 — 「전체」다
    scope: storeIds.length ? null : rawStoreIds !== undefined ? { type: "ALL" } : scopeOfParam(first(raw[SCOPE_PARAM])),
  };
}

/** 점포상태가 주소에 없으면 기본값으로 — 고른 점포에 폐점이 있으면 「전체」. 서버에서 고른 점포를 찾아 본 뒤 부른다 */
export const withDefaultStatuses = (query: ParsedStoresQuery, hasClosedStore: boolean): StoresQuery => ({
  ...query,
  statuses: query.statuses ?? defaultStatusesOf(hasClosedStore),
  statusesDefault: query.statuses === null,
});

/**
 * 고른 점포(목록에서 고른 것 · 범위의 점포 하나) 중 찾은 것만 남긴다 — 지워졌거나 볼 수 없게 된 점포(다른 BP 탭에서 복사한 주소 등)는 뺀다.
 * 모두 없어졌으면 「전체」로 적는다: 점포 조건이 비면 필터가 헤더 범위로 다시 채워, 뺐다는 안내도 함께 사라진다. missing 은 뺀 점포 수다.
 */
export function keepFoundStores(query: ParsedStoresQuery, foundIds: readonly number[]): { query: ParsedStoresQuery; missing: number } {
  const ids = pickedIdsOf(query);
  const kept = ids.filter((id) => foundIds.includes(id));
  if (kept.length === ids.length) return { query, missing: 0 };
  const storeIds = query.storeIds.length ? kept : [];
  const scope = storeIds.length ? null : { type: "ALL" as const };
  return { query: { ...query, storeIds, scope }, missing: ids.length - kept.length };
}

/** 이름을 찾아 칩으로 그릴 점포 — 목록에서 고른 점포, 없으면 범위가 점포 하나일 때 그 점포 */
export const pickedIdsOf = (query: Pick<StoresQuery, "storeIds" | "scope">): number[] =>
  query.storeIds.length ? query.storeIds : query.scope?.type === "STORE" ? [query.scope.storeId] : [];

/** api 에 보낼 조건 — 고른 점포는 storeIds, 범위가 직영 · 가맹 전체면 점포를 풀지 않고 점포유형으로 거른다(주소 · 요청이 길어지지 않게) */
export function storeListQueryOf(query: StoresQuery): StoreListQuery {
  const { page, pageSize, bizRegistrationNumber, statuses } = query;
  const scopeType = !query.storeIds.length && (query.scope?.type === "DIRECT" || query.scope?.type === "FRANCHISE") ? query.scope.type : null;
  const storeTypes = scopeType ? query.storeTypes.filter((t) => t === scopeType) : query.storeTypes;
  return { page, pageSize, bizRegistrationNumber, statuses, storeTypes, storeIds: pickedIdsOf(query) };
}

/**
 * 점포 조건 쿼리 — 고른 점포가 있으면 storeIds, 「전체」면 빈 storeIds, 아니면 범위(scope). 「전체」를 scope=ALL 로 적지 않는 것은
 * scope 가 헤더 범위를 뜻해서다 — 주소의 scope 로 헤더 범위를 맞추므로(admin-header.tsx) 목록에서 비운 것이 헤더까지 바꾸면 안 된다.
 */
function setStoreCondition(params: URLSearchParams, query: Pick<StoresQuery, "storeIds" | "scope">) {
  if (query.storeIds.length) params.set("storeIds", query.storeIds.join(","));
  else if (query.scope?.type === "ALL") params.set("storeIds", "");
  else if (query.scope) params.set(SCOPE_PARAM, scopeKeyOf(query.scope));
}

/**
 * 지금 검색 조건의 엑셀 주소(front 중계 경로). 쪽 · 보기는 빼고 조건만 싣는다. 점포상태는 늘 적는다 —
 * 중계 경로는 고른 점포에 폐점이 있는지 모르므로 화면에서 정한 값을 그대로 받는다.
 */
export function storesExcelHref(query: StoresQuery): string {
  const params = new URLSearchParams();
  setStoreCondition(params, query);
  if (query.bizRegistrationNumber) params.set("bizRegistrationNumber", query.bizRegistrationNumber);
  params.set("statuses", STORE_STATUSES.filter((s) => query.statuses.includes(s)).join(","));
  if (!sameList(query.storeTypes, STORE_TYPES)) params.set("storeTypes", STORE_TYPES.filter((t) => query.storeTypes.includes(t)).join(","));
  return `/stores/excel?${params}`;
}

/** 화면 주소. 점포상태는 사용자가 고친 것만 적는다 — 적지 않으면 서버가 고른 점포에 맞는 기본값을 정한다(statusesDefault) */
export function storesHref(query: StoresQuery): string {
  const params = new URLSearchParams();
  setStoreCondition(params, query);
  if (query.bizRegistrationNumber) params.set("bizRegistrationNumber", query.bizRegistrationNumber);
  if (!query.statusesDefault) params.set("statuses", STORE_STATUSES.filter((s) => query.statuses.includes(s)).join(","));
  if (!sameList(query.storeTypes, STORE_TYPES)) params.set("storeTypes", STORE_TYPES.filter((t) => query.storeTypes.includes(t)).join(","));
  if (query.view !== "cards") params.set("view", query.view);
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_STORES_QUERY.pageSize) params.set("pageSize", String(query.pageSize));
  const search = params.toString();
  return `/stores${search ? `?${search}` : ""}`;
}

/** 상세 · 등록으로 갈 때 지금 목록 주소를 함께 넘긴다 — [목록] · [취소]가 같은 조건 · 쪽으로 돌아온다(S-BAYAJS) */
export const withBack = (path: string, listHref: string) => (listHref === "/stores" ? path : `${path}?back=${encodeURIComponent(listHref)}`);
export const detailHrefOf = (listHref: string) => (id: number) => withBack(`/stores/${id}`, listHref);

/** 상세 · 수정에서 돌아갈 목록 주소. 넘어온 값이 점포 목록 주소가 아니면(다른 곳으로 보내려는 값) 기본 목록으로 */
export function backHrefOf(raw: string | string[] | undefined): string {
  const value = typeof raw === "string" ? raw : "";
  return /^\/stores(\?[^#]*)?$/.test(value) ? value : "/stores";
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다 — 4쪽에서 거르면 빈 쪽이 보인다 */
export function withStoreFilter(query: StoresQuery, next: Partial<StoresQuery>): StoresQuery {
  return { ...query, ...next, page: 1 };
}

/**
 * 고른 점포를 바꾼다. 비면 「전체」(주소에는 빈 storeIds — 헤더 범위로 다시 채우지 않는다). 점포상태를 사용자가 고치지 않았으면 그대로
 * 기본값으로 두어, 서버가 바뀐 점포에 맞게 정한다(폐점 점포를 고르면 「전체」). 사용자가 고친 상태는 그대로 둔다.
 */
export function withPickedStores(query: StoresQuery, ids: number[]): StoresQuery {
  return withStoreFilter(query, { storeIds: ids, scope: ids.length ? null : { type: "ALL" } });
}
