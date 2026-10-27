// node --test src/app/code-groups/codes-href.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { codesHref } from "./codes-href.ts";

test("codesHref — 기본값(1쪽 · 빈 검색)은 빼고 검색 · 쪽 · 그룹 순서로 둔다", () => {
  assert.equal(codesHref({}), "/code-groups");
  assert.equal(codesHref({ page: 1, groupCode: "", groupName: "" }), "/code-groups");
  assert.equal(codesHref({ page: 3, group: "BANK" }), "/code-groups?page=3&group=BANK");
  assert.equal(codesHref({ page: 2, group: "EMP_TYPE", groupCode: "EMP", groupName: "고용" }), "/code-groups?groupCode=EMP&groupName=%EA%B3%A0%EC%9A%A9&page=2&group=EMP_TYPE");
});

test("codesHref — 관리주체는 하나만 고른 때만 검색어 뒤에 둔다", () => {
  assert.equal(codesHref({ manageOwnerCode: "PLATFORM_PROVIDED" }), "/code-groups?manageOwnerCode=PLATFORM_PROVIDED");
  assert.equal(codesHref({ groupCode: "EMP", manageOwnerCode: "PLATFORM_FIXED", page: 2 }), "/code-groups?groupCode=EMP&manageOwnerCode=PLATFORM_FIXED&page=2");
  assert.equal(codesHref({ manageOwnerCode: undefined }), "/code-groups");
  // 둘 다 끔도 주소에 남는다 — 다시 그려져도 체크 모양이 유지되게
  assert.equal(codesHref({ manageOwnerCode: "NONE" }), "/code-groups?manageOwnerCode=NONE");
});
