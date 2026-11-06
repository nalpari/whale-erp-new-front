// node --test "src/app/contracts/[contractId]/send-model.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { redirect, unstable_rethrow } from "next/navigation.js";
import { ApiError } from "../../../lib/api-error.ts";
import { callSave, deleteFailureOf, END_UNKNOWN, saveFailureOf, SAVE_CALL_LOST, saveOutcomeUnknown, SEND_UNKNOWN, sendFailedTarget, resendDialogCopy, inviteResendCopy, sendFailureOf, sendNoticeOf, signingResendCopy, canShowResend, sendBodyOf } from "./send-model.ts";

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

test("근로계약 상세 재발송 확인창 — 가입한 직원은 데모 문구, 가입 전 직원은 상태와 상관없이 가입 초대 문구(front #136 code-review)", () => {
  assert.deepEqual(resendDialogCopy("PENDING_SIGNATURE", "권도윤", true), {
    title: "계약서를 다시 보내시겠습니까?",
    body: ["같은 조건의 계약서를 권도윤 님에게 다시 보냅니다. 날인 기한은 발송일로부터 30일입니다."],
  });
  // 가입 전 직원은 발송 대기 · 서명 대기 모두 보낼 때 api 가 다시 판별한다 — 가입 초대 · 소속 추가 확인 요청을 함께 알린다(WHALEERP-130)
  for (const status of ["PENDING_SEND", "PENDING_SIGNATURE"]) {
    const invite = resendDialogCopy(status, "남도현", false);
    // 제목은 가입한 직원과 같다 — 같은 화면에서 무엇을 다시 보내는지가 같게
    assert.equal(invite.title, "계약서를 다시 보내시겠습니까?");
    assert.doesNotMatch(invite.body.join(" "), /앱 알림/);
    assert.equal(invite.body.length, 2);
    assert.match(invite.body.join(" "), /가입 초대 알림톡\(초대 코드\)/);
    assert.match(invite.body.join(" "), /소속 추가 확인 요청/);
    assert.match(invite.body[0], /^남도현 님의 /);
    // 직원 목록 재발송도 같은 문구다
    assert.deepEqual(invite, { title: inviteResendCopy("남도현").title, body: inviteResendCopy("남도현").body });
  }
  // 요청 유효 기간 · 발송 대기로 남는 것 · 날인 기한(용어 통일)
  const invite = inviteResendCopy("남도현");
  assert.match(invite.body[1], /30일 동안 유효/);
  assert.match(invite.body[1], /발송 대기로 남습니다/);
  assert.doesNotMatch(invite.body.join(" "), /서명 기한/);
  assert.match(inviteResendCopy(null).body[0], /^직원 휴대전화번호로/);
  assert.equal(resendDialogCopy("PENDING_SEND", "남도현", true).title, "계약서를 다시 보내시겠습니까?");
});

test("재발송 버튼 — 발송 대기 · 서명 대기 · 거부 · 만료 모두 api 가 된다고 할 때만(WHALEERP-153, front #146 재리뷰)", () => {
  // api 가 된다고 할 때만 — 칸이 없으면(옛 응답) 세우지 않는다
  assert.equal(canShowResend("PENDING_SEND", undefined), false);
  assert.equal(canShowResend("PENDING_SEND", true), true);
  assert.equal(canShowResend("PENDING_SIGNATURE", true), true);
  assert.equal(canShowResend("PENDING_SIGNATURE", false), false);
  assert.equal(canShowResend("REJECTED", undefined), false);
  assert.equal(canShowResend("EXPIRED", true), true);
  assert.equal(canShowResend("REJECTED", false), false);
  assert.equal(canShowResend("SIGNED", true), false);
  assert.equal(canShowResend(null, true), false);
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

test("거부 · 만료 재발송 확인창 — 같은 조건으로 다시 보낸다는 문장을 더한다(WHALEERP-153)", () => {
  // 가입한 직원 — 앱으로(서명 대기 문구)
  const rejected = resendDialogCopy("REJECTED", "남도현", true);
  assert.equal(rejected.title, "계약서를 다시 보내시겠습니까?");
  assert.deepEqual(rejected.body, [
    "거부된 근로계약서를 같은 조건으로 다시 보냅니다.",
    "같은 조건의 계약서를 남도현 님에게 다시 보냅니다. 날인 기한은 발송일로부터 30일입니다.",
  ]);
  // 가입 전 직원 — 가입 초대 알림톡(발송 대기 문구)
  const expired = resendDialogCopy("EXPIRED", null, false);
  assert.equal(expired.body[0], "날인 기한이 지나 만료된 근로계약서를 같은 조건으로 다시 보냅니다.");
  assert.match(expired.body[1], /가입 초대 알림톡/);
});

test("거부 · 만료 재발송이 막히면(REOPEN_BLOCKED · WORK_TIME_OVERLAP) api 문장을 확인창에 보이고 보내기만 막는다 — 다시 읽지 않는다(front #136 재리뷰)", () => {
  for (const code of ["REOPEN_BLOCKED", "WORK_TIME_OVERLAP"]) {
    assert.deepEqual(sendFailureOf(409, code, "퇴직했거나 퇴직일을 정한 직원에게는 근로계약서를 다시 보낼 수 없습니다"), {
      ok: false,
      error: "퇴직했거나 퇴직일을 정한 직원에게는 근로계약서를 다시 보낼 수 없습니다",
      code,
      recheck: false,
      blocked: true,
    });
  }
  // 그 밖의 409 코드는 막지 않는다
  assert.equal(sendFailureOf(409, "SEND_CHANNEL_NOT_READY", "x").blocked, undefined);
});

test("재발송 본문은 화면이 본 상태를 싣는다 — 모르면 비운다(front #136 재리뷰)", () => {
  assert.deepEqual(sendBodyOf({ status: "REJECTED" }), { expectedStatus: "REJECTED" });
  // 발송 시각도 싣는다 — 상태가 그대로인 재발송을 두 탭에서 두 번 보내지 않게(front #136 셀프 code-review)
  assert.deepEqual(sendBodyOf({ status: "PENDING_SEND", sentAt: "2026-10-10T01:00:00.000Z" }), {
    expectedStatus: "PENDING_SEND",
    expectedSentAt: "2026-10-10T01:00:00.000Z",
  });
  assert.deepEqual(sendBodyOf({ status: null, sentAt: null }), {});
  // 서버 액션을 직접 불러 모양이 다른 값을 넘겨도 터지지 않고 싣지 않는다
  assert.deepEqual(sendBodyOf(null), {});
  assert.deepEqual(sendBodyOf({ status: 7, sentAt: {} } as unknown as Parameters<typeof sendBodyOf>[0]), {});
});

// 로그는 failureOf 가 남긴다 — 테스트 출력을 어지럽히지 않게 막고 센다
function quiet<T>(fn: () => T): T {
  const original = console.error;
  console.error = () => {};
  try {
    return fn();
  } finally {
    console.error = original;
  }
}
const log = { feature: "근로계약", contractId: 1 };

test("saveFailureOf — 401 은 로그인 필요", () => {
  assert.deepEqual(saveFailureOf(new ApiError(401, "Unauthorized"), log), { kind: "login" });
});

test("saveFailureOf — 저장은 됐고 보내기만 실패(502 + 코드 + 계약 ID)는 그 상세로", () => {
  const e = new ApiError(502, "알림톡 실패", ["알림톡 실패"], { code: "SEND_FAILED", contractId: 7 });
  assert.deepEqual(saveFailureOf(e, log), { kind: "sendFailed", target: "/contracts/7?send=failed" });
});

test("saveFailureOf — 코드 없는 502 · 504 · 500 과 코드 있는 5xx 는 모두 결과 모름(커밋 뒤 발송 단계 실패일 수 있다)", () => {
  for (const e of [
    new ApiError(504, "Gateway Timeout"),
    new ApiError(502, "Bad Gateway"),
    new ApiError(500, "boom"),
    new ApiError(502, "x", ["x"], { code: "OTHER" }),
    // 상세로 보낼 계약 ID 가 없으면 보내기 실패도 결과 모름이다
    new ApiError(502, "x", ["x"], { code: "SEND_FAILED" }),
    new ApiError(502, "x", ["x"], { code: "SEND_UNCONFIRMED", contractId: "7" }),
  ])
    assert.deepEqual(quiet(() => saveFailureOf(e, log)), { kind: "unknown" });
});

test("saveFailureOf — api 의 503(Nest 본문, 설정 · 템플릿 문제 — 저장 전 실패)은 api 문장 그대로 보이고 잠그지 않는다", () => {
  const message = "가입 초대 알림톡 템플릿이 없거나 꺼져 있어 보낼 수 없습니다";
  const body = { statusCode: 503, message, error: "Service Unavailable" };
  assert.deepEqual(quiet(() => saveFailureOf(new ApiError(503, message, [message], body), log)), { kind: "error", error: message });
});

test("saveFailureOf — 본문 없는 503 · HTML 503 · 문구가 빈 503(프록시 · 로드밸런서)은 결과 모름", () => {
  for (const e of [
    new ApiError(503, "요청이 실패했습니다 (HTTP 503)"),
    new ApiError(503, "요청이 실패했습니다 (HTTP 503)", undefined, null),
    new ApiError(503, "x", ["x"], { statusCode: 503, message: "" }),
    new ApiError(503, "x", ["x"], { message: "Service Unavailable" }),
  ])
    assert.deepEqual(quiet(() => saveFailureOf(e, log)), { kind: "unknown" });
});

test("saveFailureOf — 409 + 진행 중 계약이면 api 문구와 목록, 400 은 api 문구", () => {
  const body = { code: "CONTRACT_IN_PROGRESS", contracts: [{ contractId: 5, status: "SIGNED", name: "남도현" }] };
  const r = saveFailureOf(new ApiError(409, "진행 중인 계약이 있습니다", ["진행 중인 계약이 있습니다"], body), log);
  assert.equal(r.kind, "error");
  assert.equal(r.kind === "error" && r.error, "진행 중인 계약이 있습니다");
  assert.equal(r.kind === "error" && r.inProgress?.[0].contractId, 5);
  assert.deepEqual(saveFailureOf(new ApiError(400, "만 19세 미만입니다"), log), { kind: "error", error: "만 19세 미만입니다" });
});

test("deleteFailureOf — 401 · 결과 모름 · 확정 실패 · 4xx", () => {
  assert.equal(deleteFailureOf(new ApiError(401, "x"), log), "로그인이 필요합니다.");
  assert.match(quiet(() => deleteFailureOf(new ApiError(504, "x"), log)), /^삭제 결과를 확인하지 못했습니다\. 목록이나 상세에서 다시 확인해 주세요\.$/);
  assert.equal(quiet(() => deleteFailureOf(new ApiError(500, "x"), log)), "삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  assert.equal(deleteFailureOf(new ApiError(409, "임시저장이 아닙니다"), log), "임시저장이 아닙니다");
});
