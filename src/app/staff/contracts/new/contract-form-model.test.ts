// node --test src/app/staff/contracts/new/contract-form-model.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ageOn,
  DEFAULT_ANNUAL_LEAVE_TERMS,
  DEFAULT_SEVERANCE_PAY_TERMS,
  formatHours,
  formatPhone,
  formatWage,
  fromDetail,
  hoursOf,
  initialForm,
  inProgressOf,
  isMinor,
  monthlyWage,
  fullTimePay,
  partTimePay,
  problems,
  toBody,
  weeklyHolidayOf,
  weeklyHours,
  type ContractDetail,
  type ContractForm,
} from "./contract-form-model.ts";

const filled = (over: Partial<ContractForm> = {}): ContractForm => ({
  ...initialForm("11"),
  name: " 남도현 ",
  phone: "010-9014-5563",
  birthDate: "1998-07-12",
  jobTitle: "바리스타",
  startDate: "2026-09-14",
  wage: "12,000",
  ...over,
});

/** 상세 응답 견본 — 비어 있는 임시저장. 테스트마다 필요한 칸만 덮는다 */
const detailOf = (over: Partial<ContractDetail> = {}): ContractDetail => ({
  contractId: 7, staffMemberId: 3, status: "DRAFT", name: "남도현", phone: "01090145563", jobTitle: "바리스타",
  employmentType: "PART_TIME", storeId: 11, storeName: "모리커피 성수점", birthDate: null, contractMethod: null,
  startDate: null, endDate: null, workLocation: null, weeklyHoliday: null, wageAmount: null,
  mealAllowanceAmount: null, carAllowanceAmount: null, childcareAllowanceAmount: null, baseHours: null,
  monthlyOvertimeHours: null, baseNightHours: null, baseHolidayHours: null, monthlyExtraHolidayHours: null,
  annualLeaveTerms: null, severancePayTerms: null, payMonth: null, payDay: null,
  isHealthPensionInsured: null, isEmploymentInjuryInsured: null, draftAction: null, histories: [], workDays: [],
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
  assert.ok(p.includes("이름을 입력하세요"));
  assert.ok(p.includes("소속 근무지를 고르세요"));
  // 정직원도 시급이다
  assert.ok(p.includes("시급을 입력하세요"));
  assert.ok(problems(filled({ employmentType: "FULL_TIME", wage: "" })).includes("시급을 입력하세요"));
  // 7일 근무는 협의 중이라 막지 않는다
  assert.deepEqual(problems(filled({ days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] })), []);
  assert.ok(problems(filled({ endDate: "2026-09-13" })).includes("계약 종료일은 시작일보다 앞설 수 없습니다"));
  assert.ok(problems(filled({ payDay: "32" })).includes("임금지급일은 1~31입니다"));
  assert.ok(problems(filled({ rest: { start: { hour: "08", minute: "00" }, end: { hour: "09", minute: "00" } } })).includes("휴게시간은 근무시간 안이어야 합니다"));
  assert.ok(problems(filled({ birthDate: "2010-01-01" })).includes("만 19세 미만 직원은 등록할 수 없습니다"));
});

test("임시저장은 직원 칸과 근무지만 필수, 넣은 값은 그대로 본다", () => {
  const blank: ContractForm = { ...initialForm("11"), name: "남도현", phone: "01090145563", jobTitle: "바리스타", days: [], payDay: "" };
  assert.deepEqual(problems(blank, true), []);
  assert.ok(problems(blank).includes("계약 시작일을 입력하세요"));
  assert.ok(problems({ ...blank, name: "" }, true).includes("이름을 입력하세요"));
  assert.ok(problems({ ...blank, payDay: "40" }, true).includes("임금지급일은 1~31입니다"));
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
  assert.equal("weeklyHoliday" in toBody(filled()), false);
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
  assert.ok(problems(filled({ baseHours: "12.3" })).includes("월 근로시간은 0 이상, 30분(0.5시간) 단위로 입력하세요"));
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
  assert.ok(problems(filled({ baseHours: "100", baseNightHours: "120" })).includes("기본시간 중 야간근무는 월 기본시간보다 클 수 없습니다"));
  assert.deepEqual(problems(filled({ baseHours: "100", baseNightHours: "100" })), []);
  assert.ok(problems(filled({ mealAllowance: "2,147,483,648" })).includes("비과세 수당은 2,147,483,647원 이하로 입력하세요"));
  assert.deepEqual(problems(filled({ mealAllowance: "2,147,483,647" })), []);
  assert.ok(problems(filled({ wage: "9,999,999,999" })).includes("시급은 2,147,483,647원 이하로 입력하세요"));
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
  const list = [{ contractId: 5, status: "PENDING_SEND" }];
  assert.deepEqual(inProgressOf({ statusCode: 409, code: "CONTRACT_IN_PROGRESS", message: "…", contracts: list }), list);
  // 근무 시간 겹침 · 재직 중은 문장만 보인다
  assert.equal(inProgressOf({ statusCode: 409, code: "WORK_TIME_OVERLAP", overlaps: [] }), undefined);
  assert.equal(inProgressOf({ statusCode: 409, message: "재직 중" }), undefined);
  assert.equal(inProgressOf(null), undefined);
  assert.equal(inProgressOf({ code: "CONTRACT_IN_PROGRESS", contracts: [{ contractId: "5" }] }), undefined);
});
