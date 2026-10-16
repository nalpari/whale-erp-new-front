"use server";

import { cookies, headers } from "next/headers";
import { apiError, ApiError, baseUrl, request } from "@/lib/api";
import { apiFailure, CHECK_FAILED_MESSAGE, UNKNOWN_RESULT_MESSAGE } from "./_components/api-failure";
import {
  BIZ_VERIFY_FAILED_MESSAGE,
  bizVerificationFailure,
  hasApiMessage,
  signupFailure,
  verificationTokenOf,
} from "./_components/biz-verification";
import { SIGNUP_DONE_COOKIE, SIGNUP_DONE_MAX_AGE, SIGNUP_DONE_PATH } from "./signup-done-cookie";

// api 의 가입 응답 모양. 쿠키에 심는 SignupDoneValue(signup-done-cookie.ts)는 여기에 issuedAt 을 더한
// front 전용 값이라 api 응답 자체는 이 타입을 따로 쓴다 — api 가 issuedAt 을 줄 일은 없다.
type SignupApiResponse = { tradeName: string; loginId: string; email: string };
function isSignupApiResponse(v: unknown): v is SignupApiResponse {
  const o = v as Partial<Record<keyof SignupApiResponse, unknown>> | null;
  return typeof o === "object" && o !== null && !Array.isArray(o)
    && typeof o.tradeName === "string" && typeof o.loginId === "string" && typeof o.email === "string";
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

/**
 * api 로 보낼 머리말. 사용자 IP 를 X-Forwarded-For 로 넘긴다 — 넘기지 않으면 api 가 이 Next 서버의 주소로 세어,
 * 모든 가입자가 요청 제한의 IP 칸 하나를 나눠 쓰고(한도에 닿으면 모두 429) 약관 동의 기록에도 이 서버 주소가 남는다.
 * Next 는 이 머리말이 없으면 소켓 주소로 채우지만, 있으면 그대로 둔다. 그래서 Next 앞에 이 머리말을 덧붙이거나
 * 덮어쓰는 프록시(로드밸런서)가 반드시 있어야 한다 — Next 가 인터넷에 바로 노출되면 브라우저가 지어 보낸 값이 api 까지
 * 가, IP 한도를 피하고 약관 동의 기록의 IP 를 지어낼 수 있다. api 는 TRUST_PROXY 에 적은 프록시(이 서버)를 믿을 때만 이 값을 쓴다.
 */
async function apiHeaders(): Promise<Record<string, string>> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return { "Content-Type": "application/json", ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}) };
}

const isTimeout = (e: unknown) => e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");

// 회원가입 제출. api 의 /auth/signup(api PR #37, bulbasaur 브랜치)은 아이디·이메일이나, 인증한 사업자등록번호가 이미 쓰이면
// 409 를 준다. 폼이 제출 전에 중복 확인을 마치므로, 확인(인증)과 제출 사이에 누가 먼저 가입한 경우에만 409 가 온다.
// 사업자번호 409 와 토큰 만료 400 은 bizRejected 로 따로 돌려준다(signupFailure).
export async function createSignup(payload: SignupPayload): Promise<SignupResult> {
  // api 가 가입을 받은 뒤의 실패(응답 모양 · 본문 파싱 · 쿠키)는 「보내지 못했다」가 아니다 — 계정은 이미 있다.
  let accepted = false;
  try {
    // 응답의 signupToken(완료 화면용, 10분)은 쓰지 않는다 — 그 토큰을 확인하는 api 가 아직 없다.
    // 대신 완료 화면에 보일 값을 이 서버 액션이 직접 httpOnly 쿠키로 심는다(signup-done-cookie.ts 참고).
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
    const { tradeName, loginId, email } = body;
    // issuedAt 은 완료 화면의 남은 시간 표시(countdown.tsx)에만 쓴다.
    (await cookies()).set(SIGNUP_DONE_COOKIE, JSON.stringify({ tradeName, loginId, email, issuedAt: Date.now() }), {
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
export type BizVerificationResult = { ok: true; verificationToken: string } | { ok: false; message: string };

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
      return { ok: false, message: BIZ_VERIFY_FAILED_MESSAGE };
    }
    return { ok: true, verificationToken };
  } catch (error) {
    if (error instanceof ApiError) {
      const failure = bizVerificationFailure(error.status, error.message, hasApiMessage(error.body));
      // 입력값(대표자명 등)은 로그에 남기지 않는다.
      if (failure.log) console.error("[signup] verifyBusiness api error", error.status, error.message);
      return { ok: false, message: failure.message };
    }
    console.error("[signup] verifyBusiness failed", error);
    return { ok: false, message: BIZ_VERIFY_FAILED_MESSAGE };
  }
}
