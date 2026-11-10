// node --test src/lib/session-expiry.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { isExpiredResult, isExpiry } from "./session-expiry.ts";

test("만료 판정 — 토큰을 실은 요청의 401 이고 만료 제외 경로가 아닐 때만", () => {
  assert.equal(isExpiry("/stores", true), true);
  assert.equal(isExpiry("/stores?page=2", true), true);
  // 토큰 없는 요청(로그인 · 공개 화면)
  assert.equal(isExpiry("/auth/admin/login", false), false);
  // 비밀번호 변경 · 탈퇴 최종 · 로그아웃의 401 은 그 업무의 실패다
  for (const p of ["/auth/admin/password-change", "/auth/admin/me/withdraw", "/auth/admin/logout", "/auth/admin/me/withdraw?x=1"]) assert.equal(isExpiry(p, true), false, p);
  // 정확히 그 경로만 뺀다 — 비슷한 경로는 만료다
  assert.equal(isExpiry("/auth/admin/me/withdraw-eligibility", true), true);
});

test("서버 액션 결과의 만료 표시 — expired 가 true 일 때만", () => {
  assert.equal(isExpiredResult({ ok: false, expired: true }), true);
  for (const r of [{ ok: false, status: 401 }, { ok: true }, { expired: "true" }, null, undefined, "x", []]) assert.equal(isExpiredResult(r), false, JSON.stringify(r));
});
