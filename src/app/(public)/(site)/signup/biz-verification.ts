// 사업자정보 진위확인(국세청)의 결과를 화면 문구로 바꾼다. 서버 액션(actions.ts)과 화면(biz-auth-section · signup-form)이 같이 쓴다.
// api 가 중복 검사 → 국세청 확인을 하고 10분짜리 인증 토큰을 준다. front 는 그 토큰을 들고 있다가 가입할 때 싣는다.
import { apiFailure, BUSY_MESSAGE, type ApiFailure } from "./api-failure.ts";

/**
 * api 가 주는 인증 토큰의 유효 시간. 지나면 가입 요청을 보내지 않고 다시 인증하게 한다.
 * 화면은 요청을 보내기 직전부터 잰다 — api 는 그 뒤에 서명하니 화면이 먼저 만료로 본다. 시계 차이로 그래도 api 가
 * 거절하면 isBizSignupRejection 이 받는다.
 */
export const BIZ_VERIFICATION_TTL_MS = 10 * 60_000;

/** api 에 닿지 못했거나 api 문구를 보일 수 없는 실패. */
export const BIZ_VERIFY_FAILED_MESSAGE = "사업자정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/** 인증한 뒤 10분이 지나 가입하려 할 때. */
export const BIZ_VERIFICATION_EXPIRED_MESSAGE = "인증 시간(10분)이 지났습니다. 다시 인증해 주세요.";

/** 사업자정보 칸에 값이 있는데 인증하지 않은 채 가입하려 할 때. */
export const BIZ_UNVERIFIED_MESSAGE = "사업자정보를 인증하거나 지우기로 비운 뒤 가입해 주세요.";

/**
 * 가입 전에 사업자정보 묶음이 막아야 하는 이유. 토큰 없이 보내면 칸에 보이던 사업자정보가 빠진 채 가입되고 되돌릴 수 없어서,
 * 값이 있으면 인증했을 때만 보낸다(재인증 · 10분 경과 · 가입 거절로 인증이 풀린 뒤 다시 누른 경우 포함). 비어 있으면 선택이라 통과.
 */
export function bizSubmitBlock(
  biz: { bizRegistrationNumber: string; bizCeoName: string; bizOpenDate: string; verification: { verifiedAt: number } | null },
  now: number,
): string | undefined {
  if (biz.verification) return isBizVerificationExpired(biz.verification.verifiedAt, now) ? BIZ_VERIFICATION_EXPIRED_MESSAGE : undefined;
  return biz.bizRegistrationNumber || biz.bizCeoName || biz.bizOpenDate ? BIZ_UNVERIFIED_MESSAGE : undefined;
}

// 가입(POST /auth/signup)이 사업자정보 때문에 거절할 때의 api 문구. 오류 본문이 Nest 기본 형식이라 이 문구로만 다른
// 400 · 409(아이디·이메일 중복)와 가를 수 있어서, api admin-signup/business-verification.service.ts 의 상수와 글자까지
// 맞춘다 — api 테스트도 두 문구를 글자 그대로 고정한다(2026-10-15).
// 토큰 400 은 만료 · 위조 말고도, api 가 토큰을 한 번만 쓰게 바뀌면 가입 실패 뒤 다시 낸 가입에서도 온다.
const BIZ_TOKEN_REJECTED_API_MESSAGE = "사업자정보 인증이 만료되었습니다. 다시 인증해 주세요.";
const BIZ_NUMBER_TAKEN_API_MESSAGE = "이미 등록된 사업자등록번호입니다.";

/** 가입 거절이 사업자정보 인증 때문인가. 그렇다면 화면은 인증을 풀고 사업자정보 칸에 문구를 보인다. */
export function isBizSignupRejection(status: number, message: string): boolean {
  return (status === 400 && message === BIZ_TOKEN_REJECTED_API_MESSAGE) || (status === 409 && message === BIZ_NUMBER_TAKEN_API_MESSAGE);
}

export type SignupFailure = ApiFailure & { bizRejected: boolean };

/**
 * 가입 실패를 화면 문구로. 토큰을 실었고 사업자정보 때문에 거절됐으면 bizRejected — 폼이 인증을 풀고 다시 인증하게 한다.
 * 아이디 · 이메일 중복 409(conflict)보다 먼저 본다. 거꾸로면 사업자번호 409 에 두 칸을 다시 확인해 둘 다 「사용가능」이 되고,
 * 같은 토큰으로 409 만 되풀이한다.
 */
export function signupFailure(status: number, message: string, hasBizToken: boolean, fallback: string): SignupFailure {
  // 정상 흐름에선 화면이 10분을 먼저 거른다 — 여기 오면 시계 차이 · 토큰 재사용 · api 서명 키 교체라 로그로 남긴다.
  if (hasBizToken && isBizSignupRejection(status, message)) return { message, log: true, conflict: false, bizRejected: true };
  const failure = apiFailure(status, message, fallback);
  // 토큰을 실었는데 알아보지 못한 400 · 409 — api 문구가 바뀌었을 수 있다. 화면은 기존 경로로 두고 알 수 있게 로그만 남긴다.
  const unrecognized = hasBizToken && (status === 400 || status === 409);
  return { ...failure, log: failure.log || unrecognized, bizRejected: false };
}

/** 진위확인 응답에서 토큰을 꺼낸다. 없거나 비었으면 null — 「인증완료」로 바꾸면 가입할 때 사업자정보가 조용히 빠진다. */
export function verificationTokenOf(response: unknown): string | null {
  const token = (response as { verificationToken?: unknown } | null)?.verificationToken;
  return typeof token === "string" && token ? token : null;
}

/** 실패 본문에 api 가 쓴 문구가 있는가. 없으면 api.ts 가 「요청이 실패했습니다 (HTTP 503)」 같은 문구를 지어 넣는다. */
export function hasApiMessage(body: unknown): boolean {
  const message = (body as { message?: unknown } | null)?.message;
  return (typeof message === "string" && message.trim() !== "") || (Array.isArray(message) && message.length > 0);
}

// 400 형식 · 409 중복 · 422 불일치는 예상한 거절이라 api 문구를 그대로 보이고 로그를 남기지 않는다.
// 503 은 국세청 장애라 api 문구(한글로 정해 둔 안내)를 보이되, 자주 나면 알아야 하므로 로그를 남긴다.
// 그 밖(429 한도, 아직 배포 안 된 404, 5XX …)은 원문이 영문일 수 있어 숨기고 정해진 문구를 보인다.
// api 문구가 없는 실패(앞단 프록시가 JSON 없이 준 503 등)는 상태와 상관없이 정해진 문구를 보이고 로그를 남긴다.
export function bizVerificationFailure(status: number, message: string, apiMessage = true): { message: string; log: boolean } {
  if (!apiMessage) return { message: BIZ_VERIFY_FAILED_MESSAGE, log: true };
  if (status === 400 || status === 409 || status === 422) return { message, log: false };
  if (status === 503) return { message, log: true };
  if (status === 429) return { message: BUSY_MESSAGE, log: true };
  return { message: BIZ_VERIFY_FAILED_MESSAGE, log: true };
}

export function isBizVerificationExpired(verifiedAt: number, now: number): boolean {
  return now - verifiedAt >= BIZ_VERIFICATION_TTL_MS;
}
