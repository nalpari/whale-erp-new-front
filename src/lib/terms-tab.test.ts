// node --test src/lib/terms-tab.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { tabOfHash } from "./terms-tab.ts";

const CODES = ["TERMS_SERVICE", "PRIVACY_COLLECT", "STAFF_TERMS_SERVICE"];

test("해시가 약관 유형 코드면 그 탭, 아니면 첫 탭", () => {
  assert.equal(tabOfHash("#PRIVACY_COLLECT", CODES), "PRIVACY_COLLECT");
  for (const hash of ["", "#", "#privacy", "#privacy_collect", "PRIVACY_COLLECT"]) assert.equal(tabOfHash(hash, CODES), "TERMS_SERVICE", hash);
  assert.equal(tabOfHash("#TERMS_SERVICE", []), undefined);
});
