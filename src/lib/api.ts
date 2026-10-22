import { cookies, headers } from "next/headers";
import { ApiError } from "./api-error";
import { BP_HEADER, bpPath } from "./bp-path";
import type { EnumValue } from "./enums";
import { parseSession, SESSION_COOKIE, type Session } from "./session";

// 세션 모양·쿠키 헬퍼는 next/headers 없이 proxy 도 쓰도록 session.ts 에 있다.
export * from "./session";

// api 오류와 거절 판정은 node --test 가 읽도록 api-error.ts 에 있다.
export { ApiError, deniedMessageOf } from "./api-error";

/**
 * whale-erp-api 주소. 모듈 로드 시점이 아니라 호출 시점에 읽는다. 빌드할 때는
 * 아직 값이 없을 수 있고(.env.production 은 비어 있다), 서버 컴포넌트는 요청마다
 * 실행되므로 배포 환경이 주입한 값이 그때 보인다.
 */
export function baseUrl(): string {
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
export async function apiError(response: Response): Promise<ApiError> {
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
  return parseSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * API 호출에 실을 헤더 — Authorization(로그인 세션 쿠키의 접속 토큰, 세션이 없으면 빼고 api 가 401 로 알린다)과
 * 탭 BP(X-Bp-Code-Id, bpHeader — 세션과 상관없이 proxy 가 넣은 값이 있으면 싣는다).
 * 로그인 전에 쓰던 개발 토큰(API_DEV_TOKEN)은 관리자 로그인이 생겨 2026-10-15 에 지웠다 — api 가 토큰의 접속(sid)까지 확인해
 * 서명만 맞춘 토큰은 더 통하지 않는다.
 * 사용자 IP(X-Forwarded-For)도 싣는다 — 싣지 않으면 api 의 IP 한도(점포 진위확인 시간당 10건, 내 정보 수정 · 이메일 중복 확인
 * 분당 60건 등)를 모든 관리자가 이 Next 서버 IP 한 칸으로 나눠 쓴다. 믿는 조건은 로그인 전 화면과 같다(forwarded-headers.ts).
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = (await getSession())?.accessToken;
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(await bpHeader()), ...(await forwardedForHeader()) };
}

/** 이 요청의 사용자 IP — Next 가 채운(또는 앞단 프록시가 붙인) x-forwarded-for 를 그대로 api 에 넘긴다. */
async function forwardedForHeader(): Promise<Record<string, string>> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return forwardedFor ? { "X-Forwarded-For": forwardedFor } : {};
}

/**
 * 이 요청의 탭 BP — proxy 가 남긴 x-bp-code-id(화면 주소 /bp/{id} 의 값, BFF 면 브라우저 bff() 가 실은 숫자)를 X-Bp-Code-Id 로 api 에 싣는다.
 * 주소에 BP 가 없는 화면은 비운다 — BP · 가맹 계정은 api 가 소속 BP 로 보고, 플랫폼 계정은 BP 가 필요한 경로(BP 권한 그룹 · 점포 탭 BP
 * 전환 뒤의 점포)에서 400 이다. 판정은 api 가 한다.
 */
export async function bpHeader(): Promise<Record<string, string>> {
  const bp = (await headers()).get(BP_HEADER);
  return bp && /^\d{1,9}$/.test(bp) ? { "X-Bp-Code-Id": bp } : {};
}

/**
 * 서버 컴포넌트가 그리는 화면 주소를 만드는 함수. 이 요청이 탭 BP 주소(/bp/{id}/...)로 왔으면 옛 경로(폴더) path 에 같은 BP 를 붙인다.
 * 주소에 BP 가 없으면 그대로 두고, 옮긴 화면이면 SessionGate 가 탭 BP 주소로 보낸다. 링크를 여럿 그리는 화면(점포 목록)이 한 번 받아 쓴다.
 */
export async function screenPath(): Promise<(path: string) => string> {
  const bp = (await bpHeader())["X-Bp-Code-Id"];
  return (path) => (bp ? bpPath(Number(bp), path) : path);
}

/** 서버 화면이 그리는 링크(다시 시도 · 목록) 하나. 탭 BP 주소로 들어온 요청이면 같은 BP 를 붙인다 — 옛 경로로 가 SessionGate 가 한 번 더 보내지 않게. */
export async function bpHref(path: string): Promise<string> {
  return (await screenPath())(path);
}
