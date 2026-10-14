// next/* 를 import 하지 않는다 — proxy 도 이 파일을 쓴다. api.ts 가 다시 export 한다.

export const SESSION_COOKIE = "session";

/** 로그인마다 새로 만드는 값. 브라우저 저장소(browser-storage.ts)가 이 로그인 것인지 가른다. 화면이 읽어야 해서 httpOnly 가 아니다. */
export const LOGIN_KEY_COOKIE = "login-key";

/** api 접근 토큰 수명. 응답에 만료 시각이 없어 발급 시각 + 이 값으로 잡는다. */
export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * 쿠키에 담는 값. 토큰은 Next 서버만 읽는다(httpOnly). 계정 이름·BP 는 login-info 로 그리므로 여기 두지 않는다.
 * 권한 유형은 /login 에서 자기 홈을 고르고 platform 레이아웃이 BP 계정을 돌려보내는 데만 쓴다 — 데이터 권한은 api 가 토큰으로 다시 확인한다.
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  /** 접근 토큰이 끝나는 시각(ms). proxy 가 이보다 50분 앞서(받은 지 10분 뒤부터) 갱신한다. */
  accessTokenExpiresAt: number;
  roleTypeCode: string;
}

// shortcut: api 응답 타입을 손으로 적었다(openapi-typescript 미도입, 1팀 동의 대기). api openapi.json 이 바뀌면 같이 고친다.
/** account.bp — 소속 BP. 로그인 뒤 브라우저에 두는 BP 데이터는 bpCodeId 로 구분한다. */
export interface AccountBp {
  bpCodeId: number;
  bpCode: string;
  tradeName: string;
  isPlatform: boolean;
}

/** POST /auth/admin/login 200 */
export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  account: {
    adminAccountId: number;
    loginId: string;
    name: string | null;
    roleTypeCode: string;
    bp: AccountBp;
    isPasswordChangeRequired: boolean;
  };
}

/** POST /auth/admin/refresh 200 */
export interface AdminRefreshResponse {
  accessToken: string;
  refreshTokenExpiresAt: string;
}

/** GET /auth/admin/login-info 200 — 부른 시점의 현재 값. 로그인마다 한 번만 부른다. */
export interface LoginInfo {
  account: LoginInfoAccount;
  /** 조회 권한이 있는 메뉴 트리(최대 3단계). 표시 순서대로. */
  menus: AdminMenu[];
  /** 관리 점포. 플랫폼 계정은 빈 목록. */
  stores: AdminStore[];
  codes: Codes;
}

export interface LoginInfoAccount {
  adminAccountId: number;
  loginId: string;
  name: string | null;
  email: string | null;
  roleTypeCode: string;
  bp: AccountBp;
  isPasswordChangeRequired: boolean;
  temporaryPasswordExpiresAt: string | null;
  isTermsAgreementRequired: boolean;
}

export interface AdminMenu {
  /** MN+6자리. 업무 API 의 메뉴 권한 판정도 이 코드로 한다. */
  menuCode: string;
  /** 이 메뉴가 속한 서비스 — 공통코드 SERVICE(WHALE_ERP · PLATFORM). 헤더가 영역에 맞는 메뉴만 그릴 때 쓴다. */
  serviceCode: string;
  name: string;
  url: string | null;
  depth: number;
  /** 하위 메뉴로 가는 길로만 들어간 상위 메뉴는 모두 false. */
  permission: { read: boolean; create: boolean; update: boolean; delete: boolean };
  children: AdminMenu[];
}

/** login-info 의 stores · GET /bp-codes/{bpCodeId}/stores 의 items */
export interface AdminStore {
  storeId: number;
  storeCode: string;
  name: string;
  storeTypeCode: string;
  storeStatusCode: string;
}

/** GET /public-bp-codes/{bpCode}/code-items · GET /bp-codes/{bpCodeId}/code-items 의 codes 값 */
export interface CodeValue {
  value: string;
  label: string;
  order: number;
}

/** 그룹 코드 → 상세 코드 목록. 없거나 사용하지 않는 그룹은 [] */
export type Codes = Record<string, CodeValue[]>;

/** 쿠키 값 → Session. 손상됐거나 모양이 다르면 로그아웃으로 본다. */
export function parseSession(raw: string | undefined): Session | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Partial<Session>;
    // 만료 시각이 숫자가 아니면 proxy 의 갱신 비교가 NaN 이 되어 끝난 토큰을 그대로 통과시킨다.
    return typeof s.accessToken === "string" &&
      typeof s.refreshToken === "string" &&
      typeof s.roleTypeCode === "string" &&
      typeof s.accessTokenExpiresAt === "number"
      ? (s as Session)
      : null;
  } catch {
    return null;
  }
}

export function sessionCookie(session: Session) {
  return {
    name: SESSION_COOKIE,
    value: JSON.stringify(session),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // maxAge 를 두지 않는다 — 브라우저를 닫으면 로그아웃된다. 1시간 만료는 api 가 지키고, 끊기면 proxy 가 갱신 401 로 /login 에 보낸다.
  };
}

export function loginKeyCookie(value: string) {
  return { name: LOGIN_KEY_COOKIE, value, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
}
