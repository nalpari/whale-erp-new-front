// pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/contract-summary.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다
import assert from "node:assert/strict";
import { test } from "node:test";
import { contractSummaryTexts, labelsOrNull, payrollAccountRows, payrollAccountText } from "./contract-summary.ts";

const contract = (startDate: string | null, endDate: string | null, more: { lastSentAt?: string | null; renewalDate?: string | null } = {}) => ({
  startDate,
  endDate,
  lastSentAt: more.lastSentAt ?? null,
  renewalDate: more.renewalDate ?? null,
});

test("계약 유형은 고용 형태 라벨 + 근로계약이다", () => {
  assert.equal(contractSummaryTexts(contract("2026-03-01", null), "정직원").type, "정직원 근로계약");
  assert.equal(contractSummaryTexts(contract("2026-03-01", null), "파트타이머").type, "파트타이머 근로계약");
});

test("고용 형태 한글을 받지 못했으면 계약 유형은 - 다 — 영문 값을 보이지 않는다", () => {
  assert.equal(contractSummaryTexts(contract("2026-03-01", null), null).type, "-");
});

test("enum 목록이 비면 받지 못한 것과 같다 — 응답에 그 enum 이 빠지면 getEnum 은 throw 없이 [] 를 준다", () => {
  assert.equal(labelsOrNull([]), null);
  const values = [{ value: "FULL_TIME", label: "정직원", order: 1 }];
  assert.equal(labelsOrNull(values), values);
});

test("계약 기간은 시작일 ~ 종료일, 종료일이 없으면 무기한, 시작일이 없으면 -", () => {
  assert.equal(contractSummaryTexts(contract("2026-03-01", "2027-02-28"), "정직원").period, "2026-03-01 ~ 2027-02-28");
  assert.equal(contractSummaryTexts(contract("2026-03-01", null), "정직원").period, "2026-03-01 ~ 무기한");
  // 임시저장은 시작일을 비워 둘 수 있다 — 종료일만 있어도 기간을 반쪽으로 보이지 않는다
  assert.equal(contractSummaryTexts(contract(null, null), "정직원").period, "-");
  assert.equal(contractSummaryTexts(contract(null, "2026-12-31"), "정직원").period, "-");
});

test("최근 발송일은 발송 일시의 한국 날짜다 — UTC 로 전날 밤이어도 한국 날짜로 넘어간다", () => {
  assert.equal(contractSummaryTexts(contract("2026-03-01", null, { lastSentAt: "2026-02-24T01:00:00.000Z" }), "정직원").lastSent, "2026-02-24");
  assert.equal(contractSummaryTexts(contract("2026-03-01", null, { lastSentAt: "2026-02-23T15:30:00.000Z" }), "정직원").lastSent, "2026-02-24");
});

test("보낸 적이 없으면 최근 발송일은 -", () => {
  assert.equal(contractSummaryTexts(contract("2026-03-01", null), "정직원").lastSent, "-");
});

test("갱신 예정일은 api 값 그대로, 없으면 -", () => {
  assert.equal(contractSummaryTexts(contract("2026-03-01", "2026-12-31", { renewalDate: "2026-12-01" }), "정직원").renewal, "2026-12-01");
  assert.equal(contractSummaryTexts(contract("2026-03-01", "2026-12-31"), "정직원").renewal, "-");
});

test("급여 계좌는 은행 이름 + 계좌번호 그대로다 — 하이픈 · 가림 없음", () => {
  assert.equal(payrollAccountText({ bankName: "KB국민은행", accountNumber: "123456789012" }), "KB국민은행 123456789012");
});

test("급여 계좌 신고 정보가 없으면 - 다", () => {
  assert.equal(payrollAccountText(null), "-");
  assert.equal(payrollAccountText(undefined), "-");
});

const account = { bankName: "KB국민은행", accountNumber: "123456789012" };

test("급여 계좌 줄: 볼 수 있고 계좌가 있으면 값이 있는 줄", () => {
  assert.deepEqual(payrollAccountRows({ canViewPayrollAccount: true, payrollAccount: account }), [
    { label: "급여 계좌", value: "KB국민은행 123456789012" },
  ]);
});

test("급여 계좌 줄: 볼 수 있고 계좌가 null 이면 - 인 줄", () => {
  assert.deepEqual(payrollAccountRows({ canViewPayrollAccount: true, payrollAccount: null }), [{ label: "급여 계좌", value: "-" }]);
});

test("급여 계좌 줄: 볼 수 없으면 줄이 없다", () => {
  assert.deepEqual(payrollAccountRows({ canViewPayrollAccount: false, payrollAccount: null }), []);
});

test("급여 계좌 줄: 칸이 없는 옛 응답(undefined)은 안전하게 숨긴다", () => {
  // 타입은 필수 boolean — 칸이 빠진 옛 응답을 흉내 내려고 테스트에서만 캐스트한다
  assert.deepEqual(payrollAccountRows({ payrollAccount: account } as Parameters<typeof payrollAccountRows>[0]), []);
});
