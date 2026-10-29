// node --test src/app/staff-members/export/bulk-export-model.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminStore } from "../../../lib/session.ts";
import { bulkExportViewOf, canBulkExport, hasMaking, isScopeMaking, previewPathOf, requestBlockOf, scopeTextOf, storeIdsOfScope, type BulkExport } from "./bulk-export-model.ts";

const store = (storeId: number, storeTypeCode: string, storeStatusCode = "OPEN", name = `점포${storeId}`): AdminStore => ({
  storeId,
  storeCode: `S${storeId}`,
  name,
  storeTypeCode,
  storeStatusCode,
});
const stores = [store(1, "DIRECT"), store(2, "FRANCHISE"), store(3, "DIRECT", "CLOSED"), store(4, "FRANCHISE", "OPEN", "강남점")];

test("BP 마스터 · 가맹마스터만 쓴다", () => {
  assert.deepEqual(["BM", "FM", "BA", "FA", "PM", ""].map(canBulkExport), [true, true, false, false, false, false]);
});

test("업무 범위 → storeIds: 전체는 빈 목록, 직영 · 가맹은 폐점을 뺀 그 유형, 점포 하나는 그 점포", () => {
  assert.deepEqual(storeIdsOfScope({ type: "ALL" }, stores), []);
  assert.deepEqual(storeIdsOfScope({ type: "DIRECT" }, stores), [1]);
  assert.deepEqual(storeIdsOfScope({ type: "FRANCHISE" }, stores), [2, 4]);
  assert.deepEqual(storeIdsOfScope({ type: "STORE", storeId: 3 }, stores), [3]);
});

test("이 탭에서 쓸 수 없는 범위는 전체로 보고 글자도 전체", () => {
  assert.deepEqual(storeIdsOfScope({ type: "STORE", storeId: 99 }, stores), []);
  assert.equal(scopeTextOf({ type: "STORE", storeId: 99 }, stores), "전체 점포");
  assert.deepEqual(storeIdsOfScope({ type: "DIRECT" }, [store(3, "DIRECT", "CLOSED")]), []);
});

test("업무 범위 글자", () => {
  assert.equal(scopeTextOf({ type: "ALL" }, stores), "전체 점포");
  assert.equal(scopeTextOf({ type: "DIRECT" }, stores), "직영 전체");
  assert.equal(scopeTextOf({ type: "FRANCHISE" }, stores), "가맹 전체");
  assert.equal(scopeTextOf({ type: "STORE", storeId: 4 }, stores), "강남점");
});

test("미리 보기 주소는 storeIds 를 되풀이해 싣고, 빈 목록이면 쿼리가 없다", () => {
  assert.equal(previewPathOf([]), "/staff-members/bulk-exports/preview");
  assert.equal(previewPathOf([1, 2]), "/staff-members/bulk-exports/preview?storeIds=1&storeIds=2");
});

const item = (over: Partial<BulkExport>): BulkExport => ({
  bulkExportId: 1,
  requestedAt: "2026-10-29T05:12:00Z",
  requesterName: "정하윤",
  staffCount: 71,
  storeIds: [],
  status: "SUCCEEDED",
  completedAt: "2026-10-29T05:20:00Z",
  expiresAt: "2026-11-05T05:20:00Z",
  isExpired: false,
  failureReason: null,
  ...over,
});

test("상태: 대기 · 만드는 중은 만드는 중, 다 만든 것은 기한(한국 날짜 MM-DD) 또는 기한 지남, 실패", () => {
  assert.deepEqual(bulkExportViewOf(item({ status: "PENDING" })), { kind: "making" });
  assert.deepEqual(bulkExportViewOf(item({ status: "PROCESSING" })), { kind: "making" });
  assert.deepEqual(bulkExportViewOf(item({})), { kind: "ready", until: "11-05" });
  // UTC 로는 전날 15시지만 한국 시간으로는 다음 날이다
  assert.deepEqual(bulkExportViewOf(item({ expiresAt: "2026-11-04T15:30:00Z" })), { kind: "ready", until: "11-05" });
  assert.deepEqual(bulkExportViewOf(item({ isExpired: true })), { kind: "expired" });
  assert.deepEqual(bulkExportViewOf(item({ status: "FAILED", failureReason: "x" })), { kind: "failed" });
});

test("만드는 중인 줄이 있으면 다시 읽는다", () => {
  assert.equal(hasMaking([item({}), item({ status: "FAILED" })]), false);
  assert.equal(hasMaking([item({}), item({ status: "PENDING" })]), true);
  assert.equal(hasMaking([]), false);
});

test("요청을 막는 까닭: 대상 0명이 먼저, 그다음 만드는 중", () => {
  const preview = { storeCount: 4, staffCount: 71, employedCount: 63, retiredCount: 8, inProgress: false };
  assert.equal(requestBlockOf(preview), null);
  assert.equal(requestBlockOf({ ...preview, staffCount: 0, inProgress: true }), "업무 범위에 담을 직원 자료가 없습니다");
  assert.match(requestBlockOf({ ...preview, inProgress: true }) ?? "", /만드는 중/);
});

test("같은 범위를 만드는 중인지는 점포 id 묶음으로 본다(순서 무시)", () => {
  const items = [item({ status: "PROCESSING", storeIds: [2, 1] }), item({ status: "FAILED", storeIds: [3] })];
  assert.equal(isScopeMaking(items, [1, 2]), true);
  assert.equal(isScopeMaking(items, [3]), false);
  assert.equal(isScopeMaking(items, []), false);
  assert.equal(isScopeMaking([item({ status: "PENDING" })], []), true);
});
