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
