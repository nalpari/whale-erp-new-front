// 직원 목록 URL 쿼리 ↔ 쿼리 객체. 화면 상태는 URL 에만 둔다 — 새로고침 · 링크 공유에도 같은 목록이다. 조작은
// router.replace 라 기록을 쌓지 않는다(뒤로 가기는 이 화면을 떠난다).
// 기본값은 URL 에서 뺀다. 이상한 page · pageSize · employmentStatus 는 오류 없이 기본값으로 돌린다. 체크 목록은 모르는
// 이름만 버린다 — 남는 게 없으면 하나도 고르지 않은 것(0건)이다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import {
  EMPLOYMENT_TYPES,
  JOIN_GROUPS,
  PAGE_SIZES,
  type EmploymentStatusFilter,
  type StaffListQuery,
} from "../../lib/staff-members.ts";

type RawSearch = Record<string, string | string[] | undefined>;

export const DEFAULT_STAFF_LIST_QUERY: StaffListQuery = {
  store: "",
  storeIds: [],
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

/** 점포 id 쉼표 목록. 양의 정수만, 겹치면 하나만 남긴다. 점포명이 없으면 쓰지 않는다 — 점포 필터는 점포명이 연다. */
function storeIdsOf(raw: string | undefined, store: string): number[] {
  if (!store || !raw) return [];
  const ids = raw.split(",").filter((v) => /^[1-9]\d*$/.test(v)).map(Number).filter((n) => n <= MAX_ID);
  return [...new Set(ids)];
}

export function parseStaffListQuery(raw: RawSearch): StaffListQuery {
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const status = first(raw.employmentStatus);
  const store = first(raw.store)?.trim() ?? "";
  return {
    store,
    storeIds: storeIdsOf(first(raw.storeIds), store),
    keyword: first(raw.keyword)?.trim() ?? "",
    employmentTypes: listOf(first(raw.employmentType), EMPLOYMENT_TYPES),
    joinGroups: listOf(first(raw.joinGroup), JOIN_GROUPS),
    employmentStatus: STATUS_FILTERS.find((s) => s === status) ?? DEFAULT_STAFF_LIST_QUERY.employmentStatus,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    pageSize: PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_STAFF_LIST_QUERY.pageSize,
  };
}

export function toStaffListSearch(query: StaffListQuery): string {
  const params = new URLSearchParams();
  if (query.store) {
    params.set("store", query.store);
    params.set("storeIds", query.storeIds.join(","));
  }
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

/**
 * 상세의 「목록」 주소. 목록이 상세 링크에 붙여 보낸 조건을 그대로 돌려줘 검색 · 쪽이 풀리지 않게 한다.
 * 받은 쿼리는 목록과 같은 규칙으로 걸러 다시 만든다 — 모르는 이름 · 이상한 값은 따라오지 않는다.
 */
export function staffListHref(raw: RawSearch): string {
  return `/staff-members${toStaffListSearch(parseStaffListQuery(raw))}`;
}

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다 — 4쪽에서 거르면 빈 쪽이 보인다. */
export function withFilter(query: StaffListQuery, next: Partial<StaffListQuery>): StaffListQuery {
  return { ...query, ...next, page: 1 };
}
