import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowed, MENU_CODE, menuOfPath, menuPermissionOf, menusOf, serviceOfPath } from "./menus.ts";
import type { AdminMenu } from "./session.ts";

const menu = (url: string | null, read: boolean, children: AdminMenu[] = [], serviceCode = "WHALE_ERP"): AdminMenu => ({
  menuCode: `MN${url}`,
  serviceCode,
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
// 플랫폼 계정은 두 서비스 메뉴를 모두 받는다.
const platformAccount = [...menus, menu(null, false, [menu("/code-groups", true, [], "PLATFORM")], "PLATFORM")];

test("isAllowed: 서비스 홈은 메뉴가 비어도 열린다", () => {
  assert.equal(isAllowed([], "/home", "WHALE_ERP"), true);
  assert.equal(isAllowed([], "/platform", "PLATFORM"), true);
});

test("isAllowed: 조회 권한 있는 메뉴와 그 아래(상세·등록)는 열린다", () => {
  for (const p of ["/settings/admins", "/settings/admins/12", "/settings/admins/new"]) assert.equal(isAllowed(menus, p, "WHALE_ERP"), true, p);
});

test("isAllowed: 조회 권한 없는 상위 메뉴 url 아래의 다른 화면은 막힌다", () => {
  for (const p of ["/settings", "/settings/roles"]) assert.equal(isAllowed(menus, p, "WHALE_ERP"), false, p);
});

test("isAllowed: 접두만 같은 주소는 막힌다", () => {
  assert.equal(isAllowed(menus, "/settings/admins-x", "WHALE_ERP"), false);
});

test("isAllowed: 권한이 있어도 탭의 서비스가 아닌 화면·홈은 막힌다", () => {
  assert.equal(isAllowed(platformAccount, "/settings/admins", "PLATFORM"), false);
  assert.equal(isAllowed(platformAccount, "/code-groups", "WHALE_ERP"), false);
  assert.equal(isAllowed(platformAccount, "/home", "PLATFORM"), false);
  assert.equal(isAllowed(platformAccount, "/code-groups", "PLATFORM"), true);
});

test("isAllowed: 알림 템플릿 관리는 api 메뉴에 없어도 플랫폼 서비스에서만 임시로 열린다", () => {
  for (const p of ["/platform/notification-templates", "/platform/notification-templates/new", "/platform/notification-templates/3"])
    assert.equal(isAllowed([], p, "PLATFORM"), true, p);
  assert.equal(isAllowed([], "/platform/notification-templates", "WHALE_ERP"), false);
});

test("isAllowed: 3단계에만 있는 주소도 열리고, url 없는 메뉴가 있어도 깨지지 않는다", () => {
  assert.equal(isAllowed(menus, "/staff/contracts", "WHALE_ERP"), true);
  assert.equal(isAllowed(menus, "/staff", "WHALE_ERP"), false);
});

test("serviceOfPath: 홈 · 메뉴 주소로 서비스를 고르고 모르면 null", () => {
  assert.equal(serviceOfPath([], "/home"), "WHALE_ERP");
  assert.equal(serviceOfPath([], "/platform"), "PLATFORM");
  assert.equal(serviceOfPath(platformAccount, "/settings/admins/3"), "WHALE_ERP");
  assert.equal(serviceOfPath(platformAccount, "/code-groups"), "PLATFORM");
  assert.equal(serviceOfPath([], "/platform/notification-templates/new"), "PLATFORM");
  assert.equal(serviceOfPath(platformAccount, "/unknown"), null);
});

test("menusOf: 그 서비스의 메뉴만 하위까지 남긴다", () => {
  assert.deepEqual(menusOf(platformAccount, "PLATFORM").map((m) => m.children[0].url), ["/code-groups"]);
  assert.equal(menusOf(platformAccount, "WHALE_ERP").length, 2);
});

test("menusOf: 부모가 같은 서비스여도 다른 서비스의 하위 메뉴는 뺀다", () => {
  const mixed = [menu(null, false, [menu("/home/x", true), menu("/platform/y", true, [], "PLATFORM")])];
  assert.deepEqual(
    menusOf(mixed, "WHALE_ERP")[0].children.map((m) => m.url),
    ["/home/x"],
  );
  assert.equal(isAllowed(mixed, "/platform/y", "WHALE_ERP"), false);
});

test("serviceOfPath: 관리자 웹이 열지 않는 서비스(POS 등)는 모른다고 본다", () => {
  assert.equal(serviceOfPath([menu("/pos", true, [], "POS")], "/pos"), null);
});

test("menuPermissionOf: 3단계 깊이의 메뉴도 코드로 찾아 칸별 권한을 돌려준다", () => {
  const todos: AdminMenu = { ...menu("/todos", true, [], "PLATFORM"), menuCode: MENU_CODE.todos, depth: 3, permission: { read: true, create: false, update: true, delete: false } };
  const tree = [menu(null, false, [menu(null, false, [todos], "PLATFORM")], "PLATFORM")];
  assert.equal(menuPermissionOf(tree, "PLATFORM", MENU_CODE.todos, "update"), true);
  assert.equal(menuPermissionOf(tree, "PLATFORM", MENU_CODE.todos, "delete"), false);
});

test("menuPermissionOf: 다른 서비스 탭의 메뉴와 없는 코드는 false", () => {
  const staff: AdminMenu = { ...menu("/staff-members", true), menuCode: MENU_CODE.staffMembers, permission: { read: true, create: true, update: true, delete: true } };
  assert.equal(menuPermissionOf([staff], "WHALE_ERP", MENU_CODE.staffMembers, "create"), true);
  // 플랫폼 탭에서는 ERP 메뉴를 보지 않는다
  assert.equal(menuPermissionOf([staff], "PLATFORM", MENU_CODE.staffMembers, "create"), false);
  assert.equal(menuPermissionOf([staff], "WHALE_ERP", MENU_CODE.platformMenus, "read"), false);
});

test("menuOfPath: 지금 주소의 메뉴 — 그 url 이거나 그 아래, 이 탭 서비스, 조회 권한", () => {
  const admins: AdminMenu = { ...menu("/platform-admins", true, [], "PLATFORM"), permission: { read: true, create: true, update: false, delete: true } };
  const account = [...platformAccount, menu(null, false, [admins], "PLATFORM")];
  for (const p of ["/platform-admins", "/platform-admins/12", "/platform-admins/new"]) assert.deepEqual(menuOfPath(account, p, "PLATFORM")?.permission, admins.permission, p);
  // 다른 서비스 탭 · 홈 · 메뉴 없는 화면 · 접두만 같은 주소는 메뉴가 없다
  assert.equal(menuOfPath(account, "/platform-admins", "WHALE_ERP"), null);
  assert.equal(menuOfPath(account, "/platform", "PLATFORM"), null);
  assert.equal(menuOfPath(account, "/platform/notification-templates", "PLATFORM"), null);
  assert.equal(menuOfPath(account, "/platform-admins-x", "PLATFORM"), null);
  // 조회 권한이 없는 상위(하위로 가는 길)는 그 아래 화면의 메뉴가 아니다
  assert.equal(menuOfPath(menus, "/settings/roles", "WHALE_ERP"), null);
});

test("menuOfPath: 여럿이 맞으면 url 이 가장 긴(구체적인) 메뉴", () => {
  const parent = menu("/stores", true);
  const child = { ...menu("/stores/contract-templates", true), permission: { read: true, create: true, update: true, delete: true } };
  const tree = [{ ...parent, children: [child] }];
  assert.equal(menuOfPath(tree, "/stores/contract-templates/5", "WHALE_ERP")?.url, child.url);
  assert.equal(menuOfPath(tree, "/stores/12", "WHALE_ERP")?.url, parent.url);
});

test("menuOfPath: 긴 url 메뉴를 먼저 만나도 그 메뉴의 권한을 돌려준다", () => {
  const long = { ...menu("/stores/contract-templates", true), permission: { read: true, create: true, update: true, delete: true } };
  const short = menu("/stores", true);
  const tree = [menu(null, false, [long]), short];
  const found = menuOfPath(tree, "/stores/contract-templates/5", "WHALE_ERP");
  assert.equal(found?.url, long.url);
  assert.deepEqual(found?.permission, long.permission);
});

test("menuOfPath: 조회 권한이 없는 하위 메뉴는 고르지 않고 상위 메뉴를 돌려준다", () => {
  const child = menu("/stores/contract-templates", false);
  const parent = { ...menu("/stores", true), children: [child] };
  assert.equal(menuOfPath([parent], "/stores/contract-templates", "WHALE_ERP")?.url, parent.url);
});
