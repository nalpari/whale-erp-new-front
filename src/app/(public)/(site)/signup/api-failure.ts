// api 가 거절한 회원가입 · 중복 확인 요청을 화면 문구와 로그 여부로 바꾼다. actions.ts 가 쓴다.
// 400 · 409 만 예상한 거절이다 — api 문구가 그 칸에 맞는 안내라 그대로 보이고 로그는 남기지 않는다.
// 그 밖(429 한도, api 가 아직 배포되지 않은 404, 가드 설정 오류 401 · 403, 5XX …)은 원문(영문일 수 있다)을
// 보이지 않고 정해진 문구를 보이며, 서버 로그에 남긴다 — 남기지 않으면 「가끔 가입이 안 된다」는 말만 들린다.

// 한도 초과(429). 도입문의 · 회원가입의 api 문구와 같은 말이다(명세 S-RCJXIG, 2026-10-15).
export const BUSY_MESSAGE = "잠시 후 다시 시도해 주세요.";

/** 중복 확인 요청이 api 에 닿지 못했거나 뜻밖의 실패. 서버 액션(actions.ts)과 폼(signup-form.tsx)이 같이 쓴다. */
export const CHECK_FAILED_MESSAGE = "중복 확인을 하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/** 응답을 받았는지 알 수 없는 실패(시간 초과, 서버 액션 전송 실패). 가입은 이미 됐을 수 있다. */
export const UNKNOWN_RESULT_MESSAGE = "가입 결과를 확인하지 못했습니다. 이미 가입되었을 수 있으니 로그인을 먼저 시도해 주세요.";

export type ApiFailure = { message: string; log: boolean; conflict: boolean };

export function apiFailure(status: number, message: string, fallback: string): ApiFailure {
  if (status === 400) return { message, log: false, conflict: false };
  if (status === 409) return { message, log: false, conflict: true };
  if (status === 429) return { message: BUSY_MESSAGE, log: true, conflict: false };
  return { message: fallback, log: true, conflict: false };
}
