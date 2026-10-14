import assert from "node:assert/strict";
import { test } from "node:test";
import { loginKeyCookie, parseSession, sessionCookie, type Session } from "./session.ts";

const session: Session = {
  accessToken: "a",
  refreshToken: "r",
  accessTokenExpiresAt: 1_000,
  roleTypeCode: "BM",
};

test("parseSession: 유효한 JSON 은 Session", () => {
  assert.deepEqual(parseSession(JSON.stringify(session)), session);
});

test("parseSession: 없거나 깨졌거나 토큰이 없으면 null", () => {
  assert.equal(parseSession(undefined), null);
  assert.equal(parseSession("garbage"), null);
  assert.equal(parseSession(JSON.stringify({ ...session, accessToken: undefined })), null);
});

test("parseSession: 만료 시각이 없거나 숫자가 아니면 null", () => {
  assert.equal(parseSession(JSON.stringify({ ...session, accessTokenExpiresAt: undefined })), null);
  assert.equal(parseSession(JSON.stringify({ ...session, accessTokenExpiresAt: "1000" })), null);
});

test("sessionCookie: 속성과 왕복", () => {
  const c = sessionCookie(session);
  assert.equal(c.name, "session");
  assert.equal(c.httpOnly, true);
  assert.equal(c.path, "/");
  assert.equal(c.sameSite, "lax");
  assert.equal("maxAge" in c, false); // 브라우저를 닫으면 끝나는 세션 쿠키
  assert.deepEqual(parseSession(c.value), session);
});

test("login-key 쿠키는 화면 스크립트가 읽어야 해서 httpOnly 가 아니다", () => {
  const c = loginKeyCookie("k");
  assert.equal("httpOnly" in c && c.httpOnly, false);
  assert.equal(c.path, "/");
});
