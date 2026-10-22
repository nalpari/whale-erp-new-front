// pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/summary-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다
import assert from "node:assert/strict";
import { test } from "node:test";
import { endLabel } from "../../work-schedules/work-schedule-view.ts";
import {
  AREA_READ_DENIED_MESSAGE,
  areaFailureOf,
  isAreaForbidden,
  isPayslipSummaryEmpty,
  parseScheduleQuery,
  payPeriodText,
  payslipRows,
  SCHEDULE_PERIOD_LABELS,
  STAFF_WORK_SCHEDULE_PERIODS,
  scheduleEmptyText,
  scheduleHref,
  schedulePageCount,
  scheduleTotalLabel,
  hoursText,
  todoFootText,
  todoHistoryText,
  withScheduleFilter,
  workDateText,
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

test("근무스케줄 기간 선택칸은 다섯 가지, 화면이 쓰는 배열 순서와 글자다", () => {
  assert.deepEqual(
    STAFF_WORK_SCHEDULE_PERIODS.map((p) => SCHEDULE_PERIOD_LABELS[p]),
    ["이번 주", "최근 4주", "최근 3개월", "최근 1년", "전체"],
  );
  // 배열에서 빠진 값은 주소에서 조용히 이번 주로 바뀐다 — 배열과 글자 표의 키가 같아야 한다
  assert.deepEqual(new Set(STAFF_WORK_SCHEDULE_PERIODS), new Set(Object.keys(SCHEDULE_PERIOD_LABELS)));
});

test("주소의 근무스케줄 값 — 없으면 이번 주 · 1쪽 · 20건", () => {
  assert.deepEqual(parseScheduleQuery({}), { period: "THIS_WEEK", page: 1, pageSize: 20 });
  assert.deepEqual(parseScheduleQuery({ schedulePeriod: "LAST_1_YEAR", schedulePage: "3", schedulePageSize: "50" }), {
    period: "LAST_1_YEAR",
    page: 3,
    pageSize: 50,
  });
  assert.equal(parseScheduleQuery({ schedulePeriod: "ALL" }).period, "ALL");
});

test("잘못된 근무스케줄 주소 값은 기본으로", () => {
  for (const schedulePeriod of ["this_week", "LAST_2_WEEKS", ""]) assert.equal(parseScheduleQuery({ schedulePeriod }).period, "THIS_WEEK", schedulePeriod);
  for (const schedulePage of ["0", "-1", "1.5", "abc", "1000001"]) assert.equal(parseScheduleQuery({ schedulePage }).page, 1, schedulePage);
  // 쪽 상한(api 와 같은 1,000,000)은 받는다
  assert.equal(parseScheduleQuery({ schedulePage: "1000000" }).page, 1_000_000);
  for (const schedulePageSize of ["10", "30", "200", "x"]) assert.equal(parseScheduleQuery({ schedulePageSize }).pageSize, 20, schedulePageSize);
  // 같은 키가 여럿이면 앞의 것
  assert.deepEqual(parseScheduleQuery({ schedulePeriod: ["LAST_4_WEEKS", "ALL"], schedulePage: ["2", "5"] }), { period: "LAST_4_WEEKS", page: 2, pageSize: 20 });
  // WHALEERP-184 주 넘김의 weekStart 는 읽지 않는다
  assert.deepEqual(parseScheduleQuery({ weekStart: "2026-10-12" }), { period: "THIS_WEEK", page: 1, pageSize: 20 });
});

test("기간 · 건수를 바꾸면 1쪽으로", () => {
  const q = { period: "LAST_4_WEEKS", page: 4, pageSize: 50 } as const;
  assert.deepEqual(withScheduleFilter(q, { period: "ALL" }), { period: "ALL", page: 1, pageSize: 50 });
  assert.deepEqual(withScheduleFilter(q, { pageSize: 100 }), { period: "LAST_4_WEEKS", page: 1, pageSize: 100 });
});

test("근무스케줄 링크는 다른 조회 조건을 두고 schedule 값만 바꾼다 — 기본값은 뺀다", () => {
  assert.equal(scheduleHref({}, { period: "THIS_WEEK", page: 1, pageSize: 20 }), "?");
  assert.equal(scheduleHref({}, { period: "LAST_3_MONTHS", page: 2, pageSize: 100 }), "?schedulePeriod=LAST_3_MONTHS&schedulePage=2&schedulePageSize=100");
  assert.equal(
    scheduleHref({ name: "서지안", storeIds: ["1", "2"], schedulePeriod: "ALL", schedulePage: "3", weekStart: "2026-10-19" }, { period: "ALL", page: 1, pageSize: 20 }),
    "?name=%EC%84%9C%EC%A7%80%EC%95%88&storeIds=1&storeIds=2&schedulePeriod=ALL",
  );
});

test("근무스케줄 값은 직원 목록의 page · pageSize 와 섞이지 않는다", () => {
  assert.equal(scheduleHref({ page: "3", pageSize: "50", schedulePage: "2" }, { period: "THIS_WEEK", page: 5, pageSize: 20 }), "?page=3&pageSize=50&schedulePage=5");
  assert.deepEqual(parseScheduleQuery({ page: "3", pageSize: "50" }), { period: "THIS_WEEK", page: 1, pageSize: 20 });
});

test("쪽 수는 0건도 1쪽", () => {
  assert.equal(schedulePageCount(0, 20), 1);
  assert.equal(schedulePageCount(20, 20), 1);
  assert.equal(schedulePageCount(21, 20), 2);
  assert.equal(schedulePageCount(101, 50), 3);
});

test("빈 표 안내 — 이번 주는 「이 주에」, 다른 기간은 「이 기간에」(2026-10-22 노영주)", () => {
  assert.equal(scheduleEmptyText("THIS_WEEK"), "이 주에 잡힌 근무스케줄이 없습니다.");
  for (const period of ["LAST_4_WEEKS", "LAST_3_MONTHS", "LAST_1_YEAR", "ALL"] as const)
    assert.equal(scheduleEmptyText(period), "이 기간에 잡힌 근무스케줄이 없습니다.", period);
});

test("합계 줄 이름 — 이번 주는 주간, 다른 기간은 기간(2026-10-22 노영주)", () => {
  assert.equal(scheduleTotalLabel("THIS_WEEK"), "주간 근무시간 합계");
  for (const period of ["LAST_4_WEEKS", "LAST_3_MONTHS", "LAST_1_YEAR", "ALL"] as const)
    assert.equal(scheduleTotalLabel(period), "기간 근무시간 합계", period);
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

test("근무일 칸은 MM-DD 요일, 오늘과 다른 해면 연도를 남긴다", () => {
  assert.equal(workDateText("2026-10-21", "2026-10-22"), "10-21 수");
  assert.equal(workDateText("2026-10-25", "2026-10-22"), "10-25 일");
  assert.equal(workDateText("2025-12-29", "2026-01-02"), "2025-12-29 월");
  assert.equal(workDateText("2027-01-04", "2026-12-30"), "2027-01-04 월");
});

const payslip = (payslipId: number, status: PayslipSummaryItem["status"]): PayslipSummaryItem => ({
  payslipId,
  status,
  periodStartDate: "2026-10-01",
  periodEndDate: "2026-10-31",
  grossPayAmount: 3_000_000,
  totalDeductionAmount: 300_000,
  netPayAmount: 2_700_000,
  confirmedAt: null,
});

test("급여명세서 영역은 이번 달 · 최근 확정 순으로, 같은 명세서면 한 줄이다", () => {
  assert.deepEqual(
    payslipRows({ currentMonth: payslip(2, "REVIEWING"), latestConfirmed: payslip(1, "SENT") }).map((r) => [r.label, r.payslip.payslipId]),
    [
      ["이번 달", 2],
      ["최근 확정", 1],
    ],
  );
  assert.deepEqual(
    payslipRows({ currentMonth: payslip(1, "CONFIRMED"), latestConfirmed: payslip(1, "CONFIRMED") }).map((r) => r.label),
    ["이번 달 · 최근 확정"],
  );
  assert.deepEqual(payslipRows({ currentMonth: null, latestConfirmed: payslip(1, "SENT") }).map((r) => r.label), ["최근 확정"]);
  assert.deepEqual(payslipRows({ currentMonth: null, latestConfirmed: null }), []);
});

test("급여명세서 영역은 보일 명세서도 미발송도 없을 때만 빈 상태다", () => {
  assert.equal(isPayslipSummaryEmpty({ currentMonth: null, latestConfirmed: null, unsentCount: 0 }), true);
  // 지난 달 작성 중 명세서처럼 두 줄에 안 걸려도 미발송이 있으면 건수를 보인다
  assert.equal(isPayslipSummaryEmpty({ currentMonth: null, latestConfirmed: null, unsentCount: 1 }), false);
  assert.equal(isPayslipSummaryEmpty({ currentMonth: payslip(1, "DRAFTING"), latestConfirmed: null, unsentCount: 1 }), false);
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

test("급여 기간은 같은 해면 끝 날짜의 연도를 줄이고, 해를 넘으면 남긴다", () => {
  assert.equal(payPeriodText({ periodStartDate: "2026-10-01", periodEndDate: "2026-10-31" }), "2026-10-01 ~ 10-31");
  assert.equal(payPeriodText({ periodStartDate: "2025-12-21", periodEndDate: "2026-01-20" }), "2025-12-21 ~ 2026-01-20");
});

test("TO-DO 칸은 목록 · 요약 중 한 경로라도 영역 권한 403 이면 영역 전체를 막는다", () => {
  assert.equal(isAreaForbidden({ kind: "forbidden" }, { kind: "ok" }), true);
  assert.equal(isAreaForbidden({ kind: "ok" }, { kind: "forbidden" }), true);
  assert.equal(isAreaForbidden({ kind: "forbidden" }, { kind: "forbidden" }), true);
  // 권한이 아닌 실패는 막지 않는다 — 그 자리에 다시 하기
  assert.equal(isAreaForbidden({ kind: "error" }, { kind: "ok" }), false);
  assert.equal(isAreaForbidden({ kind: "ok" }, { kind: "ok" }), false);
});
