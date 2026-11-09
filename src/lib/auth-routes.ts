// 로그인 뒤 어디로 가고, 어떤 경로가 로그인 없이 열리는지. proxy·서버 액션·헤더가 같이 쓴다.
// 로그인 후 화면은 루트 layout 의 AdminLayout 이 이 목록(isPublicPath)으로 가려 공통 틀을 씌우고, ERP·플랫폼은 탭의 서비스(SessionGate)로 가른다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

import { stripBp } from "./bp-path.ts";
import { answersWith401 } from "./paper-request.ts";

// 공개 경로만 목록으로 두고 나머지는 모두 로그인을 요구한다 — 새 화면 폴더를 깜빡해도 열리지 않고 막힌다(2026-10-12).
// 찾기·가입·도입문의·공지사항·매장운영·부가서비스·약관 전문은 로그인 전 화면이다. 공지사항(/notices, 상세 · 첨부 받기 포함)은 2026-10-21, 도입문의(/leads)는 2026-10-22 에 열렸다.
const PUBLIC_PATHS = ["/login", "/find", "/signup", "/leads", "/notices", "/store-operations", "/add-on-services", "/terms", "/design"];
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

/** 로그인 화면이 밀려난 이유를 알리는 쿼리 — /login?reason=account · /login?reason=expired. 값은 아래 이유뿐이고, 모르는 값은 무시한다. */
export const LOGOUT_REASON_PARAM = "reason";
/** 계정 상태(사용중지 · 탈퇴 · 소속 BP)가 바뀌어 로그아웃됨 — 경우를 나누지 않고 한 문장으로 알린다(2026-11-02 사용자 지정). */
export const ACCOUNT_CHANGED_REASON = "account";
export const ACCOUNT_CHANGED_MESSAGE = "계정 상태가 변경되어 로그아웃되었습니다.";
/** 이 브라우저에서 로그인해 있다가 세션이 끝남(시간 만료 · 다른 곳 로그인 · 관리자 초기화) — api 가 이유를 알리지 않아 한 문장(2026-11-05 결정). */
export const EXPIRED_REASON = "expired";
export const EXPIRED_MESSAGE = "로그인이 만료되었습니다. 다시 로그인해 주세요.";
const NOTICES: Record<string, string> = { [ACCOUNT_CHANGED_REASON]: ACCOUNT_CHANGED_MESSAGE, [EXPIRED_REASON]: EXPIRED_MESSAGE };
/** 세션 없이 온 서버 액션이 만료 표시 쿠키를 받아야 하는가 — 로그인 키가 있으면 이 브라우저에서 로그인해 있다가 끊긴 것이다. */
export const marksExpiredOnLogin = (isAction: boolean, hasLoginKey: boolean): boolean => isAction && hasLoginKey;
/** 로그인 화면 쿼리의 이유 → 안내 문구. 모르는 값이면 null. */
export const logoutNoticeOf = (value: unknown): string | null => (typeof value === "string" && Object.hasOwn(NOTICES, value) ? NOTICES[value] : null);

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
 * reason 이 있으면 ?reason= 도 붙인다.
 */
export function loginPathOf(pathname: string, method = "GET", reason?: string): string {
  const back = method === "GET" ? returnPathOf(pathname) : null;
  const params = new URLSearchParams();
  if (back) params.set(RETURN_PARAM, back);
  if (reason) params.set(LOGOUT_REASON_PARAM, reason);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
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

/**
 * 세션 쿠키를 들고 /login?reason=expired 를 연 요청을 proxy 가 갱신으로 확인할지. 서버가 그리는 화면은 쿠키를 지울 수 없어
 * 이 주소로 보내고 proxy 가 정리한다(request() 의 redirectExpired). 화면을 여는 GET 만 — 로그인 제출(서버 액션 POST)도 이 주소로 가므로,
 * 거기서 쿠키를 지우면 로그인 액션이 쓰는 새 쿠키와 같은 응답에서 겹친다(proxy 의 서버 액션 갱신 건너뛰기와 같은 이유).
 */
export function checksExpiredLogin(pathname: string, method: string, isAction: boolean, reason: string | null): boolean {
  return pathname === "/login" && method === "GET" && !isAction && reason === EXPIRED_REASON;
}

export type ExpiredLoginStep = "clear" | "home" | "stay";
/** 위 확인의 갱신 결과 → 할 일. 401 = 세션이 끝남(쿠키 삭제 후 로그인 화면), 200 = 살아 있음(새 쿠키 · 홈), 그 밖(api 꺼짐 · 시간 초과 · 5xx) = 쿠키를 두고 로그인 화면. */
export function expiredLoginStepOf(refreshed: "unauthorized" | "ok" | "failed"): ExpiredLoginStep {
  return refreshed === "unauthorized" ? "clear" : refreshed === "ok" ? "home" : "stay";
}

/** 서버가 그리는 화면 요청 표시 — proxy 가 붙이는 내부 요청 헤더. request() 가 보고 api 401 이면 만료 로그인으로 보낸다. 브라우저가 보낸 값은 proxy 가 늘 지운다. */
export const RENDER_HEADER = "x-whale-render";
/** 화면 · RSC 를 그리는 GET 인가(proxy). 서버 액션과 401 JSON 을 주는 창구(BFF /api/* · 업로드, 탭 BP 주소 포함)는 아니다 — 거기서 이동하면 fetch 가 따라간다. */
export function marksRenderRequest(pathname: string, method: string, isAction: boolean): boolean {
  return method === "GET" && !isAction && !answersWith401(stripBp(pathname));
}
/** request() 가 받은 api 응답으로 만료 로그인(/login?reason=expired)으로 보낼지 — 토큰을 실은 화면 요청의 401 만. 토큰 없이 받은 401 은 끝난 로그인이 아니다. */
export const redirectsOnExpiry = (status: number, hasAuthorization: boolean, isRender: boolean): boolean => status === 401 && hasAuthorization && isRender;
