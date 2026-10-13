import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSession, sessionCookie, type Session } from "./session.ts";

const session: Session = {
  accessToken: "a",
  refreshToken: "r",
  accessTokenExpiresAt: 1_000,
  loginId: "admin1",
  name: "홍길동",
  roleTypeCode: "BM",
  bpCode: "BP000001",
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
