// pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/contract-summary.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다
import assert from "node:assert/strict";
import { test } from "node:test";
import type { StaffMemberListItem } from "../../../lib/staff-members.ts";
import { contractCell } from "../staff-row.ts";
import { contractFailureOf, contractSummaryTexts, renewalDateOf } from "./contract-summary.ts";

const contract = (status: Parameters<typeof renewalDateOf>[0], startDate: string | null, endDate: string | null) => ({
  status,
  employmentType: "FULL_TIME" as const,
  startDate,
  endDate,
});

const TODAY = "2026-01-15";

test("갱신 예정일은 체결 완료이면서 종료일이 있을 때 종료일 30일 전이다", () => {
  assert.equal(renewalDateOf("SIGNED", "2026-12-31", TODAY), "2026-12-01");
  // 달을 넘긴다
  assert.equal(renewalDateOf("SIGNED", "2026-03-31", TODAY), "2026-03-01");
  assert.equal(renewalDateOf("SIGNED", "2026-03-01", TODAY), "2026-01-30");
  // 무기한
  assert.equal(renewalDateOf("SIGNED", null, TODAY), null);
});

test("갱신 예정일이 지났어도 종료일 전이면 그 날짜를 보인다", () => {
  assert.equal(renewalDateOf("SIGNED", "2026-01-20", TODAY), "2025-12-21");
  // 종료일 당일까지는 아직 계약 중이다
  assert.equal(renewalDateOf("SIGNED", TODAY, TODAY), "2025-12-16");
});

test("종료일이 지난 체결 완료는 종료 배치 전의 잠깐이라 갱신 예정일이 없다 — 목록 contractCell 과 같다", () => {
  assert.equal(renewalDateOf("SIGNED", "2026-01-14", TODAY), null);
});

test("윤년 2월 29일을 지나 센다", () => {
  assert.equal(renewalDateOf("SIGNED", "2028-03-30", TODAY), "2028-02-29");
});

test("직원 목록 배지와 경계가 같다 — 목록이 갱신 예정 D-n 이면 상세도 날짜가 있고, 종료일이 지나면 둘 다 갱신 예정이 아니다", () => {
  const listText = (endDate: string) =>
    contractCell({ contract: { contractId: 1, status: "SIGNED", signDeadlineAt: null, endDate, updatedAt: null } } as StaffMemberListItem, TODAY)?.text;
  // 종료일 30일 남음 — 목록 D-30, 상세 갱신 예정일은 오늘
  assert.equal(listText("2026-02-14"), "갱신 예정 D-30");
  assert.equal(renewalDateOf("SIGNED", "2026-02-14", TODAY), TODAY);
  // 종료일 당일 — 목록 D-0, 상세는 아직 날짜가 있다
  assert.equal(listText(TODAY), "갱신 예정 D-0");
  assert.notEqual(renewalDateOf("SIGNED", TODAY, TODAY), null);
  // 종료일 하루 지남 — 둘 다 갱신 예정이 아니다
  assert.equal(listText("2026-01-14"), "체결 완료");
  assert.equal(renewalDateOf("SIGNED", "2026-01-14", TODAY), null);
});

test("체결 완료가 아니면 갱신 예정일이 없다", () => {
  for (const status of ["DRAFT", "PENDING_SEND", "PENDING_SIGNATURE", "CORRECTION_REQUESTED", "REJECTED", "EXPIRED", "ENDED", null] as const)
    assert.equal(renewalDateOf(status, "2026-12-31", TODAY), null, String(status));
});

test("계약 유형은 고용 형태 라벨 + 근로계약이다", () => {
  assert.equal(contractSummaryTexts(contract("SIGNED", "2026-03-01", null), "정직원", TODAY).type, "정직원 근로계약");
  assert.equal(contractSummaryTexts({ ...contract("SIGNED", "2026-03-01", null), employmentType: "PART_TIME" }, "파트타이머", TODAY).type, "파트타이머 근로계약");
});

test("고용 형태 한글을 받지 못했으면 계약 유형은 - 다 — 영문 값을 보이지 않는다", () => {
  assert.equal(contractSummaryTexts(contract("SIGNED", "2026-03-01", null), null, TODAY).type, "-");
});

test("계약 기간은 시작일 ~ 종료일, 종료일이 없으면 무기한, 시작일이 없으면 -", () => {
  assert.equal(contractSummaryTexts(contract("SIGNED", "2026-03-01", "2027-02-28"), "정직원", TODAY).period, "2026-03-01 ~ 2027-02-28");
  assert.equal(contractSummaryTexts(contract("SIGNED", "2026-03-01", null), "정직원", TODAY).period, "2026-03-01 ~ 무기한");
  // 임시저장은 시작일을 비워 둘 수 있다 — 종료일만 있어도 기간을 반쪽으로 보이지 않는다
  assert.equal(contractSummaryTexts(contract("DRAFT", null, null), "정직원", TODAY).period, "-");
  assert.equal(contractSummaryTexts(contract("DRAFT", null, "2026-12-31"), "정직원", TODAY).period, "-");
});

test("최근 발송일은 발송 이력 로그가 생길 때까지 늘 -", () => {
  for (const status of ["DRAFT", "PENDING_SIGNATURE", "SIGNED"] as const)
    assert.equal(contractSummaryTexts(contract(status, "2026-03-01", null), "정직원", TODAY).lastSent, "-");
});

test("갱신 예정일 칸은 날짜가 없으면 -", () => {
  assert.equal(contractSummaryTexts(contract("SIGNED", "2026-03-01", "2026-12-31"), "정직원", TODAY).renewal, "2026-12-01");
  assert.equal(contractSummaryTexts(contract("SIGNED", "2026-03-01", null), "정직원", TODAY).renewal, "-");
  assert.equal(contractSummaryTexts(contract("ENDED", "2026-03-01", "2026-12-31"), "정직원", TODAY).renewal, "-");
});

test("계약을 못 받았을 때 403 은 권한 안내, 나머지는 다시 하기다", () => {
  assert.equal(contractFailureOf(403), "forbidden");
  assert.equal(contractFailureOf(404), "retry");
  assert.equal(contractFailureOf(500), "retry");
  assert.equal(contractFailureOf(401), "retry");
  // api 에 닿지 못했거나 ApiError 가 아닌 오류
  assert.equal(contractFailureOf(null), "retry");
});
