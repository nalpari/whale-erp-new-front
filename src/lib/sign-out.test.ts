// node --test src/lib/sign-out.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { notFound, redirect } from "next/navigation.js";
import { isActionRedirect, LOGOUT_FAILED_EVENT, LOGOUT_FAILED_MESSAGE, signOut } from "./sign-out.ts";

const thrown = (fn: () => never): unknown => {
  try {
    fn();
  } catch (e) {
    return e;
  }
};

// 보낸 이벤트를 모으고 console.error 를 막는다 — node 에는 window 의 dispatchEvent 가 없다
function silence(): { events: string[]; restore: () => void } {
  const events: string[] = [];
  const g = globalThis as { dispatchEvent?: (e: Event) => boolean };
  const before = { dispatchEvent: g.dispatchEvent, error: console.error };
  g.dispatchEvent = (e: Event) => (events.push(e.type), true);
  console.error = () => {};
  return {
    events,
    restore: () => {
      g.dispatchEvent = before.dispatchEvent;
      console.error = before.error;
    },
  };
}

test("isActionRedirect — redirect 만 맞다. notFound · 보통 오류 · cause 로 감싼 redirect 는 아니다", () => {
  const redirectError = thrown(() => redirect("/login?reason=account"));
  assert.equal(isActionRedirect(redirectError), true);
  assert.equal(isActionRedirect(thrown(() => notFound())), false);
  assert.equal(isActionRedirect(new TypeError("fetch failed")), false);
  assert.equal(isActionRedirect(new Error("wrapped", { cause: redirectError })), false);
  assert.equal(isActionRedirect(null), false);
  assert.equal(isActionRedirect("NEXT_REDIRECT;replace;/login;307;"), false);
});

test("signOut — redirect 로 끝나면 성공이고 알리지 않는다", async () => {
  const s = silence();
  try {
    const error = thrown(() => redirect("/login"));
    assert.equal(await signOut(() => Promise.reject(error)), true);
    assert.equal(await signOut(() => Promise.resolve()), true);
    assert.deepEqual(s.events, []);
  } finally {
    s.restore();
  }
});

test("signOut — 연결 끊김 · notFound 는 로그아웃 실패 팝업 신호를 보내고 false", async () => {
  const s = silence();
  try {
    assert.equal(await signOut(() => Promise.reject(new TypeError("fetch failed"))), false);
    assert.equal(await signOut(() => Promise.reject(thrown(() => notFound()))), false);
    assert.deepEqual(s.events, [LOGOUT_FAILED_EVENT, LOGOUT_FAILED_EVENT]);
    assert.equal(LOGOUT_FAILED_MESSAGE, "로그아웃하지 못했습니다. 새로고침 후 다시 시도해 주세요.");
  } finally {
    s.restore();
  }
});
