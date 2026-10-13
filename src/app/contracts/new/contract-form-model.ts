// 근로계약서 초안 폼의 순수 로직 — 입력값 → API 본문, 주 소정근로시간, 만 19세 판정.
// 테스트: node --test src/app/contracts/new/contract-form-model.test.ts

import type { components } from "../../../lib/api-types.generated";

export const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type EmploymentType = "FULL_TIME" | "PART_TIME";
export type PayMonth = "CURRENT_MONTH" | "NEXT_MONTH";

/** 시 · 분 (분은 00 · 30) */
export interface HourMinute {
  hour: string;
  minute: "00" | "30";
}
export interface TimeSpan {
  start: HourMinute;
  end: HourMinute;
}

/**
 * 화면의 입력값. 근무시간 · 휴게시간은 고른 요일 모두에 같게 들어간다(데모 contracts-new, 2026-10-02 재영).
 * 요일마다 다른 시간은 근무스케줄에서 고친다.
 */
export interface ContractForm {
  name: string;
  phone: string;
  birthDate: string;
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
  baseHolidayHours: string;
  monthlyExtraHolidayHours: string;
  annualLeaveTerms: string;
  severancePayTerms: string;
}

/** 월 근로시간 칸 — 폼 키와 api 칸 이름이 같다 */
export const HOUR_FIELDS = ["baseHours", "monthlyOvertimeHours", "baseNightHours", "baseHolidayHours", "monthlyExtraHolidayHours"] as const;
export type HourField = (typeof HOUR_FIELDS)[number];

/** 조항 기본 문구. DB 가 아니라 작성 화면이 채우고 관리자가 고친다(2026-10-12 재영) */
export const DEFAULT_ANNUAL_LEAVE_TERMS = "근로기준법 제50조에 의거하여 연차휴가를 제공함";
export const DEFAULT_SEVERANCE_PAY_TERMS = "계속근로기간 1년에 대하여 30일분의 퇴직금을 지급함";

/** POST · PUT /contracts 본문. api 의 openapi.json 에서 만든 타입을 쓴다(pnpm openapi:types). 임시저장이면 계약 칸은 비워 보낼 수 있다 */
export type CreateContractBody = components["schemas"]["CreateContractDto"];

/** 같은 점포 · 같은 번호의 진행 중 계약 — 대체할지 묻는 데 쓴다 */
export type InProgressContract = { contractId: number; status: string };

/** 저장 서버 액션의 결과. 성공하면 액션이 목록으로 보내므로 돌아왔다면 실패다 */
export interface SaveResult {
  error: string;
  /** 있으면 같은 점포에 진행 중 계약이 있어 저장하지 않았다 — 대체를 확인받아 다시 보낸다 */
  inProgress?: InProgressContract[];
}

/**
 * api 409 본문에서 대체할 진행 중 계약 목록을 꺼낸다(code CONTRACT_IN_PROGRESS). 다른 409(근무 시간 겹침 ·
 * 재직 중)는 undefined — 그 문장(겹친 요일 · 시간 포함)을 그대로 보이면 된다.
 */
export function inProgressOf(body: unknown): InProgressContract[] | undefined {
  const b = body as { code?: unknown; contracts?: unknown } | null;
  if (b?.code !== "CONTRACT_IN_PROGRESS" || !Array.isArray(b.contracts)) return undefined;
  const list = b.contracts.filter(
    (c): c is InProgressContract =>
      typeof (c as InProgressContract)?.contractId === "number" && typeof (c as InProgressContract)?.status === "string",
  );
  return list.length ? list : undefined;
}

const span = (sh: string, eh: string): TimeSpan => ({ start: { hour: sh, minute: "00" }, end: { hour: eh, minute: "00" } });

/** 처음 열었을 때의 값. 정직원 · 월~금 09~18 · 휴게 12~13 · 익월 10일 (데모와 같다). 주휴일은 근무로 정해진다 */
export function initialForm(storeId = ""): ContractForm {
  return {
    name: "",
    phone: "",
    birthDate: "",
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
    baseHolidayHours: "",
    monthlyExtraHolidayHours: "",
    annualLeaveTerms: DEFAULT_ANNUAL_LEAVE_TERMS,
    severancePayTerms: DEFAULT_SEVERANCE_PAY_TERMS,
  };
}

/** GET /contracts/:contractId. api 의 openapi.json 에서 만든 타입을 쓴다(pnpm openapi:types) */
export type ContractDetail = components["schemas"]["ContractDetailDto"];

const toHourMinute = (hhmm: string): HourMinute => ({ hour: hhmm.slice(0, 2), minute: hhmm.slice(3, 5) === "30" ? "30" : "00" });

/**
 * 임시저장한 계약을 폼으로 되돌린다. 폼은 요일마다 같은 시간을 쓰므로 첫 근무 요일의 시각을 쓴다.
 * 비어 있는 칸은 처음 값(initialForm)을 둔다 — 근무시간 · 휴게 · 주휴일 · 지급 월처럼 늘 값이 있는 칸.
 */
export function fromDetail(d: ContractDetail): ContractForm {
  const base = initialForm(String(d.storeId));
  const first = d.workDays[0];
  return {
    ...base,
    name: d.name,
    phone: formatPhone(d.phone),
    birthDate: d.birthDate ?? "",
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
    baseHolidayHours: hoursText(d.baseHolidayHours),
    monthlyExtraHolidayHours: hoursText(d.monthlyExtraHolidayHours),
    // 임시저장에서 조항을 비워 두었으면 비운 채로 연다 — 기본 문구는 새로 쓸 때만 채운다
    annualLeaveTerms: d.annualLeaveTerms ?? "",
    severancePayTerms: d.severancePayTerms ?? "",
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

/** 입력칸에 보이는 급여액. 숫자만 남기고 세 자리마다 쉼표 */
export function formatWage(input: string): string {
  const d = digits(input).replace(/^0+(?=\d)/, "");
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

/**
 * 정직원 월급(참고). 급여는 고용 형태와 상관없이 시급만 저장하고, 정직원 월급은 시급 × 월 기본시간으로 셈해
 * 보인다(현업 요구사항, 2026-10-12 재영). 둘 중 하나가 비었거나 틀리면 null.
 */
export function monthlyWage(f: Pick<ContractForm, "wage" | "baseHours">): number | null {
  const wage = Number(digits(f.wage));
  const hours = hoursOf(f.baseHours);
  if (!wage || hours === null || Number.isNaN(hours)) return null;
  return Math.round(wage * hours);
}

/** 주 소정근로시간(시간). (종업 - 시업 - 휴게) × 근무 요일 수 */
export function weeklyHours(f: Pick<ContractForm, "days" | "work" | "rest">): number {
  const perDay = minutes(f.work.end) - minutes(f.work.start) - (minutes(f.rest.end) - minutes(f.rest.start));
  return Math.max(0, perDay) * f.days.length / 60;
}

const FROM_SUNDAY: Weekday[] = ["SUN", "SAT", "FRI", "THU", "WED", "TUE", "MON"];

/**
 * 주휴일 규칙 — 7일 근무를 협의하기 전까지 화면에서 숨기고 api 는 NULL 로 저장한다(2026-10-08). 협의 뒤 다시 쓴다.
 * 주 15시간 이상이면 월~일 중 근무하지 않는 가장 뒤 요일,
 * 미만이면 null(주휴 대상 아님). 15시간 이상인데 7일 모두 근무하면 둘 요일이 없다(NO_DAY_OFF, 저장이 막힌다).
 */
export function weeklyHolidayOf(f: Pick<ContractForm, "days" | "work" | "rest">): Weekday | null | "NO_DAY_OFF" {
  if (weeklyHours(f) < 15) return null;
  return FROM_SUNDAY.find((d) => !f.days.includes(d)) ?? "NO_DAY_OFF";
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
export function problems(f: ContractForm, temporary = false): string[] {
  const out: string[] = [];
  const need = (empty: boolean, message: string) => {
    if (empty && !temporary) out.push(message);
  };
  if (!f.name.trim()) out.push("이름을 입력하세요");
  if (!/^[0-9]{10,11}$/.test(digits(f.phone))) out.push("휴대전화번호는 숫자 10~11자리입니다");
  need(!f.birthDate, "생년월일을 입력하세요");
  if (!f.storeId) out.push("소속 근무지를 고르세요");
  if (!f.jobTitle.trim()) out.push("직무를 입력하세요");
  need(!f.startDate, "계약 시작일을 입력하세요");
  if (f.startDate && f.endDate && f.endDate < f.startDate) out.push("계약 종료일은 시작일보다 앞설 수 없습니다");
  if (digits(f.wage) ? !(Number(digits(f.wage)) > 0) : !temporary) out.push("시급을 입력하세요"); // 고용 형태와 상관없이 시급(2026-10-12 재영)
  need(f.days.length === 0, "근무요일을 하나 이상 고르세요");
  if (minutes(f.work.end) <= minutes(f.work.start)) out.push("근무시간은 끝이 시작보다 뒤여야 합니다");
  if (!(minutes(f.rest.start) >= minutes(f.work.start) && minutes(f.rest.end) > minutes(f.rest.start) && minutes(f.rest.end) <= minutes(f.work.end)))
    out.push("휴게시간은 근무시간 안이어야 합니다");
  const day = Number(f.payDay);
  if (f.payDay ? !(Number.isInteger(day) && day >= 1 && day <= 31) : !temporary) out.push("임금지급일은 1~31입니다");
  if (HOUR_FIELDS.some((k) => Number.isNaN(hoursOf(f[k])))) out.push("월 근로시간은 0 이상, 30분(0.5시간) 단위로 입력하세요");
  if (isMinor(f)) out.push("만 19세 미만 직원은 등록할 수 없습니다");
  return out;
}

/** temporary 면 임시저장으로 보낸다. 비운 칸은 보내지 않는다. 지금은 어느 쪽도 초대를 보내지 않는다(초대 발송 전) */
export function toBody(f: ContractForm, temporary = false): CreateContractBody {
  const days = WEEKDAYS.filter((d) => f.days.includes(d));
  return {
    name: f.name.trim(),
    phone: digits(f.phone),
    ...(f.birthDate ? { birthDate: f.birthDate } : {}),
    storeId: Number(f.storeId),
    jobTitle: f.jobTitle.trim(),
    employmentType: f.employmentType,
    contractMethod: "ELECTRONIC",
    ...(f.startDate ? { startDate: f.startDate } : {}),
    ...(f.endDate ? { endDate: f.endDate } : {}),
    ...(digits(f.wage) ? { wageAmount: Number(digits(f.wage)) } : {}),
    ...(f.workLocation.trim() ? { workLocation: f.workLocation.trim() } : {}),
    // 요일 순서는 월~일로 맞춘다(누른 순서와 상관없이)
    ...(days.length === 0
      ? {}
      : {
          workDays: days.map((weekday) => ({
      weekday,
      startTime: hm(f.work.start),
      endTime: hm(f.work.end),
      breakStartTime: hm(f.rest.start),
      breakEndTime: hm(f.rest.end),
          })),
        }),
    payMonth: f.payMonth,
    ...(f.payDay ? { payDay: Number(f.payDay) } : {}),
    isHealthPensionInsured: f.isHealthPensionInsured,
    isEmploymentInjuryInsured: f.isEmploymentInjuryInsured,
    ...money("mealAllowanceAmount", f.mealAllowance),
    ...money("carAllowanceAmount", f.carAllowance),
    ...money("childcareAllowanceAmount", f.childcareAllowance),
    ...Object.fromEntries(HOUR_FIELDS.flatMap((k) => (hoursOf(f[k]) === null ? [] : [[k, hoursOf(f[k])]]))),
    ...(f.annualLeaveTerms.trim() ? { annualLeaveTerms: f.annualLeaveTerms.trim() } : {}),
    ...(f.severancePayTerms.trim() ? { severancePayTerms: f.severancePayTerms.trim() } : {}),
    ...(temporary ? { isTemporarySave: true } : {}),
  };
}

// 수당은 0 원도 값이다(비과세 수당 없음). 비운 칸만 보내지 않는다.
const money = (key: "mealAllowanceAmount" | "carAllowanceAmount" | "childcareAllowanceAmount", text: string) =>
  digits(text) ? { [key]: Number(digits(text)) } : {};
