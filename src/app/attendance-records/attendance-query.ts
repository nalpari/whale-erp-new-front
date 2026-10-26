// 출·퇴근 현황 조회 URL 쿼리 ↔ 조회 조건 ↔ api 쿼리 · 화면 거르기. 화면 상태는 URL 에만 둔다(TO-DO 목록 todo-list-query.ts 와 같은 규칙).
// 기본값은 URL 에서 빼고, 이상한 값은 오류 없이 그 칸만 기본값으로 돌린다. 체크 묶음은 모르는 값만 버린다 — 남는 게 없으면 0건이다.
// 점포 조건은 TO-DO 목록 · 점포 목록과 같은 네 가지다 — 필터에서 고른 점포(storeIds) · 비운 「전체」(빈 storeIds) · 헤더 범위(scope) ·
// 정해지지 않음(필터가 헤더 범위로 채운다). 필터는 화면을 떠나면 처음 값으로 돌아간다(STAFF-31 「유지 안 함」) — 주소에만 있다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../lib/api-types.generated.ts";
import type { Scope } from "../../lib/browser-storage.ts";
import { SCOPE_PARAM, scopeKeyOf, scopeOfParam } from "../../lib/store-scope.ts";
import { MAX_PICKED_STORES, pickedIdsOf } from "../stores/stores-query.ts";

type Schemas = components["schemas"];
export type DayRow = Schemas["AttendanceDayItemDto"];
/** 기간 조회의 줄 — 보정 · 대신 등록 이력(edits)이 붙는다 */
export type FixRow = Schemas["AttendancePeriodItemDto"];
type EditEntry = FixRow["edits"][number];
export type DayStatus = Schemas["AttendanceDayStatus"];
export type ReviewReason = Schemas["AttendanceReviewReason"];
export type EmploymentType = Schemas["EmploymentType"];

/** 필터 「출퇴근 상태」(STAFF-31) — 화면 순서 */
export const DAY_STATUSES: readonly DayStatus[] = ["NORMAL", "LATE", "ABSENT", "MISSING_CHECK_IN", "MISSING_CHECK_OUT", "OFF"];
/**
 * 필터 「확인 필요 사유」의 선택지 — 반경 밖 출근 · 반경 밖 퇴근 · 위치 조작 감지 셋(ATT-11, 2026-10-26 재영). 위치 오차 초과(ACCURACY_EXCEEDED)는
 * 확인 필요 사유에서 빠진 값이라(직원 앱 목업 HIST-4) api 는 값만 남겼다.
 */
export const REVIEW_REASONS: readonly ReviewReason[] = ["OUT_OF_RADIUS_CHECKIN", "OUT_OF_RADIUS_CHECKOUT", "MOCK_LOCATION"];
export const EMPLOYMENT_TYPES: readonly EmploymentType[] = ["FULL_TIME", "PART_TIME"];
/** 필터 「기록 구분」 — 직원 등록 · 대신 등록 · 보정됨 */
export const ENTRY_KINDS = ["SELF", "PROXY", "CORRECTED"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];
export const ENTRY_KIND_LABELS: Record<EntryKind, string> = { SELF: "직원 등록", PROXY: "대신 등록", CORRECTED: "보정됨" };
/** 필터 「재직 상태」 — 기본 재직 */
export const EMPLOYMENTS = ["EMPLOYED", "RETIRED", "ALL"] as const;
export type Employment = (typeof EMPLOYMENTS)[number];
export const EMPLOYMENT_LABELS: Record<Employment, string> = { EMPLOYED: "재직", RETIRED: "퇴직", ALL: "전체" };

/** api 의 기간 한도(GET /attendance-records) — 보정 목록은 최근 3개월 안에서 고른다(STAFF-31) */
export const MAX_PERIOD_DAYS = 92;

export interface AttendanceQuery {
  storeIds: number[];
  storesCleared: boolean;
  scope: Scope | null;
  /** 직원(이름 또는 번호) */
  staff: string;
  /** 직원 레코드 하나로 좁힌다 — 급여명세서의 「출퇴근 보정」 · 「출퇴근 기록 보기」(이름이 비슷한 다른 직원이 섞이지 않게). 직원 칸을 고치면 풀린다 */
  staffMemberId: number | null;
  employmentTypes: EmploymentType[];
  statuses: DayStatus[];
  reasons: ReviewReason[];
  entries: EntryKind[];
  employment: Employment;
  /** 일별 출퇴근의 날 */
  date: string;
  /** 근태 요약의 주(월요일) */
  week: string;
  /** 보정이 필요한 기록의 기간 — 끝 포함, 92일 이하 */
  fixFrom: string;
  fixTo: string;
}

type RawSearch = Record<string, string | string[] | undefined>;

const MAX_ID = 2_147_483_647;
const DAY_MS = 24 * 60 * 60 * 1000;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const idOf = (v: string) => (/^[1-9]\d*$/.test(v) && Number(v) <= MAX_ID ? Number(v) : null);

function dateOf(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const d = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === raw ? raw : "";
}

export function addDays(day: string, n: number): string {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}
/** 그날이 든 주의 월요일 — 주는 월~일 */
export function mondayOf(day: string): string {
  const wd = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((wd + 6) % 7));
}
const span = (from: string, to: string) => (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS + 1;

/** 보정 목록 기본 기간 — 오늘까지 한 달(데모 08-06 ~ 09-06) */
/** 보정 · 대신 등록할 수 있는 첫 날 — 한국 오늘의 3개월 전(api 와 같은 계산) */
export function editableFromOf(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 - 3 + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 - 3, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

export const defaultFixPeriod = (today: string) => ({ fixFrom: addDays(today, -31), fixTo: today });

export const defaultQuery = (today: string): AttendanceQuery => ({
  storeIds: [],
  storesCleared: false,
  scope: null,
  staff: "",
  staffMemberId: null,
  employmentTypes: [...EMPLOYMENT_TYPES],
  statuses: [...DAY_STATUSES],
  reasons: [...REVIEW_REASONS],
  entries: [...ENTRY_KINDS],
  employment: "EMPLOYED",
  date: today,
  week: mondayOf(today),
  ...defaultFixPeriod(today),
});

/** 쉼표 체크 묶음 — 없으면 전부, 있으면 아는 값만(남는 게 없으면 빈 배열 = 0건) */
function checks<T extends string>(raw: string | undefined, all: readonly T[]): T[] {
  if (raw === undefined) return [...all];
  const picked = new Set(raw.split(","));
  return all.filter((v) => picked.has(v));
}
const checksParam = <T extends string>(values: readonly T[], all: readonly T[]) =>
  values.length === all.length ? null : all.filter((v) => values.includes(v)).join(",");

export function parseAttendanceQuery(raw: RawSearch, today: string): AttendanceQuery {
  const def = defaultQuery(today);
  const rawStoreIds = first(raw.storeIds);
  const storeIds = [...new Set((rawStoreIds ?? "").split(",").map(idOf).filter((id) => id !== null))].slice(0, MAX_PICKED_STORES);
  // 보정이 필요한 기록의 기간은 최근 3개월 안 · 오늘까지(STAFF-31) — 주소로 그 밖이 와도 안으로 줄인다
  const editableFrom = editableFromOf(today);
  let fixFrom = dateOf(first(raw.fixFrom)) || def.fixFrom;
  let fixTo = dateOf(first(raw.fixTo)) || def.fixTo;
  if (fixFrom < editableFrom) fixFrom = editableFrom;
  if (fixTo > today) fixTo = today;
  const n = span(fixFrom, fixTo);
  if (n < 1 || n > MAX_PERIOD_DAYS) ({ fixFrom, fixTo } = def);
  const employment = first(raw.employment);
  return {
    storeIds,
    storesCleared: rawStoreIds !== undefined && !storeIds.length,
    scope: rawStoreIds !== undefined ? null : scopeOfParam(first(raw[SCOPE_PARAM])),
    staff: (first(raw.staff) ?? "").trim().slice(0, 50),
    staffMemberId: idOf(first(raw.staffMemberId) ?? ""),
    employmentTypes: checks(first(raw.employmentType), EMPLOYMENT_TYPES),
    statuses: checks(first(raw.status), DAY_STATUSES),
    reasons: checks(first(raw.reason), REVIEW_REASONS),
    entries: checks(first(raw.entry), ENTRY_KINDS),
    employment: EMPLOYMENTS.find((e) => e === employment) ?? def.employment,
    date: dateOf(first(raw.date)) || def.date,
    week: mondayOf(dateOf(first(raw.week)) || def.week),
    fixFrom,
    fixTo,
  };
}

export function toAttendanceSearch(q: AttendanceQuery, today: string): string {
  const def = defaultQuery(today);
  const params = new URLSearchParams();
  if (q.storeIds.length) params.set("storeIds", q.storeIds.join(","));
  else if (q.storesCleared) params.set("storeIds", "");
  else if (q.scope) params.set(SCOPE_PARAM, scopeKeyOf(q.scope));
  if (q.staff) params.set("staff", q.staff);
  if (q.staffMemberId !== null) params.set("staffMemberId", String(q.staffMemberId));
  const sets: [string, string | null][] = [
    ["employmentType", checksParam(q.employmentTypes, EMPLOYMENT_TYPES)],
    ["status", checksParam(q.statuses, DAY_STATUSES)],
    ["reason", checksParam(q.reasons, REVIEW_REASONS)],
    ["entry", checksParam(q.entries, ENTRY_KINDS)],
  ];
  for (const [k, v] of sets) if (v !== null) params.set(k, v);
  if (q.employment !== def.employment) params.set("employment", q.employment);
  if (q.date !== def.date) params.set("date", q.date);
  if (q.week !== def.week) params.set("week", q.week);
  if (q.fixFrom !== def.fixFrom || q.fixTo !== def.fixTo) {
    params.set("fixFrom", q.fixFrom);
    params.set("fixTo", q.fixTo);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** api 점포 조건 — 고른 점포 · 점포 하나 범위면 storeIds, 직영 · 가맹 범위면 storeTypes, 전체 · 비운 「전체」면 싣지 않는다(TO-DO 목록과 같다) */
export function storeParams(q: AttendanceQuery): URLSearchParams {
  const params = new URLSearchParams();
  const ids = pickedIdsOf(q);
  if (ids.length) params.set("storeIds", ids.join(","));
  else if (q.scope?.type === "DIRECT" || q.scope?.type === "FRANCHISE") params.set("storeTypes", q.scope.type);
  return params;
}

const reasonsOf = (r: DayRow) => r.pairs.flatMap((p) => [p.checkIn, p.checkOut]).flatMap((x) => (x?.reviewReason ? [x.reviewReason] : []));
const entriesOf = (r: DayRow): EntryKind[] =>
  r.pairs.flatMap((p) => [p.checkIn, p.checkOut]).flatMap((x) => (x ? [x.entryMethod as EntryKind, ...(x.isCorrected ? (["CORRECTED"] as const) : [])] : []));

/**
 * 근태 요약에 걸리는 거르기 — 점포(api) · 고용형태 · 재직 상태만(STAFF-31 「근태 요약에는 점포·고용형태·재직만」).
 */
export function matchesSummary(r: DayRow, q: AttendanceQuery): boolean {
  if (!q.employmentTypes.includes(r.employmentType)) return false;
  if (q.employment !== "ALL" && r.employmentStatus !== q.employment) return false;
  return true;
}

/**
 * 일별 출퇴근 · 보정 목록의 거르기(STAFF-31 필터 7개). 사유 · 기록 구분은 그 값이 있는 줄에만 건다 — 사유가 없는 줄 · 기록이
 * 없는 줄(휴무 · 미출근)은 그 묶음으로 빠지지 않는다. 상태가 없는 줄(근무스케줄 시작 전)은 상태 거르기에 걸리지 않는다.
 */
export function matchesFilter(r: DayRow, q: AttendanceQuery): boolean {
  if (!matchesSummary(r, q)) return false;
  const needle = q.staff.replaceAll("-", "");
  if (needle && !r.name.includes(needle) && !r.phone.includes(needle)) return false;
  if (q.staffMemberId !== null && r.staffMemberId !== q.staffMemberId) return false;
  if (r.status !== null && !q.statuses.includes(r.status)) return false;
  // 선택지에 없는 사유(남아 있는 위치 오차 초과)는 거르기에 쓰지 않는다 — 그 줄이 필터로 사라지지 않게
  const reasons = reasonsOf(r).filter((x) => REVIEW_REASONS.includes(x));
  if (reasons.length && !reasons.some((x) => q.reasons.includes(x))) return false;
  const entries = entriesOf(r);
  if (entries.length && !entries.some((x) => q.entries.includes(x))) return false;
  return true;
}

/** 보정이 필요한 기록 — 퇴근 · 출근 미등록과 확인 필요 사유가 남은 기록, 그리고 보정 · 대신 등록한 기록(데모 「보정이 필요한 기록」) */
export function needsFix(r: DayRow): boolean {
  return r.status === "MISSING_CHECK_OUT" || r.status === "MISSING_CHECK_IN" || reasonsOf(r).length > 0 || entriesOf(r).some((e) => e !== "SELF");
}

export interface WeekSummary {
  normal: number;
  late: number;
  /** 미기록 — 미출근 · 출근 미등록 · 퇴근 미등록 */
  missing: number;
  /** 근무 분 — 급여 계산과 같은 규칙(휴게를 뺀다), api `weekStaff` 의 합 */
  workedMinutes: number;
  /** 연장 근로(분) — 급여 계산과 같은 규칙(정직원 하루 8시간 · 주 40시간 초과, 파트타이머는 계약 요일 시간 초과), api `weekStaff` 의 합 */
  overtimeMinutes: number;
  /** 야간 근로(분) — 22:00 ~ 06:00(한국) 사이에 일한 시간. 급여 계산에는 없어 화면이 센다 */
  nightMinutes: number;
  /** 주휴 대상 인원 — 1주 소정근로시간 15시간 이상이고 그 주 계약 요일을 모두 출근한 직원(PAY-02), api `weekStaff` */
  weeklyHolidayStaff: number;
}
/** 22:00 ~ 06:00(한국) 사이에 든 분 — start · end 는 순간(ms) */
function nightMinutesOf(start: number, end: number): number {
  const KST = 9 * 60 * 60 * 1000;
  const MIN = 60_000;
  let total = 0;
  // 한국 자정 기준으로 하루씩 22:00 ~ 다음 날 06:00 구간과 겹친 분을 센다
  const firstDay = Math.floor((start + KST) / 86_400_000) * 86_400_000 - KST;
  for (let day = firstDay - 86_400_000; day < end; day += 86_400_000) {
    const from = Math.max(start, day + 22 * 60 * MIN);
    const to = Math.min(end, day + 30 * 60 * MIN);
    if (to > from) total += Math.round((to - from) / MIN);
  }
  return total;
}
export type WeekStaff = NonNullable<Schemas["PeriodAttendanceResponseDto"]["weekStaff"]>[number];

/**
 * 근태 요약(한 주). 횟수 · 야간은 받은 줄에서 세고, 근무 · 연장 · 주휴 대상은 api 가 급여 계산과 같은 규칙으로 낸 직원별 값(`weekStaff`)을
 * 거른 줄에 남은 직원만 더한다(2026-10-23 사용자 결정 — 급여명세서와 숫자가 어긋나지 않게).
 */
export function weekSummary(rows: readonly DayRow[], weekStaff: readonly WeekStaff[]): WeekSummary {
  const s: WeekSummary = { normal: 0, late: 0, missing: 0, workedMinutes: 0, overtimeMinutes: 0, nightMinutes: 0, weeklyHolidayStaff: 0 };
  for (const r of rows) {
    if (r.status === "NORMAL") s.normal += 1;
    else if (r.status === "LATE") s.late += 1;
    else if (r.status === "ABSENT" || r.status === "MISSING_CHECK_IN" || r.status === "MISSING_CHECK_OUT") s.missing += 1;
    for (const p of r.pairs) if (p.checkIn && p.checkOut) s.nightMinutes += nightMinutesOf(Date.parse(p.checkIn.recordedAt), Date.parse(p.checkOut.recordedAt));
  }
  const shown = new Set(rows.map((r) => r.staffMemberId));
  for (const w of weekStaff) {
    if (!shown.has(w.staffMemberId)) continue;
    s.workedMinutes += w.workedMinutes;
    s.overtimeMinutes += w.overtimeMinutes;
    if (w.isWeeklyHolidayEligible) s.weeklyHolidayStaff += 1;
  }
  return s;
}

/** 「10월 23일 (금)」 */
export function dayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${"일월화수목금토"[d.getUTCDay()]})`;
}
/** 「10-23」 */
export const shortDay = (day: string) => day.slice(5);

/** 보정 패널을 열 짝 — 확인 필요 사유가 있거나 빈 쪽(퇴근 · 출근 미등록)이 있는 첫 짝, 없으면 첫 짝. 하루에 짝이 여럿이면 고칠 짝으로 연다 */
export function fixPairIndex(r: Pick<DayRow, "pairs">): number {
  const i = r.pairs.findIndex((p) => p.checkIn?.reviewReason || p.checkOut?.reviewReason || !p.checkIn || !p.checkOut);
  return Math.max(0, i);
}
/** 「1,284h」 · 「12h 30m」 */
export const hoursLabel = (minutes: number) => (minutes % 60 ? `${Math.floor(minutes / 60).toLocaleString("ko-KR")}h ${minutes % 60}m` : `${(minutes / 60).toLocaleString("ko-KR")}h`);

/**
 * 보정 · 대신 등록 폼의 다음 날 퇴근 안내 — 퇴근이 출근보다 이르거나 같으면 api 가 다음 날 퇴근으로 저장한다.
 * 그때만 「다음 날(10/24) 02:00 퇴근으로 저장합니다.」, 아니면(시각이 덜 들어왔거나 같은 날) null.
 */
export function overnightNote(date: string, checkIn: string, checkOut: string): string | null {
  const hhmm = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!hhmm.test(checkIn) || !hhmm.test(checkOut) || checkOut > checkIn) return null;
  const next = addDays(date, 1);
  return `다음 날(${Number(next.slice(5, 7))}/${Number(next.slice(8, 10))}) ${checkOut} 퇴근으로 저장합니다.`;
}

/** 처리한 사람 — 「정하윤 (BP 마스터)」(데모 이력 창) */
export const byLabel = (e: Pick<EditEntry, "by" | "byRole">) => (e.byRole ? `${e.by} (${e.byRole})` : e.by);

/**
 * 보정이 필요한 기록의 꼬리 글자(데모 fixList) — 「수정됨」 옆은 가장 최근 보정의 「08-30 정하윤」, 「대신 등록」 옆은 가장 최근 대신
 * 등록의 「위치 수집 일시 중지 · 정하윤」. 그 이력이 없으면 null. edits 는 새것부터다.
 */
export function editTail(edits: readonly EditEntry[], kind: EditEntry["kind"]): string | null {
  const e = edits.find((x) => x.kind === kind);
  if (!e) return null;
  if (kind === "PROXY") return `${e.reason} · ${e.by}`;
  const kst = new Date(Date.parse(e.at) + 9 * 60 * 60 * 1000).toISOString();
  return `${kst.slice(5, 10)} ${e.by}`;
}

/** 지각 분 — 첫 출근이 첫 근무스케줄 시작보다 늦은 분(목업 「지각 18분」). 지각이 아니면 0 */
export function lateMinutes(r: Pick<DayRow, "status" | "pairs" | "schedules">): number {
  const first = r.pairs.find((p) => p.checkIn)?.checkIn?.time;
  const start = r.schedules[0]?.startTime;
  if (r.status !== "LATE" || !first || !start) return 0;
  const min = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return Math.max(0, min(first) - min(start));
}
