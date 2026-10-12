// 직원 목록 URL 쿼리 ↔ 쿼리 객체. 화면 상태는 URL 에만 둔다 — 새로고침 · 뒤로 가기 · 링크 공유에도 같은 목록이다.
// 기본값은 URL 에서 빼고, 이상한 값은 오류 없이 그 칸의 기본값으로 돌린다.
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

export function parseStaffListQuery(raw: RawSearch): StaffListQuery {
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const status = first(raw.employmentStatus);
  return {
    store: first(raw.store)?.trim() ?? "",
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
  if (query.store) params.set("store", query.store);
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

/** 필터 · 건수를 바꾼다. 쪽은 1로 돌린다 — 4쪽에서 거르면 빈 쪽이 보인다. */
export function withFilter(query: StaffListQuery, next: Partial<StaffListQuery>): StaffListQuery {
  return { ...query, ...next, page: 1 };
}
