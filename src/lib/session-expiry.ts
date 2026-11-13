// 로그인 만료를 알리는 길. next/* 를 import 하지 않는다 — node --test 가 그대로 읽고, 서버(api.ts)와 브라우저가 같이 쓴다.
// 서버: request() 가 api 401 을 받으면 isExpiry 로 만료인지 가른다 — 화면을 그리는 중이면 로그인 화면으로, 아니면 ApiError 에 expired 표시.
// 브라우저: bff() · useAction 이 만료를 알면 notifySessionExpired() 로 이벤트를 보내고, 로그인한 화면의 틀이 「로그인 만료」 팝업 하나를 띄운다.

/**
 * 401 이 만료가 아닌 api — 강제 비밀번호 변경(발급 비밀번호 만료) · 로그아웃 자체. 정확히 그 경로만 뺀다.
 * 탈퇴 최종 제출의 401 은 만료로 본다 — 탈퇴를 마치고 응답만 잃은 드문 경우도 다시 로그인하면 「탈퇴한 계정」으로 알게 된다(2026-11-11 사용자 지정).
 */
const NOT_EXPIRY = ["/auth/admin/password-change", "/auth/admin/logout"];

/** 이 api 401 이 로그인 만료인가 — 로그인 토큰을 실은 요청이고 만료 제외 경로가 아닐 때만. 토큰 없는 요청(로그인 · 공개 화면)의 401 은 만료가 아니다. */
export function isExpiry(path: string, hasAuthorization: boolean): boolean {
  return hasAuthorization && !NOT_EXPIRY.includes(path.split("?")[0]);
}

/**
 * request() 가 받은 실패를 어떻게 다룰지 — 만료가 아니면 null, 화면을 그리는 중이면 "login"(로그인 화면으로), 아니면 "mark"(ApiError 에 expired 표시).
 * sessionLost — 세션 쿠키 없이 온 서버 액션(다른 탭에서 만료, proxy 의 SESSION_LOST_HEADER). 토큰을 싣지 못했어도 만료다.
 * rendering · sessionLost 는 401 일 때만 묻는다(요청 머리를 읽는 일이라).
 */
export async function expiryHandlingOf(
  status: number,
  path: string,
  hasAuthorization: boolean,
  rendering: () => Promise<boolean>,
  sessionLost: () => Promise<boolean> = async () => false,
): Promise<"login" | "mark" | null> {
  if (status !== 401 || !isExpiry(path, hasAuthorization || (await sessionLost()))) return null;
  return (await rendering()) ? "login" : "mark";
}

export const SESSION_EXPIRED_EVENT = "whale-erp:session-expired";

/** 만료를 화면에 알린다. 여러 요청이 한꺼번에 실패해도 팝업은 하나다(팝업 쪽이 이미 열려 있으면 무시). */
export function notifySessionExpired(): void {
  dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

/**
 * 같은 출처의 받기 · 올리기 창구(Route Handler)를 fetch 로 부르는 함수를 감싼다. 401 이면 만료를 알리고(onExpired) 결과를 넘기지 않는다 —
 * useAction 과 같은 규칙이라 화면의 실패 처리가 돌지 않고 「로그인 만료」 팝업 하나만 뜬다. 그 밖의 응답은 그대로 돌려준다.
 */
export function expiringFetch(base: typeof fetch, onExpired: () => void = notifySessionExpired): typeof fetch {
  return async (input, init) => {
    const response = await base(input, init);
    if (response.status !== 401) return response;
    onExpired();
    return new Promise<Response>(() => {});
  };
}

/** 서버 액션 결과가 만료를 알리는가 — expiredFailureOf 가 실은 표시. 모양이 다른 결과(배열 · null)는 아니다. */
export function isExpiredResult(result: unknown): boolean {
  return typeof result === "object" && result !== null && (result as { expired?: unknown }).expired === true;
}
