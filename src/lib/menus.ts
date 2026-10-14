// login-info 의 메뉴 트리를 읽는 판정. next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
import type { AdminMenu } from "./session";

export function findMenu(menus: AdminMenu[], match: (m: AdminMenu) => boolean): AdminMenu | undefined {
  for (const m of menus) {
    if (match(m)) return m;
    const found = findMenu(m.children, match);
    if (found) return found;
  }
}

// shortcut: 알림 템플릿 관리는 api 메뉴 데이터에 아직 없어(1팀 전달 사항 14번) 플랫폼 화면에서 임시로 열고 헤더에도 공통코드 관리 다음에 넣는다.
// api 에 메뉴 행이 생기면 이 상수와 쓰는 곳(isAllowed · admin-header)을 지운다. 메뉴에 이미 있으면 따로 더하지 않는다.
export const PENDING_PLATFORM_MENU = { name: "알림 템플릿 관리", url: "/platform/notification-templates", after: "/platform/system/codes" };

const isUnder = (pathname: string, url: string) => pathname === url || pathname.startsWith(`${url}/`);

/**
 * 이 주소를 열 수 있는가. 영역 홈이거나, 조회 권한이 있는 메뉴의 주소 또는 그 아래(상세·등록 등)면 연다.
 * 하위 메뉴로 가는 길로만 들어온 상위 메뉴는 조회 권한이 false 라, 그 url 아래의 권한 없는 화면을 열어 주지 않는다(2026-10-14).
 * 헤더는 2단계까지 그리지만 판정은 3단계까지 본다.
 */
export function isAllowed(menus: AdminMenu[], pathname: string, home: string): boolean {
  if (pathname === home) return true;
  if (home === "/platform" && isUnder(pathname, PENDING_PLATFORM_MENU.url)) return true;
  return !!findMenu(menus, (m) => m.permission.read && !!m.url && isUnder(pathname, m.url));
}
