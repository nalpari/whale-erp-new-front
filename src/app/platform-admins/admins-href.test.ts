// node --test src/app/platform-admins/admins-href.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { adminsHref, isEditOpen, parseAdminsQuery, type AdminsQuery } from "./admins-href.ts";

test("주소 값이 틀리면 기본값으로 — api 에 400 · 500 을 일으키지 않는다", () => {
  assert.deepEqual(parseAdminsQuery({ page: "0", pageSize: "30", roleGroupId: "-3", admin: "1.5", status: "active", keyword: "   " }), {
    page: 1,
    pageSize: 20,
    keyword: undefined,
    roleGroupId: undefined,
    status: undefined,
    admin: undefined,
    edit: undefined,
  });
  // 9자리까지만 받는다 — api 의 int4 상한(2147483647)을 넘는 값이 가지 않게
  assert.equal(parseAdminsQuery({ page: "1234567890" }).page, 1);
  assert.equal(parseAdminsQuery({ admin: "007" }).admin, 7);
  // 같은 이름이 여럿이면(배열) 무시한다
  assert.equal(parseAdminsQuery({ page: ["2", "3"] }).page, 1);
  assert.equal(parseAdminsQuery({ status: "INACTIVE" }).status, "INACTIVE");
  // 상태를 모두 끈 것 — 결과 없음
  assert.equal(parseAdminsQuery({ status: "NONE" }).status, "NONE");
  assert.equal(parseAdminsQuery({ pageSize: "50" }).pageSize, 50);
});

test("검색어는 앞뒤 공백을 빼고 20자까지 — 자른 끝의 공백도 뺀다", () => {
  assert.equal(parseAdminsQuery({ keyword: "  seo  " }).keyword, "seo");
  assert.equal(parseAdminsQuery({ keyword: "a".repeat(25) }).keyword, "a".repeat(20));
  assert.equal(parseAdminsQuery({ keyword: "a".repeat(19) + " bc" }).keyword, "a".repeat(19));
});

test("주소 만들기 — 1쪽 · 기본 쪽 건수(20)는 빼고, 상태 NONE 은 남기며 특수문자는 인코딩한다", () => {
  assert.equal(adminsHref({}), "/platform-admins");
  assert.equal(adminsHref({ page: 1, pageSize: 20, keyword: "a&b c" }), "/platform-admins?keyword=a%26b+c");
  assert.equal(adminsHref({ pageSize: 100, status: "NONE" }), "/platform-admins?status=NONE&pageSize=100");
});

test("만든 주소를 다시 읽으면 같은 조건 — 새로 고침 · 링크 공유에서 조건이 사라지지 않는다", () => {
  const query: AdminsQuery = { page: 3, pageSize: 50, keyword: "서준", roleGroupId: 2, status: "ACTIVE", admin: 7, edit: true };
  const read = parseAdminsQuery(Object.fromEntries(new URL(adminsHref(query), "http://x").searchParams));
  assert.deepEqual(read, query);
});

test("수정(?edit=1)은 상세(?admin=)가 있을 때만 — 상세 없이 수정만 남지 않는다", () => {
  assert.equal(parseAdminsQuery({ admin: "7", edit: "1" }).edit, true);
  assert.equal(parseAdminsQuery({ edit: "1" }).edit, undefined);
  assert.equal(parseAdminsQuery({ admin: "7", edit: "true" }).edit, undefined);
  // admin 글자가 있어도 읽을 수 없는 값이면 상세가 없는 것이다 — 원래 글자가 아니라 읽은 결과로 본다
  assert.equal(parseAdminsQuery({ admin: "0", edit: "1" }).edit, undefined);
  assert.equal(parseAdminsQuery({ admin: "abc", edit: "1" }).edit, undefined);
  assert.equal(adminsHref({ edit: true }), "/platform-admins");
  assert.equal(adminsHref({ admin: 7, edit: true }), "/platform-admins?admin=7&edit=1");
});

test("수정 패널은 주소 · 권한 · 화면에 남은 상세가 모두 같은 계정일 때만 선다", () => {
  const query = { admin: 7, edit: true };
  const shown = { admin: { adminAccountId: 7 } };
  assert.equal(isEditOpen(query, true, shown), true);
  // 다른 계정으로 옮기는 중 — 앞 계정 상세가 남아 있어도 그 수정 폼을 새 주소 위에 열지 않는다
  assert.equal(isEditOpen({ admin: 8, edit: true }, true, shown), false);
  assert.equal(isEditOpen(query, true, { failed: "삭제되었거나 없는 계정입니다." }), false);
  assert.equal(isEditOpen(query, false, shown), false);
  assert.equal(isEditOpen(query, true, null), false);
  assert.equal(isEditOpen({ admin: 7 }, true, shown), false);
});
