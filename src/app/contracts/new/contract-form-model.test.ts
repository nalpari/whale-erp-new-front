// node --test src/app/contracts/new/contract-form-model.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ageOn,
  fieldProblems,
  problemsByField,
  shownProblems,
  DEFAULT_ANNUAL_LEAVE_TERMS,
  DEFAULT_SEVERANCE_PAY_TERMS,
  formatHours,
  formatPhone,
  formatWage,
  fromDetail,
  canRenew,
  renewalFromDetail,
  hoursOf,
  initialForm,
  inProgressLine,
  stillCorrecting,
  replaceConfirmBody,
  inProgressOf,
  isMinor,
  minimumWageOn,
  monthlyWage,
  fullTimePay,
  PAPER_FILE_MAX_BYTES,
  paperFileAccept,
  paperFileError,
  paperFileTypesOf,
  partTimePay,
  probationWage,
  probationWageFloor,
  renewalStartProblem,
  signedOverlapOf,
  toBody,
  weeklyHolidayOf,
  weeklyHours,
  type ContractDetail,
  type ContractForm,
  type ProblemField,
} from "./contract-form-model.ts";

/** 문장만 — 칸 매핑은 problemsByField 테스트가 본다 */
const problems = (...a: Parameters<typeof fieldProblems>) => fieldProblems(...a).map((p) => p.message);
// api 공통코드 최저임금(WHALEERP-595) — 2026년 10,320원 → 수습 중 시급 하한 9,288원
const WAGES2026 = [{ effectiveDate: "2026-01-01", hourlyWage: 10320 }];

const filled = (over: Partial<ContractForm> = {}): ContractForm => ({
  ...initialForm("11"),
  name: " 남도현 ",
  phone: "010-9014-5563",
  birthDate: "1998-07-12",
  gender: "MALE",
  jobTitle: "바리스타",
  startDate: "2026-09-14",
  wage: "12,000",
  ...over,
});

/** 상세 응답 견본 — 비어 있는 임시저장. 테스트마다 필요한 칸만 덮는다 */
const detailOf = (over: Partial<ContractDetail> = {}): ContractDetail => ({
  contractId: 7, staffMemberId: 3, status: "DRAFT", name: "남도현", phone: "01090145563", jobTitle: "바리스타",
  employmentType: "PART_TIME", storeId: 11, storeName: "모리커피 성수점", birthDate: null, gender: null, isForeigner: false, contractMethod: null,
  startDate: null, endDate: null, workLocation: null, weeklyHoliday: null, wageAmount: null,
  mealAllowanceAmount: null, carAllowanceAmount: null, childcareAllowanceAmount: null, baseHours: null,
  monthlyOvertimeHours: null, baseNightHours: null, baseHolidayHours: null, monthlyExtraHolidayHours: null,
  annualLeaveTerms: null, severancePayTerms: null, payMonth: null, payDay: null, payMethod: null,
  probationMonths: null, probationWageReductionRate: null,
  isHealthPensionInsured: null, isEmploymentInjuryInsured: null, draftAction: null, histories: [], workDays: [], documents: [],
  firstSentAt: null, lastSentAt: null, signDeadlineAt: null, lastProcessedAt: null, correctionReason: null, resendCount: 0,
  previousContractId: null, registeredAt: null, registeredBy: null, canResend: false, renewedBy: null, staffJoined: false,
  taxProfile: { status: "NONE", rrnMasked: null, bankName: null, accountNumber: null },
  ...over,
});

test("휴대전화번호는 칠 때 하이픈을 넣는다", () => {
  assert.equal(formatPhone("010"), "010");
  assert.equal(formatPhone("0101"), "010-1");
  assert.equal(formatPhone("0101234"), "010-1234");
  assert.equal(formatPhone("0111234567"), "011-123-4567");
  assert.equal(formatPhone("0111234"), "011-123-4");
  assert.equal(formatPhone("01012345"), "010-1234-5");
  assert.equal(formatPhone("01012345678"), "010-1234-5678");
  assert.equal(formatPhone("010-1234-56789"), "010-1234-5678");
  assert.equal(formatPhone("010 1234 5678"), "010-1234-5678");
  assert.equal(formatPhone(""), "");
});

test("처음 값은 데모와 같은 주 40시간이다", () => {
  assert.equal(weeklyHours(initialForm()), 40);
  assert.equal(weeklyHours({ ...initialForm(), days: ["TUE", "THU", "SAT"] }), 24);
});

test("급여액 입력은 숫자만 남기고 쉼표를 찍는다", () => {
  assert.equal(formatWage("2400000"), "2,400,000");
  assert.equal(formatWage("11,2a00"), "11,200");
  assert.equal(formatWage("007"), "7");
  assert.equal(formatWage(""), "");
});

test("만 19세는 계약 시작일 기준, 생일 당일부터", () => {
  assert.equal(ageOn("2007-09-14", "2026-09-14"), 19);
  assert.equal(ageOn("2007-09-15", "2026-09-14"), 18);
  assert.equal(isMinor({ birthDate: "2007-09-15", startDate: "2026-09-14" }), true);
  assert.equal(isMinor({ birthDate: "2007-09-15", startDate: "" }), false);
});

test("다 채운 폼은 막을 것이 없다", () => {
  assert.deepEqual(problems(filled()), []);
});

test("빈 폼 · 잘못된 값은 이유를 말한다", () => {
  const p = problems(initialForm());
  assert.ok(p.includes("이름을 입력하세요."));
  assert.ok(p.includes("소속 근무지를 고르세요."));
  // 정직원도 시급이다
  assert.ok(p.includes("시급을 입력하세요."));
  assert.ok(problems(filled({ employmentType: "FULL_TIME", wage: "" })).includes("시급을 입력하세요."));
  // 주 15시간 이상인데 7일 모두 근무하면 주휴일을 둘 요일이 없어 막는다(노무사 확인 2026-10-14, 임시저장은 된다)
  const allWeek = filled({ days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] });
  assert.ok(problems(allWeek).includes("주 15시간 이상이면 근무하지 않는 요일이 있어야 주휴일을 정할 수 있습니다."));
  assert.deepEqual(problems(allWeek, true), []);
  assert.ok(problems(filled({ endDate: "2026-09-13" })).includes("계약 종료일은 시작일보다 앞설 수 없습니다."));
  assert.ok(problems(filled({ payDay: "32" })).includes("임금지급일은 1~31입니다."));
  assert.ok(problems(filled({ rest: { start: { hour: "08", minute: "00" }, end: { hour: "09", minute: "00" } } })).includes("휴게시간은 근무시간 안이어야 합니다."));
  assert.ok(problems(filled({ birthDate: "2010-01-01" })).includes("만 19세 미만 직원은 등록할 수 없습니다."));
});

test("임시저장은 직원 칸과 근무지만 필수, 넣은 값은 그대로 본다", () => {
  const blank: ContractForm = { ...initialForm("11"), name: "남도현", phone: "01090145563", jobTitle: "바리스타", days: [], payDay: "" };
  assert.deepEqual(problems(blank, true), []);
  assert.ok(problems(blank).includes("계약 시작일을 입력하세요."));
  assert.ok(problems({ ...blank, name: "" }, true).includes("이름을 입력하세요."));
  assert.ok(problems({ ...blank, payDay: "40" }, true).includes("임금지급일은 1~31입니다."));
  const body = toBody(blank, true);
  assert.equal(body.isTemporarySave, true);
  for (const k of ["startDate", "wageAmount", "workDays", "payDay", "birthDate", "workLocation"]) assert.equal(k in body, false, k);
  assert.equal(toBody({ ...blank, workLocation: " 서울 성동구 연무장길 18 " }).workLocation, "서울 성동구 연무장길 18");
});

test("이어 쓰기: 상세를 폼으로 되돌리고, 다시 보내면 같은 본문이 된다", () => {
  const detail = detailOf({
    birthDate: "1998-07-12", startDate: "2026-09-14",
    workLocation: "서울", weeklyHoliday: "SUN", wageAmount: 11200, payMonth: "NEXT_MONTH", payDay: 10,
    isEmploymentInjuryInsured: true,
    workDays: [
      { weekday: "TUE", startTime: "10:00", endTime: "16:30", breakStartTime: "12:00", breakEndTime: "13:00" },
      { weekday: "THU", startTime: "10:00", endTime: "16:30", breakStartTime: "12:00", breakEndTime: "13:00" },
    ],
  });
  const f = fromDetail(detail);
  assert.equal(f.storeId, "11");
  assert.equal(f.wage, "11,200");
  assert.deepEqual(f.days, ["TUE", "THU"]);
  assert.deepEqual(f.work, { start: { hour: "10", minute: "00" }, end: { hour: "16", minute: "30" } });
  assert.equal(f.isHealthPensionInsured, false);
  const body = toBody(f);
  assert.equal(body.wageAmount, 11200);
  assert.deepEqual(body.workDays, detail.workDays);
  assert.equal(body.workLocation, "서울");

  // 비어 있는 임시저장은 빈 칸으로 열린다
  const empty = fromDetail({ ...detail, birthDate: null, startDate: null, wageAmount: null, payDay: null, weeklyHoliday: null, payMonth: null, workDays: [], workLocation: null });
  assert.equal(empty.wage, "");
  assert.equal(empty.payDay, "");
  assert.deepEqual(empty.days, []);
  assert.equal("workDays" in toBody(empty, true), false);
});

test("주휴일은 주 15시간 이상이면 근무하지 않는 가장 뒤 요일, 미만이면 없음", () => {
  const f = initialForm();
  assert.equal(weeklyHolidayOf(f), "SUN"); // 월~금 하루 8시간 = 40시간
  assert.equal(weeklyHolidayOf({ ...f, days: ["MON", "TUE", "SUN"] }), "SAT");
  assert.equal(weeklyHolidayOf({ ...f, days: ["MON", "SAT", "SUN"] }), "FRI");
  assert.equal(weeklyHolidayOf({ ...f, days: ["MON"] }), null); // 8시간
  // 하루 7.5시간(09~17, 휴게 30분) × 2일 = 15시간 — 경계는 포함
  const half = { ...f, work: { start: { hour: "09", minute: "00" as const }, end: { hour: "17", minute: "00" as const } }, rest: { start: { hour: "12", minute: "00" as const }, end: { hour: "12", minute: "30" as const } } };
  assert.equal(weeklyHolidayOf({ ...half, days: ["MON", "TUE"] }), "SUN");
  assert.equal(weeklyHolidayOf({ ...f, days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] }), "NO_DAY_OFF");
  assert.equal(toBody(filled()).weeklyHoliday, "SUN");
});

test("API 본문: 번호는 숫자만, 급여는 정수, 요일은 월~일 순서로 같은 시간", () => {
  const body = toBody(filled({ days: ["FRI", "MON"], endDate: "", payDay: "31" }));
  assert.equal(body.name, "남도현");
  assert.equal(body.phone, "01090145563");
  assert.equal(body.storeId, 11);
  assert.equal(body.wageAmount, 12000);
  assert.equal(body.payDay, 31);
  assert.equal("endDate" in body, false);
  assert.deepEqual(body.workDays, [
    { weekday: "MON", startTime: "09:00", endTime: "18:00", breakStartTime: "12:00", breakEndTime: "13:00" },
    { weekday: "FRI", startTime: "09:00", endTime: "18:00", breakStartTime: "12:00", breakEndTime: "13:00" },
  ]);
  assert.equal(toBody(filled({ endDate: "2027-09-13" })).endDate, "2027-09-13");
  assert.equal("isTemporarySave" in body, false);
  assert.equal(toBody(filled(), true).isTemporarySave, true);
});

test("api #12 칸: 수당은 0 원도 보내고, 비운 칸은 보내지 않는다. 조항은 기본 문구로 시작한다", () => {
  const f = filled({ mealAllowance: "200,000", carAllowance: "0", baseHours: "209", baseNightHours: "12.5" });
  assert.equal(f.annualLeaveTerms, DEFAULT_ANNUAL_LEAVE_TERMS);
  const body = toBody(f);
  assert.equal(body.mealAllowanceAmount, 200000);
  assert.equal(body.carAllowanceAmount, 0);
  assert.equal("childcareAllowanceAmount" in body, false);
  assert.equal(body.baseHours, 209);
  assert.equal(body.baseNightHours, 12.5);
  assert.equal("monthlyOvertimeHours" in body, false);
  assert.equal(body.annualLeaveTerms, DEFAULT_ANNUAL_LEAVE_TERMS);
  assert.equal(body.severancePayTerms, DEFAULT_SEVERANCE_PAY_TERMS);
  assert.equal("severancePayTerms" in toBody(filled({ severancePayTerms: "  " })), false);
});

test("월 근로시간: 0 이상, 30분(0.5) 단위만 받는다", () => {
  assert.equal(formatHours("12.55"), "12.5");
  assert.equal(formatHours("1a2.3.4"), "12.3");
  assert.equal(hoursOf(""), null);
  assert.equal(hoursOf("209"), 209);
  assert.equal(hoursOf("12.5"), 12.5);
  assert.ok(Number.isNaN(hoursOf("12.3")));
  assert.ok(Number.isNaN(hoursOf("10000")));
  assert.ok(problems(filled({ baseHours: "12.3" })).includes("월 근로시간은 0 이상, 30분(0.5시간) 단위로 입력하세요."));
  assert.deepEqual(problems(filled({ baseHours: "209", baseNightHours: "0" })), []);
});

test("정직원 급여: 현업 견본(시급 10,000)과 같게 셈한다", () => {
  const f = filled({
    employmentType: "FULL_TIME", wage: "10,000", mealAllowance: "200,000", carAllowance: "200,000", childcareAllowance: "100,000",
    baseHours: "209", monthlyOvertimeHours: "52", baseNightHours: "20",
  });
  const pay = fullTimePay(f);
  assert.deepEqual(pay.items.map((i) => i.amount), [2090000, 780000, 100000]);
  assert.equal(pay.payTotal, 2970000);
  assert.equal(pay.taxFree, 500000);
  assert.equal(pay.monthly, 3470000);
  assert.equal(pay.annual, 41640000);
  assert.equal(monthlyWage(f), 3470000);
  assert.equal(monthlyWage({ ...f, wage: "" }), null);
  assert.equal(fullTimePay({ ...f, baseHours: "12.3" }).items[0].amount, 0);
});

test("파트타이머 급여: 현업 견본(월~금 5시간, 시급 10,000)과 같게 셈한다", () => {
  const f = filled({ employmentType: "PART_TIME", wage: "10,000", work: { start: { hour: "09", minute: "00" }, end: { hour: "15", minute: "00" } } });
  const pay = partTimePay(f);
  assert.deepEqual(pay.days.map((d) => d.amount), [50000, 50000, 50000, 50000, 50000, null, null]);
  assert.equal(pay.workHours, 25);
  assert.equal(pay.workPay, 250000);
  assert.equal(pay.holidayHours, 5);
  assert.equal(pay.holidayPay, 50000);
  assert.equal(pay.weekly, 300000);
  assert.equal(pay.monthly, 1303500);
  assert.equal(monthlyWage(f), 1303500);
});

test("파트타이머 소계는 요일 소계의 합이다(주 시간 × 시급을 따로 반올림하지 않는다)", () => {
  const f = filled({ employmentType: "PART_TIME", wage: "10,321", work: { start: { hour: "09", minute: "00" }, end: { hour: "14", minute: "30" } } }); // 하루 4.5시간
  const pay = partTimePay(f);
  assert.equal(pay.days[0].amount, 46445);
  assert.equal(pay.workPay, 46445 * 5);
});

test("정직원 칸 검사: 야간근무 ≤ 월 기본시간, 금액은 api integer 이하", () => {
  assert.ok(problems(filled({ baseHours: "100", baseNightHours: "120" })).includes("기본시간 중 야간근무는 월 기본시간보다 클 수 없습니다."));
  assert.deepEqual(problems(filled({ baseHours: "100", baseNightHours: "100" })), []);
  assert.ok(problems(filled({ mealAllowance: "2,147,483,648" })).includes("비과세 수당은 2,147,483,647원 이하로 입력하세요."));
  assert.deepEqual(problems(filled({ mealAllowance: "2,147,483,647" })), []);
  assert.ok(problems(filled({ wage: "9,999,999,999" })).includes("시급은 2,147,483,647원 이하로 입력하세요."));
  assert.equal(formatWage("123456789012"), "1,234,567,890");
});

test("파트타이머 주휴: 주 15시간 미만이면 없고, 8시간까지만 준다", () => {
  const short = filled({ employmentType: "PART_TIME", days: ["MON", "TUE"] }); // 하루 8시간 × 2 = 16
  assert.equal(partTimePay(short).holidayHours, 3.2);
  assert.equal(partTimePay({ ...short, days: ["MON"] }).holidayHours, 0);
  assert.equal(partTimePay(filled({ employmentType: "PART_TIME", days: ["MON", "TUE", "WED", "THU", "FRI", "SAT"] })).holidayHours, 8);
});

test("파트타이머는 비과세 수당 · 월 근로시간을 보내지도 따지지도 않는다", () => {
  const f = filled({ employmentType: "PART_TIME", mealAllowance: "200,000", baseHours: "12.3" });
  assert.deepEqual(problems(f), []);
  const body = toBody(f);
  assert.equal(body.mealAllowanceAmount, undefined);
  assert.equal(body.baseHours, undefined);
});

test("이어 쓰기: api #12 칸을 폼으로 되돌린다. 비운 조항은 기본 문구로 채우지 않는다", () => {
  const f = fromDetail(detailOf({ employmentType: "FULL_TIME", mealAllowanceAmount: 200000, baseHours: 209.5, annualLeaveTerms: "연 15일" }));
  assert.equal(f.mealAllowance, "200,000");
  assert.equal(f.carAllowance, "");
  assert.equal(f.baseHours, "209.5");
  assert.equal(f.annualLeaveTerms, "연 15일");
  assert.equal(f.severancePayTerms, "");
});

test("409 본문에서 대체할 진행 중 계약만 꺼낸다", () => {
  const list = [{ contractId: 5, status: "PENDING_SEND", name: "남도현", startDate: "2026-11-01", endDate: null }];
  assert.deepEqual(inProgressOf({ statusCode: 409, code: "CONTRACT_IN_PROGRESS", message: "…", contracts: list }), list);
  // 이름 · 기간이 없는 옛 api 본문도 받는다(빈 값은 null)
  assert.deepEqual(inProgressOf({ code: "CONTRACT_IN_PROGRESS", contracts: [{ contractId: 5, status: "DRAFT", name: "" }] }), [
    { contractId: 5, status: "DRAFT", name: null, startDate: null, endDate: null },
  ]);
  // 근무 시간 겹침 · 재직 중은 문장만 보인다
  assert.equal(inProgressOf({ statusCode: 409, code: "WORK_TIME_OVERLAP", overlaps: [] }), undefined);
  assert.equal(inProgressOf({ statusCode: 409, message: "재직 중" }), undefined);
  assert.equal(inProgressOf(null), undefined);
  assert.equal(inProgressOf({ code: "CONTRACT_IN_PROGRESS", contracts: [{ contractId: "5" }] }), undefined);
});

test("종이 계약과 기간이 겹치는 체결 완료(SIGNED_CONTRACT_OVERLAP)는 바로잡기가 대체할 목록으로 꺼내고, 진행 중 계약과 섞지 않는다(WHALEERP-156)", () => {
  const list = [{ contractId: 5, status: "SIGNED", name: "남도현", startDate: "2026-11-01", endDate: "2027-10-31" }];
  const body = { statusCode: 409, code: "SIGNED_CONTRACT_OVERLAP", message: "…", contracts: list };
  assert.deepEqual(signedOverlapOf(body), list);
  assert.equal(inProgressOf(body), undefined);
  assert.equal(signedOverlapOf({ code: "CONTRACT_IN_PROGRESS", contracts: list }), undefined);
});

test("재계약 시작일은 직전 계약 시작일 다음 날부터 — 같거나 이르면 막고, 그 뒤로는 직전 계약과 겹쳐도 된다(WHALEERP-156)", () => {
  const message = renewalStartProblem("2026-11-01");
  assert.equal(message, "재계약 시작일은 직전 계약 시작일(2026-11-01) 다음 날부터입니다.");
  assert.ok(problems(filled({ startDate: "2026-11-01" }), false, false, "2026-11-01").includes(message));
  assert.ok(problems(filled({ startDate: "2026-10-31" }), false, false, "2026-11-01").includes(message));
  assert.ok(!problems(filled({ startDate: "2026-11-02" }), false, false, "2026-11-01").includes(message));
  // 임시저장도 시작일을 넣었으면 본다(api 와 같다), 비었으면 묻지 않는다
  assert.ok(problems(filled({ startDate: "2026-11-01" }), true, false, "2026-11-01").includes(message));
  assert.ok(!problems(filled({ startDate: "" }), true, false, "2026-11-01").includes(message));
});

test("주휴일은 고른 요일을 쓰고, 근무 요일이면 근무하지 않는 가장 뒤 요일로 본다", () => {
  const f = initialForm();
  assert.equal(weeklyHolidayOf({ ...f, weeklyHoliday: "SAT" }), "SAT");
  assert.equal(weeklyHolidayOf({ ...f, weeklyHoliday: "MON" }), "SUN"); // 월요일은 근무
  assert.equal(weeklyHolidayOf({ ...f, days: ["MON"], weeklyHoliday: "SAT" }), null); // 주 8시간이면 없음
  assert.equal(toBody(filled({ weeklyHoliday: "SAT" })).weeklyHoliday, "SAT");
  assert.equal("weeklyHoliday" in toBody(filled({ days: ["MON"] })), false);
});

test("파트타이머는 요일마다 시간을 고치고, 고친 시간으로 주 시간 · 급여 · 본문을 만든다", () => {
  const span = (sh: string, eh: string) => ({ start: { hour: sh, minute: "00" as const }, end: { hour: eh, minute: "00" as const } });
  const f = filled({ employmentType: "PART_TIME", wage: "10,000", dayTimes: { MON: { work: span("09", "15"), rest: span("12", "13") } } });
  assert.equal(weeklyHours(f), 37); // 월 5시간 + 화~금 8시간
  assert.equal(partTimePay(f).days[0].amount, 50000);
  assert.equal(partTimePay(f).holidayHours, 7.4); // 주 시간 ÷ 5
  const body = toBody(f);
  assert.equal(body.workDays?.[0].endTime, "15:00");
  assert.equal(body.workDays?.[1].endTime, "18:00");
  // 정직원이면 요일별 시간을 쓰지 않는다
  assert.equal(weeklyHours({ ...f, employmentType: "FULL_TIME" }), 40);
  // 고친 요일의 시간도 검사한다
  assert.ok(problems({ ...f, dayTimes: { MON: { work: span("15", "09"), rest: span("12", "13") } } }).includes("월요일 근무시간은 끝이 시작보다 뒤여야 합니다."));
});

test("급여 지급 방식은 늘 보낸다", () => {
  assert.equal(toBody(filled()).payMethod, "ACCOUNT");
  assert.equal(toBody(filled({ payMethod: "CASH" }), true).payMethod, "CASH");
});

test("수습: 정직원만, 기간과 감액률을 함께 보내고 조건을 본다", () => {
  const on = { probation: true, probationMonths: "3" as const, probationRate: "10", wage: "11,200" };
  assert.equal(probationWage(filled(on)), 10080);
  const body = toBody(filled(on));
  assert.equal(body.probationMonths, 3);
  assert.equal(body.probationWageReductionRate, 10);
  assert.deepEqual(problems(filled(on)), []);
  // 파트타이머면 보내지 않는다
  assert.equal("probationMonths" in toBody(filled({ ...on, employmentType: "PART_TIME" })), false);
  // 계약 기간 1년 미만이면 막는다(딱 1년은 된다)
  assert.ok(problems(filled({ ...on, endDate: "2027-09-12" })).includes("수습은 계약 기간이 1년 이상이거나 기간의 정함이 없을 때만 둘 수 있습니다."));
  assert.deepEqual(problems(filled({ ...on, endDate: "2027-09-13" })), []);
  assert.ok(problems(filled({ ...on, probationRate: "11" })).includes("수습 임금 감액률은 0~10% 정수로 입력하세요."));
  // 계약 시작일 최저임금의 90%(9,288원) 아래면 막는다 — 딱 90%는 된다
  assert.deepEqual(problems(filled({ ...on, wage: "10,320" }), false, false, undefined, WAGES2026), []);
  assert.deepEqual(problems(filled({ ...on, wage: "10,319" }), false, false, undefined, WAGES2026), [
    "수습 중 시급은 최저임금의 90%(9,288원) 이상이어야 합니다.",
  ]);
  // 시작일에 적용되는 값이 없으면(첫 시행일 전 · 목록 없음) api 처럼 보지 않는다
  assert.deepEqual(problems(filled({ ...on, wage: "5,000", startDate: "2025-12-31" }), false, false, undefined, WAGES2026), []);
  assert.deepEqual(problems(filled({ ...on, wage: "5,000" })), []);
  // 수습을 끄면 보내지 않는다
  assert.equal("probationMonths" in toBody(filled({ ...on, probation: false })), false);
});

test("종이 계약: 등록은 근로계약서 날인본이 있어야 하고, 임시저장은 파일 없이 된다", () => {
  const paper = filled({ contractMethod: "PAPER" });
  assert.ok(problems(paper).includes("당사자가 모두 날인한 근로계약서 파일을 올려 주세요."));
  assert.deepEqual(problems(paper, false, true), []);
  assert.deepEqual(problems(paper, true), []);
  // 전자계약은 파일을 묻지 않는다
  assert.deepEqual(problems(filled()), []);
  assert.equal(toBody(paper).contractMethod, "PAPER");
  assert.equal(toBody(filled()).contractMethod, "ELECTRONIC");
  assert.equal(fromDetail(detailOf({ contractMethod: "PAPER" })).contractMethod, "PAPER");
  assert.equal(fromDetail(detailOf()).contractMethod, "ELECTRONIC");
});

test("종이 계약 날인본 파일: 형식은 enum 값으로, 10MB 까지", () => {
  const types = paperFileTypesOf(["PDF", "JPG", "PNG", "GIF"]);
  assert.deepEqual(types, ["PDF", "JPG", "PNG"]);
  assert.equal(paperFileAccept(["PDF"]), "application/pdf,.pdf");
  assert.equal(paperFileError({ name: "계약서.PDF", type: "", size: 10 }, types), null);
  assert.equal(paperFileError({ name: "a.hwp", type: "application/x-hwp", size: 10 }, types), "PDF · JPG · PNG 파일만 올릴 수 있습니다.");
  assert.equal(paperFileError({ name: "a.pdf", type: "application/pdf", size: 0 }, types), "빈 파일입니다. 다른 파일을 골라 주세요.");
  assert.equal(paperFileError({ name: "a.jpg", type: "image/jpeg", size: PAPER_FILE_MAX_BYTES + 1 }, types), "파일은 10MB까지 올릴 수 있습니다.");
});

test("확인창 한 줄 — 누구 계약인지 이름 · 기간을 앞에 둔다", () => {
  const c = { contractId: 5, status: "SIGNED", name: "남도연", startDate: "2026-09-01", endDate: "2026-10-01" };
  assert.equal(inProgressLine(c, "체결 완료"), "남도연 · 2026-09-01 ~ 2026-10-01 · 체결 완료 · 계약 5");
  assert.equal(inProgressLine({ ...c, endDate: null }, "체결 완료"), "남도연 · 2026-09-01 ~ · 체결 완료 · 계약 5");
  assert.equal(inProgressLine({ ...c, name: null, startDate: null, endDate: null }, "임시저장"), "임시저장 · 계약 5");
});

test("성별 · 외국인 여부 — 초안 저장은 성별을 골라야 하고, 본문에 실린다(WHALEERP-125 본인 대조)", () => {
  assert.ok(problems(filled({ gender: "" })).includes("성별을 고르세요."));
  assert.ok(!problems(filled({ gender: "" }), true).includes("성별을 고르세요.")); // 임시저장은 비워도 된다
  assert.deepEqual(problems(filled()), []);
  const body = toBody(filled({ gender: "FEMALE", isForeigner: true }));
  assert.equal(body.gender, "FEMALE");
  assert.equal(body.isForeigner, true);
  // 고르지 않았으면 보내지 않는다. 외국인 여부는 늘 보낸다(체크하지 않으면 내국인)
  const temp = toBody(filled({ gender: "" }), true);
  assert.equal("gender" in temp, false);
  assert.equal(temp.isForeigner, false);
});

test("성별 · 외국인 여부 — 이어 쓰기는 상세 값으로 다시 채운다", () => {
  const f = fromDetail(detailOf({ gender: "FEMALE", isForeigner: true }));
  assert.equal(f.gender, "FEMALE");
  assert.equal(f.isForeigner, true);
  assert.equal(fromDetail(detailOf()).gender, "");
});

test("재계약 — 직전 계약 값을 채우고 시작일은 종료일 다음 날, 종료일은 비운다. 체결 완료 · 체결 뒤 종료만 재계약한다(WHALEERP-156)", () => {
  const signed = detailOf({ status: "SIGNED", startDate: "2026-01-01", endDate: "2026-12-31" });
  const f = renewalFromDetail(signed);
  assert.equal(f.startDate, "2027-01-01");
  assert.equal(f.endDate, "");
  assert.equal(f.name, fromDetail(signed).name);
  assert.equal(renewalFromDetail(detailOf({ status: "SIGNED", endDate: null })).startDate, "");

  assert.equal(canRenew({ status: "SIGNED", histories: [], renewedBy: null }), true);
  // 이미 이어지는 재계약이 있으면 띄우지 않는다
  assert.equal(canRenew({ status: "SIGNED", histories: [], renewedBy: 9 }), false);
  const ended = (actor: "SYSTEM" | "ADMIN") => ({ fromStatus: "SIGNED" as const, toStatus: "ENDED" as const, actor, changedAt: "2027-01-01T00:00:00Z" });
  // 기간이 끝나 배치가 닫은 체결 완료는 재계약한다
  assert.equal(canRenew({ status: "ENDED", histories: [ended("SYSTEM")], renewedBy: null }), true);
  // 대체로 닫힌 체결 완료 · 체결 없이 종료(채용 접음)는 재계약하지 않는다
  assert.equal(canRenew({ status: "ENDED", histories: [ended("ADMIN")], renewedBy: null }), false);
  assert.equal(canRenew({ status: "ENDED", histories: [], renewedBy: null }), false);
  assert.equal(canRenew({ status: "PENDING_SIGNATURE", histories: [], renewedBy: null }), false);
});

test("바로잡기 뒤 다시 물을 때 바로잡기 문구는 체결 완료가 있을 때만(front #135 code-review)", () => {
  const c = (contractId: number, status: string) => ({ contractId, status, name: null, startDate: null, endDate: null });
  const body = { correctSignedContracts: true } as Parameters<typeof stillCorrecting>[0];
  assert.equal(stillCorrecting(body, [c(5, "SIGNED"), c(7, "DRAFT")]), true);
  assert.equal(stillCorrecting(body, [c(7, "DRAFT")]), false);
  assert.equal(stillCorrecting({} as typeof body, [c(5, "SIGNED")]), false);
  // 바로잡기 문구를 보이지 않으면 본문에서도 바로잡기를 뺀다 — 그사이 체결된 계약이 「대체」로 종료되지 않게(front #135 재리뷰)
  // 확인 본문 — 바로잡기 문구일 때만 바로잡기를 싣고, 대체 목록은 확인창에 보인 그대로(front #135 재리뷰 · 셀프 code-review)
  const corrected = { ...body, replaceContractIds: [1] };
  const list = [c(5, "SIGNED"), c(7, "DRAFT")];
  assert.deepEqual(replaceConfirmBody(corrected, list, true), { correctSignedContracts: true, replaceContractIds: [5, 7] });
  assert.deepEqual(replaceConfirmBody(corrected, [c(7, "DRAFT")], false), { replaceContractIds: [7] });
  // 다시 물을 때의 판정 그대로 — 진행 중 목록만이면 바로잡기가 빠진다
  assert.equal(replaceConfirmBody(corrected, [c(7, "DRAFT")], stillCorrecting(corrected, [c(7, "DRAFT")])).correctSignedContracts, undefined);
  assert.equal(corrected.correctSignedContracts, true); // 원래 본문은 그대로
});

// 저장 때 찾은 오류는 그 칸 아래에 보인다(WHALEERP-631, 2026-10-29 재영 공지 1번) — 문장마다 붙을 칸
test("유효성 오류는 칸과 함께 — 화면이 그 칸 아래에 보인다", () => {
  assert.deepEqual(fieldProblems(filled()), []);
  const by = problemsByField(fieldProblems(filled({ name: "", birthDate: "2010-01-01", endDate: "2026-09-13", payDay: "40", wage: "" })));
  assert.deepEqual(by.name, ["이름을 입력하세요."]);
  assert.deepEqual(by.birthDate, ["만 19세 미만 직원은 등록할 수 없습니다."]);
  assert.deepEqual(by.endDate, ["계약 종료일은 시작일보다 앞설 수 없습니다."]);
  assert.deepEqual(by.payDay, ["임금지급일은 1~31입니다."]);
  assert.deepEqual(by.wage, ["시급을 입력하세요."]);
  // 근무 · 휴게 시간은 따로, 파트타이머 요일별 시간은 표 아래
  const rest: Partial<ContractForm> = { rest: { start: { hour: "08", minute: "00" }, end: { hour: "09", minute: "00" } } };
  assert.deepEqual(problemsByField(fieldProblems(filled(rest))).rest, ["휴게시간은 근무시간 안이어야 합니다."]);
  assert.equal(problemsByField(fieldProblems(filled(rest))).work, undefined);
  // 종이 계약 날인본 · 재계약 시작일
  assert.deepEqual(problemsByField(fieldProblems(filled({ contractMethod: "PAPER" }))).employmentFile, ["당사자가 모두 날인한 근로계약서 파일을 올려 주세요."]);
  assert.ok(problemsByField(fieldProblems(filled({ startDate: "2026-11-01" }), false, false, "2026-11-01")).startDate?.length);
});

test("한 칸에 오류가 여럿이면 모두 — 파트타이머 요일 시간은 표 아래, 수습은 세 칸에 나눠", () => {
  // 파트타이머가 표에서 고친 요일의 근무 · 휴게 오류는 둘 다 소정근로시간 표(schedule) 아래
  const bad = { work: { start: { hour: "15", minute: "00" }, end: { hour: "09", minute: "00" } }, rest: { start: { hour: "12", minute: "00" }, end: { hour: "13", minute: "00" } } } as const;
  const part = filled({ employmentType: "PART_TIME", days: ["MON"], dayTimes: { MON: bad } });
  assert.deepEqual(problemsByField(fieldProblems(part)).schedule, ["월요일 근무시간은 끝이 시작보다 뒤여야 합니다.", "월요일 휴게시간은 근무시간 안이어야 합니다."]);
  // 정직원 수습 — 기간 · 감액률 · 수습 중 시급이 각자 칸
  const by = problemsByField(fieldProblems(filled({ employmentType: "FULL_TIME", probation: true, probationRate: "11", endDate: "2027-03-13" })));
  assert.deepEqual(by.probationMonths, ["수습은 계약 기간이 1년 이상이거나 기간의 정함이 없을 때만 둘 수 있습니다."]);
  assert.deepEqual(by.probationRate, ["수습 임금 감액률은 0~10% 정수로 입력하세요."]);
  // 시급 10,000원 × (1 − 10%) = 9,000원 — 최저임금의 90% 아래
  const low = problemsByField(fieldProblems(filled({ employmentType: "FULL_TIME", wage: "10,000", probation: true, probationRate: "10" }), false, false, undefined, WAGES2026));
  assert.equal(low.probationWage?.length, 1);
  assert.equal(low.probationRate, undefined);
});

test("저장을 누른 때 오류가 난 칸만 보인다 — 고쳐지면 빠지고, 저장 뒤 새로 생긴 칸 오류는 다음 저장 때", () => {
  const shown = new Set<ProblemField>(["name", "phone"]);
  assert.deepEqual(shownProblems({ name: ["이름을 입력하세요."], jobTitle: ["직무를 입력하세요."] }, shown), { name: ["이름을 입력하세요."] });
  assert.deepEqual(shownProblems({}, shown), {});
});

test("최저임금은 계약 시작일 기준 — 시행일이 그날 이전인 것 중 가장 늦은 값(WHALEERP-595)", () => {
  const wages = [
    { effectiveDate: "2027-01-01", hourlyWage: 11000 },
    { effectiveDate: "2026-01-01", hourlyWage: 10320 },
  ];
  assert.equal(minimumWageOn(wages, "2025-12-31"), null);
  assert.equal(minimumWageOn(wages, "2026-12-31")?.hourlyWage, 10320);
  assert.equal(minimumWageOn(wages, "2027-01-01")?.hourlyWage, 11000);
  // 하한은 원 미만 올림, 수습 중 시급은 원 미만 반올림 — api 와 같은 정수 셈
  assert.equal(probationWageFloor(10320), 9288);
  assert.equal(probationWageFloor(10031), 9028);
  assert.equal(probationWage({ wage: "12,345", probationRate: "10" }), 11111);
  // 시급 10,320원 · 감액 10% = 9,288원 — 2026년이면 되고, 2027-01-01 시작이면 9,900원 아래라 막는다
  const on = { employmentType: "FULL_TIME" as const, probation: true, probationMonths: "3" as const, probationRate: "10", wage: "10,320" };
  assert.deepEqual(problems(filled({ ...on, startDate: "2026-12-31" }), false, false, undefined, wages), []);
  assert.deepEqual(problems(filled({ ...on, startDate: "2027-01-01" }), false, false, undefined, wages), [
    "수습 중 시급은 최저임금의 90%(9,900원) 이상이어야 합니다.",
  ]);
});
