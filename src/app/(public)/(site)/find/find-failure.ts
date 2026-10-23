// 찾기 화면의 실패 판정. next/* 를 불러오지 않아 node --test 로 검사한다(find-failure.test.ts) —
// lib/api.ts 는 next/headers 를 불러와 ApiError 를 instanceof 로 쓸 수 없어, 상태 코드 · 문구 · 이름 · 본문만 본다.

import { EMAIL_FORMAT_ERROR } from "../../../../lib/email-format.ts";

export const CONNECT_FAILED = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요";
export const THROTTLED = "요청이 많습니다. 잠시 뒤 다시 시도해 주세요";
// 이메일 칸이 있는 화면 모두 같은 형식 문구다(lib/email-format.ts)
export const INVALID_INPUT = EMAIL_FORMAT_ERROR;
// 일치 없음(404). 미사용 · 탈퇴 계정과만 맞아도 같은 문구다.
export const LOGIN_ID_NOT_FOUND = "입력하신 정보와 일치하는 회원정보가 없습니다. 이름, 이메일 주소를 다시 확인해 주세요.";
// 임시 비밀번호도 일치 여부를 알린다(2026-10-20 재영). 줄바꿈은 화면이 그대로 보인다(whitespace-pre-line).
// api #77 머지 전에는 일치 여부와 상관없이 202 라 이 문구가 뜨지 않고 늘 발송 안내다.
export const TEMPORARY_PASSWORD_NOT_FOUND =
  "회원정보를 찾을 수 없습니다.\n입력하신 정보와 일치하는 회원정보가 없습니다.\n이름, 아이디, 이메일 주소를 다시 확인해 주세요.";
// 메일 발송 중 오류(503 + code, api #77). Gmail 과 통신하다 끊긴 것이라 메일이 실제로 갔을 수도 있다 — 그래도 그 비밀번호는
// 저장되지 않아 쓸 수 없다. api 가 둘을 가리지 못하므로 「보내지 못했다」고 단정하지 않고 메일이 오지 않으면 다시 받게 한다(api 요청).
export const TEMPORARY_PASSWORD_SEND_FAILED = "임시 비밀번호 메일 발송을 확인하지 못했습니다. 몇 분 안에 메일이 오지 않으면 다시 요청해 주세요.";
const SEND_FAILED_CODE = "TEMPORARY_PASSWORD_SEND_FAILED";
// 그 밖의 5xx 는 결과를 모른다(api admin-temporary-password.service — 메일을 보낸 뒤 발급을 한 트랜잭션으로 저장한다).
// 메일 뒤 저장 실패(온 메일은 못 쓰고 앞의 임시 비밀번호가 살아 있다) · 발급을 마친 뒤 게이트웨이 502 · 504(온 메일이 유효)가
// 섞이므로 둘 다에 맞게 「받은 것으로 안 되면 다시」로 안내한다 — 바로 다시 받게 하면 둘째의 유효한 것을 만료시킨다.
export const TEMPORARY_PASSWORD_UNKNOWN =
  "처리 결과를 확인하지 못했습니다. 메일이 오지 않았거나 받은 임시 비밀번호로 로그인되지 않으면 잠시 뒤 다시 요청해 주세요";

type Failure = { status?: unknown; message?: unknown; name?: unknown; body?: unknown } | null | undefined;

const statusOf = (e: unknown) => {
  const status = (e as Failure)?.status;
  return typeof status === "number" ? status : undefined;
};
const messageOf = (e: unknown) => {
  const message = (e as Failure)?.message;
  return typeof message === "string" ? message : "";
};
// api(Nest) 가 직접 준 응답이면 본문이 { statusCode, message, … } 다. 게이트웨이 · 잘못된 API_BASE_URL 의 HTML 404 는 본문이 없다.
const nestBodyOf = (e: unknown, status: number) => {
  const body = (e as Failure)?.body as { statusCode?: unknown; code?: unknown } | null | undefined;
  return body?.statusCode === status ? body : undefined;
};

/**
 * 두 탭이 함께 쓰는 실패 문구. 예상한 거절만 따로 안내한다 — 일치 없음(404, 탭마다 다른 화면 문구 notFound)과
 * 임시 비밀번호의 1시간 5회 초과(429, api 한글 문구 그대로). log 가 true 면 화면이 모르는 실패라 서버 로그에 남긴다.
 */
export function failureOf(e: unknown, notFound: string): { message: string; log: boolean } {
  const status = statusOf(e);
  const message = messageOf(e);
  // 스로틀러 429 는 영어 기본값이라 여기서만 바꾼다(login/actions.ts 와 같다).
  if (status === 429) return { message: message.startsWith("ThrottlerException") ? THROTTLED : message, log: false };
  // 일치 없음은 api 가 직접 준 404 뿐이다. 라우트가 없는 404(「Cannot POST …」, api 미배포)와 api 밖의 404 는 연결 실패다 —
  // 일치 없음으로 보이면 사용자는 입력만 고치고 원인은 로그에도 남지 않는다.
  if (status === 404)
    return nestBodyOf(e, 404) && !message.startsWith("Cannot ") ? { message: notFound, log: false } : { message: CONNECT_FAILED, log: true };
  // 칸 길이 · 필수는 폼이 막으므로 남는 400 은 이메일 형식이다. 브라우저 type="email" 은 a@b 를 통과시키지만 api @IsEmail 은
  // 거절하고, 그 문구는 영어 기본값이다.
  if (status === 400) return { message: INVALID_INPUT, log: false };
  return { message: CONNECT_FAILED, log: true };
}

/**
 * 임시 비밀번호 요청이 던진 것을 화면 결과로. 시간 초과는 front 만 끊은 것이라 api 는 대개 발급까지 마친다 —
 * 보냈다는 안내로 끝낸다(okf/auth.md 계정 찾기, 2026-10-19 재영). 메일 발송 오류(503 + code)는 메일이 오지 않으면 다시 받게
 * 안내하고, 그 밖의 5xx(템플릿 꺼짐 · DB 오류 등)는 결과를 모른다고 안내한다.
 */
export function temporaryPasswordOutcome(e: unknown): { sent: true } | { message: string; log: boolean } {
  const name = (e as Failure)?.name;
  if (name === "TimeoutError" || name === "AbortError") return { sent: true };
  const status = statusOf(e);
  if (status === 503 && nestBodyOf(e, 503)?.code === SEND_FAILED_CODE) return { message: TEMPORARY_PASSWORD_SEND_FAILED, log: true };
  if (status !== undefined && status >= 500) return { message: TEMPORARY_PASSWORD_UNKNOWN, log: true };
  return failureOf(e, TEMPORARY_PASSWORD_NOT_FOUND);
}

/** 아이디 찾기 응답의 가린 아이디. 모양이 다르면(api 버전 어긋남) null — 화면에 undefined 를 아이디로 찍지 않게. */
export function maskedLoginIdOf(body: unknown): string | null {
  const value = (body as { maskedLoginId?: unknown } | null)?.maskedLoginId;
  return typeof value === "string" && value ? value : null;
}
