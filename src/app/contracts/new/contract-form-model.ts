// 근로계약서 초안 폼의 순수 로직 — 입력값 → API 본문, 주 소정근로시간, 만 19세 판정.
// 테스트: node --test src/app/contracts/new/contract-form-model.test.ts

import type { components } from "../../../lib/api-types.generated";

export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type EmploymentType = "FULL_TIME" | "PART_TIME";
export type PayMonth = "CURRENT_MONTH" | "NEXT_MONTH";
export type PayMethod = "ACCOUNT" | "CASH";
export const GENDERS = ["MALE", "FEMALE"] as const;
export type Gender = (typeof GENDERS)[number];
export type ContractMethod = "ELECTRONIC" | "PAPER";

/** 시 · 분 (분은 00 · 30) */
export interface HourMinute {
  hour: string;
  minute: "00" | "30";
}
export interface TimeSpan {
  start: HourMinute;
  end: HourMinute;
}
/** 한 요일의 근무시간 · 휴게시간 */
export interface DayTimes {
  work: TimeSpan;
  rest: TimeSpan;
}

/**
 * 화면의 입력값. 근무시간 · 휴게시간은 고른 요일 모두에 같게 들어간다(데모 contracts-new, 2026-10-02 재영).
 * 파트타이머는 소정근로시간 표에서 요일마다 고칠 수 있다(dayTimes, 데모 확인 2026-10-15). 정직원의 요일별 시간은 근무스케줄에서 고친다.
 */
export interface ContractForm {
  name: string;
  phone: string;
  birthDate: string;
  /** 성별 — 가입 값과 본인 대조(WHALEERP-125). 처음엔 고르지 않은 상태 */
  gender: Gender | "";
  /** 외국인 여부 — 체크하지 않으면 내국인 */
  isForeigner: boolean;
  storeId: string;
  jobTitle: string;
  employmentType: EmploymentType;
  startDate: string;
  endDate: string;
  wage: string;
  days: Weekday[];
  work: TimeSpan;
  rest: TimeSpan;
  payMonth: PayMonth;
  payDay: string;
  isHealthPensionInsured: boolean;
  isEmploymentInjuryInsured: boolean;
  workLocation: string;
  // 계약서 임금 · 근로시간 조항 (현업 요구사항, 2026-10-12 재영). 금액은 쉼표 넣은 글자, 시간은 글자 그대로.
  mealAllowance: string;
  carAllowance: string;
  childcareAllowance: string;
  baseHours: string;
  monthlyOvertimeHours: string;
  baseNightHours: string;
  annualLeaveTerms: string;
  severancePayTerms: string;
  /** 파트타이머가 표에서 고친 요일의 시간. 없는 요일은 위 근무시간 · 휴게시간(work · rest)을 쓴다. 위 시간을 바꾸면 비운다 */
  dayTimes: Partial<Record<Weekday, DayTimes>>;
  /** 관리자가 고른 주휴일. 비었거나 근무 요일이면 근무하지 않는 가장 뒤 요일로 본다(weeklyHolidayOf) */
  weeklyHoliday: Weekday | "";
  payMethod: PayMethod;
  /** 전자계약 · 종이 계약. 종이 계약은 날인본 파일과 함께 등록하면 발송 · 날인 없이 체결 완료다(CTR-23) */
  contractMethod: ContractMethod;
  /** 수습(정직원만) — 기간 1~3개월 · 임금 감액률 0~10% (노무사 확인 2026-10-14) */
  probation: boolean;
  probationMonths: "1" | "2" | "3";
  probationRate: string;
}

/** 월 근로시간 칸 — 폼 키와 api 칸 이름이 같다. 휴일근무 두 칸(baseHolidayHours · monthlyExtraHolidayHours)은 화면에서 뺐다(2026-10-13) */
export const HOUR_FIELDS = ["baseHours", "monthlyOvertimeHours", "baseNightHours"] as const;
export type HourField = (typeof HOUR_FIELDS)[number];

/** 조항 기본 문구. DB 가 아니라 작성 화면이 채우고 관리자가 고친다(2026-10-12 재영) */
export const DEFAULT_ANNUAL_LEAVE_TERMS = "근로기준법 제50조에 의거하여 연차휴가를 제공함";
export const DEFAULT_SEVERANCE_PAY_TERMS = "계속근로기간 1년에 대하여 30일분의 퇴직금을 지급함";

/** POST · PUT /contracts 본문. api 의 openapi.json 에서 만든 타입을 쓴다(pnpm openapi:types). 임시저장이면 계약 칸은 비워 보낼 수 있다 */
export type CreateContractBody = components["schemas"]["CreateContractDto"];

/** 같은 점포 · 같은 번호의 진행 중 계약 — 대체할지 묻는 데 쓴다 */
// 이름 · 기간은 확인창에서 누구 계약인지 보이려고 api 가 싣는다(api #49) — 번호를 넘겨받은 다른 사람의 계약일 수 있다.
export type InProgressContract = { contractId: number; status: string; name: string | null; startDate: string | null; endDate: string | null };

/** 저장 서버 액션의 결과. 성공하면 액션이 목록으로 보내므로 돌아왔다면 실패다 */
export interface SaveResult {
  error: string;
  /** 있으면 같은 점포에 진행 중 계약이 있어 저장하지 않았다 — 대체를 확인받아 다시 보낸다 */
  inProgress?: InProgressContract[];
}

/**
 * api 409 본문에서 대체할 진행 중 계약 목록을 꺼낸다(code CONTRACT_IN_PROGRESS). 다른 409(근무 시간 겹침 ·
 * 재직 중)는 undefined — 그 문장을 그대로 보이면 된다(겹침은 다른 점포의 요일 · 시각을 싣지 않는다, CTR-26).
 */
export function inProgressOf(body: unknown): InProgressContract[] | undefined {
  const b = body as { code?: unknown; contracts?: unknown } | null;
  if (b?.code !== "CONTRACT_IN_PROGRESS" || !Array.isArray(b.contracts)) return undefined;
  const text = (v: unknown) => (typeof v === "string" && v ? v : null);
  const list = b.contracts
    .filter((c): c is { contractId: number; status: string } & Record<string, unknown> => typeof c?.contractId === "number" && typeof c?.status === "string")
    .map((c) => ({ contractId: c.contractId, status: c.status, name: text(c.name), startDate: text(c.startDate), endDate: text(c.endDate) }));
  return list.length ? list : undefined;
}

/** 확인창의 한 줄 — 「남도현 · 2026-09-01 ~ 2026-10-01 · 체결 완료 · 계약 5」. 이름 · 기간이 없으면 뺀다 */
export function inProgressLine(c: InProgressContract, statusLabel: string): string {
  const period = c.startDate || c.endDate ? `${c.startDate ?? ""} ~ ${c.endDate ?? ""}`.trim() : null;
  return [c.name, period, statusLabel, `계약 ${c.contractId}`].filter(Boolean).join(" · ");
}

const span = (sh: string, eh: string): TimeSpan => ({ start: { hour: sh, minute: "00" }, end: { hour: eh, minute: "00" } });

/** 처음 열었을 때의 값. 정직원 · 월~금 09~18 · 휴게 12~13 · 익월 10일 (데모와 같다). 주휴일은 근무로 정해진다 */
export function initialForm(storeId = ""): ContractForm {
  return {
    name: "",
    phone: "",
    birthDate: "",
    gender: "",
    isForeigner: false,
    storeId,
    jobTitle: "",
    employmentType: "FULL_TIME",
    startDate: "",
    endDate: "",
    wage: "",
    days: ["MON", "TUE", "WED", "THU", "FRI"],
    work: span("09", "18"),
    rest: span("12", "13"),
    payMonth: "NEXT_MONTH",
    payDay: "10",
    isHealthPensionInsured: false,
    isEmploymentInjuryInsured: false,
    workLocation: "",
    mealAllowance: "",
    carAllowance: "",
    childcareAllowance: "",
    baseHours: "",
    monthlyOvertimeHours: "",
    baseNightHours: "",
    annualLeaveTerms: DEFAULT_ANNUAL_LEAVE_TERMS,
    severancePayTerms: DEFAULT_SEVERANCE_PAY_TERMS,
    dayTimes: {},
    weeklyHoliday: "",
    payMethod: "ACCOUNT",
    contractMethod: "ELECTRONIC",
    probation: false,
    probationMonths: "3",
    probationRate: "10",
  };
}

/** GET /contracts/:contractId. api 의 openapi.json 에서 만든 타입을 쓴다(pnpm openapi:types) */
export type ContractDetail = components["schemas"]["ContractDetailDto"];

const toHourMinute = (hhmm: string): HourMinute => ({ hour: hhmm.slice(0, 2), minute: hhmm.slice(3, 5) === "30" ? "30" : "00" });

/**
 * 임시저장한 계약을 폼으로 되돌린다. 위 근무시간 · 휴게시간은 첫 근무 요일의 시각을 쓰고, 파트타이머는 요일마다 저장한 시각을
 * 표의 요일별 시간(dayTimes)으로 연다. 비어 있는 칸은 처음 값(initialForm)을 둔다 — 근무시간 · 휴게 · 지급 월 · 지급 방식처럼 늘 값이 있는 칸.
 */
export function fromDetail(d: ContractDetail): ContractForm {
  const base = initialForm(String(d.storeId));
  const first = d.workDays[0];
  const timesFrom = (w: ContractDetail["workDays"][number]): DayTimes => ({
    work: { start: toHourMinute(w.startTime), end: toHourMinute(w.endTime) },
    rest: w.breakStartTime && w.breakEndTime ? { start: toHourMinute(w.breakStartTime), end: toHourMinute(w.breakEndTime) } : base.rest,
  });
  return {
    ...base,
    name: d.name,
    phone: formatPhone(d.phone),
    birthDate: d.birthDate ?? "",
    gender: d.gender ?? "",
    isForeigner: d.isForeigner,
    jobTitle: d.jobTitle,
    employmentType: d.employmentType,
    startDate: d.startDate ?? "",
    endDate: d.endDate ?? "",
    wage: d.wageAmount === null ? "" : d.wageAmount.toLocaleString("ko-KR"),
    days: d.workDays.map((w) => w.weekday),
    work: first ? { start: toHourMinute(first.startTime), end: toHourMinute(first.endTime) } : base.work,
    rest: first?.breakStartTime && first.breakEndTime ? { start: toHourMinute(first.breakStartTime), end: toHourMinute(first.breakEndTime) } : base.rest,
    payMonth: d.payMonth ?? base.payMonth,
    payDay: d.payDay === null ? "" : String(d.payDay),
    isHealthPensionInsured: d.isHealthPensionInsured ?? false,
    isEmploymentInjuryInsured: d.isEmploymentInjuryInsured ?? false,
    workLocation: d.workLocation ?? "",
    mealAllowance: moneyText(d.mealAllowanceAmount),
    carAllowance: moneyText(d.carAllowanceAmount),
    childcareAllowance: moneyText(d.childcareAllowanceAmount),
    baseHours: hoursText(d.baseHours),
    monthlyOvertimeHours: hoursText(d.monthlyOvertimeHours),
    baseNightHours: hoursText(d.baseNightHours),
    // 임시저장에서 조항을 비워 두었으면 비운 채로 연다 — 기본 문구는 새로 쓸 때만 채운다
    annualLeaveTerms: d.annualLeaveTerms ?? "",
    severancePayTerms: d.severancePayTerms ?? "",
    dayTimes: d.employmentType === "PART_TIME" ? Object.fromEntries(d.workDays.map((w) => [w.weekday, timesFrom(w)])) : {},
    weeklyHoliday: d.weeklyHoliday ?? "",
    payMethod: d.payMethod ?? base.payMethod,
    contractMethod: d.contractMethod ?? base.contractMethod,
    probation: d.probationMonths != null,
    probationMonths: d.probationMonths === 1 || d.probationMonths === 2 ? (String(d.probationMonths) as "1" | "2") : "3",
    probationRate: d.probationWageReductionRate == null ? base.probationRate : String(d.probationWageReductionRate),
  };
}

const moneyText = (n: number | null | undefined) => (n == null ? "" : n.toLocaleString("ko-KR"));
const hoursText = (n: number | null | undefined) => (n == null ? "" : String(n));

export const digits = (s: string) => s.replace(/\D/g, "");

/**
 * 입력칸에 보이는 휴대전화번호. 숫자만 남기고 하이픈을 넣는다. 저장은 숫자만 보낸다.
 * 010 은 11자리라 치는 동안에도 3-4-4, 그 밖(011 · 016 …)은 10자리라 3-3-4 로 가다가 11자리가 되면 3-4-4.
 */
export function formatPhone(input: string): string {
  const d = digits(input).slice(0, 11);
  const mid = d.startsWith("010") || d.length === 11 ? 4 : 3;
  if (d.length <= 3) return d;
  if (d.length <= 3 + mid) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 3 + mid)}-${d.slice(3 + mid)}`;
}
export const hm = (t: HourMinute) => `${t.hour}:${t.minute}`;
const minutes = (t: HourMinute) => Number(t.hour) * 60 + Number(t.minute);

/** 금액 칸 상한 — api integer 칸(2,147,483,647) */
export const MAX_AMOUNT = 2147483647;

// 종이 계약 날인본 파일(CTR-23). 허용 형식은 GET /enums/AttachmentFileType 값(PDF · JPG · PNG)을 받아 쓰고, 여기에는 형식별 MIME · 확장자만 둔다 —
// 브라우저 파일 선택 창 규칙이라 코드에 둔다. api 가 내용으로 다시 판정한다.
const PAPER_FORMAT: Record<string, { mime: string; extensions: string[] }> = {
  PDF: { mime: "application/pdf", extensions: [".pdf"] },
  JPG: { mime: "image/jpeg", extensions: [".jpg", ".jpeg"] },
  PNG: { mime: "image/png", extensions: [".png"] },
};
/** 날인본 한 개의 상한 — api 첨부 저장소의 10MB */
export const PAPER_FILE_MAX_BYTES = 10 * 1024 * 1024;

/** enum 값 중 화면이 아는 형식만 — ["PDF", "JPG", "PNG"] */
export const paperFileTypesOf = (values: readonly string[]) => values.filter((v) => Object.hasOwn(PAPER_FORMAT, v));

/** 파일 선택 창의 accept — "application/pdf,.pdf,image/jpeg,.jpg,…" */
export const paperFileAccept = (types: readonly string[]) => types.flatMap((t) => [PAPER_FORMAT[t].mime, ...PAPER_FORMAT[t].extensions]).join(",");

/** 고른 날인본을 올릴 수 있는가. 문제가 없으면 null */
export function paperFileError(file: { name: string; type: string; size: number }, types: readonly string[]): string | null {
  const name = file.name.toLowerCase();
  if (!types.some((t) => file.type === PAPER_FORMAT[t].mime || PAPER_FORMAT[t].extensions.some((e) => name.endsWith(e))))
    return `${types.join(" · ")} 파일만 올릴 수 있습니다.`;
  if (file.size === 0) return "빈 파일입니다. 다른 파일을 골라 주세요.";
  if (file.size > PAPER_FILE_MAX_BYTES) return "파일은 10MB까지 올릴 수 있습니다.";
  return null;
}

/** 입력칸에 보이는 급여액. 숫자만 남기고 세 자리마다 쉼표. 10자리까지만 받는다(그 위는 숫자가 뭉개진다) */
export function formatWage(input: string): string {
  const d = digits(input).replace(/^0+(?=\d)/, "").slice(0, 10);
  return d ? Number(d).toLocaleString("ko-KR") : "";
}

/** 근로시간 칸 글자. 숫자와 소수점 한 번만 남긴다 */
export function formatHours(input: string): string {
  const [whole, ...rest] = input.replace(/[^\d.]/g, "").split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 1)}` : whole;
}

/** 근로시간 글자를 시간으로. 비었으면 null, 0 이상 · 30분(0.5) 단위 · 9999.5 이하가 아니면 NaN */
export function hoursOf(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 && n <= 9999.5 && Number.isInteger(n * 2) ? n : NaN;
}

/** 하루 소정근로시간(시간). 종업 - 시업 - 휴게 */
export function dailyHours(f: Pick<ContractForm, "work" | "rest">): number {
  return Math.max(0, minutes(f.work.end) - minutes(f.work.start) - (minutes(f.rest.end) - minutes(f.rest.start))) / 60;
}

/** 시간 계산에 쓰는 칸. 고용 형태 · 요일별 시간이 없으면 모든 요일이 위 근무시간 · 휴게시간이다 */
type Schedule = Pick<ContractForm, "days" | "work" | "rest"> & Partial<Pick<ContractForm, "employmentType" | "dayTimes">>;

/** 그 요일의 시간. 파트타이머가 표에서 고친 요일이면 그 값, 아니면 위 근무시간 · 휴게시간 */
export function timesOf(f: Omit<Schedule, "days">, d: Weekday): DayTimes {
  return (f.employmentType === "PART_TIME" && f.dayTimes?.[d]) || { work: f.work, rest: f.rest };
}

/** 주 소정근로시간(시간). 근무 요일마다 종업 - 시업 - 휴게를 더한다 */
export function weeklyHours(f: Schedule): number {
  return f.days.reduce((sum, d) => sum + dailyHours(timesOf(f, d)), 0);
}

/** 월 소정근로시간(시간) — 주 시간 × 4.345. 60시간 이상이면 4대보험 가입이 원칙이다(노무사 확인 2026-10-14, 질문 6) */
export const monthlyHours = (f: Schedule) => weeklyHours(f) * WEEKS_PER_MONTH;

// 급여 계산(현업 엑셀 견본, 2026-10-13). 저장하지 않고 화면에만 보인다 — api 는 시급과 입력 칸만 받는다.
const wageOf = (f: Pick<ContractForm, "wage">) => Number(digits(f.wage)) || 0;
const wonOf = (text: string) => Number(digits(text)) || 0;

/** 정직원 급여항목의 시급 배율 — 기본시간 1, 연장 1.5, 야간 0.5(가산분) */
export const PAY_RATES: Record<HourField, number> = {
  baseHours: 1,
  monthlyOvertimeHours: 1.5,
  baseNightHours: 0.5,
};

/** 정직원 급여. 월급여 = 급여항목 합계 + 비과세 합계, 연봉 = 월급여 × 12. 칸이 비었거나 틀리면 그 줄은 0 원 */
export function fullTimePay(f: ContractForm) {
  const wage = wageOf(f);
  const items = HOUR_FIELDS.map((key) => {
    const hours = hoursOf(f[key]);
    return { key, amount: hours === null || Number.isNaN(hours) ? 0 : Math.round(hours * wage * PAY_RATES[key]) };
  });
  const payTotal = items.reduce((sum, i) => sum + i.amount, 0);
  const taxFree = wonOf(f.mealAllowance) + wonOf(f.carAllowance) + wonOf(f.childcareAllowance);
  const monthly = payTotal + taxFree;
  return { items, payTotal, taxFree, monthly, annual: monthly * 12 };
}

/** 월 환산 주 수(365 ÷ 7 ÷ 12) */
export const WEEKS_PER_MONTH = 4.345;

/**
 * 파트타이머 급여. 요일 소계 = 시급 × 그날 시간(원 미만 반올림), 근무 소계 = 요일 소계의 합, 주휴시간 = 주 시간 ÷ 5(주 15시간 이상, 8시간까지 —
 * 노무사 확인 2026-10-14, 질문 1), 주급 = 근무 소계 + 주휴수당, 월급여 = 주급 × 4.345. 견본의 「수당」 줄은 저장할 칸이 정해지지 않아 뺐다(2026-10-13).
 */
export function partTimePay(f: ContractForm) {
  const wage = wageOf(f);
  const days = WEEKDAYS.map((d) => {
    const hours = f.days.includes(d) ? dailyHours(timesOf(f, d)) : null;
    return { d, hours, amount: hours === null ? null : Math.round(hours * wage) };
  });
  const workHours = weeklyHours(f);
  const workPay = days.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const holidayHours = workHours >= 15 ? Math.min(8, workHours / 5) : 0;
  const holidayPay = Math.round(holidayHours * wage);
  const weekly = workPay + holidayPay;
  return { days, workHours, workPay, holidayHours, holidayPay, weekly, monthly: Math.round(weekly * WEEKS_PER_MONTH) };
}

/** 시급 옆 월급 칸. 정직원은 월급여, 파트타이머는 주급 × 4.345. 시급이 비었으면 null */
export function monthlyWage(f: ContractForm): number | null {
  if (!wageOf(f)) return null;
  return f.employmentType === "FULL_TIME" ? fullTimePay(f).monthly : partTimePay(f).monthly;
}

const FROM_SUNDAY: Weekday[] = ["SUN", "SAT", "FRI", "THU", "WED", "TUE", "MON"];

/**
 * 주휴일(노무사 확인 2026-10-14, 질문 4 — 특정 요일로 정해 계약서 휴일 조항에 적는다). 주 15시간 미만이면 null(주휴 대상 아님).
 * 15시간 이상이면 관리자가 고른 요일, 고르지 않았거나 그 요일에 근무하면 월~일 중 근무하지 않는 가장 뒤 요일.
 * 7일 모두 근무하면 둘 요일이 없다(NO_DAY_OFF, 초안 저장이 막힌다).
 */
export function weeklyHolidayOf(f: Schedule & Partial<Pick<ContractForm, "weeklyHoliday">>): Weekday | null | "NO_DAY_OFF" {
  if (weeklyHours(f) < 15) return null;
  if (f.weeklyHoliday && !f.days.includes(f.weeklyHoliday)) return f.weeklyHoliday;
  return FROM_SUNDAY.find((d) => !f.days.includes(d)) ?? "NO_DAY_OFF";
}

/** 최저임금(시급, 원). 시스템이 공통코드처럼 관리하기 전까지 화면에 둔다(2026-10-15) */
export const MINIMUM_WAGE = 10320;
/** 수습 중 시급의 하한 — 최저임금의 90%(노무사 확인 2026-10-14, 질문 19) */
export const PROBATION_WAGE_FLOOR = Math.ceil(MINIMUM_WAGE * 0.9);

/** 수습 중 시급 = 시급 × (1 − 감액률), 원 미만 반올림. 시급이 비었거나 감액률이 틀리면 null */
export function probationWage(f: Pick<ContractForm, "wage" | "probationRate">): number | null {
  const rate = Number(f.probationRate);
  if (!wageOf(f) || !/^\d+$/.test(f.probationRate) || rate > 10) return null;
  return Math.round(wageOf(f) * (1 - rate / 100));
}

/** start 부터 1년이 되는 날(그날 포함) — 2026-01-01 이면 2026-12-31. api 와 같다 */
function oneYearLastDay(start: string): string {
  const d = new Date(`${start}T00:00:00.000Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** 수습을 둘 수 있는 계약 기간인가 — 1년 이상이거나 기간의 정함이 없을 때. 시작일이 비었으면 아직 따지지 않는다 */
export const probationTermOk = (f: Pick<ContractForm, "startDate" | "endDate">) =>
  !f.startDate || !f.endDate || f.endDate >= oneYearLastDay(f.startDate);

const DAY_KO: Record<Weekday, string> = { MON: "월", TUE: "화", WED: "수", THU: "목", FRI: "금", SAT: "토", SUN: "일" };

/** 근무시간 · 휴게시간 한 벌의 문제. who 는 「월요일 」처럼 요일을 앞에 붙일 때 */
function timeProblems(t: DayTimes, who = ""): string[] {
  const out: string[] = [];
  if (minutes(t.work.end) <= minutes(t.work.start)) out.push(`${who}근무시간은 끝이 시작보다 뒤여야 합니다`);
  if (!(minutes(t.rest.start) >= minutes(t.work.start) && minutes(t.rest.end) > minutes(t.rest.start) && minutes(t.rest.end) <= minutes(t.work.end)))
    out.push(`${who}휴게시간은 근무시간 안이어야 합니다`);
  return out;
}

/** on 날짜에 만 몇 살인지. 생일 당일에 한 살 는다. api ageOn 과 같다 */
export function ageOn(birth: string, on: string): number {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [oy, om, od] = on.split("-").map(Number);
  return oy - by - (om < bm || (om === bm && od < bd) ? 1 : 0);
}

/** 계약 시작일 기준 만 19세 미만인지. 두 날짜가 다 있어야 판정한다 */
export const isMinor = (f: Pick<ContractForm, "birthDate" | "startDate">) =>
  Boolean(f.birthDate && f.startDate) && ageOn(f.birthDate, f.startDate) < 19;

/**
 * 저장 전에 화면이 먼저 막는 것. api 도 같은 것을 다시 본다.
 * 임시저장은 직원 칸(이름 · 번호 · 직무)과 근무지만 필수이고, 비운 칸은 묻지 않되 넣은 값은 똑같이 본다.
 */
export function problems(f: ContractForm, temporary = false, hasEmploymentFile = false): string[] {
  const out: string[] = [];
  const need = (empty: boolean, message: string) => {
    if (empty && !temporary) out.push(message);
  };
  if (!f.name.trim()) out.push("이름을 입력하세요");
  if (!/^[0-9]{10,11}$/.test(digits(f.phone))) out.push("휴대전화번호는 숫자 10~11자리입니다");
  need(!f.birthDate, "생년월일을 입력하세요");
  need(!f.gender, "성별을 고르세요");
  if (!f.storeId) out.push("소속 근무지를 고르세요");
  if (!f.jobTitle.trim()) out.push("직무를 입력하세요");
  need(!f.startDate, "계약 시작일을 입력하세요");
  if (f.startDate && f.endDate && f.endDate < f.startDate) out.push("계약 종료일은 시작일보다 앞설 수 없습니다");
  if (digits(f.wage) ? !(Number(digits(f.wage)) > 0) : !temporary) out.push("시급을 입력하세요"); // 고용 형태와 상관없이 시급(2026-10-12 재영)
  need(f.days.length === 0, "근무요일을 하나 이상 고르세요");
  out.push(...timeProblems(f));
  // 파트타이머가 표에서 고친 요일은 그 요일 시간도 본다
  if (f.employmentType === "PART_TIME")
    for (const d of WEEKDAYS) {
      const t = f.dayTimes[d];
      if (t && f.days.includes(d)) out.push(...timeProblems(t, `${DAY_KO[d]}요일 `));
    }
  need(weeklyHolidayOf(f) === "NO_DAY_OFF", "주 15시간 이상이면 근무하지 않는 요일이 있어야 주휴일을 정할 수 있습니다");
  const day = Number(f.payDay);
  if (f.payDay ? !(Number.isInteger(day) && day >= 1 && day <= 31) : !temporary) out.push("임금지급일은 1~31입니다");
  if (f.employmentType === "FULL_TIME") {
    if (HOUR_FIELDS.some((k) => Number.isNaN(hoursOf(f[k])))) out.push("월 근로시간은 0 이상, 30분(0.5시간) 단위로 입력하세요");
    const base = hoursOf(f.baseHours), night = hoursOf(f.baseNightHours);
    if (base !== null && night !== null && night > base) out.push("기본시간 중 야간근무는 월 기본시간보다 클 수 없습니다");
    if ([f.mealAllowance, f.carAllowance, f.childcareAllowance].some((t) => Number(digits(t)) > MAX_AMOUNT))
      out.push("비과세 수당은 2,147,483,647원 이하로 입력하세요");
    if (f.probation) {
      if (!/^\d+$/.test(f.probationRate) || Number(f.probationRate) > 10) out.push("수습 임금 감액률은 0~10% 정수로 입력하세요");
      if (!probationTermOk(f)) out.push("수습은 계약 기간이 1년 이상이거나 기간의 정함이 없을 때만 둘 수 있습니다");
      const pw = probationWage(f);
      if (pw !== null && pw < PROBATION_WAGE_FLOOR)
        out.push(`수습 중 시급은 최저임금의 90%(${PROBATION_WAGE_FLOOR.toLocaleString("ko-KR")}원) 이상이어야 합니다`);
    }
  }
  if (Number(digits(f.wage)) > MAX_AMOUNT) out.push("시급은 2,147,483,647원 이하로 입력하세요");
  if (isMinor(f)) out.push("만 19세 미만 직원은 등록할 수 없습니다");
  // 종이 계약 등록은 당사자가 모두 날인한 근로계약서가 있어야 한다(CTR-23). 임시저장은 파일 없이 둔다
  if (f.contractMethod === "PAPER" && !temporary && !hasEmploymentFile) out.push("당사자가 모두 날인한 근로계약서 파일을 올려 주세요");
  return out;
}

/** temporary 면 임시저장으로 보낸다. 비운 칸은 보내지 않는다. 지금은 어느 쪽도 초대를 보내지 않는다(초대 발송 전) */
export function toBody(f: ContractForm, temporary = false): CreateContractBody {
  const days = WEEKDAYS.filter((d) => f.days.includes(d));
  const holiday = weeklyHolidayOf(f);
  return {
    name: f.name.trim(),
    phone: digits(f.phone),
    ...(f.birthDate ? { birthDate: f.birthDate } : {}),
    ...(f.gender ? { gender: f.gender } : {}),
    isForeigner: f.isForeigner,
    storeId: Number(f.storeId),
    jobTitle: f.jobTitle.trim(),
    employmentType: f.employmentType,
    contractMethod: f.contractMethod,
    ...(f.startDate ? { startDate: f.startDate } : {}),
    ...(f.endDate ? { endDate: f.endDate } : {}),
    ...(digits(f.wage) ? { wageAmount: Number(digits(f.wage)) } : {}),
    ...(f.workLocation.trim() ? { workLocation: f.workLocation.trim() } : {}),
    // 요일 순서는 월~일로 맞춘다(누른 순서와 상관없이)
    ...(days.length === 0
      ? {}
      : {
          workDays: days.map((weekday) => {
            const t = timesOf(f, weekday);
            return {
              weekday,
              startTime: hm(t.work.start),
              endTime: hm(t.work.end),
              breakStartTime: hm(t.rest.start),
              breakEndTime: hm(t.rest.end),
            };
          }),
        }),
    // 주 15시간 미만이면 주휴일이 없어 보내지 않는다
    ...(holiday && holiday !== "NO_DAY_OFF" ? { weeklyHoliday: holiday } : {}),
    payMonth: f.payMonth,
    ...(f.payDay ? { payDay: Number(f.payDay) } : {}),
    payMethod: f.payMethod,
    isHealthPensionInsured: f.isHealthPensionInsured,
    isEmploymentInjuryInsured: f.isEmploymentInjuryInsured,
    // 비과세 수당 · 월 근로시간은 정직원 칸이다. 파트타이머로 바꾸면 화면에서 숨기고 보내지 않는다.
    ...(f.employmentType === "FULL_TIME"
      ? {
          ...money("mealAllowanceAmount", f.mealAllowance),
          ...money("carAllowanceAmount", f.carAllowance),
          ...money("childcareAllowanceAmount", f.childcareAllowance),
          ...Object.fromEntries(HOUR_FIELDS.flatMap((k) => (hoursOf(f[k]) === null ? [] : [[k, hoursOf(f[k])]]))),
          // 수습은 정직원만(노무사 확인 2026-10-14). 기간과 감액률을 함께 보낸다
          ...(f.probation ? { probationMonths: Number(f.probationMonths), probationWageReductionRate: Number(f.probationRate) } : {}),
        }
      : {}),
    ...(f.annualLeaveTerms.trim() ? { annualLeaveTerms: f.annualLeaveTerms.trim() } : {}),
    ...(f.severancePayTerms.trim() ? { severancePayTerms: f.severancePayTerms.trim() } : {}),
    ...(temporary ? { isTemporarySave: true } : {}),
  };
}

// 수당은 0 원도 값이다(비과세 수당 없음). 비운 칸만 보내지 않는다.
const money = (key: "mealAllowanceAmount" | "carAllowanceAmount" | "childcareAllowanceAmount", text: string) =>
  digits(text) ? { [key]: Number(digits(text)) } : {};
