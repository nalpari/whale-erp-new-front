// node --test src/lib/address-keyword.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanAddressKeyword } from "./address-keyword.ts";

test("특수문자 · SQL 예약어는 빼고 보낸다 — API 가 E0012 · E0013 으로 거절한다", () => {
  assert.equal(cleanAddressKeyword("테헤란로 152%"), "테헤란로 152");
  assert.equal(cleanAddressKeyword("서울 강남구; DROP TABLE"), "서울 강남구 TABLE");
  assert.equal(cleanAddressKeyword(`a'b"c`), "a b c");
});

test("낱말 안의 예약어 글자 · 지번 하이픈은 그대로 둔다", () => {
  assert.equal(cleanAddressKeyword("Orchard Road"), "Orchard Road");
  assert.equal(cleanAddressKeyword("selection"), "selection");
  assert.equal(cleanAddressKeyword("역삼동 12-3"), "역삼동 12-3");
});

test("공백을 줄이고 80자까지", () => {
  assert.equal(cleanAddressKeyword("  a  "), "a");
  assert.equal(cleanAddressKeyword("가".repeat(90)).length, 80);
});
