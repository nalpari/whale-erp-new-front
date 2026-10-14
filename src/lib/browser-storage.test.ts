import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearLoginStorage,
  readCodes,
  readCurrentBp,
  readLoginBpInfo,
  readScope,
  readSelectedBp,
  readStores,
  resolveBp,
  writeCodes,
  writeCurrentBp,
  writeLoginBpInfo,
  writeScope,
  writeSelectedBp,
  writeStores,
} from "./browser-storage.ts";

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

// 저장값 버리기 규칙. Node 에는 localStorage·sessionStorage 가 없어 Map 으로 만든 가짜를 넣는다(browser-storage 는 부를 때마다 전역을 읽는다).
class FakeStorage {
  private m = new Map<string, string>();
  getItem = (k: string) => this.m.get(k) ?? null;
  setItem = (k: string, v: string) => void this.m.set(k, v);
  removeItem = (k: string) => void this.m.delete(k);
  keys = () => [...this.m.keys()];
}
const fresh = () => {
  const local = new FakeStorage();
  const tab = new FakeStorage();
  Object.assign(globalThis, { localStorage: local, sessionStorage: tab });
  return { local, tab };
};

test("readCurrentBp: 앞 로그인의 탭 BP 면 null 을 주고 탭 값을 모두 지운다", () => {
  const { tab } = fresh();
  writeCurrentBp("old", a);
  writeStores(a.bpCodeId, []);
  writeCodes(a.bpCodeId, {});
  writeScope(a.bpCodeId, { type: "ALL" });
  assert.equal(readCurrentBp("new"), null);
  assert.deepEqual(tab.keys(), []);
});

test("readCurrentBp: 같은 로그인이면 loginKey 를 뺀 BP 를 준다", () => {
  fresh();
  writeCurrentBp("k", a);
  assert.deepEqual(readCurrentBp("k"), a);
});

test("탭 값은 bpCodeId 가 다르면 null", () => {
  fresh();
  writeStores(a.bpCodeId, []);
  writeCodes(a.bpCodeId, {});
  writeScope(a.bpCodeId, { type: "DIRECT" });
  assert.deepEqual(readScope(a.bpCodeId), { type: "DIRECT" });
  assert.equal(readStores(b.bpCodeId), null);
  assert.equal(readCodes(b.bpCodeId), null);
  assert.equal(readScope(b.bpCodeId), null);
});

test("공용 값은 loginKey 가 다르면 null", () => {
  fresh();
  writeLoginBpInfo({ loginKey: "k", bpCodeId: 1, stores: [], codes: {} });
  writeSelectedBp("k", a);
  assert.equal(readLoginBpInfo("other"), null);
  assert.equal(readSelectedBp("other"), null);
  assert.equal(readLoginBpInfo("k")?.bpCodeId, 1);
  assert.equal(readSelectedBp("k")?.bpCodeId, a.bpCodeId);
});

test("clearLoginStorage: 로그인 정보만 지우고 아이디 저장은 남긴다", () => {
  const { local, tab } = fresh();
  local.setItem("whale-erp:saved-login-id", "whaleadmin");
  writeSelectedBp("k", a);
  writeCurrentBp("k", a);
  clearLoginStorage();
  assert.deepEqual(local.keys(), ["whale-erp:saved-login-id"]);
  assert.deepEqual(tab.keys(), []);
});

test("깨진 JSON 이나 저장소 예외는 null 로 받고 밖으로 던지지 않는다", () => {
  const { local } = fresh();
  writeSelectedBp("k", a);
  local.setItem(local.keys()[0], "{깨짐");
  assert.equal(readSelectedBp("k"), null);
  Object.assign(globalThis, { localStorage: { getItem: () => { throw new Error("blocked"); } } });
  assert.equal(readSelectedBp("k"), null);
});
