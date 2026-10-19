// node --test "src/app/contracts/[contractId]/send-model.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { saveOutcomeUnknown, SEND_UNKNOWN, sendFailedTarget, sendFailureOf, sendNoticeOf } from "./send-model.ts";

test("sendFailureOf — 접수 여부 모름은 보내기를 막고 상세를 다시 읽는다", () => {
  assert.deepEqual(sendFailureOf(502, "SEND_UNCONFIRMED", "알림톡이 접수됐는지 알 수 없습니다"), {
    ok: false,
    error: "알림톡이 접수됐는지 알 수 없습니다",
    code: "SEND_UNCONFIRMED",
    recheck: true,
  });
  // 앞단 프록시가 코드 없이 끊음 · 응답 없음 — api 는 보냈을 수 있다
  for (const status of [502, 504, null]) assert.deepEqual(sendFailureOf(status, undefined, "x"), { ok: false, error: SEND_UNKNOWN, recheck: true });
});

test("sendFailureOf — 409 상태 충돌 · 다른 요청이 먼저 고침은 화면이 낡아 다시 읽는다", () => {
  assert.equal(sendFailureOf(409, "CONTRACT_STATUS_CONFLICT", "x").recheck, true);
  assert.equal(sendFailureOf(409, undefined, "다른 요청이 먼저 근로계약을 고쳤습니다").recheck, true);
});

test("sendFailureOf — 나가지 않은 실패는 api 문장 그대로, 다시 보낼 수 있다", () => {
  assert.deepEqual(sendFailureOf(502, "SEND_FAILED", "알림톡을 보내지 못했습니다"), {
    ok: false,
    error: "알림톡을 보내지 못했습니다",
    code: "SEND_FAILED",
    recheck: false,
  });
  for (const [status, code] of [
    [409, "SEND_CHANNEL_NOT_READY"],
    [409, "SEND_PHONE_NOT_MOBILE"],
    [503, undefined],
    [404, undefined],
  ] as const)
    assert.equal(sendFailureOf(status, code, "x").recheck, false);
});

test("sendFailedTarget — 저장 뒤 보내기가 실패한 502 만 그 계약 상세로 옮긴다", () => {
  assert.equal(sendFailedTarget(502, { code: "SEND_FAILED", contractId: 7 }), "/contracts/7?send=failed");
  assert.equal(sendFailedTarget(502, { code: "SEND_UNCONFIRMED", contractId: 7 }), "/contracts/7?send=unconfirmed");
  for (const [status, body] of [
    [409, { code: "SEND_FAILED", contractId: 7 }],
    [502, { code: "OTHER", contractId: 7 }],
    [502, { code: "SEND_FAILED" }],
    [502, { code: "SEND_FAILED", contractId: "7/../../stores" }],
    [502, { code: "SEND_FAILED", contractId: 0 }],
    [502, null],
  ] as const)
    assert.equal(sendFailedTarget(status, body), null, JSON.stringify(body));
});

test("sendNoticeOf — 되돌아간 상태에 따라 다시 저장 · 재발송을 안내하고, 정해진 이름만 받는다", () => {
  assert.match(sendNoticeOf("failed", "DRAFT") ?? "", /임시저장으로 두었습니다/);
  assert.match(sendNoticeOf("failed", "PENDING_SEND") ?? "", /재발송해 주세요/);
  assert.match(sendNoticeOf("unconfirmed", "PENDING_SEND") ?? "", /두 번 갈 수 있습니다/);
  for (const raw of [undefined, "", "toString", ["failed"]]) assert.equal(sendNoticeOf(raw, "DRAFT"), null);
});

test("sendNoticeOf — 수정 요청으로 되돌아갔으면 재발송이 아니라 「수정」에서 다시 저장하라고 한다", () => {
  const notice = sendNoticeOf("failed", "CORRECTION_REQUESTED") ?? "";
  assert.match(notice, /「수정」에서 다시 저장/);
  assert.doesNotMatch(notice, /재발송/);
  assert.match(sendNoticeOf("unknown", "PENDING_SEND") ?? "", /결과를 받지 못했습니다/);
});

test("saveOutcomeUnknown — 응답 없음 · 코드 없는 502 · 504 만 결과 모름이다", () => {
  assert.equal(saveOutcomeUnknown(null, undefined), true);
  assert.equal(saveOutcomeUnknown(502, undefined), true);
  assert.equal(saveOutcomeUnknown(504, undefined), true);
  assert.equal(saveOutcomeUnknown(502, "SEND_FAILED"), false);
  assert.equal(saveOutcomeUnknown(503, undefined), false);
  assert.equal(saveOutcomeUnknown(409, undefined), false);
});
