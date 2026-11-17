// 근무스케줄 등록 · 수정 패널의 입력 규칙(#203). 화면에서 먼저 막는 것은 빈 칸 · 24시간 · 휴게만이고, 계약 · 퇴직일 · 겹침 · 가입 전 ·
// 가림은 api 문장을 그대로 보인다(계획 문서 화면 5). 시각은 30분 단위이고 종료가 시작보다 이르면 다음 날이다(STAFF-33).
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { endLabel } from "./work-schedule-view.ts";

const hh = (n: number) => String(n).padStart(2, "0");
const slot = (i: number) => `${hh(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`;
/** 시작 00:00 ~ 23:30 */
export const START_TIMES = Array.from({ length: 48 }, (_, i) => slot(i));
/** 종료 00:30 ~ 24:00. 시작보다 이르면 다음 날로 읽는다 */
export const END_TIMES = Array.from({ length: 48 }, (_, i) => slot(i + 1));

const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** 입력칸 그대로 — 휴게는 글자로 받는다(빈칸 · 이상한 값을 고르게 막으려고) */
export interface ShiftInput {
  startTime: string;
  endTime: string;
  breakMinutes: string;
}

export const EMPTY_SHIFT: ShiftInput = { startTime: "", endTime: "", breakMinutes: "" };

/** api 의 종료 「00:00」(자정에 끝남)은 선택지의 「24:00」이다 */
const endInput = (endTime: string) => (endTime === "00:00" ? "24:00" : endTime);

/** 등록된 근무스케줄 → 입력칸 */
export const shiftOf = (s: { startTime: string; endTime: string; breakMinutes: number }): ShiftInput => ({
  startTime: s.startTime,
  endTime: endInput(s.endTime),
  breakMinutes: String(s.breakMinutes),
});

/** 계약 근무시간(GET /defaults) → 입력칸. 계약에 근무시간이 없으면 빈칸으로 연다(#203) */
export function shiftOfDefaults(d: { startTime: string | null; endTime: string | null; breakMinutes: number | null }): ShiftInput {
  return { startTime: d.startTime ?? "", endTime: d.endTime ? endInput(d.endTime) : "", breakMinutes: d.breakMinutes === null ? "" : String(d.breakMinutes) };
}
/** 「근로계약 시간적용」을 보일까 — 계약에 시작 · 종료가 있을 때만(#203) */
export const hasDefaults = (d: { startTime: string | null; endTime: string | null } | null | undefined) => !!d?.startTime && !!d.endTime;

/** 근무 길이(분). 종료가 시작보다 이르거나 같으면 다음 날 */
export function workMinutes(startTime: string, endTime: string): number {
  const start = minutesOf(startTime);
  const end = minutesOf(endTime);
  return end > start ? end - start : end + 24 * 60 - start;
}

/** 종료 선택지 글자 — 시작을 골랐으면 「익일 02:00」처럼 다음 날을 드러낸다 */
export const endOptionLabel = (startTime: string, endTime: string) => (startTime ? endLabel(startTime, endTime) : endTime);

/** 근무 한 줄의 문제. 없으면 null */
export function shiftProblem(s: ShiftInput): string | null {
  if (!s.startTime || !s.endTime) return "시작시간과 종료시간을 선택해 주세요.";
  if (workMinutes(s.startTime, s.endTime) >= 24 * 60) return "근무시간은 24시간보다 짧아야 합니다.";
  if (!/^\d{1,4}$/.test(s.breakMinutes)) return "휴게시간을 0 이상의 분으로 넣어 주세요.";
  if (Number(s.breakMinutes) >= workMinutes(s.startTime, s.endTime)) return "휴게시간은 근무시간보다 짧아야 합니다.";
  return null;
}

/** 입력칸 → api 본문의 시각 · 휴게. shiftProblem 이 null 일 때만 부른다 */
export const shiftBody = (s: ShiftInput) => ({ startTime: s.startTime, endTime: s.endTime, breakMinutes: Number(s.breakMinutes) });

/** 기간 등록(WHALEERP-730) — 시작일 ~ 종료일 최대 92일(api RANGE_MAX_DAYS 와 같다) */
export const RANGE_MAX_DAYS = 92;
/** 한 번에 만드는 건수(날 수 × 직원 줄 수) 한도(api RANGE_MAX_ITEMS 와 같다) */
export const RANGE_MAX_ITEMS = 1000;
/** 요일 선택지 — 월요일부터, 값은 0(일) ~ 6(토) */
export const WEEKDAYS: readonly { value: number; label: string }[] = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
  { value: 0, label: "일" },
];
const DAY_MS = 24 * 60 * 60 * 1000;
const dateOf = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);

/** 시작일 ~ 종료일의 일수(둘 다 포함). 종료일이 앞서면 0 이하 */
export const rangeDays = (from: string, to: string) => Math.round((dateOf(to).getTime() - dateOf(from).getTime()) / DAY_MS) + 1;

/** 기간 안에서 고른 요일의 날(YYYY-MM-DD, 순서대로) — 휴일도 든다(쉬는 날은 요일로 뺀다, 2026-11-17 재영) */
export function rangeDates(from: string, to: string, weekdays: readonly number[]): string[] {
  const days = rangeDays(from, to);
  const picked = new Set(weekdays);
  const dates: string[] = [];
  for (let d = 0; d < days && d < RANGE_MAX_DAYS; d++) {
    const day = new Date(dateOf(from).getTime() + d * DAY_MS);
    if (picked.has(day.getUTCDay())) dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}

/** 기간을 막는 이유 — 종료일이 앞섬 · 92일 초과 · 요일 없음 · 고른 요일의 날 없음 · 건수 초과(직원 줄 수 rows). 없으면 null */
export function rangeProblem(from: string, to: string, weekdays: readonly number[], rows = 1): string | null {
  if (!to) return "종료일을 선택해 주세요.";
  const days = rangeDays(from, to);
  if (days < 1) return "종료일이 시작일보다 앞섭니다.";
  if (days > RANGE_MAX_DAYS) return `기간은 최대 ${RANGE_MAX_DAYS}일까지 정할 수 있습니다.`;
  if (weekdays.length === 0) return "요일을 하나 이상 선택해 주세요.";
  const count = rangeDates(from, to, weekdays).length;
  if (count === 0) return "기간 안에 고른 요일에 해당하는 날이 없습니다.";
  if (count * rows > RANGE_MAX_ITEMS) return `한 번에 근무스케줄 ${RANGE_MAX_ITEMS}건까지 등록할 수 있습니다. 기간이나 직원을 나눠 주세요.`;
  return null;
}

/**
 * 시작일을 바꿀 때의 종료일 — 하루 등록이었으면(종료일 = 시작일) 따라가고, 기간이면 그대로 두되 새 시작일보다 앞서게 되면 새
 * 시작일로 당긴다(그러면 하루 등록이 된다). 시작일을 비우면 종료일은 그대로
 */
export function nextToDate(prevFrom: string, prevTo: string, nextFrom: string): string {
  if (prevTo === prevFrom) return nextFrom;
  if (nextFrom && prevTo < nextFrom) return nextFrom;
  return prevTo;
}

/** 「11월 17일(화)」 — 건너뛴 날 목록 */
export function dayText(ymd: string): string {
  const d = dateOf(ymd);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${"일월화수목금토"[d.getUTCDay()]})`;
}
