// node --test src/lib/session-expiry.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { EXPIRED_COOKIE, expiredCookie, expiredMarkOf, marksExpiry, watchedFetch } from "./session-expiry.ts";

test("expiredMarkOf — 표시 쿠키 값만 꺼낸다", () => {
  assert.equal(expiredMarkOf("a=1; session-expired=1730790000000; login-key=x"), "1730790000000");
  assert.equal(expiredMarkOf("session-expired=5"), "5");
  assert.equal(expiredMarkOf("a=1; login-key=x"), null);
  assert.equal(expiredMarkOf(""), null);
  assert.equal(expiredMarkOf("my-session-expired=5"), null);
});

test("expiredCookie — 30초 · 화면 스크립트가 읽는다", () => {
  const c = expiredCookie(123);
  assert.equal(c.name, EXPIRED_COOKIE);
  assert.equal(c.value, "123");
  assert.equal(c.maxAge, 30);
  assert.equal(c.path, "/");
  assert.equal(c.sameSite, "lax");
  assert.equal("httpOnly" in c, false);
});

test("marksExpiry — 토큰을 실은 서버 액션의 401 만, 제외 경로는 빼고", () => {
  const auth = { headers: { Authorization: "Bearer t" } };
  assert.equal(marksExpiry("/stores", auth, true), true);
  assert.equal(marksExpiry("/stores?page=2", auth, true), true);
  assert.equal(marksExpiry("/auth/admin/me/withdraw-eligibility", auth, true), true);
  assert.equal(marksExpiry("/auth/admin/password-change", auth, true), false);
  assert.equal(marksExpiry("/auth/admin/me/withdraw", auth, true), false);
  assert.equal(marksExpiry("/auth/admin/logout", auth, true), false);
  assert.equal(marksExpiry("/stores", {}, true), false); // 토큰 없음(로그인 등)
  assert.equal(marksExpiry("/stores", auth, false), false); // 서버가 그리는 화면 · 라우트
  assert.equal(marksExpiry("/stores", { headers: new Headers({ authorization: "Bearer t" }) }, true), true);
});

const ok = () => Promise.resolve(new Response("ok"));
const action = { method: "POST", headers: { "Next-Action": "abc" } };
const settled = async (p: Promise<unknown>) => Promise.race([p.then(() => true), new Promise((r) => setTimeout(() => r(false), 20))]);

test("watchedFetch — 처음 보는 표시가 붙은 서버 액션 응답은 넘기지 않고 한 번만 알린다", async () => {
  let mark: string | null = null;
  let calls = 0;
  const f = watchedFetch(ok, () => mark, () => calls++);
  mark = "1";
  assert.equal(await settled(f("/stores", action)), false);
  assert.equal(calls, 1);
  // 같은 표시로 두 번 알리지 않는다
  assert.equal(await settled(f("/stores", action)), true);
  assert.equal(calls, 1);
  // 새 표시면 다시
  mark = "2";
  assert.equal(await settled(f("/stores", action)), false);
  assert.equal(calls, 2);
});

test("watchedFetch — 일반 요청 · 표시 없는 응답 · 감싸기 전 표시는 그대로 넘긴다", async () => {
  let calls = 0;
  const before = watchedFetch(ok, () => "0", () => calls++);
  assert.equal(await settled(before("/stores", action)), true); // 감싸기 전부터 있던 표시
  const f = watchedFetch(ok, () => null, () => calls++);
  assert.equal(await (await f("/api/stores")).text(), "ok");
  assert.equal(await settled(f("/stores", action)), true);
  let mark: string | null = null;
  const g = watchedFetch(ok, () => mark, () => calls++);
  mark = "9";
  assert.equal(await settled(g("/api/stores")), true); // 서버 액션이 아니면 표시가 있어도 넘긴다
  assert.equal(await settled(g(new Request("http://x/stores", action))), false); // Request 로 와도 헤더를 본다
  assert.equal(calls, 1);
});
