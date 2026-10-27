import assert from "node:assert/strict";
import { test } from "node:test";
import { bpOfPath, bpPath, bpRouteOf, isBpPathScreen, stripBp } from "./bp-path.ts";

test("bpOfPath 는 /bp/{양의 정수} 만 읽는다", () => {
  assert.equal(bpOfPath("/bp/8/bp-role-groups"), 8);
  assert.equal(bpOfPath("/bp/8"), 8);
  assert.equal(bpOfPath("/bp/0/x"), null);
  assert.equal(bpOfPath("/bp/abc/x"), null);
  assert.equal(bpOfPath("/bp/1234567890/x"), null); // int4 밖
  assert.equal(bpOfPath("/bp-role-groups"), null); // /bp- 로 시작하는 옛 경로
  assert.equal(bpOfPath("/bp/8x/y"), null);
});

test("stripBp 는 접두만 뗀다", () => {
  assert.equal(stripBp("/bp/8/bp-role-groups"), "/bp-role-groups");
  assert.equal(stripBp("/bp/8"), "/");
  assert.equal(stripBp("/bp-role-groups"), "/bp-role-groups");
  assert.equal(stripBp("/bp/8//evil.com"), "//evil.com");
});

test("bpPath 는 늘 /bp/{숫자} 로 시작한다", () => {
  assert.equal(bpPath(8, "/bp-role-groups"), "/bp/8/bp-role-groups");
  assert.equal(bpPath(8, "//evil.com"), "/bp/8//evil.com");
  assert.equal(bpPath(8, "x"), "/bp/8/x");
});

test("bpRouteOf: 들어온 헤더는 버리고 주소의 BP 로만 쓴다", () => {
  const base = { sent: "124", isGet: true, isAction: false, ownBpCodeId: 8, isPlatform: false };
  // 주소에 BP 가 없는 화면 — 위조 헤더를 버린다
  assert.deepEqual(bpRouteOf({ ...base, pathname: "/stores" }), { header: null });
  // 자기 BP 주소 — 주소의 값으로 rewrite
  assert.deepEqual(bpRouteOf({ ...base, pathname: "/bp/8/bp-role-groups" }), { header: "8", rewrite: "/bp-role-groups" });
});

test("bpRouteOf: BFF 는 숫자인 헤더만 남긴다", () => {
  const base = { pathname: "/api/bp-codes", isGet: true, isAction: false, ownBpCodeId: 8, isPlatform: false };
  assert.deepEqual(bpRouteOf({ ...base, sent: "8" }), { header: "8" });
  assert.deepEqual(bpRouteOf({ ...base, sent: "8; drop" }), { header: null });
  assert.deepEqual(bpRouteOf({ ...base, sent: null }), { header: null });
});

test("bpRouteOf: BP · 가맹 계정의 남의 BP 주소는 GET 만 소속 BP 로 보낸다", () => {
  const base = { pathname: "/bp/124/bp-role-groups", sent: null, isGet: true, isAction: false, ownBpCodeId: 8, isPlatform: false };
  assert.deepEqual(bpRouteOf(base), { header: null, redirect: "/bp/8/bp-role-groups" });
  // 서버 액션 · POST 는 보내지 않고 주소의 BP 로 넘긴다(api 가 403)
  assert.deepEqual(bpRouteOf({ ...base, isAction: true }), { header: "124", rewrite: "/bp-role-groups" });
  assert.deepEqual(bpRouteOf({ ...base, isGet: false }), { header: "124", rewrite: "/bp-role-groups" });
  // 플랫폼 계정 · 쿠키에 BP 가 없는 옛 세션은 보내지 않는다(SessionGate 가 다룬다)
  assert.deepEqual(bpRouteOf({ ...base, isPlatform: true }), { header: "124", rewrite: "/bp-role-groups" });
  assert.deepEqual(bpRouteOf({ ...base, ownBpCodeId: undefined }), { header: "124", rewrite: "/bp-role-groups" });
});

test("isBpPathScreen 은 옮긴 화면만", () => {
  assert.equal(isBpPathScreen("/bp-role-groups"), true);
  assert.equal(isBpPathScreen("/bp/8/bp-role-groups"), true);
  assert.equal(isBpPathScreen("/bp-role-groups-x"), false);
  assert.equal(isBpPathScreen("/stores"), true);
  assert.equal(isBpPathScreen("/bp/8/stores/3/edit"), true);
  assert.equal(isBpPathScreen("/stores-x"), false);
  assert.equal(isBpPathScreen("/bp/8/stores-x"), false);
  // 엑셀 중계 경로도 옮긴 화면 아래라 /bp/{id} 로 부른다
  assert.equal(isBpPathScreen("/stores/excel"), true);
  assert.equal(isBpPathScreen("/staff-members"), false);
  assert.equal(isBpPathScreen("/bp/8/bp-admins"), true);
});

test("isBpPathScreen 은 고객지원 셋과 문의 등록 창구도", () => {
  assert.equal(isBpPathScreen("/support-notices"), true);
  assert.equal(isBpPathScreen("/bp/8/support-faqs"), true);
  assert.equal(isBpPathScreen("/support-inquiries/12"), true);
  assert.equal(isBpPathScreen("/support-inquiries/save"), true);
  assert.equal(isBpPathScreen("/support-notices-x"), false);
  assert.equal(isBpPathScreen("/platform-notices"), false);
});
