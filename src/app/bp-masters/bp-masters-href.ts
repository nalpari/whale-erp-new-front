import {
  BP_MASTER_PAGE_SIZES,
  BP_MASTER_SEARCH_TYPES,
  BP_MASTER_STATUSES,
  type BpMasterListQuery,
  type BpMasterPageSize,
  type BpMasterSearchType,
  type BpMasterStatusValue,
} from "../../lib/bp-master-paging.ts";

// 목록 조건 · 쪽 · 연 상세 · 수정은 주소(?searchType · keyword · status · verification · page · pageSize · bp · edit)에 둔다 —
// 새로 고쳐도, 링크를 나눠도 같은 화면이다. 상세 · 등록 · 수정은 따로 경로가 없는 슬라이드 패널이고(BP-6), 상세는 ?bp= 로,
// 그 위에 겹친 수정은 ?edit=1 로 남겨 브라우저 뒤로 가기가 수정 → 상세 → 목록으로 하나씩 접힌다(플랫폼 관리자와 같다). 등록은 남기지 않는다.
// 플랫폼 메뉴라 탭 BP 주소(/bp/{bpCodeId}/…)를 쓰지 않는다 — ?bp= 는 탭 BP 가 아니라 연 상세의 BP 다(2026-10-22).

export type BpMastersQuery = BpMasterListQuery & {
  /** 상세를 연 BP(bpCodeId) */
  bp?: number;
  /** 상세 위에 수정 패널을 열었다 — bp 가 있을 때만 참이다 */
  edit?: boolean;
  /** 상태를 셋 다 껐다 — 결과 없음(주소 status=NONE, api 를 부르지 않는다 · 플랫폼 관리자와 같다, 2026-10-28 사용자 지정) */
  statusNone?: true;
};

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const positiveInt = (v: string | undefined) => {
  const n = v && /^\d{1,9}$/.test(v) ? Number(v) : 0;
  return n >= 1 ? n : undefined;
};
/** api 목록 조회의 page 상한(생성 타입 설명) */
const MAX_PAGE = 10_000_000;
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
  // 검색어는 50자까지 — 가장 긴 칸(상호명 · 대표자명)이 50자다
  const keyword = one(params.keyword)?.trim().slice(0, 50).trim() || undefined;
  const bp = positiveInt(one(params.bp));
  // api 쪽 번호 상한(1,000만)을 넘기면 목록 조회가 400 으로 화면 전체가 오류가 된다 — 넘는 주소는 1쪽으로 본다
  const page = positiveInt(one(params.page));
  return {
    page: page !== undefined && page <= MAX_PAGE ? page : 1,
    pageSize: (BP_MASTER_PAGE_SIZES as readonly number[]).includes(pageSize) ? (pageSize as BpMasterPageSize) : 20,
    searchType: isSearchType(searchType) ? searchType : "BP_CODE",
    keyword,
    statuses: normalizeStatuses((one(params.status) ?? "").split(",").filter(isStatus)),
    statusNone: one(params.status) === "NONE" ? true : undefined,
    verification: verification === "VERIFIED" || verification === "UNVERIFIED" ? verification : undefined,
    bp,
    edit: bp !== undefined && one(params.edit) === "1" ? true : undefined,
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
  if (query.statusNone) params.set("status", "NONE");
  else if (statuses.length) params.set("status", statuses.join(","));
  if (query.verification) params.set("verification", query.verification);
  if (query.pageSize && query.pageSize !== 20) params.set("pageSize", String(query.pageSize));
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.bp) params.set("bp", String(query.bp));
  if (query.bp && query.edit) params.set("edit", "1");
  const search = params.toString();
  return `/bp-masters${search ? `?${search}` : ""}`;
}

/**
 * 수정 패널을 세울지. 주소에 ?edit=1 이 있어도 고칠 수 없거나(canUpdate — 메뉴 수정 권한 · 탈퇴 BP 가 아님), 상세를 못 불러왔거나,
 * 화면에 남은 상세가 주소의 BP 가 아니면(다른 BP 로 옮기는 중) 열지 않는다 — 앞 BP 의 수정 폼이 다른 BP 주소 위에 열리지 않게
 * (platform-admins/admins-href.ts isEditOpen 과 같다).
 */
export function isEditOpen(
  query: Pick<BpMastersQuery, "bp" | "edit">,
  canUpdate: boolean,
  shown: { bp: { bpCodeId: number } } | { failed: string } | null,
): boolean {
  return Boolean(query.edit && canUpdate && shown && "bp" in shown && shown.bp.bpCodeId === query.bp);
}

/** 엑셀 중계 경로 — 목록과 같은 조건, 쪽 · 상세는 뺀다 */
export function bpMastersExcelHref(query: BpMastersQuery): string {
  return bpMastersHref({ ...query, page: 1, pageSize: 20, bp: undefined, edit: undefined }).replace(/^\/bp-masters/, "/bp-masters/excel");
}
