// 직원 상세 요약 영역(WHALEERP-184, api #183 GET /staff-members/:id/summary/…)의 판정 · 글자. 화면은 summary-boxes.tsx 가 그린다.
// 테스트는 pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/summary-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../../lib/api-types.generated.ts";

type Schemas = components["schemas"];
export type ContractSummary = Schemas["StaffMemberContractSummaryResponseDto"];
export type WeekSchedule = Schemas["StaffMemberWeekScheduleResponseDto"];
export type PayslipSummary = Schemas["StaffMemberPayslipSummaryResponseDto"];
export type PayslipSummaryItem = Schemas["StaffMemberPayslipSummaryDto"];
export type TodoSummary = Schemas["StaffMemberTodoSummaryResponseDto"];

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

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

/**
 * 주소의 weekStart 값. YYYY-MM-DD 로 읽히는 날짜가 아니거나 1900~2999년 밖이면 null — 이번 주를 본다(api 도 빼면 이번 주다).
 * 연도를 막지 않으면 9999-12-27 의 다음 주가 다섯 자리 연도가 되어 링크가 깨지고, api 가 거절해 「다시 하기」만 되풀이한다.
 */
export function weekStartParam(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string" || !/^(19|2\d)\d{2}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = utc(raw);
  return !Number.isNaN(d.getTime()) && ymd(d) === raw ? raw : null;
}

/** 그 날짜가 든 주의 월요일. api 가 weekStart 를 맞추는 기준과 같다(월~일). */
export function mondayOf(date: string): string {
  const d = utc(date);
  return ymd(new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS));
}

/** 날짜를 days 만큼 옮긴다(주 넘김은 ±7). */
export function shiftDate(date: string, days: number): string {
  return ymd(new Date(utc(date).getTime() + days * DAY_MS));
}

/** 근무스케줄 표의 날짜 칸 — 데모와 같은 「10-21 화」. */
export function workDateText(workDate: string): string {
  return `${workDate.slice(5)} ${WEEKDAYS[utc(workDate).getUTCDay()]}`;
}

/** 근무시간(분) → 시간. 데모 「주간 근무시간 합계 37.5h」처럼 소수 한 자리. */
export function hoursText(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

/** 주 넘김 가운데 글자 — 2026-10-19 ~ 10-25 */
export function weekRangeText(monday: string): string {
  return `${monday} ~ ${shiftDate(monday, 6).slice(5)}`;
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

/**
 * 주 넘김 링크 — 지금 주소의 다른 값(목록으로 돌아갈 조회 조건)은 그대로 두고 weekStart 만 바꾼다. 같은 값이 여럿인 키도 그대로 싣는다.
 */
export function weekHref(search: Record<string, string | string[] | undefined>, weekStart: string): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (key === "weekStart" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  params.set("weekStart", weekStart);
  return `?${params}`;
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
