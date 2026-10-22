// node --test src/lib/auth-routes.test.ts
// Node 24 가 타입을 벗겨 그대로 실행한다. 테스트 도구를 따로 깔지 않는다(date-math.test.ts 와 같다).
import assert from "node:assert/strict";
import { test } from "node:test";
import { homeOf, isPlatformRole, isPublicPath } from "./auth-routes.ts";

test("플랫폼 마스터·관리자는 플랫폼 홈, 나머지는 ERP 홈", () => {
  assert.equal(homeOf("PM"), "/platform");
  assert.equal(homeOf("PA"), "/platform");
  for (const code of ["BM", "BA", "FM", "FA"]) assert.equal(homeOf(code), "/home");
  assert.equal(isPlatformRole("BM"), false);
});

test("공개 경로만 로그인 없이 열린다 — 접두가 경로 마디와 맞아야 한다", () => {
  for (const p of ["/", "/login", "/find", "/signup", "/leads", "/notices", "/store-operations", "/add-on-services", "/terms", "/design", "/design/full"]) assert.equal(isPublicPath(p), true, p);
  for (const p of ["/home", "/settings/admins", "/platform", "/platform/bp", "/staff-members/1"]) assert.equal(isPublicPath(p), false, p);
  // 마디 단위 비교. /loginx 는 /login 이 아니다.
  for (const p of ["/loginx", "/designer", "/signupx"]) assert.equal(isPublicPath(p), false, p);
  // 가입 완료는 세션 없이 들어오는 하위 경로다. 옛 경로(/auth/signup)는 공개가 아니다 — 가입 화면은 /signup 아래에 둔다.
  assert.equal(isPublicPath("/signup/done"), true);
  assert.equal(isPublicPath("/auth/signup"), false);
});


test("BFF(/api/*)는 공개 경로가 아니다 — 세션 없이 열리면 안 된다", () => {
  for (const p of ["/api", "/api/bp-codes/1/stores"]) assert.equal(isPublicPath(p), false, p);
});
