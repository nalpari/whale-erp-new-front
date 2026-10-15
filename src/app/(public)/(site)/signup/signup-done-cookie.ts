// 가입 완료 화면(/signup/done)에 보일 상호명·아이디·이메일을 이 쿠키로 건넨다. URL 쿼리로 보내면
// 서버 접근 로그·브라우저 기록에 남고, 아무 값이나 지어 넣은 주소도 진짜 완료 화면처럼 보일 수 있었다
// (2026-10-14 ip-code-review-claude 블로커#2). 쿠키는 링크(URL)로 남의 브라우저에 심을 수 없어, 지어 낸 주소로
// 가짜 완료 화면을 보여 줄 수 없다. 서버만 심도록 httpOnly 로 두고, actions.ts 의 createSignup 이 api 로부터
// 실제 가입 응답을 받은 뒤에만 심는다 — 자기 브라우저에서 직접 만든 쿠키까지 막지는 못하므로 모양은 읽을 때 다시 본다.
// 만료는 10분 — 완료 화면은 10분이 지나면 쿠키가 없어 로그인으로 보낸다(done/page.tsx).
export const SIGNUP_DONE_COOKIE = "signup_done";
export const SIGNUP_DONE_MAX_AGE = 600;
// 쿠키 경로 · 가입 뒤 이동 · 라우트가 모두 이 값이다 — 어긋나면 브라우저가 쿠키를 보내지 않아 완료 화면이 조용히 빈다.
export const SIGNUP_DONE_PATH = "/signup/done";

export type SignupDoneValue = { tradeName: string; loginId: string; email: string };

export function isSignupDoneValue(v: unknown): v is SignupDoneValue {
  const o = v as Partial<Record<keyof SignupDoneValue, unknown>> | null;
  return typeof o === "object" && o !== null && !Array.isArray(o)
    && typeof o.tradeName === "string" && typeof o.loginId === "string" && typeof o.email === "string";
}

// 손상됐거나 모양이 틀린 쿠키는 없는 것으로 취급한다(session.ts 의 parseSession 처럼). 모양을 보지 않으면
// 객체 같은 값이 화면에 그대로 그려지다 완료 화면이 500 이 된다.
export function parseSignupDone(raw: string | undefined): SignupDoneValue | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return isSignupDoneValue(v) ? v : null;
  } catch {
    return null;
  }
}
