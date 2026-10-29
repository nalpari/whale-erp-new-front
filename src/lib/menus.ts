// login-info 의 메뉴 트리를 읽는 판정. next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
// 주소는 탭 BP 접두(/bp/{id})를 떼고 메뉴 url 과 비교한다 — 메뉴 url 은 옛 경로 그대로다(bp-path.ts).
import type { ServiceCode } from "./browser-storage";
import type { AdminMenu } from "./session";
import { stripBp } from "./bp-path.ts";

/**
 * 코드로 직접 찾는 메뉴(api 메뉴 시드 — 업무 API 도 이 코드로 메뉴 권한을 판정한다). 화면 자기 버튼의 권한은 코드 없이 주소로 찾는다(usePagePermission).
 * 여기 남는 것: 아직 usePagePermission 으로 옮기지 않은 화면(todos), 다른 메뉴의 권한을 보는 버튼(직원 상세의 TO-DO · 근무스케줄 · 급여명세서 링크 → todos · workSchedules · payslips,
 * 직원 정보 관리의 「직원 초대」 → contracts 등록, 직원 목록 · 상세의 가입 초대 재발송 → contracts 수정),
 * 권한이 아닌 용도(메뉴 관리의 자기 잠금 확인 → platformMenus). staffMembers 는 화면에서 쓰지 않는다 — 메뉴 판정 테스트가 MenuCode 로 쓰는 시드 값이다.
 */
export const MENU_CODE = { platformMenus: "MN000215", staffMembers: "MN000005", contracts: "MN000006", payslips: "MN000009", workSchedules: "MN000010", todos: "MN000026" } as const;
export type MenuCode = (typeof MENU_CODE)[keyof typeof MENU_CODE];
export type MenuAction = keyof AdminMenu["permission"];

/** 서비스마다의 홈. 메뉴에 없어도 늘 열린다. */
export const HOME: Record<ServiceCode, string> = { WHALE_ERP: "/home", PLATFORM: "/platform" };
/** BP 이동 화면 — ?bp= 의 BP 로 이 탭을 준비하고 그 서비스의 홈으로 간다(SessionGate). 주소 자체로 이동해야(전체 로드) 준비가 돈다. */
export const BP_SWITCH_PATH = "/bp-switch";

/**
 * BP 이동 화면 주소. BP 선택 팝업은 이것으로만 만든다(읽는 쪽은 bpOfSwitchUrl).
 * bpCode 는 그 BP 를 서버에서 찾을 때의 검색어다 — 상호 · 코드는 주소를 믿지 않고 서버에서 받는다.
 */
export function bpSwitchUrl(bpCodeId: number, bpCode: string): string {
  return `${BP_SWITCH_PATH}?${new URLSearchParams({ bp: String(bpCodeId), bpCode })}`;
}

/**
 * BP 이동 화면 주소의 BP. ?bp= 는 이 화면의 것만 받는다 — 다른 주소이거나 bp 가 숫자가 아니면 null.
 * bpCode 는 형식(BP+6자리)이 맞을 때만 둔다. 틀린 값으로 찾으면 api 가 400 으로 막아, 안내 대신 다시 시도만 되풀이하게 된다.
 */
export function bpOfSwitchUrl(url: URL): { bpCodeId: number; bpCode: string | null } | null {
  if (url.pathname !== BP_SWITCH_PATH) return null;
  const id = url.searchParams.get("bp");
  const code = url.searchParams.get("bpCode");
  return id && /^\d{1,10}$/.test(id) ? { bpCodeId: Number(id), bpCode: code && /^BP\d{6}$/.test(code) ? code : null } : null;
}

export function findMenu(menus: AdminMenu[], match: (m: AdminMenu) => boolean): AdminMenu | undefined {
  for (const m of menus) {
    if (match(m)) return m;
    const found = findMenu(m.children, match);
    if (found) return found;
  }
}

/** 그 서비스의 메뉴만 남긴다(하위 메뉴까지). 플랫폼 계정은 두 서비스 메뉴를 모두 받으므로 탭의 서비스로 거른다. */
export function menusOf(menus: AdminMenu[], service: ServiceCode): AdminMenu[] {
  return menus.filter((m) => m.serviceCode === service).map((m) => ({ ...m, children: menusOf(m.children, service) }));
}

// shortcut: 알림 템플릿 관리는 api 메뉴 데이터에 아직 없어(1팀 전달 사항 14번) 플랫폼 서비스에서 임시로 열고 헤더에도 공통코드 관리 다음에 넣는다.
// api 에 메뉴 행이 생기면 이 상수와 쓰는 곳(isAllowed · serviceOfPath · admin-header)을 지운다. 메뉴에 이미 있으면 따로 더하지 않는다.
export const PENDING_PLATFORM_MENU = { name: "알림 템플릿 관리", url: "/platform/notification-templates", after: "/code-groups" };

/**
 * 메뉴 없이 로그인한 관리자면 어느 탭 서비스에서나 여는 화면. 권한은 메뉴가 아니라 api 가 따로 본다.
 * /excel-downloads/{id} — 1만 건 이상 엑셀 예약 생성 완료 메일의 링크. 요청한 본인인지(404)와 그 화면 조회 권한이 아직 있는지(403)는
 * api 가 내려받을 때 다시 본다.
 */
export const MENULESS_PATHS = ["/excel-downloads"];

const isUnder = (pathname: string, url: string) => pathname === url || pathname.startsWith(`${url}/`);

/**
 * 이 주소가 어느 서비스 화면인가. 홈이거나 조회 권한이 있는 메뉴 주소(그 아래 포함)로 정하고, 모르면 null.
 * 탭 값이 없는 새 탭이 어느 서비스로 열릴지 정할 때 쓴다(resolveTab).
 */
export function serviceOfPath(menus: AdminMenu[], path: string): ServiceCode | null {
  const pathname = stripBp(path);
  for (const service of Object.keys(HOME) as ServiceCode[]) if (pathname === HOME[service]) return service;
  if (isUnder(pathname, PENDING_PLATFORM_MENU.url)) return "PLATFORM";
  const menu = findMenu(menus, (m) => m.permission.read && !!m.url && isUnder(pathname, m.url));
  // 공통코드 SERVICE 에는 POS·KIOSK 도 있다. 관리자 웹이 여는 서비스(HOME 에 있는 것)만 받는다.
  const s = menu?.serviceCode;
  return s && s in HOME ? (s as ServiceCode) : null;
}

/**
 * 이 탭(서비스)에서 이 주소를 열 수 있는가 — 그 서비스의 홈, 메뉴 없는 화면(MENULESS_PATHS), 임시 플랫폼 메뉴(PENDING_PLATFORM_MENU), 또는 menuOfPath 가 메뉴를 찾는 주소.
 * 다른 서비스의 화면은 권한이 있어도 열지 않는다 — 플랫폼 탭에서 ERP 주소를 치면 BP 없이 ERP 화면이 열리게 된다.
 * 하위 메뉴로 가는 길로만 들어온 상위 메뉴는 조회 권한이 false 라, 그 url 아래의 권한 없는 화면을 열어 주지 않는다(2026-10-14).
 * 헤더는 2단계까지 그리지만 판정은 모든 깊이(메뉴는 최대 3단계)를 본다.
 */
export function isAllowed(menus: AdminMenu[], path: string, service: ServiceCode): boolean {
  const pathname = stripBp(path);
  if (pathname === HOME[service]) return true;
  if (MENULESS_PATHS.some((url) => isUnder(pathname, url))) return true;
  if (service === "PLATFORM" && isUnder(pathname, PENDING_PLATFORM_MENU.url)) return true;
  return menuOfPath(menus, pathname, service) !== null;
}

/**
 * 이 주소가 어느 메뉴의 화면인가 — 이 탭 서비스에서 조회 권한이 있고, 주소가 그 url 이거나 그 아래(상세 · 등록 등)인 메뉴.
 * 여럿이 맞으면 url 이 가장 긴(가장 구체적인) 메뉴다 — 같은 url 은 api 가 사용 중 메뉴끼리 막는다(생기면 트리 앞쪽 메뉴).
 * 홈 · 알림 템플릿(메뉴 행 없음)처럼 메뉴가 아닌 화면이면 null.
 * 화면이 열리는 판정(isAllowed)과 그 화면 버튼의 권한(usePagePermission)이 이 함수 하나를 본다.
 */
export function menuOfPath(menus: AdminMenu[], path: string, service: ServiceCode): AdminMenu | null {
  const pathname = stripBp(path);
  let found: AdminMenu | null = null;
  const walk = (list: AdminMenu[]) => {
    for (const m of list) {
      if (m.permission.read && m.url && isUnder(pathname, m.url) && (!found?.url || m.url.length > found.url.length)) found = m;
      walk(m.children);
    }
  };
  walk(menusOf(menus, service));
  return found;
}

/**
 * 메뉴 하나의 권한 칸(조회 · 등록 · 수정 · 삭제). 이 탭 서비스의 메뉴 트리에서 메뉴 코드로 찾고(3단계까지), 없으면 false.
 * 화면은 버튼을 보이거나 숨기기만 한다 — 막는 것은 api 다.
 */
export function menuPermissionOf(menus: AdminMenu[], service: ServiceCode, menuCode: MenuCode, action: MenuAction): boolean {
  return findMenu(menusOf(menus, service), (m) => m.menuCode === menuCode)?.permission[action] ?? false;
}
