// node --test src/lib/store-closing.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { closingBlockOf, closingCheckLines, closingPayslipText, closingResultLines, type StoreClosingCounts } from "./store-closing.ts";

const counts = (patch: Partial<StoreClosingCounts> = {}): StoreClosingCounts => ({
  openCheckIns: { count: 0, hiddenCount: 0 },
  retiringStaff: 0,
  draftContracts: 0,
  pendingSendContracts: 0,
  pendingSignatureContracts: 0,
  unconfirmedPayslips: 0,
  isBlocked: false,
  ...patch,
});

test("열린 출근이 없으면 막지 않는다", () => {
  assert.equal(closingBlockOf(counts()), null);
});

test("막히면 건수만 — 이름 · 시각 · 할 일 안내 없이", () => {
  assert.deepEqual(closingBlockOf(counts({ openCheckIns: { count: 2, hiddenCount: 0 } })), { count: 2 });
});

test("가려진 건만 있어도 건수로 막는다", () => {
  assert.deepEqual(closingBlockOf(counts({ openCheckIns: { count: 0, hiddenCount: 2 } })), { count: 2 });
});

test("보이는 건과 가려진 건이 섞이면 건수는 합한다", () => {
  const block = closingBlockOf(counts({ openCheckIns: { count: 1, hiddenCount: 2 } }));
  assert.deepEqual(block, { count: 3 });
});

test("확인 목록은 0건인 줄을 빼고, 급여명세서는 처리 목록이 아니라 따로 안내한다", () => {
  assert.deepEqual(closingCheckLines(counts()), []);
  const c = counts({ retiringStaff: 1200, pendingSendContracts: 2, unconfirmedPayslips: 1 });
  assert.deepEqual(
    closingCheckLines(c).map((l) => l.text),
    ["근무 중인 직원 : 1,200명 퇴직 처리", "발송 대기 중인 근로계약 : 2건 종료"],
  );
  assert.equal(closingPayslipText(c), "확정되지 않은 급여명세서 1건은 폐점 후에도 처리할 수 있습니다.");
  assert.equal(closingPayslipText(counts()), null);
});

test("확인 목록은 직원 · 임시저장 · 발송 대기 · 서명 대기 순서이고 줄마다 자기 수와 무슨 뜻인지를 쓴다", () => {
  const lines = closingCheckLines(counts({ retiringStaff: 4, draftContracts: 3, pendingSendContracts: 2, pendingSignatureContracts: 1 }));
  assert.deepEqual(
    lines.map((l) => [l.key, l.text, l.note]),
    [
      ["staff", "근무 중인 직원 : 4명 퇴직 처리", "퇴직일이 없거나 오늘 이후인 직원의 퇴직일은 오늘로 변경됩니다."],
      ["draft", "임시저장된 근로계약 : 3건 종료", "해당 근로계약은 더 이상 작성하거나 발송할 수 없습니다."],
      ["send", "발송 대기 중인 근로계약 : 2건 종료", "해당 근로계약은 발송할 수 없으며, 이미 보낸 계약 초대도 만료됩니다."],
      ["sign", "서명 대기·수정 요청 중인 근로계약 : 1건 종료", "직원은 해당 근로계약에 더 이상 서명할 수 없습니다."],
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
