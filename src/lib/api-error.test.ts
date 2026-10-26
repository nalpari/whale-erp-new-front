import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, codeOf, deniedMessageOf } from "./api-error.ts";

test("deniedMessageOf: api 거절(400 · 403 · 404 문장 하나)은 그 문장", () => {
  assert.equal(deniedMessageOf(new ApiError(400, "점포를 볼 BP 를 골라 주세요")), "점포를 볼 BP 를 골라 주세요");
  // 본문의 message 가 문자열이면 검증 실패가 아니다
  assert.equal(deniedMessageOf(new ApiError(400, "BP 를 골라 주세요", undefined, { message: "BP 를 골라 주세요" })), "BP 를 골라 주세요");
  assert.equal(deniedMessageOf(new ApiError(403, "다른 BP 의 정보는 다룰 수 없습니다.")), "다른 BP 의 정보는 다룰 수 없습니다.");
  assert.equal(deniedMessageOf(new ApiError(404, "BP 를 찾을 수 없습니다")), "BP 를 찾을 수 없습니다");
});

test("deniedMessageOf: 결함 · 장애는 null(오류 화면으로 던진다)", () => {
  // 검증 실패 400 — 주소 · 계약이 어긋났다
  assert.equal(deniedMessageOf(new ApiError(400, "a", ["a", "b"], { message: ["a", "b"] })), null);
  // 라우트가 없는 404 — api 배포가 어긋났다
  assert.equal(deniedMessageOf(new ApiError(404, "Cannot GET /stores")), null);
  for (const status of [401, 409, 429, 500, 503]) assert.equal(deniedMessageOf(new ApiError(status, "x")), null, String(status));
});

test("deniedMessageOf: ApiError 가 아니면 null", () => {
  assert.equal(deniedMessageOf(new Error("x")), null);
  assert.equal(deniedMessageOf("문자열"), null);
  assert.equal(deniedMessageOf(null), null);
});

test("codeOf: 객체 본문의 문자열 code 만 꺼낸다", () => {
  assert.equal(codeOf({ code: "X" }), "X");
  for (const body of [{ code: 1 }, {}, null, undefined, "BIRTH_DATE_RETIRED", ["BIRTH_DATE_RETIRED"], [{ code: "X" }]]) assert.equal(codeOf(body), undefined);
});
