// 종이 계약 등록 창구(/contracts/paper)의 요청 검사. proxy 와 라우트 핸들러가 같이 쓴다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

export const PAPER_ROUTE = "/contracts/paper";
/** 공지사항 등록 · 수정 창구(첨부 multipart, #276). 같은 까닭으로 401 을 준다. FAQ 는 첨부가 없어 서버 액션이다. */
export const NOTICE_SAVE_ROUTE = "/platform-notices/save";

/**
 * 로그인이 끊겼을 때 리다이렉트 대신 401 JSON 을 줄 경로 — fetch 가 부르는 BFF(/api/*)와 종이 계약 등록 · 공지사항 저장.
 * 리다이렉트를 주면 fetch 가 따라가 날인본을 실은 채 /login 으로 다시 POST 하고, 화면은 로그인으로 가지 못한다.
 */
export function answersWith401(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname === PAPER_ROUTE || pathname === NOTICE_SAVE_ROUTE;
}

/**
 * Origin 이 이 서버인가. Next 16.3 서버 액션과 같은 기준이다(action-handler 의 parseHostHeader) — x-forwarded-host 가
 * 있으면 쉼표 목록의 첫 값만 보고, 없을 때만 host 를 본다. Origin 이 없거나 읽을 수 없으면(null 포함) 막는다.
 */
export function sameOrigin(origin: string | null, forwardedHost: string | null, host: string | null): boolean {
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  if (!originHost) return false;
  const forwarded = forwardedHost?.split(",")[0]?.trim();
  const serverHost = forwarded || host;
  return !!serverHost && serverHost === originHost;
}
