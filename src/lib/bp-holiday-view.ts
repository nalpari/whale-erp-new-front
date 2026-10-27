// BP 휴일 관리(/bp-holidays) 화면 계산. next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
// 화면 상태(연 · 월 · 보기 · 고른 날짜 · 연 휴일)는 주소에만 둔다. 달력 칸 계산은 플랫폼 휴일 관리와 같다(public-holiday-view.ts).
// 날짜 규칙 · 변경 정책은 api 가 정한다(api okf `api/bp-holidays.md`) — 화면은 같은 규칙으로 미리 안내만 하고, 막는 것은 api 다.
import { dateKey, MAX_YEAR, MIN_YEAR } from "./public-holiday-view.ts";

export type HolidayView = "calendar" | "list";
export type HolidayType = "DAY" | "PERIOD" | "REPEAT";
export type RepeatType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type RepeatEnd = "NONE" | "UNTIL_DATE" | "COUNT";

export interface BpHolidayQuery {
  year: number;
  /** 1~12 */
  month: number;
  view: HolidayView;
  /** 캘린더에서 고른 날짜 — 오른쪽에 그날 휴일을 보인다. 그 달의 날짜만 받는다. */
  day: string | null;
  /** 상세 패널을 연 휴일 */
  holiday: number | null;
  /** 상세의 「선택 날짜」(다음 날짜의 기준) — 목록 · 캘린더에서 고른 날짜 */
  at: string | null;
  /**
   * 상세 위에 수정 패널을 열었다 — holiday 가 있을 때만 참이다. 주소(?edit=1)에 남겨 브라우저 뒤로 가기가 수정 → 상세 → 목록 순으로
   * 하나씩 닫히게 한다(플랫폼 관리자 관리와 같다 · 2026-10-26 사용자 요청). 등록 패널은 주소에 남기지 않는다.
   */
  edit: boolean;
}

type Params = Record<string, string | string[] | undefined>;

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` 이고 실제로 있는 날짜인가(2026-02-30 은 아니다). */
export function isDate(value: unknown): value is string {
  const m = typeof value === "string" ? DATE.exec(value) : null;
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

const intIn = (value: string | string[] | undefined, min: number, max: number): number | null => {
  const n = typeof value === "string" && /^\d{1,10}$/.test(value) ? Number(value) : NaN;
  return n >= min && n <= max ? n : null;
};

/**
 * 주소 → 화면 상태. 없거나 틀린 값은 오늘(한국 날짜)의 연월 · 캘린더로 둔다. 고른 날짜가 없으면 그 달이 이번 달일 때만 오늘을 고른다.
 * 고른 날짜가 다른 달이면 버린다 — 달을 옮기면 오른쪽 칸은 그 달 안에서만 고른다.
 */
export function parseBpHolidayQuery(params: Params, today: string): BpHolidayQuery {
  const year = intIn(params.year, MIN_YEAR, MAX_YEAR) ?? Number(today.slice(0, 4));
  const month = intIn(params.month, 1, 12) ?? Number(today.slice(5, 7));
  const prefix = dateKey(year, month, 1).slice(0, 8);
  const holiday = intIn(params.holiday, 1, 2_147_483_647);
  const day = isDate(params.day) && params.day.startsWith(prefix) ? params.day : today.startsWith(prefix) ? today : null;
  return {
    year,
    month,
    view: params.view === "list" ? "list" : "calendar",
    day,
    holiday,
    at: isDate(params.at) ? params.at : null,
    edit: holiday !== null && params.edit === "1",
  };
}

/** 화면 상태 → 주소(탭 BP 를 뗀 옛 경로). 캘린더가 기본이라 view 는 목록일 때만, 상세는 열었을 때만 남긴다. */
export function bpHolidaysHref(q: BpHolidayQuery): string {
  const search = new URLSearchParams({ year: String(q.year), month: String(q.month) });
  if (q.view === "list") search.set("view", "list");
  if (q.day) search.set("day", q.day);
  if (q.holiday) {
    search.set("holiday", String(q.holiday));
    if (q.at) search.set("at", q.at);
    if (q.edit) search.set("edit", "1");
  }
  return `/bp-holidays?${search}`;
}

/** 달을 n 만큼 옮긴다 — 고른 날짜와 연 상세는 닫는다. 2000년 1월 앞 · 2100년 12월 뒤는 null. */
export function shiftBpHolidayMonth(q: BpHolidayQuery, n: number): BpHolidayQuery | null {
  const index = q.year * 12 + (q.month - 1) + n;
  const year = Math.floor(index / 12);
  return year < MIN_YEAR || year > MAX_YEAR ? null : { ...q, year, month: (index % 12) + 1, day: null, holiday: null, at: null, edit: false };
}

/**
 * 수정 패널을 세울지. 주소에 ?edit=1 이 있어도 그 휴일을 고칠 수 없거나(canEdit — api actions 의 수정 · 점포 수정), 상세를 못 불러왔거나,
 * 화면에 남은 상세가 주소의 휴일이 아니면(다른 휴일로 옮기는 중) 열지 않는다 — 앞 휴일의 수정 폼이 다른 휴일 주소 위에 열리지 않게.
 * 플랫폼 관리자 관리(admins-href isEditOpen)와 같은 판정이다.
 */
export function isEditOpen(q: Pick<BpHolidayQuery, "holiday" | "edit">, canEdit: boolean, shownId: number | null): boolean {
  return q.edit && canEdit && q.holiday !== null && shownId === q.holiday;
}

/**
 * 고른 날짜가 휴일 기간 밖인가 — 시작일 앞이거나, 끝이 있는 휴일(하루 · 기간 · 반복의 특정 날짜까지)의 끝 뒤.
 * 상세의 「적용 점포」는 그 날짜 기준이라 밖이면 0곳이 되므로 상세를 시작일 기준으로 다시 받는 데 쓴다.
 */
export function outsideHoliday(h: { startDate: string; endDate: string | null; repeatEndDate: string | null }, date: string): boolean {
  const end = h.endDate ?? h.repeatEndDate;
  return date < h.startDate || (end !== null && date > end);
}

/** api 목록 경로 — 고른 달 하나(CONFIG-8). */
export const bpHolidaysApiPath = (q: Pick<BpHolidayQuery, "year" | "month">) => `/bp-holidays?${new URLSearchParams({ year: String(q.year), month: String(q.month) })}`;

/** 날짜 하나 → 날짜별 묶음. 캘린더 칸 · 그날 칸이 쓴다. 들어온 순서(날짜순, 같은 날은 전체 점포 먼저 · 등록 순서)를 지킨다. */
export function groupByDate<T extends { date: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) map.set(row.date, [...(map.get(row.date) ?? []), row]);
  return map;
}

// ── 양식 ──────────────────────────────────────────────────────────────

export interface HolidayForm {
  name: string;
  description: string;
  type: HolidayType;
  startDate: string;
  endDate: string;
  repeatType: RepeatType;
  repeatEnd: RepeatEnd;
  repeatEndDate: string;
  /** 칸에 친 글자 그대로 — 숫자인지는 검사에서 본다 */
  repeatCount: string;
  isAllStores: boolean;
  storeIds: number[];
  excludedStoreIds: number[];
}

export const emptyHolidayForm = (startDate: string, isAllStores: boolean): HolidayForm => ({
  name: "",
  description: "",
  type: "DAY",
  startDate,
  endDate: "",
  repeatType: "WEEKLY",
  repeatEnd: "NONE",
  repeatEndDate: "",
  repeatCount: "",
  isAllStores,
  storeIds: [],
  excludedStoreIds: [],
});

/** 상세 점포 한 줄(기간 하나)에서 판정에 쓰는 것 */
export interface StorePeriod {
  storeId: number;
  effectiveEndDate: string | null;
  periodState: "UPCOMING" | "ACTIVE" | "ENDED";
}

/**
 * 지금 열린 점포 — 상세의 점포는 지우지 않은 모든 기간(빠진 기간 포함)이라, 수정 양식에는 열린 기간만 쓴다(api 계약:
 * `effectiveEndDate === null && periodState !== "ENDED"`). 빠진 점포를 다시 보내면 다시 더해진다. 같은 점포는 하나만 남긴다.
 */
export function openStores<T extends StorePeriod>(stores: T[]): T[] {
  const seen = new Set<number>();
  return stores.filter((s) => s.effectiveEndDate === null && s.periodState !== "ENDED" && !seen.has(s.storeId) && seen.add(s.storeId));
}

/** 상세 → 수정 양식. 특정 점포면 대상, 전체 점포면 예외 — 지금 열린 기간의 점포만(openStores). */
export function formOfDetail(d: {
  name: string;
  description: string | null;
  holidayTypeCode: string;
  startDate: string;
  endDate: string | null;
  holidayRepeatTypeCode: string | null;
  repeatEndType: string | null;
  repeatEndDate: string | null;
  repeatCount: number | null;
  isAllStores: boolean;
  stores: StorePeriod[];
}): HolidayForm {
  const ids = openStores(d.stores).map((s) => s.storeId);
  return {
    name: d.name,
    description: d.description ?? "",
    type: (["DAY", "PERIOD", "REPEAT"].includes(d.holidayTypeCode) ? d.holidayTypeCode : "DAY") as HolidayType,
    startDate: d.startDate,
    endDate: d.holidayTypeCode === "PERIOD" ? (d.endDate ?? "") : "",
    repeatType: (d.holidayRepeatTypeCode ?? "WEEKLY") as RepeatType,
    repeatEnd: (d.repeatEndType ?? "NONE") as RepeatEnd,
    repeatEndDate: d.repeatEndDate ?? "",
    repeatCount: d.repeatCount === null ? "" : String(d.repeatCount),
    isAllStores: d.isAllStores,
    storeIds: d.isAllStores ? [] : ids,
    excludedStoreIds: d.isAllStores ? ids : [],
  };
}

/** 정할 수 있는 마지막 날짜 — 목록 · 날짜 계산 · 공식 휴일이 모두 2100년에서 멈춘다(api ruleOf LAST_DATE). */
export const LAST_DATE = "2100-12-31";
const LAST_DATE_MESSAGE = "날짜는 2100-12-31 까지 정할 수 있습니다.";

export type FormErrors =Partial<Record<"name" | "startDate" | "endDate" | "repeatEndDate" | "repeatCount" | "storeIds", string>>;

/**
 * 저장 전 칸 검사 — api 와 같은 규칙(SaveBpHolidayDto · 서비스)이다. 비어 있으면 통과한다.
 * 시작일이 오늘 이전이면 막는 것은 새 휴일과 시작 전 휴일뿐이다 — 진행 중 휴일은 날짜를 바꾸지 않고 읽은 값 그대로 보낸다(scheduleLocked).
 */
export function validateHolidayForm(f: HolidayForm, today: string, { scheduleLocked = false } = {}): FormErrors {
  const errors: FormErrors = {};
  const name = f.name.trim();
  if (!name) errors.name = "휴일명을 입력해 주세요.";
  else if (name.length > 30) errors.name = "휴일명은 30자까지입니다.";
  if (!scheduleLocked) {
    if (!isDate(f.startDate)) errors.startDate = "날짜를 YYYY-MM-DD 로 입력해 주세요.";
    else if (f.startDate < today) errors.startDate = "오늘 이후 날짜로 정해 주세요.";
    else if (f.startDate > LAST_DATE) errors.startDate = LAST_DATE_MESSAGE;
    // 기간의 종료일은 시작일과 같아도 된다(api ruleOf — endDate < startDate 만 막는다)
    if (f.type === "PERIOD") {
      if (!isDate(f.endDate)) errors.endDate = "종료일을 입력해 주세요.";
      else if (isDate(f.startDate) && f.endDate < f.startDate) errors.endDate = "종료일은 시작일 이후로 정해 주세요.";
      else if (f.endDate > LAST_DATE) errors.endDate = LAST_DATE_MESSAGE;
    }
    if (f.type === "REPEAT" && f.repeatEnd === "UNTIL_DATE") {
      if (!isDate(f.repeatEndDate)) errors.repeatEndDate = "종료일을 입력해 주세요.";
      else if (isDate(f.startDate) && f.repeatEndDate < f.startDate) errors.repeatEndDate = "종료일은 시작일 이후로 정해 주세요.";
      else if (f.repeatEndDate > LAST_DATE) errors.repeatEndDate = LAST_DATE_MESSAGE;
    }
    // 지정 횟수가 2100년 안에 다 나오는지는 날짜를 셈해야 해 api 가 본다(400 「반복 횟수가 2100-12-31 을 넘습니다」)
    if (f.type === "REPEAT" && f.repeatEnd === "COUNT") {
      const n = /^\d{1,4}$/.test(f.repeatCount.trim()) ? Number(f.repeatCount.trim()) : 0;
      if (n < 1) errors.repeatCount = "반복 횟수는 1~9999 회로 입력해 주세요.";
    }
  }
  if (!f.isAllStores && f.storeIds.length === 0) errors.storeIds = "대상 점포를 하나 이상 골라 주세요.";
  return errors;
}

/** 양식 → api 본문(SaveBpHolidayDto). 유형과 맞지 않는 칸은 비워 보낸다 — 하루는 종료일 없이, 반복은 반복 칸만. */
export function holidayBody(f: HolidayForm) {
  const repeat = f.type === "REPEAT";
  return {
    name: f.name.trim(),
    description: f.description.trim() || null,
    holidayTypeCode: f.type,
    startDate: f.startDate,
    endDate: f.type === "PERIOD" ? f.endDate : null,
    holidayRepeatTypeCode: repeat ? f.repeatType : null,
    repeatEndType: repeat ? f.repeatEnd : null,
    repeatEndDate: repeat && f.repeatEnd === "UNTIL_DATE" ? f.repeatEndDate : null,
    repeatCount: repeat && f.repeatEnd === "COUNT" ? Number(f.repeatCount.trim()) : null,
    isAllStores: f.isAllStores,
    storeIds: f.isAllStores ? [] : f.storeIds,
    excludedStoreIds: f.isAllStores ? f.excludedStoreIds : [],
  };
}

/** 두 양식의 일정(유형 · 날짜 · 반복 · 종료 조건 · 적용 범위)이 같은가 — 진행 중 휴일은 이것을 바꾸면 409 다. */
export function sameSchedule(a: HolidayForm, b: HolidayForm): boolean {
  const x = holidayBody(a);
  const y = holidayBody(b);
  return (
    x.holidayTypeCode === y.holidayTypeCode &&
    x.startDate === y.startDate &&
    x.endDate === y.endDate &&
    x.holidayRepeatTypeCode === y.holidayRepeatTypeCode &&
    x.repeatEndType === y.repeatEndType &&
    x.repeatEndDate === y.repeatEndDate &&
    x.repeatCount === y.repeatCount &&
    x.isAllStores === y.isAllStores
  );
}

// ── 문구 ──────────────────────────────────────────────────────────────

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const utc = (date: string) => new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))));

/** `2026-09-21` → `월요일`. 날짜가 아니면 빈 문자열. */
export const weekdayName = (date: string) => (isDate(date) ? `${WEEKDAYS[utc(date).getUTCDay()]}요일` : "");

/** 반복의 기준(시작일의 요일 · 날짜) — 「매주 · 월요일」 「매월 · 31일」 「매년 · 2월 29일」. 매일은 기준이 없다. */
export function repeatBasis(type: RepeatType, startDate: string): string {
  if (!isDate(startDate) || type === "DAILY") return "";
  if (type === "WEEKLY") return weekdayName(startDate);
  const day = Number(startDate.slice(8, 10));
  return type === "MONTHLY" ? `${day}일` : `${Number(startDate.slice(5, 7))}월 ${day}일`;
}

/**
 * 반복이 건너뛰는 날을 미리 알린다(F-YQTLQE) — 매월 29~31일은 그 날이 없는 달을, 매년 2월 29일은 평년을 건너뛴다.
 * 건너뛴 날은 지정 횟수에 세지 않는다.
 */
export function repeatSkipNote(type: RepeatType, startDate: string): string | null {
  if (!isDate(startDate)) return null;
  const day = Number(startDate.slice(8, 10));
  if (type === "MONTHLY" && day >= 29) return `${day}일이 없는 달은 건너뜁니다. 건너뛴 달은 반복 횟수에 세지 않습니다.`;
  if (type === "YEARLY" && startDate.slice(5) === "02-29") return "2월 29일이 없는 해는 건너뜁니다. 건너뛴 해는 반복 횟수에 세지 않습니다.";
  return null;
}

/** 종료 조건 문구 — 「종료일 없음」 「2026-12-28까지」 「10회」. */
export function repeatEndText(end: string | null, endDate: string | null, count: number | null): string {
  if (end === "UNTIL_DATE") return endDate ? `${endDate}까지` : "특정 날짜까지";
  if (end === "COUNT") return count ? `${count}회` : "지정 횟수만큼";
  return "종료일 없음";
}

export const REPEAT_ENDS: { value: RepeatEnd; label: string }[] = [
  { value: "NONE", label: "종료일 없음" },
  { value: "UNTIL_DATE", label: "특정 날짜까지" },
  { value: "COUNT", label: "지정 횟수만큼" },
];

/** 「적용 대상」 한 줄 — 전체 점포면 BP 상호와 예외 수, 특정 점포면 첫 점포와 나머지 수(데모 2026-10-08). */
export function targetText(t: { isAllStores: boolean; bpTradeName: string | null; firstStoreName: string | null; otherStoreCount: number; excludedStoreCount: number }): string {
  if (t.isAllStores) return `${t.bpTradeName ?? "전체 점포"}${t.excludedStoreCount ? ` · 예외 ${t.excludedStoreCount}곳` : ""}`;
  return `${t.firstStoreName ?? "점포 없음"}${t.otherStoreCount ? ` 외 ${t.otherStoreCount}곳` : ""}`;
}

/** 어제(한국 날짜) — 강제 종료가 끝내는 날. */
export function yesterdayOf(today: string): string {
  const d = utc(today);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 변경 이력 한 쪽 건수. 클라이언트(이력 팝업)도 쓰므로 next/headers 를 부르는 bp-holidays.ts 가 아니라 여기 둔다. */
export const BP_HOLIDAY_HISTORY_PAGE_SIZE = 20;

/** 변경 이력 기본 기간 — 이달 1일부터 오늘까지(S-YAFRYZ). */
export const defaultHistoryRange = (today: string) => ({ from: `${today.slice(0, 8)}01`, to: today });

/**
 * 전체 점포 휴일을 다룰 수 있는 역할인가 — 플랫폼 계정(PM · PA)과 BP 마스터 · BP 관리자. 가맹 역할은 전체 점포 범위여도 못 한다(CONFIG-10).
 * BP 관리자 중 일부 점포만 맡은 사람도 여기선 참이다 — 로그인 정보에 관리 범위가 없어서다. 저장하면 api 가 403 으로 막는다.
 */
export const canChooseAllStores = (roleTypeCode: string) => ["PM", "PA", "BM", "BA"].includes(roleTypeCode);
