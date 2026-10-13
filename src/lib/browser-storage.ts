// 로그인 정보를 브라우저에 두는 곳. 키·모양·확인을 여기 한 곳에서 한다(2026-10-13 계획).
// localStorage — 모든 탭이 같이 쓴다. loginKey 가 쿠키 login-key 와 다르면 앞 로그인 것이라 버린다.
//   login-info: 계정·메뉴 / login-bp-info: 자기 BP 의 점포·공통코드(새 탭에 복사할 때만 읽는다) / selected-bp: 플랫폼 계정이 마지막으로 고른 BP
// sessionStorage — 탭마다 다르다. 화면은 이것만 읽는다.
//   current-bp: 이 탭의 BP / stores·codes·scope: 그 BP 의 값. bpCodeId 가 이 탭의 BP 와 다르면 버린다.
// next/* 를 import 하지 않는다 — node --test 로 resolveBp 를 바로 돌리기 위해서다.
import type { AdminMenu, AdminStore, Codes, LoginInfoAccount } from "./session";

export interface StoredBp {
  bpCodeId: number;
  bpCode: string;
  tradeName: string;
}
export type Scope = { type: "ALL" } | { type: "DIRECT" } | { type: "FRANCHISE" } | { type: "STORE"; storeId: number };

export interface StoredLoginInfo {
  loginKey: string;
  account: LoginInfoAccount;
  menus: AdminMenu[];
}
export interface StoredLoginBpInfo {
  loginKey: string;
  bpCodeId: number;
  stores: AdminStore[];
  codes: Codes;
}
type StoredSelectedBp = StoredBp & { loginKey: string };
// current-bp 에도 loginKey 를 둔다. 다시 로그인하면 다른 탭에 남은 앞 로그인의 BP·점포·공통코드를 버려야 한다.
type StoredCurrentBp = StoredBp & { loginKey: string };

const KEY = {
  loginInfo: "whale-erp:login-info",
  loginBpInfo: "whale-erp:login-bp-info",
  selectedBp: "whale-erp:selected-bp",
  currentBp: "whale-erp:current-bp",
  stores: "whale-erp:stores",
  codes: "whale-erp:codes",
  scope: "whale-erp:scope",
} as const;
const TAB_KEYS = [KEY.currentBp, KEY.stores, KEY.codes, KEY.scope];

// 저장소를 못 쓰는 브라우저(사생활 보호 등)면 읽기는 null, 쓰기는 버린다 — SessionGate 가 login-info 를 다시 받아 화면은 그린다.
function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(storage: () => Storage, key: string, value: unknown) {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {}
}
function remove(storage: () => Storage, keys: string[]) {
  try {
    for (const k of keys) storage().removeItem(k);
  } catch {}
}
const local = () => localStorage;
const tab = () => sessionStorage;

const ofLogin = <T extends { loginKey: string }>(v: T | null, loginKey: string) => (v?.loginKey === loginKey ? v : null);
const ofBp = <T extends { bpCodeId: number }>(v: T | null, bpCodeId: number) => (v?.bpCodeId === bpCodeId ? v : null);

export const readLoginInfo = (loginKey: string) => ofLogin(read<StoredLoginInfo>(local, KEY.loginInfo), loginKey);
export const writeLoginInfo = (v: StoredLoginInfo) => write(local, KEY.loginInfo, v);
export const readLoginBpInfo = (loginKey: string) => ofLogin(read<StoredLoginBpInfo>(local, KEY.loginBpInfo), loginKey);
export const writeLoginBpInfo = (v: StoredLoginBpInfo) => write(local, KEY.loginBpInfo, v);
export const readSelectedBp = (loginKey: string) => ofLogin(read<StoredSelectedBp>(local, KEY.selectedBp), loginKey);
export const writeSelectedBp = (loginKey: string, bp: StoredBp) => write(local, KEY.selectedBp, { loginKey, ...pickBp(bp) });
export const clearSelectedBp = () => remove(local, [KEY.selectedBp]);

/** 이 탭의 BP. 앞 로그인의 것이면 탭 값(BP·점포·공통코드·범위)을 모두 지우고 null. */
export function readCurrentBp(loginKey: string): StoredBp | null {
  const v = read<StoredCurrentBp>(tab, KEY.currentBp);
  if (v && v.loginKey === loginKey) return pickBp(v);
  if (v) remove(tab, TAB_KEYS);
  return null;
}
export const writeCurrentBp = (loginKey: string, bp: StoredBp) => write(tab, KEY.currentBp, { loginKey, ...pickBp(bp) });

export const readStores = (bpCodeId: number) => ofBp(read<{ bpCodeId: number; items: AdminStore[] }>(tab, KEY.stores), bpCodeId)?.items ?? null;
export const writeStores = (bpCodeId: number, items: AdminStore[]) => write(tab, KEY.stores, { bpCodeId, items });
export const readCodes = (bpCodeId: number) => ofBp(read<{ bpCodeId: number; codes: Codes }>(tab, KEY.codes), bpCodeId)?.codes ?? null;
export const writeCodes = (bpCodeId: number, codes: Codes) => write(tab, KEY.codes, { bpCodeId, codes });
export const readScope = (bpCodeId: number) => ofBp(read<{ bpCodeId: number; scope: Scope }>(tab, KEY.scope), bpCodeId)?.scope ?? null;
export const writeScope = (bpCodeId: number, scope: Scope) => write(tab, KEY.scope, { bpCodeId, scope });

/** 로그인 화면에서 부른다. 이 탭과 공용 저장소의 로그인 정보를 지운다(아이디 저장 whale-erp:saved-login-id 는 남긴다). */
export function clearLoginStorage() {
  remove(local, [KEY.loginInfo, KEY.loginBpInfo, KEY.selectedBp]);
  remove(tab, TAB_KEYS);
}

function pickBp({ bpCodeId, bpCode, tradeName }: StoredBp): StoredBp {
  return { bpCodeId, bpCode, tradeName };
}

/**
 * 이 탭이 어느 BP 로 일할지. 고객 BP 계정과 플랫폼 관리 화면은 늘 자기 BP 다.
 * 플랫폼 계정의 ERP 화면은 ?bp= → 이 탭의 BP → 마지막으로 고른 BP → 자기 BP 순서다.
 * ?bp= 는 BP 선택기가 새 탭을 열 때 붙인다. 자기 BP 도 마지막으로 고른 BP 도 아니면 이름을 알 수 없어 무시한다(옛 북마크 등).
 */
export function resolveBp(o: {
  ownBp: StoredBp;
  isPlatform: boolean;
  area: "erp" | "platform";
  queryBpCodeId: number | null;
  currentBp: StoredBp | null;
  selectedBp: StoredBp | null;
}): StoredBp {
  if (!o.isPlatform || o.area === "platform") return o.ownBp;
  if (o.queryBpCodeId === o.ownBp.bpCodeId) return o.ownBp;
  if (o.queryBpCodeId !== null && o.selectedBp?.bpCodeId === o.queryBpCodeId) return o.selectedBp;
  return o.currentBp ?? o.selectedBp ?? o.ownBp;
}
