// 플랫폼 휴일 관리(/public-holidays) 화면 계산. next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
// 화면 상태(연도 · 월 · 보기)는 주소에만 둔다. 사용자별 마지막 보기 방식 · 연월은 기억하지 않는다(SYSTEM-8) — 주소 없이 들어오면 늘 이번 달 캘린더다.

/** 연도 선택 범위(S-DDGJKQ) — api 공식 휴일 테이블의 범위(CHECK public_holidays_year_range)와 같다. 2051~2100 은 지금 양력 공휴일만 들어 있다(api okf public-holidays). */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

export type HolidayView = "calendar" | "list";

export interface HolidayQuery {
  year: number;
  /** 1~12. 목록 보기도 값을 지녀 캘린더로 돌아가면 보던 달이 열린다. */
  month: number;
  view: HolidayView;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
export const WEEKDAY_HEADERS = WEEKDAYS;

type Params = Record<string, string | string[] | undefined>;

const intIn = (value: string | string[] | undefined, min: number, max: number): number | null => {
  const n = typeof value === "string" && /^\d{1,4}$/.test(value) ? Number(value) : NaN;
  return n >= min && n <= max ? n : null;
};

/** 주소 → 화면 상태. 없거나 틀린 값은 오늘(한국 날짜 `YYYY-MM-DD`)의 연월 · 캘린더로 둔다. */
export function parseHolidayQuery(params: Params, today: string): HolidayQuery {
  return {
    year: intIn(params.year, MIN_YEAR, MAX_YEAR) ?? Number(today.slice(0, 4)),
    month: intIn(params.month, 1, 12) ?? Number(today.slice(5, 7)),
    view: params.view === "list" ? "list" : "calendar",
  };
}

/** 화면 상태 → 주소. 캘린더가 기본이라 view 는 목록일 때만 남긴다. */
export function holidaysHref(q: HolidayQuery): string {
  const search = new URLSearchParams({ year: String(q.year), month: String(q.month) });
  if (q.view === "list") search.set("view", "list");
  return `/public-holidays?${search}`;
}

/** 달을 n 만큼 옮긴다. 해를 넘기면 연도도 바뀌고, 2000년 1월 앞 · 2100년 12월 뒤는 null(버튼을 막는다). */
export function shiftHolidayMonth(q: HolidayQuery, n: number): HolidayQuery | null {
  const index = q.year * 12 + (q.month - 1) + n;
  const year = Math.floor(index / 12);
  return year < MIN_YEAR || year > MAX_YEAR ? null : { ...q, year, month: (index % 12) + 1 };
}

/** 그 달의 주 단위 칸. 앞뒤 달 칸은 null 로 비운다(S-DDGJKQ). 주 수는 달마다 4~6주다. */
export function calendarWeeks(year: number, month: number): (number | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => {
    const day = i - first + 1;
    return day >= 1 && day <= days ? day : null;
  });
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `2026-09-24` 꼴 날짜 키 */
export const dateKey = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

/** `2026-09-24` → `목`. 깨진 값이면 빈 문자열. 지역 시간대와 상관없이 날짜만 본다. */
export function weekdayOf(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? "" : WEEKDAYS[d.getUTCDay()];
}

/**
 * 「임시공휴일 · 선거일은 정부 발표 후 반영됩니다」 한 줄을 보일 해인가 — 다다음 해 이후만(S-DDGJKQ · SYSTEM-9).
 * 올해 · 다음 해는 동기화 배치가 정부 발표값으로 맞춘다(S-PPAXGO).
 */
export const needsAnnouncementNote = (year: number, todayYear: number) => year >= todayYear + 2;

/** 연도 선택지 2000~2100 */
export const YEAR_OPTIONS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
