// 로그인 뒤 어디로 가고, 어떤 경로가 로그인 없이 열리는지. proxy·서버 액션·헤더가 같이 쓴다.
// 로그인 후 화면은 루트 layout 의 AdminLayout 이 이 목록(isPublicPath)으로 가려 공통 틀을 씌우고, ERP·플랫폼은 탭의 서비스(SessionGate)로 가른다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

// 공개 경로만 목록으로 두고 나머지는 모두 로그인을 요구한다 — 새 화면 폴더를 깜빡해도 열리지 않고 막힌다(2026-10-12).
// 찾기·가입·도입문의·공지사항·매장운영·부가서비스·약관 전문은 로그인 전 화면이다. 공지사항(/notices, 상세 · 첨부 받기 포함)은 2026-10-21, 도입문의(/leads)는 2026-10-22 에 열렸다.
const PUBLIC_PATHS = ["/login", "/find", "/signup", "/leads", "/notices", "/store-operations", "/finance-management", "/franchise", "/add-on-services", "/terms", "/design"];
export function isPublicPath(pathname: string): boolean {
  return pathname === "/" || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPlatformRole(roleTypeCode: string): boolean {
  return roleTypeCode === "PM" || roleTypeCode === "PA";
}

/** 가맹 마스터 · 가맹 관리자 — 점포를 등록하지 못하고(api 403) 매핑된 점포만 다룬다 */
export function isFranchiseRole(roleTypeCode: string): boolean {
  return roleTypeCode === "FM" || roleTypeCode === "FA";
}

/**
 * 접근 토큰이 아직 살아 있는 세션인지. 로그인 전 화면은 proxy 가 토큰을 갱신하지 않으므로, 쿠키가 있어도 토큰이 끝났으면 로그인 전으로 본다.
 * 로그인 전 홈의 「자기 홈으로」(redirectsSignedIn)와 루트 layout 의 운영 알림 종이 같이 쓴다 — 끝난 토큰으로 종이 알림을 불러 401 을 남기지 않게(2026-11-12).
 */
export function hasLiveAccessToken(session: { accessTokenExpiresAt: number } | null, now = Date.now()): boolean {
  return session !== null && session.accessTokenExpiresAt > now;
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
  return pathname === "/" && hasLiveAccessToken(session, now);
}

/** 로그인 화면이 밀려난 이유를 알리는 쿼리 — /login?reason=account. 값은 아래 이유뿐이고, 모르는 값은 무시한다. */
export const LOGOUT_REASON_PARAM = "reason";
/** 계정 상태(사용중지 · 탈퇴 · 소속 BP)가 바뀌어 로그아웃됨 — 경우를 나누지 않고 한 문장으로 알린다(2026-11-02 사용자 지정). */
export const ACCOUNT_CHANGED_REASON = "account";
export const ACCOUNT_CHANGED_MESSAGE = "계정 상태가 변경되어 로그아웃되었습니다.";
/** 로그인이 끊겨 밀려남(갱신 실패 · api 401). 이 브라우저로 로그인한 적이 있을 때만 붙인다(proxy 의 login-key 확인). */
export const EXPIRED_REASON = "expired";
export const EXPIRED_MESSAGE = "로그인이 만료되었습니다. 다시 로그인해 주세요.";
type LogoutReason = typeof ACCOUNT_CHANGED_REASON | typeof EXPIRED_REASON;
/** 로그인 화면 쿼리의 이유 → 안내 문구. 모르는 값이면 null. */
export const logoutNoticeOf = (value: unknown): string | null =>
  value === ACCOUNT_CHANGED_REASON ? ACCOUNT_CHANGED_MESSAGE : value === EXPIRED_REASON ? EXPIRED_MESSAGE : null;

/** 로그인 화면 주소의 돌아올 곳 쿼리 이름 — /login?next=/excel-downloads/41 */
export const RETURN_PARAM = "next";

/**
 * 로그인한 뒤 돌아올 수 있는 주소. 메일 링크로 들어오는 화면(1만 건 이상 엑셀 내려받기 /excel-downloads/{id})만 받는다 —
 * 아무 주소나 받으면 바깥 사이트로 보내는 링크(열린 리다이렉트)가 된다. 맞지 않으면 null(자기 홈으로 간다).
 */
export function returnPathOf(value: unknown): string | null {
  return typeof value === "string" && /^\/excel-downloads\/[1-9]\d{0,8}$/.test(value) ? value : null;
}

/**
 * 로그인 없이 이 주소에 온 사람을 보낼 로그인 화면 주소(proxy · 화면의 401). 화면을 여는 GET 이고 돌아올 수 있는 주소(returnPathOf)면
 * /login?next= 로, 아니면 /login. 서버 액션 POST 에는 붙이지 않는다 — 로그인 뒤 POST 주소로 돌아갈 수 없다.
 * reason 을 주면 ?reason= 도 붙여 로그인 화면이 밀려난 이유를 알린다(logoutNoticeOf).
 */
export function loginPathOf(pathname: string, method = "GET", reason?: LogoutReason): string {
  const back = method === "GET" ? returnPathOf(pathname) : null;
  const query = new URLSearchParams();
  if (back) query.set(RETURN_PARAM, back);
  if (reason) query.set(LOGOUT_REASON_PARAM, reason);
  return query.size ? `/login?${query}` : "/login";
}

/**
 * proxy 가 서버 화면 요청에만 붙이는 내부 헤더. request() 가 api 401 을 받았을 때 화면을 그리는 중이면(이 헤더) 로그인 화면으로 보내고,
 * 서버 액션 · BFF · 업로드 창구면 오류에 만료 표시만 남긴다 — 서버 액션에서 이동하면 팝업 없이 넘어가고, 대부분의 catch 가 이동 신호를 삼킨다.
 * 값은 그 화면 주소(pathname)다 — 로그인 화면이 돌아올 곳(?next=)을 proxy 의 toLogin 과 같게 만든다(loginPathOf 가 돌아올 수 있는 화면만 남긴다).
 * 브라우저가 보낸 같은 헤더는 proxy 가 늘 지운다.
 */
export const RENDER_HEADER = "x-whale-render";

/** 이 요청이 화면(문서 · RSC)을 그리는 GET 인가 — 서버 액션 · BFF(/api/*) · 업로드 창구(answersWith401)는 아니다. */
export function marksRenderRequest(method: string, isAction: boolean, isApiPath: boolean): boolean {
  return method === "GET" && !isAction && !isApiPath;
}

/**
 * proxy 가 「세션 쿠키 없이 온 서버 액션」에 붙이는 내부 헤더. 다른 탭에서 만료돼 쿠키가 지워진 뒤 이 탭에서 저장하면 세션이 없다 —
 * 로그인 화면으로 보내면 액션 fetch 가 따라가 「결과를 확인하지 못했습니다」가 되므로, 통과시키고 request() 가 api 401 을 만료로 표시한다(useAction 팝업).
 * 브라우저가 보낸 같은 헤더는 proxy 가 늘 지운다.
 */
export const SESSION_LOST_HEADER = "x-whale-session-lost";

/**
 * 세션 없이 온 요청을 로그인 화면 대신 통과시킬까 — 이 브라우저로 로그인한 적이 있는(login-key) 화면 주소의 서버 액션만.
 * POST 만 — Next 는 POST 만 서버 액션으로 처리한다. next-action 헤더를 꾸민 GET 은 화면을 그리므로 로그인 없이 보이게 된다(PR #256 리뷰).
 * fetch 창구(answersWith401 — BFF · 업로드 · 엑셀)는 빼고 지금처럼 401 을 준다 — 라우트 핸들러는 액션이 아니고, 토큰 확인을 빠뜨린 창구가 생겨도 proxy 가 막는다.
 */
export function passesSessionLostAction(method: string, isAction: boolean, isApiPath: boolean, hasLoginKey: boolean): boolean {
  return method === "POST" && isAction && !isApiPath && hasLoginKey;
}

/**
 * 만료 로그인 화면(/login?reason=expired)에 세션 쿠키를 들고 왔을 때 proxy 가 갱신으로 확인한 결과의 처리.
 * 갱신 401 이면 세션이 정말 끝났으니 쿠키를 지우고 로그인 화면, 살아 있으면 홈으로, 그 밖(api 꺼짐 · 시간 초과)은 쿠키를 두고 로그인 화면.
 * 살아 있는 세션은 지우지 않으므로 이 주소를 링크로 걸어도 로그아웃되지 않는다.
 */
export function expiredLoginActionOf(refreshed: "unauthorized" | "ok" | "failed"): "clear" | "home" | "show" {
  return refreshed === "unauthorized" ? "clear" : refreshed === "ok" ? "home" : "show";
}

/** 만료 로그인 화면 GET 인가 — 로그인 제출(서버 액션 POST)도 같은 주소로 가므로 GET 만 본다. */
export function isExpiredLoginRequest(pathname: string, method: string, isAction: boolean, reason: string | null): boolean {
  return pathname === "/login" && method === "GET" && !isAction && reason === EXPIRED_REASON;
}

/**
 * 로그인한 채 로그인 전 화면(redirectsSignedIn)에 온 사람을 보낼 곳. /login 에 돌아올 곳(?next=, 메일 링크)이 있으면 그리로 —
 * 다른 탭에서 이미 로그인한 채 메일 링크를 연 경우다. 그 밖에는 자기 홈. next 는 returnPathOf 를 거쳐 바깥 주소로 보내지 않는다.
 */
export function signedInTargetOf(pathname: string, next: string | null, home: string): string {
  return (pathname === "/login" ? returnPathOf(next) : null) ?? home;
}

/** okf/auth.md — BP·가맹 계정은 웨일ERP(BP) 홈, 플랫폼 계정은 플랫폼관리 사이트. */
export function homeOf(roleTypeCode: string): "/platform" | "/home" {
  return isPlatformRole(roleTypeCode) ? "/platform" : "/home";
}
