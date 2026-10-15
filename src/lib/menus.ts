// login-info 의 메뉴 트리를 읽는 판정. next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
import type { ServiceCode } from "./browser-storage";
import type { AdminMenu } from "./session";

/** 서비스마다의 홈. 메뉴에 없어도 늘 열린다. */
export const HOME: Record<ServiceCode, string> = { WHALE_ERP: "/home", PLATFORM: "/platform" };

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
export const PENDING_PLATFORM_MENU = { name: "알림 템플릿 관리", url: "/platform/notification-templates", after: "/platform/system/codes" };

const isUnder = (pathname: string, url: string) => pathname === url || pathname.startsWith(`${url}/`);

/**
 * 이 주소가 어느 서비스 화면인가. 홈이거나 조회 권한이 있는 메뉴 주소(그 아래 포함)로 정하고, 모르면 null.
 * 탭 값이 없는 새 탭이 어느 서비스로 열릴지 정할 때 쓴다(resolveTab).
 */
export function serviceOfPath(menus: AdminMenu[], pathname: string): ServiceCode | null {
  for (const service of Object.keys(HOME) as ServiceCode[]) if (pathname === HOME[service]) return service;
  if (isUnder(pathname, PENDING_PLATFORM_MENU.url)) return "PLATFORM";
  const menu = findMenu(menus, (m) => m.permission.read && !!m.url && isUnder(pathname, m.url));
  // 공통코드 SERVICE 에는 POS·KIOSK 도 있다. 관리자 웹이 여는 서비스(HOME 에 있는 것)만 받는다.
  const s = menu?.serviceCode;
  return s && s in HOME ? (s as ServiceCode) : null;
}

/**
 * 이 탭(서비스)에서 이 주소를 열 수 있는가. 그 서비스의 홈이거나, 그 서비스에서 조회 권한이 있는 메뉴의 주소 또는 그 아래(상세·등록 등)면 연다.
 * 다른 서비스의 화면은 권한이 있어도 열지 않는다 — 플랫폼 탭에서 ERP 주소를 치면 BP 없이 ERP 화면이 열리게 된다.
 * 하위 메뉴로 가는 길로만 들어온 상위 메뉴는 조회 권한이 false 라, 그 url 아래의 권한 없는 화면을 열어 주지 않는다(2026-10-14).
 * 헤더는 2단계까지 그리지만 판정은 3단계까지 본다.
 */
export function isAllowed(menus: AdminMenu[], pathname: string, service: ServiceCode): boolean {
  if (pathname === HOME[service]) return true;
  if (service === "PLATFORM" && isUnder(pathname, PENDING_PLATFORM_MENU.url)) return true;
  return !!findMenu(menusOf(menus, service), (m) => m.permission.read && !!m.url && isUnder(pathname, m.url));
}
