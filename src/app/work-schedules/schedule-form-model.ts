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
/** 「계약 값으로 되돌리기」를 보일까 — 계약에 시작 · 종료가 있을 때만(#203) */
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
  if (!s.startTime || !s.endTime) return "시작과 종료를 골라 주세요.";
  if (workMinutes(s.startTime, s.endTime) >= 24 * 60) return "근무시간은 24시간보다 짧아야 합니다.";
  if (!/^\d{1,4}$/.test(s.breakMinutes)) return "휴게시간을 0 이상의 분으로 넣어 주세요.";
  if (Number(s.breakMinutes) >= workMinutes(s.startTime, s.endTime)) return "휴게시간은 근무시간보다 짧아야 합니다.";
  return null;
}

/** 입력칸 → api 본문의 시각 · 휴게. shiftProblem 이 null 일 때만 부른다 */
export const shiftBody = (s: ShiftInput) => ({ startTime: s.startTime, endTime: s.endTime, breakMinutes: Number(s.breakMinutes) });
