// node --test src/lib/bulk-upload.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { BULK_TEMPLATE_ONLY, bulkFileError, errorFileNameOf, isBulkAction, isBulkBusy, isBulkPreview, isBulkResource } from "./bulk-upload.ts";

test("자원 · 동작은 목록 안의 것만 — 중계 경로가 api 의 다른 경로로 새지 않게", () => {
  assert.equal(isBulkResource("facilities"), true);
  assert.equal(isBulkResource("stores"), false);
  assert.equal(isBulkResource("../auth"), false);
  assert.equal(isBulkAction("validations"), true);
  assert.equal(isBulkAction("toString"), false);
  assert.equal(isBulkAction("constructor"), false);
  assert.equal(isBulkAction("__proto__"), false);
});

test("파일 — .xlsx 만, 빈 파일 · 너무 큰 파일은 막는다", () => {
  assert.equal(bulkFileError({ name: "양식.xlsx", size: 2000 }), null);
  assert.equal(bulkFileError({ name: "양식.XLSX", size: 2000 }), null);
  assert.equal(bulkFileError({ name: "양식.xls", size: 2000 }), BULK_TEMPLATE_ONLY);
  assert.equal(bulkFileError({ name: "양식.xlsx", size: 0 }), BULK_TEMPLATE_ONLY);
  assert.equal(bulkFileError({ name: "양식.xlsx", size: 5 * 1024 * 1024 }), null);
  assert.ok(bulkFileError({ name: "양식.xlsx", size: 5 * 1024 * 1024 + 1 }));
});

test("요청 몰림 — 503 + BULK_BUSY 만 저장 안 됨으로 확정, code 없는 503 · 다른 상태는 아니다", () => {
  assert.equal(isBulkBusy(503, { code: "BULK_BUSY", message: "몰림" }), true);
  assert.equal(isBulkBusy(503, { message: "Service Unavailable" }), false);
  assert.equal(isBulkBusy(503, null), false);
  assert.equal(isBulkBusy(500, { code: "BULK_BUSY" }), false);
});

test("미리보기 모양 검사", () => {
  const ok = { fileName: "a.xlsx", totalCount: 1, validCount: 0, errorCount: 1, columns: [{ key: "name", label: "이름" }], rows: [{ rowNumber: 2, isValid: false, values: { name: "x" }, errors: ["이름: 비었음"] }] };
  assert.equal(isBulkPreview(ok), true);
  assert.equal(isBulkPreview({ ...ok, rows: [{ rowNumber: "2" }] }), false);
  assert.equal(isBulkPreview(null), false);
});

test("오류 파일 이름", () => {
  assert.equal(errorFileNameOf("성수점.xlsx"), "성수점_오류.xlsx");
});
