// 급여명세서 목록 · 상세의 타입과 조회 조건 · 달 · 합계. 응답 타입은 whale-erp-api openapi 에서 생성한 것을 그대로 쓴다.
// api 를 부르는 함수는 payslips-api.ts 에 있다 — 이 파일은 next/* 를 읽지 않아 node --test 가 바로 읽는다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "./api-types.generated.ts";
import type { Scope } from "./browser-storage.ts";
import { pickedStoreIdsOf } from "./staff-members.ts";

type Schemas = components["schemas"];

export type PayslipStatus = Schemas["PayslipStatus"];
/** GET /enums 이름도 PayslipReviewReason 이다(Prisma 이름은 모델과 겹쳐 PayslipReviewReasonValue). */
export type PayslipReviewReasonValue = Schemas["PayslipReviewReason"];

/**
 * 목록 한 줄(GET /payslips). isMasked 면 근무지 · 급여 기간 밖의 칸은 모두 null 이다 — payslipId 도 null 이라 상세로 가지 못한다
 * (본사 제공 동의 없는 가맹 점포 직원, ATT-30). isAttendanceConfirmed 는 출퇴근 누락 사유가 없거나 모두 확인됐는가다.
 */
export type PayslipListItem = Schemas["PayslipListItemDto"];
/** total 은 모든 필터를 건 건수, statusCounts 는 상태 필터와 상관없이 점포 · 직원명 필터만 건 그 달 건수다(직원명으로 거르면 가린 줄은 뺀다). reviewPendingCount 는 그 달 · 고른 점포(직원명이면 그 이름)의 검토 대기 수다 — 가린 줄은 세지 않는다(ATT-30 v218). */
export type PayslipListResponse = Schemas["PayslipListResponseDto"];
/** 점포 · 달 급여 요약(GET /payslips/summary) — 네 상태 모두, 본사 역할은 본사 제공 동의한 가맹 직원만 센다(api 가 거른다, ATT-30). 점포 하나 화면의 직원 급여 카드가 쓴다 */
export type PayslipSummary = Schemas["PayslipSummaryResponseDto"];
/** 명세서 상세(GET /payslips/:id). 가려지는 명세서는 404 라 늘 직원 이름이 있다. */
export type PayslipDetail = Schemas["PayslipDetailResponseDto"];
/** 명세서 금액 한 줄. 금액은 adjustedAmount ?? calculatedAmount, 아직 넣지 않았으면 isEntered = false. */
export type PayslipItem = Schemas["PayslipItemDto"];
export type PayslipReviewReason = Schemas["PayslipReviewReasonDto"];

/** 작성 대상(GET /payslips/candidates). contractId 가 null 이면 유효한 근로계약이 없어, payslipId 가 있으면 이미 있어 만들 수 없다. */
export type PayslipCandidates = Schemas["PayslipCandidatesResponseDto"];
export type PayslipCandidate = Schemas["PayslipCandidateDto"];
/** 일괄 작성(POST /payslips/bulk) 결과 — 만든 것과 건너뛴 것(EXISTS 이미 있음 · NO_CONTRACT 계약 없음). */
export type PayslipBulkResult = Schemas["PayslipBulkCreateResponseDto"];
/** 「항목 추가」로 붙일 수 있는 추가 공제(GET /payslips/additional-items). */
export type PayslipAdditionalItem = Schemas["PayslipAdditionalItemDto"];
/** 지난 명세서 값(GET /payslips/:id/previous-values). 없으면 null. */
export type PayslipPrevious = Schemas["PayslipPreviousDto"];
/** 일괄 발송 결과(POST /payslips/send) — 보낸 것과 실패한 것(이유 · 문장). 가린 명세서는 이름 없이 MASKED. */
export type PayslipSendResult = Schemas["PayslipSendResultDto"];
/** 임시저장 본문(PUT /payslips/:id). */
export type SavePayslipBody = Schemas["SavePayslipDto"];

export const PAYSLIP_STATUSES: readonly PayslipStatus[] = ["DRAFTING", "REVIEWING", "CONFIRMED", "SENT"];

// ── 조회 조건 ──

export const PAGE_SIZES = [20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface PayslipListQuery {
  /** 급여 월 YYYY-MM */
  month: string;
  /**
   * 점포 조건은 직원 목록(StaffListQuery)과 같은 짝이다(상단 점포 범위 ↔ 목록 점포 필터): 목록에서 고른 점포(storeIds — 주소 storeIds=3,7),
   * 목록에서 비운 「전체」(storesCleared — 주소 storeIds=), 헤더 범위(scope — 주소 scope=ALL · DIRECT · FRANCHISE · STORE:12). 셋 다 없으면
   * 정해지지 않은 것이라 필터가 헤더 범위로 채운다.
   */
  storeIds: number[];
  storesCleared: boolean;
  scope: Scope | null;
  /** 직원명 검색어. 주면 본사 역할에게 가린 줄은 api 가 목록 · 상태 건수에서 뺀다 */
  staffName: string;
  statuses: PayslipStatus[];
  /**
   * 「분류 · 검토 대기만」 — 확인하지 않은 검토 사유가 남았거나 공제 미입력인 작성 중 · 검토 중 명세서만(공제 미입력은 api 가 공제 칸으로
   * 판정, WHALEERP-234 · 운영 정책 v221 PAY-06). 검토 대기는 상태가 아니라 분류다
   */
  reviewPending: boolean;
  page: number;
  pageSize: PageSize;
}

/**
 * 목록 · 일괄 발송의 점포 조건 — 직원 목록(staffListApiSearch)과 같다. 고른 점포 · 점포 하나 범위면 storeIds, 직영 · 가맹 범위면 점포를 풀지
 * 않고 storeTypes(그 유형의 폐점 점포는 api 가 뺀다). 범위 「전체」 · 비운 「전체」 · 정해지지 않음은 조건 없음(업무 범위 전체).
 */
export function payslipStoreCondition(query: Pick<PayslipListQuery, "storeIds" | "storesCleared" | "scope">): { storeIds?: number[]; storeTypes?: ("DIRECT" | "FRANCHISE")[] } {
  if (query.storesCleared) return {};
  const storeIds = pickedStoreIdsOf(query);
  if (storeIds.length) return { storeIds };
  if (query.scope?.type === "DIRECT" || query.scope?.type === "FRANCHISE") return { storeTypes: [query.scope.type] };
  return {};
}

/**
 * GET /payslips 쿼리. 상태를 모두 골랐으면 status 를 뺀다(전체). 하나도 고르지 않았을 때도 빼고 부른다 — api 는 빈 값을 400 으로 막는다.
 * 그때 줄은 버리고 상태 건수만 쓴다(payslips-api.ts getPayslips). 점포 조건은 payslipStoreCondition.
 */
export function payslipListApiSearch(query: PayslipListQuery): string {
  const params = new URLSearchParams({ month: query.month });
  if (query.statuses.length > 0 && query.statuses.length !== PAYSLIP_STATUSES.length)
    params.set("status", PAYSLIP_STATUSES.filter((s) => query.statuses.includes(s)).join(","));
  const { storeIds, storeTypes } = payslipStoreCondition(query);
  if (storeIds) params.set("storeIds", storeIds.join(","));
  if (storeTypes) params.set("storeTypes", storeTypes.join(","));
  if (query.staffName) params.set("staffName", query.staffName);
  if (query.reviewPending) params.set("reviewPending", "true");
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}

// ── 달 ──

/** today(YYYY-MM-DD)의 지난달 YYYY-MM. 급여명세서는 지난달 근무로 이번 달에 만든다 — 목록이 처음 여는 달이다. */
export function previousMonth(today: string): string {
  return shiftMonth(today.slice(0, 7), -1);
}

/** YYYY-MM 에서 n 달 뒤(음수면 앞). */
export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const index = y * 12 + (m - 1) + n;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** 「2026년 8월」 */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${y}년 ${m}월`;
}

// ── 금액 ──

/** 「2,840,000」 */
export const formatAmount = (n: number) => n.toLocaleString("ko-KR");

/** 입력칸 글자 → 원. 쉼표 · 공백을 지우고 숫자만이면 그 값, 비었으면 null(아직 넣지 않음), 그 밖은 NaN. */
export function parseAmount(text: string): number | null {
  const digits = text.replace(/[,\s]/g, "");
  if (digits === "") return null;
  return /^\d+$/.test(digits) ? Number(digits) : NaN;
}

/** 줄의 금액. 넣지 않았으면 null — 0 과 다르다(공제 미입력). */
export function itemAmount(item: Pick<PayslipItem, "adjustedAmount" | "calculatedAmount" | "isEntered">): number | null {
  if (!item.isEntered) return null;
  return item.adjustedAmount ?? item.calculatedAmount ?? 0;
}

/** 3.3% 원천징수를 켜면 소득세 · 지방소득세가 빠진다 — 3.3% 가 사업소득세 3% + 지방소득세 0.3% 라서다(okf/staff.md, PAY-03). */
const REPLACED_BY_WITHHOLDING = new Set(["INCOME_TAX", "LOCAL_INCOME_TAX"]);

/**
 * 이 명세서에 보이는 줄. 지급 · 추가 공제는 있는 줄 그대로, 기본 공제는 여섯(3.3% 를 켜면 4대보험 넷), 원천징수 둘은 3.3% 를
 * 켰을 때만. 원천징수 스위치는 파트타이머에게만 있어 정직원은 늘 기본 공제 여섯이다.
 */
export function isItemShown(item: Pick<PayslipItem, "itemCategory" | "itemCode">, isWithholdingApplied: boolean): boolean {
  if (item.itemCategory === "WITHHOLDING") return isWithholdingApplied;
  if (item.itemCategory === "BASIC") return !(isWithholdingApplied && REPLACED_BY_WITHHOLDING.has(item.itemCode));
  return true;
}

export interface PayslipTotals {
  gross: number;
  deduction: number;
  net: number;
  /** 보이는 공제 줄 가운데 아직 넣지 않은 칸 수. 하나라도 있으면 확정할 수 없다(PAY-02·03) */
  blankDeductions: number;
}

/** 지급 총액 · 공제 총액 · 실지급액. amounts 는 payslipItemId → 원(넣지 않았으면 null). 숨은 줄은 세지 않는다. */
export function payslipTotals(
  items: readonly Pick<PayslipItem, "payslipItemId" | "itemCategory" | "itemCode">[],
  amounts: ReadonlyMap<number, number | null>,
  isWithholdingApplied: boolean,
): PayslipTotals {
  let gross = 0;
  let deduction = 0;
  let blankDeductions = 0;
  for (const item of items) {
    if (!isItemShown(item, isWithholdingApplied)) continue;
    const amount = amounts.get(item.payslipItemId) ?? null;
    if (item.itemCategory === "EARNING") gross += amount ?? 0;
    else if (amount === null || Number.isNaN(amount)) blankDeductions += 1;
    else deduction += amount;
  }
  return { gross, deduction, net: gross - deduction, blankDeductions };
}
