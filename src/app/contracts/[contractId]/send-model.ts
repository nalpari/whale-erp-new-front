// 재발송 · 저장 뒤 보내기 실패를 화면이 다룰 모양으로 바꾼다(front #41 리뷰). 서버 액션 · 상세와 테스트가 함께 쓴다.
import { failureOf } from "../../../lib/action-failure.ts";
import type { ApiError } from "../../../lib/api-error.ts";
import { inProgressOf, type InProgressContract } from "../new/contract-form-model.ts";

/** 실패 결과. recheck 면 api 가 이미 쓰고 보냈을 수 있다 — 확인창의 보내기를 막고 상세를 다시 읽는다(두 번 가지 않게) */
export type SendFailure = { ok: false; error: string; code?: string; recheck: boolean };

/** 접수됐는지 모를 때(응답이 끊김 · 코드 없는 502 · 504)의 문장 */
export const SEND_UNKNOWN = "발송됐는지 알 수 없습니다. 상세를 다시 읽었으니 직원에게 받았는지 확인한 뒤 다시 보내 주세요";

/** 발송 대기 종료(WHALEERP-327)가 됐는지 모를 때의 문장 — 종료도 sendFailureOf 규칙으로 고른다 */
export const END_UNKNOWN = "종료됐는지 확인하지 못했습니다. 상세를 다시 읽었으니 상태를 확인해 주세요";

/**
 * api 응답(status · 본문의 code · 문장)으로 실패를 고른다. status 가 null 이면 응답을 받지 못했다(연결이 끊김).
 * - SEND_UNCONFIRMED: api 가 쓰고 보냈을 수 있다(되돌리기 실패 포함) → recheck
 * - 409 상태 충돌 · 「다른 요청이 먼저 고침」(code 없음): 화면이 낡았다 → recheck
 * - 코드 없는 502 · 504, 응답 없음: 앞단에서 끊겨 접수 여부를 모른다 → recheck, 문장은 SEND_UNKNOWN
 * - 나머지: api 문장 그대로, 보내기를 막지 않는다(SEND_FAILED · 503 은 다시 보내면 될 수 있고, SEND_CHANNEL_NOT_READY ·
 *   SEND_PHONE_NOT_MOBILE 은 원인이 풀릴 때까지 같은 409)
 */
export function sendFailureOf(status: number | null, code: string | undefined, message: string, unknown = SEND_UNKNOWN): SendFailure {
  const withCode = code ? { code } : {};
  if (status === null || ((status === 502 || status === 504) && !code)) return { ok: false, error: unknown, recheck: true };
  const recheck = code === "SEND_UNCONFIRMED" || (status === 409 && (!code || code === "CONTRACT_STATUS_CONFLICT"));
  return { ok: false, error: message, ...withCode, recheck };
}

/**
 * 근로계약 상세에서 서명 대기 계약을 다시 보낼 때의 확인창 문구(WHALEERP-611). 데모
 * docs/demo/src/pages/staff/contracts-signing.mjs 의 문구 그대로다. 이름을 모르면 그 조각만 뺀다.
 * 상세 응답에 가입 여부가 없어 서명 대기면 가입 전(가입 초대 알림톡)이어도 이 문구다 — 틀린 말은 없지만 가입 전이면 앞서 보낸
 * 초대 코드가 무효가 된다는 점은 빠진다(상세 응답에 가입 여부가 생기면 나눈다).
 */
export function signingResendCopy(name: string | null | undefined): { title: string; body: string } {
  return {
    title: "계약서를 다시 보내시겠습니까?",
    body: `같은 조건의 계약서를 ${name ? `${name} 님에게 ` : ""}다시 보냅니다. 날인 기한은 발송일로부터 30일입니다.`,
  };
}

/** 발송 대기(가입 초대 알림톡)의 재발송 확인창 문구 */
const INVITE_RESEND_COPY = {
  title: "근로계약서를 다시 보내시겠습니까?",
  body: [
    "직원 휴대전화번호로 가입 초대 알림톡(초대 코드)을 다시 보냅니다. 초대 코드와 서명 기한은 보낸 날부터 30일입니다.",
    "앞서 보낸 초대 코드는 쓸 수 없고, 서명 기한도 새로 잡힙니다.",
  ],
};

/** 근로계약 상세 재발송 확인창 문구 — 서명 대기면 signingResendCopy, 그 밖(발송 대기)은 가입 초대 문구. 본문은 문단마다 한 줄 */
export function resendDialogCopy(status: string | null | undefined, name: string | null | undefined): { title: string; body: string[] } {
  if (status === "PENDING_SIGNATURE") {
    const { title, body } = signingResendCopy(name);
    return { title, body: [body] };
  }
  return { title: INVITE_RESEND_COPY.title, body: [...INVITE_RESEND_COPY.body] };
}

/**
 * 저장하면 곧바로 보낸다(2026-10-19 재영). 저장 · 고침은 끝났는데 가입 초대 알림톡이 실패하면 api 가 502 와 계약 ID 를
 * 준다 — 그 계약 상세로 옮겨 알린다(새 계약은 임시저장으로 되돌아가 있어, 작성 화면에서 다시 저장하면 한 벌 더 생긴다).
 * 쿼리에는 정해진 이름(failed · unconfirmed)만 싣는다.
 */
export function sendFailedTarget(status: number, body: unknown): string | null {
  if (status !== 502) return null;
  const { code, contractId } = (body ?? {}) as { code?: unknown; contractId?: unknown };
  const kind = code === "SEND_FAILED" ? "failed" : code === "SEND_UNCONFIRMED" ? "unconfirmed" : null;
  if (!kind || typeof contractId !== "number" || !Number.isInteger(contractId) || contractId < 1 || contractId > 2_147_483_647) return null;
  return `/contracts/${contractId}?send=${kind}`;
}

/**
 * 저장(= 보내기)의 결과를 받지 못했는가 — api 와의 연결이 응답 전에 끊겼거나(status null) 앞단이 코드 없이 502 · 504 를 줬다.
 * api 는 이미 저장하고 보냈을 수 있어, 같은 화면에서 다시 저장하면 두 번 보내거나(고침) 한 벌 더 만든다(새 계약, front #50 리뷰).
 */
export const saveOutcomeUnknown = (status: number | null, code: string | undefined) =>
  status === null || ((status === 502 || status === 504) && !code);

/** 새 계약 저장의 결과를 받지 못했을 때 — 계약 ID 를 몰라 상세로 옮기지 못한다. 같은 폼으로 다시 저장하지 못하게 막는다 */
export const SAVE_UNKNOWN_NEW =
  "저장 요청의 결과를 받지 못했습니다. 저장 · 발송됐을 수 있으니 목록에서 확인해 주세요 — 이 화면에서 다시 저장하면 한 벌 더 만들어 두 번 보낼 수 있습니다";

/**
 * 상세 위쪽 안내(?send=). 되돌아간 상태에 맞춰 할 일을 알린다 — 임시저장이면 이어 쓰기에서 다시 저장, 수정 요청이면 「수정」에서
 * 다시 저장(재발송은 수정 요청에서 할 수 없다, front #50 리뷰), 그 밖에는 재발송. unknown 은 저장 요청의 결과를 받지 못했을 때다.
 */
export function sendNoticeOf(raw: unknown, status: string | null): string | null {
  if (raw === "unconfirmed")
    return "저장했지만 가입 초대 알림톡이 접수됐는지 알 수 없습니다. 직원에게 받았는지 확인한 뒤 재발송해 주세요 — 다시 보내면 두 번 갈 수 있습니다";
  if (raw === "unknown")
    return "저장 요청의 결과를 받지 못했습니다. 아래 상태로 저장됐는지 확인하고, 보냈다면 직원에게 받았는지 확인한 뒤 필요할 때만 다시 보내 주세요";
  if (raw !== "failed") return null;
  if (status === "DRAFT")
    return "가입 초대 알림톡을 보내지 못해 임시저장으로 두었습니다. 휴대전화번호를 확인하고 이어 쓰기에서 다시 저장해 주세요";
  if (status === "CORRECTION_REQUESTED")
    return "고친 내용은 저장했지만 가입 초대 알림톡을 보내지 못해 수정 요청으로 두었습니다. 휴대전화번호를 확인하고 「수정」에서 다시 저장해 주세요";
  return "고친 내용은 저장했지만 가입 초대 알림톡을 보내지 못했습니다. 휴대전화번호를 확인하고 재발송해 주세요";
}

/** 저장 서버 액션을 부른 결과를 받지 못했다(호출 자체가 끊김) */
export const SAVE_CALL_LOST = Symbol("save-call-lost");

/**
 * 저장 서버 액션을 부른다. 호출 자체가 끊기면(앞단 504 · 배포 중 재시작 · 네트워크) SAVE_CALL_LOST 를 돌려준다 — 저장 = 발송이라
 * 이미 저장 · 발송됐을 수 있다. 액션의 redirect() · notFound() 는 Next 가 클라이언트 await 를 그 오류로 끝내 알리므로, rethrow 로
 * 다시 던져 원래 목적지로 가게 한다(front #50 재리뷰 — 맨 catch 가 성공 redirect 까지 받으면 매번 「결과 모름」이 된다).
 * rethrow 는 next/navigation 의 unstable_rethrow — 이 파일이 next 를 import 하지 않게 넘겨받는다(node --test).
 */
export async function callSave<T>(action: () => Promise<T>, rethrow: (e: unknown) => void): Promise<T | typeof SAVE_CALL_LOST> {
  try {
    return await action();
  } catch (e) {
    rethrow(e);
    return SAVE_CALL_LOST;
  }
}

/** 저장 실패를 서버 액션이 어떻게 처리할지. login 은 로그인 필요, sendFailed 는 저장은 됐고 보내기가 실패해 그 상세로, unknown 은 결과 모름(폼 잠금 · 상세로) */
export type SaveFailure =
  | { kind: "login" }
  | { kind: "sendFailed"; target: string }
  | { kind: "unknown" }
  | { kind: "error"; error: string; inProgress?: InProgressContract[] };

/**
 * 근로계약 저장(새 계약 · 이어 쓰기 · 당사자 정보 수정)의 ApiError 를 가른다. 순서가 뜻이다 — 401 → 저장은 됐는데 보내기만 실패(502 + 코드 + 계약 ID) →
 * 503(설정 · 템플릿 문제) → 5xx 는 모두 결과 모름 → 그 밖(4xx).
 * - api 는 저장 트랜잭션을 커밋한 뒤 발송(delivery.dispatch)을 부른다(create · update · updateWorker 모두). dispatch 앞쪽 조회가 실패하면 이미 저장된
 *   요청이 코드 없는 500 이 될 수 있어, 5xx 는 저장 전 실패를 코드로 확인할 수 없으면 확정 실패로 다루지 않는다 — 저장 전에 던지는 5xx 코드는 api 에 없다.
 * - 예외 503: 직원 앱 주소 · 대체 문자 발신번호 · 가입 초대 템플릿이 없거나 꺼진 경우로, 저장 트랜잭션 안에서 던져 저장째 되돌아간다(assertCanInvite) —
 *   저장 전 실패가 확실하므로 api 문장을 그대로 보이고 폼을 잠그지 않는다.
 * - 502 SEND_FAILED · SEND_UNCONFIRMED 인데 계약 ID 가 빠져 상세로 보낼 수 없으면 결과 모름이다.
 * 409 + 진행 중 계약이면 목록도 싣는다. 4xx 는 api 문구 그대로다. 로그는 failureOf 가 남기고, 503 은 여기서 남긴다.
 */
export function saveFailureOf(e: ApiError, log: Record<string, unknown>): SaveFailure {
  if (e.status === 401) return { kind: "login" };
  const target = sendFailedTarget(e.status, e.body);
  if (target) return { kind: "sendFailed", target };
  if (e.status === 503) {
    console.error("근로계약 저장 실패(발송 설정)", log, e);
    return { kind: "error", error: e.message };
  }
  if (e.status >= 500) {
    console.error("근로계약 저장 결과 모름", log, e);
    return { kind: "unknown" };
  }
  const inProgress = e.status === 409 ? inProgressOf(e.body) : undefined;
  const { message } = failureOf(e, "저장", log);
  return inProgress ? { kind: "error", error: message, inProgress } : { kind: "error", error: message };
}

/**
 * 임시저장 삭제 실패의 문장. 저장과 같은 기준이다 — 결과 모름(코드 없는 502 · 504)은 「삭제 결과를 확인하지 못했습니다…」, 그 밖의 5xx 는 확정 실패,
 * 4xx 는 api 문구. 401 은 로그인이 필요하다는 고정 문구.
 */
export function deleteFailureOf(e: ApiError, log: Record<string, unknown>): string {
  if (e.status === 401) return "로그인이 필요합니다";
  const code = (e.body as { code?: unknown } | null)?.code;
  const unknown = saveOutcomeUnknown(e.status, typeof code === "string" ? code : undefined);
  return failureOf(e, "삭제", log, { definite: !unknown }).message;
}
