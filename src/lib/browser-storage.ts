// 로그인 정보를 브라우저에 두는 곳. 키·모양·확인을 여기 한 곳에서 한다(2026-10-13 계획).
// localStorage — 모든 탭이 같이 쓴다. loginKey 가 쿠키 login-key 와 다르면 앞 로그인 것이라 버린다.
//   login-info: 계정·메뉴 / login-bp-info: 자기 BP 의 점포·공통코드(새 탭에 복사할 때만 읽는다) / selected-bp: 플랫폼 계정이 마지막으로 고른 BP
// sessionStorage — 탭마다 다르다. 화면은 이것만 읽는다.
//   current-bp: 이 탭의 서비스(WHALE_ERP·PLATFORM)와 BP / stores·codes·scope: 그 BP 의 값. bpCodeId 가 이 탭의 BP 와 다르면 버린다.
//   서비스와 BP 는 짝이 맞아야 해서(플랫폼 서비스 = 플랫폼 BP, ERP 서비스 = 고객 BP) 한 키에 함께 둔다.
// next/* 를 import 하지 않는다 — node --test 로 resolveTab 을 바로 돌리기 위해서다.
import type { AdminMenu, AdminStore, Codes, LoginInfoAccount } from "./session";

export interface StoredBp {
  bpCodeId: number;
  bpCode: string;
  tradeName: string;
}
/** 서비스 — 공통코드 SERVICE. 탭마다 하나이고 헤더 메뉴·홈·메뉴 권한 확인이 이것을 본다. */
export type ServiceCode = "WHALE_ERP" | "PLATFORM";
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
type StoredCurrentBp = StoredBp & { loginKey: string; serviceCode: ServiceCode };
/** 이 탭이 무엇으로 일하는가. */
export interface TabContext {
  serviceCode: ServiceCode;
  bp: StoredBp;
}

// 저장 모양을 바꾸는 배포에서는 숫자를 올린다. 옛 값은 읽히지 않고 SessionGate 가 login-info 를 다시 받는다
// (그때 플랫폼 계정이 다른 BP 로 연 탭은 자기 BP 로 돌아간다). 모양만 바꾸고 숫자를 그대로 두면 옛 값으로 화면이 깨진다.
const PREFIX = "whale-erp:v1:";
const KEY = {
  loginInfo: `${PREFIX}login-info`,
  loginBpInfo: `${PREFIX}login-bp-info`,
  selectedBp: `${PREFIX}selected-bp`,
  currentBp: `${PREFIX}current-bp`,
  stores: `${PREFIX}stores`,
  codes: `${PREFIX}codes`,
  scope: `${PREFIX}scope`,
} as const;
const TAB_KEYS = [KEY.currentBp, KEY.stores, KEY.codes, KEY.scope];
/** 다른 탭이 로그인·로그아웃했는지 storage 이벤트로 알아챌 때 보는 키. */
export const LOGIN_INFO_KEY = KEY.loginInfo;

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

/** 이 탭의 서비스와 BP. 앞 로그인의 것이거나 서비스가 없으면 탭 값(BP·점포·공통코드·범위)을 모두 지우고 null. */
export function readCurrentBp(loginKey: string): TabContext | null {
  const v = read<StoredCurrentBp>(tab, KEY.currentBp);
  if (v && v.loginKey === loginKey && v.serviceCode) return { serviceCode: v.serviceCode, bp: pickBp(v) };
  if (v) remove(tab, TAB_KEYS);
  return null;
}
export const writeCurrentBp = (loginKey: string, { serviceCode, bp }: TabContext) =>
  write(tab, KEY.currentBp, { loginKey, serviceCode, ...pickBp(bp) });

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
 * 이 탭이 어느 서비스·BP 로 일할지. 고객 BP 계정은 늘 ERP · 자기 BP 다.
 * 플랫폼 계정은 ?bp= → 이 탭의 값(새로고침·탭 복제) → 주소가 속한 메뉴의 서비스 순서다.
 * - ?bp= 는 BP 선택기가 새 탭을 열 때 붙인다. 자기 BP 도 마지막으로 고른 BP 도 아니면 이름을 알 수 없어 무시한다(옛 북마크 등).
 * - 탭 값이 없는 새 탭(주소 직접 입력·즐겨찾기)은 ERP 메뉴 주소면 마지막으로 고른 BP 의 ERP, 그 밖은 자기 BP 의 플랫폼이다.
 *   고른 BP 가 없는데 ERP 주소면 플랫폼으로 열려 메뉴 권한 확인이 막고 플랫폼 홈으로 보낸다.
 */
export function resolveTab(o: {
  ownBp: StoredBp;
  isPlatform: boolean;
  pathService: ServiceCode | null;
  queryBpCodeId: number | null;
  current: TabContext | null;
  selectedBp: StoredBp | null;
}): TabContext {
  const platform = { serviceCode: "PLATFORM", bp: o.ownBp } as const;
  if (!o.isPlatform) return { serviceCode: "WHALE_ERP", bp: o.ownBp };
  if (o.queryBpCodeId === o.ownBp.bpCodeId) return platform;
  if (o.queryBpCodeId !== null && o.selectedBp?.bpCodeId === o.queryBpCodeId) return { serviceCode: "WHALE_ERP", bp: o.selectedBp };
  if (o.current) return o.current;
  if (o.pathService === "WHALE_ERP" && o.selectedBp) return { serviceCode: "WHALE_ERP", bp: o.selectedBp };
  return platform;
}
