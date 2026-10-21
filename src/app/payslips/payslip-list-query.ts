// 급여명세서 목록 URL 쿼리 ↔ 조회 조건. 화면 상태는 URL 에만 둔다 — 새로고침 · 링크 공유에도 같은 목록이다(직원 목록과 같다).
// 달(month)은 늘 URL 에 싣는다 — 기본값(지난달)이 날마다 바뀌어 빼 두면 같은 링크가 다른 달을 연다.
// 점포명 · 점포 id · 직원명은 직원 목록과 같은 이름(store · storeIds)과 규칙을 쓴다 — 직원명만 staffName(api 와 같은 이름).
// 기본 건수(20)는 URL 에서 뺀다. 이상한 month · page · pageSize 는 오류 없이 기본값으로 돌린다. 상태 체크는 모르는 값만
// 버린다 — 남는 게 없으면 하나도 고르지 않은 것(0건)이다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { PAGE_SIZES, PAYSLIP_STATUSES, previousMonth, type PayslipListQuery } from "../../lib/payslips.ts";

type RawSearch = Record<string, string | string[] | undefined>;

const MAX_PAGE = 1_000_000;
const MAX_ID = 2_147_483_647;
const DEFAULT_PAGE_SIZE = 20;
/** api PayslipListQueryDto 상한. 넘긴 값은 400 이라 목록 전체가 오류 화면이 된다 — 여기서 먼저 자른다. */
export const MAX_KEYWORD_LENGTH = 50;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const textOf = (v: string | undefined) => v?.trim().slice(0, MAX_KEYWORD_LENGTH) ?? "";

/** 점포 id 쉼표 목록(직원 목록과 같다). 점포명이 없으면 쓰지 않고, 점포명만 있고 파라미터가 없으면 null — 필터가 채운다. */
function storeIdsOf(raw: string | undefined, store: string): number[] | null {
  if (!store) return [];
  if (raw === undefined) return null;
  if (!raw) return [];
  const ids = raw.split(",").filter((v) => /^[1-9]\d*$/.test(v)).map(Number).filter((n) => n <= MAX_ID);
  return [...new Set(ids)];
}

/** 처음 여는 조건. today 는 한국 날짜(YYYY-MM-DD). */
export function defaultPayslipListQuery(today: string): PayslipListQuery {
  return { month: previousMonth(today), store: "", storeIds: [], staffName: "", statuses: [...PAYSLIP_STATUSES], page: 1, pageSize: DEFAULT_PAGE_SIZE };
}

export function parsePayslipListQuery(raw: RawSearch, today: string): PayslipListQuery {
  const month = first(raw.month);
  const status = first(raw.status);
  const page = Number(first(raw.page));
  const pageSize = Number(first(raw.pageSize));
  const picked = status === undefined ? null : new Set(status.split(","));
  const store = textOf(first(raw.store));
  return {
    month: month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : previousMonth(today),
    store,
    storeIds: storeIdsOf(first(raw.storeIds), store),
    staffName: textOf(first(raw.staffName)),
    statuses: picked ? PAYSLIP_STATUSES.filter((s) => picked.has(s)) : [...PAYSLIP_STATUSES],
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
    pageSize: PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_PAGE_SIZE,
  };
}

export function toPayslipListSearch(query: PayslipListQuery): string {
  const params = new URLSearchParams({ month: query.month });
  if (query.store) {
    params.set("store", query.store);
    // 아직 찾지 않은 것(null)은 빈 값으로 굳히지 않는다 — 빈 값은 「맞는 점포 없음」이다
    if (query.storeIds) params.set("storeIds", query.storeIds.join(","));
  }
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

/**
 * 「확정 N건 발송」(POST /payslips/send) 대상 — 목록과 같은 달 · 점포 · 직원명. 건수(statusCounts)가 같은 조건으로 세므로 보이는
 * N건과 보내는 대상이 같다. 점포명이 없으면 점포 id 는 싣지 않는다(관리 범위 전체).
 */
export function sendTargetOf(query: PayslipListQuery): { month: string; storeIds?: number[]; staffName?: string } {
  return {
    month: query.month,
    // 점포 이름은 있는데 맞는 점포를 못 찾았으면(null) 빈 배열 — 빼면 관리 범위 전체로 넓어진다
    ...(query.store && { storeIds: query.storeIds ?? [] }),
    ...(query.staffName && { staffName: query.staffName }),
  };
}
