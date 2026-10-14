// node --test src/app/staff/contracts/contract-list.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { deadlineNote, periodText, readListQuery, sentText, toSearch, wageText, withKnownStatus } from "./contract-list.ts";

test("readListQuery 는 빈 값 · 잘못된 page 를 기본값으로 바꾼다", () => {
  assert.deepEqual(readListQuery({}), { page: 1, storeName: "", staffMemberName: "", status: [] });
  assert.equal(readListQuery({ page: "0" }).page, 1);
  assert.equal(readListQuery({ page: "abc" }).page, 1);
  assert.equal(readListQuery({ page: "3" }).page, 3);
  assert.equal(readListQuery({ storeName: "  서초 " }).storeName, "서초");
});

test("readListQuery 는 상태가 하나여도 배열로 준다", () => {
  assert.deepEqual(readListQuery({ status: "SIGNED" }).status, ["SIGNED"]);
  assert.deepEqual(readListQuery({ status: ["SIGNED", "REJECTED"] }).status, ["SIGNED", "REJECTED"]);
});

test("toSearch 는 기본값을 빼고, 상태는 같은 키를 되풀이한다", () => {
  assert.equal(toSearch({ page: 1, storeName: "", staffMemberName: "", status: [] }), "");
  assert.equal(
    toSearch({ page: 2, storeName: "서초", staffMemberName: "", status: ["SIGNED", "REJECTED"] }),
    "?page=2&storeName=%EC%84%9C%EC%B4%88&status=SIGNED&status=REJECTED",
  );
  assert.equal(toSearch({ page: 1, storeName: "", staffMemberName: "", status: [] }, { pageSize: "20" }), "?pageSize=20");
});

test("기간 · 급여 표기", () => {
  assert.equal(periodText({ startDate: "2026-09-14", endDate: null }), "2026-09-14 ~ 무기한");
  assert.equal(periodText({ startDate: "2026-09-01", endDate: "2027-08-31" }), "2026-09-01 ~ 2027-08-31");
  // 정직원도 시급이다
  assert.equal(wageText({ wageAmount: 11600 }), "11,600 /h");
  // 임시저장은 비어 있을 수 있다
  assert.equal(periodText({ startDate: null, endDate: null }), "-");
  assert.equal(wageText({ wageAmount: null }), "-");
});

test("발송일은 한국 날짜로 끊는다", () => {
  assert.equal(sentText(null), "-");
  // UTC 9월 1일 15:30 = 한국 9월 2일 00:30
  assert.equal(sentText("2026-09-01T15:30:00.000Z"), "09-02");
  assert.equal(sentText("2026-09-01T02:00:00.000Z"), "09-01");
});

test("서명 대기만 남은 날을 붙인다", () => {
  const now = new Date("2026-09-07T03:00:00Z"); // 한국 9월 7일
  const row = { status: "PENDING_SIGNATURE" as const, signDeadlineAt: "2026-10-01T02:00:00.000Z" };
  assert.equal(deadlineNote(row, now), "D-24");
  assert.equal(deadlineNote({ ...row, signDeadlineAt: "2026-09-07T14:00:00.000Z" }, now), "D-0");
  assert.equal(deadlineNote({ ...row, signDeadlineAt: "2026-09-01T00:00:00.000Z" }, now), undefined);
  assert.equal(deadlineNote({ ...row, status: "SIGNED" }, now), undefined);
});

test("api 가 400 을 줄 주소 값은 보내기 전에 거른다", () => {
  // 이름 검색어는 api @MaxLength(50) 에 맞춰 자른다
  assert.equal(readListQuery({ staffMemberName: "가".repeat(60) }).staffMemberName.length, 50);
  assert.equal(readListQuery({ storeName: "x".repeat(51) }).storeName.length, 50);
  // 모르는 상태 값은 뺀다
  const q = readListQuery({ status: ["SIGNED", "FOO"] });
  assert.deepEqual(withKnownStatus(q, [{ value: "SIGNED" }, { value: "DRAFT" }]).status, ["SIGNED"]);
});
