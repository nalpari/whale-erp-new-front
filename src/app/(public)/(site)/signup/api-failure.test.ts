// node --test "src/app/(public)/(site)/signup/api-failure.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { apiFailure, BUSY_MESSAGE } from "./api-failure.ts";

const FALLBACK = "중복 확인을 하지 못했습니다. 잠시 후 다시 시도해 주세요.";

test("400 · 409 는 예상한 거절이라 api 문구를 그대로 보이고 로그를 남기지 않는다", () => {
  assert.deepEqual(apiFailure(400, "영문 또는 영문·숫자 조합으로 4~20자로 입력해 주세요.", FALLBACK), {
    message: "영문 또는 영문·숫자 조합으로 4~20자로 입력해 주세요.",
    log: false,
    conflict: false,
  });
  assert.deepEqual(apiFailure(409, "사용할 수 없는 아이디입니다.", FALLBACK), {
    message: "사용할 수 없는 아이디입니다.",
    log: false,
    conflict: true,
  });
});

test("429 는 정해진 문구로 안내하고 로그를 남긴다 — 한도에 닿은 줄 서버 쪽에서 알 수 있게", () => {
  assert.deepEqual(apiFailure(429, "ThrottlerException: Too Many Requests", FALLBACK), { message: BUSY_MESSAGE, log: true, conflict: false });
});

test("그 밖의 실패(404 · 401 · 500 …)는 원문 대신 일반 문구를 보이고 로그를 남긴다", () => {
  for (const status of [401, 403, 404, 413, 500, 503])
    assert.deepEqual(apiFailure(status, "Cannot POST /auth/signup/login-id-availability", FALLBACK), { message: FALLBACK, log: true, conflict: false }, String(status));
});
