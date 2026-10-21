// node --test src/lib/paper-request.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { answersWith401, NOTICE_SAVE_ROUTE, PAPER_ROUTE, sameOrigin, tooLarge } from "./paper-request.ts";

test("answersWith401 — BFF · 종이 계약 등록 · 공지사항 저장만 401, 화면 경로는 로그인으로 리다이렉트", () => {
  for (const p of ["/api/contracts", "/api/auth/admin/login-info", "/contracts/paper", "/platform-notices/save"]) assert.equal(answersWith401(p), true, p);
  for (const p of ["/contracts", "/contracts/7", "/contracts/paper/x", "/contracts/7/documents/1", "/home", "/apix", "/platform-notices", "/platform-notices/1"]) assert.equal(answersWith401(p), false, p);
});

test("sameOrigin — host 가 Origin 과 같으면 통과(포트까지 본다)", () => {
  assert.equal(sameOrigin("http://localhost:3001", null, "localhost:3001"), true);
  assert.equal(sameOrigin("http://localhost:3001", null, "localhost:3002"), false);
  assert.equal(sameOrigin("https://evil.example.com", null, "erp.example.com"), false);
});

test("sameOrigin — x-forwarded-host 가 있으면 쉼표 목록의 첫 값만 본다(Next 서버 액션과 같다)", () => {
  assert.equal(sameOrigin("https://erp.example.com", "erp.example.com, internal-lb", "internal-lb"), true);
  assert.equal(sameOrigin("https://erp.example.com", " erp.example.com ", "10.0.0.1:3000"), true);
  // forwarded 가 다르면 host 가 맞아도 막는다
  assert.equal(sameOrigin("https://erp.example.com", "proxy.internal", "erp.example.com"), false);
  assert.equal(sameOrigin("https://erp.example.com", "internal-lb, erp.example.com", "10.0.0.1:3000"), false);
  // 비어 있으면 없는 것으로 보고 host 를 본다
  assert.equal(sameOrigin("https://erp.example.com", "", "erp.example.com"), true);
});

test("sameOrigin — Origin 이 없거나 null · 깨진 값이면 막는다", () => {
  for (const origin of [null, "", "null", "not a url"]) assert.equal(sameOrigin(origin, "erp.example.com", "erp.example.com"), false, String(origin));
});

test("tooLarge — 공지사항 저장 51MB · 종이 계약 21MB · 나머지 10MB 를 넘으면 막는다", () => {
  const MB = 1024 * 1024;
  assert.equal(tooLarge(NOTICE_SAVE_ROUTE, String(51 * MB)), false);
  assert.equal(tooLarge(NOTICE_SAVE_ROUTE, String(51 * MB + 1)), true);
  assert.equal(tooLarge(PAPER_ROUTE, String(21 * MB)), false);
  assert.equal(tooLarge(PAPER_ROUTE, String(21 * MB + 1)), true);
  assert.equal(tooLarge("/platform-faqs/new", String(10 * MB)), false);
  assert.equal(tooLarge("/platform-faqs/new", String(10 * MB + 1)), true);
  // 없거나 깨진 값은 Next 의 proxy 한도에 맡긴다
  for (const v of [null, "", "abc"]) assert.equal(tooLarge("/login", v), false, String(v));
});
