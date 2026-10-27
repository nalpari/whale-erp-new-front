// 급여명세서 목록 URL 쿼리 ↔ 조회 조건. 화면 상태는 URL 에만 둔다 — 새로고침 · 링크 공유에도 같은 목록이다(직원 목록과 같다).
// 달(month)은 늘 URL 에 싣는다 — 기본값(지난달)이 날마다 바뀌어 빼 두면 같은 링크가 다른 달을 연다.
// 점포 조건은 직원 목록(staff-list-query.ts)과 같은 네 가지다 — 목록에서 고른 점포(storeIds) · 목록에서 비운 「전체」(빈 storeIds) · 헤더
// 범위(scope) · 정해지지 않음(필터가 헤더 범위로 채운다). 예전 점포명 주소(?store=)는 읽지 않는다 — 함께 실린 storeIds 도 버리고 필터가
// 상단 범위로 채운다(직원 목록과 같다). 직원명은 staffName(api 와 같은 이름).
// 기본 건수(20)는 URL 에서 뺀다. 이상한 month · page · pageSize 는 오류 없이 기본값으로 돌린다. 상태 체크는 모르는 값만
// 버린다 — 남는 게 없으면 하나도 고르지 않은 것(0건)이다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "../../lib/browser-storage.ts";
import { PAGE_SIZES, PAYSLIP_STATUSES, payslipStoreCondition, previousMonth, type PayslipListQuery } from "../../lib/payslips.ts";
import { MAX_STORE_IDS } from "../../lib/staff-members.ts";
import { SCOPE_PARAM, scopeKeyOf, scopeOfParam } from "../../lib/store-scope.ts";

type RawSearch = Record<string, string | string[] | undefined>;

const MAX_PAGE = 1_000_000;
const MAX_ID = 2_147_483_647;
const DEFAULT_PAGE_SIZE = 20;
/** api PayslipListQueryDto 상한. 넘긴 값은 400 이라 목록 전체가 오류 화면이 된다 — 여기서 먼저 자른다. */
export const MAX_KEYWORD_LENGTH = 50;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const textOf = (v: string | undefined) => v?.trim().slice(0, MAX_KEYWORD_LENGTH) ?? "";

/** 점포 id 쉼표 목록(직원 목록과 같다). int4 양의 정수만, 겹치면 하나만 남기고 api 상한(MAX_STORE_IDS)에서 자른다 */
function storeIdsOf(raw: string): number[] {
  const ids = raw.split(",").filter((v) => /^[1-9]\d*$/.test(v)).map(Number).filter((n) => n <= MAX_ID);
  return [...new Set(ids)].slice(0, MAX_STORE_IDS);
}

/** 처음 여는 조건. today 는 한국 날짜(YYYY-MM-DD). */
export function defaultPayslipListQuery(today: string): PayslipListQuery {
  return {
    month: previousMonth(today),
    storeIds: [],
    storesCleared: false,
    scope: null,
    staffName: "",
    statuses: [...PAYSLIP_STATUSES],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export function parsePayslipListQuery(raw: RawSearch, today: string): PayslipListQuery {
  const month = first(raw.month);
  const status = first(raw.status);
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const picked = status === undefined ? null : new Set(status.split(","));
  // 예전 점포명 주소(store + 점포명에서 찾은 storeIds)는 점포 조건을 읽지 않는다 — 정해지지 않음으로 두면 필터가 상단 범위로 채운다
  const legacy = first(raw.store) !== undefined;
  const rawStoreIds = legacy ? undefined : first(raw.storeIds);
  const storeIds = rawStoreIds === undefined ? [] : storeIdsOf(rawStoreIds);
  return {
    month: month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : previousMonth(today),
    storeIds,
    // 빈 storeIds 는 목록에서 비운 것 — 「전체」다(헤더 범위가 아니다). 고른 점포 · 비운 전체가 있으면 범위는 쓰지 않는다
    storesCleared: rawStoreIds !== undefined && !storeIds.length,
    scope: legacy || rawStoreIds !== undefined ? null : scopeOfParam(first(raw[SCOPE_PARAM])),
    staffName: textOf(first(raw.staffName)),
    statuses: picked ? PAYSLIP_STATUSES.filter((s) => picked.has(s)) : [...PAYSLIP_STATUSES],
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
    pageSize: PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_PAGE_SIZE,
  };
}

export function toPayslipListSearch(query: PayslipListQuery): string {
  const params = new URLSearchParams({ month: query.month });
  // 점포 조건 — 고른 점포 → storeIds, 비운 「전체」 → 빈 storeIds, 아니면 헤더 범위 → scope(직원 목록과 같다)
  if (query.storeIds.length) params.set("storeIds", query.storeIds.join(","));
  else if (query.storesCleared) params.set("storeIds", "");
  else if (query.scope) params.set(SCOPE_PARAM, scopeKeyOf(query.scope));
  if (query.staffName) params.set("staffName", query.staffName);
  if (query.statuses.length !== PAYSLIP_STATUSES.length)
    params.set("status", PAYSLIP_STATUSES.filter((s) => query.statuses.includes(s)).join(","));
  if (query.page !== 1) params.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(query.pageSize));
  return `?${params}`;
}

/** 상세의 「목록」 주소. 목록이 상세 링크에 붙여 보낸 조건을 같은 규칙으로 걸러 돌려준다. */
export function payslipListHref(raw: RawSearch, today: string): string {
  return `/payslips${toPayslipListSearch(parsePayslipListQuery(raw, today))}`;
}

/** 필터 · 달 · 건수를 바꾼다. 쪽은 1로 돌린다. */
export function withFilter(query: PayslipListQuery, next: Partial<PayslipListQuery>): PayslipListQuery {
  return { ...query, ...next, page: 1 };
}

/** 고른 점포를 바꾼다. 비면 「전체」(주소에는 빈 storeIds — 헤더 범위로 다시 채우지 않는다). 첫 쪽으로 간다 */
export const withPickedStores = (query: PayslipListQuery, ids: number[]) => withFilter(query, { storeIds: ids, storesCleared: !ids.length, scope: null });

/** 헤더 범위로 점포 조건을 건다(목록에서 고른 점포는 비운다). 첫 쪽으로 간다 */
export const withScopeCondition = (query: PayslipListQuery, scope: Scope) => withFilter(query, { storeIds: [], storesCleared: false, scope });

/**
 * 「확정 N건 발송」(POST /payslips/send) 대상 — 목록과 같은 달 · 점포 조건(payslipStoreCondition) · 직원명. 건수(statusCounts)가 같은
 * 조건으로 세므로 보이는 N건과 보내는 대상이 같다. 점포 조건이 없으면 관리 범위 전체.
 */
export function sendTargetOf(query: PayslipListQuery): {
  month: string;
  storeIds?: number[];
  storeTypes?: ("DIRECT" | "FRANCHISE")[];
  staffName?: string;
} {
  return {
    month: query.month,
    ...payslipStoreCondition(query),
    ...(query.staffName && { staffName: query.staffName }),
  };
}
