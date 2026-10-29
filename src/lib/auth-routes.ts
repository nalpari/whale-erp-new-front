// 로그인 뒤 어디로 가고, 어떤 경로가 로그인 없이 열리는지. proxy·서버 액션·헤더가 같이 쓴다.
// 로그인 후 화면은 루트 layout 의 AdminLayout 이 이 목록(isPublicPath)으로 가려 공통 틀을 씌우고, ERP·플랫폼은 탭의 서비스(SessionGate)로 가른다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

// 공개 경로만 목록으로 두고 나머지는 모두 로그인을 요구한다 — 새 화면 폴더를 깜빡해도 열리지 않고 막힌다(2026-10-12).
// 찾기·가입·도입문의·공지사항·매장운영·부가서비스·약관 전문은 로그인 전 화면이다. 공지사항(/notices, 상세 · 첨부 받기 포함)은 2026-10-21, 도입문의(/leads)는 2026-10-22 에 열렸다.
const PUBLIC_PATHS = ["/login", "/find", "/signup", "/leads", "/notices", "/store-operations", "/add-on-services", "/terms", "/design"];
export function isPublicPath(pathname: string): boolean {
  return pathname === "/" || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPlatformRole(roleTypeCode: string): boolean {
  return roleTypeCode === "PM" || roleTypeCode === "PA";
}

/**
 * 로그인한 채 이 로그인 전 화면에 오면 자기 홈(homeOf)으로 보낼지(proxy). 화면을 여는 GET 만 본다 — 서버 액션 POST 는 보내지 않는다.
 * /login · /find 는 쿠키만 있으면 보낸다 — 로그인이 끝났으면 홈에서 갱신에 실패해 결국 로그인 화면으로 오니 손해가 없다.
 * 로그인 전 홈(/, #289)은 접근 토큰이 살아 있을 때만 보낸다 — 1시간 넘게 쉬어 끝난 로그인의 쿠키로 홈을 보러 온 사람이 로그인 화면에 떨어지지 않게.
 * 다른 로그인 전 화면((site))은 보내지 않고 머리말에 「홈으로」를 둔다.
 */
export function redirectsSignedIn(pathname: string, method: string, session: { accessTokenExpiresAt: number } | null, now = Date.now()): boolean {
  if (method !== "GET" || !session) return false;
  if (pathname === "/login" || pathname === "/find") return true;
  return pathname === "/" && session.accessTokenExpiresAt > now;
}

/** 로그인 화면 주소의 돌아올 곳 쿼리 이름 — /login?next=/excel-downloads/41 */
export const RETURN_PARAM = "next";

/**
 * 로그인한 뒤 돌아올 수 있는 주소. 메일 링크로 들어오는 화면(1만 건 이상 엑셀 내려받기 /excel-downloads/{id})만 받는다 —
 * 아무 주소나 받으면 바깥 사이트로 보내는 링크(열린 리다이렉트)가 된다. 맞지 않으면 null(자기 홈으로 간다).
 */
export function returnPathOf(value: unknown): string | null {
  return typeof value === "string" && /^\/excel-downloads\/[1-9]\d{0,8}$/.test(value) ? value : null;
}

/** okf/auth.md — BP·가맹 계정은 웨일ERP(BP) 홈, 플랫폼 계정은 플랫폼관리 사이트. */
export function homeOf(roleTypeCode: string): "/platform" | "/home" {
  return isPlatformRole(roleTypeCode) ? "/platform" : "/home";
}
