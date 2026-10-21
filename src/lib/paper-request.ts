// 종이 계약 등록(/contracts/paper) · 공지사항 저장(/platform-notices/save) · 문의 등록(/support-inquiries/save) 창구의 요청 검사. proxy 와 라우트 핸들러가 같이 쓴다.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.

export const PAPER_ROUTE = "/contracts/paper";
/** 공지사항 등록 · 수정 창구(첨부 multipart, #276). 같은 까닭으로 401 을 준다. FAQ 는 첨부가 없어 서버 액션이다. */
export const NOTICE_SAVE_ROUTE = "/platform-notices/save";
/** 고객지원 문의 등록 창구(첨부 multipart, #284). */
export const INQUIRY_SAVE_ROUTE = "/support-inquiries/save";

/**
 * 로그인이 끊겼을 때 리다이렉트 대신 401 JSON 을 줄 경로 — fetch 가 부르는 BFF(/api/*)와 종이 계약 등록 · 공지사항 저장 · 문의 등록.
 * 리다이렉트를 주면 fetch 가 따라가 날인본을 실은 채 /login 으로 다시 POST 하고, 화면은 로그인으로 가지 못한다.
 */
export function answersWith401(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname === PAPER_ROUTE || pathname === NOTICE_SAVE_ROUTE || pathname === INQUIRY_SAVE_ROUTE;
}

const MB = 1024 * 1024;
export const TOO_LARGE = "보낸 내용이 너무 큽니다. 첨부를 줄여서 다시 보내 주세요";

/**
 * 경로별 요청 본문 상한. next.config 의 proxyClientMaxBodySize(51MB)는 모든 경로에 걸리므로, proxy 가 content-length 로 경로마다 다시 막는다.
 * 공지사항 저장 · 문의 등록은 첨부 5 × 10MB, 종이 계약 등록은 날인본 2 × 10MB 에 multipart 여유 1MB 를 더한다. 나머지는 Next 기본 proxy 한도(10MB)다.
 */
export function bodyLimitOf(pathname: string): number {
  if (pathname === NOTICE_SAVE_ROUTE || pathname === INQUIRY_SAVE_ROUTE) return 51 * MB;
  if (pathname === PAPER_ROUTE) return 21 * MB;
  return 10 * MB;
}

/**
 * content-length 가 그 경로의 상한을 넘는가. 길이 없이 나눠 보내면(transfer-encoding: chunked) 크기를 미리 알 수 없어 경로별 상한을
 * 건너뛰고 전역 51MB 만 걸리므로 막는다 — 화면(fetch · 서버 액션)은 늘 길이를 붙여 보낸다(front #75 리뷰). 본문이 없는 요청은 그대로 둔다.
 * content-length 가 숫자가 아니면 넘지 않은 것으로 보고 전역 한도(proxyClientMaxBodySize)에 맡긴다.
 */
export function tooLarge(pathname: string, contentLength: string | null, transferEncoding: string | null = null): boolean {
  if (!contentLength) return !!transferEncoding?.toLowerCase().includes("chunked");
  const size = Number(contentLength);
  return Number.isFinite(size) && size > bodyLimitOf(pathname);
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
