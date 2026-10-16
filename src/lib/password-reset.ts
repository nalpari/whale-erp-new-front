// 직원 비밀번호 초기화(WHALEERP-177) 판정. 관리자는 비밀번호를 알 수도 정할 수도 없다 — 재설정 링크가 직원 계정 이메일로 간다.
// 화면은 버튼 · 문구를 미리 가르고, 막는 것은 늘 api 다(POST /staff-members/:id/password-reset-links).
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { StaffMember } from "./staff-members.ts";

/** 본사 역할. api admin-scope 의 HQ_ROLES 와 같다. */
const HQ_ROLES: ReadonlySet<string> = new Set(["BM", "BA"]);

/**
 * 상세의 「비밀번호 초기화」 버튼. 가입 전 · 퇴직 · 탈퇴 직원에게는 숨기고(데모 주석, 2026-10-08 재영), 「직원 정보 관리」 수정 권한이
 * 있을 때만 보인다(api 의 메뉴 권한 검사, WHALEERP-177).
 * 퇴직 예정(재직 + 퇴직일)은 아직 일하는 직원이라 보인다 — api 도 퇴직(RETIRED)만 409 로 막는다.
 * 탈퇴는 가입 완료인데 계정 이메일이 없는 것으로 가린다 — 상세 응답(api #56)은 링크 발송과 같은 기준으로 email 을 내서, 가입 전 ·
 * 탈퇴이거나 본사 역할이 동의로만 보는 가맹 점포 직원(발송도 404)이면 null 이다. 어느 쪽이든 보낼 수 없으니 숨기는 것이 맞다.
 * 탈퇴 표시가 따로 오지 않으니 이 규칙이 바뀌면 함께 고친다. 놓친 경우는 api 가 409 로 막는다.
 * 본사 역할(BM · BA)은 직영 점포 직원에게만 보인다. 본사 제공 동의한 가맹 직원은 상세가 열리지만, 계정 조치는 동의와 상관없이
 * 점포 단위라 api 가 404 다 — 가맹 점포 직원은 가맹마스터 · 가맹관리자만 된다(api canManageStaffAccount, 2026-10-14 재영, ATT-30).
 * 점포 유형을 모르면 api 처럼 직영이 아닌 것으로 본다. 본사 역할이 아니면 점포 유형을 보지 않는다 — 범위는 api 가 본다.
 */
export function canResetPassword(
  staff: Pick<StaffMember, "joinState" | "employmentStatus" | "store" | "email">,
  roleTypeCode: string,
  canUpdate: boolean,
): boolean {
  if (!canUpdate || staff.joinState !== "JOINED" || staff.employmentStatus !== "EMPLOYED" || staff.email === null) return false;
  return !HQ_ROLES.has(roleTypeCode) || staff.store.storeType === "DIRECT";
}

/**
 * 확인창 본문의 받는 곳 — 「재설정 링크가 {이것} 발송됩니다」. email 은 상세 응답의 계정 이메일(회원가입 때 쓴 것, 링크가 가는 곳)이다.
 * 보낼 수 없는 직원(가입 전 · 탈퇴 · 본사 역할의 가맹 직원)이면 null 이라 버튼이 없다 — 비었을 때의 문구는 api 머지 전(응답에 email 이
 * 없을 때)을 위한 것이다.
 */
export const resetRecipientText = (email: string | null) => (email ? `이메일 아이디 ${email} 으로` : "직원의 이메일 아이디로");

/**
 * 서버가 api 결과를 모를 때(5xx · 프록시 503 · 연결 실패). 발송 여부는 화면을 새로 받아도 알 수 없어, 다시 보내도 되는지를 알린다.
 * 실제로 나갔다면 1분 제한이 걸려 있고, 보내지 못했다면 api 가 링크를 지워 제한이 없다.
 */
export const RESET_UNKNOWN_MESSAGE = "발송 결과를 확인하지 못했습니다. 직원이 메일을 받지 못했다면 1분 뒤 다시 보내 주세요.";

/**
 * 서버 액션 자체를 부르지 못했을 때(브라우저 연결 끊김 · 배포 뒤 옛 화면의 액션 불일치). 옛 화면이면 새로 고쳐야 풀린다.
 */
export const RESET_REQUEST_FAILED_MESSAGE = "발송 결과를 확인하지 못했습니다. 화면을 새로 고친 뒤, 직원이 메일을 받지 못했다면 다시 보내 주세요.";

/**
 * 확인창 안에 둘 실패 문구. 결과 모름(status 없음)은 고정 문구로 바꾸고, 그 밖에는 문구를 그대로 보인다 — 404 · 409 · 429 · 503 은
 * api 의 한국어 문구, 401 은 서버 액션의 로그인 만료 문구다. 429 는 「방금 재설정 링크를 보냈습니다…」라 이미 보냈다는 사실을 알린다
 * (데모의 「잠시 뒤 다시 시도해 주세요」 대신, 2026-10-16 노영주). 403 은 확인창이 useFailure 로 따로 처리한다.
 */
export function resetFailureMessage(failure: { status?: number; message: string }): string {
  return failure.status === undefined ? RESET_UNKNOWN_MESSAGE : failure.message;
}

/** 실패 뒤 상세를 다시 받는가. 409(가입 전 · 퇴직 · 탈퇴)는 화면이 낡았다는 뜻이라 다시 받아 버튼을 거둔다. */
export const refreshesAfterReset = (failure: { status?: number }) => failure.status === 409;

/**
 * 503 이 api 가 보내지 않았다고 알린 것인가 — 링크 주소 · 발송기가 없거나 발송에 실패하면 api 가 Nest 본문({ statusCode: 503, message })
 * 으로 답하고, 앞서 보낸 링크는 그대로다. 프록시 · 로드밸런서의 503(본문 없음 · HTML)은 api 에 닿았는지 몰라 결과 모름으로 둔다.
 * 문구가 비었으면 확인창에 보일 것이 없어 결과 모름으로 둔다.
 */
export function isApiSendRefusal(status: number, body: unknown): boolean {
  if (status !== 503 || typeof body !== "object" || body === null) return false;
  const { statusCode, message } = body as { statusCode?: unknown; message?: unknown };
  return statusCode === 503 && typeof message === "string" && message !== "";
}
