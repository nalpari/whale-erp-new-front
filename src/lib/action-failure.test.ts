// node --test src/lib/action-failure.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "./api-error.ts";
import { failureOf, SESSION_EXPIRED } from "./action-failure.ts";

test("4xx 는 api 문구와 상태 · 문장 목록 · 업무 code 를 그대로 싣는다", () => {
  const e = new ApiError(409, "이미 있습니다", ["이미 있습니다"], { code: "DUP" });
  assert.deepEqual(failureOf(e, "저장"), { ok: false, status: 409, message: "이미 있습니다", messages: ["이미 있습니다"], code: "DUP" });
  const v = new ApiError(400, "a, b", ["a", "b"], { message: ["a", "b"] });
  const r = failureOf(v, "저장");
  assert.equal(r.status, 400);
  assert.deepEqual(r.messages, ["a", "b"]);
  assert.equal("code" in r, false);
});

test("401 은 고정 문구다", () => {
  const r = failureOf(new ApiError(401, "Unauthorized"), "저장");
  assert.equal(r.status, 401);
  assert.equal(r.message, SESSION_EXPIRED);
});

test("5xx · 연결 실패 · ApiError 가 아닌 오류는 로그를 남기고 일반 문구이며 status 가 없다", () => {
  const original = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => void logged.push(args);
  try {
    for (const e of [new ApiError(500, "boom"), new ApiError(502, "x"), new TypeError("fetch failed")]) {
      const r = failureOf(e, "삭제", { feature: "근로계약", contractId: 3 });
      assert.equal(r.ok, false);
      assert.equal(r.status, undefined);
      assert.match(r.message, /^삭제 결과를 확인하지 못했습니다\. 목록이나 상세에서 다시 확인해 주세요\.$/);
    }
  } finally {
    console.error = original;
  }
  assert.equal(logged.length, 3);
  assert.equal(logged[0][0], "근로계약 삭제 결과 모름");
  assert.deepEqual(logged[0][1], { contractId: 3 });
});

test("definite 는 ApiError 5xx 만 확정 실패 문구로 바꾸고 로그는 남긴다", () => {
  const original = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => void logged.push(args);
  try {
    const r = failureOf(new ApiError(500, "boom"), "저장", { feature: "근로계약" }, { definite: true });
    assert.deepEqual(r, { ok: false, message: "저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", messages: ["저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요."] });
    // 연결 실패는 definite 여도 결과 모름이다
    assert.match(failureOf(new TypeError("fetch failed"), "저장", {}, { definite: true }).message, /결과를 확인하지 못했습니다/);
    // 4xx · 401 은 그대로다
    assert.equal(failureOf(new ApiError(409, "중복"), "저장", {}, { definite: true }).message, "중복");
  } finally {
    console.error = original;
  }
  assert.equal(logged.length, 2);
  assert.equal(logged[0][0], "근로계약 저장 실패");
});
