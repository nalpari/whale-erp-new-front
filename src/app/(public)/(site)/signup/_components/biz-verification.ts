// 사업자정보 진위확인(국세청)의 결과를 화면 문구로 바꾼다. 서버 액션(actions.ts)과 화면(biz-auth-section · signup-form)이 같이 쓴다.
// api 가 중복 검사 → 국세청 확인을 하고 10분짜리 인증 토큰을 준다. front 는 그 토큰을 들고 있다가 가입할 때 싣는다.
import { BUSY_MESSAGE } from "./api-failure.ts";

/** api 가 주는 인증 토큰의 유효 시간. 지나면 가입 요청을 보내지 않고 다시 인증하게 한다. */
export const BIZ_VERIFICATION_TTL_MS = 10 * 60_000;

/** api 에 닿지 못했거나 api 문구를 보일 수 없는 실패. */
export const BIZ_VERIFY_FAILED_MESSAGE = "사업자정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/** 인증한 뒤 10분이 지나 가입하려 할 때. */
export const BIZ_VERIFICATION_EXPIRED_MESSAGE = "인증 시간(10분)이 지났습니다. 다시 인증해 주세요.";

// 400 형식 · 409 중복 · 422 불일치는 예상한 거절이라 api 문구를 그대로 보이고 로그를 남기지 않는다.
// 503 은 국세청 장애라 api 문구(한글로 정해 둔 안내)를 보이되, 자주 나면 알아야 하므로 로그를 남긴다.
// 그 밖(429 한도, 아직 배포 안 된 404, 5XX …)은 원문이 영문일 수 있어 숨기고 정해진 문구를 보인다.
export function bizVerificationFailure(status: number, message: string): { message: string; log: boolean } {
  if (status === 400 || status === 409 || status === 422) return { message, log: false };
  if (status === 503) return { message, log: true };
  if (status === 429) return { message: BUSY_MESSAGE, log: true };
  return { message: BIZ_VERIFY_FAILED_MESSAGE, log: true };
}

export function isBizVerificationExpired(verifiedAt: number, now: number): boolean {
  return now - verifiedAt >= BIZ_VERIFICATION_TTL_MS;
}
