// node --test src/lib/sign-out.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { notFound, redirect } from "next/navigation.js";
import { isActionRedirect, signOut } from "./sign-out.ts";

const thrown = (fn: () => never): unknown => {
  try {
    fn();
  } catch (e) {
    return e;
  }
};

// alert · console.error 를 막고 불린 횟수를 센다
function silence(): { alerts: string[]; restore: () => void } {
  const alerts: string[] = [];
  const g = globalThis as { alert?: (m: string) => void };
  const before = { alert: g.alert, error: console.error };
  g.alert = (m: string) => void alerts.push(m);
  console.error = () => {};
  return {
    alerts,
    restore: () => {
      g.alert = before.alert;
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
    assert.deepEqual(s.alerts, []);
  } finally {
    s.restore();
  }
});

test("signOut — 연결 끊김 · notFound 는 실패로 알리고 false", async () => {
  const s = silence();
  try {
    assert.equal(await signOut(() => Promise.reject(new TypeError("fetch failed"))), false);
    assert.equal(await signOut(() => Promise.reject(thrown(() => notFound()))), false);
    assert.deepEqual(s.alerts, ["로그아웃하지 못했습니다. 다시 시도해 주세요.", "로그아웃하지 못했습니다. 다시 시도해 주세요."]);
  } finally {
    s.restore();
  }
});
