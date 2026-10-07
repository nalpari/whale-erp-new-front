import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

/**
 * 쿠키에 담는 값. API 호출에 필요한 것은 액세스 토큰뿐이다.
 * 사용자 정보는 1팀 관리자 로그인이 정한다 — 견본 로그인(customers)은 2026-10-07 지웠다.
 */
export interface Session {
  accessToken: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * whale-erp-api 주소. 모듈 로드 시점이 아니라 호출 시점에 읽는다. 빌드할 때는
 * 아직 값이 없을 수 있고(.env.production 은 비어 있다), 서버 컴포넌트는 요청마다
 * 실행되므로 배포 환경이 주입한 값이 그때 보인다.
 */
function baseUrl(): string {
  const url = process.env.API_BASE_URL;
  // 빈 값은 없는 것과 같다. 여기서 멈추지 않으면 fetch("undefined/…") 같은
  // 엉뚱한 에러로 번져 원인을 찾기 어려워진다.
  if (!url) throw new Error("API_BASE_URL 환경 변수가 필요합니다");
  return url;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    // 사용자마다 다른 응답이라 캐시하지 않는다.
    cache: "no-store",
  });

  if (!response.ok)
    throw new ApiError(response.status, await errorMessage(response));

  // 204(로그아웃)는 본문이 없다. json() 을 부르면 파싱에서 터진다.
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

/** Nest 는 { statusCode, message, error } 를 주고, 검증 실패면 message 가 배열이다. */
async function errorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return `요청이 실패했습니다 (HTTP ${response.status})`;
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null; // 손상된 쿠키는 로그아웃으로 취급한다
  }
}
