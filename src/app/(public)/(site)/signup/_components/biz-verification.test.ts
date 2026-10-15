// node --test "src/app/(public)/(site)/signup/_components/biz-verification.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { BUSY_MESSAGE } from "./api-failure.ts";
import {
  BIZ_VERIFICATION_TTL_MS,
  BIZ_VERIFY_FAILED_MESSAGE,
  bizVerificationFailure,
  isBizVerificationExpired,
} from "./biz-verification.ts";

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

test("인증 10분 — 9분 59.999초는 유효, 10분이면 만료", () => {
  assert.equal(BIZ_VERIFICATION_TTL_MS, 10 * 60_000);
  assert.equal(isBizVerificationExpired(0, 9 * 60_000 + 59_999), false);
  assert.equal(isBizVerificationExpired(0, 10 * 60_000), true);
});
