// node --test "src/app/(public)/(site)/find/find-failure.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONNECT_FAILED,
  failureOf,
  INVALID_INPUT,
  LOGIN_ID_NOT_FOUND,
  maskedLoginIdOf,
  temporaryPasswordOutcome,
  TEMPORARY_PASSWORD_NOT_FOUND,
  TEMPORARY_PASSWORD_SEND_FAILED,
  TEMPORARY_PASSWORD_UNKNOWN,
  THROTTLED,
} from "./find-failure.ts";

// api(Nest) 가 준 오류 — ApiError 처럼 본문 { statusCode, message, … } 를 싣는다. gateway 는 본문 없는 앞단(HTML) 오류다.
const api = (status: number, message: string, extra: Record<string, unknown> = {}) =>
  Object.assign(new Error(message), { status, body: { statusCode: status, message, ...extra } });
const gateway = (status: number) => Object.assign(new Error(`요청이 실패했습니다 (HTTP ${status})`), { status, body: null });
const named = (name: string) => Object.assign(new Error(name), { name });

test("예상한 거절 — 일치 없음 404 는 화면 문구, 1시간 5회 429 는 api 문구 그대로", () => {
  assert.deepEqual(failureOf(api(404, "입력하신 정보와 일치하는 계정을 찾을 수 없습니다."), LOGIN_ID_NOT_FOUND), { message: LOGIN_ID_NOT_FOUND, log: false });
  assert.deepEqual(failureOf(api(429, "임시 비밀번호는 1시간에 5번까지 받을 수 있습니다"), LOGIN_ID_NOT_FOUND), {
    message: "임시 비밀번호는 1시간에 5번까지 받을 수 있습니다",
    log: false,
  });
});

test("스로틀러 429 는 한글로 바꾼다", () => {
  assert.deepEqual(failureOf(api(429, "ThrottlerException: Too Many Requests"), LOGIN_ID_NOT_FOUND), { message: THROTTLED, log: false });
});

test("라우트가 없는 404 는 일치 없음이 아니라 연결 실패다 — api 가 아직 배포되지 않았다", () => {
  assert.deepEqual(failureOf(api(404, "Cannot POST /auth/admin/login-id-find-attempts"), LOGIN_ID_NOT_FOUND), { message: CONNECT_FAILED, log: true });
});

test("400 은 영어 검증 문구 대신 이메일 형식 안내", () => {
  assert.deepEqual(failureOf(api(400, "email must be an email"), LOGIN_ID_NOT_FOUND), { message: INVALID_INPUT, log: false });
});

test("그 밖의 4xx · 5xx · 연결 실패는 연결 문구로 바꾸고 로그를 남긴다", () => {
  for (const e of [api(401, "Unauthorized"), api(403, "Forbidden"), api(500, "Internal server error"), new TypeError("fetch failed"), null])
    assert.deepEqual(failureOf(e, LOGIN_ID_NOT_FOUND), { message: CONNECT_FAILED, log: true }, String(e));
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

test("임시 비밀번호: 일치 없음(404)은 이름 · 아이디 · 이메일 안내 — 라우트가 없는 404 는 연결 실패", () => {
  assert.deepEqual(temporaryPasswordOutcome(api(404, "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.")), { message: TEMPORARY_PASSWORD_NOT_FOUND, log: false });
  assert.deepEqual(temporaryPasswordOutcome(api(404, "Cannot POST /auth/admin/temporary-passwords")), { message: CONNECT_FAILED, log: true });
});

test("api 밖(게이트웨이 · 잘못된 주소)의 404 는 일치 없음이 아니라 연결 실패다 — 입력만 고치게 하지 않고 로그를 남긴다", () => {
  assert.deepEqual(failureOf(gateway(404), LOGIN_ID_NOT_FOUND), { message: CONNECT_FAILED, log: true });
  assert.deepEqual(temporaryPasswordOutcome(gateway(404)), { message: CONNECT_FAILED, log: true });
});

test("임시 비밀번호: 메일 발송 오류(503 + code)는 메일이 오지 않으면 다시 받게 안내 — 코드 없는 503 은 결과 모름", () => {
  assert.deepEqual(temporaryPasswordOutcome(api(503, "임시 비밀번호를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.", { code: "TEMPORARY_PASSWORD_SEND_FAILED" })), {
    message: TEMPORARY_PASSWORD_SEND_FAILED,
    log: true,
  });
  assert.deepEqual(temporaryPasswordOutcome(api(503, "Service Unavailable")), { message: TEMPORARY_PASSWORD_UNKNOWN, log: true });
  assert.deepEqual(temporaryPasswordOutcome(gateway(503)), { message: TEMPORARY_PASSWORD_UNKNOWN, log: true });
});
