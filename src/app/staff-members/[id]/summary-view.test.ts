// pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/summary-view.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AREA_READ_DENIED_MESSAGE,
  areaFailureOf,
  hoursText,
  isPayslipSummaryEmpty,
  mondayOf,
  payPeriodText,
  payslipRows,
  shiftDate,
  todoFootText,
  todoHistoryText,
  weekRangeText,
  weekHref,
  weekStartParam,
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

test("주소의 weekStart 는 실제 날짜일 때만 받는다", () => {
  assert.equal(weekStartParam("2026-10-21"), "2026-10-21");
  assert.equal(weekStartParam("2026-02-30"), null);
  assert.equal(weekStartParam("2026-1-5"), null);
  assert.equal(weekStartParam("abc"), null);
  assert.equal(weekStartParam(undefined), null);
  assert.equal(weekStartParam(["2026-10-21", "2026-10-28"]), null);
  // 연도는 1900~2999 — 9999 년의 다음 주는 다섯 자리 연도라 링크가 깨진다
  assert.equal(weekStartParam("1900-01-01"), "1900-01-01");
  assert.equal(weekStartParam("2999-12-31"), "2999-12-31");
  assert.equal(weekStartParam("0001-01-01"), null);
  assert.equal(weekStartParam("9999-12-27"), null);
});

test("주는 월요일부터다 — 일요일은 그 앞 월요일의 주", () => {
  assert.equal(mondayOf("2026-10-19"), "2026-10-19"); // 월
  assert.equal(mondayOf("2026-10-21"), "2026-10-19"); // 수
  assert.equal(mondayOf("2026-10-25"), "2026-10-19"); // 일
  assert.equal(mondayOf("2026-11-01"), "2026-10-26"); // 일, 달을 넘는다
});

test("주 넘김은 7일씩, 달 · 해를 넘는다", () => {
  assert.equal(shiftDate("2026-10-26", 7), "2026-11-02");
  assert.equal(shiftDate("2026-01-05", -7), "2025-12-29");
  assert.equal(weekRangeText("2026-10-26"), "2026-10-26 ~ 11-01");
});

test("근무일 칸은 MM-DD 요일", () => {
  assert.equal(workDateText("2026-10-21"), "10-21 수");
  assert.equal(workDateText("2026-10-25"), "10-25 일");
});

test("근무시간 합계는 시간으로 소수 한 자리", () => {
  assert.equal(hoursText(0), "0.0h");
  assert.equal(hoursText(450), "7.5h");
  assert.equal(hoursText(2250), "37.5h");
  assert.equal(hoursText(100), "1.7h");
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

test("주 넘김 링크는 다른 조회 조건을 두고 weekStart 만 바꾼다", () => {
  assert.equal(weekHref({}, "2026-10-26"), "?weekStart=2026-10-26");
  assert.equal(weekHref({ name: "서지안", storeIds: ["1", "2"], weekStart: "2026-10-19" }, "2026-10-26"), "?name=%EC%84%9C%EC%A7%80%EC%95%88&storeIds=1&storeIds=2&weekStart=2026-10-26");
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
