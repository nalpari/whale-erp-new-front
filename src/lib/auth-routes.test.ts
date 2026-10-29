// node --test src/lib/auth-routes.test.ts
// Node 24 가 타입을 벗겨 그대로 실행한다. 테스트 도구를 따로 깔지 않는다(date-math.test.ts 와 같다).
import assert from "node:assert/strict";
import { test } from "node:test";
import { homeOf, isPlatformRole, isPublicPath, loginPathOf, redirectsSignedIn, returnPathOf, signedInTargetOf } from "./auth-routes.ts";

test("로그인한 채 홈 · 로그인 · 찾기를 열면 자기 홈으로 — 홈은 접근 토큰이 살아 있을 때만", () => {
  const now = 1_000_000;
  const live = { accessTokenExpiresAt: now + 60_000 };
  const expired = { accessTokenExpiresAt: now - 1 };
  for (const p of ["/", "/login", "/find"]) assert.equal(redirectsSignedIn(p, "GET", live, now), true, p);
  // 끝난 로그인의 쿠키로 홈을 보러 오면 로그인 전 홈을 그대로 보인다. 로그인 · 찾기는 쿠키만 보고 보낸다.
  assert.equal(redirectsSignedIn("/", "GET", expired, now), false);
  assert.equal(redirectsSignedIn("/login", "GET", expired, now), true);
  // 세션 없음 · 서버 액션 POST · 다른 로그인 전 화면 · 마디가 다른 경로는 보내지 않는다.
  assert.equal(redirectsSignedIn("/", "GET", null, now), false);
  assert.equal(redirectsSignedIn("/", "POST", live, now), false);
  for (const p of ["/notices", "/notices/1", "/terms", "/signup", "/leads", "/login/x", "/findx"]) assert.equal(redirectsSignedIn(p, "GET", live, now), false, p);
});

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

test("로그인 뒤 돌아올 곳은 엑셀 내려받기(메일 링크)만 받는다 — 바깥 주소 · 다른 화면은 null", () => {
  assert.equal(returnPathOf("/excel-downloads/41"), "/excel-downloads/41");
  for (const v of ["//evil.example/excel-downloads/1", "https://evil.example", "/excel-downloads/41/x", "/excel-downloads/abc", "/excel-downloads/0", "/excel-downloads/041", "/stores", "", null, undefined, 41])
    assert.equal(returnPathOf(v), null, String(v));
  // 같은 이름 쿼리가 둘이면 Next searchParams 는 배열을 준다 · 10자리 · 끝 줄바꿈 · 쿼리 · 해시 · 역슬래시도 받지 않는다
  for (const v of [["/excel-downloads/41"], "/excel-downloads/1000000000", "/excel-downloads/41\n", "/excel-downloads/41?x=1", "/excel-downloads/41#x", "/\\evil.example"])
    assert.equal(returnPathOf(v), null, JSON.stringify(v));
});

test("로그인으로 보낼 주소 — 메일 링크 화면의 GET 만 ?next= 를 붙인다", () => {
  assert.equal(loginPathOf("/excel-downloads/41"), "/login?next=%2Fexcel-downloads%2F41");
  assert.equal(loginPathOf("/excel-downloads/41", "POST"), "/login");
  assert.equal(loginPathOf("/stores"), "/login");
  // 탭 BP 주소의 메일 링크는 만들지 않는다 — 지금 동작을 고정한다
  assert.equal(loginPathOf("/bp/8/excel-downloads/41"), "/login");
});

test("로그인한 채 로그인 전 화면에 오면 — /login 의 받을 수 있는 next 만 따르고 나머지는 자기 홈", () => {
  assert.equal(signedInTargetOf("/login", "/excel-downloads/41", "/home"), "/excel-downloads/41");
  for (const next of ["//evil.example", "https://evil.example", "/stores", null])
    assert.equal(signedInTargetOf("/login", next, "/home"), "/home", String(next));
  assert.equal(signedInTargetOf("/find", "/excel-downloads/41", "/home"), "/home");
  assert.equal(signedInTargetOf("/", "/excel-downloads/41", "/platform"), "/platform");
});
