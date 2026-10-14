// node --test src/lib/auth-routes.test.ts
// Node 24 가 타입을 벗겨 그대로 실행한다. 테스트 도구를 따로 깔지 않는다(date-math.test.ts 와 같다).
import assert from "node:assert/strict";
import { test } from "node:test";
import { homeOf, isPlatformRole, isPublicPath, roleLabel } from "./auth-routes.ts";

test("플랫폼 마스터·관리자는 플랫폼 홈, 나머지는 ERP 홈", () => {
  assert.equal(homeOf("PM"), "/platform");
  assert.equal(homeOf("PA"), "/platform");
  for (const code of ["BM", "BA", "FM", "FA"]) assert.equal(homeOf(code), "/home");
  assert.equal(isPlatformRole("BM"), false);
});

test("공개 경로만 로그인 없이 열린다 — 접두가 경로 마디와 맞아야 한다", () => {
  for (const p of ["/", "/login", "/find", "/signup", "/inquiry", "/notices", "/design", "/design/full"]) assert.equal(isPublicPath(p), true, p);
  for (const p of ["/home", "/settings/admins", "/platform", "/platform/bp", "/staff-members/1"]) assert.equal(isPublicPath(p), false, p);
  // 마디 단위 비교. /loginx 는 /login 이 아니다.
  for (const p of ["/loginx", "/designer"]) assert.equal(isPublicPath(p), false, p);
});

test("권한 이름", () => {
  assert.equal(roleLabel("BM"), "BP 마스터");
  assert.equal(roleLabel("ZZ"), "ZZ");
});
