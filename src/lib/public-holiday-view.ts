// 플랫폼 휴일 관리(/public-holidays) 화면 계산. next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
// 화면 상태(연도 · 월 · 보기)는 주소에만 둔다. 사용자별 마지막 보기 방식 · 연월은 기억하지 않는다(SYSTEM-8) — 주소 없이 들어오면 늘 이번 달 캘린더다.

/**
 * 연도 선택 범위(S-DDGJKQ) — api 공식 휴일 테이블의 범위(CHECK public_holidays_year_range)와 같다.
 * 2051~2100 은 지금 양력 공휴일만 들어 있다 — 음양력 표가 2050년까지라서다(api 마이그레이션 team1_public_holidays, 명세 S-IZLOFH 와 다르다).
 */
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

/** api 경로. 캘린더는 그 달만, 목록은 그 해 전체를 받는다 — 목록에 month 가 실리면 한 달치만 오고 휴일 수도 함께 줄어 눈에 띄지 않는다. */
export function publicHolidaysApiPath(q: HolidayQuery): string {
  const search = new URLSearchParams({ year: String(q.year) });
  if (q.view === "calendar") search.set("month", String(q.month));
  return `/public-holidays?${search}`;
}

/**
 * 화면 상태를 옮긴다 — 탭 · 이전 · 다음 달 · 「오늘」이 쓴다. patch 를 먼저 덮고 shift 만큼 달을 옮긴다.
 * 범위 밖으로 가면 null(버튼을 막는다).
 */
export function moveHolidayQuery(q: HolidayQuery, { shift = 0, ...patch }: Partial<HolidayQuery> & { shift?: number }): HolidayQuery | null {
  const next = { ...q, ...patch };
  return shift ? shiftHolidayMonth(next, shift) : next;
}

/** 달을 n 만큼 옮긴다. 해를 넘기면 연도도 바뀌고, 2000년 1월 앞 · 2100년 12월 뒤는 null(버튼을 막는다). */
export function shiftHolidayMonth(q: HolidayQuery, n: number): HolidayQuery | null {
  const index = q.year * 12 + (q.month - 1) + n;
  const year = Math.floor(index / 12);
  return year < MIN_YEAR || year > MAX_YEAR ? null : { ...q, year, month: (index % 12) + 1 };
}

export interface CalendarCell<H> {
  day: number;
  /** `2026-09-24` */
  date: string;
  holiday: H | undefined;
  isToday: boolean;
}

/**
 * 달력 칸에 그날의 휴일과 오늘 표시를 붙인다. 앞뒤 달 칸은 null 이다.
 * 한 날짜에 한 행이다(api 테이블의 holiday_date 고유 인덱스) — 겹친 휴일은 저장된 이름이 이미 「어린이날 · 부처님오신날」처럼 묶여 온다.
 * 오늘이 휴일이어도 isToday 는 참이다 — 범례의 「오늘」을 달력에서 늘 찾을 수 있게.
 */
export function calendarCells<H extends { holidayDate: string }>(year: number, month: number, holidays: H[], today: string): (CalendarCell<H> | null)[][] {
  const byDate = new Map(holidays.map((h) => [h.holidayDate, h]));
  return calendarWeeks(year, month).map((week) =>
    week.map((day) => {
      if (day === null) return null;
      const date = dateKey(year, month, day);
      return { day, date, holiday: byDate.get(date), isToday: date === today };
    }),
  );
}

/** 동기화 실패 안내를 보일 해인가. failedYears 에는 올해 · 다음 해만 들어온다 — 그 밖의 해는 동기화 대상이 아니라 안내가 뜨지 않는다(SYSTEM-9). */
export const showsSyncFailure = (failedYears: number[], year: number) => failedYears.includes(year);

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

/** `2026-09-24` 꼴 날짜 키 — api 의 holidayDate · kstToday 와 같은 모양이다 */
export const dateKey = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

/** `2026-09-24` → `목`. 형식이 틀리거나 없는 날짜(`2026-02-30`)면 빈 문자열. 지역 시간대와 상관없이 날짜만 본다. */
export function weekdayOf(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return "";
  const [y, mo, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(y, mo - 1, day));
  // Date.UTC 는 없는 날짜를 다음 달로 넘겨 버리므로 되돌려 확인한다
  return d.getUTCFullYear() === y && d.getUTCMonth() === mo - 1 && d.getUTCDate() === day ? WEEKDAYS[d.getUTCDay()] : "";
}

/**
 * 「임시공휴일 · 선거일은 정부 발표 후 반영됩니다」 한 줄을 보일 해인가 — 다다음 해 이후만(S-DDGJKQ · SYSTEM-9).
 * 올해 · 다음 해는 동기화 배치가 정부 발표값으로 맞춘다(S-PPAXGO). 배치(WHALEERP-543)는 아직 없어 지금은 모든 해가 규칙 계산값이다.
 */
export const needsAnnouncementNote = (year: number, todayYear: number) => year >= todayYear + 2;

/** 연도 선택지 2000~2100 */
export const YEAR_OPTIONS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
