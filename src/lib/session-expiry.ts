// 세션 만료를 화면에 알리는 길. next/* 를 import 하지 않는다 — node --test 가 그대로 읽고, 서버(api.ts)도 같은 이름 · 판정을 쓴다.
// 서버: 서버 액션이 api 401 을 받으면 세션 쿠키를 지우고 표시 쿠키(시각, 30초)를 심는다(api.ts markSessionExpired).
// 브라우저: window.fetch 를 한 번 감싸 서버 액션 응답에 처음 보는 표시가 있으면 신호를 보내고 결과를 화면에 넘기지 않는다 —
// 화면마다의 401 처리 없이 팝업 하나만 뜬다(SessionGate). BFF 조회 · 업로드 창구 401 은 그 자리에서 notifySessionExpired() 를 부른다.
// 서버 액션이 window.fetch 로 나가는 것은 Next 16.3.3 소스(segment-cache/fetch.js · server-action-reducer.js)로 확인한 사실이지
// 약속된 동작이 아니다. Next 를 올릴 때 다시 확인한다 — 깨지면 서버 액션 401 은 api 문구로 보인다(대체 장치 없음, 2026-11-05).

export const EXPIRED_COOKIE = "session-expired";
export const SESSION_EXPIRED_EVENT = "whale-erp:session-expired";

/** 401 이 만료가 아닌 api — 발급 비밀번호 만료 · 이미 탈퇴됐을 수 있는 최종 제출 · 로그아웃 자체. 정확히 그 경로만 뺀다. */
const NOT_EXPIRY = ["/auth/admin/password-change", "/auth/admin/me/withdraw", "/auth/admin/logout"];

/** document.cookie 에서 표시 쿠키 값. 없으면 null. */
export function expiredMarkOf(cookie: string): string | null {
  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === EXPIRED_COOKIE) return value.join("=") || null;
  }
  return null;
}

/** 표시 쿠키. 화면 스크립트가 읽어야 해서 httpOnly 가 아니다. 읽어도 지우지 않고 30초 뒤 사라진다 — 로그인 성공 때도 지운다. */
export function expiredCookie(now: number) {
  return { name: EXPIRED_COOKIE, value: String(now), maxAge: 30, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
}

/** 이 api 401 로 세션 쿠키를 지우고 표시를 심을지 — 토큰을 실은 서버 액션 요청이고 제외 경로가 아닐 때만. */
export function marksExpiry(path: string, init: RequestInit, isAction: boolean): boolean {
  if (!isAction || !new Headers(init.headers).has("authorization")) return false;
  const bare = path.split("?")[0];
  return !NOT_EXPIRY.includes(bare);
}

const isActionRequest = (input: RequestInfo | URL, init?: RequestInit) =>
  new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).has("next-action");

/** base 를 감싼 fetch. 감쌀 때 있던 표시는 본 것으로 둔다 — 앞 탭의 표시로 이 탭이 팝업을 띄우지 않게. */
export function watchedFetch(base: typeof fetch, readMark: () => string | null, onExpired: () => void): typeof fetch {
  let seen = readMark();
  return async (input, init) => {
    const response = await base(input, init);
    if (!isActionRequest(input, init)) return response;
    const mark = readMark();
    if (mark === null || mark === seen) return response;
    seen = mark;
    onExpired();
    // 화면의 실패 처리가 돌지 않게 끝나지 않는다. 팝업 [확인]이 location.replace 로 화면을 떠난다.
    return new Promise<Response>(() => {});
  };
}

export function notifySessionExpired(): void {
  dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

let installed = false;
/** 한 번만 감싼다(SessionGate 가 화면이 열릴 때 부른다). */
export function installSessionExpiryWatch(): void {
  if (installed) return;
  installed = true;
  window.fetch = watchedFetch(window.fetch.bind(window), () => expiredMarkOf(document.cookie), notifySessionExpired);
}
