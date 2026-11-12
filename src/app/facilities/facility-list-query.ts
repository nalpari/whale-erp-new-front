// 시설물 · 장비 목록 URL 쿼리 ↔ 조회 조건 ↔ api 쿼리. 화면 상태는 URL 에만 둔다(TO-DO 목록 todo-list-query.ts 와 같은 규칙).
// 기본값은 URL 에서 빼고, 이상한 값은 오류 없이 그 칸만 기본값으로 돌린다.
// 점포 조건은 점포 목록(stores-query.ts)과 같은 네 가지다 — 목록에서 고른 점포(storeIds) · 목록에서 비운 「전체」(빈 storeIds) · 헤더 범위(scope) ·
// 정해지지 않음(필터가 헤더 범위로 채운다). api 는 점포유형 조건이 없어 직영 · 가맹 범위는 필터가 그 점포들로 풀어 storeIds 로 바꾼다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "../../lib/browser-storage.ts";
import { SCOPE_PARAM, scopeKeyOf, scopeOfParam } from "../../lib/store-scope.ts";
import { MAX_PICKED_STORES, pickedIdsOf } from "../stores/stores-query.ts";
import { isFacilityGroup, type FacilityGroupCode } from "./facility-form-model.ts";

/** 한 쪽 건수 — api 가 50 · 100 만 받는다(기본 50) */
export const FACILITY_PAGE_SIZES = [50, 100] as const;
export type FacilityPageSize = (typeof FACILITY_PAGE_SIZES)[number];

export interface FacilityListQuery {
  storeIds: number[];
  storesCleared: boolean;
  scope: Scope | null;
  /** 운영상태 — 빈 값이면 전체 */
  status: string;
  /** 그룹 — 빈 값이면 전체 */
  group: FacilityGroupCode | "";
  /** 분류 — 그룹을 고른 경우에만(PL-3). 그룹이 없으면 늘 빈 값 */
  category: string;
  keyword: string;
  page: number;
  pageSize: FacilityPageSize;
}

type RawSearch = Record<string, string | string[] | undefined>;

export const DEFAULT_FACILITY_LIST_QUERY: FacilityListQuery = {
  storeIds: [],
  storesCleared: false,
  scope: null,
  status: "",
  group: "",
  category: "",
  keyword: "",
  page: 1,
  pageSize: 50,
};

const MAX_ID = 2_147_483_647;
const MAX_PAGE = 1_000_000;
/** 공통코드 값 — 영문 대문자 · 숫자 · 밑줄 20자(1팀 상세코드 값 규칙). 다른 글자는 버린다 */
const CODE = /^[A-Z0-9_]{1,20}$/;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const idOf = (v: string) => (/^[1-9]\d*$/.test(v) && Number(v) <= MAX_ID ? Number(v) : null);
const codeOf = (v: string | undefined) => (v && CODE.test(v) ? v : "");

export function parseFacilityListQuery(raw: RawSearch): FacilityListQuery {
  const rawStoreIds = first(raw.storeIds);
  const storeIds = [...new Set((rawStoreIds ?? "").split(",").map(idOf).filter((id) => id !== null))].slice(0, MAX_PICKED_STORES);
  const group = first(raw.group) ?? "";
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const validGroup = isFacilityGroup(group) ? group : "";
  return {
    storeIds,
    storesCleared: rawStoreIds !== undefined && !storeIds.length,
    scope: rawStoreIds !== undefined ? null : scopeOfParam(first(raw[SCOPE_PARAM])),
    status: codeOf(first(raw.status)),
    group: validGroup,
    // 그룹 없는 분류는 api 가 400 이라 버린다
    category: validGroup ? codeOf(first(raw.category)) : "",
    keyword: (first(raw.keyword) ?? "").trim().slice(0, 100),
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
    pageSize: FACILITY_PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_FACILITY_LIST_QUERY.pageSize,
  };
}

export function toFacilityListSearch(q: FacilityListQuery): string {
  const params = new URLSearchParams();
  if (q.storeIds.length) params.set("storeIds", q.storeIds.join(","));
  else if (q.storesCleared) params.set("storeIds", "");
  else if (q.scope) params.set(SCOPE_PARAM, scopeKeyOf(q.scope));
  if (q.status) params.set("status", q.status);
  if (q.group) params.set("group", q.group);
  if (q.group && q.category) params.set("category", q.category);
  if (q.keyword) params.set("keyword", q.keyword);
  if (q.page !== 1) params.set("page", String(q.page));
  if (q.pageSize !== DEFAULT_FACILITY_LIST_QUERY.pageSize) params.set("pageSize", String(q.pageSize));
  const search = params.toString();
  return search ? `?${search}` : "";
}

export const facilityListHref = (q: FacilityListQuery) => `/facilities${toFacilityListSearch(q)}`;

/** 직영 · 가맹 범위 — api 에 점포유형 조건이 없어 필터가 그 점포들(storeIds)로 바꿔야 조회할 수 있다 */
export const needsScopeStores = (q: Pick<FacilityListQuery, "storeIds" | "scope">) =>
  !q.storeIds.length && (q.scope?.type === "DIRECT" || q.scope?.type === "FRANCHISE");

/**
 * GET /facilities 쿼리. 점포는 고른 점포 · 점포 하나 범위면 storeIds(쉼표), 전체 · 비운 「전체」면 싣지 않는다(볼 수 있는 점포 전체).
 * 직영 · 가맹 범위면 아직 점포로 풀지 않아 null — 목록은 조회하지 않고 필터가 storeIds 로 바꾼다.
 */
export function facilityListApiSearch(q: FacilityListQuery): string | null {
  if (needsScopeStores(q)) return null;
  const params = new URLSearchParams();
  const storeIds = pickedIdsOf(q);
  if (storeIds.length) params.set("storeIds", storeIds.join(","));
  if (q.status) params.set("facilityStatusCode", q.status);
  if (q.group) params.set("facilityGroupCode", q.group);
  if (q.group && q.category) params.set("facilityCategoryCode", q.category);
  if (q.keyword) params.set("keyword", q.keyword);
  params.set("page", String(q.page));
  params.set("pageSize", String(q.pageSize));
  return params.toString();
}

/** 상세 · 등록으로 갈 때 지금 목록 주소를 ?back= 으로 넘긴다 — [목록] · [취소]가 같은 조건 · 쪽으로 돌아온다 */
export const withBack = (path: string, listHref: string) => (listHref === "/facilities" ? path : `${path}?back=${encodeURIComponent(listHref)}`);

/** 상세 · 등록 · 수정에서 돌아갈 목록 주소. 시설물 목록 주소가 아니면(다른 곳으로 보내려는 값) 기본 목록으로 */
export function backHrefOf(raw: string | string[] | undefined): string {
  const value = typeof raw === "string" ? raw : "";
  return /^\/facilities(\?[^#]*)?$/.test(value) ? value : "/facilities";
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다. 그룹을 바꾸면 분류는 「전체」로 돌아간다(PL-3) */
export function withFilter(q: FacilityListQuery, next: Partial<FacilityListQuery>): FacilityListQuery {
  const groupChanged = next.group !== undefined && next.group !== q.group;
  return { ...q, ...next, ...(groupChanged && next.category === undefined ? { category: "" } : {}), page: 1 };
}

/** 고른 점포를 바꾼다. 비면 「전체」(주소에는 빈 storeIds — 헤더 범위로 다시 채우지 않는다) */
export const withPickedStores = (q: FacilityListQuery, ids: number[]) => withFilter(q, { storeIds: ids, storesCleared: !ids.length, scope: null });

/** 헤더 범위로 점포 조건을 건다(목록에서 고른 점포는 비운다) */
export const withScopeCondition = (q: FacilityListQuery, scope: Scope) => withFilter(q, { storeIds: [], storesCleared: false, scope });

/** 쪽이 비었을 때 갈 주소 — 1쪽이 아닌데 줄이 없으면 남은 마지막 쪽. 그대로 두면 되면 null */
export function emptyPageHref(q: FacilityListQuery, rowCount: number, total: number): string | null {
  if (rowCount > 0 || q.page === 1) return null;
  return facilityListHref({ ...q, page: Math.max(1, Math.ceil(total / q.pageSize)) });
}

/** 조건이 하나도 없는 조회인가 — 0건일 때 「등록된 …」과 「조건에 맞는 …」을 가르는 데 쓴다 */
export const isUnfiltered = (q: FacilityListQuery) => !pickedIdsOf(q).length && !q.status && !q.group && !q.keyword;
