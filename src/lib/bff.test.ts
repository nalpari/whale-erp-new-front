// node --test src/lib/bff.test.ts
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { bff, BffError, isSessionExpired } from "./bff.ts";
import { SESSION_EXPIRED_EVENT } from "./session-expiry.ts";

// 브라우저 전역(fetch · location · dispatchEvent)을 바꿔 끼운다
const real = { fetch: globalThis.fetch, location: (globalThis as { location?: unknown }).location, dispatchEvent: globalThis.dispatchEvent };
let events: string[] = [];
const respond = (status: number, body: unknown) => {
  globalThis.fetch = async () => new Response(JSON.stringify(body), { status });
};
beforeEach(() => {
  events = [];
  Object.assign(globalThis, { location: { pathname: "/stores" }, dispatchEvent: (e: Event) => (events.push(e.type), true) });
});
afterEach(() => Object.assign(globalThis, real));

test("bff 401 — 「로그인 만료」 팝업을 알리고 화면은 isSessionExpired 로 가른다", async () => {
  respond(401, { message: "토큰이 유효하지 않습니다." });
  const error = await bff("/stores").catch((e: unknown) => e);
  assert.ok(error instanceof BffError);
  assert.equal(error.status, 401);
  assert.deepEqual(events, [SESSION_EXPIRED_EVENT]);
  assert.equal(isSessionExpired(error), true);
});

test("bff 401 이 아니면 만료를 알리지 않는다", async () => {
  for (const status of [400, 403, 404, 409, 500]) {
    respond(status, { message: "거절" });
    const error = await bff("/stores").catch((e: unknown) => e);
    assert.ok(error instanceof BffError, String(status));
    assert.equal(isSessionExpired(error), false, String(status));
  }
  assert.deepEqual(events, []);
  // 연결 실패(status 0)도 만료가 아니다
  globalThis.fetch = async () => {
    throw new TypeError("network");
  };
  assert.equal(isSessionExpired(await bff("/stores").catch((e: unknown) => e)), false);
  assert.equal(isSessionExpired(new Error("x")), false);
});
