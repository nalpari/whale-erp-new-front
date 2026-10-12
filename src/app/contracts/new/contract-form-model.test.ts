// node --test src/app/contracts/new/contract-form-model.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ageOn, formatPhone, formatWage, fromDetail, initialForm, isMinor, problems, toBody, weeklyHolidayOf, weeklyHours, type ContractDetail, type ContractForm } from "./contract-form-model.ts";

const filled = (over: Partial<ContractForm> = {}): ContractForm => ({
  ...initialForm("11"),
  name: " 남도현 ",
  phone: "010-9014-5563",
  birthDate: "1998-07-12",
  jobTitle: "바리스타",
  startDate: "2026-09-14",
  wage: "2,400,000",
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
  assert.ok(p.includes("월급을 입력하세요"));
  assert.ok(problems(filled({ employmentType: "PART_TIME", wage: "" })).includes("시급을 입력하세요"));
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
  const detail: ContractDetail = {
    contractId: 7, staffMemberId: 3, status: "DRAFT", name: "남도현", phone: "01090145563", jobTitle: "바리스타",
    employmentType: "PART_TIME", storeId: 11, birthDate: "1998-07-12", startDate: "2026-09-14", endDate: null,
    workLocation: "서울", weeklyHoliday: "SUN", wageAmount: 11200, payMonth: "NEXT_MONTH", payDay: 10,
    isHealthPensionInsured: null, isEmploymentInjuryInsured: true,
    workDays: [
      { weekday: "TUE", startTime: "10:00", endTime: "16:30", breakStartTime: "12:00", breakEndTime: "13:00" },
      { weekday: "THU", startTime: "10:00", endTime: "16:30", breakStartTime: "12:00", breakEndTime: "13:00" },
    ],
  };
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
  assert.equal(body.wageAmount, 2400000);
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
