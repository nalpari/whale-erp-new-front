"use server";

import { cookies, headers } from "next/headers";
import { ApiError, request } from "@/lib/api";
import { apiFailure, CHECK_FAILED_MESSAGE, UNKNOWN_RESULT_MESSAGE } from "./_components/api-failure";
import { isSignupDoneValue, SIGNUP_DONE_COOKIE, SIGNUP_DONE_MAX_AGE, SIGNUP_DONE_PATH } from "./signup-done-cookie";

export type SignupPayload = {
  loginId: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  tradeName: string;
  // api SignupDto 는 사업자정보를 아직 받지 않는다(정해진 칸 밖의 값을 보내면 400). 사업자정보 인증은 화면에서만 하고 보내지 않는다.
  agreeTermsOfUse: boolean;
  agreePrivacy: boolean;
};

// 완료 화면에 보여 줄 값. api 가 정규화한 값(아이디·이메일 소문자)이라 입력값 대신 이것을 쓴다.
// conflict 는 409 — 확인과 제출 사이에 누가 먼저 가입했다. 폼이 두 칸을 다시 확인해 그 칸에 오류를 띄운다.
export type SignupResult =
  | { ok: true; tradeName: string; loginId: string; email: string }
  | { ok: false; message: string; conflict?: boolean };

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

// 회원가입 제출. api 의 /auth/signup(api PR #37, bulbasaur 브랜치)은 아이디·이메일이 이미 쓰이면 409 를 준다.
// 폼이 제출 전에 중복 확인을 마치므로, 확인과 제출 사이에 누가 먼저 가입한 경우에만 409 가 온다.
export async function createSignup(payload: SignupPayload): Promise<SignupResult> {
  // api 가 가입을 받은 뒤의 실패(응답 모양 · 쿠키)는 「보내지 못했다」가 아니다 — 계정은 이미 있다.
  let accepted = false;
  try {
    // signupToken(완료 화면용, 10분)은 쓰지 않는다 — api 쪽 검증 API 가 아직 없어 진위를 확인할 수 없다.
    // 대신 완료 화면에 보일 값을 이 서버 액션이 직접 httpOnly 쿠키로 심는다(signup-done-cookie.ts 참고).
    const response = await request<unknown>("/auth/signup", {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    accepted = true;
    if (!isSignupDoneValue(response)) {
      // api 버전이 어긋났다. 완료 화면에 아이디를 보일 수 없으니 로그인으로 안내한다.
      console.error("[signup] createSignup unexpected response", response);
      return { ok: false, message: UNKNOWN_RESULT_MESSAGE };
    }
    const { tradeName, loginId, email } = response;
    (await cookies()).set(SIGNUP_DONE_COOKIE, JSON.stringify({ tradeName, loginId, email }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SIGNUP_DONE_MAX_AGE,
      path: SIGNUP_DONE_PATH,
    });
    return { ok: true, tradeName, loginId, email };
  } catch (error) {
    if (error instanceof ApiError) {
      const failure = apiFailure(error.status, error.message, SEND_FAILED);
      if (failure.log) console.error("[signup] createSignup api error", error.status, error.message, error.body);
      return { ok: false, message: failure.message, conflict: failure.conflict };
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
