// pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/summary-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다
import assert from "node:assert/strict";
import { test } from "node:test";
import { endLabel } from "../../work-schedules/work-schedule-view.ts";
import {
  AREA_READ_DENIED_MESSAGE,
  ACCESS_DENIED_MESSAGE,
  areaFailureOf,
  attendanceLines,
  attendanceManageHref,
  isAreaForbidden,
  isPayslipSummaryEmpty,
  payAmountText,
  payMonthText,
  scheduleWeekOf,
  shiftYearMonth,
  hoursText,
  todoAssignText,
  todoFootText,
  todoHistoryText,
  todoStatusMark,
  weekHref,
  weekLabel,
  weekMonthOf,
  weekParam,
  weekRowLabel,
  weekRowsOf,
  workDateText,
  yearMonthLabel,
  type PayslipSummaryItem,
} from "./summary-view.ts";

test("영역 메뉴 조회 권한이 없을 때의 403 문구는 api READ_DENIED_MESSAGE 와 글자까지 같다", () => {
  assert.equal(AREA_READ_DENIED_MESSAGE, "조회 권한이 없습니다.");
});

test("403 이면서 영역 권한 문구면 그 영역만 권한 안내다(다시 하기 없음)", () => {
  assert.equal(areaFailureOf(403, "조회 권한이 없습니다."), "forbidden");
});

test("다른 403 은 문구로 갈라 오류다 — 공통 403 · 직원 앱 토큰 등", () => {
  assert.equal(areaFailureOf(403, "접근 권한이 없습니다. 관리자에게 문의해 주세요."), "error");
  assert.equal(areaFailureOf(403, "요청이 실패했습니다 (HTTP 403)"), "error");
  assert.equal(areaFailureOf(403, null), "error");
});

test("403 이 아니면 문구가 같아도 오류다", () => {
  for (const status of [400, 401, 404, 500, 503]) assert.equal(areaFailureOf(status, AREA_READ_DENIED_MESSAGE), "error", String(status));
  // api 에 닿지 못했거나 ApiError 가 아닌 오류
  assert.equal(areaFailureOf(null, null), "error");
});

test("주소의 week 는 실제 날짜일 때만 받고 그 주 월요일로 맞춘다", () => {
  assert.equal(weekParam("2026-10-19"), "2026-10-19"); // 월
  assert.equal(weekParam("2026-10-21"), "2026-10-19"); // 수
  assert.equal(weekParam("2026-10-25"), "2026-10-19"); // 일은 그 앞 월요일의 주
  assert.equal(weekParam("2026-11-01"), "2026-10-26"); // 일, 달을 넘는다
  assert.equal(weekParam("2027-01-01"), "2026-12-28"); // 금, 해를 넘는다
  for (const raw of ["2026-02-30", "2026-1-5", "abc", "", undefined]) assert.equal(weekParam(raw), null, String(raw));
  // 같은 키가 여럿이면 앞의 것
  assert.equal(weekParam(["2026-10-21", "2026-10-28"]), "2026-10-19");
  // 연도는 1900~2999 — 9999 년의 다음 주는 다섯 자리 연도라 링크가 깨진다
  assert.equal(weekParam("1900-01-01"), "1900-01-01");
  assert.equal(weekParam("2999-12-31"), "2999-12-30");
  assert.equal(weekParam("0001-01-01"), null);
  assert.equal(weekParam("9999-12-27"), null);
});

test("주소에 week 가 없거나 이상하면 이번 주", () => {
  assert.equal(scheduleWeekOf({}, "2026-10-22"), "2026-10-19");
  assert.equal(scheduleWeekOf({ week: "x" }, "2026-10-22"), "2026-10-19");
  assert.equal(scheduleWeekOf({ week: "2026-09-02" }, "2026-10-22"), "2026-08-31");
  // 지난 주소 값(WHALEERP-184 weekStart · 185 기간)은 읽지 않는다
  assert.equal(scheduleWeekOf({ weekStart: "2026-09-02", schedulePeriod: "ALL" }, "2026-10-22"), "2026-10-19");
});

test("주 넘김 주소는 다른 조회 조건을 두고 week 만 바꾼다 — 이번 주면 뺀다", () => {
  assert.equal(weekHref({}, "2026-10-26", "2026-10-22"), "?week=2026-10-26");
  assert.equal(weekHref({ week: "2026-10-26" }, "2026-10-19", "2026-10-22"), "?");
  assert.equal(
    weekHref({ name: "서지안", storeIds: ["1", "2"], page: "3", week: "2026-10-19" }, "2026-10-12", "2026-10-22"),
    "?name=%EC%84%9C%EC%A7%80%EC%95%88&storeIds=1&storeIds=2&page=3&week=2026-10-12",
  );
  // 지난 주소 값은 함께 뺀다
  assert.equal(weekHref({ weekStart: "2026-10-12", schedulePeriod: "ALL", schedulePage: "2", schedulePageSize: "50" }, "2026-10-12", "2026-10-22"), "?week=2026-10-12");
});

test("주 넘김 가운데 글자는 「YYYY년 MM-DD ~ MM-DD」, 연도는 월요일의 해", () => {
  assert.equal(weekLabel("2026-10-19"), "2026년 10-19 ~ 10-25");
  assert.equal(weekLabel("2026-10-26"), "2026년 10-26 ~ 11-01");
  assert.equal(weekLabel("2026-12-28"), "2026년 12-28 ~ 01-03");
});

test("몇째 주는 목요일이 든 달로 센다", () => {
  assert.equal(weekMonthOf("2026-08-31"), "2026-09"); // 목 09-03 → 9월 1주(데모)
  assert.equal(weekMonthOf("2026-09-28"), "2026-10"); // 목 10-01
  assert.equal(weekMonthOf("2026-10-26"), "2026-10"); // 목 10-29
  assert.equal(weekMonthOf("2026-12-28"), "2026-12"); // 목 12-31 — 해를 넘는 주는 앞 해
  assert.equal(weekMonthOf("2027-12-27"), "2027-12"); // 목 12-30
  assert.equal(weekMonthOf("2025-12-29"), "2026-01"); // 목 2026-01-01 — 뒤 해
});

test("주 선택 달력 한 판 — 그 달에 목요일이 드는 주들, 다른 달 날은 inMonth=false", () => {
  const sept = weekRowsOf("2026-09");
  assert.deepEqual(
    sept.map((r) => r.monday),
    ["2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21"],
  );
  assert.deepEqual(sept[0].days.map((d) => d.day), [31, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(sept[0].days.map((d) => d.inMonth), [false, true, true, true, true, true, true]);
  // 10월: 1일이 목요일이라 09-28 주가 1주, 다섯 줄
  const oct = weekRowsOf("2026-10");
  assert.deepEqual(oct.map((r) => r.monday), ["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"]);
  assert.deepEqual(oct[4].days.map((d) => d.inMonth), [true, true, true, true, true, true, false]);
  // 연말 · 연초 — 2026-12-28 주는 12월 마지막 주, 2027-01 의 1주는 01-04 주
  assert.equal(weekRowsOf("2026-12").at(-1)?.monday, "2026-12-28");
  assert.equal(weekRowsOf("2027-01")[0].monday, "2027-01-04");
  // 2026-01 은 1일이 목요일 — 2025-12-29 주가 1주
  assert.equal(weekRowsOf("2026-01")[0].monday, "2025-12-29");
  assert.equal(weekRowsOf("2025-12").at(-1)?.monday, "2025-12-22");
  // 어떤 달이든 그 달 주들은 한 주도 빠지거나 겹치지 않는다
  for (let m = "2026-01", prev = ""; m <= "2027-12"; m = shiftYearMonth(m, 1)) {
    const rows = weekRowsOf(m);
    if (prev) assert.equal(rows[0].monday, prev, m);
    prev = new Date(new Date(`${rows.at(-1)!.monday}T00:00:00Z`).getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
    for (const r of rows) assert.equal(weekMonthOf(r.monday), m);
  }
});

test("주 줄의 화면 읽기 이름", () => {
  assert.equal(weekRowLabel("2026-10", 4, "2026-10-19"), "2026년 10월 4주 (10-19 ~ 10-25)");
  assert.equal(weekRowLabel("2026-12", 5, "2026-12-28"), "2026년 12월 5주 (12-28 ~ 01-03)");
});

test("달 옮기기 · 달력 머리 글자", () => {
  assert.equal(shiftYearMonth("2026-12", 1), "2027-01");
  assert.equal(shiftYearMonth("2026-01", -1), "2025-12");
  assert.equal(yearMonthLabel("2026-09"), "2026년 9월");
  assert.equal(yearMonthLabel("2026-10"), "2026년 10월");
});

test("근무시간 합계는 시간으로 소수 한 자리", () => {
  assert.equal(hoursText(0), "0.0h");
  assert.equal(hoursText(450), "7.5h");
  assert.equal(hoursText(2250), "37.5h");
  assert.equal(hoursText(100), "1.7h");
});

test("종료 칸은 근무스케줄 화면과 같은 글자(endLabel) — 같은 날 · 익일 · 24:00", () => {
  assert.deepEqual([endLabel("09:00", "18:00"), endLabel("22:00", "02:00"), endLabel("16:00", "00:00")], ["18:00", "익일 02:00", "24:00"]);
});

test("근무일 칸은 MM-DD 요일(연도는 칸 머리가 보인다)", () => {
  assert.equal(workDateText("2026-10-21"), "10-21 수");
  assert.equal(workDateText("2026-10-25"), "10-25 일");
  assert.equal(workDateText("2027-01-01"), "01-01 금");
});

const payslip = (payslipId: number, status: PayslipSummaryItem["status"]): PayslipSummaryItem => ({
  payslipId,
  status,
  periodStartDate: "2026-08-01",
  periodEndDate: "2026-08-31",
  basePayAmount: 2_840_000,
  allowanceAmount: 186_000,
  totalDeductionAmount: 0,
  netPayAmount: 3_026_000,
});

test("급여명세서 영역의 지급월은 급여 기간 시작일의 YYYY-MM", () => {
  assert.equal(payMonthText({ periodStartDate: "2026-08-01" }), "2026-08");
  // 21일 ~ 다음 달 20일 같은 기간도 시작일의 달이다
  assert.equal(payMonthText({ periodStartDate: "2025-12-21" }), "2025-12");
});

test("급여명세서 영역의 금액은 쉼표 글자, 없거나 0 이면 「-」(데모의 검토 중 줄 공제)", () => {
  assert.equal(payAmountText(2_840_000), "2,840,000");
  assert.equal(payAmountText(0), "-");
  assert.equal(payAmountText(null), "-");
  assert.equal(payAmountText(-12000), "-12,000");
});

test("급여명세서 영역은 최근 명세서도 미발송도 없을 때만 빈 상태다", () => {
  assert.equal(isPayslipSummaryEmpty({ recent: [], unsentCount: 0 }), true);
  assert.equal(isPayslipSummaryEmpty({ recent: [], unsentCount: 1 }), false);
  assert.equal(isPayslipSummaryEmpty({ recent: [payslip(1, "SENT")], unsentCount: 0 }), false);
  assert.equal(isPayslipSummaryEmpty({ recent: [payslip(2, "REVIEWING"), payslip(1, "SENT")], unsentCount: 1 }), false);
});

test("TO-DO 요약 줄은 배정이 있을 때만", () => {
  assert.deepEqual(todoFootText({ total: 6, doneCount: 4, notDoneCount: 2 }), { label: "전체 6", value: "완료 4 · 미완료 2" });
  assert.equal(todoFootText({ total: 0, doneCount: 0, notDoneCount: 0 }), null);
});

test("TO-DO 이력 문구 — 등록 · 긴급 표시 변경 · 상태 변경", () => {
  const label = (s: string) => ({ PENDING: "대기", IN_PROGRESS: "진행 중", DONE: "완료" })[s] ?? s;
  assert.equal(todoHistoryText({ fromStatus: null, toStatus: "PENDING", isUrgentChanged: false }, label), "등록");
  // 긴급 표시는 상태가 그대로라 이전 · 이후가 같다
  assert.equal(todoHistoryText({ fromStatus: "PENDING", toStatus: "PENDING", isUrgentChanged: true }, label), "긴급 표시 변경");
  assert.equal(todoHistoryText({ fromStatus: "IN_PROGRESS", toStatus: "DONE", isUrgentChanged: false }, label), "진행 중 → 완료");
});

test("TO-DO 상태 한글을 받지 못했으면 상태 변경은 이름 없이 — 영문 값을 보이지 않는다", () => {
  assert.equal(todoHistoryText({ fromStatus: "PENDING", toStatus: "DONE", isUrgentChanged: false }, null), "상태 변경");
  assert.equal(todoHistoryText({ fromStatus: null, toStatus: "PENDING", isUrgentChanged: false }, null), "등록");
});

test("TO-DO 칸은 목록 · 요약 중 한 경로라도 영역 권한 403 이면 영역 전체를 막는다", () => {
  assert.equal(isAreaForbidden({ kind: "forbidden" }, { kind: "ok" }), true);
  assert.equal(isAreaForbidden({ kind: "ok" }, { kind: "forbidden" }), true);
  assert.equal(isAreaForbidden({ kind: "forbidden" }, { kind: "forbidden" }), true);
  // 권한이 아닌 실패는 막지 않는다 — 그 자리에 다시 하기
  assert.equal(isAreaForbidden({ kind: "error" }, { kind: "ok" }), false);
  assert.equal(isAreaForbidden({ kind: "ok" }, { kind: "ok" }), false);
});

const assignee = (v: string) => ({ INDIVIDUAL: "개인", ALL: "근무지 전체" })[v] ?? v;
const mode = (v: string) => ({ EACH: "각자 수행", ANY_ONE: "한 명 수행" })[v] ?? v;
const todoStatus = (v: string) => ({ PENDING: "대기", IN_PROGRESS: "진행 중", DONE: "완료" })[v] ?? v;

test("TO-DO 배정 글자 — 개인은 배정 · 예정, 근무지 전체는 배정 · 수행 방식 · 예정", () => {
  const today = "2026-10-22";
  assert.equal(todoAssignText({ assigneeType: "INDIVIDUAL", executionMode: "EACH", dueDate: "2026-08-28", dueTime: "14:00" }, assignee, mode, today), "개인 · 08-28 14:00");
  assert.equal(todoAssignText({ assigneeType: "ALL", executionMode: "ANY_ONE", dueDate: "2026-08-25", dueTime: null }, assignee, mode, today), "근무지 전체 · 한 명 수행 · 08-25");
  assert.equal(todoAssignText({ assigneeType: "ALL", executionMode: "EACH", dueDate: "2026-09-03", dueTime: null }, assignee, mode, today), "근무지 전체 · 각자 수행 · 09-03");
  // 다른 해면 연도를 남긴다
  assert.equal(todoAssignText({ assigneeType: "INDIVIDUAL", executionMode: "EACH", dueDate: "2027-01-05", dueTime: null }, assignee, mode, today), "개인 · 2027-01-05");
  // 한글을 받지 못한 조각은 빠진다 — 영문 값을 보이지 않는다
  assert.equal(todoAssignText({ assigneeType: "ALL", executionMode: "EACH", dueDate: "2026-09-03", dueTime: null }, null, null, today), "09-03");
  assert.equal(todoAssignText({ assigneeType: "ALL", executionMode: "EACH", dueDate: "2026-09-03", dueTime: null }, assignee, null, today), "근무지 전체 · 09-03");
});

test("TO-DO 상태 글자 — 완료는 파랑 「MM-DD 완료」(한국 날짜), 대기는 회색, 진행 중은 파랑", () => {
  const today = "2026-10-22";
  // 2026-08-27T15:30Z = 한국 08-28 00:30
  assert.deepEqual(todoStatusMark({ status: "DONE", completedAt: "2026-08-27T15:30:00.000Z" }, todoStatus, today), { text: "08-28 완료", style: "mark-on" });
  assert.deepEqual(todoStatusMark({ status: "DONE", completedAt: "2025-12-31T16:00:00.000Z" }, todoStatus, today), { text: "01-01 완료", style: "mark-on" });
  assert.deepEqual(todoStatusMark({ status: "DONE", completedAt: "2025-12-30T00:00:00.000Z" }, todoStatus, today), { text: "2025-12-30 완료", style: "mark-on" });
  assert.deepEqual(todoStatusMark({ status: "PENDING", completedAt: null }, todoStatus, today), { text: "대기", style: "muted" });
  assert.deepEqual(todoStatusMark({ status: "IN_PROGRESS", completedAt: null }, todoStatus, today), { text: "진행 중", style: "mark-on" });
  // 완료 시각이 없거나 깨졌으면 날짜 없이
  assert.deepEqual(todoStatusMark({ status: "DONE", completedAt: null }, todoStatus, today), { text: "완료", style: "mark-on" });
  assert.deepEqual(todoStatusMark({ status: "DONE", completedAt: "x" }, todoStatus, today), { text: "완료", style: "mark-on" });
  // 상태 한글을 받지 못했으면 null(칸은 「-」)
  assert.equal(todoStatusMark({ status: "PENDING", completedAt: null }, null, today), null);
});

// 출퇴근 현황 칸(WHALEERP-186, 2026-10-29 재영)
const statusLabel = (v: string) => ({ NORMAL: "정상", LATE: "지각", MISSING_CHECK_OUT: "퇴근 미등록", ABSENT: "미출근" })[v as "NORMAL"] ?? v;
const reasonLabel = (v: string) => ({ OUT_OF_RADIUS_CHECKIN: "반경 밖 출근", MOCK_LOCATION: "위치 조작 감지", LONG_SHIFT: "근무 12시간 초과" })[v as "LONG_SHIFT"] ?? v;
type Punch = { time: string; next?: boolean; reviewReason?: string | null; isCorrected?: boolean; entryMethod?: string };
// recordedAt 은 time(한국 HH:mm)을 날(기본 2026-10-26, 다음날이면 +1)에 붙인 한국 시각이다
const punch = (p: Punch | null, date = "2026-10-26") => {
  if (!p) return null;
  const next = p.time < "06:30" && date === "2026-10-26" && p.next ? "2026-10-27" : date;
  return { reviewReason: null, isCorrected: false, entryMethod: "SELF", ...p, recordedAt: `${next}T${p.time}:00+09:00` };
};
const day = (date: string, status: string | null, pairs: [Punch | null, Punch | null][]) =>
  ({ date, status, pairs: pairs.map(([i, o]) => ({ checkIn: punch(i), checkOut: punch(o) })) }) as unknown as Parameters<typeof attendanceLines>[0][number];
const lines = (items: Parameters<typeof attendanceLines>[0]) => attendanceLines(items, statusLabel, reasonLabel);

test("출퇴근 현황 — 짝 하나는 그대로, 비고가 없으면 「-」", () => {
  assert.deepEqual(lines([day("2026-10-26", "NORMAL", [[{ time: "09:00" }, { time: "18:00" }]])]), [
    { date: "2026-10-26", checkIn: "09:00", checkOut: "18:00", status: "정상", remark: "-" },
  ]);
});

test("출퇴근 현황 — 짝이 없는 날(근무스케줄만)은 출근 · 퇴근 「-」, 상태가 없으면(예정) 「-」", () => {
  assert.deepEqual(lines([day("2026-10-27", "ABSENT", []), day("2026-10-28", null, [])]), [
    { date: "2026-10-27", checkIn: "-", checkOut: "-", status: "미출근", remark: "-" },
    { date: "2026-10-28", checkIn: "-", checkOut: "-", status: "-", remark: "-" },
  ]);
});

test("출퇴근 현황 — 퇴근 없는 짝은 퇴근 「-」", () => {
  const [l] = lines([day("2026-10-26", "MISSING_CHECK_OUT", [[{ time: "09:00" }, null]])]);
  assert.equal(l.checkOut, "-");
  assert.equal(l.status, "퇴근 미등록");
});

test("출퇴근 현황 — 짝이 여럿이면 첫 출근 · 마지막 퇴근, 비고 끝에 「외 N회」(짝 수 - 1)", () => {
  const [l] = lines([
    day("2026-10-26", "NORMAL", [
      [{ time: "09:00" }, { time: "12:00" }],
      [{ time: "13:00" }, { time: "15:00" }],
      [{ time: "16:00" }, { time: "19:30" }],
    ]),
  ]);
  assert.equal(l.checkIn, "09:00");
  assert.equal(l.checkOut, "19:30");
  assert.equal(l.remark, "외 2회");
});

test("출퇴근 현황 — 첫 짝에 출근이 없으면 출근이 있는 첫 짝의 출근, 마지막 짝에 퇴근이 없으면 퇴근이 있는 마지막 짝의 퇴근", () => {
  const [l] = lines([day("2026-10-26", "NORMAL", [[null, { time: "02:00" }], [{ time: "09:00" }, { time: "18:00" }], [{ time: "20:00" }, null]])]);
  assert.equal(l.checkIn, "09:00");
  assert.equal(l.checkOut, "18:00");
});

test("출퇴근 현황 — 비고는 사유 · 보정됨 · 대신 등록 · 외 N회 순서로 「 · 」로 잇고 같은 사유는 한 번", () => {
  const [l] = lines([
    day("2026-10-26", "LATE", [
      [{ time: "09:30", reviewReason: "OUT_OF_RADIUS_CHECKIN", isCorrected: true }, { time: "18:00", reviewReason: "OUT_OF_RADIUS_CHECKIN", entryMethod: "PROXY" }],
      [{ time: "19:00", reviewReason: "LONG_SHIFT" }, { time: "23:00" }],
    ]),
  ]);
  assert.equal(l.remark, "반경 밖 출근 · 근무 12시간 초과 · 보정됨 · 대신 등록 · 외 1회");
});

test("출퇴근 현황 — 확인 필요 사유가 아닌 위치 오차 초과는 비고에 쓰지 않는다", () => {
  const [l] = lines([day("2026-10-26", "NORMAL", [[{ time: "09:00", reviewReason: "ACCURACY_EXCEEDED" }, { time: "18:00" }]])]);
  assert.equal(l.remark, "-");
});

test("출퇴근 현황 — enum 한글을 받지 못하면 상태는 「-」, 사유는 빠진다(영문 값을 보이지 않는다)", () => {
  const [l] = attendanceLines([day("2026-10-26", "LATE", [[{ time: "09:00", reviewReason: "MOCK_LOCATION", isCorrected: true }, { time: "18:00" }]])], null, null);
  assert.equal(l.status, "-");
  assert.equal(l.remark, "보정됨");
});

test("출퇴근 현황 — 날짜 오름차순, 같은 날은 api 순서 그대로", () => {
  const out = lines([day("2026-10-28", "NORMAL", []), day("2026-10-26", "NORMAL", [[{ time: "08:00" }, null]]), day("2026-10-26", "NORMAL", [[{ time: "20:00" }, null]])]);
  assert.deepEqual(out.map((l) => `${l.date} ${l.checkIn}`), ["2026-10-26 08:00", "2026-10-26 20:00", "2026-10-28 -"]);
});

test("출퇴근 현황 영역 403 은 일반 메뉴 가드 문구도 영역 권한 안내로 본다 — 옵션이 있을 때만", () => {
  assert.equal(areaFailureOf(403, ACCESS_DENIED_MESSAGE, { includeAccessDenied: true }), "forbidden");
  assert.equal(areaFailureOf(403, ACCESS_DENIED_MESSAGE), "error");
  assert.equal(areaFailureOf(404, ACCESS_DENIED_MESSAGE, { includeAccessDenied: true }), "error");
});

test("출퇴근 현황 「관리」 주소 — 그 직원 · 근무지 · 보던 주(보정 목록 기간도 그 주)로 열고 퇴직 직원도 보이게 재직은 전체", () => {
  const url = new URL(attendanceManageHref(42, 7, "2026-10-26", "2026-10-29"), "http://x");
  assert.equal(url.pathname, "/attendance-records");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    storeIds: "7",
    staffMemberId: "42",
    employment: "ALL",
    date: "2026-10-29",
    week: "2026-10-26",
    fixFrom: "2026-10-26",
    fixTo: "2026-11-01",
  });
});

test("출퇴근 현황 — api 순서(출근 없는 퇴근 orphan 이 맨 뒤)여도 가장 늦은 퇴근을 고른다", () => {
  const [l] = lines([day("2026-10-26", "NORMAL", [[{ time: "13:00" }, { time: "18:00" }], [null, { time: "12:00" }]])]);
  assert.equal(l.checkIn, "13:00");
  assert.equal(l.checkOut, "18:00");
});

test("출퇴근 현황 — 자정을 넘긴 퇴근은 「(다음날)」, 같은 날 07:00 orphan 보다 익일 06:00 이 더 늦다", () => {
  const [l] = lines([day("2026-10-26", "NORMAL", [[{ time: "22:00" }, { time: "06:00", next: true }], [null, { time: "07:00" }]])]);
  assert.equal(l.checkIn, "22:00");
  assert.equal(l.checkOut, "06:00(다음날)");
});

test("출퇴근 현황 「관리」 주소의 날 — 오늘이 그 주 밖이면 월요일", () => {
  const url = new URL(attendanceManageHref(42, 7, "2026-10-19", "2026-10-29"), "http://x");
  assert.equal(url.searchParams.get("date"), "2026-10-19");
});
