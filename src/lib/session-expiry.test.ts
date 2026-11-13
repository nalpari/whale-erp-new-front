// node --test src/lib/session-expiry.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { expiringFetch, expiryHandlingOf, isExpiredResult, isExpiry } from "./session-expiry.ts";

test("request() 의 실패 처리 — 만료면 화면을 그리는 중엔 로그인 화면, 아니면 만료 표시", async () => {
  let asked = 0;
  const rendering = (value: boolean) => async () => (asked++, value);
  assert.equal(await expiryHandlingOf(401, "/stores", true, rendering(true)), "login");
  assert.equal(await expiryHandlingOf(401, "/stores", true, rendering(false)), "mark");
  asked = 0;
  // 만료가 아니면 요청 머리를 묻지 않는다 — 다른 실패 · 토큰 없는 요청 · 만료 제외 경로
  assert.equal(await expiryHandlingOf(403, "/stores", true, rendering(true)), null);
  assert.equal(await expiryHandlingOf(500, "/stores", true, rendering(true)), null);
  assert.equal(await expiryHandlingOf(401, "/auth/admin/login", false, rendering(true)), null);
  assert.equal(await expiryHandlingOf(401, "/auth/admin/logout", true, rendering(true)), null);
  assert.equal(asked, 0);
});

test("받기 · 올리기 fetch — 401 이면 만료를 알리고 결과를 넘기지 않는다, 그 밖은 그대로", async () => {
  let expired = 0;
  const onExpired = () => void expired++;
  const ok = new Response("{}", { status: 200 });
  const conflict = new Response("{}", { status: 409 });
  assert.equal(await expiringFetch(async () => ok, onExpired)("/x"), ok);
  assert.equal(await expiringFetch(async () => conflict, onExpired)("/x"), conflict);
  assert.equal(expired, 0);
  let settled = false;
  void expiringFetch(async () => new Response(null, { status: 401 }), onExpired)("/x").then(() => (settled = true));
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(expired, 1);
  assert.equal(settled, false);
});

test("만료 판정 — 토큰을 실은 요청의 401 이고 만료 제외 경로가 아닐 때만", () => {
  assert.equal(isExpiry("/stores", true), true);
  assert.equal(isExpiry("/stores?page=2", true), true);
  // 토큰 없는 요청(로그인 · 공개 화면)
  assert.equal(isExpiry("/auth/admin/login", false), false);
  // 강제 비밀번호 변경 · 로그아웃의 401 은 그 업무의 실패다
  for (const p of ["/auth/admin/password-change", "/auth/admin/logout", "/auth/admin/logout?x=1"]) assert.equal(isExpiry(p, true), false, p);
  // 탈퇴 최종 제출의 401 은 만료다(2026-11-11)
  assert.equal(isExpiry("/auth/admin/me/withdraw", true), true);
  // 정확히 그 경로만 뺀다 — 비슷한 경로는 만료다
  assert.equal(isExpiry("/auth/admin/password-change-x", true), true);
});

test("서버 액션 결과의 만료 표시 — expired 가 true 일 때만", () => {
  assert.equal(isExpiredResult({ ok: false, expired: true }), true);
  for (const r of [{ ok: false, status: 401 }, { ok: true }, { expired: "true" }, null, undefined, "x", []]) assert.equal(isExpiredResult(r), false, JSON.stringify(r));
});
