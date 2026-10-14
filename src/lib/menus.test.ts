import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowed } from "./menus.ts";
import type { AdminMenu } from "./session.ts";

const menu = (url: string | null, read: boolean, children: AdminMenu[] = []): AdminMenu => ({
  menuCode: `MN${url}`,
  serviceCode: "WHALE_ERP",
  name: url ?? "그룹",
  url,
  depth: 1,
  permission: { read, create: false, update: false, delete: false },
  children,
});

// 환경설정(/settings, 하위로 가는 길이라 조회 false) 아래 BP 관리자 관리(조회 true)만 받은 계정. BP 권한 그룹 관리(/settings/roles)는 권한이 없어 응답에 없다.
const menus = [
  menu("/settings", false, [menu("/settings/admins", true)]),
  menu(null, false, [menu(null, false, [menu("/staff/contracts", true)])]),
];

test("isAllowed: 영역 홈은 메뉴가 비어도 열린다", () => {
  assert.equal(isAllowed([], "/home", "/home"), true);
});

test("isAllowed: 조회 권한 있는 메뉴와 그 아래(상세·등록)는 열린다", () => {
  for (const p of ["/settings/admins", "/settings/admins/12", "/settings/admins/new"]) assert.equal(isAllowed(menus, p, "/home"), true, p);
});

test("isAllowed: 조회 권한 없는 상위 메뉴 url 아래의 다른 화면은 막힌다", () => {
  for (const p of ["/settings", "/settings/roles"]) assert.equal(isAllowed(menus, p, "/home"), false, p);
});

test("isAllowed: 접두만 같은 주소는 막힌다", () => {
  assert.equal(isAllowed(menus, "/settings/admins-x", "/home"), false);
});

test("isAllowed: 3단계에만 있는 주소도 열리고, url 없는 메뉴가 있어도 깨지지 않는다", () => {
  assert.equal(isAllowed(menus, "/staff/contracts", "/home"), true);
  assert.equal(isAllowed(menus, "/staff", "/home"), false);
});
