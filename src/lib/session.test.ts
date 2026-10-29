import assert from "node:assert/strict";
import { test } from "node:test";
import { deviceCookie, deviceIdOf, loginKeyCookie, parseSession, sessionCookie, type Session } from "./session.ts";

const session: Session = {
  accessToken: "a",
  refreshToken: "r",
  accessTokenExpiresAt: 1_000,
  roleTypeCode: "BM",
};

test("parseSession: 유효한 JSON 은 Session", () => {
  assert.deepEqual(parseSession(JSON.stringify(session)), session);
});

test("parseSession: 소속 BP 는 양의 정수만 남기고, 없거나 틀려도 세션은 살린다(옛 세션)", () => {
  assert.deepEqual(parseSession(JSON.stringify({ ...session, bpCodeId: 8 })), { ...session, bpCodeId: 8 });
  assert.deepEqual(parseSession(JSON.stringify({ ...session, bpCodeId: "8" })), session);
  assert.deepEqual(parseSession(JSON.stringify({ ...session, bpCodeId: 0 })), session);
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

test("기기 구분값: 쿠키의 UUID 는 그대로, 없거나 고친 값은 새로 만든다", () => {
  const id = "0f8b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d";
  assert.equal(deviceIdOf(id), id);
  for (const stored of [undefined, "", "Mozilla/5.0", `${id}x`]) assert.match(deviceIdOf(stored), /^[0-9a-f-]{36}$/);
  assert.notEqual(deviceIdOf(undefined), deviceIdOf(undefined));
});

test("기기 구분값 쿠키는 브라우저를 닫아도 남는다 — 같은 브라우저의 다음 로그인이 앞 세션을 끊어야 한다", () => {
  const c = deviceCookie("v");
  assert.equal(c.httpOnly, true);
  assert.equal(c.path, "/");
  assert.ok(c.maxAge > 0);
});
