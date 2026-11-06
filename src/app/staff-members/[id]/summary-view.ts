// 직원 상세 요약 영역(WHALEERP-184, api #183 GET /staff-members/:id/summary/…)의 판정 · 글자. 화면은 summary-boxes.tsx 가 그린다.
// 테스트는 pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/summary-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../../lib/api-types.generated.ts";
import { formatAmount } from "../../../lib/payslips.ts";
import { kstToday } from "../../../lib/staff-members.ts";
import { ENTRY_KIND_LABELS, laterDayMark, REVIEW_REASONS } from "../../attendance-records/attendance-query.ts";
import { addDays, mondayOf } from "../../work-schedules/work-schedule-query.ts";

type Schemas = components["schemas"];
export type ContractSummary = Schemas["StaffMemberContractSummaryResponseDto"];
export type PayslipSummary = Schemas["StaffMemberPayslipSummaryResponseDto"];
export type PayslipSummaryItem = PayslipSummary["recent"][number];
export type TodoSummary = Schemas["StaffMemberTodoSummaryResponseDto"];
export type WeekSchedule = Schemas["StaffMemberWeekScheduleResponseDto"];
export type WeekScheduleItem = WeekSchedule["items"][number];
export type TodoItem = Schemas["TodoItemDto"];
export type AttendanceItem = Schemas["PeriodAttendanceResponseDto"]["items"][number];

/**
 * 영역 메뉴 조회 권한이 없을 때 api 가 그 영역만 주는 403 문구(api READ_DENIED_MESSAGE). 다른 403(공통 「접근 권한이 없습니다.
 * 관리자에게 문의해 주세요.」 · 직원 앱 토큰 등)과 이 문구로 가른다 — 상태 코드만으로는 둘이 같다. 403 문구 네 번째로 확정(2026-10-21 재영).
 */
export const AREA_READ_DENIED_MESSAGE = "조회 권한이 없습니다.";

/**
 * 출퇴근 현황 영역의 403 문구. 이 영역 api(GET /attendance-records)는 영역 전용 문구가 아니라 일반 메뉴 가드를 쓰므로 출·퇴근 현황 조회 메뉴 권한이
 * 없으면 이 문구(api ACCESS_DENIED_MESSAGE)가 온다. 직원 상세는 이미 열려 있어 이 문구는 곧 그 영역 권한 없음이다.
 */
export const ACCESS_DENIED_MESSAGE = "접근 권한이 없습니다. 관리자에게 문의해 주세요.";

/** 한 영역을 받은 결과. forbidden 은 다시 해도 같아 안내만, error 는 「다시 하기」를 둔다. */
export type AreaResult<T> = { kind: "ok"; data: T } | { kind: "forbidden" } | { kind: "error" };

/**
 * 영역을 못 받았을 때. 403 이면서 문구가 영역 권한 문구일 때만 forbidden 이다. status 는 api 에 닿지 못했으면 null,
 * message 는 응답의 message(ApiError.message).
 */
export function areaFailureOf(status: number | null, message: string | null, options?: { includeAccessDenied?: boolean }): "forbidden" | "error" {
  if (status !== 403) return "error";
  return message === AREA_READ_DENIED_MESSAGE || (options?.includeAccessDenied === true && message === ACCESS_DENIED_MESSAGE) ? "forbidden" : "error";
}

/**
 * 한 영역을 여러 경로로 받을 때(TO-DO 칸 = 목록 + 요약) 영역 전체를 권한 안내로 막을지. 한 경로라도 영역 권한 403 이면 막는다 — api 는 두 경로에
 * 같은 영역 권한(TO-DO 관리 조회)을 걸지만(api #113), 한쪽만 403 이어도 다른 쪽 내용을 그리지 않는다.
 */
export function isAreaForbidden(...results: readonly Pick<AreaResult<unknown>, "kind">[]): boolean {
  return results.some((r) => r.kind === "forbidden");
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type RawSearch = Record<string, string | string[] | undefined>;

/** 근무스케줄 칸이 볼 주의 주소 값 — 그 주 월요일 YYYY-MM-DD. 근무스케줄 화면(work-schedule-query.ts)과 같은 이름이다 */
export const WEEK_KEY = "week";
// 주소에서 함께 빼는 지난 값 — WHALEERP-184 주 넘김의 weekStart, WHALEERP-185 기간 · 쪽 · 건수(2026-10-22 데모대로 되돌림)
const STALE_KEYS = ["weekStart", "schedulePeriod", "schedulePage", "schedulePageSize"];

const md = (date: string) => date.slice(5);

/**
 * 주소의 week 값 → 그 주 월요일. YYYY-MM-DD 로 읽히는 날짜가 아니거나 1900~2999년 밖이면 null — 이번 주를 본다(api 도 빼면 이번 주다).
 * 월요일이 아닌 날짜는 그 주 월요일로 맞춘다(근무스케줄 화면과 같다). 같은 키가 여럿이면 앞의 것.
 * 연도를 막지 않으면 9999-12-27 의 다음 주가 다섯 자리 연도가 되어 링크가 깨지고, api 가 거절해 「다시 하기」만 되풀이한다.
 */
export function weekParam(raw: string | string[] | undefined): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string" || !/^(19|2\d)\d{2}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? mondayOf(v) : null;
}

/** 근무스케줄 칸이 볼 주(월요일). 주소에 없거나 이상하면 이번 주. today 는 kstToday() */
export function scheduleWeekOf(search: RawSearch, today: string): string {
  return weekParam(search[WEEK_KEY]) ?? mondayOf(today);
}

/**
 * 근무스케줄 칸의 주를 옮기는 주소 — 지금 주소의 다른 값(목록으로 돌아갈 조회 조건)은 그대로 두고 week 만 바꾼다. 같은 값이 여럿인 키도
 * 그대로 싣는다. 이번 주면 주소에서 뺀다. 지난 주소 값(STALE_KEYS)도 함께 뺀다.
 */
export function weekHref(search: RawSearch, monday: string, today: string): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (key === WEEK_KEY || STALE_KEYS.includes(key) || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  if (monday !== mondayOf(today)) params.set(WEEK_KEY, monday);
  return `?${params}`;
}

/** 주 넘김 가운데 글자 — 데모 weekNav 「2026년 10-19 ~ 10-25」. 연도는 그 주 월요일의 해 */
export function weekLabel(monday: string): string {
  return `${monday.slice(0, 4)}년 ${md(monday)} ~ ${md(addDays(monday, 6))}`;
}

/** 그 주를 몇째 주로 세는 달(YYYY-MM) — 목요일이 든 달이다(데모 erp.js initWeeks, 9월 1주 = 08-31 ~ 09-06) */
export function weekMonthOf(monday: string): string {
  return addDays(monday, 3).slice(0, 7);
}

/** 달(YYYY-MM)을 n 달 옮긴다 */
export function shiftYearMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** 주 선택 달력 머리 — 「2026년 9월」 */
export function yearMonthLabel(month: string): string {
  return `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;
}

/** 주 선택 달력 줄의 화면 읽기 이름 — 「2026년 10월 3주 (10-19 ~ 10-25)」. month 는 그 판의 달(목요일이 든 달), n 은 몇째 주 */
export function weekRowLabel(month: string, n: number, monday: string): string {
  return `${yearMonthLabel(month)} ${n}주 (${md(monday)} ~ ${md(addDays(monday, 6))})`;
}

export type WeekRow = { monday: string; days: { date: string; day: number; inMonth: boolean }[] };

/**
 * 주 선택 달력 한 판 — 그 달에 목요일이 드는 주들(4~5줄)을 첫 주부터. 줄 번호 + 1 이 「N주」다. 날짜 7개는 월~일이고 다른 달 날은 inMonth=false(회색).
 */
export function weekRowsOf(month: string): WeekRow[] {
  const first = `${month}-01`;
  const wd = new Date(`${first}T00:00:00Z`).getUTCDay();
  const thursday = addDays(first, (4 - wd + 7) % 7);
  const rows: WeekRow[] = [];
  for (let monday = addDays(thursday, -3); addDays(monday, 3).slice(0, 7) === month; monday = addDays(monday, 7))
    rows.push({
      monday,
      days: Array.from({ length: 7 }, (_, i) => {
        const date = addDays(monday, i);
        return { date, day: Number(date.slice(8)), inMonth: date.slice(0, 7) === month };
      }),
    });
  return rows;
}

/** 근무시간(분) → 시간. 데모 「주간 근무시간 합계 37.5h」처럼 소수 한 자리. */
export function hoursText(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

/** 근무스케줄 표의 날짜 칸 — 데모와 같은 「10-21 화」. 연도는 칸 머리(weekLabel)가 보인다 */
export function workDateText(workDate: string): string {
  return `${md(workDate)} ${WEEKDAYS[new Date(`${workDate}T00:00:00Z`).getUTCDay()]}`;
}

/** 급여명세서 영역의 지급월 — 데모 「2026-08」. 급여 기간 시작일의 연 · 월이다 */
export function payMonthText(p: Pick<PayslipSummaryItem, "periodStartDate">): string {
  return p.periodStartDate.slice(0, 7);
}

/** 급여명세서 영역의 금액 칸 — 없거나(null) 0 이면 「-」(데모의 검토 중 줄 공제), 아니면 급여명세서 화면과 같은 쉼표 글자 */
export function payAmountText(amount: number | null): string {
  return amount ? formatAmount(amount) : "-";
}

/**
 * 급여명세서 영역이 빈 상태인가 — 최근 명세서가 없을 때. api 는 recent · unsentCount 를 같은 직원의 명세서 전체에서 세므로 recent 가 비면
 * 미발송도 0 이다. unsentCount 는 api 가 바뀔 때를 대비해 함께 본다.
 */
export function isPayslipSummaryEmpty(summary: Pick<PayslipSummary, "recent" | "unsentCount">): boolean {
  return summary.recent.length === 0 && summary.unsentCount === 0;
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

/** 수행 예정 — 오늘과 같은 해면 MM-DD, 아니면 YYYY-MM-DD. 시간이 있으면 뒤에 붙인다(TO-DO 목록 todo-row.ts dueText 와 같은 규칙) */
function dueText(dueDate: string, dueTime: string | null, today: string): string {
  const date = dueDate.slice(0, 4) === today.slice(0, 4) ? md(dueDate) : dueDate;
  return dueTime ? `${date} ${dueTime}` : date;
}

/**
 * TO-DO 칸의 「배정」 — 데모 detail.mjs 「개인 배정 · 08-28 14:00」 · 「근무지 전체 · 각자 수행 · 09-03」. 배정 · 수행 방식 한글은
 * getEnum("TodoAssigneeType") · getEnum("TodoExecutionMode")로 받은 것이고(개인 배정은 수행 방식을 보이지 않는다), 받지 못한 것은 빠진다 —
 * 영문 값을 보이지 않는다. 수행 예정 날짜는 늘 붙인다(api 에 늘 있다).
 */
export function todoAssignText(
  t: Pick<TodoItem, "assigneeType" | "executionMode" | "dueDate" | "dueTime">,
  assigneeLabel: ((v: string) => string) | null,
  modeLabel: ((v: string) => string) | null,
  today: string,
): string {
  const parts = [assigneeLabel?.(t.assigneeType), t.assigneeType === "ALL" ? modeLabel?.(t.executionMode) : undefined, dueText(t.dueDate, t.dueTime, today)];
  return parts.filter((p): p is string => !!p).join(" · ");
}

/** TO-DO 칸의 「상태」 색 글자. tone 은 CellView 의 글자 모양(mark-on 파랑 · muted 회색) */
export type TodoStatusMark = { text: string; style: "mark-on" | "muted" };

/**
 * TO-DO 칸의 「상태」 — 데모처럼 배지가 아닌 색 글자. 완료는 파랑 「MM-DD 완료」(completedAt 의 한국 날짜, 다른 해면 YYYY-MM-DD),
 * 대기는 회색, 진행 중은 TO-DO 목록과 같은 파랑(데모에 진행 중 줄이 없다). 상태 한글은 getEnum("TodoStatus") — 받지 못했으면 null(칸은 「-」).
 */
export function todoStatusMark(t: Pick<TodoItem, "status" | "completedAt">, statusLabel: ((v: string) => string) | null, today: string): TodoStatusMark | null {
  if (!statusLabel) return null;
  const label = statusLabel(t.status);
  if (t.status === "PENDING") return { text: label, style: "muted" };
  const completed = t.status === "DONE" && t.completedAt ? new Date(t.completedAt) : null;
  if (completed && !Number.isNaN(completed.getTime())) {
    const done = kstToday(completed);
    return { text: `${done.slice(0, 4) === today.slice(0, 4) ? md(done) : done} ${label}`, style: "mark-on" };
  }
  return { text: label, style: "mark-on" };
}

/** 출퇴근 현황 칸의 표 줄 한 개. 값이 없는 칸은 「-」다 */
export type AttendanceLine = { date: string; checkIn: string; checkOut: string; status: string; remark: string };

const NONE = "-";

/**
 * 출퇴근 현황 칸의 줄 만들기(2026-10-29 재영). 날짜 오름차순(같은 날은 api 순서 그대로), 줄 하나는 직원 · 날 하나다.
 * 출근 = 기록 시각(recordedAt)이 가장 이른 출근 · 퇴근 = 가장 늦은 퇴근(자정을 넘기면 출·퇴근 화면과 같은 「(다음날)」), 없으면 「-」(근무스케줄만 있는 날도 api 가 준 줄 그대로). 짝이 둘 이상이면 비고 끝에 「외 N회」(N = 짝 수 - 1).
 * 비고는 「 · 」로 잇는다 — 확인 필요 사유(출퇴근 현황 화면과 같은 넷, 짝 순서대로 겹치면 한 번) · 「보정됨」 · 「대신 등록」(글자는 출·퇴근 현황 조회 화면의 ENTRY_KIND_LABELS)
 * · 「외 N회」. 상태 · 사유 한글은 enum 라벨이고(화면에 한글 표를 따로 두지 않는다) 받지 못했거나 상태가 없으면 상태는 「-」, 사유는 빠진다 — 영문 값을 보이지 않는다.
 */
export function attendanceLines(
  items: readonly Pick<AttendanceItem, "date" | "status" | "pairs">[],
  statusLabel: ((v: string) => string) | null,
  reasonLabel: ((v: string) => string) | null,
): AttendanceLine[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.date.localeCompare(b.item.date) || a.index - b.index)
    .map(({ item }) => {
      const punches = item.pairs.flatMap((p) => [p.checkIn, p.checkOut]);
      const reasons = [...new Set(punches.flatMap((x) => (x?.reviewReason && REVIEW_REASONS.includes(x.reviewReason) ? [x.reviewReason] : [])))];
      // 시각 기준 — api 는 출근 없는 퇴근(orphan)을 맨 뒤에 붙여 pairs 가 시간순이 아니다
      const checkIns = item.pairs.flatMap((p) => (p.checkIn ? [p.checkIn] : []));
      const checkOuts = item.pairs.flatMap((p) => (p.checkOut ? [p.checkOut] : []));
      const earliest = checkIns.reduce<(typeof checkIns)[number] | null>((a, x) => (!a || x.recordedAt < a.recordedAt ? x : a), null);
      const latest = checkOuts.reduce<(typeof checkOuts)[number] | null>((a, x) => (!a || x.recordedAt > a.recordedAt ? x : a), null);
      const remarks = [
        ...(reasonLabel ? reasons.map((r) => reasonLabel(r)) : []),
        ...(punches.some((x) => x?.isCorrected) ? [ENTRY_KIND_LABELS.CORRECTED] : []),
        ...(punches.some((x) => x?.entryMethod === "PROXY") ? [ENTRY_KIND_LABELS.PROXY] : []),
        ...(item.pairs.length > 1 ? [`외 ${item.pairs.length - 1}회`] : []),
      ];
      return {
        date: item.date,
        checkIn: earliest ? earliest.time : NONE,
        checkOut: latest ? `${latest.time}${laterDayMark(item.date, latest.recordedAt)}` : NONE,
        status: item.status && statusLabel ? statusLabel(item.status) : NONE,
        remark: remarks.length ? remarks.join(" · ") : NONE,
      };
    });
}

/**
 * 출퇴근 현황 칸 「관리」 주소 — 출·퇴근 현황 조회 화면을 그 직원 · 근무지 · 보던 주로 연다(근무스케줄 링크와 같다). 직원은 staffMemberId 로 한 명만,
 * 퇴직 직원도 보이게 재직 상태는 전체, 일별 날(date)은 오늘이 그 주 안이면 오늘 아니면 월요일, 근태 요약 주(week)와 보정 목록 기간(fixFrom ~ fixTo = 그 주)은 monday 로 맞춘다. 화면이 오늘 뒤 · 석 달 앞을 알아서 줄인다.
 */
export function attendanceManageHref(staffMemberId: number, storeId: number, monday: string, today: string): string {
  // 일별 칸의 날 — 오늘이 그 주 안이면 오늘, 아니면 그 주 월요일(화면은 date 를 그대로 받는다)
  const date = today >= monday && today <= addDays(monday, 6) ? today : monday;
  const params = new URLSearchParams({
    storeIds: String(storeId),
    staffMemberId: String(staffMemberId),
    employment: "ALL",
    date,
    week: monday,
    fixFrom: monday,
    fixTo: addDays(monday, 6),
  });
  return `/attendance-records?${params}`;
}
