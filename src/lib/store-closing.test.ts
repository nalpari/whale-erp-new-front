// node --test src/lib/store-closing.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { closingBlockOf, closingCheckLines, closingPayslipText, closingResultLines, type StoreClosingCounts } from "./store-closing.ts";

const counts = (patch: Partial<StoreClosingCounts> = {}): StoreClosingCounts => ({
  openCheckIns: { count: 0, hiddenCount: 0, first: null },
  retiringStaff: 0,
  draftContracts: 0,
  pendingSendContracts: 0,
  pendingSignatureContracts: 0,
  unconfirmedPayslips: 0,
  isBlocked: false,
  ...patch,
});

const first = (isCheckOutExpired: boolean) => ({
  storeId: 1,
  attendanceRecordId: 9,
  staffMemberId: 3,
  name: "김직원",
  recordedAt: "2026-11-04T00:12:00.000Z",
  isCheckOutExpired,
});

test("열린 출근이 없으면 막지 않는다", () => {
  assert.equal(closingBlockOf(counts()), null);
});

test("막힘 건수는 가려진 직원 것까지 더하고, 첫 건 시각은 한국 시간이다", () => {
  const block = closingBlockOf(counts({ openCheckIns: { count: 2, hiddenCount: 1, first: first(true) } }));
  assert.deepEqual(block, { count: 3, first: { name: "김직원", recordedAt: "2026-11-04 09:12" }, guide: "출퇴근 현황에서 보정으로 닫아 주세요." });
});

test("아직 퇴근할 수 있는 출근이면 퇴근을 기다리게 한다", () => {
  assert.equal(closingBlockOf(counts({ openCheckIns: { count: 1, hiddenCount: 0, first: first(false) } }))?.guide, "퇴근이 등록된 뒤 다시 해 주세요.");
});

test("가려진 건만 있으면 이름 없이 건수만", () => {
  const block = closingBlockOf(counts({ openCheckIns: { count: 0, hiddenCount: 2, first: null } }));
  assert.equal(block?.count, 2);
  assert.equal(block?.first, null);
  // 본사는 출퇴근 현황에서도 그 줄을 못 본다 — 가맹점이 닫게 한다
  assert.match(block?.guide ?? "", /가맹점에서/);
});

test("보이는 건과 가려진 건이 섞이면 건수는 합하고 첫 건은 보이는 것이다", () => {
  const block = closingBlockOf(counts({ openCheckIns: { count: 1, hiddenCount: 2, first: first(false) } }));
  assert.equal(block?.count, 3);
  assert.equal(block?.first?.name, "김직원");
});

test("확인 목록은 0건인 줄을 빼고, 급여명세서는 처리 목록이 아니라 따로 안내한다", () => {
  assert.deepEqual(closingCheckLines(counts()), []);
  const c = counts({ retiringStaff: 1200, pendingSendContracts: 2, unconfirmedPayslips: 1 });
  assert.deepEqual(
    closingCheckLines(c).map((l) => l.text),
    ["근무 중인 직원 1,200명 퇴직(퇴직일 오늘)", "발송 대기 근로계약 2건 종료 · 초대 무효"],
  );
  assert.equal(closingPayslipText(c), "확정하지 않은 급여명세서 1건은 폐점 뒤에도 처리할 수 있습니다.");
  assert.equal(closingPayslipText(counts()), null);
});

test("확인 목록은 직원 · 임시저장 · 발송 대기 · 서명 대기 순서이고 줄마다 자기 수를 쓴다", () => {
  const lines = closingCheckLines(counts({ retiringStaff: 4, draftContracts: 3, pendingSendContracts: 2, pendingSignatureContracts: 1 }));
  assert.deepEqual(
    lines.map((l) => [l.key, l.text]),
    [
      ["staff", "근무 중인 직원 4명 퇴직(퇴직일 오늘)"],
      ["draft", "임시저장 근로계약 3건 종료"],
      ["send", "발송 대기 근로계약 2건 종료 · 초대 무효"],
      ["sign", "서명 대기 · 수정 요청 근로계약 1건 종료"],
    ],
  );
});

test("결과 안내의 계약 종류는 임시저장 · 발송 대기 · 서명 대기 순서다", () => {
  const base = { retiringStaff: 0, pulledForwardStaff: 0, draftContracts: 1, pendingSendContracts: 2, pendingSignatureContracts: 3, expiredInvitations: 0 };
  assert.deepEqual(closingResultLines(base), [
    { key: "contracts", text: "근로계약 6건 종료", note: "임시저장 1건, 발송 대기 2건, 서명 대기 · 수정 요청 3건" },
  ]);
});

test("결과 안내는 계약을 한 줄로 묶고, 앞당긴 퇴직을 덧붙인다", () => {
  const base = { retiringStaff: 0, pulledForwardStaff: 0, draftContracts: 0, pendingSendContracts: 0, pendingSignatureContracts: 0, expiredInvitations: 0 };
  assert.deepEqual(closingResultLines(base), []);
  const lines = closingResultLines({ ...base, retiringStaff: 3, pulledForwardStaff: 1, draftContracts: 1, pendingSignatureContracts: 2, expiredInvitations: 1 });
  assert.deepEqual(lines, [
    { key: "staff", text: "직원 3명 퇴직 처리", note: "퇴직일을 오늘로 앞당긴 1명 포함" },
    { key: "contracts", text: "근로계약 3건 종료", note: "임시저장 1건, 서명 대기 · 수정 요청 2건" },
    { key: "invitations", text: "초대 1건 만료" },
  ]);
});
