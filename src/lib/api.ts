import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  type: "staff" | "customer";
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  unit: string;
  /** stock_movements 합계로 유도한 현재 재고. */
  stock: number;
  /** API 는 Date 를 주지만 JSON 을 거치면 ISO 문자열이 된다. */
  createdAt: string;
  updatedAt: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/** 쿠키에 담는 값. API 호출에 필요한 것은 액세스 토큰뿐이다. */
interface Session {
  accessToken: string;
  user: AuthUser;
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
  // 빈 값은 없는 것과 같다. 여기서 멈추지 않으면 fetch("undefined/items") 같은
  // 엉뚱한 에러로 번져 원인을 찾기 어려워진다.
  if (!url) throw new Error("API_BASE_URL 환경 변수가 필요합니다");
  return url;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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

/**
 * POST /auth/customer/login. 성공하면 세션 쿠키를 굽는다. 직원용은
 * /auth/staff/login 이고 이쪽은 고객 계정만 받는다.
 *
 * ponytail: 리프레시 토큰은 버린다. 액세스 토큰(15분)이 만료되면 다시 로그인하는
 * 샘플이다. 자동 갱신이 필요하면 refreshToken 도 쿠키에 넣고 401 일 때
 * POST /auth/refresh 로 회전시킨다 — 쿠키를 다시 구워야 하므로 서버 컴포넌트가
 * 아니라 미들웨어나 라우트 핸들러에서 해야 한다.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const token = await request<TokenResponse>("/auth/customer/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({
      accessToken: token.accessToken,
      user: token.user,
    } satisfies Session),
    {
      httpOnly: true, // 브라우저 JS 가 토큰을 읽지 못하게 한다
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15, // 액세스 토큰 수명과 맞춘다
    },
  );

  return token.user;
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

/** 쿠키를 지우고 서버에 저장된 리프레시 토큰도 폐기한다. */
export async function logout(): Promise<void> {
  const session = await getSession();
  (await cookies()).delete(SESSION_COOKIE);
  if (!session) return;

  // 서버 쪽 폐기가 실패해도 이 브라우저는 이미 로그아웃 상태다.
  await request("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  }).catch(() => undefined);
}

/** GET /items. take 는 API 가 최대 200 까지만 받는다. */
export async function listItems(take = 50): Promise<Item[]> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "로그인이 필요합니다");

  return request<Item[]>(`/items?take=${take}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
}
