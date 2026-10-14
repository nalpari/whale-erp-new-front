// login-info 의 메뉴 트리를 읽는 판정. next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
import type { AdminMenu } from "./session";

export function findMenu(menus: AdminMenu[], match: (m: AdminMenu) => boolean): AdminMenu | undefined {
  for (const m of menus) {
    if (match(m)) return m;
    const found = findMenu(m.children, match);
    if (found) return found;
  }
}

/**
 * 이 주소를 열 수 있는가. 영역 홈이거나, 조회 권한이 있는 메뉴의 주소 또는 그 아래(상세·등록 등)면 연다.
 * 하위 메뉴로 가는 길로만 들어온 상위 메뉴는 조회 권한이 false 라, 그 url 아래의 권한 없는 화면을 열어 주지 않는다(2026-10-14).
 * 헤더는 2단계까지 그리지만 판정은 3단계까지 본다.
 */
export function isAllowed(menus: AdminMenu[], pathname: string, home: string): boolean {
  if (pathname === home) return true;
  return !!findMenu(menus, (m) => m.permission.read && !!m.url && (pathname === m.url || pathname.startsWith(`${m.url}/`)));
}
