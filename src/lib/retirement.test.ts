// node --test src/lib/retirement.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRetiredDate, earliestRetiredDate, failureEffect, isSettledNow, retirementActions } from "./retirement.ts";

test("가장 이른 퇴직일은 오늘에서 3개월 전 같은 날", () => {
  assert.equal(earliestRetiredDate("2026-10-15"), "2026-07-15");
});

test("가장 이른 퇴직일 — 그 달에 같은 날이 없으면 말일로(api addMonths 와 같다)", () => {
  assert.equal(earliestRetiredDate("2026-05-31"), "2026-02-28");
  assert.equal(earliestRetiredDate("2028-05-31"), "2028-02-29");
});

test("가장 이른 퇴직일 — 해를 넘긴다", () => {
  assert.equal(earliestRetiredDate("2026-02-10"), "2025-11-10");
});

test("퇴직일 검사 — 오늘 · 미래 · 3개월 경계는 받는다", () => {
  for (const date of ["2026-10-15", "2027-03-01", "2026-07-15"]) assert.equal(checkRetiredDate(date, "2026-10-15"), null);
});

test("퇴직일 검사 — 3개월보다 오래된 날짜는 막는다", () => {
  assert.equal(checkRetiredDate("2026-07-14", "2026-10-15"), "퇴직일은 오늘 이후, 또는 최근 3개월 안의 지난 날짜만 받습니다.");
});

test("퇴직일 검사 — 비었거나 없는 날짜는 막는다", () => {
  assert.equal(checkRetiredDate("", "2026-10-15"), "퇴직일을 입력해 주세요.");
  for (const date of ["2026-02-30", "2026-1-5", "20261015"])
    assert.equal(checkRetiredDate(date, "2026-10-15"), "퇴직일을 YYYY-MM-DD 로 입력해 주세요.");
});

test("지난 날짜만 그 자리에서 정리된다 — 오늘은 아직 일하는 날", () => {
  assert.equal(isSettledNow("2026-10-14", "2026-10-15"), true);
  assert.equal(isSettledNow("2026-10-15", "2026-10-15"), false);
  assert.equal(isSettledNow("2026-10-16", "2026-10-15"), false);
});

const joined = { joinState: "JOINED" as const, employmentStatus: "EMPLOYED" as const, retiredDate: null };
const today = "2026-10-15";

test("재직이면 퇴직 처리", () => {
  assert.equal(retirementActions(joined, today, true), "retire");
});

test("퇴직 예정이고 퇴직일 전이면 퇴직일 변경 · 취소", () => {
  assert.equal(retirementActions({ ...joined, retiredDate: "2026-10-16" }, today, true), "scheduled");
});

test("퇴직일 당일 · 그 뒤(배치 전)는 버튼 없음 — api 가 409 로 막는다", () => {
  assert.equal(retirementActions({ ...joined, retiredDate: today }, today, true), null);
  assert.equal(retirementActions({ ...joined, retiredDate: "2026-10-14" }, today, true), null);
});

test("퇴직한 직원은 버튼 없음", () => {
  assert.equal(retirementActions({ ...joined, employmentStatus: "RETIRED", retiredDate: "2026-10-01" }, today, true), null);
});

test("가입 전 레코드(초안 · 초대 발송 등)는 버튼 없음", () => {
  for (const joinState of ["DRAFT", "INVITED", "EXPIRED", "REJECTED", "LINK_HOLD", "UNDER_AGE", null] as const)
    assert.equal(retirementActions({ ...joined, joinState }, today, true), null, String(joinState));
});

test("직원 정보 관리 수정 권한이 없으면 버튼 없음", () => {
  assert.equal(retirementActions(joined, today, false), null);
  assert.equal(retirementActions({ ...joined, retiredDate: "2026-10-16" }, today, false), null);
});

test("403 강제 비밀번호 변경은 변경 팝업을 다시 띄운다", () => {
  assert.equal(failureEffect({ status: 403, message: "서비스 이용을 위해 비밀번호를 변경해 주세요." }), "password");
});

test("403 권한 없음 · 사용할 수 없는 계정은 안내 뒤 이전 화면으로", () => {
  assert.equal(failureEffect({ status: 403, message: "접근 권한이 없습니다. 관리자에게 문의해 주세요." }), "leave");
  assert.equal(failureEffect({ status: 403, message: "사용할 수 없는 계정입니다. 관리자에게 문의해 주세요." }), "leave");
});

test("400 · 404 · 409 · 401 은 확인창 안에 문구로", () => {
  for (const status of [400, 401, 404, 409]) assert.equal(failureEffect({ status, message: "x" }), "inline", String(status));
});

test("결과를 모르는 실패(status 없음)는 화면을 새로 받는다 — 저장됐을 수도 있다", () => {
  assert.equal(failureEffect({ message: "처리 결과를 확인하지 못했습니다." }), "refresh");
});
