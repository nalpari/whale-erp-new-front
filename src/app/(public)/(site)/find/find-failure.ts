// 찾기 화면의 실패 판정. next/* 를 불러오지 않아 node --test 로 검사한다(find-failure.test.ts) —
// lib/api.ts 는 next/headers 를 불러와 ApiError 를 instanceof 로 쓸 수 없어, 상태 코드 · 문구 · 이름만 본다.

export const CONNECT_FAILED = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요";
export const THROTTLED = "요청이 많습니다. 잠시 뒤 다시 시도해 주세요";
export const INVALID_INPUT = "입력한 이메일 형식을 확인해 주세요";
// 5xx 는 세 경우가 섞인다(api admin-temporary-password.service — 메일을 보낸 뒤 발급을 한 트랜잭션으로 저장한다).
// 메일 전 실패(메일 없음) · 메일 뒤 저장 실패(온 메일은 못 쓰고 앞의 임시 비밀번호가 살아 있다) · 발급을 마친 뒤 게이트웨이
// 502 · 504(온 메일이 유효). 셋 모두에 맞도록 「받은 것으로 안 되면 다시」로 안내한다 — 바로 다시 받게 하면 셋째의 유효한 것을 만료시킨다.
export const TEMPORARY_PASSWORD_UNKNOWN =
  "처리 결과를 확인하지 못했습니다. 메일이 오지 않았거나 받은 임시 비밀번호로 로그인되지 않으면 잠시 뒤 다시 요청해 주세요";

type Failure = { status?: unknown; message?: unknown; name?: unknown } | null | undefined;

const statusOf = (e: unknown) => {
  const status = (e as Failure)?.status;
  return typeof status === "number" ? status : undefined;
};
const messageOf = (e: unknown) => {
  const message = (e as Failure)?.message;
  return typeof message === "string" ? message : "";
};

/**
 * 두 탭이 함께 쓰는 실패 문구. api 문구를 그대로 보이는 것은 예상한 거절뿐이다 — 아이디 찾기의 일치 없음(404)과
 * 임시 비밀번호의 1시간 5회 초과(429, 한글). log 가 true 면 화면이 모르는 실패라 서버 로그에 남긴다.
 */
export function failureOf(e: unknown): { message: string; log: boolean } {
  const status = statusOf(e);
  const message = messageOf(e);
  // 스로틀러 429 는 영어 기본값이라 여기서만 바꾼다(login/actions.ts 와 같다).
  if (status === 429) return { message: message.startsWith("ThrottlerException") ? THROTTLED : message, log: false };
  // 라우트가 없는 404(「Cannot POST …」)는 api 가 아직 배포되지 않은 것이다 — 일치 없음으로 보이면 안 된다.
  if (status === 404) return message.startsWith("Cannot ") ? { message: CONNECT_FAILED, log: true } : { message, log: false };
  // 칸 길이 · 필수는 폼이 막으므로 남는 400 은 이메일 형식이다. 브라우저 type="email" 은 a@b 를 통과시키지만 api @IsEmail 은
  // 거절하고, 그 문구는 영어 기본값이다.
  if (status === 400) return { message: INVALID_INPUT, log: false };
  return { message: CONNECT_FAILED, log: true };
}

/**
 * 임시 비밀번호 요청이 던진 것을 화면 결과로. 시간 초과는 front 만 끊은 것이라 api 는 대개 발급까지 마친다 —
 * 보냈다는 안내로 끝낸다(okf/auth.md 계정 찾기, 2026-10-19 재영). 5xx 는 결과를 모른다고 안내한다.
 */
export function temporaryPasswordOutcome(e: unknown): { sent: true } | { message: string; log: boolean } {
  const name = (e as Failure)?.name;
  if (name === "TimeoutError" || name === "AbortError") return { sent: true };
  const status = statusOf(e);
  if (status !== undefined && status >= 500) return { message: TEMPORARY_PASSWORD_UNKNOWN, log: true };
  return failureOf(e);
}

/** 아이디 찾기 응답의 가린 아이디. 모양이 다르면(api 버전 어긋남) null — 화면에 undefined 를 아이디로 찍지 않게. */
export function maskedLoginIdOf(body: unknown): string | null {
  const value = (body as { maskedLoginId?: unknown } | null)?.maskedLoginId;
  return typeof value === "string" && value ? value : null;
}
