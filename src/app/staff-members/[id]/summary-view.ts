// 직원 상세 요약 영역(WHALEERP-184, api #183 GET /staff-members/:id/summary/… · 근무스케줄은 GET /staff-members/:id/work-schedules, WHALEERP-185)의 판정 · 글자. 화면은 summary-boxes.tsx 가 그린다.
// 테스트는 pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/summary-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../../lib/api-types.generated.ts";
import { PAGE_SIZES, type PageSize } from "../../../lib/staff-members.ts";

type Schemas = components["schemas"];
export type ContractSummary = Schemas["StaffMemberContractSummaryResponseDto"];
export type PayslipSummary = Schemas["StaffMemberPayslipSummaryResponseDto"];
export type PayslipSummaryItem = Schemas["StaffMemberPayslipSummaryDto"];
export type TodoSummary = Schemas["StaffMemberTodoSummaryResponseDto"];
export type StaffWorkSchedulePeriod = Schemas["StaffWorkSchedulePeriod"];
export type StaffWorkScheduleItem = Schemas["StaffMemberWorkScheduleListItemDto"];

/**
 * 영역 메뉴 조회 권한이 없을 때 api 가 그 영역만 주는 403 문구(api READ_DENIED_MESSAGE). 다른 403(공통 「접근 권한이 없습니다.
 * 관리자에게 문의해 주세요.」 · 직원 앱 토큰 등)과 이 문구로 가른다 — 상태 코드만으로는 둘이 같다. 403 문구 네 번째로 확정(2026-10-21 재영).
 */
export const AREA_READ_DENIED_MESSAGE = "조회 권한이 없습니다.";

/** 한 영역을 받은 결과. forbidden 은 다시 해도 같아 안내만, error 는 「다시 하기」를 둔다. */
export type AreaResult<T> = { kind: "ok"; data: T } | { kind: "forbidden" } | { kind: "error" };

/**
 * 영역을 못 받았을 때. 403 이면서 문구가 영역 권한 문구일 때만 forbidden 이다. status 는 api 에 닿지 못했으면 null,
 * message 는 응답의 message(ApiError.message).
 */
export function areaFailureOf(status: number | null, message: string | null): "forbidden" | "error" {
  return status === 403 && message === AREA_READ_DENIED_MESSAGE ? "forbidden" : "error";
}

/**
 * 한 영역을 여러 경로로 받을 때(TO-DO 칸 = 목록 + 요약) 영역 전체를 권한 안내로 막을지. 한 경로라도 영역 권한 403 이면 막는다 — api 는 두 경로에
 * 같은 영역 권한(TO-DO 관리 조회)을 걸지만(api #113), 한쪽만 403 이어도 다른 쪽 내용을 그리지 않는다.
 */
export function isAreaForbidden(...results: readonly Pick<AreaResult<unknown>, "kind">[]): boolean {
  return results.some((r) => r.kind === "forbidden");
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 근무스케줄 기간(api StaffWorkSchedulePeriod). 선택칸에 이 순서로 보인다. THIS_WEEK 가 기본(api 도 빼면 이번 주) */
export const STAFF_WORK_SCHEDULE_PERIODS = ["THIS_WEEK", "LAST_4_WEEKS", "LAST_3_MONTHS", "LAST_1_YEAR", "ALL"] as const satisfies readonly StaffWorkSchedulePeriod[];

/** 근무스케줄 표의 기간 선택칸 글자(WHALEERP-185 완료 조건). Record 라 api enum 에 값이 늘면 tsc 가 알린다 */
export const SCHEDULE_PERIOD_LABELS: Record<StaffWorkSchedulePeriod, string> = {
  THIS_WEEK: "이번 주",
  LAST_4_WEEKS: "최근 4주",
  LAST_3_MONTHS: "최근 3개월",
  LAST_1_YEAR: "최근 1년",
  ALL: "전체",
};

/** 근무스케줄 칸이 볼 쪽. 주소 값은 schedulePeriod · schedulePage · schedulePageSize — 직원 목록으로 돌아갈 조회 조건과 겹치지 않게 앞에 schedule 을 붙였다 */
export type ScheduleQuery = { period: StaffWorkSchedulePeriod; page: number; pageSize: PageSize };

type RawSearch = Record<string, string | string[] | undefined>;

const SCHEDULE_KEYS = { period: "schedulePeriod", page: "schedulePage", pageSize: "schedulePageSize" } as const;
const DEFAULT_SCHEDULE: ScheduleQuery = { period: "THIS_WEEK", page: 1, pageSize: 20 };
const MAX_PAGE = 1_000_000;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** 주소 → 근무스케줄 칸의 조건. 모르는 기간 · 1 미만이거나 정수가 아닌 쪽 · 20 · 50 · 100 이 아닌 건수는 오류 없이 기본값(이번 주 · 1쪽 · 20건)이다 */
export function parseScheduleQuery(raw: RawSearch): ScheduleQuery {
  const period = first(raw[SCHEDULE_KEYS.period]);
  const page = Number(first(raw[SCHEDULE_KEYS.page]));
  const pageSize = Number(first(raw[SCHEDULE_KEYS.pageSize]));
  return {
    period: STAFF_WORK_SCHEDULE_PERIODS.find((p) => p === period) ?? DEFAULT_SCHEDULE.period,
    page: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : DEFAULT_SCHEDULE.page,
    pageSize: PAGE_SIZES.find((s) => s === pageSize) ?? DEFAULT_SCHEDULE.pageSize,
  };
}

/** 기간 · 건수를 바꾼다. 쪽은 1로 돌린다(목록과 같다) */
export function withScheduleFilter(query: ScheduleQuery, next: Partial<Pick<ScheduleQuery, "period" | "pageSize">>): ScheduleQuery {
  return { ...query, ...next, page: 1 };
}

/**
 * 근무스케줄 칸을 옮기는 주소 — 지금 주소의 다른 값(목록으로 돌아갈 조회 조건)은 그대로 두고 schedule 값만 바꾼다. 같은 값이 여럿인 키도
 * 그대로 싣는다. 기본값(이번 주 · 1쪽 · 20건)은 주소에서 뺀다. weekStart(WHALEERP-184 주 넘김의 주소 값)는 읽지 않아 함께 뺀다.
 */
export function scheduleHref(search: RawSearch, query: ScheduleQuery): string {
  const params = new URLSearchParams();
  const own = new Set<string>([...Object.values(SCHEDULE_KEYS), "weekStart"]);
  for (const [key, value] of Object.entries(search)) {
    if (own.has(key) || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  if (query.period !== DEFAULT_SCHEDULE.period) params.set(SCHEDULE_KEYS.period, query.period);
  if (query.page !== DEFAULT_SCHEDULE.page) params.set(SCHEDULE_KEYS.page, String(query.page));
  if (query.pageSize !== DEFAULT_SCHEDULE.pageSize) params.set(SCHEDULE_KEYS.pageSize, String(query.pageSize));
  return `?${params}`;
}

/** 전체 쪽 수. 0건도 1쪽이다(목록과 같다) */
export function schedulePageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** 빈 표의 안내. 이번 주는 「이 주에」, 다른 기간은 「이 기간에」(2026-10-22 노영주) */
export function scheduleEmptyText(period: StaffWorkSchedulePeriod): string {
  return period === "THIS_WEEK" ? "이 주에 잡힌 근무스케줄이 없습니다." : "이 기간에 잡힌 근무스케줄이 없습니다.";
}

/** 표 아래 합계 줄의 이름. 이번 주는 「주간 근무시간 합계」, 다른 기간은 「기간 근무시간 합계」(2026-10-22 노영주) */
export function scheduleTotalLabel(period: StaffWorkSchedulePeriod): string {
  return period === "THIS_WEEK" ? "주간 근무시간 합계" : "기간 근무시간 합계";
}

/** 근무시간(분) → 시간. 데모 「주간 근무시간 합계 37.5h」처럼 소수 한 자리. */
export function hoursText(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

/** 근무스케줄 표의 날짜 칸 — 데모와 같은 「10-21 화」. 기간이 해를 넘으므로 오늘과 다른 해면 연도를 남긴다(「2025-10-21 화」) */
export function workDateText(workDate: string, today: string): string {
  const weekday = WEEKDAYS[new Date(`${workDate}T00:00:00Z`).getUTCDay()];
  return `${workDate.slice(0, 4) === today.slice(0, 4) ? workDate.slice(5) : workDate} ${weekday}`;
}

/** 급여명세서 영역의 급여 기간 — 2026-10-01 ~ 10-31. 끝 날짜가 다른 해면 연도를 남긴다(2025-12-21 ~ 2026-01-20). */
export function payPeriodText(p: Pick<PayslipSummaryItem, "periodStartDate" | "periodEndDate">): string {
  const sameYear = p.periodStartDate.slice(0, 4) === p.periodEndDate.slice(0, 4);
  return `${p.periodStartDate} ~ ${sameYear ? p.periodEndDate.slice(5) : p.periodEndDate}`;
}

/** 급여명세서 영역의 줄. 이번 달 · 최근 확정이 같은 명세서면 한 줄로 합친다. 둘 다 없으면 빈 배열. */
export function payslipRows(summary: Pick<PayslipSummary, "latestConfirmed" | "currentMonth">): { label: string; payslip: PayslipSummaryItem }[] {
  const { currentMonth, latestConfirmed } = summary;
  if (currentMonth && latestConfirmed && currentMonth.payslipId === latestConfirmed.payslipId)
    return [{ label: "이번 달 · 최근 확정", payslip: currentMonth }];
  return [
    ...(currentMonth ? [{ label: "이번 달", payslip: currentMonth }] : []),
    ...(latestConfirmed ? [{ label: "최근 확정", payslip: latestConfirmed }] : []),
  ];
}

/** 급여명세서 영역이 빈 상태인가 — 보일 명세서도 미발송도 없을 때 */
export function isPayslipSummaryEmpty(summary: PayslipSummary): boolean {
  return payslipRows(summary).length === 0 && summary.unsentCount === 0;
}

/** TO-DO 영역 아래 요약 줄 — 데모 「전체 6 · 완료 4 · 미완료 2」. 배정이 없으면 null(목록의 빈 상태가 말한다). */
export function todoFootText(summary: Pick<TodoSummary, "total" | "doneCount" | "notDoneCount">): { label: string; value: string } | null {
  if (summary.total === 0) return null;
  return { label: `전체 ${summary.total}`, value: `완료 ${summary.doneCount} · 미완료 ${summary.notDoneCount}` };
}

export type TodoHistory = TodoSummary["recentHistories"][number];

/**
 * TO-DO 최근 처리 이력 한 줄의 「무엇을」(2026-10-21 노영주 A안). 순서는 api 그대로다(changedAt 내림차순, 같으면 이력 ID 큰 것 먼저) —
 * 화면에서 다시 정렬하지 않는다. fromStatus 가 없으면 등록, 긴급 표시만 바꿨으면 그 말, 나머지는 「이전 → 이후」 상태다.
 * statusLabel 은 TodoStatus 한글이고, enum 을 받지 못했으면 null 이라 상태 변경은 이름 없이 「상태 변경」이다(영문 값을 보이지 않는다).
 */
export function todoHistoryText(h: Pick<TodoHistory, "fromStatus" | "toStatus" | "isUrgentChanged">, statusLabel: ((status: string) => string) | null): string {
  if (h.fromStatus === null) return "등록";
  if (h.isUrgentChanged) return "긴급 표시 변경";
  return statusLabel ? `${statusLabel(h.fromStatus)} → ${statusLabel(h.toStatus)}` : "상태 변경";
}
