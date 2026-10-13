// node --test src/lib/auth-routes.test.ts
// Node 24 가 타입을 벗겨 그대로 실행한다. 테스트 도구를 따로 깔지 않는다(date-math.test.ts 와 같다).
import assert from "node:assert/strict";
import { test } from "node:test";
import { areaOf, homeOf, isPlatformRole, roleLabel } from "./auth-routes.ts";

test("플랫폼 마스터·관리자는 플랫폼 홈, 나머지는 ERP 홈", () => {
  assert.equal(homeOf("PM"), "/platform");
  assert.equal(homeOf("PA"), "/platform");
  for (const code of ["BM", "BA", "FM", "FA"]) assert.equal(homeOf(code), "/home");
  assert.equal(isPlatformRole("BM"), false);
});

test("경로는 영역으로 갈린다 — 접두가 경로 마디와 맞아야 한다", () => {
  assert.equal(areaOf("/"), "public");
  assert.equal(areaOf("/login"), "public");
  for (const p of ["/find", "/signup", "/inquiry", "/notices"]) assert.equal(areaOf(p), "public");
  assert.equal(areaOf("/design/full"), "public");
  assert.equal(areaOf("/home"), "erp");
  assert.equal(areaOf("/config/admins"), "erp");
  assert.equal(areaOf("/platform"), "platform");
  assert.equal(areaOf("/bp"), "platform");
  assert.equal(areaOf("/system/admins"), "platform");
  assert.equal(areaOf("/staff-members/1"), "erp");
  assert.equal(areaOf("/design"), "public");
  // 마디 단위 비교. /homepage 는 /home 이 아니고, /loginx 는 /login 이 아니다.
  assert.equal(areaOf("/homepage"), "erp");
  assert.equal(areaOf("/bpx"), "erp");
  assert.equal(areaOf("/loginx"), "erp");
  assert.equal(areaOf("/designer"), "erp");
  assert.equal(areaOf("/x"), "erp");
});

test("권한 이름", () => {
  assert.equal(roleLabel("BM"), "BP 마스터");
  assert.equal(roleLabel("ZZ"), "ZZ");
});
