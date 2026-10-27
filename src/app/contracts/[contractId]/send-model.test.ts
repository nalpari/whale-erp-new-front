// node --test "src/app/contracts/[contractId]/send-model.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { redirect, unstable_rethrow } from "next/navigation.js";
import { callSave, END_UNKNOWN, SAVE_CALL_LOST, saveOutcomeUnknown, SEND_UNKNOWN, sendFailedTarget, resendDialogCopy, inviteResendCopy, sendFailureOf, sendNoticeOf, signingResendCopy } from "./send-model.ts";

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
  // 소속 추가 확인 · 복귀 확인은 계속 409 로 막힌다 — 문장은 api 가 정하므로 그대로 보인다(WHALEERP-611)
  assert.deepEqual(sendFailureOf(409, "SEND_CHANNEL_NOT_READY", "직원이 소속 추가를 확인한 뒤 보낼 수 있습니다"), {
    ok: false,
    error: "직원이 소속 추가를 확인한 뒤 보낼 수 있습니다",
    code: "SEND_CHANNEL_NOT_READY",
    recheck: false,
  });
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

test("callSave — 성공 · 발송 실패의 redirect 는 다시 던져 원래 목적지로 가고, 호출이 끊긴 것만 결과 모름이다", async () => {
  const redirected = (path: string) => {
    try {
      redirect(path);
    } catch (e) {
      return e;
    }
  };
  // 저장 성공(목록 · 상세) · 보내기 실패(?send=failed) — redirect 오류 그대로
  for (const path of ["/contracts", "/contracts/7", "/contracts/7?send=failed"]) {
    const error = redirected(path);
    await assert.rejects(callSave(() => Promise.reject(error), unstable_rethrow), (e) => e === error);
  }
  // 호출 자체가 끊김
  assert.equal(await callSave(() => Promise.reject(new TypeError("fetch failed")), unstable_rethrow), SAVE_CALL_LOST);
  // 돌아온 결과(실패 문장)는 그대로
  assert.deepEqual(await callSave(() => Promise.resolve({ error: "x" }), unstable_rethrow), { error: "x" });
});

test("서명 대기 재발송 확인창 — 데모 문구, 이름을 모르면 그 조각만 뺀다(WHALEERP-611)", () => {
  assert.deepEqual(signingResendCopy("권도윤"), {
    title: "계약서를 다시 보내시겠습니까?",
    body: "같은 조건의 계약서를 권도윤 님에게 다시 보냅니다. 날인 기한은 발송일로부터 30일입니다.",
  });
  assert.equal(signingResendCopy(null).body, "같은 조건의 계약서를 다시 보냅니다. 날인 기한은 발송일로부터 30일입니다.");
  assert.equal(signingResendCopy("").body, "같은 조건의 계약서를 다시 보냅니다. 날인 기한은 발송일로부터 30일입니다.");
});

test("근로계약 상세 재발송 확인창 — 서명 대기는 데모 문구, 발송 대기는 가입 초대 문구", () => {
  assert.deepEqual(resendDialogCopy("PENDING_SIGNATURE", "권도윤"), {
    title: "계약서를 다시 보내시겠습니까?",
    body: ["같은 조건의 계약서를 권도윤 님에게 다시 보냅니다. 날인 기한은 발송일로부터 30일입니다."],
  });
  const invite = resendDialogCopy("PENDING_SEND", "남도현");
  assert.equal(invite.title, "다시 보내시겠습니까?");
  assert.equal(invite.body.length, 2);
  // 보낼 때 api 가 다시 판별한다 — 가입 초대 · 소속 추가 확인 요청을 함께 알린다(WHALEERP-130)
  assert.match(invite.body.join(" "), /가입 초대 알림톡\(초대 코드\)/);
  assert.match(invite.body.join(" "), /소속 추가 확인 요청/);
  assert.match(invite.body[0], /^남도현 님의 /);
  // 직원 목록 재발송도 같은 문구다
  assert.deepEqual(inviteResendCopy("남도현"), invite);
  // 요청 유효 기간 · 발송 대기로 남는 것 · 날인 기한(용어 통일)
  assert.match(invite.body[1], /30일 동안 유효/);
  assert.match(invite.body[1], /발송 대기로 남습니다/);
  assert.doesNotMatch(invite.body.join(" "), /서명 기한/);
  assert.match(inviteResendCopy(null).body[0], /^직원 휴대전화번호로/);
});

test("발송 대기 종료도 같은 규칙 — 모를 때 문장만 종료 문장이다", () => {
  assert.deepEqual(sendFailureOf(null, undefined, "", END_UNKNOWN), { ok: false, error: END_UNKNOWN, recheck: true });
  assert.deepEqual(sendFailureOf(504, undefined, "Gateway Timeout", END_UNKNOWN), { ok: false, error: END_UNKNOWN, recheck: true });
  assert.deepEqual(sendFailureOf(409, "CONTRACT_STATUS_CONFLICT", "지금 상태에서는 할 수 없습니다", END_UNKNOWN), {
    ok: false,
    error: "지금 상태에서는 할 수 없습니다",
    code: "CONTRACT_STATUS_CONFLICT",
    recheck: true,
  });
});
