"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/common";
import { logout } from "@/app/actions";
import { bff, BffError, PASSWORD_REQUIRED_EVENT, signOut } from "@/lib/bff";
import { BP_SWITCH_PATH, bpOfSwitchUrl, HOME, isAllowed, menuOfPath, menuPermissionOf, menusOf, serviceOfPath, type MenuAction, type MenuCode } from "@/lib/menus";
import { ForcePasswordDialog } from "./force-password-dialog";
import {
  clearSelectedBp,
  LOGIN_INFO_KEY,
  readCodes,
  readCurrentBp,
  readLoginBpInfo,
  readLoginInfo,
  readScope,
  readSelectedBp,
  readStores,
  resolveTab,
  writeCodes,
  writeCurrentBp,
  writeLoginBpInfo,
  writeLoginInfo,
  writeScope,
  writeSelectedBp,
  writeStores,
  type Scope,
  type ServiceCode,
  type StoredBp,
  type TabContext,
} from "@/lib/browser-storage";
import { LOGIN_KEY_COOKIE, type AdminMenu, type AdminStore, type BpOption, type Codes, type LoginInfo, type LoginInfoAccount } from "@/lib/session";

interface LoginState {
  loginKey: string;
  account: LoginInfoAccount;
  /** 이 탭의 서비스. 플랫폼 계정은 자기 BP 탭이 PLATFORM, 고른 BP 의 탭(BP 선택 팝업이 /bp-switch 로 연 탭, 또는 탭 값 없이 ERP 주소로 연 탭)이 WHALE_ERP 다. 그 밖의 계정은 늘 WHALE_ERP. */
  serviceCode: ServiceCode;
  /** 계정의 메뉴 전체(두 서비스). 화면에는 menusOf 로 이 탭의 서비스만 보인다. */
  menus: AdminMenu[];
  /** 이 탭의 BP. 플랫폼 계정이 고른 BP 면 자기 BP 와 다르다. */
  currentBp: StoredBp;
  stores: AdminStore[];
  codes: Codes;
  scope: Scope;
}

const LoginContext = createContext<(LoginState & { setScope: (scope: Scope) => void }) | null>(null);

function useLogin() {
  const v = use(LoginContext);
  if (!v) throw new Error("SessionGate 안에서만 쓸 수 있습니다");
  return v;
}
export const useAccount = () => useLogin().account;
/** 이 탭의 서비스. 헤더 메뉴·홈·메뉴 권한 확인과 오른쪽 선택기(플랫폼이면 BP, ERP 면 점포 범위)가 이것을 본다. */
export const useService = () => useLogin().serviceCode;
/** 이 탭 서비스의 메뉴 트리(3단계까지). */
export function useMenus() {
  const { menus, serviceCode } = useLogin();
  return menusOf(menus, serviceCode);
}
export const useCurrentBp = () => useLogin().currentBp;
export const useStores = () => useLogin().stores;
/** 그룹의 상세 코드. 없거나 사용하지 않는 그룹은 [] */
export function useCodes(group: string) {
  const codes = useLogin().codes[group];
  // 그룹이 로그인 정보에 없으면 화면은 값(영문)을 그대로 보인다 — 원인을 찾기 어려워 개발 중에만 알린다
  if (!codes && process.env.NODE_ENV === "development") console.warn(`공통코드 그룹 「${group}」이 로그인 정보에 없습니다`);
  return codes ?? [];
}
export function useScope() {
  const { scope, setScope } = useLogin();
  return [scope, setScope] as const;
}
/** 메뉴 권한. 버튼을 보이거나 숨길 때 쓴다 — 실제 판정은 api 가 요청마다 다시 한다. */
export function useMenuRole(menuCode: MenuCode, action: MenuAction) {
  const { menus, serviceCode } = useLogin();
  return menuPermissionOf(menus, serviceCode, menuCode, action);
}
/** 메뉴 코드로 찾은 메뉴의 등록 · 수정 · 삭제 권한. 화면 자기 버튼은 usePagePermission 을 쓰고, 이 훅은 다른 메뉴의 버튼이나 아직 옮기지 않은 화면에만 쓴다. 막는 것은 api 다. */
export function useMenuPermission(menuCode: MenuCode) {
  return { create: useMenuRole(menuCode, "create"), update: useMenuRole(menuCode, "update"), delete: useMenuRole(menuCode, "delete") };
}
/**
 * 지금 화면(주소)의 메뉴 권한 — 메뉴 코드를 적지 않고 주소로 메뉴를 찾는다(menuOfPath, 화면이 열리는 판정과 같은 메뉴).
 * 메뉴가 아닌 화면(홈 · 알림 템플릿)이면 모두 false. 다른 메뉴의 버튼이 섞이면 그 버튼만 메뉴 코드로 찾는다(useMenuRole · useMenuPermission).
 * 조회(read)는 돌려주지 않는다 — menuOfPath 가 조회 권한이 있는 메뉴만 고르므로, 화면이 열렸으면 늘 참이다.
 * 화면은 버튼을 보이거나 숨기기만 한다 — 막는 것은 api 다.
 */
export function usePagePermission() {
  const { menus, serviceCode } = useLogin();
  const permission = menuOfPath(menus, usePathname(), serviceCode)?.permission;
  return { create: !!permission?.create, update: !!permission?.update, delete: !!permission?.delete };
}

const ALL: Scope = { type: "ALL" };

// 다시 시도하면 같은 길로 다시 로그아웃한다.
const LOGOUT_FAILED = { status: "error", message: "로그아웃하지 못했습니다" } as const;

/**
 * 로그인 후 화면의 문. 이 탭의 BP 와 그 BP 의 점포·공통코드가 준비될 때까지 로딩 화면을 보이고, 준비되면 children 을 그린다.
 * /bp-switch?bp= 는 이 탭을 그 BP 로 새로 준비한 뒤(탭에 남은 점포·공통코드를 쓰지 않고, 범위는 전체) 그 서비스의 홈으로 보낸다.
 * 메뉴와 자기 BP 의 점포·공통코드는 로그인할 때의 값을 쓰고 다시 로그인해야 바뀐다(okf/auth.md, 2026-10-13). 고른 BP 의 것은 그 BP 로
 * 탭을 열 때마다 받는다. 데이터 권한은 api 가 요청마다 다시 본다.
 */

export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; value: LoginState }>({
    status: "loading",
  });
  // BP 이동 화면의 로딩 문구. 서버에서 BP 를 확인하면 그 상호와 범위로 바꾼다(적용 안내를 토스트 대신 여기서 한다, 2026-10-19 재영).
  const [switchNotice, setSwitchNotice] = useState("BP 로 이동하는 중입니다");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    prepare((bp) => !cancelled && setSwitchNotice(`${bp.tradeName}(${bp.bpCode}) · 전체 점포로 여는 중입니다`)).then(
      (value) => !cancelled && setState({ status: "ready", value }),
      async (e: unknown) => {
        if (cancelled) return;
        if (e instanceof BffError && e.status === 401) {
          // 세션이 이미 끊겼으면(proxy·BFF 가 쿠키를 지움) 로그인 화면으로 바로 간다. login-key 가 없는 옛 세션만 로그아웃으로 끝낸다.
          if (readLoginKey()) router.replace("/login");
          else if (!(await signOut(logout))) setState(LOGOUT_FAILED);
          return;
        }
        if (e instanceof LoginInfoDeniedError) {
          // 로그인 정보를 볼 수 없는 계정이다. 다시 시도해도 같으므로 안내하고 로그아웃한다.
          alert(e.message);
          if (!(await signOut(logout))) setState(LOGOUT_FAILED);
          return;
        }
        if (e instanceof OtherBpError) {
          // 고른 BP 를 열 수 없다(권한이 바뀌었거나 BP 가 지워졌거나 BP 이동 주소가 틀렸다). 그 BP 가 마지막으로 고른 BP 면
          // 다음 탭이 다시 고르지 않게 지우고, 자기 BP 로 다시 연다. 앞서 잘 고른 BP 는 남긴다.
          // shortcut: 안내는 브라우저 alert 다. 공통 확인 팝업이 생기면 바꾼다.
          console.warn("BP 를 열지 못함", e.bpCodeId, e);
          alert(e.message);
          const loginKey = readLoginKey();
          if (e.bpCodeId !== null && loginKey && readSelectedBp(loginKey)?.bpCodeId === e.bpCodeId) clearSelectedBp();
          location.replace(HOME.PLATFORM); // 다른 BP 는 플랫폼 계정만 연다. 자기 BP(플랫폼)로 다시 연다.
          return;
        }
        console.error(e);
        setState({ status: "error", message: e instanceof BffError ? e.message : "로그인 정보를 불러오지 못했습니다" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, router]);

  if (state.status === "loading") return <Notice>{pathname === BP_SWITCH_PATH ? switchNotice : "불러오는 중입니다"}</Notice>;
  if (state.status === "error")
    return (
      <Notice>
        {state.message}
        <Button
          onClick={() => {
            setState({ status: "loading" });
            setAttempt(attempt + 1);
          }}
        >
          다시 시도
        </Button>
      </Notice>
    );
  return (
    <Ready value={state.value} onChange={(value) => setState({ status: "ready", value })}>
      {children}
    </Ready>
  );
}

function Ready({ value, onChange, children }: { value: LoginState; onChange: (v: LoginState) => void; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const home = HOME[value.serviceCode];
  // BP 이동 화면은 준비만 하는 곳이라 메뉴 확인을 건너뛴다.
  const switching = pathname === BP_SWITCH_PATH;
  // 이 탭 서비스의 화면만 연다. BP·가맹 계정이 플랫폼 주소에 오거나 플랫폼 탭에서 ERP 주소를 치면 여기서 막힌다(데이터는 api 가 다시 막는다).
  const allowed = switching || isAllowed(value.menus, pathname, value.serviceCode);
  // 개발 모드(StrictMode)는 effect 를 두 번 돌린다. 같은 주소에 두 번 안내하고 두 번 뒤로 가지 않게 한다.
  const denied = useRef<string | null>(null);

  // BP 이동 화면은 준비가 끝났으니 그 서비스의 홈으로 바꿔 간다(뒤로 가기에 남지 않게 replace).
  useEffect(() => {
    if (switching) router.replace(home);
  }, [switching, home, router]);

  useEffect(() => {
    // 틀은 화면을 옮겨도 그대로 있다. 열린 화면에 오면 기록을 비워야 같은 막힌 주소에 다시 와도 안내한다.
    if (allowed) {
      denied.current = null;
      return;
    }
    if (denied.current === pathname) return;
    denied.current = pathname;
    // 메뉴에 없는 주소로 바로 들어왔다. 안내하고 들어오기 전 화면으로 돌아간다(2026-10-13 정책, 403 과 같다).
    // 플랫폼 탭에서 ERP 주소로 왔으면 권한이 없는 게 아니라 BP 를 고르지 않은 것이다 — 즐겨찾기 · 주소 입력으로 왔는데 마지막으로 고른 BP 가
    // 없을 때다. 강제 팝업 대신 바로가기에서 고르라고 알린다(2026-10-19 재영).
    // shortcut: 안내는 브라우저 alert 다. 공통 확인 팝업이 생기면 바꾼다.
    const needsBp = value.serviceCode === "PLATFORM" && serviceOfPath(value.menus, pathname) === "WHALE_ERP";
    alert(needsBp ? "웨일ERP 바로가기에서 BP 를 먼저 골라 주세요" : "접근 권한이 없는 메뉴입니다");
    if (history.length > 1) history.back();
    else router.replace(home);
  }, [allowed, home, pathname, router, value.menus, value.serviceCode]);

  const setScope = (scope: Scope) => {
    writeScope(value.currentBp.bpCodeId, scope);
    onChange({ ...value, scope });
    // 범위를 바꾸면 보던 화면에 남지 않고 홈으로 간다(okf/home.md 범위 선택기).
    router.push(home);
  };
  // 강제 변경 표시를 저장값에 쓰고 이 탭에 반영한다. 다른 탭은 새로고침하면 반영된다.
  const setPasswordRequired = (required: boolean) => {
    const account = required
      ? { ...value.account, isPasswordChangeRequired: true }
      : { ...value.account, isPasswordChangeRequired: false, isTermsAgreementRequired: false, temporaryPasswordExpiresAt: null };
    writeLoginInfo({ loginKey: value.loginKey, account, menus: value.menus });
    onChange({ ...value, account });
  };
  // 다른 탭에서 로그아웃하면 로그인 화면으로, 다시 로그인하면(다른 계정 포함) 새 로그인 정보로 다시 연다(정책 B-5).
  // 로그인 화면이 저장값을 지우고, 새 로그인의 첫 탭이 login-info 를 쓰므로 그 키의 변화로 알아챈다. storage 이벤트는 다른 탭에만 온다.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== LOGIN_INFO_KEY) return;
      const loginKey = readLoginKey();
      if (!loginKey) router.replace("/login");
      else if (loginKey !== value.loginKey) location.reload();
    };
    addEventListener("storage", onStorage);
    return () => removeEventListener("storage", onStorage);
  }, [value.loginKey, router]);
  // 변경 전에는 api 가 403 「비밀번호를 변경한 뒤 이용할 수 있습니다」를 준다. 저장값이 어긋났으면 팝업을 다시 띄운다.
  useEffect(() => {
    const reopen = () => !value.account.isPasswordChangeRequired && setPasswordRequired(true);
    addEventListener(PASSWORD_REQUIRED_EVENT, reopen);
    return () => removeEventListener(PASSWORD_REQUIRED_EVENT, reopen);
  });
  const passwordChanged = () => {
    setPasswordRequired(false);
    // 바꾼 뒤에는 이 탭 서비스의 홈으로 다시 연다.
    location.assign(home);
  };
  return (
    <LoginContext value={{ ...value, setScope }}>
      {allowed && !switching ? children : null}
      {value.account.isPasswordChangeRequired && <ForcePasswordDialog account={value.account} onDone={passwordChanged} />}
    </LoginContext>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-[18px] text-[14px] text-erp-muted">
      {children}
    </div>
  );
}

/** 고른 BP 를 열 수 없다. bpCodeId 는 그 BP — 주소가 틀려 BP 를 모르면 null. */
class OtherBpError extends Error {
  constructor(
    message: string,
    readonly bpCodeId: number | null,
  ) {
    super(message);
  }
}
class LoginInfoDeniedError extends Error {}

const readLoginKey = () => document.cookie.match(new RegExp(`(?:^|; )${LOGIN_KEY_COOKIE}=([^;]*)`))?.[1];

/** onSwitchBp — BP 이동 화면에서 서버로 확인한 BP 를 알린다(로딩 문구용). */
async function prepare(onSwitchBp: (bp: StoredBp) => void): Promise<LoginState> {
  const loginKey = readLoginKey();
  // 이 기능 전에 로그인했거나 쿠키가 지워졌다. 세션을 끝내고 다시 로그인하게 한다(/login 으로만 보내면 proxy 가 홈으로 되돌린다).
  if (!loginKey) throw new BffError(401, "다시 로그인해 주세요");

  let info = readLoginInfo(loginKey);
  let bpInfo = readLoginBpInfo(loginKey);
  // 이 로그인에서 처음 열린 탭(또는 저장소가 지워진 브라우저)만 받는다. 그 뒤 탭은 저장한 값을 쓴다.
  if (!info || !bpInfo) {
    const r = await bff<LoginInfo>("/auth/admin/login-info").catch((e: unknown) => {
      if (e instanceof BffError && (e.status === 403 || e.status === 404)) throw new LoginInfoDeniedError(e.message);
      throw e;
    });
    info = { loginKey, account: r.account, menus: r.menus };
    bpInfo = { loginKey, bpCodeId: r.account.bp.bpCodeId, stores: r.stores, codes: r.codes };
    writeLoginInfo(info);
    writeLoginBpInfo(bpInfo);
  }

  const { account } = info;
  const ownBp = { bpCodeId: account.bp.bpCodeId, bpCode: account.bp.bpCode, tradeName: account.bp.tradeName };
  const url = new URL(location.href);
  // 고른 BP 는 BP 이동 화면(/bp-switch?bp=)으로만 받는다. 다른 주소의 ?bp= 는 보지 않는다(bpOfSwitchUrl).
  const switching = url.pathname === BP_SWITCH_PATH;
  const target = bpOfSwitchUrl(url);
  // 이동 화면인데 BP 를 읽지 못했다(잘렸거나 손으로 고친 주소). 플랫폼 계정은 조용히 플랫폼으로 가지 않고 알린다.
  // 그 밖의 계정은 BP 를 고를 수 없어 늘 자기 BP 로 열리므로 그대로 둔다.
  if (switching && !target && account.bp.isPlatform) throw new OtherBpError("BP 이동 주소가 올바르지 않습니다", null);
  // 다른 BP 로 가면 그 BP 를 서버에서 찾는다 — 주소는 id 만 믿는다. 탭들이 같이 쓰는 selected-bp 를 거치지 않아, 이 탭이 준비되는 사이
  // 다른 탭에서 BP 를 또 골라도 이 탭은 주소의 BP 로 열린다. 비밀번호를 바꾸기 전에는 다른 BP 를 열지 않는다(아래).
  const switchBp =
    target && account.bp.isPlatform && !account.isPasswordChangeRequired && target.bpCodeId !== ownBp.bpCodeId ? await findBp(target) : null;
  if (switchBp) onSwitchBp(switchBp);
  // 앞 로그인이 이 탭에 남긴 점포·공통코드·범위는 갈래와 상관없이 여기서 지운다(readCurrentBp). 점포 등은 bpCodeId 로만 갈려 같은 BP 의 다른 계정 값이 읽힌다.
  const current = readCurrentBp(loginKey);
  // 비밀번호를 바꾸기 전에는 다른 BP 조회가 403 이라 자기 BP 로 연다.
  const tab: TabContext = account.isPasswordChangeRequired
    ? { serviceCode: account.bp.isPlatform ? "PLATFORM" : "WHALE_ERP", bp: ownBp }
    : resolveTab({
        ownBp,
        isPlatform: account.bp.isPlatform,
        pathService: serviceOfPath(info.menus, url.pathname),
        queryBpCodeId: target?.bpCodeId ?? null,
        current,
        selectedBp: switchBp ?? readSelectedBp(loginKey),
      });
  const { bp } = tab;

  // BP 로 이동할 때는 탭에 남은 값을 쓰지 않는다 — 다른 BP 는 지금 값을 받고, 자기 BP 는 로그인할 때 받은 값(login-bp-info)이다.
  let stores = switching ? null : readStores(bp.bpCodeId);
  let codes = switching ? null : readCodes(bp.bpCodeId);
  if (!stores || !codes) {
    if (bp.bpCodeId === bpInfo.bpCodeId) {
      ({ stores, codes } = bpInfo);
    } else {
      try {
        const [s, c] = await Promise.all([
          bff<{ items: AdminStore[] }>(`/bp-codes/${bp.bpCodeId}/stores`),
          bff<{ codes: Codes }>(`/bp-codes/${bp.bpCodeId}/code-items`),
        ]);
        ({ items: stores } = s);
        ({ codes } = c);
      } catch (e) {
        if (e instanceof BffError && (e.status === 403 || e.status === 404)) throw new OtherBpError(`${bp.tradeName}: ${e.message}`, bp.bpCodeId);
        throw e;
      }
    }
    writeStores(bp.bpCodeId, stores);
    writeCodes(bp.bpCodeId, codes);
  }
  // 점포·공통코드를 받은 뒤에 쓴다. 먼저 쓰면 받기가 실패한 BP 가 이 탭에 남아, 다시 열 때 같은 BP 를 또 골라 안내가 끝없이 반복된다.
  writeCurrentBp(loginKey, tab);
  // 고른 BP 도 그 BP 의 값을 받은 뒤에 적는다 — 다음에 주소로 여는 탭이 이 BP 를 쓴다. 받기가 실패하면 앞서 고른 BP 가 그대로 남는다.
  if (switchBp) writeSelectedBp(loginKey, switchBp);
  // BP 로 이동하면 범위는 전체에서 시작한다.
  if (switching) writeScope(bp.bpCodeId, ALL);
  // 저장된 점포 범위의 점포가 목록에 없으면 전체로 되돌린다(선택기 표시와 실제 범위가 어긋나지 않게).
  const saved = readScope(bp.bpCodeId);
  const scope = saved?.type === "STORE" && !stores.some((s) => s.storeId === saved.storeId) ? ALL : (saved ?? ALL);
  return { loginKey, account, serviceCode: tab.serviceCode, menus: info.menus, currentBp: bp, stores, codes, scope };
}

/**
 * BP 이동 주소의 BP 를 서버에서 찾는다 — 주소의 bpCode 로 BP 목록을 찾아 id 가 같은 줄의 상호 · 코드를 쓴다(주소의 값을 그대로 믿지 않는다).
 * 코드가 없거나, 찾은 줄의 id 가 다르거나, 볼 수 없으면(403 · 404) OtherBpError.
 */
async function findBp({ bpCodeId, bpCode }: { bpCodeId: number; bpCode: string | null }): Promise<StoredBp> {
  const notFound = new OtherBpError(`BP(${bpCode ?? bpCodeId})를 찾지 못했습니다`, bpCodeId);
  if (!bpCode) throw notFound;
  const query = new URLSearchParams({ keyword: bpCode, page: "1", pageSize: "20" });
  const r = await bff<{ items: BpOption[] }>(`/bp-codes?${query}`).catch((e: unknown) => {
    if (e instanceof BffError && (e.status === 403 || e.status === 404)) throw new OtherBpError(`BP(${bpCode}): ${e.message}`, bpCodeId);
    throw e;
  });
  const found = r.items.find((i) => i.bpCodeId === bpCodeId);
  if (!found) throw notFound;
  return { bpCodeId: found.bpCodeId, bpCode: found.bpCode, tradeName: found.tradeName };
}
