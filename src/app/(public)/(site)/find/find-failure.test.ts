// node --test "src/app/(public)/(site)/find/find-failure.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONNECT_FAILED,
  failureOf,
  INVALID_INPUT,
  maskedLoginIdOf,
  temporaryPasswordOutcome,
  TEMPORARY_PASSWORD_UNKNOWN,
  THROTTLED,
} from "./find-failure.ts";

const api = (status: number, message: string) => Object.assign(new Error(message), { status });
const named = (name: string) => Object.assign(new Error(name), { name });

test("예상한 거절만 api 문구 그대로 — 일치 없음 404 · 1시간 5회 429", () => {
  assert.deepEqual(failureOf(api(404, "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.")), {
    message: "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.",
    log: false,
  });
  assert.deepEqual(failureOf(api(429, "임시 비밀번호는 1시간에 5번까지 받을 수 있습니다")), {
    message: "임시 비밀번호는 1시간에 5번까지 받을 수 있습니다",
    log: false,
  });
});

test("스로틀러 429 는 한글로 바꾼다", () => {
  assert.deepEqual(failureOf(api(429, "ThrottlerException: Too Many Requests")), { message: THROTTLED, log: false });
});

test("라우트가 없는 404 는 일치 없음이 아니라 연결 실패다 — api 가 아직 배포되지 않았다", () => {
  assert.deepEqual(failureOf(api(404, "Cannot POST /auth/admin/login-id-find-attempts")), { message: CONNECT_FAILED, log: true });
});

test("400 은 영어 검증 문구 대신 이메일 형식 안내", () => {
  assert.deepEqual(failureOf(api(400, "email must be an email")), { message: INVALID_INPUT, log: false });
});

test("그 밖의 4xx · 5xx · 연결 실패는 연결 문구로 바꾸고 로그를 남긴다", () => {
  for (const e of [api(401, "Unauthorized"), api(403, "Forbidden"), api(500, "Internal server error"), new TypeError("fetch failed"), null])
    assert.deepEqual(failureOf(e), { message: CONNECT_FAILED, log: true }, String(e));
});

test("임시 비밀번호: 시간 초과는 보냈다는 안내 — front 만 끊었고 api 는 대개 발급까지 마친다", () => {
  for (const name of ["TimeoutError", "AbortError"]) assert.deepEqual(temporaryPasswordOutcome(named(name)), { sent: true }, name);
});

test("임시 비밀번호: 5xx(502 · 504 포함)는 결과 모름 — 연결 실패로 다시 받게 하면 유효한 것을 만료시킨다", () => {
  for (const status of [500, 502, 504])
    assert.deepEqual(temporaryPasswordOutcome(api(status, "Bad Gateway")), { message: TEMPORARY_PASSWORD_UNKNOWN, log: true }, String(status));
});

test("임시 비밀번호: 4xx · 연결 실패는 두 탭 공통 판정을 따른다", () => {
  assert.deepEqual(temporaryPasswordOutcome(api(429, "임시 비밀번호는 1시간에 5번까지 받을 수 있습니다")), {
    message: "임시 비밀번호는 1시간에 5번까지 받을 수 있습니다",
    log: false,
  });
  assert.deepEqual(temporaryPasswordOutcome(api(400, "email must be an email")), { message: INVALID_INPUT, log: false });
  assert.deepEqual(temporaryPasswordOutcome(new TypeError("fetch failed")), { message: CONNECT_FAILED, log: true });
});

test("가린 아이디는 비지 않은 문자열일 때만", () => {
  assert.equal(maskedLoginIdOf({ maskedLoginId: "wh*******n" }), "wh*******n");
  for (const body of [{}, { maskedLoginId: "" }, { maskedLoginId: 1 }, null, undefined])
    assert.equal(maskedLoginIdOf(body), null, JSON.stringify(body));
});
