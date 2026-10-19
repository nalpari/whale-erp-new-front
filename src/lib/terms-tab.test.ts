// node --test src/lib/terms-tab.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { settleTerms, tabOfHash } from "./terms-tab.ts";

const CODES = ["TERMS_SERVICE", "PRIVACY_COLLECT", "STAFF_TERMS_SERVICE"];

test("해시가 약관 유형 코드면 그 탭, 아니면 첫 탭", () => {
  assert.equal(tabOfHash("#PRIVACY_COLLECT", CODES), "PRIVACY_COLLECT");
  for (const hash of ["", "#", "#privacy", "#privacy_collect", "PRIVACY_COLLECT"]) assert.equal(tabOfHash(hash, CODES), "TERMS_SERVICE", hash);
  assert.equal(tabOfHash("#TERMS_SERVICE", []), undefined);
});

test("본문 일부가 실패하면 그 탭만 빼고 순서를 지킨다", () => {
  const boom = new Error("404");
  const { terms, failed } = settleTerms(CODES, [
    { status: "fulfilled", value: "a" },
    { status: "rejected", reason: boom },
    { status: "fulfilled", value: "c" },
  ]);
  assert.deepEqual(terms, ["a", "c"]);
  assert.deepEqual(failed, [{ code: "PRIVACY_COLLECT", reason: boom }]);
});

test("모두 받으면 전부, 모두 실패하거나 목록이 비면 안내(null)", () => {
  const ok = settleTerms(CODES, CODES.map((value) => ({ status: "fulfilled" as const, value })));
  assert.deepEqual(ok, { terms: CODES, failed: [] });
  const allFailed = settleTerms(CODES, CODES.map(() => ({ status: "rejected" as const, reason: "x" })));
  assert.equal(allFailed.terms, null);
  assert.deepEqual(allFailed.failed.map((f) => f.code), CODES);
  assert.deepEqual(settleTerms([], []), { terms: null, failed: [] });
});
