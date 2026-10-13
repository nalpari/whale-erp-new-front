import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveBp } from "./browser-storage.ts";

const own = { bpCodeId: 1, bpCode: "BP000000", tradeName: "플랫폼" };
const a = { bpCodeId: 17, bpCode: "BP000017", tradeName: "㈜한강상회" };
const b = { bpCodeId: 21, bpCode: "BP000021", tradeName: "㈜모리푸드" };
const base = { ownBp: own, isPlatform: true, area: "erp" as const, queryBpCodeId: null, currentBp: null, selectedBp: null };

test("resolveBp: 고객 BP 계정은 무엇이 남아 있어도 자기 BP", () => {
  assert.deepEqual(resolveBp({ ...base, isPlatform: false, queryBpCodeId: 17, currentBp: a, selectedBp: a }), own);
});

test("resolveBp: 플랫폼 관리 화면은 자기 BP", () => {
  assert.deepEqual(resolveBp({ ...base, area: "platform", currentBp: a, selectedBp: a }), own);
});

test("resolveBp: ?bp= 가 마지막으로 고른 BP 면 이 탭의 BP 보다 앞선다", () => {
  assert.deepEqual(resolveBp({ ...base, queryBpCodeId: 21, currentBp: a, selectedBp: b }), b);
});

test("resolveBp: ?bp= 가 자기 BP 면 자기 BP", () => {
  assert.deepEqual(resolveBp({ ...base, queryBpCodeId: 1, currentBp: a, selectedBp: b }), own);
});

test("resolveBp: 이름을 모르는 ?bp= 는 무시하고 이 탭 → 고른 BP → 자기 BP", () => {
  assert.deepEqual(resolveBp({ ...base, queryBpCodeId: 99, currentBp: a, selectedBp: b }), a);
  assert.deepEqual(resolveBp({ ...base, queryBpCodeId: 99, selectedBp: b }), b);
  assert.deepEqual(resolveBp({ ...base, queryBpCodeId: 99 }), own);
});
