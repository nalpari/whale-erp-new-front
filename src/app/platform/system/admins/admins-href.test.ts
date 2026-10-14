// node --test src/app/platform/system/admins/admins-href.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { adminsHref, parseAdminsQuery, type AdminsQuery } from "./admins-href.ts";

test("주소 값이 틀리면 기본값으로 — api 에 400 · 500 을 일으키지 않는다", () => {
  assert.deepEqual(parseAdminsQuery({ page: "0", roleGroupId: "-3", admin: "1.5", status: "active", keyword: "   " }), {
    page: 1,
    keyword: undefined,
    roleGroupId: undefined,
    status: undefined,
    admin: undefined,
    permission: undefined,
  });
  // 9자리까지만 받는다 — api 의 int4 상한(2147483647)을 넘는 값이 가지 않게
  assert.equal(parseAdminsQuery({ page: "1234567890" }).page, 1);
  assert.equal(parseAdminsQuery({ admin: "007" }).admin, 7);
  // 같은 이름이 여럿이면(배열) 무시한다
  assert.equal(parseAdminsQuery({ page: ["2", "3"] }).page, 1);
  assert.equal(parseAdminsQuery({ permission: ["view"] }).permission, undefined);
  assert.equal(parseAdminsQuery({ status: "INACTIVE" }).status, "INACTIVE");
});

test("검색어는 앞뒤 공백을 빼고 20자까지 — 자른 끝의 공백도 뺀다", () => {
  assert.equal(parseAdminsQuery({ keyword: "  seo  " }).keyword, "seo");
  assert.equal(parseAdminsQuery({ keyword: "a".repeat(25) }).keyword, "a".repeat(20));
  assert.equal(parseAdminsQuery({ keyword: "a".repeat(19) + " bc" }).keyword, "a".repeat(19));
});

test("주소 만들기 — 1쪽은 빼고 특수문자는 인코딩한다", () => {
  assert.equal(adminsHref({}), "/platform/system/admins");
  assert.equal(adminsHref({ page: 1, keyword: "a&b c" }), "/platform/system/admins?keyword=a%26b+c");
});

test("만든 주소를 다시 읽으면 같은 조건 — 새로 고침 · 링크 공유에서 조건이 사라지지 않는다", () => {
  const query: AdminsQuery = { page: 3, keyword: "서준", roleGroupId: 2, status: "ACTIVE", admin: 7, permission: "view" };
  const read = parseAdminsQuery(Object.fromEntries(new URL(adminsHref(query), "http://x").searchParams));
  assert.deepEqual(read, query);
});
