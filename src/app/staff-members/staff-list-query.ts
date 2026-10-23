// 직원 목록 URL 쿼리 ↔ 쿼리 객체. 화면 상태는 URL 에만 둔다 — 새로고침 · 링크 공유에도 같은 목록이다. 조작은
// router.replace 라 기록을 쌓지 않는다(뒤로 가기는 이 화면을 떠난다).
// 기본값은 URL 에서 뺀다. 이상한 page · pageSize · employmentStatus 는 오류 없이 기본값으로 돌린다. 체크 목록은 모르는
// 이름만 버린다 — 남는 게 없으면 하나도 고르지 않은 것(0건)이다.
// 점포 조건은 근로계약 목록(contract-list.ts)과 같은 네 가지다 — 목록에서 고른 점포(storeIds) · 목록에서 비운 「전체」(빈 storeIds) ·
// 헤더 범위(scope) · 정해지지 않음(필터가 헤더 범위로 채운다). 예전 점포명 주소(?store=)는 읽지 않는다 — 그 주소로 오면 점포 조건이
// 없는 것으로 보고(함께 실린 storeIds 도 버린다) 필터가 상단 범위로 채운다(근로계약 ?storeName= 과 같다).
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "../../lib/browser-storage.ts";
import {
  EMPLOYMENT_TYPES,
  JOIN_GROUPS,
  MAX_STORE_IDS,
  PAGE_SIZES,
  type EmploymentStatusFilter,
  type StaffListQuery,
} from "../../lib/staff-members.ts";
import { SCOPE_PARAM, scopeKeyOf, scopeOfParam } from "../../lib/store-scope.ts";

type RawSearch = Record<string, string | string[] | undefined>;

export const DEFAULT_STAFF_LIST_QUERY: StaffListQuery = {
  storeIds: [],
  storesCleared: false,
  scope: null,
  keyword: "",
  employmentTypes: [...EMPLOYMENT_TYPES],
  joinGroups: [...JOIN_GROUPS],
  employmentStatus: "EMPLOYED",
  page: 1,
  pageSize: 20,
};

const STATUS_FILTERS: readonly EmploymentStatusFilter[] = ["EMPLOYED", "RETIRED", "ALL"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** 쉼표 목록. 파라미터가 없으면 전부, 빈 값이면 하나도 고르지 않은 것. 순서는 화면 순서로 맞춘다. */
function listOf<T extends string>(raw: string | undefined, allowed: readonly T[]): T[] {
  if (raw === undefined) return [...allowed];
  const picked = new Set(raw.split(","));
  return allowed.filter((a) => picked.has(a));
}

const MAX_ID = 2_147_483_647;
/** api StaffMemberListQueryDto 상한. 넘긴 값은 400 이라 목록 전체가 오류 화면이 된다 — 여기서 먼저 막는다. */
export const MAX_KEYWORD_LENGTH = 50;
const MAX_PAGE = 1_000_000;

const textOf = (v: string | undefined) => v?.trim().slice(0, MAX_KEYWORD_LENGTH) ?? "";

/** 점포 id 쉼표 목록. int4 양의 정수만, 겹치면 하나만 남기고 api 상한(MAX_STORE_IDS)에서 자른다 — 주소에 직접 넣은 값으로 api 가 400 을 내지 않게 */
function storeIdsOf(raw: string): number[] {
  const ids = raw.split(",").filter((v) => /^[1-9]\d*$/.test(v)).map(Number).filter((n) => n <= MAX_ID);
  return [...new Set(ids)].slice(0, MAX_STORE_IDS);
}

export function parseStaffListQuery(raw: RawSearch): StaffListQuery {
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const status = first(raw.employmentStatus);
  // 예전 점포명 주소(store + 점포명에서 찾은 storeIds)는 점포 조건을 읽지 않는다 — 정해지지 않음으로 두면 필터가 상단 범위로 채운다
  const legacy = first(raw.store) !== undefined;
  const rawStoreIds = legacy ? undefined : first(raw.storeIds);
  const storeIds = rawStoreIds === undefined ? [] : storeIdsOf(rawStoreIds);
  return {
    storeIds,
    // 빈 storeIds 는 목록에서 비운 것 — 「전체」다(헤더 범위가 아니다). 고른 점포 · 비운 전체가 있으면 범위는 쓰지 않는다
    storesCleared: rawStoreIds !== undefined && !storeIds.length,
    scope: legacy || rawStoreIds !== undefined ? null : scopeOfParam(first(raw[SCOPE_PARAM])),
    keyword: textOf(first(raw.keyword)),
    employmentTypes: listOf(first(raw.employmentType), EMPLOYMENT_TYPES),
    joinGroups: listOf(first(raw.joinGroup), JOIN_GROUPS),
    employmentStatus: STATUS_FILTERS.find((s) => s === status) ?? DEFAULT_STAFF_LIST_QUERY.employmentStatus,
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
    pageSize: PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_STAFF_LIST_QUERY.pageSize,
  };
}

export function toStaffListSearch(query: StaffListQuery): string {
  const params = new URLSearchParams();
  // 점포 조건 — 고른 점포 → storeIds, 비운 「전체」 → 빈 storeIds, 아니면 헤더 범위 → scope(근로계약 toSearch 와 같다 — 목록에서 비운 것을
  // scope=ALL 로 적으면 헤더 범위까지 바뀐다)
  if (query.storeIds.length) params.set("storeIds", query.storeIds.join(","));
  else if (query.storesCleared) params.set("storeIds", "");
  else if (query.scope) params.set(SCOPE_PARAM, scopeKeyOf(query.scope));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.employmentTypes.length !== EMPLOYMENT_TYPES.length)
    params.set("employmentType", EMPLOYMENT_TYPES.filter((t) => query.employmentTypes.includes(t)).join(","));
  if (query.joinGroups.length !== JOIN_GROUPS.length)
    params.set("joinGroup", JOIN_GROUPS.filter((g) => query.joinGroups.includes(g)).join(","));
  if (query.employmentStatus !== DEFAULT_STAFF_LIST_QUERY.employmentStatus) params.set("employmentStatus", query.employmentStatus);
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_STAFF_LIST_QUERY.pageSize) params.set("pageSize", String(query.pageSize));
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** 목록 화면 주소 */
export const staffListHrefOf = (query: StaffListQuery) => `/staff-members${toStaffListSearch(query)}`;

/**
 * 목록에서 나가는 주소(상세)에 지금 목록 주소를 ?back= 으로 싣는다 — 상세의 [목록]이 같은 조건 · 쪽으로 돌아온다(점포 정보 관리 · TO-DO
 * withBack 과 같다 — path 에 쿼리가 없을 때만 쓴다). 기본 목록이면 싣지 않는다.
 */
export const withBack = (path: string, listHref: string) =>
  listHref === "/staff-members" ? path : `${path}?back=${encodeURIComponent(listHref)}`;

/**
 * 돌아갈 목록 주소(상세의 [목록]). 직원 목록 주소가 아니면(다른 곳으로 보내려는 값) 기본 목록으로. 받은 쿼리는 목록과 같은 규칙으로 걸러
 * 다시 만든다 — 모르는 이름 · 이상한 값은 따라오지 않는다. 같은 이름이 여럿이면 목록처럼 첫 값을 쓴다.
 */
export function backHrefOf(raw: string | string[] | undefined): string {
  const value = typeof raw === "string" ? raw : "";
  const matched = /^\/staff-members(?:\?([^#]*))?$/.exec(value);
  if (!matched) return "/staff-members";
  const search: RawSearch = {};
  for (const [key, v] of new URLSearchParams(matched[1] ?? "")) if (!(key in search)) search[key] = v;
  return staffListHrefOf(parseStaffListQuery(search));
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다 — 4쪽에서 거르면 빈 쪽이 보인다. */
export function withFilter(query: StaffListQuery, next: Partial<StaffListQuery>): StaffListQuery {
  return { ...query, ...next, page: 1 };
}

/** 고른 점포를 바꾼다. 비면 「전체」(주소에는 빈 storeIds — 헤더 범위로 다시 채우지 않는다). 첫 쪽으로 간다 */
export const withPickedStores = (query: StaffListQuery, ids: number[]) => withFilter(query, { storeIds: ids, storesCleared: !ids.length, scope: null });

/** 헤더 범위로 점포 조건을 건다(목록에서 고른 점포는 비운다). 첫 쪽으로 간다 */
export const withScopeCondition = (query: StaffListQuery, scope: Scope) => withFilter(query, { storeIds: [], storesCleared: false, scope });
