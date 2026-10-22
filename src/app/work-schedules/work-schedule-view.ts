// 근무스케줄 보기의 그림 계산 — 시간축 막대, 근무 인원 줄, 공백, 변경 이력 한 줄. 데모 docs/demo/src/staff-parts.mjs(schedWeek · coverRow)를 옮겼다.
// 시각은 api 가 준 한국 시각 HH:mm 이다. 종료가 시작보다 이르거나 같으면 다음 날이다(자정 넘김, STAFF-33).
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.

const DAY_MINUTES = 24 * 60;
const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hh = (h: number) => String(h).padStart(2, "0");
const hhmmOf = (minutes: number) => `${hh(Math.floor(minutes / 60))}:${hh(minutes % 60)}`;

/** 종료 시각 글자 — 다음 날 0시면 「24:00」, 다음 날이면 「익일 02:00」 */
export function endLabel(startTime: string, endTime: string): string {
  if (minutesOf(endTime) > minutesOf(startTime)) return endTime;
  return endTime === "00:00" ? "24:00" : `익일 ${endTime}`;
}
/** 「09:00~18:00」 · 「22:00~익일 02:00」 */
export const shiftLabel = (s: { startTime: string; endTime: string }) => `${s.startTime}~${endLabel(s.startTime, s.endTime)}`;

export interface Bar {
  /** 막대 왼쪽 · 폭(시간축 00~24시의 %) */
  left: number;
  width: number;
  label: string;
}

/** 그날(근무일) 시작한 근무 한 건의 막대. 자정을 넘으면 24시에서 자른다 — 글자는 「~익일 02:00」(STAFF-33) */
export function barOf(s: { startTime: string; endTime: string }): Bar {
  const start = minutesOf(s.startTime);
  let end = minutesOf(s.endTime);
  if (end <= start) end += DAY_MINUTES;
  return {
    left: (start / DAY_MINUTES) * 100,
    width: ((Math.min(end, DAY_MINUTES) - start) / DAY_MINUTES) * 100,
    label: shiftLabel(s),
  };
}

/** api 의 30분 칸 48개에서 근무가 있는 첫 칸 · 마지막 칸. 아무도 없으면 null */
function workedSpan(coverage: readonly number[]): { first: number; last: number } | null {
  const first = coverage.findIndex((n) => n > 0);
  if (first < 0) return null;
  const last = coverage.length - 1 - [...coverage].reverse().findIndex((n) => n > 0);
  return { first, last };
}

/**
 * 근무 인원 줄 24칸. 한 시간 칸은 그 안의 30분 두 칸 중 작은 값이다 — 30분짜리 공백도 0 으로 드러나게(계획 문서).
 * 그날 첫 근무 시작 전 · 마지막 근무 종료 뒤는 세지 않고 빈칸(null)이다(STAFF-37). 걸친 시간(09:30 시작)은 근무 안쪽 칸만 본다.
 * api 의 coverage 는 전날 시작해 자정을 넘어온 근무도 새벽 칸에 센다(Q4).
 */
export function hourCells(coverage: readonly number[]): (number | null)[] {
  const span = workedSpan(coverage);
  return Array.from({ length: 24 }, (_, h) => {
    if (!span) return null;
    const halves = [2 * h, 2 * h + 1].filter((i) => i >= span.first && i <= span.last);
    return halves.length ? Math.min(...halves.map((i) => coverage[i])) : null;
  });
}

export interface Gap {
  from: string;
  to: string;
  minutes: number;
}

/** 그날 첫 근무 시작부터 마지막 근무 종료 사이에 아무도 없는 구간(30분 칸 단위, STAFF-37). 근무가 없는 날은 없다 */
export function gapsOf(coverage: readonly number[]): Gap[] {
  const span = workedSpan(coverage);
  if (!span) return [];
  const gaps: Gap[] = [];
  for (let i = span.first; i <= span.last; i += 1) {
    if (coverage[i] !== 0) continue;
    const last = gaps.at(-1);
    if (last && minutesOf(last.to) === i * 30) {
      last.to = hhmmOf((i + 1) * 30);
      last.minutes += 30;
    } else gaps.push({ from: hhmmOf(i * 30), to: hhmmOf((i + 1) * 30), minutes: 30 });
  }
  return gaps;
}

/** 「1시간 30분」 · 「30분」 · 「2시간」 */
export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}시간` : "", m ? `${m}분` : ""].filter(Boolean).join(" ");
}

/** 칸 색 — 0 아무도 없음 · 1 혼자 근무 · 2 이상(데모 COVER) */
export const coverTone = (n: number) => (n === 0 ? "empty" : n === 1 ? "alone" : "many");

type HistoryValue = { workDate: string; startTime: string; endTime: string; breakMinutes: number };
type HistoryItem = {
  changeType: "CREATED" | "UPDATED" | "DELETED";
  staffName: string;
  changedBy: { name: string | null };
  before: HistoryValue | null;
  after: HistoryValue | null;
};

export const CHANGE_LABEL = { CREATED: "추가", UPDATED: "수정", DELETED: "삭제" } as const;

const mmdd = (day: string) => day.slice(5);
const timesOf = (v: HistoryValue) => `${v.startTime}-${endLabel(v.startTime, v.endTime)}`;

/**
 * 변경 이력 한 줄(목업 「서지안 09-04 13:00-21:30 → 09:00-17:00 · 정하윤」). 근무일이 바뀌면 뒤에도 날짜, 시각이 같고 휴게만 바뀌면 휴게를 적는다.
 * 값이 없는 쪽(옛 데이터)은 「—」. 주체 이름이 없으면 「관리자」.
 */
export function historyLine(item: HistoryItem): string {
  const who = item.changedBy.name ?? "관리자";
  const one = (v: HistoryValue | null) => (v ? `${mmdd(v.workDate)} ${timesOf(v)}` : "—");
  let body: string;
  if (item.changeType === "CREATED") body = one(item.after);
  else if (item.changeType === "DELETED") body = `${one(item.before)} 삭제`;
  else {
    const { before, after } = item;
    if (before && after && before.workDate === after.workDate && timesOf(before) === timesOf(after))
      body = `${one(before)} 휴게 ${before.breakMinutes}분 → ${after.breakMinutes}분`;
    else
      body = `${one(before)} → ${before && after && before.workDate === after.workDate ? timesOf(after) : one(after)}`;
  }
  return `${item.staffName} ${body} · ${who}`;
}
