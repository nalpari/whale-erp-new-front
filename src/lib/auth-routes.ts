// 로그인 뒤 어디로 가고, 어떤 경로가 로그인 없이 열리는지. proxy·서버 액션·헤더가 같이 쓴다.
// 로그인 후 화면은 루트 layout 의 AdminLayout 이 이 목록(isPublicPath)으로 가려 공통 틀을 씌우고, ERP·플랫폼은 탭의 서비스(SessionGate)로 가른다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

// 공개 경로만 목록으로 두고 나머지는 모두 로그인을 요구한다 — 새 화면 폴더를 깜빡해도 열리지 않고 막힌다(2026-10-12).
// 찾기·가입·도입문의·공지사항·매장운영·부가서비스·약관 전문은 로그인 전 화면이다. 찾기·도입문의·공지사항은 화면은 아직 없지만 링크가 걸려 있어, 로그인 화면으로 튕기지 않게 미리 연다.
const PUBLIC_PATHS = ["/login", "/find", "/signup", "/inquiry", "/notices", "/store-operations", "/add-on-services", "/terms", "/design"];
export function isPublicPath(pathname: string): boolean {
  return pathname === "/" || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPlatformRole(roleTypeCode: string): boolean {
  return roleTypeCode === "PM" || roleTypeCode === "PA";
}

/** okf/auth.md — BP·가맹 계정은 웨일ERP(BP) 홈, 플랫폼 계정은 플랫폼관리 사이트. */
export function homeOf(roleTypeCode: string): "/platform" | "/home" {
  return isPlatformRole(roleTypeCode) ? "/platform" : "/home";
}
