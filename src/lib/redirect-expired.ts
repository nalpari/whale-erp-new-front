import { redirect } from "next/navigation";
import { EXPIRED_REASON, loginPathOf } from "./auth-routes";

/**
 * 서버가 화면을 그리다 api 401 을 받았을 때. 그리는 중에는 쿠키를 지울 수 없어 /login?reason=expired 로만 보내고,
 * 남은 세션 쿠키는 proxy 가 그 주소에서 갱신으로 확인해 정리한다(checksExpiredLogin). redirect 는 오류를 던져 이동한다 —
 * try 안에서 부르면 그 catch 가 unstable_rethrow 로 다시 던져야 한다. catch 블록 안에서 부르는 것은 괜찮다.
 */
export function redirectExpired(): never {
  redirect(loginPathOf("/", "GET", EXPIRED_REASON));
}
