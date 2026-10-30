"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useEffectEvent, useRef, useState, type ReactNode, type RefObject } from "react";
import { Button, LoadingNotice, useBackdropActive, useToast } from "@/components/common";
import { logout } from "@/app/actions";
import { loginPathOf, returnPathOf } from "@/lib/auth-routes";
import { bff, BffError, PASSWORD_REQUIRED_EVENT, signOut } from "@/lib/bff";
import { bpOfPath, bpPath, isBpPathScreen, stripBp } from "@/lib/bp-path";
import { BP_SWITCH_PATH, bpOfSwitchUrl, firstMenuRedirect, HOME, isAllowed, menuOfPath, menuPermissionOf, menusOf, serviceOfPath, type MenuAction, type MenuCode } from "@/lib/menus";
import { ForcePasswordDialog } from "./force-password-dialog";
import { MyPagePanel } from "./my-page-panel";
import { PasswordChangePanel } from "./password-change-panel";
import { WithdrawPanel } from "./withdraw-panel";
import {
  announceStoresChanged,
  clearBpFix,
  clearSelectedBp,
  clearTabBp,
  isStoresChangedFor,
  LOGIN_INFO_KEY,
  markBpFix,
  takeBpFix,
  readCodes,
  readCurrentBp,
  readLoginBpInfo,
  readLoginInfo,
  readScope,
  readSelectedBp,
  readStores,
  readStoresVersion,
  resolveTab,
  STORES_CHANGED_KEY,
  writeCodes,
  writeCurrentBp,
  writeLoginBpInfo,
  writeLoginInfo,
  writeScope,
  writeSelectedBp,
  writeStores,
  writeStoresVersion,
  type Scope,
  type ServiceCode,
  type StoredBp,
  type TabContext,
} from "@/lib/browser-storage";
import { LOGIN_KEY_COOKIE, type AdminMenu, type AdminStore, type BpOption, type Codes, type LoginInfo, type LoginInfoAccount } from "@/lib/session";
import { restoredScope, sameStores, SCOPE_PARAM, scopeKeyOf, withScope } from "@/lib/store-scope";

/** 다시 받은 점포 목록이 달라졌을 때의 토스트(2026-10-29 사용자 지정) — 다른 PC · 다른 탭 · 이 화면에서 바꾼 것 모두 같다 */
const STORES_CHANGED_MESSAGE = "점포 목록이 변경되었습니다.";
/** 창으로 돌아오거나 탭이 다시 보일 때는 마지막으로 물은 지 이만큼 지났을 때만 다시 묻는다 — 창을 오가는 것만으로 연달아 부르지 않게 */
const FOCUS_SYNC_MS = 10_000;

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

type LoginActions = {
  setScope: (scope: Scope) => void;
  /** 점포 목록을 지금 서버 값에 맞춘다 — 점포를 등록 · 수정 · 상태 변경 · 삭제했거나 그 결과를 모를 때(409 · 404 · 연결 끊김) 화면이 부른다. 버전이 같으면 다시 받지 않는다. */
  refreshStores: () => void;
  /** 내 정보(마이페이지)에서 이름 · 이메일을 바꾸면 GNB 등 이 값을 쓰는 화면이 다시 로그인하지 않아도 바로 보이게 한다.
   * 이름 · 이메일만 받고 둘 다 빈 값을 허락하지 않는다 — 소속 BP · 권한 · 비밀번호 변경 대기 같은 칸은 이 통로로
   * 바뀌면 안 되고, 호출자(MyPagePanel)는 늘 toUpdateInput 이 다듬은 값만 준다. */
  patchAccount: (partial: { name: string; email: string }) => void;
  /** GNB 「내정보 관리」 패널 열림 여부 — 패널 자체는 SessionGate 가 children 뒤에 그린다(DOM 순서 때문, 위 주석 참고). */
  myPageOpen: boolean;
  setMyPageOpen: (open: boolean) => void;
  /** GNB 「비밀번호 변경」 패널 열림 여부(S-PTWREE) — myPageOpen 과 같은 자리·같은 이유로 children 뒤에 그린다. */
  passwordChangeOpen: boolean;
  setPasswordChangeOpen: (open: boolean) => void;
  /** GNB 「회원 탈퇴」 패널 열림 여부(S-JHQQNR) — passwordChangeOpen 과 같은 자리·같은 이유로 children 뒤에 그린다. */
  withdrawOpen: boolean;
  setWithdrawOpen: (open: boolean) => void;
  /** UserPop 의 이름 버튼 — MyPagePanel · PasswordChangePanel 의 SlidePanel trigger 로 같이 써서(둘 다 같은
   * UserPop 안의 서로 다른 항목에서 연다) 패널을 닫으면 포커스가 이 버튼으로 돌아오게 한다(코드 리뷰로 찾음,
   * 2026-10-21 — 전에는 못 꺼내 body 로 빠졌다). AdminHeader 가 UserPop 에 넘긴다. */
  myPageTrigger: RefObject<HTMLButtonElement | null>;
};
const LoginContext = createContext<(LoginState & LoginActions) | null>(null);

function useLogin() {
  const v = use(LoginContext);
  if (!v) throw new Error("SessionGate 안에서만 쓸 수 있습니다");
  return v;
}
export const useAccount = () => useLogin().account;
export const usePatchAccount = () => useLogin().patchAccount;
/** GNB 「내정보 관리」 패널 열림 여부 — useScope 와 같은 모양(값 · 세터 튜플, naming.md). */
export function useMyPageOpen() {
  const { myPageOpen, setMyPageOpen } = useLogin();
  return [myPageOpen, setMyPageOpen] as const;
}
export const useMyPageTrigger = () => useLogin().myPageTrigger;
/** GNB 「비밀번호 변경」 패널 열림 여부 — useMyPageOpen 과 같은 모양. */
export function usePasswordChangeOpen() {
  const { passwordChangeOpen, setPasswordChangeOpen } = useLogin();
  return [passwordChangeOpen, setPasswordChangeOpen] as const;
}
/** GNB 「회원 탈퇴」 패널 열림 여부(S-JHQQNR) — usePasswordChangeOpen 과 같은 모양. */
export function useWithdrawOpen() {
  const { withdrawOpen, setWithdrawOpen } = useLogin();
  return [withdrawOpen, setWithdrawOpen] as const;
}
/** 이 탭의 서비스. 헤더 메뉴·홈·메뉴 권한 확인과 오른쪽 선택기(플랫폼이면 BP, ERP 면 점포 범위)가 이것을 본다. */
export const useService = () => useLogin().serviceCode;
/** 이 탭 서비스의 메뉴 트리(3단계까지). */
export function useMenus() {
  const { menus, serviceCode } = useLogin();
  return menusOf(menus, serviceCode);
}
export const useCurrentBp = () => useLogin().currentBp;
export const useStores = () => useLogin().stores;
/** 점포를 바꿨거나 결과를 모를 때 헤더 범위 선택기 · 점포 고르기를 바로 맞춘다. 화면에 보이는 점포가 바뀌었으면 「점포 목록이 변경되었습니다.」를 띄운다. */
export const useRefreshStores = () => useLogin().refreshStores;
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
  const permission = usePageMenu()?.permission;
  return { create: !!permission?.create, update: !!permission?.update, delete: !!permission?.delete };
}
/** 지금 화면(주소)의 메뉴(menuOfPath). 메뉴가 아닌 화면이면 null. 헤더 점포 범위가 어느 목록으로 갈지 정할 때도 쓴다. */
export function usePageMenu() {
  const { menus, serviceCode } = useLogin();
  return menuOfPath(menus, usePathname(), serviceCode);
}

// 다시 시도하면 같은 길로 다시 로그아웃한다.
const LOGOUT_FAILED = { status: "error", message: "로그아웃하지 못했습니다." } as const;

/**
 * 로그인 후 화면의 문. 이 탭의 BP 와 그 BP 의 점포·공통코드가 준비될 때까지 로딩 화면을 보이고, 준비되면 children 을 그린다.
 * /bp-switch?bp= 는 이 탭을 그 BP 로 새로 준비한 뒤(탭에 남은 점포·공통코드를 쓰지 않고, 범위는 전체) 그 서비스의 홈으로 보낸다.
 * 메뉴와 자기 BP 의 공통코드는 로그인할 때의 값을 쓰고 다시 로그인해야 바뀐다(okf/auth.md, 2026-10-13). 고른 BP 의 것은 그 BP 로
 * 탭을 열 때마다 받는다. 점포는 같은 계정으로 여러 PC 에서 일하므로 새로고침 · 메뉴 이동 · 창 포커스 때 점포 목록 버전을 물어
 * 바뀌었으면 다시 받는다(Ready 의 syncStores, 2026-10-29). 데이터 권한은 api 가 요청마다 다시 본다.
 */

export function SessionGate({ header, children }: { header: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ready"; value: LoginState }>({
    status: "loading",
  });
  // BP 를 바꿔 여는 동안(BP 이동 화면 · 다른 BP 의 /bp/{id} 주소)의 로딩 문구. 서버에서 BP 를 확인하면 그 상호와 범위로 바꾼다(적용 안내를 토스트 대신 여기서 한다, 2026-10-19 재영).
  const [switchNotice, setSwitchNotice] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // 주소의 탭 BP. 바뀌면(주소창 입력 · 뒤로 가기 · 다른 BP 링크) 그 BP 로 다시 준비하고, 옮긴 화면에 BP 없이 오면 다시 돌려 탭 BP 주소로 보낸다.
  // usePathname 은 클라이언트에서 브라우저 주소(/bp/8/...)를 준다(2026-10-21 확인). location 은 렌더 중에 읽지 않는다 — 앱 안 이동(Link ·
  // router.push)은 Next 가 커밋한 뒤에 주소를 바꿔 렌더에서는 이전 주소다. 준비(prepare)는 effect 에서 돌아 그때의 location 을 읽는다.
  // 서버 렌더에서는 rewrite 된 경로일 수 있으나, 처음은 늘 로딩 화면이고 stale 은 준비를 마친 뒤에만 보므로 어긋나지 않는다.
  const tabKey = tabKeyOf(pathname);
  const readyBp = state.status === "ready" ? state.value.currentBp.bpCodeId : null;
  // 준비한 BP 와 주소의 BP 가 다르면 다시 준비하는 동안 옛 BP 화면을 보이지 않는다. 옮긴 화면에 BP 없이 온 것("move")은 가리지 않는다 —
  // 보낼 BP 가 없는 플랫폼 계정은 그대로 준비되어 Ready 가 「BP 를 먼저 골라 주세요.」로 막아야 한다.
  const stale = readyBp !== null && typeof tabKey === "number" && tabKey !== readyBp;

  useEffect(() => {
    let cancelled = false;
    prepare((bp) => !cancelled && setSwitchNotice(`${bp.tradeName}(${bp.bpCode}) · 전체 점포로 여는 중입니다.`)).then(
      (value) => {
        if (cancelled) return;
        setSwitchNotice(null);
        setState({ status: "ready", value });
      },
      async (e: unknown) => {
        if (cancelled) return;
        if (e instanceof BpMismatchError) {
          // 쿠키의 소속 BP 와 브라우저의 로그인 정보가 어긋났다(쿠키를 고쳤거나 다른 탭에서 다른 계정으로 로그인). proxy 와 서로 반대로 보내며
          // 돌지 않게 다시 보내지 않고 로그아웃한다 — 두 값 모두 새로 만들어진다.
          alert("로그인 정보가 맞지 않아 다시 로그인해 주세요.");
          if (!(await signOut(logout))) setState(LOGOUT_FAILED);
          return;
        }
        if (e instanceof BffError && e.status === 401) {
          // 세션이 이미 끊겼으면(proxy·BFF 가 쿠키를 지움) 로그인 화면으로 바로 간다. login-key 가 없는 옛 세션만 로그아웃으로 끝낸다.
          // 메일 링크(엑셀 내려받기)로 왔으면 ?next= 를 붙여 로그인 뒤 그 화면으로 돌아온다(loginPathOf).
          if (readLoginKey()) router.replace(loginPathOf(location.pathname));
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
          // 이 탭에 앞서 연 BP(ERP)가 남아 있으면 플랫폼 첫 주소(/platform)가 ERP 탭으로 열려 막히고 뒤로 간다 — 지우고 주소로 다시 정하게 한다.
          clearTabBp();
          location.replace(HOME.PLATFORM); // 다른 BP 는 플랫폼 계정만 연다. 자기 BP(플랫폼)로 다시 연다.
          return;
        }
        console.error(e);
        setState({ status: "error", message: e instanceof BffError ? e.message : "로그인 정보를 불러오지 못했습니다." });
      },
    );
    return () => {
      cancelled = true;
    };
    // tabKey: 주소의 탭 BP 가 바뀌면 다시 준비한다. 같은 BP 안의 이동이나 안 옮긴 화면끼리의 이동은 그대로다.
  }, [attempt, router, tabKey]);

  if (state.status === "loading" || stale) return <LoadingNotice text={switchNotice ?? (pathname === BP_SWITCH_PATH ? "BP 로 이동하는 중입니다." : "불러오는 중입니다.")} />;
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
    <Ready value={state.value} onChange={(update) => setState((s) => (s.status === "ready" ? { status: "ready", value: update(s.value) } : s))} header={header}>
      {children}
    </Ready>
  );
}

// onChange 는 앞 값을 받아 고친다 — 한 조작에서 여러 값을 바꿔도 앞의 변경을 덮지 않는다.
function Ready({
  value,
  onChange,
  header,
  children,
}: {
  value: LoginState;
  onChange: (update: (v: LoginState) => LoginState) => void;
  header: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const home = HOME[value.serviceCode];
  // BP 이동 화면은 준비만 하는 곳이라 메뉴 확인을 건너뛴다.
  const switching = pathname === BP_SWITCH_PATH;
  // 이 탭 서비스의 화면만 연다. BP·가맹 계정이 플랫폼 주소에 오거나 플랫폼 탭에서 ERP 주소를 치면 여기서 막힌다(데이터는 api 가 다시 막는다).
  const allowed = switching || isAllowed(value.menus, pathname, value.serviceCode);
  // 개발 모드(StrictMode)는 effect 를 두 번 돌린다. 같은 주소에 두 번 안내하고 두 번 뒤로 가지 않게 한다.
  const denied = useRef<string | null>(null);
  // GNB 「내정보 관리」(마이페이지). 패널은 children(화면 본문) 뒤에 그려야 한다 — SlidePanel 은 전부 같은 z-10 이라
  // DOM 순서가 쌓임을 가른다(PanelBackdrop 의 같은 설명 참고). header 는 먼저, children 은 그다음, 패널은 가장
  // 뒤라야 화면이 자기 등록 패널을 열어 둔 채로 마이페이지를 열어도 그 패널 아래 깔리지 않는다(코드 리뷰로 찾음, 2026-10-21).
  const [myPageOpen, setMyPageOpen] = useState(false);
  // GNB 「비밀번호 변경」(S-PTWREE) — myPageOpen 과 같은 이유로 같은 자리에 둔다.
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  // GNB 「회원 탈퇴」(S-JHQQNR) — passwordChangeOpen 과 같은 이유로 같은 자리에 둔다.
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  // UserPop 의 이름 버튼 — AdminHeader 가 UserPop 에 triggerRef 로 넘겨 실제 DOM 버튼을 단다. 패널을
  // 닫으면 SlidePanel 이 여기로 포커스를 되돌린다(DESIGN.md Slide Panel). 전엔 못 꺼내 body 로 빠졌다
  // (코드 리뷰로 찾음, 2026-10-21 — UserPop 공개 API 를 triggerRef 로 넓혀 고쳤다).
  const myPageTrigger = useRef<HTMLButtonElement>(null);
  // 바탕창(closeOnBackdrop 켠 패널)이 떠 있는 동안 화면 본문을 inert 로 뺀다 — 마이페이지는 어느 화면에서나
  // 열 수 있어 화면마다 따로 감싸 둘 수 없다. admins-screen.tsx 의 같은 처리(자기 등록 패널용)와 겹쳐도 무해하다.
  const backdropActive = useBackdropActive();

  // 플랫폼은 홈이 없다 — /platform 은 헤더 순서상 첫 메뉴로 넘겨 주는 주소다(2026-10-28 재영). 메뉴가 없으면 /platform 이 권한 요청 안내를 그린다.
  // 비밀번호 강제 변경(약관 동의 포함) 전에는 메뉴 화면의 api 가 403 이라 /platform 에 머문다 — 바꾸면 passwordChanged 가 /platform 을 다시 연다.
  const firstMenu = firstMenuRedirect(value.menus, value.serviceCode, pathname, value.account.isPasswordChangeRequired);

  // BP 이동 화면은 준비가 끝났으니 그 서비스의 홈으로 바꿔 간다(뒤로 가기에 남지 않게 replace).
  useEffect(() => {
    if (switching) router.replace(home);
  }, [switching, home, router]);
  // replace — /platform 이 뒤로 가기 기록에 남으면 뒤로 갈 때마다 다시 첫 메뉴로 돌아온다.
  useEffect(() => {
    if (firstMenu) router.replace(firstMenu);
  }, [firstMenu, router]);

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
    alert(needsBp ? "웨일ERP 바로가기에서 BP 를 먼저 골라 주세요." : "접근 권한이 없는 메뉴입니다.");
    if (history.length > 1) history.back();
    else router.replace(home);
  }, [allowed, home, pathname, router, value.menus, value.serviceCode]);

  const setScope = (scope: Scope) => {
    writeScope(value.currentBp.bpCodeId, scope);
    // 메뉴 화면이면 헤더 선택기가 그 메뉴의 목록으로 옮기며 범위를 주소(?scope=)에 싣는다(admin-header.tsx · okf/home.md 범위 선택기).
    onChange((v) => ({ ...v, scope }));
  };
  // 내 정보에서 이름 · 이메일을 바꾸면 저장값에 쓰고 이 탭에 바로 반영한다(GNB 이름 등). 다른 탭은 새로고침하면 반영된다.
  const patchAccount = (partial: { name: string; email: string }) => {
    const account = { ...value.account, ...partial };
    writeLoginInfo({ loginKey: value.loginKey, account, menus: value.menus });
    onChange((v) => ({ ...v, account }));
  };
  // 강제 변경 표시를 저장값에 쓰고 이 탭에 반영한다. 다른 탭은 새로고침하면 반영된다.
  const setPasswordRequired = (required: boolean) => {
    const account = required
      ? { ...value.account, isPasswordChangeRequired: true }
      : { ...value.account, isPasswordChangeRequired: false, isTermsAgreementRequired: false, temporaryPasswordExpiresAt: null };
    writeLoginInfo({ loginKey: value.loginKey, account, menus: value.menus });
    onChange((v) => ({ ...v, account }));
  };
  // 점포 목록 맞추기(2026-10-29). 같은 계정으로 여러 PC 에서 일하므로 다른 PC 에서 점포를 등록 · 수정 · 폐점 · 삭제하거나 담당 점포가 바뀌면
  // 이 탭의 헤더 범위 선택기 · 점포 고르기도 따라와야 한다. 서버가 알려 줄 통로는 없어 이 탭이 묻는다 — 버전(값 하나)만 묻고, 이 탭이 받을 때의
  // 버전과 다르면 점포를 다시 받는다(준비 직후에는 버전이 없어 한 번 다시 받는다). 연결 끊김 · 5xx 면 지금 목록을 두고 알리지 않는다(다음에
  // 다시 묻는다). 다시 물어도 같은 실패(401 세션 끊김은 로그인 화면으로, 403 계정 미사용 · 404 볼 수 없게 된 BP 는 이 화면에서 더 묻지 않음)는 멈춘다.
  // 묻는 때: 새로고침 · 경로가 바뀔 때(메뉴 · 화면 이동, 쿼리만 바뀌면 묻지 않는다) · 창 포커스 · 탭이 다시 보일 때, 점포를 바꿨거나 결과를 모를 때
  // (refreshStores), 다른 탭의 알림(stores-changed).
  // 비동기 뒤에 지금 값을 읽으려고 마지막으로 그린 값을 둔다. 이미 묻는 중이면 끝난 뒤 한 번 더 묻는다.
  const toast = useToast();
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });
  // announce: 이번 차례가 다른 탭에 알릴 것인가 — 다른 탭의 알림으로 물은 것만이면 되돌려 알리지 않는다
  // disposed: 이 Ready 가 내려갔다 — 다른 BP 주소로 가면 SessionGate 가 로딩을 그려 Ready 가 내려가는데, 그때 묻던 결과가 늦게 와서
  // 새 BP 의 상태 · 탭 저장값을 옛 BP 의 점포로 덮지 않게 한다(코드 리뷰로 찾음, 2026-10-30)
  // stopped: 다시 물어도 같은 실패(403 · 404)를 받았다 — 이 화면에서는 더 묻지 않는다(이동마다 실패 요청이 쌓이지 않게)
  const sync = useRef({ running: false, again: false, announce: false, checkedAt: 0, disposed: false, stopped: false });
  useEffect(() => {
    const s = sync.current;
    // 개발 모드(StrictMode)는 effect 를 두 번 돌린다 — 다시 올라올 때 표시를 되돌린다
    s.disposed = false;
    return () => {
      s.disposed = true;
    };
  }, []);
  const syncStores = async (fromOtherTab = false) => {
    const s = sync.current;
    if (s.running) {
      s.again = true;
      s.announce ||= !fromOtherTab;
      return;
    }
    s.running = true;
    s.announce = !fromOtherTab;
    try {
      do {
        const announce = s.announce;
        s.again = false;
        s.announce = false;
        s.checkedAt = Date.now();
        const v = latest.current;
        // 플랫폼 탭(자기 BP)은 점포가 없다. 비밀번호를 바꾸기 전에는 점포 api 가 403 이다
        if (v.serviceCode !== "WHALE_ERP" || v.account.isPasswordChangeRequired || s.stopped) return;
        const bpCodeId = v.currentBp.bpCodeId;
        const own = bpCodeId === v.account.bp.bpCodeId;
        // 응답을 기다리는 사이 사용자가 다른 화면으로 가면 아래 replace 가 그 이동을 덮지 않게 물을 때의 경로를 둔다
        const askedPath = location.pathname;
        const changed = await fetchChangedStores(bpCodeId, own, readStoresVersion(bpCodeId)).catch((e: unknown) => {
          const status = e instanceof BffError ? e.status : undefined;
          // 비밀번호 강제 변경 403 은 bff() 가 팝업을 다시 띄우고, 그 뒤로는 위에서 묻지 않는다
          if (status === 401) {
            router.replace(loginPathOf(location.pathname));
            s.stopped = true;
          } else if (status === 403 || status === 404) {
            console.error("점포 목록을 맞출 수 없음 — 이 화면에서는 더 묻지 않는다", { bpCodeId, own, status }, e);
            s.stopped = true;
          } else console.warn("점포 목록 버전을 맞추지 못함 — 다음에 다시 묻는다", { bpCodeId, own, status }, e);
          return null;
        });
        // 그 사이 탭 BP 가 바뀌었으면(BP 주소 이동) 받은 값은 버린다 — 새 BP 는 준비에서 받았다
        if (s.disposed) return;
        if (!changed || latest.current.currentBp.bpCodeId !== bpCodeId) continue;
        // 목록을 쓴 뒤에만 버전을 쓴다 — 목록 쓰기가 실패했는데 버전만 남으면 새로고침 뒤 옛 목록을 최신으로 믿는다
        if (writeStores(bpCodeId, changed.items)) writeStoresVersion(bpCodeId, changed.version);
        // 자기 BP 면 새 탭이 읽는 공용 값(login-bp-info)도 맞춘다
        const shared = own ? readLoginBpInfo(v.loginKey) : null;
        if (shared) writeLoginBpInfo({ ...shared, stores: changed.items });
        const now = latest.current;
        if (sameStores(now.stores, changed.items)) continue;
        // 고른 범위의 점포가 없어졌으면(지움 · 담당 해제) 전체로 돌리고, 주소에 범위가 있으면 보던 목록도 그 범위로 다시 받는다
        const scope = restoredScope(now.scope, changed.items);
        if (scopeKeyOf(scope) !== scopeKeyOf(now.scope)) {
          writeScope(bpCodeId, scope);
          // 점포 조건이 바뀌므로 쪽(page)은 뺀다 — 3쪽을 보던 중이어도 새 범위의 1쪽부터
          const params = new URLSearchParams(location.search);
          if (params.has(SCOPE_PARAM) && location.pathname === askedPath) {
            params.delete("page");
            router.replace(withScope(`${location.pathname}?${params}`, scope));
          }
        }
        // 상태에 넣는 순간에도 같은 BP 인지 한 번 더 본다 — 그 사이 다른 BP 로 준비됐으면 그대로 둔다
        onChange((cur) => (cur.currentBp.bpCodeId === bpCodeId ? { ...cur, stores: changed.items, scope } : cur));
        if (announce) announceStoresChanged(v.loginKey, bpCodeId);
        toast(STORES_CHANGED_MESSAGE);
      } while (s.again);
    } finally {
      s.running = false;
    }
  };
  // 맞추는 중의 예외(주소 · 범위 계산 등)는 화면을 깨지 않고 남기기만 한다 — 실행 중 표시는 finally 가 푼다
  const runSync = (fromOtherTab: boolean) => void syncStores(fromOtherTab).catch((e: unknown) => console.error("점포 목록 맞추기 중 예외", e));
  const refreshStores = () => runSync(false);
  const syncOnEvent = useEffectEvent((fromOtherTab: boolean) => runSync(fromOtherTab));
  // 새로고침(처음 그릴 때)과 경로가 바뀔 때(메뉴 · 화면 이동) — 이동을 막지 않고 뒤에서 묻는다
  useEffect(() => syncOnEvent(false), [pathname]);
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible" && Date.now() - sync.current.checkedAt > FOCUS_SYNC_MS) syncOnEvent(false);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORES_CHANGED_KEY && isStoresChangedFor(e.newValue, latest.current.loginKey, latest.current.currentBp.bpCodeId)) syncOnEvent(true);
    };
    addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    addEventListener("storage", onStorage);
    return () => {
      removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      removeEventListener("storage", onStorage);
    };
  }, []);

  // 다른 탭에서 로그아웃하면 로그인 화면으로, 다시 로그인하면(다른 계정 포함) 새 로그인 정보로 다시 연다(정책 B-5).
  // 로그인 화면이 저장값을 지우고, 새 로그인의 첫 탭이 login-info 를 쓰므로 그 키의 변화로 알아챈다. storage 이벤트는 다른 탭에만 온다.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== LOGIN_INFO_KEY) return;
      const loginKey = readLoginKey();
      if (!loginKey) router.replace(loginPathOf(location.pathname));
      else if (loginKey !== value.loginKey) location.reload();
    };
    addEventListener("storage", onStorage);
    return () => removeEventListener("storage", onStorage);
  }, [value.loginKey, router]);
  // 변경 전에는 api 가 403 「서비스 이용을 위해 비밀번호를 변경해 주세요.」를 준다. 저장값이 어긋났으면 팝업을 다시 띄운다.
  useEffect(() => {
    const reopen = () => !value.account.isPasswordChangeRequired && setPasswordRequired(true);
    addEventListener(PASSWORD_REQUIRED_EVENT, reopen);
    return () => removeEventListener(PASSWORD_REQUIRED_EVENT, reopen);
  });
  const passwordChanged = () => {
    setPasswordRequired(false);
    // 바꾼 뒤에는 이 탭 서비스의 HOME 으로 다시 연다 — 플랫폼은 /platform 을 거쳐 첫 메뉴로 간다.
    // 메일 링크(엑셀 내려받기, returnPathOf)에서 바꿨으면 그 화면을 다시 연다 — 다시 열리면 바로 내려받는다.
    // replace — assign 이면 같은 HOME 이 기록에 두 번 남아 뒤로 가기가 한 번 제자리처럼 보인다.
    location.replace(returnPathOf(location.pathname) ?? home);
  };
  return (
    <LoginContext value={{ ...value, setScope, refreshStores, patchAccount, myPageOpen, setMyPageOpen, passwordChangeOpen, setPasswordChangeOpen, withdrawOpen, setWithdrawOpen, myPageTrigger }}>
      {/* 첫 메뉴로 넘어가는 동안 /platform 의 빈 화면을 한 번 그리지 않게 안내만 둔다. */}
      {firstMenu && <LoadingNotice text="불러오는 중입니다." />}
      {allowed && !switching && !firstMenu && (
        <>
          {header}
          {/* 마이페이지 · 비밀번호 변경 패널이 맨 위일 때만 본문을 inert 로 뺀다 — 그냥 backdropActive 를 쓰면 화면
              자신의 closeOnBackdrop 패널(platform-admins 상세·수정 등)이 맨 위일 때 그 패널까지 children 안에
              있어 함께 inert 가 되어 버튼을 못 눌렀다(ip-code-review-claude 적대적 리뷰로 찾음, 2026-10-21).
              이 둘이 열려 있을 때는 그 패널이 다른 패널 뒤에 그려져(DOM 순서) 늘 맨 위이므로 이 조건으로
              충분하다 — 바탕창이 뜬 상태로는 페이지 쪽에서 새 패널을 열 수 없다(전부 inert). */}
          <div className="contents" inert={(myPageOpen || passwordChangeOpen || withdrawOpen) && backdropActive}>
            {children}
          </div>
          <MyPagePanel id="mypage-panel" open={myPageOpen} onClose={() => setMyPageOpen(false)} trigger={myPageTrigger} />
          <PasswordChangePanel id="password-change-panel" open={passwordChangeOpen} onClose={() => setPasswordChangeOpen(false)} trigger={myPageTrigger} />
          <WithdrawPanel id="withdraw-panel" open={withdrawOpen} onClose={() => setWithdrawOpen(false)} trigger={myPageTrigger} />
        </>
      )}
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

/**
 * 점포 목록 버전을 묻고(GET /bp-codes/{id}/stores-version) 이 탭이 아는 버전과 다르면 점포를 다시 받는다. 같으면 null.
 * 자기 BP 는 관리 점포만(GET /auth/admin/me/stores — 로그인 정보의 stores 와 같은 목록), 플랫폼 계정이 고른 BP 는 그 BP 의 점포 전체다.
 * 버전을 받은 뒤 점포를 받기 전에 또 바뀌면 점포가 버전보다 새것이다 — 다음에 물을 때 다시 받아 맞는다.
 */
async function fetchChangedStores(bpCodeId: number, own: boolean, known: string | null): Promise<{ version: string; items: AdminStore[] } | null> {
  const { version } = await bff<{ version: string }>(`/bp-codes/${bpCodeId}/stores-version`);
  if (version === known) return null;
  const { items } = await bff<{ items: AdminStore[] }>(own ? "/auth/admin/me/stores" : `/bp-codes/${bpCodeId}/stores`);
  return { version, items };
}

/** 탭 준비를 다시 해야 하는지 가르는 값 — 주소의 탭 BP(숫자), 옮긴 화면에 BP 없이 옴("move"), 그 밖("tab"). */
function tabKeyOf(browserPath: string): number | "move" | "tab" {
  return bpOfPath(browserPath) ?? (isBpPathScreen(browserPath) ? "move" : "tab");
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
/** 쿠키의 소속 BP 와 로그인 정보(login-info)가 어긋났다(fixBpPath). */
class BpMismatchError extends Error {}

const readLoginKey = () => document.cookie.match(new RegExp(`(?:^|; )${LOGIN_KEY_COOKIE}=([^;]*)`))?.[1];

/** onSwitchBp — BP 이동 화면에서 서버로 확인한 BP 를 알린다(로딩 문구용). */
async function prepare(onSwitchBp: (bp: StoredBp) => void): Promise<LoginState> {
  const loginKey = readLoginKey();
  // 이 기능 전에 로그인했거나 쿠키가 지워졌다. 세션을 끝내고 다시 로그인하게 한다(/login 으로만 보내면 proxy 가 홈으로 되돌린다).
  if (!loginKey) throw new BffError(401, "다시 로그인해 주세요.");

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
  const platform = account.bp.isPlatform;
  const url = new URL(location.href);
  // 앞 로그인이 이 탭에 남긴 점포·공통코드·범위는 갈래와 상관없이 여기서 지운다(readCurrentBp). 점포 등은 bpCodeId 로만 갈려 같은 BP 의 다른 계정 값이 읽힌다.
  const current = readCurrentBp(loginKey);
  // 탭 BP 주소(/bp/{id})의 BP. 주소가 이긴다 — 안 옮긴 화면은 지금처럼 current-bp 를 쓴다(탭 BP 경로 방식 전환 계획).
  const pathBp = bpOfPath(url.pathname);
  // BP · 가맹 계정은 소속 BP 하나만 연다. 남의 BP 주소는 proxy 가 쿠키로 이미 보냈어야 한다 — 쿠키에 BP 가 없는 옛 세션이거나 쿠키의 BP 가 로그인 정보와 어긋난 경우에만 여기 온다.
  if (!platform && pathBp !== null && pathBp !== ownBp.bpCodeId) return fixBpPath(ownBp.bpCodeId, url);
  // 비밀번호를 바꾸기 전의 플랫폼 계정은 다른 BP 를 열지 않고 자기 BP 로 연다(아래 tab). 고객 BP 주소에 그대로 두면 주소의 BP 와 탭 BP 가
  // 영영 달라 준비가 끝나지 않고(stale) 강제 변경 팝업도 뜨지 않는다 — 플랫폼 첫 주소(/platform)로 보낸다.
  if (platform && account.isPasswordChangeRequired && pathBp !== null) return moveTo(HOME.PLATFORM);
  // 옮긴 화면에 BP 없이 왔다(옛 즐겨찾기 · 알림 링크 · 아직 접두를 안 붙인 링크). 탭 BP 주소로 보낸다.
  // 플랫폼 계정이 BP 를 고른 적이 없으면 플랫폼 탭으로 열려 Ready 가 「BP 를 먼저 골라 주세요.」로 막는다.
  if (pathBp === null && isBpPathScreen(url.pathname)) {
    const to = !platform ? ownBp : current?.serviceCode === "WHALE_ERP" ? current.bp : readSelectedBp(loginKey);
    if (to) return moveTo(bpPath(to.bpCodeId, url.pathname) + url.search + url.hash);
  }
  // 고른 BP 는 BP 이동 화면(/bp-switch?bp=)이나 탭 BP 주소로만 받는다. 다른 주소의 ?bp= 는 보지 않는다(bpOfSwitchUrl).
  const switching = url.pathname === BP_SWITCH_PATH;
  const target = bpOfSwitchUrl(url);
  // 이동 화면인데 BP 를 읽지 못했다(잘렸거나 손으로 고친 주소). 플랫폼 계정은 조용히 플랫폼으로 가지 않고 알린다.
  // 그 밖의 계정은 BP 를 고를 수 없어 늘 자기 BP 로 열리므로 그대로 둔다.
  if (switching && !target && platform) throw new OtherBpError("BP 이동 주소가 올바르지 않습니다.", null);
  // 다른 BP 로 가면 그 BP 를 서버에서 찾는다 — 주소는 id 만 믿는다. 탭들이 같이 쓰는 selected-bp 를 거치지 않아, 이 탭이 준비되는 사이
  // 다른 탭에서 BP 를 또 골라도 이 탭은 주소의 BP 로 열린다. 비밀번호를 바꾸기 전에는 다른 BP 를 열지 않는다(아래).
  let switchBp: StoredBp | null = null;
  if (platform && !account.isPasswordChangeRequired) {
    if (target && target.bpCodeId !== ownBp.bpCodeId) switchBp = await findBp(target);
    else if (pathBp !== null) {
      // 플랫폼 BP 는 ERP 로 열지 않는다. 이 탭이 이미 연 BP 면 다시 찾지 않는다(새로고침 · 탭 안 이동)
      if (pathBp === ownBp.bpCodeId) throw new OtherBpError(`BP(${pathBp})를 찾지 못했습니다.`, pathBp);
      switchBp = current?.bp.bpCodeId === pathBp ? current.bp : await findBpById(pathBp, readSelectedBp(loginKey));
    }
  }
  if (switchBp && switchBp.bpCodeId !== current?.bp.bpCodeId) onSwitchBp(switchBp);
  // 비밀번호를 바꾸기 전에는 다른 BP 조회가 403 이라 자기 BP 로 연다.
  const tab: TabContext = account.isPasswordChangeRequired
    ? { serviceCode: platform ? "PLATFORM" : "WHALE_ERP", bp: ownBp }
    : pathBp !== null
      ? { serviceCode: "WHALE_ERP", bp: switchBp ?? ownBp }
      : resolveTab({
          ownBp,
          isPlatform: platform,
          pathService: serviceOfPath(info.menus, url.pathname),
          queryBpCodeId: target?.bpCodeId ?? null,
          current,
          selectedBp: switchBp ?? readSelectedBp(loginKey),
        });
  const { bp } = tab;

  // BP 를 바꿔 열 때(BP 이동 화면 · 이 탭과 다른 BP 의 /bp/{id})는 탭에 남은 값을 쓰지 않고 범위는 전체에서 시작한다 —
  // 다른 BP 는 지금 값을 받고, 자기 BP 는 로그인할 때 받은 값(login-bp-info)이다.
  const fresh = switching || (pathBp !== null && current?.bp.bpCodeId !== bp.bpCodeId);
  let stores = fresh ? null : readStores(bp.bpCodeId);
  let codes = fresh ? null : readCodes(bp.bpCodeId);
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
  // BP 를 바꿔 열면(BP 이동 화면 · 다른 BP 의 /bp/{id}) 범위는 전체에서 시작한다.
  if (fresh) writeScope(bp.bpCodeId, { type: "ALL" });
  // 남의 BP 주소를 고쳐 보낸 표시는 제대로 열렸으니 지운다(fixBpPath).
  clearBpFix();
  // 저장된 점포 범위가 이 탭의 점포 목록에 없으면 전체로 되돌린다(선택기 표시와 실제 범위가 어긋나지 않게)
  const scope = restoredScope(readScope(bp.bpCodeId), stores);
  return { loginKey, account, serviceCode: tab.serviceCode, menus: info.menus, currentBp: bp, stores, codes, scope };
}

/**
 * BP 이동 주소의 BP 를 서버에서 찾는다 — 주소의 bpCode 로 BP 목록을 찾아 id 가 같은 줄의 상호 · 코드를 쓴다(주소의 값을 그대로 믿지 않는다).
 * 코드가 없거나, 찾은 줄의 id 가 다르거나, 볼 수 없으면(403 · 404) OtherBpError.
 */
async function findBp({ bpCodeId, bpCode }: { bpCodeId: number; bpCode: string | null }): Promise<StoredBp> {
  const notFound = new OtherBpError(`BP(${bpCode ?? bpCodeId})를 찾지 못했습니다.`, bpCodeId);
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

/**
 * 탭 BP 주소(/bp/{id})의 BP 를 찾는다 — 주소에는 id 만 있다. 마지막으로 고른 BP 와 같으면 그 상호 · 코드를 쓴다(표시용 — 데이터는 api 가 막는다).
 * 아니면 BP 목록을 쪽마다 넘겨 id 로 찾는다. 없거나 볼 수 없으면(403 · 404) OtherBpError.
 * shortcut: api 에 BP 한 건 조회(GET /bp-codes/{id})가 없어 목록을 넘긴다. BP 가 수천 개가 되기 전에 api 에 한 건 조회를 요청한다.
 */
async function findBpById(bpCodeId: number, selected: StoredBp | null): Promise<StoredBp> {
  if (selected?.bpCodeId === bpCodeId) return selected;
  const pageSize = 200;
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const r = await bff<{ items: BpOption[]; total: number }>(`/bp-codes?${query}`).catch((e: unknown) => {
      if (e instanceof BffError && (e.status === 403 || e.status === 404)) throw new OtherBpError(`BP(${bpCodeId}): ${e.message}`, bpCodeId);
      throw e;
    });
    const found = r.items.find((i) => i.bpCodeId === bpCodeId);
    if (found) return { bpCodeId: found.bpCodeId, bpCode: found.bpCode, tradeName: found.tradeName };
    if (r.items.length < pageSize || page * pageSize >= r.total) throw new OtherBpError(`BP(${bpCodeId})를 찾지 못했습니다.`, bpCodeId);
  }
}

/**
 * BP · 가맹 계정이 남의 BP 주소로 왔다. 한 번은 소속 BP 주소로 고쳐 보낸다(쿠키에 BP 가 없는 옛 세션이거나 쿠키와 로그인 정보가 어긋남 —
 * proxy 가 보내지 못한다). 들어온 주소를 표시해 두고, 같은 남의 BP 주소로 다시 오면 proxy 가 쿠키의 BP 로 되돌린 것이다 — 쿠키와 로그인
 * 정보가 어긋났으니 BpMismatchError(로그아웃).
 */
function fixBpPath(ownBpCodeId: number, url: URL): Promise<never> {
  if (takeBpFix(url.pathname)) throw new BpMismatchError();
  markBpFix(url.pathname);
  return moveTo(bpPath(ownBpCodeId, stripBp(url.pathname)) + url.search + url.hash);
}

/** 주소를 바꿔 다시 연다(전체 로드 — proxy 가 새 주소의 헤더를 붙인다). 준비는 거기서 다시 하므로 이 준비는 끝나지 않고 로딩 화면이 남는다. */
function moveTo(href: string): Promise<never> {
  location.replace(href);
  return new Promise<never>(() => {});
}
