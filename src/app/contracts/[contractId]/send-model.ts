// 재발송 · 저장 뒤 보내기 실패를 화면이 다룰 모양으로 바꾼다(front #41 리뷰). 서버 액션 · 상세와 테스트가 함께 쓴다.
import { failureOf } from "../../../lib/action-failure.ts";
import { isApiSendRefusal, type ApiError } from "../../../lib/api-error.ts";
import { inProgressOf, type InProgressContract } from "../new/contract-form-model.ts";
import type { components } from "../../../lib/api-types.generated";

export type SendContractBody = components["schemas"]["SendContractDto"];

/** 화면이 본 계약 — 상태와 마지막 발송 시각(상세 · 직원 목록 · 직원 상세의 lastSentAt) */
export type SeenContract = { status: SendContractBody["expectedStatus"] | null; sentAt?: string | null };

/**
 * 재발송 본문 — 화면이 본 계약 상태 · 발송 시각을 싣는다. 그사이 바뀌었으면(거부 · 만료 · 다른 탭에서 먼저 보냄) api 가 409
 * CONTRACT_STATUS_CONFLICT 로 막아 다시 읽는다(front #136 재리뷰). 발송 시각은 상태가 그대로인 발송 대기 · 서명 대기를 두 탭에서
 * 두 번 보내는 것을 막는다(재발송마다 바뀐다). 모르는 값은 비운다(api 가 그 검사를 하지 않는다)
 */
export function sendBodyOf(seen: SeenContract | null | undefined): SendContractBody {
  // 서버 액션은 누구나 직접 부를 수 있다 — 문자열이 아닌 값은 싣지 않는다(터지지 않게). 틀린 문자열은 api 가 400 으로 막는다(셀프 code-review)
  const status = typeof seen?.status === "string" ? seen.status : null;
  const sentAt = typeof seen?.sentAt === "string" ? seen.sentAt : null;
  return { ...(status && { expectedStatus: status }), ...(sentAt && { expectedSentAt: sentAt }) };
}

/**
 * 실패 결과. recheck 면 api 가 이미 쓰고 보냈을 수 있다 — 확인창의 보내기를 막고 상세를 다시 읽는다(두 번 가지 않게). blocked 면
 * 다시 보내도 같은 까닭으로 막힌다 — 보내기만 막고 다시 읽지 않는다(다시 읽으면 버튼 · 확인창과 함께 까닭 문장이 사라진다)
 */
export type SendFailure = { ok: false; error: string; code?: string; recheck: boolean; blocked?: true };

/** 접수됐는지 모를 때(응답이 끊김 · 코드 없는 502 · 504)의 문장 */
export const SEND_UNKNOWN = "발송됐는지 알 수 없습니다. 상세를 다시 읽었으니 직원에게 받았는지 확인한 뒤 다시 보내 주세요";

/** 발송 대기 종료(WHALEERP-327)가 됐는지 모를 때의 문장 — 종료도 sendFailureOf 규칙으로 고른다 */
export const END_UNKNOWN = "종료됐는지 확인하지 못했습니다. 상세를 다시 읽었으니 상태를 확인해 주세요";

/**
 * api 응답(status · 본문의 code · 문장)으로 실패를 고른다. status 가 null 이면 응답을 받지 못했다(연결이 끊김).
 * - SEND_UNCONFIRMED: api 가 쓰고 보냈을 수 있다(되돌리기 실패 포함) → recheck
 * - 409 상태 충돌 · 「다른 요청이 먼저 고침」(code 없음): 화면이 낡았다 → recheck
 * - 409 REOPEN_BLOCKED · WORK_TIME_OVERLAP(거부 · 만료를 되살릴 수 없음, WHALEERP-153): 화면을 연 뒤 막혔다 → api 문장 그대로 보이고
 *   blocked(보내기만 막는다). 다시 읽으면 api canResend 가 거짓이라 버튼 · 확인창과 함께 까닭이 사라진다(front #136 재리뷰)
 * - 코드 없는 502 · 504, 응답 없음: 앞단에서 끊겨 접수 여부를 모른다 → recheck, 문장은 SEND_UNKNOWN
 * - 나머지: api 문장 그대로, 보내기를 막지 않는다(SEND_FAILED · 503 은 다시 보내면 될 수 있고,
 *   SEND_PHONE_NOT_MOBILE 은 원인이 풀릴 때까지 같은 409)
 */
const BLOCKED_CODES = new Set(["REOPEN_BLOCKED", "WORK_TIME_OVERLAP"]);

export function sendFailureOf(status: number | null, code: string | undefined, message: string, unknown = SEND_UNKNOWN): SendFailure {
  const withCode = code ? { code } : {};
  if (status === null || ((status === 502 || status === 504) && !code)) return { ok: false, error: unknown, recheck: true };
  const recheck = code === "SEND_UNCONFIRMED" || (status === 409 && (!code || code === "CONTRACT_STATUS_CONFLICT"));
  const blocked = status === 409 && !!code && BLOCKED_CODES.has(code);
  return { ok: false, error: message, ...withCode, recheck, ...(blocked && { blocked: true as const }) };
}

/**
 * 근로계약 상세에서 가입한 직원에게 앱으로 다시 보낼 때의 확인창 문구(WHALEERP-611). 데모
 * docs/demo/src/pages/staff/contracts-signing.mjs 의 문구 그대로다. 이름을 모르면 그 조각만 뺀다.
 */
export function signingResendCopy(name: string | null | undefined): { title: string; body: string } {
  return {
    title: "계약서를 다시 보내시겠습니까?",
    body: `같은 조건의 계약서를 ${name ? `${name} 님에게 ` : ""}다시 보냅니다. 날인 기한은 발송일로부터 30일입니다.`,
  };
}

/**
 * 가입 전 직원의 재발송 확인창 문구(WHALEERP-611 · 130) — 근로계약 상세의 발송 대기와 직원 목록 · 상세의 재발송이 같이 쓴다.
 * api 가 보낼 때 다시 판별해 그 번호로 가입한 계정이 없으면 가입 초대 알림톡(초대 코드, 날인 기한은 보낸 날부터 30일), 있으면
 * 소속 추가 확인 요청(알림톡 · 메일, 계약은 발송 대기 · 날인 기한은 수락한 날부터 30일, api #164)을 보낸다. 화면이 읽은 값
 * (가입 상태 · draftAction)은 보낼 때의 판별과 다를 수 있어(그사이 계정이 생기거나 없어짐) 둘을 함께 알린다. 제목은 가입한 직원의
 * 문구(signingResendCopy)와 같다 — 같은 화면에서 무엇을 다시 보내는지가 같게 보이도록(front #146 code-review).
 */
export function inviteResendCopy(name: string | null | undefined): { title: string; body: string[]; done: string } {
  return {
    title: "계약서를 다시 보내시겠습니까?",
    body: [
      `${name ? `${name} 님의 ` : "직원 "}휴대전화번호로 다시 보냅니다. 그 번호로 가입한 계정이 없으면 가입 초대 알림톡(초대 코드)을, 있으면 소속 추가 확인 요청(알림톡 · 메일)을 보냅니다.`,
      "초대 코드와 요청은 보낸 날부터 30일 동안 유효하고, 앞서 보낸 것은 쓸 수 없습니다. 날인 기한은 가입 초대면 보낸 날부터, 소속 추가 확인이면 직원이 수락한 날부터 30일입니다 — 소속 추가 확인은 직원이 수락할 때까지 계약이 발송 대기로 남습니다.",
    ],
    done: "계약서를 다시 보냈습니다.",
  };
}

/**
 * 근로계약 상세 재발송 확인창 문구 — api 가 보내는 길로 고른다: 가입한 직원(api staffJoined)이면 앱으로(signingResendCopy), 아니면
 * inviteResendCopy — api 가 보낼 때 다시 판별해 가입 초대 알림톡이거나 소속 추가 확인 요청이다(WHALEERP-130, 직원 목록 재발송과 같은
 * 문구). 상태가 아니라 가입 여부로 고른다 — 가입 전 직원의 서명 대기도 초대 알림톡 · 요청으로 가고 앞서 보낸 것이 무효가 된다(front #136
 * code-review). 거부 · 만료(WHALEERP-153)는 같은 조건으로 다시 보낸다는 문장을 앞에 더한다. 본문은 문단마다 한 줄
 */
export function resendDialogCopy(status: string | null | undefined, name: string | null | undefined, staffJoined: boolean): { title: string; body: string[] } {
  const signing = signingResendCopy(name);
  const invite = inviteResendCopy(name);
  const base = staffJoined ? { title: signing.title, body: [signing.body] } : { title: invite.title, body: invite.body };
  const again =
    status === "REJECTED"
      ? "거부된 근로계약서를 같은 조건으로 다시 보냅니다."
      : status === "EXPIRED"
        ? "날인 기한이 지나 만료된 근로계약서를 같은 조건으로 다시 보냅니다."
        : null;
  return again ? { title: base.title, body: [again, ...base.body] } : base;
}

const RESENDABLE = new Set(["PENDING_SEND", "PENDING_SIGNATURE"]);
const REOPENABLE = new Set(["REJECTED", "EXPIRED"]);

/**
 * 상세 제목 줄에 「재발송」을 세우는가 — 발송 대기 · 서명 대기와 거부 · 만료(WHALEERP-153)에서 api 가 다시 보낼 수 있다고 할 때만.
 * canResend 칸이 없는 옛 응답을 위한 대체 값(발송 대기 · 서명 대기면 세움)은 api #158 · #164 가 배포된 뒤 걷었다(front #146 재리뷰).
 */
export const canShowResend = (status: string | null | undefined, canResend: boolean | undefined): status is string =>
  !!status && (RESENDABLE.has(status) || REOPENABLE.has(status)) && canResend === true;

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
 * api 의 503(설정 · 템플릿 문제) → 그 밖 5xx 는 모두 결과 모름 → 4xx.
 * - api 는 저장 트랜잭션을 커밋한 뒤 발송(delivery.dispatch)을 부른다(create · update · updateWorker 모두). dispatch 앞쪽 조회가 실패하면 이미 저장된
 *   요청이 코드 없는 500 이 될 수 있어, 5xx 는 저장 전 실패를 코드로 확인할 수 없으면 확정 실패로 다루지 않는다 — 저장 전에 던지는 5xx 코드는 api 에 없다.
 * - 예외 api 의 503(isApiSendRefusal — Nest 본문 statusCode 503 + 비어 있지 않은 message): 직원 앱 주소 · 대체 문자 발신번호 · 가입 초대 템플릿이 없거나 꺼진 경우로, 저장 트랜잭션 안에서 던져 저장째 되돌아간다(assertCanInvite) —
 *   저장 전 실패가 확실하므로 api 문장을 그대로 보이고 폼을 잠그지 않는다. 프록시 · 로드밸런서의 503(본문 없음 · HTML · 문구 없음)은 api 에 닿았는지 몰라 결과 모름이다.
 * - 502 SEND_FAILED · SEND_UNCONFIRMED 인데 계약 ID 가 빠져 상세로 보낼 수 없으면 결과 모름이다.
 * 409 + 진행 중 계약이면 목록도 싣는다. 4xx 는 api 문구 그대로다. 로그는 failureOf 가 남기고, 503 은 여기서 남긴다.
 */
export function saveFailureOf(e: ApiError, log: Record<string, unknown>): SaveFailure {
  if (e.status === 401) return { kind: "login" };
  const target = sendFailedTarget(e.status, e.body);
  if (target) return { kind: "sendFailed", target };
  if (isApiSendRefusal(e.status, e.body)) {
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
 * 임시저장 삭제 실패의 문장. 결과 모름만 따로 가르고(저장과 달리 발송이 없어 남은 5xx 는 확정 실패) — 결과 모름(코드 없는 502 · 504)은 「삭제 결과를 확인하지 못했습니다…」, 그 밖의 5xx 는 확정 실패,
 * 4xx 는 api 문구. 401 은 로그인이 필요하다는 고정 문구.
 */
export function deleteFailureOf(e: ApiError, log: Record<string, unknown>): string {
  if (e.status === 401) return "로그인이 필요합니다";
  const code = (e.body as { code?: unknown } | null)?.code;
  const unknown = saveOutcomeUnknown(e.status, typeof code === "string" ? code : undefined);
  return failureOf(e, "삭제", log, { definite: !unknown }).message;
}
