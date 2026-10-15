import { cookies } from "next/headers";
import type { EnumValue } from "./enums";

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
    /** 검증 실패(400)의 문장 목록. 배열이 아니면 message 하나다 — 화면이 줄마다 나눠 보일 때 쓴다. */
    readonly messages: string[] = [message],
    /** 응답 본문 그대로. 409 의 code · 목록처럼 message 말고도 화면이 쓸 칸이 있다 */
    readonly body: unknown = null,
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

  if (!response.ok) throw await apiError(response);

  // 204(로그아웃)는 본문이 없다. json() 을 부르면 파싱에서 터진다.
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

/**
 * 응답을 그대로 받는다 — 파일(엑셀)처럼 본문을 흘려보내야 할 때 쓴다. 실패해도 던지지 않으므로 status 를 직접 본다.
 * 연결 실패만 던진다.
 */
export async function requestRaw(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${baseUrl()}${path}`, { ...init, cache: "no-store" });
}

/** 실패 응답을 ApiError 로. 본문은 한 번만 읽어 이은 문장 · 문장 목록 · 본문을 모두 싣는다 */
async function apiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  return new ApiError(response.status, ...messageOf(body, response.status), body);
}

/** Nest 는 { statusCode, message, error } 를 주고, 검증 실패면 message 가 배열이다. [이은 문장, 문장 목록] 을 돌려준다. */
function messageOf(body: unknown, status: number): [string, string[]] {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return [message.join(", "), message.map(String)];
  const text = typeof message === "string" ? message : `요청이 실패했습니다 (HTTP ${status})`;
  return [text, [text]];
}

/**
 * enum 의 값·한글을 api 에서 받는다. 화면에 한글 대응표를 두지 않는다(네이밍 규칙 「API 타입·enum 공유」).
 * enum 은 api 배포 때만 바뀌어 한 시간 캐시한다. 응답의 version 으로 바로 새로 받는 것은 아직 하지 않는다.
 */
export async function getEnum(name: string): Promise<EnumValue[]> {
  // request() 는 cache: "no-store" 라 캐시 옵션과 함께 쓸 수 없다(둘 다 무시된다).
  const response = await fetch(`${baseUrl()}/enums/${encodeURIComponent(name)}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw await apiError(response);
  const body = (await response.json()) as { enums: Record<string, EnumValue[]> };
  const values = body.enums[name];
  // 이름이 바뀌었거나 빠졌으면 빈 목록이 된다 — 화면은 조용히 비므로 원인을 남긴다
  if (!values) console.error(`enum 「${name}」이 GET /enums/${name} 응답에 없습니다`);
  return values ?? [];
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

/**
 * API 호출에 실을 Authorization 헤더. 세션 쿠키의 접속 토큰을 쓰고, 없으면 개발 서버(next dev)에서만
 * `API_DEV_TOKEN` 을 쓴다 — 관리자 웹 로그인(1팀)이 생기기 전까지 화면을 실제 api 에 붙여 보려는 임시 길이다.
 * 운영 빌드에서는 이 값을 읽지 않는다. TODO(로그인): 로그인이 생기면 API_DEV_TOKEN 을 지운다.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const token =
    (await getSession())?.accessToken ?? (process.env.NODE_ENV === "development" ? process.env.API_DEV_TOKEN : undefined);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
