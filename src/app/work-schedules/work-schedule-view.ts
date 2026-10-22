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

/** 전날 시작해 그날로 넘어온 근무가 덮는 30분 칸마다의 인원(48칸). 전날 근무스케줄 중 자정을 넘는 것만 본다 */
export function carryOver(prevDayShifts: readonly { startTime: string; endTime: string }[]): number[] {
  const carry = Array<number>(48).fill(0);
  for (const s of prevDayShifts) {
    if (minutesOf(s.endTime) > minutesOf(s.startTime)) continue;
    for (let i = 0; i * 30 < minutesOf(s.endTime); i += 1) carry[i] += 1;
  }
  return carry;
}

/**
 * 그날 시작한 근무의 [첫 칸, 마지막 칸](30분 칸 번호). 없으면 null — 공백은 이 사이만 센다(STAFF-37, 2026-10-22 재영).
 * 그날 시작한 근무는 api coverage 에서 넘어온 인원(carryOver)을 뺀 값으로 본다 — 가린 직원의 근무는 items 에 없어 넘어온 근무로 빼지 못하고 그날 근무로 센다.
 */
function ownSpan(coverage: readonly number[], carry: readonly number[]): { first: number; last: number } | null {
  const own = coverage.map((n, i) => n - (carry[i] ?? 0));
  const first = own.findIndex((n) => n > 0);
  if (first < 0) return null;
  return { first, last: own.length - 1 - [...own].reverse().findIndex((n) => n > 0) };
}

/**
 * 근무 인원 줄 24칸. 한 시간 칸은 그 안의 30분 두 칸 중 작은 값이다 — 30분짜리 공백도 0 으로 드러나게(계획 문서).
 * 근무 앞뒤도 빈칸 없이 0 으로 보인다(2026-10-22 재영). api 의 coverage 는 전날 시작해 자정을 넘어온 근무도 새벽 칸에 센다(Q4).
 */
export function hourCells(coverage: readonly number[]): number[] {
  return Array.from({ length: 24 }, (_, h) => Math.min(coverage[2 * h] ?? 0, coverage[2 * h + 1] ?? 0));
}

export interface Gap {
  from: string;
  to: string;
  minutes: number;
}

/** 그날 시작한 근무의 첫 시작부터 마지막 종료 사이에 아무도 없는 구간(30분 칸 단위, STAFF-37). 넘어온 근무 뒤의 빈 새벽은 공백이 아니다 */
export function gapsOf(coverage: readonly number[], carry: readonly number[] = []): Gap[] {
  const span = ownSpan(coverage, carry);
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

/** 지난 주 복사(#204)에서 빠지는 날의 사유 — api 코드별. 퇴직은 퇴직일을 함께 적는다(STAFF-13 「제외 · 08-20 퇴직」) */
const EXCLUDE_REASON: Record<string, string> = {
  WORK_SCHEDULE_NO_CONTRACT: "근로계약 미체결",
  WORK_SCHEDULE_NOT_JOINED: "가입 전",
  WORK_SCHEDULE_OVERLAP: "시간 겹침",
  WORK_SCHEDULE_HIDDEN: "본사 제공 동의 없음",
};
const excludeReason = (code: string | null, retiredDate: string | null) =>
  code === "WORK_SCHEDULE_AFTER_RETIREMENT" ? (retiredDate ? `${mmdd(retiredDate)} 퇴직` : "퇴직") : ((code && EXCLUDE_REASON[code]) ?? "규칙에 맞지 않음");

/** 「5일 · 40.0h」(휴게를 뺀 시간). 없으면 「—」 */
export const totalsLabel = (t: { days: number; minutes: number }) => (t.days ? `${t.days}일 · ${(t.minutes / 60).toFixed(1)}h` : "—");

type CopyRow = { retiredDate: string | null; copied: { days: number }; excluded: { workDate: string; code: string | null }[] };

/**
 * 복사 미리보기 한 줄의 처리 글자(목업 STAFF-13). 복사할 날이 없으면 「제외 · 사유」, 일부만 빠지면 「일부 제외」와 빠진 날 · 사유,
 * 아니면 「복사」. 사유가 여럿이면 겹치지 않게 모은다.
 */
export function copyStatus(row: CopyRow): { kind: "copy" | "partial" | "excluded"; label: string; detail: string | null } {
  if (row.copied.days === 0) {
    const reasons = [...new Set(row.excluded.map((e) => excludeReason(e.code, row.retiredDate)))];
    return { kind: "excluded", label: `제외 · ${reasons.join(" · ") || "복사할 날 없음"}`, detail: null };
  }
  if (row.excluded.length)
    return { kind: "partial", label: "일부 제외", detail: row.excluded.map((e) => `${mmdd(e.workDate)} ${excludeReason(e.code, row.retiredDate)}`).join(", ") };
  return { kind: "copy", label: "복사", detail: null };
}
