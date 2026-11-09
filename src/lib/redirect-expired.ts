import { redirect, unstable_rethrow } from "next/navigation";
import { EXPIRED_REASON, loginPathOf } from "./auth-routes";

/**
 * 서버가 화면을 그리다 api 401 을 받았을 때. 그리는 중에는 쿠키를 지울 수 없어 /login?reason=expired 로만 보내고,
 * 남은 세션 쿠키는 proxy 가 그 주소에서 갱신으로 확인해 정리한다(checksExpiredLogin). redirect 는 오류를 던져 이동한다 —
 * try 안에서 부르면 그 catch 가 rethrowExpired 로 다시 던져야 한다. catch 블록 안에서 부르는 것은 괜찮다.
 */
/**
 * 서버 화면 · 라우트 핸들러에서 모든 오류를 받아 실패 문구 · 대체값으로 바꾸는 catch 의 첫 줄. request() 가 세션 만료(401)에 던진
 * 이동 신호(과 notFound 같은 Next 내부 신호)를 삼키지 않고 다시 던진다. 일반 오류(ApiError · 연결 실패)는 그냥 돌아와 아래 처리로 간다.
 * 특정 상태만 고르고 나머지를 다시 던지는 catch · 토큰 없는 호출(getEnum)만 감싼 catch 에는 필요 없다.
 */
export function rethrowExpired(error: unknown): void {
  unstable_rethrow(error);
}

export function redirectExpired(): never {
  redirect(loginPathOf("/", "GET", EXPIRED_REASON));
}
