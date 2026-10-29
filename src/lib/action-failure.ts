// 서버 액션(쓰기 요청)의 실패 결과와 그 판정. next/* 를 import 하지 않는다 — node --test 가 이 파일을 직접 읽는다.
// Next 내부 오류(redirect · notFound)를 다시 던지는 일은 api.ts 의 actionFailure 가 먼저 한다.
import { ApiError, codeOf } from "./api-error.ts";

/**
 * 화면이 받는 쓰기 결과. 실패의 status 는 api 가 알린 4xx(또는 401)일 때만 있다 — 없으면 결과를 모르는 실패(5xx · 연결 실패)다.
 * messages 는 검증 실패(400)의 문장 목록(줄마다 나눠 보일 때), code 는 api 오류 본문의 업무 code 다.
 */
export type ActionFailure = { ok: false; status?: number; message: string; messages: string[]; code?: string };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFailure;

/** 로그에서 기능을 가르는 이름과 대상(id 등). 결과 모름은 api 로그와 맞춰 봐야 해 함께 남긴다 */
export type ActionLog = { feature?: string } & Record<string, unknown>;

/** 실패를 확정으로 다룰지. 호출부가 「결과 모름」(코드 없는 502 · 504 · 끊김)을 먼저 따로 처리한 뒤 남은 5xx 에 쓴다 — 다시 시도해도 되는 실패다 */
export type FailureOptions = { definite?: boolean };

export const SESSION_EXPIRED = "로그인이 만료되었습니다. 다시 로그인해 주세요.";

/**
 * 실패 오류를 화면에 보일 결과로. api 는 400 · 403 · 404 · 409 를 한국어로 알리므로 그대로 보인다. 401 은 할 일을 알 수 있게 고정 문구로 바꾼다.
 * 5xx · 연결 실패 · ApiError 가 아닌 오류는 결과를 모르므로 로그를 남기고 「확인하지 못했습니다」 문구(what 은 「저장」 · 「삭제」 같은 동작 이름)로 돌려준다.
 * options.definite 면 ApiError 5xx 만 확정 실패 문구(「○○하지 못했습니다. 잠시 뒤 다시 시도해 주세요.」)로 돌려준다 — 로그는 똑같이 남기고, 연결 실패 ·
 * ApiError 가 아닌 오류는 여전히 결과 모름이다.
 */
export function failureOf(error: unknown, what: string, log: ActionLog = {}, options: FailureOptions = {}): ActionFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: SESSION_EXPIRED, messages: [SESSION_EXPIRED] };
    if (error.status < 500) {
      const code = codeOf(error.body);
      return { ok: false, status: error.status, message: error.message, messages: error.messages, ...(code === undefined ? {} : { code }) };
    }
  }
  const { feature, ...target } = log;
  const definite = options.definite === true && error instanceof ApiError;
  console.error(`${feature ? `${feature} ` : ""}${what} ${definite ? "실패" : "결과 모름"}`, target, error);
  const message = definite ? `${what}하지 못했습니다. 잠시 뒤 다시 시도해 주세요.` : `${what} 결과를 확인하지 못했습니다. 목록이나 상세에서 다시 확인해 주세요.`;
  return { ok: false, message, messages: [message] };
}
