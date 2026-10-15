// node --test "src/app/(public)/(site)/signup/signup-done-cookie.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicPath } from "../../../../lib/auth-routes.ts";
import { parseSignupDone, SIGNUP_DONE_PATH } from "./signup-done-cookie.ts";

test("완료 화면 경로는 로그인 없이 열린다 — 세션 없이 들어오는 화면이라 막히면 가입한 사람이 아이디를 못 본다", () => {
  assert.equal(SIGNUP_DONE_PATH, "/signup/done");
  assert.equal(isPublicPath(SIGNUP_DONE_PATH), true);
});

test("쿠키 값을 그대로 되돌린다 — 한글 상호명 포함", () => {
  const value = { tradeName: "㈜한강상회", loginId: "hangang01", email: "hayoon@hangang.co.kr" };
  assert.deepEqual(parseSignupDone(JSON.stringify(value)), value);
});

test("없거나 JSON 이 아니면 없는 것으로 본다", () => {
  for (const raw of [undefined, "", "not-json"]) assert.equal(parseSignupDone(raw), null, String(raw));
});

test("모양이 틀리면 없는 것으로 본다 — 객체가 화면에 그대로 그려져 완료 화면이 500 이 되지 않게", () => {
  for (const raw of ["null", "123", "[]", '"abc"', '{"tradeName":{},"loginId":"a","email":"b"}', '{"tradeName":"a","loginId":1,"email":"b"}', '{"tradeName":"a","loginId":"b"}'])
    assert.equal(parseSignupDone(raw), null, raw);
});
