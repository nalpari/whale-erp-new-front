// 로그인 뒤 어디로 가고, 어떤 경로가 로그인 없이 열리는지. proxy·서버 액션·헤더가 같이 쓴다.
// ERP·플랫폼 영역은 주소가 아니라 화면 폴더((erp)·(platform) 레이아웃)가 정하고, 메뉴는 serviceCode 로 가른다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

// 공개 경로만 목록으로 두고 나머지는 모두 로그인을 요구한다 — 새 화면 폴더를 깜빡해도 열리지 않고 막힌다(2026-10-12).
// 찾기·가입·도입문의·공지사항은 로그인 전 화면이다. 화면은 아직 없지만 링크가 걸려 있어, 로그인 화면으로 튕기지 않게 미리 연다.
const PUBLIC_PATHS = ["/login", "/find", "/signup", "/inquiry", "/notices", "/design"];
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

// shortcut: 공통코드 ROLE_TYPE 의 한글을 여기 적었다. naming.md 는 getCodes(group) 로 받으라 하지만 그 조회 API 가 아직 없다 — 생기면 지운다.
const ROLE_LABEL: Record<string, string> = {
  PM: "플랫폼 마스터",
  PA: "플랫폼 관리자",
  BM: "BP 마스터",
  BA: "BP 관리자",
  FM: "가맹 마스터",
  FA: "가맹 관리자",
};

export function roleLabel(roleTypeCode: string): string {
  return ROLE_LABEL[roleTypeCode] ?? roleTypeCode;
}
