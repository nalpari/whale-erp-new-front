// node --test src/lib/retirement.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRetiredDate, earliestRetiredDate, failureEffect, isSettledNow, reloadsPreview, retirementActions, settlesWithoutWarning, showsBelowDateField, staleDayWarning, todayAfterSubmit } from "./retirement.ts";

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

test("확인창을 연 채 자정을 넘겨 퇴직일이 어제가 되면 — 경고 없이 즉시 정리될 뻔했다", () => {
  assert.equal(settlesWithoutWarning("2026-10-15", "2026-10-15", "2026-10-16"), true);
});

test("날짜가 그대로거나, 이미 지난 날짜 경고를 본 경우는 다시 확인하지 않는다", () => {
  assert.equal(settlesWithoutWarning("2026-10-15", "2026-10-15", "2026-10-15"), false);
  assert.equal(settlesWithoutWarning("2026-10-14", "2026-10-15", "2026-10-16"), false);
  // 자정을 넘겨도 퇴직일이 아직 오늘 이후면 다음 날 배치가 정리한다 — 그대로 처리한다
  assert.equal(settlesWithoutWarning("2026-10-20", "2026-10-15", "2026-10-16"), false);
});

test("서버 판정 — 확인창이 본 오늘과 서버의 오늘 사이에 퇴직일이 지난 날짜가 되면 경고 문구", () => {
  assert.equal(
    staleDayWarning("2026-10-15", "2026-10-15", "2026-10-16"),
    "날짜가 바뀌어 퇴직일이 지난 날짜가 되었습니다. 처리하면 즉시 정리되니 다시 확인해 주세요.",
  );
});

test("서버 판정 — 그대로거나 이미 지난 날짜 경고를 본 경우는 통과", () => {
  assert.equal(staleDayWarning("2026-10-15", "2026-10-15", "2026-10-15"), null);
  assert.equal(staleDayWarning("2026-10-14", "2026-10-15", "2026-10-16"), null);
});

test("서버 판정 — 확인창이 본 오늘이 날짜가 아니면 판단할 수 없어 다시 확인받는다", () => {
  assert.notEqual(staleDayWarning("2026-10-15", "x", "2026-10-15"), null);
});

test("확인창의 오늘은 서버가 날짜 바뀜으로 막으며 돌려준 오늘로만 바뀐다", () => {
  assert.equal(todayAfterSubmit("2026-10-15", { ok: false, today: "2026-10-16" }), "2026-10-16");
});

test("브라우저 시계가 빨라도 서버가 막지 않았으면 오늘은 그대로 — 과잉 「즉시 정리」 경고를 띄우지 않는다", () => {
  // 서버 D 에 그린 화면, 브라우저는 이미 D+1 이어도 판단에 브라우저 시계를 쓰지 않는다
  assert.equal(todayAfterSubmit("2026-10-15", { ok: true }), "2026-10-15");
});

test("서버의 오늘을 받은 뒤 다른 이유(409 등)로 실패해도 그 오늘을 지킨다 — 경고가 사라졌다 나타나지 않게", () => {
  assert.equal(todayAfterSubmit("2026-10-16", { ok: false }), "2026-10-16");
});

test("서버가 돌려준 오늘이 날짜가 아니면 무시한다", () => {
  assert.equal(todayAfterSubmit("2026-10-15", { ok: false, today: "x" }), "2026-10-15");
});

test("날짜 칸 아래 — 퇴직일 입력 400 만 칸 아래, 권한 403 · 상태 409 · 결과 모름은 맨 아래", () => {
  assert.equal(showsBelowDateField({ status: 400 }), true);
  assert.equal(showsBelowDateField({ status: 403 }), false);
  assert.equal(showsBelowDateField({ status: 409 }), false);
  assert.equal(showsBelowDateField({}), false);
});

test("미리 보기 다시 받기 — 다른 값은 늘, 같은 값은 연결 · 서버 오류일 때만", () => {
  assert.equal(reloadsPreview("2026-10-30", "2026-10-29", "ok"), true);
  for (const status of ["ok", "loading", "idle"] as const) assert.equal(reloadsPreview("2026-10-29", "2026-10-29", status), false);
  assert.equal(reloadsPreview("2026-10-29", "2026-10-29", "error"), true);
});
