// 로그아웃 서버 액션을 브라우저 코드가 부르는 곳. next/* 를 import 하지 않는다 — node --test 가 그대로 읽는다(sign-out.test.ts).

/**
 * 서버 액션의 redirect 신호인가 — 액션이 redirect 로 끝나면 Next 는 화면을 옮기면서 await 을 이 오류(digest `NEXT_REDIRECT;…`)로
 * reject 한다. notFound · forbidden · unauthorized 는 액션에서 이동 없이 오류만 오므로 여기 들지 않는다(unstable_rethrow 는 그것까지
 * 다시 던져 쓰지 않는다). next/navigation 은 isRedirectError 를 내보내지 않아 digest 를 직접 본다. 바깥 오류만 본다 — cause 로 감싼
 * redirect 는 감싼 쪽이 실패한 것이다.
 */
export function isActionRedirect(e: unknown): boolean {
  if (typeof e !== "object" || e === null || !("digest" in e)) return false;
  const { digest } = e;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT;");
}

/**
 * 로그아웃 서버 액션(logout → /login 등)을 부른다. true 는 redirect 응답을 받았다는 뜻이고, 이동은 Next 가 맡는다 —
 * await 이 NEXT_REDIRECT 로 끝나도 성공이다. 다시 던지지 않는다: 호출부의 판단(`if (!(await signOut(...)))`)이 건너뛰어지고,
 * Next 의 전역 처리(app-router 의 unhandledrejection)가 같은 주소로 한 번 더 옮긴다.
 * 액션 자체가 실패하면(연결 끊김 · 배포 직후 옛 화면이 서버 액션을 못 찾음 · 서버 오류) 쿠키가 남아 proxy 가 /login 을 다시 자기 홈으로
 * 돌려보내므로, 이동하지 않고 알린 뒤 false 를 돌려준다.
 */
export async function signOut(logout: () => Promise<void>): Promise<boolean> {
  try {
    await logout();
    return true;
  } catch (e) {
    if (isActionRedirect(e)) return true;
    console.error("로그아웃 실패", logout.name, e);
    alert("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    return false;
  }
}
