// node --test "src/app/(public)/(site)/signup/_components/biz-verification.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { BUSY_MESSAGE } from "./api-failure.ts";
import {
  BIZ_VERIFICATION_TTL_MS,
  BIZ_VERIFY_FAILED_MESSAGE,
  bizVerificationFailure,
  hasApiMessage,
  isBizSignupRejection,
  isBizVerificationExpired,
  signupFailure,
  verificationTokenOf,
} from "./biz-verification.ts";

const TOKEN_REJECTED = "사업자정보 인증이 만료되었습니다. 다시 인증해 주세요.";
const NUMBER_TAKEN = "이미 등록된 사업자등록번호입니다.";
const LOGIN_ID_TAKEN = "사용할 수 없는 아이디입니다."; // api admin-signup 의 실제 문구

test("진위확인 실패 — 400 · 409 · 422 는 api 문구 그대로, 로그 없음", () => {
  for (const status of [400, 409, 422]) {
    assert.deepEqual(bizVerificationFailure(status, "api 문구"), { message: "api 문구", log: false }, String(status));
  }
});

test("진위확인 실패 — 503 은 api 문구를 보이고 로그를 남긴다", () => {
  const message = "국세청 확인이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.";
  assert.deepEqual(bizVerificationFailure(503, message), { message, log: true });
});

test("진위확인 실패 — 429 는 한도 문구, 로그", () => {
  assert.deepEqual(bizVerificationFailure(429, "Too Many Requests"), { message: BUSY_MESSAGE, log: true });
});

test("진위확인 실패 — 그 밖(404 · 500)은 원문을 숨기고 정해진 문구, 로그", () => {
  for (const status of [404, 500]) {
    assert.deepEqual(
      bizVerificationFailure(status, "Internal server error"),
      { message: BIZ_VERIFY_FAILED_MESSAGE, log: true },
      String(status),
    );
  }
});

test("가입 거절 — 토큰 400 · 사업자번호 409 문구만 사업자정보 거절로 본다", () => {
  assert.equal(isBizSignupRejection(400, TOKEN_REJECTED), true);
  assert.equal(isBizSignupRejection(409, NUMBER_TAKEN), true);
  // 아이디·이메일 중복 409, 칸 검증 400, 상태가 엇갈린 경우는 아니다.
  assert.equal(isBizSignupRejection(409, LOGIN_ID_TAKEN), false);
  assert.equal(isBizSignupRejection(400, "이메일 형식이 올바르지 않습니다."), false);
  assert.equal(isBizSignupRejection(409, TOKEN_REJECTED), false);
});

test("가입 실패 — 토큰을 실은 사업자 거절은 bizRejected 이고 아이디·이메일 충돌로 보지 않는다", () => {
  assert.deepEqual(signupFailure(409, NUMBER_TAKEN, true, "fb"), { message: NUMBER_TAKEN, log: true, conflict: false, bizRejected: true });
  assert.deepEqual(signupFailure(400, TOKEN_REJECTED, true, "fb"), { message: TOKEN_REJECTED, log: true, conflict: false, bizRejected: true });
});

test("가입 실패 — 토큰이 없으면 같은 문구여도 기존 경로", () => {
  assert.deepEqual(signupFailure(409, NUMBER_TAKEN, false, "fb"), { message: NUMBER_TAKEN, log: false, conflict: true, bizRejected: false });
});

test("가입 실패 — 토큰을 실었어도 아이디 중복 409 는 conflict, 알아보지 못한 400 · 409 라 로그를 남긴다", () => {
  assert.deepEqual(signupFailure(409, LOGIN_ID_TAKEN, true, "fb"), { message: LOGIN_ID_TAKEN, log: true, conflict: true, bizRejected: false });
  assert.deepEqual(signupFailure(409, LOGIN_ID_TAKEN, false, "fb"), { message: LOGIN_ID_TAKEN, log: false, conflict: true, bizRejected: false });
});

test("가입 실패 — 그 밖은 apiFailure 와 같다", () => {
  assert.deepEqual(signupFailure(500, "Internal server error", true, "fb"), { message: "fb", log: true, conflict: false, bizRejected: false });
});

test("진위확인 응답 — 비었거나 문자열이 아닌 토큰은 null", () => {
  for (const response of [undefined, null, {}, { verificationToken: "" }, { verificationToken: 123 }]) {
    assert.equal(verificationTokenOf(response), null, JSON.stringify(response));
  }
  assert.equal(verificationTokenOf({ verificationToken: "jwt" }), "jwt");
});

test("api 문구 유무 — Nest 본문의 문자열 · 배열만 api 문구로 본다", () => {
  assert.equal(hasApiMessage({ message: "api 문구" }), true);
  assert.equal(hasApiMessage({ message: ["칸 문구"] }), true);
  for (const body of [null, {}, { message: "" }, { message: " " }, { message: [] }, "<html>"]) {
    assert.equal(hasApiMessage(body), false, JSON.stringify(body));
  }
});

test("진위확인 실패 — api 문구가 없으면 상태와 상관없이 정해진 문구, 로그", () => {
  for (const status of [400, 422, 503]) {
    assert.deepEqual(
      bizVerificationFailure(status, `요청이 실패했습니다 (HTTP ${status})`, false),
      { message: BIZ_VERIFY_FAILED_MESSAGE, log: true },
      String(status),
    );
  }
});

test("인증 10분 — 9분 59.999초는 유효, 10분이면 만료", () => {
  assert.equal(BIZ_VERIFICATION_TTL_MS, 10 * 60_000);
  assert.equal(isBizVerificationExpired(0, 9 * 60_000 + 59_999), false);
  assert.equal(isBizVerificationExpired(0, 10 * 60_000), true);
});
