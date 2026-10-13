"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/common";
import { logout } from "@/app/actions";
import { bff, BffError } from "@/lib/bff";
import {
  clearSelectedBp,
  readCodes,
  readCurrentBp,
  readLoginBpInfo,
  readLoginInfo,
  readScope,
  readSelectedBp,
  readStores,
  resolveBp,
  writeCodes,
  writeCurrentBp,
  writeLoginBpInfo,
  writeLoginInfo,
  writeScope,
  writeStores,
  type Scope,
  type StoredBp,
} from "@/lib/browser-storage";
import { LOGIN_KEY_COOKIE, type AdminMenu, type AdminStore, type Codes, type LoginInfo, type LoginInfoAccount } from "@/lib/session";

type Area = "erp" | "platform";

interface LoginState {
  account: LoginInfoAccount;
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
export const useMenus = () => useLogin().menus;
export const useCurrentBp = () => useLogin().currentBp;
export const useStores = () => useLogin().stores;
/** 그룹의 상세 코드. 없거나 사용하지 않는 그룹은 [] */
export const useCodes = (group: string) => useLogin().codes[group] ?? [];
export function useScope() {
  const { scope, setScope } = useLogin();
  return [scope, setScope] as const;
}
/** 메뉴 권한. 버튼을 보이거나 숨길 때 쓴다 — 실제 판정은 api 가 요청마다 다시 한다. */
export function useCan(menuCode: string, action: keyof AdminMenu["permission"]) {
  return findMenu(useLogin().menus, (m) => m.menuCode === menuCode)?.permission[action] ?? false;
}

const ALL: Scope = { type: "ALL" };
const HOME: Record<Area, string> = { erp: "/home", platform: "/platform" };

/**
 * 로그인 후 화면의 문. 이 탭의 BP 와 그 BP 의 점포·공통코드가 준비될 때까지 로딩 화면을 보이고, 준비되면 children 을 그린다. 주소는 바꾸지 않는다.
 * 메뉴·점포·공통코드는 로그인할 때의 값을 쓰고 다시 로그인해야 바뀐다(okf/auth.md, 2026-10-13). 데이터 권한은 api 가 요청마다 다시 본다.
 */
export function SessionGate({ area, children }: { area: Area; children: ReactNode }) {
  const [state, setState] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; value: LoginState }>({
    status: "loading",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    prepare(area).then(
      (value) => !cancelled && setState({ status: "ready", value }),
      async (e: unknown) => {
        if (cancelled) return;
        if (e instanceof BffError && e.status === 401) return void (await logout());
        if (e instanceof OtherBpError) {
          // 고른 BP 를 볼 수 없다(권한이 바뀌었거나 BP 가 지워졌다). 다음 탭이 같은 BP 를 다시 고르지 않게 지우고 자기 BP 로 다시 연다.
          // shortcut: 안내는 브라우저 alert 다. 공통 확인 팝업이 생기면 바꾼다.
          alert(e.message);
          clearSelectedBp();
          location.replace(HOME[area]);
          return;
        }
        console.error(e);
        setState({ status: "error", message: e instanceof BffError ? e.message : "로그인 정보를 불러오지 못했습니다" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [area, attempt]);

  if (state.status === "loading") return <Notice>불러오는 중입니다</Notice>;
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
  return <Ready area={area} value={state.value} onScope={(scope) => setState({ status: "ready", value: { ...state.value, scope } })}>{children}</Ready>;
}

function Ready({ area, value, onScope, children }: { area: Area; value: LoginState; onScope: (s: Scope) => void; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const allowed = isAllowed(value.menus, pathname, area);
  // 개발 모드(StrictMode)는 effect 를 두 번 돌린다. 같은 주소에 두 번 안내하고 두 번 뒤로 가지 않게 한다.
  const denied = useRef<string | null>(null);

  useEffect(() => {
    if (allowed || denied.current === pathname) return;
    denied.current = pathname;
    // 메뉴에 없는 주소로 바로 들어왔다. 안내하고 들어오기 전 화면으로 돌아간다(2026-10-13 정책, 403 과 같다).
    // shortcut: 안내는 브라우저 alert 다. 공통 확인 팝업이 생기면 바꾼다.
    alert("접근 권한이 없는 메뉴입니다");
    if (history.length > 1) history.back();
    else router.replace(HOME[area]);
  }, [allowed, area, pathname, router]);

  const setScope = (scope: Scope) => {
    writeScope(value.currentBp.bpCodeId, scope);
    onScope(scope);
    // 범위를 바꾸면 보던 화면에 남지 않고 홈으로 간다(okf/home.md 범위 선택기).
    router.push(HOME[area]);
  };
  return <LoginContext value={{ ...value, setScope }}>{allowed ? children : null}</LoginContext>;
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-[18px] text-[14px] text-erp-muted">
      {children}
    </div>
  );
}

class OtherBpError extends Error {}

async function prepare(area: Area): Promise<LoginState> {
  const loginKey = document.cookie.match(new RegExp(`(?:^|; )${LOGIN_KEY_COOKIE}=([^;]*)`))?.[1];
  // 이 기능 전에 로그인했거나 쿠키가 지워졌다. 세션을 끝내고 다시 로그인하게 한다(/login 으로만 보내면 proxy 가 홈으로 되돌린다).
  if (!loginKey) throw new BffError(401, "다시 로그인해 주세요");

  let info = readLoginInfo(loginKey);
  let bpInfo = readLoginBpInfo(loginKey);
  // 이 로그인에서 처음 열린 탭(또는 저장소가 지워진 브라우저)만 받는다. 그 뒤 탭은 저장한 값을 쓴다.
  if (!info || !bpInfo) {
    const r = await bff<LoginInfo>("/auth/admin/login-info");
    info = { loginKey, account: r.account, menus: r.menus };
    bpInfo = { loginKey, bpCodeId: r.account.bp.bpCodeId, stores: r.stores, codes: r.codes };
    writeLoginInfo(info);
    writeLoginBpInfo(bpInfo);
  }

  const { account } = info;
  const ownBp = { bpCodeId: account.bp.bpCodeId, bpCode: account.bp.bpCode, tradeName: account.bp.tradeName };
  const url = new URL(location.href);
  const q = url.searchParams.get("bp");
  if (q !== null) {
    url.searchParams.delete("bp");
    history.replaceState(null, "", url);
  }
  const bp = resolveBp({
    ownBp,
    isPlatform: account.bp.isPlatform,
    area,
    queryBpCodeId: q && /^\d+$/.test(q) ? Number(q) : null,
    currentBp: readCurrentBp(loginKey),
    selectedBp: readSelectedBp(loginKey),
  });
  writeCurrentBp(loginKey, bp);

  let stores = readStores(bp.bpCodeId);
  let codes = readCodes(bp.bpCodeId);
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
        if (e instanceof BffError && (e.status === 403 || e.status === 404)) throw new OtherBpError(`${bp.tradeName}: ${e.message}`);
        throw e;
      }
    }
    writeStores(bp.bpCodeId, stores);
    writeCodes(bp.bpCodeId, codes);
  }
  return { account, menus: info.menus, currentBp: bp, stores, codes, scope: readScope(bp.bpCodeId) ?? ALL };
}

function findMenu(menus: AdminMenu[], match: (m: AdminMenu) => boolean): AdminMenu | undefined {
  for (const m of menus) {
    if (match(m)) return m;
    const found = findMenu(m.children, match);
    if (found) return found;
  }
}

/** 영역 홈이거나 menus 의 주소(그 아래 상세·등록 경로 포함)면 들어갈 수 있다. 헤더는 2단계까지 그리지만 판정은 3단계까지 본다. */
function isAllowed(menus: AdminMenu[], pathname: string, area: Area) {
  if (pathname === HOME[area]) return true;
  return !!findMenu(menus, (m) => !!m.url && (pathname === m.url || pathname.startsWith(`${m.url}/`)));
}
