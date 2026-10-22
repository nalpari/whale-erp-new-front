// 근무스케줄 관리 URL 쿼리 ↔ 조회 조건 ↔ api 쿼리. 화면 상태는 URL 에만 둔다(TO-DO 목록 todo-list-query.ts 와 같은 규칙).
// 기본값은 URL 에서 빼고, 이상한 값은 오류 없이 그 칸만 기본값으로 돌린다. 날짜는 모두 한국 날짜 YYYY-MM-DD 다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { PAGE_SIZES, type PageSize } from "../../lib/staff-members.ts";

export type ScheduleView = "week" | "month";

export interface ScheduleQuery {
  /** 근무지. null 이면 아직 고르지 않았다 — 화면이 첫 점포로 보낸다 */
  storeId: number | null;
  view: ScheduleView;
  /** 주간 보기의 주(월요일) */
  week: string;
  /** 고른 날 — 주간은 그 주 안, 월간은 왼쪽 목록의 날 */
  day: string;
  /** 월간 보기의 달 YYYY-MM */
  month: string;
  /** 변경 이력 패널이 열렸는가 */
  history: boolean;
  /** 변경 이력 필터 — 변경 일시의 한국 날짜, 빈 값이면 열린 끝 */
  historyFrom: string;
  historyTo: string;
  historyStaffId: number | null;
  historyPage: number;
  historyPageSize: PageSize;
}

type RawSearch = Record<string, string | string[] | undefined>;

const MAX_ID = 2_147_483_647;
const MAX_PAGE = 1_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** 있는 날짜(YYYY-MM-DD)만 */
function dateOf(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const d = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === raw ? raw : "";
}
const idOf = (raw: string | undefined) => (raw && /^[1-9]\d{0,9}$/.test(raw) && Number(raw) <= MAX_ID ? Number(raw) : null);

export function addDays(day: string, n: number): string {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}
/** 그날이 든 주의 월요일 — 주는 월~일 */
export function mondayOf(day: string): string {
  const wd = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((wd + 6) % 7));
}
/** 달 YYYY-MM 에 n 달을 더한다 */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** 주간 보기가 읽는 7일 */
export const weekRange = (week: string) => ({ from: week, to: addDays(week, 6) });
/** 월간 달력이 읽는 42일 — 그 달 1일이 든 주의 월요일부터 6주(api 상한 42일) */
export function monthRange(month: string) {
  const from = mondayOf(`${month}-01`);
  return { from, to: addDays(from, 41) };
}

export function parseScheduleQuery(raw: RawSearch, today: string): ScheduleQuery {
  // 헤더 범위가 점포 하나면 ?scope=STORE:12 로 온다(store-scope.ts) — 고른 점포(?store=)가 앞선다
  const scope = first(raw.scope);
  const storeId = idOf(first(raw.store)) ?? (scope?.startsWith("STORE:") ? idOf(scope.slice(6)) : null);
  const view: ScheduleView = first(raw.view) === "month" ? "month" : "week";
  const weekRaw = dateOf(first(raw.week));
  const week = weekRaw ? mondayOf(weekRaw) : mondayOf(today);
  const monthRaw = first(raw.month);
  const month = monthRaw && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthRaw) ? monthRaw : today.slice(0, 7);
  const dayRaw = dateOf(first(raw.day));
  // 주간은 그 주 안의 날만 — 아니면 오늘(그 주면) · 월요일
  const inWeek = (d: string) => d >= week && d <= addDays(week, 6);
  const day =
    view === "week"
      ? dayRaw && inWeek(dayRaw)
        ? dayRaw
        : inWeek(today)
          ? today
          : week
      : dayRaw && dayRaw.slice(0, 7) === month
        ? dayRaw
        : today.slice(0, 7) === month
          ? today
          : `${month}-01`;
  const page = Number(first(raw.hpage));
  const pageSize = Number(first(raw.hsize));
  return {
    storeId,
    view,
    week,
    day,
    month,
    history: first(raw.history) === "1",
    historyFrom: dateOf(first(raw.hfrom)),
    historyTo: dateOf(first(raw.hto)),
    historyStaffId: idOf(first(raw.hstaff)),
    historyPage: Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1,
    historyPageSize: PAGE_SIZES.find((s) => s === pageSize) ?? 20,
  };
}

/** 조회 조건 → 주소 쿼리(? 포함, 없으면 ""). 오늘과 같은 기본값은 뺀다 */
export function toScheduleSearch(q: ScheduleQuery, today: string): string {
  const p = new URLSearchParams();
  if (q.storeId !== null) p.set("store", String(q.storeId));
  if (q.view === "month") {
    p.set("view", "month");
    if (q.month !== today.slice(0, 7)) p.set("month", q.month);
    if (q.day !== today && q.day !== `${q.month}-01`) p.set("day", q.day);
  } else {
    if (q.week !== mondayOf(today)) p.set("week", q.week);
    if (q.day !== today && q.day !== q.week) p.set("day", q.day);
  }
  if (q.history) {
    p.set("history", "1");
    if (q.historyFrom) p.set("hfrom", q.historyFrom);
    if (q.historyTo) p.set("hto", q.historyTo);
    if (q.historyStaffId !== null) p.set("hstaff", String(q.historyStaffId));
    if (q.historyPage !== 1) p.set("hpage", String(q.historyPage));
    if (q.historyPageSize !== 20) p.set("hsize", String(q.historyPageSize));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** 주간 · 월간 api 쿼리 */
export function scheduleApiSearch(q: ScheduleQuery & { storeId: number }): string {
  const { from, to } = q.view === "month" ? monthRange(q.month) : weekRange(q.week);
  return new URLSearchParams({ storeId: String(q.storeId), from, to }).toString();
}

/** 변경 이력 api 쿼리 */
export function historyApiSearch(q: ScheduleQuery & { storeId: number }): string {
  const p = new URLSearchParams({ storeId: String(q.storeId), page: String(q.historyPage), pageSize: String(q.historyPageSize) });
  if (q.historyFrom) p.set("from", q.historyFrom);
  if (q.historyTo) p.set("to", q.historyTo);
  if (q.historyStaffId !== null) p.set("staffMemberId", String(q.historyStaffId));
  return p.toString();
}

/** 다른 주 · 달 · 날로 옮긴다 — 이력 패널은 닫는다 */
export function moved(q: ScheduleQuery, next: Partial<Pick<ScheduleQuery, "view" | "week" | "day" | "month">>): ScheduleQuery {
  return { ...q, ...next, history: false };
}
