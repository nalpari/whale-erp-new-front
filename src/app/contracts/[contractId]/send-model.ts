// 발송 · 재발송 실패를 화면이 다룰 모양으로 바꾼다(front #41 리뷰). 서버 액션과 테스트가 함께 쓴다.

/** 실패 결과. recheck 면 api 가 이미 쓰고 보냈을 수 있다 — 확인창의 보내기를 막고 상세를 다시 읽는다(두 번 가지 않게) */
export type SendFailure = { ok: false; error: string; code?: string; recheck: boolean };

/** 접수됐는지 모를 때(응답이 끊김 · 코드 없는 502 · 504)의 문장 */
export const SEND_UNKNOWN = "발송됐는지 알 수 없습니다. 상세를 다시 읽었으니 직원에게 받았는지 확인한 뒤 다시 보내 주세요";

/**
 * api 응답(status · 본문의 code · 문장)으로 실패를 고른다. status 가 null 이면 응답을 받지 못했다(연결이 끊김).
 * - SEND_UNCONFIRMED: api 가 쓰고 보냈을 수 있다(되돌리기 실패 포함) → recheck
 * - 409 상태 충돌 · 「다른 요청이 먼저 고침」(code 없음): 화면이 낡았다 → recheck
 * - 코드 없는 502 · 504, 응답 없음: 앞단에서 끊겨 접수 여부를 모른다 → recheck, 문장은 SEND_UNKNOWN
 * - 나머지(SEND_FAILED · SEND_CHANNEL_NOT_READY · SEND_PHONE_NOT_MOBILE · 503 …): api 문장 그대로, 다시 보낼 수 있다
 */
export function sendFailureOf(status: number | null, code: string | undefined, message: string): SendFailure {
  const withCode = code ? { code } : {};
  if (status === null || ((status === 502 || status === 504) && !code)) return { ok: false, error: SEND_UNKNOWN, recheck: true };
  const recheck = code === "SEND_UNCONFIRMED" || (status === 409 && (!code || code === "CONTRACT_STATUS_CONFLICT"));
  return { ok: false, error: message, ...withCode, recheck };
}
