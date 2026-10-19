// 재발송 · 저장 뒤 보내기 실패를 화면이 다룰 모양으로 바꾼다(front #41 리뷰). 서버 액션 · 상세와 테스트가 함께 쓴다.

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
