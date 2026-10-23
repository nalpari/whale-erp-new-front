import {
  BP_MASTER_PAGE_SIZES,
  BP_MASTER_SEARCH_TYPES,
  BP_MASTER_STATUSES,
  type BpMasterListQuery,
  type BpMasterPageSize,
  type BpMasterSearchType,
  type BpMasterStatusValue,
} from "../../lib/bp-master-paging.ts";

// 목록 조건 · 쪽 · 연 상세는 주소(?searchType · keyword · status · verification · page · pageSize · bp)에 둔다 —
// 새로 고쳐도, 링크를 나눠도 같은 화면이다. 상세 · 등록 · 수정은 따로 주소가 없는 슬라이드 패널이고(BP-6), 상세만 ?bp= 로 남긴다.
// 플랫폼 메뉴라 탭 BP 주소(/bp/{bpCodeId}/…)를 쓰지 않는다 — ?bp= 는 탭 BP 가 아니라 연 상세의 BP 다(2026-10-22).

export type BpMastersQuery = BpMasterListQuery & {
  /** 상세를 연 BP(bpCodeId) */
  bp?: number;
};

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const positiveInt = (v: string | undefined) => {
  const n = v && /^\d{1,9}$/.test(v) ? Number(v) : 0;
  return n >= 1 ? n : undefined;
};
const isSearchType = (v: string | undefined): v is BpMasterSearchType => BP_MASTER_SEARCH_TYPES.some((t) => t.value === v);
const isStatus = (v: string): v is BpMasterStatusValue => (BP_MASTER_STATUSES as readonly string[]).includes(v);

/** 셋 다 고른 것과 하나도 안 고른 것은 같은 전체다 — 빈 목록으로 맞춰 주소를 하나로 둔다 */
const normalizeStatuses = (statuses: BpMasterStatusValue[]) => {
  const picked = BP_MASTER_STATUSES.filter((s) => statuses.includes(s));
  return picked.length === BP_MASTER_STATUSES.length ? [] : picked;
};

export function parseBpMastersQuery(params: Params): BpMastersQuery {
  const searchType = one(params.searchType);
  const pageSize = Number(one(params.pageSize));
  const verification = one(params.verification);
  // 검색어는 50자까지 — 상호명이 가장 길다(50자)
  const keyword = one(params.keyword)?.trim().slice(0, 50).trim() || undefined;
  return {
    page: positiveInt(one(params.page)) ?? 1,
    pageSize: (BP_MASTER_PAGE_SIZES as readonly number[]).includes(pageSize) ? (pageSize as BpMasterPageSize) : 20,
    searchType: isSearchType(searchType) ? searchType : "BP_CODE",
    keyword,
    statuses: normalizeStatuses((one(params.status) ?? "").split(",").filter(isStatus)),
    verification: verification === "VERIFIED" || verification === "UNVERIFIED" ? verification : undefined,
    bp: positiveInt(one(params.bp)),
  };
}

export function bpMastersHref(query: Partial<BpMastersQuery>): string {
  const params = new URLSearchParams();
  // 검색 기준은 검색어가 있을 때만 뜻이 있다
  if (query.keyword) {
    if (query.searchType && query.searchType !== "BP_CODE") params.set("searchType", query.searchType);
    params.set("keyword", query.keyword);
  }
  const statuses = normalizeStatuses(query.statuses ?? []);
  if (statuses.length) params.set("status", statuses.join(","));
  if (query.verification) params.set("verification", query.verification);
  if (query.pageSize && query.pageSize !== 20) params.set("pageSize", String(query.pageSize));
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.bp) params.set("bp", String(query.bp));
  const search = params.toString();
  return `/bp-masters${search ? `?${search}` : ""}`;
}

/** 엑셀 중계 경로 — 목록과 같은 조건, 쪽 · 상세는 뺀다 */
export function bpMastersExcelHref(query: BpMastersQuery): string {
  return bpMastersHref({ ...query, page: 1, pageSize: 20, bp: undefined }).replace(/^\/bp-masters/, "/bp-masters/excel");
}
