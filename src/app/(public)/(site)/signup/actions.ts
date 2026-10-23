"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_TTL_MS,
  apiError,
  ApiError,
  baseUrl,
  getSession,
  LOGIN_KEY_COOKIE,
  loginKeyCookie,
  request,
  SESSION_COOKIE,
  sessionCookie,
  type AdminLoginResponse,
} from "@/lib/api";
import { homeOf } from "@/lib/auth-routes";
import { apiHeaders } from "@/lib/forwarded-headers";
import { apiFailure, CHECK_FAILED_MESSAGE, UNKNOWN_RESULT_MESSAGE } from "./api-failure";
import {
  BIZ_VERIFY_FAILED_MESSAGE,
  bizVerificationFailure,
  hasApiMessage,
  signupFailure,
  verificationTokenOf,
} from "./biz-verification";
import { parseSignupDone, SIGNUP_DONE_COOKIE, SIGNUP_DONE_MAX_AGE, SIGNUP_DONE_PATH } from "./signup-done-cookie";

// api 의 가입 응답 모양. 쿠키에 심는 SignupDoneValue(signup-done-cookie.ts)는 여기에 issuedAt 을 더한
// front 전용 값이라 api 응답 자체는 이 타입을 따로 쓴다 — api 가 issuedAt 을 줄 일은 없다.
type SignupApiResponse = { signupToken: string; tradeName: string; loginId: string; email: string };
function isSignupApiResponse(v: unknown): v is SignupApiResponse {
  const o = v as Partial<Record<keyof SignupApiResponse, unknown>> | null;
  return typeof o === "object" && o !== null && !Array.isArray(o)
    && typeof o.signupToken === "string" && typeof o.tradeName === "string" && typeof o.loginId === "string" && typeof o.email === "string";
}

export type SignupPayload = {
  loginId: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  tradeName: string;
  // 사업자정보는 값이 아니라 진위확인(verifyBusiness)이 준 토큰으로 보낸다. api 가 토큰에서 번호·대표자명·개업일자를 꺼내 저장한다.
  // 인증하지 않았으면 싣지 않는다 — 사업자정보 없이 가입한다.
  bizVerificationToken?: string;
  agreeTermsOfUse: boolean;
  agreePrivacy: boolean;
};

// 완료 화면에 보여 줄 값. api 가 정규화한 값(아이디·이메일 소문자)이라 입력값 대신 이것을 쓴다.
// conflict 는 409 — 확인과 제출 사이에 누가 먼저 가입했다. 폼이 두 칸을 다시 확인해 그 칸에 오류를 띄운다.
// bizRejected 는 사업자정보 인증 때문에 거절됐다(토큰 만료 400, 인증 뒤 다른 BP 가 같은 번호로 가입한 409).
// 폼이 인증을 풀고 사업자정보 칸에 문구를 보인다 — 같은 토큰으로 다시 내도 또 거절된다.
export type SignupResult =
  | { ok: true; tradeName: string; loginId: string; email: string }
  | { ok: false; message: string; conflict?: boolean; bizRejected?: boolean };

const SEND_FAILED = "회원가입 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.";
const CHECK_FAILED = CHECK_FAILED_MESSAGE;
// api 가 멈추면 fetch 는 수 분을 기다린다 — 그동안 폼이 「처리 중」에 잠긴다.
const TIMEOUT_MS = 10_000;

const isTimeout = (e: unknown) => e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");

// 회원가입 제출. api 의 /auth/signup(api PR #37, bulbasaur 브랜치)은 아이디·이메일이나, 인증한 사업자등록번호가 이미 쓰이면
// 409 를 준다. 폼이 제출 전에 중복 확인을 마치므로, 확인(인증)과 제출 사이에 누가 먼저 가입한 경우에만 409 가 온다.
// 사업자번호 409 와 토큰 만료 400 은 bizRejected 로 따로 돌려준다(signupFailure).
export async function createSignup(payload: SignupPayload): Promise<SignupResult> {
  // api 가 가입을 받은 뒤의 실패(응답 모양 · 본문 파싱 · 쿠키)는 「보내지 못했다」가 아니다 — 계정은 이미 있다.
  let accepted = false;
  try {
    // 완료 화면에 보일 값과 signupToken(10분짜리, 「웨일ERP 시작하기」용)을 이 서버 액션이 직접 httpOnly
    // 쿠키로 심는다(signup-done-cookie.ts 참고, 2026-10-16 — api 가 signup-session 을 받기 전엔 쓰지 않았다).
    // request() 대신 직접 fetch 한다 — 2xx 를 받은 순간 accepted 를 켜야 그 뒤 response.json() 이 던져도
    // (본문이 JSON 이 아니거나 비어 있을 때) 「보내지 못했다」가 아니라 「결과를 모른다」로 안내한다.
    const response = await fetch(`${baseUrl()}/auth/signup`, {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw await apiError(response);
    accepted = true;
    const body: unknown = await response.json();
    if (!isSignupApiResponse(body)) {
      // api 버전이 어긋났다. 완료 화면에 아이디를 보일 수 없으니 로그인으로 안내한다.
      console.error("[signup] createSignup unexpected response", body);
      return { ok: false, message: UNKNOWN_RESULT_MESSAGE };
    }
    const { signupToken, tradeName, loginId, email } = body;
    // issuedAt 은 완료 화면의 남은 시간 표시(countdown.tsx)에만 쓴다. signupToken 은 같은 10분짜리 토큰이라
    // 그대로 같이 담는다 — 「웨일ERP 시작하기」(startSessionFromSignup)가 이 토큰으로 로그인 접속을 낸다.
    (await cookies()).set(SIGNUP_DONE_COOKIE, JSON.stringify({ tradeName, loginId, email, issuedAt: Date.now(), signupToken }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SIGNUP_DONE_MAX_AGE,
      path: SIGNUP_DONE_PATH,
    });
    return { ok: true, tradeName, loginId, email };
  } catch (error) {
    if (error instanceof ApiError) {
      // 5xx(429 제외 — 요청 제한은 처리 전에 막는다)는 api 가 가입을 처리하다 실패한 것일 수 있다.
      // AdminSignupService.signup 은 DB 커밋 뒤에 jwt.signAsync 를 부르므로, 거기서 던지면 계정은 이미
      // 생겼는데 응답만 500(앞단 프록시의 502 · 504 도 같다)이다 — 「보내지 못했다」로 안내하면 안 된다
      // (2026-10-15 코드리뷰 2차).
      if (error.status >= 500) {
        console.error("[signup] createSignup api 5xx", error.status, error.message, error.body);
        return { ok: false, message: UNKNOWN_RESULT_MESSAGE };
      }
      const failure = signupFailure(error.status, error.message, !!payload.bizVerificationToken, SEND_FAILED);
      // 본문은 Nest 기본 { statusCode, message, error } 라 토큰 · 입력값이 들어 있지 않다.
      if (failure.log) console.error("[signup] createSignup api error", error.status, error.message, error.body);
      return { ok: false, message: failure.message, conflict: failure.conflict, bizRejected: failure.bizRejected };
    }
    // 서버 액션은 Next 서버에서 돈다 — 여기서 로그를 안 남기면 실패가 어디에도 안 남는다(2026-10-12 코드리뷰).
    console.error("[signup] createSignup failed", error);
    // 시간 초과는 api 가 받았는지 알 수 없다. 받은 뒤의 실패는 가입이 이미 됐다. 한계: api 가 처리한 뒤 연결이 끊긴
    // 전송 실패(fetch failed)는 가려낼 수 없어 「보내지 못했다」로 안내한다 — 드물어 그대로 둔다.
    return { ok: false, message: accepted || isTimeout(error) ? UNKNOWN_RESULT_MESSAGE : SEND_FAILED };
  }
}

export type AvailabilityResult = { ok: true; available: boolean } | { ok: false; message: string };

// 아이디·이메일 중복 확인. 이메일이 접근 로그에 남지 않도록 api 가 쿼리가 아니라 POST 본문으로 받는다.
async function checkAvailability(path: string, body: Record<string, string>): Promise<AvailabilityResult> {
  try {
    const { available } = await request<{ available: boolean }>(path, {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { ok: true, available };
  } catch (error) {
    if (error instanceof ApiError) {
      const failure = apiFailure(error.status, error.message, CHECK_FAILED);
      if (failure.log) console.error("[signup] checkAvailability api error", path, error.status, error.message, error.body);
      return { ok: false, message: failure.message };
    }
    console.error("[signup] checkAvailability failed", path, error);
    return { ok: false, message: CHECK_FAILED };
  }
}

export async function checkLoginIdAvailability(loginId: string): Promise<AvailabilityResult> {
  return checkAvailability("/auth/signup/login-id-availability", { loginId });
}

export async function checkEmailAvailability(email: string): Promise<AvailabilityResult> {
  return checkAvailability("/auth/signup/email-availability", { email });
}

export type BizVerificationInput = { bizRegistrationNumber: string; bizCeoName: string; bizOpenDate: string };
/** 실패의 field — 문구를 보일 자리(사업자번호 중복만 번호 칸 아래, null 은 인증하기 버튼 위 한 줄, S-VRNTHD) */
export type BizVerificationResult = { ok: true; verificationToken: string } | { ok: false; message: string; field: "bizNumber" | null };

// 사업자정보 진위확인. api 가 중복 검사 → 국세청 확인을 하고 10분짜리 토큰을 준다. 화면은 토큰을 들고 있다가 가입할 때 싣는다.
export async function verifyBusiness(input: BizVerificationInput): Promise<BizVerificationResult> {
  try {
    const response = await request<unknown>("/auth/signup/business-verifications", {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const verificationToken = verificationTokenOf(response);
    if (!verificationToken) {
      // api 버전이 어긋났다. 「인증완료」로 바꾸면 가입할 때 사업자정보가 조용히 빠진다.
      console.error("[signup] verifyBusiness unexpected response");
      return { ok: false, message: BIZ_VERIFY_FAILED_MESSAGE, field: null };
    }
    return { ok: true, verificationToken };
  } catch (error) {
    if (error instanceof ApiError) {
      const failure = bizVerificationFailure(error.status, error.message, hasApiMessage(error.body));
      // 입력값(대표자명 등)은 로그에 남기지 않는다.
      if (failure.log) console.error("[signup] verifyBusiness api error", error.status, error.message);
      return { ok: false, message: failure.message, field: failure.field };
    }
    console.error("[signup] verifyBusiness failed", error);
    return { ok: false, message: BIZ_VERIFY_FAILED_MESSAGE, field: null };
  }
}

// 가입 완료 화면의 「웨일ERP 시작하기」(done/page.tsx 의 <form action>). signupToken(쿠키, 10분)으로
// api 가 비밀번호 없이 로그인 접속을 낸다(POST /auth/admin/signup-session) — 방금 가입해 비밀번호를
// 다시 묻지 않는다. 토큰이 만료·위조됐거나(401) 그 사이 계정이 미사용으로 바뀌었으면(403) 로그인 화면으로
// 보낸다 — login/actions.ts 의 login 과 같은 모양으로 쿠키를 심는다.
//
// signupToken 은 인자로 받지 않고 이 서버 액션이 직접 httpOnly 쿠키에서 읽는다 — .bind 로 넘긴 인자는
// Next 가 암호화하지 않고(클로저로 붙잡은 변수만 암호화한다) 페이지의 RSC payload · 점진적 향상용 hidden
// input 에 평문으로 실린다. 읽자마자(성공 · 실패와 상관없이) 쿠키를 지워 같은 토큰으로 두 번 못 쓰게 한다
// — 로그인 성공·로그아웃 뒤에도 안 지워지면 10분 안에는 같은 브라우저의 다음 사람이 버튼 하나로 비밀번호
// 없이 들어갈 수 있었다(2026-10-19 코드리뷰). 지울 때도 심을 때와 같은 path(SIGNUP_DONE_PATH)를 줘야
// 한다 — 이름·도메인·경로가 모두 같아야 브라우저가 같은 쿠키로 보고 덮어쓴다. path 없이 지우면 Next 가
// 기본값 "/" 로 지우는 쿠키를 새로 내보낼 뿐이라, "/signup/done" 으로 심은 진짜 쿠키는 그대로 남는다
// (2026-10-19 코드리뷰 재검토).
export async function startSessionFromSignup(): Promise<void> {
  const jar = await cookies();
  const value = parseSignupDone(jar.get(SIGNUP_DONE_COOKIE)?.value);
  jar.delete({ name: SIGNUP_DONE_COOKIE, path: SIGNUP_DONE_PATH });

  // 이미 다른 계정으로 로그인돼 있으면 그 세션을 api 에서도 끝낸다(logout() 과 같은 이유) — 쿠키만
  // 지우면 그 계정의 갱신 토큰이 마지막 사용부터 최대 1시간 api 에 그대로 남는다(2026-10-19 코드리뷰).
  const existing = await getSession();
  if (existing)
    await request("/auth/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${existing.accessToken}` },
    }).catch((e: unknown) => console.warn("[signup] 기존 세션 로그아웃 api 실패 — 갱신 토큰 만료(최대 1시간)까지 남는다", e));

  let res: AdminLoginResponse | null = null;
  if (value) {
    try {
      res = await request<AdminLoginResponse>("/auth/admin/signup-session", {
        method: "POST",
        headers: await apiHeaders(),
        body: JSON.stringify({ signupToken: value.signupToken, deviceInformation: (await headers()).get("user-agent")?.slice(0, 200) }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      // 401·403 은 흔한 결과다(10분이 지난 뒤 누르면 늘 이런다) — 그 밖(연결 실패 · 5xx)만 남긴다.
      if (!(e instanceof ApiError) || e.status >= 500) console.error("[signup] startSessionFromSignup failed", e);
    }
  }

  if (res?.accessToken && res.account?.roleTypeCode) {
    jar.set(
      sessionCookie({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
        roleTypeCode: res.account.roleTypeCode,
        bpCodeId: res.account.bp?.bpCodeId,
      }),
    );
    jar.set(loginKeyCookie(crypto.randomUUID()));
    redirect(homeOf(res.account.roleTypeCode));
  }
  // 쿠키가 없거나(만료 · 재사용) 토큰이 거절됐다 — 로그인 화면으로. 다른 계정으로 이미 로그인돼 있으면
  // 그 세션도 지운다 — 그대로 두면 proxy.ts 가 이 /login 요청을 조용히 그 계정 홈으로 돌려보내, 가입한
  // 새 계정으로 들어간 줄 착각한 채 엉뚱한 계정으로 작업하게 된다(2026-10-19 코드리뷰).
  jar.delete(SESSION_COOKIE);
  jar.delete(LOGIN_KEY_COOKIE);
  // redirect 는 try 밖(여기)에서만 부른다(createSignup 과 같은 이유 — try 안에서 부르면 그 catch 가 이동
  // 신호를 오류로 삼킨다).
  redirect("/login");
}
