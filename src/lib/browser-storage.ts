// 로그인 정보를 브라우저에 두는 곳. 키·모양·확인을 여기 한 곳에서 한다(2026-10-13 계획).
// localStorage — 모든 탭이 같이 쓴다. loginKey 가 쿠키 login-key 와 다르면 앞 로그인 것이라 버린다.
//   login-info: 계정·메뉴 / login-bp-info: 자기 BP 의 점포·공통코드(탭에 자기 BP 값이 없을 때 — 새 탭, /bp-switch 로 자기 BP 에 돌아올 때 — 만 읽는다) / selected-bp: 플랫폼 계정이 마지막으로 고른 BP
// sessionStorage — 탭마다 다르다. 화면은 이것만 읽는다.
//   current-bp: 이 탭의 서비스(WHALE_ERP·PLATFORM)와 BP / stores·codes·scope: 그 BP 의 값. bpCodeId 가 이 탭의 BP 와 다르면 버린다.
//   stores-version: 이 탭의 stores 를 받을 때의 점포 목록 버전(GET /bp-codes/{id}/stores-version). 없으면 아직 맞춰 보지 않은 것이다.
// stores-changed(localStorage): 한 탭이 점포 목록이 바뀐 것을 알면 적는다 — 같은 BP 의 다른 탭이 storage 이벤트로 받아 바로 다시 맞춘다.
//   store-picks: 2026-10-21 에 없앴다(목록에서 고른 점포는 주소의 storeIds). 앞서 쓰던 값을 지우려고 키만 남긴다(TAB_KEYS).
//   bp-fix: BP · 가맹 계정이 남의 BP 주소로 와서 소속 BP 로 고쳐 보낸 표시(들어온 주소). 같은 주소로 다시 오면 쿠키와 로그인 정보가 어긋난 것이다.
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
/** 공통코드 SERVICE 에는 POS·KIOSK 도 있다. 관리자 웹이 여는 두 서비스만 받는다. */
const isServiceCode = (v: unknown): v is ServiceCode => v === "WHALE_ERP" || v === "PLATFORM";
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
// v2(2026-10-19): 1팀 메뉴 url 이 한 단계 경로로 바뀌어(api #70) 옛 login-info 의 메뉴 url 로는 헤더 · 화면 권한이 맞지 않는다.
const PREFIX = "whale-erp:v2:";
const KEY = {
  loginInfo: `${PREFIX}login-info`,
  loginBpInfo: `${PREFIX}login-bp-info`,
  selectedBp: `${PREFIX}selected-bp`,
  currentBp: `${PREFIX}current-bp`,
  stores: `${PREFIX}stores`,
  storesVersion: `${PREFIX}stores-version`,
  storesChanged: `${PREFIX}stores-changed`,
  codes: `${PREFIX}codes`,
  scope: `${PREFIX}scope`,
  /** 지금은 쓰지 않는다 — 목록에서 고른 점포는 주소(storeIds)에 둔다(2026-10-21). 로그아웃하거나 앞 로그인의 탭 값을 버릴 때 함께 지우려고 키만 둔다 */
  storePicks: `${PREFIX}store-picks`,
  bpFix: `${PREFIX}bp-fix`,
} as const;
const TAB_KEYS = [KEY.currentBp, KEY.stores, KEY.storesVersion, KEY.codes, KEY.scope, KEY.storePicks, KEY.bpFix];
// 앞 버전의 키 — 읽지는 않지만 로그인 정보(아이디 · 이름 · 이메일 · 메뉴 권한 · 점포)가 들어 있어 로그아웃할 때 함께 지운다(공용 PC).
const LEGACY_PREFIXES = ["whale-erp:v1:"];
const LEGACY_KEYS = LEGACY_PREFIXES.flatMap((p) => Object.values(KEY).map((k) => p + k.slice(PREFIX.length)));
/** 다른 탭이 로그인·로그아웃했는지 storage 이벤트로 알아챌 때 보는 키. */
export const LOGIN_INFO_KEY = KEY.loginInfo;
/** 다른 탭이 점포 목록이 바뀐 것을 알렸는지 storage 이벤트로 알아챌 때 보는 키. */
export const STORES_CHANGED_KEY = KEY.storesChanged;

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
  if (v && v.loginKey === loginKey && isServiceCode(v.serviceCode) && typeof v.bpCodeId === "number") return { serviceCode: v.serviceCode, bp: pickBp(v) };
  if (v) remove(tab, TAB_KEYS);
  return null;
}
export const writeCurrentBp = (loginKey: string, { serviceCode, bp }: TabContext) =>
  write(tab, KEY.currentBp, { loginKey, serviceCode, ...pickBp(bp) });

export const readStores = (bpCodeId: number) => ofBp(read<{ bpCodeId: number; items: AdminStore[] }>(tab, KEY.stores), bpCodeId)?.items ?? null;
export const writeStores = (bpCodeId: number, items: AdminStore[]) => write(tab, KEY.stores, { bpCodeId, items });
export const readStoresVersion = (bpCodeId: number) => ofBp(read<{ bpCodeId: number; version: string }>(tab, KEY.storesVersion), bpCodeId)?.version ?? null;
export const writeStoresVersion = (bpCodeId: number, version: string) => write(tab, KEY.storesVersion, { bpCodeId, version });
/** 점포 목록이 바뀐 것을 다른 탭에 알린다 — 같은 값을 다시 적으면 이벤트가 오지 않아 시각을 함께 적는다 */
export const announceStoresChanged = (loginKey: string, bpCodeId: number) => write(local, KEY.storesChanged, { loginKey, bpCodeId, at: Date.now() });
/** storage 이벤트의 새 값이 이 로그인 · 이 BP 의 알림인가 */
export function isStoresChangedFor(raw: string | null, loginKey: string, bpCodeId: number): boolean {
  try {
    const v = raw ? (JSON.parse(raw) as { loginKey?: unknown; bpCodeId?: unknown }) : null;
    return v?.loginKey === loginKey && v.bpCodeId === bpCodeId;
  } catch {
    return false;
  }
}
export const readCodes = (bpCodeId: number) => ofBp(read<{ bpCodeId: number; codes: Codes }>(tab, KEY.codes), bpCodeId)?.codes ?? null;
export const writeCodes = (bpCodeId: number, codes: Codes) => write(tab, KEY.codes, { bpCodeId, codes });
export const readScope = (bpCodeId: number) => ofBp(read<{ bpCodeId: number; scope: Scope }>(tab, KEY.scope), bpCodeId)?.scope ?? null;
export const writeScope = (bpCodeId: number, scope: Scope) => write(tab, KEY.scope, { bpCodeId, scope });
// bp-fix: BP · 가맹 계정이 남의 BP 주소로 와 소속 BP 로 고쳐 보낸 주소(SessionGate fixBpPath). 같은 주소로 다시 오면 쿠키와 로그인 정보가 어긋난 것이다.
export const markBpFix = (pathname: string) => write(tab, KEY.bpFix, pathname);
/** 이 주소를 고쳐 보낸 적이 있는가 — 있으면 표시를 지우고 true. */
export function takeBpFix(pathname: string): boolean {
  const seen = read<string>(tab, KEY.bpFix) === pathname;
  if (seen) remove(tab, [KEY.bpFix]);
  return seen;
}
export const clearBpFix = () => remove(tab, [KEY.bpFix]);
/** 이 탭의 값(TAB_KEYS — BP · 점포 · 공통코드 · 범위 · 옛 store-picks · bp-fix)을 모두 지운다. 다음 준비가 주소로 다시 정한다(열 수 없는 BP 에서 플랫폼으로 돌아갈 때). */
export const clearTabBp = () => remove(tab, TAB_KEYS);

/** 로그인 화면에서 부른다. 이 탭과 공용 저장소의 로그인 정보를 지운다(아이디 저장 whale-erp:saved-login-id 는 남긴다). 앞 버전 키도 지운다. */
export function clearLoginStorage() {
  remove(local, [KEY.loginInfo, KEY.loginBpInfo, KEY.selectedBp, KEY.storesChanged, ...LEGACY_KEYS]);
  remove(tab, [...TAB_KEYS, ...LEGACY_KEYS]);
}

function pickBp({ bpCodeId, bpCode, tradeName }: StoredBp): StoredBp {
  return { bpCodeId, bpCode, tradeName };
}

/**
 * 이 탭이 어느 서비스·BP 로 일할지. 고객 BP 계정은 늘 ERP · 자기 BP 다.
 * 플랫폼 계정은 ?bp= → 이 탭의 값(새로고침·탭 복제) → 주소가 속한 메뉴의 서비스 순서다.
 * - queryBpCodeId 는 BP 이동 화면(/bp-switch)의 ?bp= 다(다른 주소의 것은 부르는 쪽 prepare 가 넘기지 않는다).
 *   BP 선택 팝업이 연 주소는 서버에서 찾은 그 BP 가 selectedBp 로 함께 오고, 플랫폼관리 바로가기는 자기 BP 를 싣는다.
 *   둘 다 아니면 이름을 알 수 없어 무시한다.
 * - 탭 값이 없는 새 탭(주소 직접 입력·즐겨찾기)은 ERP 메뉴 주소면 마지막으로 고른 BP 의 ERP, 그 밖은 자기 BP 의 플랫폼이다.
 *   고른 BP 가 없는데 ERP 주소면 플랫폼으로 열려 메뉴 권한 확인이 막고 이전 화면(없으면 플랫폼 첫 주소 /platform)으로 보낸다.
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
