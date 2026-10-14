"use server";

import { cookies } from "next/headers";
import { ApiError, request } from "@/lib/api";
import { SIGNUP_DONE_COOKIE, SIGNUP_DONE_MAX_AGE, type SignupDoneValue } from "./signup-done-cookie";

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
export type SignupResult = { ok: true; tradeName: string; loginId: string; email: string } | { ok: false; message: string };

// 회원가입 제출. api bulbasaur 브랜치의 /auth/signup 은 아이디·이메일이 이미 쓰이면 409 를 준다 — api·front
// 모두 아직 main 에 안 들어갔다(2026-10-12). 폼이 제출 전에 중복 확인을 마치므로, 확인과 제출 사이에
// 누가 먼저 가입한 경우에만 여기까지 온다.
export async function createSignup(payload: SignupPayload): Promise<SignupResult> {
  try {
    // signupToken(완료 화면용, 10분)은 쓰지 않는다 — api 쪽 검증 API 가 아직 없어 진위를 확인할 수 없다.
    // 대신 완료 화면에 보일 값을 이 서버 액션이 직접 httpOnly 쿠키로 심는다(signup-done-cookie.ts 참고) —
    // 우리 서버가 실제 가입 응답을 받은 뒤에만 심기는 값이라 URL 쿼리로 보내는 것보다 위조하기 어렵다.
    const { tradeName, loginId, email } = await request<{ signupToken: string; tradeName: string; loginId: string; email: string }>("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const value: SignupDoneValue = { tradeName, loginId, email };
    (await cookies()).set(SIGNUP_DONE_COOKIE, JSON.stringify(value), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SIGNUP_DONE_MAX_AGE,
      path: "/auth/signup-done",
    });
    return { ok: true, tradeName, loginId, email };
  } catch (error) {
    if (error instanceof ApiError) {
      // 400·409 처럼 예상한 거절은 문구만 돌려주면 된다. 500 등 뜻밖의 오류까지 그냥 넘기면 서버 쪽 어디에도
      // 흔적이 안 남아 나중에 추적할 수 없다 — 4XX 밖은 로그를 남긴다(2026-10-14 코드리뷰).
      if (error.status >= 500) console.error("[signup] createSignup api error", error.status, error.message, error.body);
      return { ok: false, message: error.message };
    }
    // 서버 액션은 Next 서버에서 돈다 — 여기서 로그를 안 남기면 실패가 어디에도 안 남는다(2026-10-12 코드리뷰).
    console.error("[signup] createSignup failed", error);
    return { ok: false, message: "회원가입 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export type AvailabilityResult = { ok: true; available: boolean } | { ok: false; message: string };

// 아이디·이메일 중복 확인. 이메일이 접근 로그에 남지 않도록 api 가 쿼리가 아니라 POST 본문으로 받는다.
async function checkAvailability(path: string, body: Record<string, string>): Promise<AvailabilityResult> {
  try {
    const { available } = await request<{ available: boolean }>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: true, available };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status >= 500) console.error("[signup] checkAvailability api error", path, error.status, error.message, error.body);
      return { ok: false, message: error.message };
    }
    console.error("[signup] checkAvailability failed", path, error);
    return { ok: false, message: "중복 확인을 하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export async function checkLoginIdAvailability(loginId: string): Promise<AvailabilityResult> {
  return checkAvailability("/auth/signup/login-id-availability", { loginId });
}

export async function checkEmailAvailability(email: string): Promise<AvailabilityResult> {
  return checkAvailability("/auth/signup/email-availability", { email });
}
