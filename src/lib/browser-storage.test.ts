import assert from "node:assert/strict";
import { test } from "node:test";
import {
  announceStoresChanged,
  clearBpFix,
  clearLoginStorage,
  clearTabBp,
  isStoresChangedFor,
  markBpFix,
  readCodes,
  readCurrentBp,
  readLoginBpInfo,
  readScope,
  readSelectedBp,
  readStores,
  readStoresVersion,
  resolveTab,
  takeBpFix,
  writeCodes,
  writeCurrentBp,
  writeLoginBpInfo,
  writeScope,
  writeSelectedBp,
  writeStores,
  writeStoresVersion,
} from "./browser-storage.ts";

const own = { bpCodeId: 1, bpCode: "BP000000", tradeName: "플랫폼" };
const a = { bpCodeId: 17, bpCode: "BP000017", tradeName: "㈜한강상회" };
const b = { bpCodeId: 21, bpCode: "BP000021", tradeName: "㈜모리푸드" };
const erp = (bp: typeof own) => ({ serviceCode: "WHALE_ERP" as const, bp });
const platform = { serviceCode: "PLATFORM" as const, bp: own };
const base = { ownBp: own, isPlatform: true, pathService: null, queryBpCodeId: null, current: null, selectedBp: null };

test("resolveTab: 고객 BP 계정은 무엇이 남아 있어도 ERP · 자기 BP", () => {
  assert.deepEqual(resolveTab({ ...base, isPlatform: false, pathService: "PLATFORM", queryBpCodeId: 17, current: erp(a), selectedBp: a }), erp(own));
});

test("resolveTab: ?bp= 가 마지막으로 고른 BP 면 이 탭 값보다 앞서 그 BP 의 ERP", () => {
  assert.deepEqual(resolveTab({ ...base, queryBpCodeId: 21, current: erp(a), selectedBp: b }), erp(b));
});

test("resolveTab: ?bp= 가 자기 BP 면 플랫폼", () => {
  assert.deepEqual(resolveTab({ ...base, queryBpCodeId: 1, current: erp(a), selectedBp: b }), platform);
});

test("resolveTab: 이름을 모르는 ?bp= 는 무시하고 이 탭 값을 쓴다(새로고침 · 탭 복제)", () => {
  assert.deepEqual(resolveTab({ ...base, queryBpCodeId: 99, current: erp(a), selectedBp: b }), erp(a));
  assert.deepEqual(resolveTab({ ...base, pathService: "WHALE_ERP", current: platform, selectedBp: b }), platform);
});

test("resolveTab: 탭 값이 없는 새 탭은 ERP 주소면 마지막으로 고른 BP, 그 밖은 플랫폼", () => {
  assert.deepEqual(resolveTab({ ...base, pathService: "WHALE_ERP", selectedBp: b }), erp(b));
  assert.deepEqual(resolveTab({ ...base, pathService: "WHALE_ERP" }), platform);
  assert.deepEqual(resolveTab({ ...base, pathService: "PLATFORM", selectedBp: b }), platform);
  assert.deepEqual(resolveTab({ ...base, pathService: null, selectedBp: b }), platform);
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
  writeCurrentBp("old", erp(a));
  writeStores(a.bpCodeId, []);
  writeCodes(a.bpCodeId, {});
  writeScope(a.bpCodeId, { type: "ALL" });
  // 지금은 쓰지 않는 앞 값(목록에서 고른 점포)도 함께 지운다
  tab.setItem("whale-erp:v2:store-picks", JSON.stringify({ bpCodeId: a.bpCodeId, url: "/stores", stores: [] }));
  assert.equal(readCurrentBp("new"), null);
  assert.deepEqual(tab.keys(), []);
});

test("readCurrentBp: 같은 로그인이면 서비스와 loginKey 를 뺀 BP 를 준다", () => {
  fresh();
  writeCurrentBp("k", erp(a));
  assert.deepEqual(readCurrentBp("k"), erp(a));
});

test("readCurrentBp: 서비스가 없는 옛 값은 버린다", () => {
  const { tab } = fresh();
  tab.setItem("whale-erp:v2:current-bp", JSON.stringify({ loginKey: "k", ...a }));
  assert.equal(readCurrentBp("k"), null);
  assert.deepEqual(tab.keys(), []);
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

test("stores-version: 탭 값이라 bpCodeId 가 다르면 null 이고, 앞 로그인의 탭 값을 버릴 때 함께 지운다", () => {
  const { tab } = fresh();
  writeCurrentBp("old", erp(a));
  writeStoresVersion(a.bpCodeId, "v1");
  assert.equal(readStoresVersion(a.bpCodeId), "v1");
  assert.equal(readStoresVersion(b.bpCodeId), null);
  assert.equal(readCurrentBp("new"), null);
  assert.deepEqual(tab.keys(), []);
});

test("writeStores: 목록을 바꾸면 그 목록의 버전이 아니므로 버전을 지운다", () => {
  fresh();
  writeStoresVersion(a.bpCodeId, "v1");
  assert.equal(writeStores(a.bpCodeId, []), true);
  assert.equal(readStoresVersion(a.bpCodeId), null);
});

test("stores-changed: 같은 로그인 · 같은 BP 의 알림만 받고, 로그인 정보와 함께 지운다", () => {
  const { local } = fresh();
  announceStoresChanged("k", a.bpCodeId);
  const raw = local.getItem("whale-erp:v2:stores-changed");
  assert.equal(isStoresChangedFor(raw, "k", a.bpCodeId), true);
  assert.equal(isStoresChangedFor(raw, "other", a.bpCodeId), false);
  assert.equal(isStoresChangedFor(raw, "k", b.bpCodeId), false);
  assert.equal(isStoresChangedFor(null, "k", a.bpCodeId), false);
  assert.equal(isStoresChangedFor("{", "k", a.bpCodeId), false);
  // 객체가 아닌 JSON · 문자열 BP 번호도 받지 않는다
  for (const odd of ["null", "[]", '"x"']) assert.equal(isStoresChangedFor(odd, "k", a.bpCodeId), false, odd);
  assert.equal(isStoresChangedFor(JSON.stringify({ loginKey: "k", bpCodeId: String(a.bpCodeId) }), "k", a.bpCodeId), false);
  clearLoginStorage();
  assert.equal(local.getItem("whale-erp:v2:stores-changed"), null);
});

test("bp-fix: 고쳐 보낸 주소로 다시 오면 한 번만 true 이고 표시를 지운다", () => {
  const { tab } = fresh();
  assert.equal(takeBpFix("/bp/124/x"), false);
  markBpFix("/bp/124/x");
  assert.equal(takeBpFix("/bp/8/x"), false); // 다른 주소는 어긋남이 아니다(표시는 남는다)
  assert.equal(takeBpFix("/bp/124/x"), true);
  assert.equal(takeBpFix("/bp/124/x"), false); // 한 번 쓰면 지워져 정상 재방문을 막지 않는다
  markBpFix("/bp/124/x");
  clearBpFix();
  assert.deepEqual(tab.keys(), []);
});

test("clearTabBp: 탭 값(bp-fix · 고른 점포 포함)만 지우고 공용 로그인 정보는 남긴다", () => {
  const { local, tab } = fresh();
  writeSelectedBp("k", a);
  writeCurrentBp("k", erp(a));
  writeStores(a.bpCodeId, []);
  writeCodes(a.bpCodeId, {});
  writeScope(a.bpCodeId, { type: "ALL" });
  tab.setItem("whale-erp:v2:store-picks", "{}");
  markBpFix("/bp/124/x");
  clearTabBp();
  assert.deepEqual(tab.keys(), []);
  assert.equal(local.keys().length, 1);
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
  writeCurrentBp("k", erp(a));
  tab.setItem("whale-erp:v2:store-picks", "{}");
  markBpFix("/bp/124/x");
  // 앞 버전(v1) 키도 남기지 않는다 — 로그인 정보가 들어 있다
  local.setItem("whale-erp:v1:login-info", "{}");
  local.setItem("whale-erp:v1:login-bp-info", "{}");
  local.setItem("whale-erp:v1:selected-bp", "{}");
  tab.setItem("whale-erp:v1:current-bp", "{}");
  tab.setItem("whale-erp:v1:scope", "{}");
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
