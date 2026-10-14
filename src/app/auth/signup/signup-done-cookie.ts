// 가입 완료 화면(/auth/signup-done)에 보일 상호명·아이디·이메일을 이 쿠키로 건넨다. URL 쿼리로 보내면
// 서버 접근 로그·브라우저 기록에 남고, 아무 값이나 지어 넣은 주소도 진짜 완료 화면처럼 보일 수 있었다
// (2026-10-14 ip-code-review-claude 블로커#2). httpOnly 라 공격자가 document.cookie 로 흉내 낼 수 없다 —
// signup/actions.ts 의 createSignup 이 api 로부터 실제 가입 응답을 받은 뒤에만 심는다.
// 만료는 10분 — signup-done 화면의 "이 화면은 10분 동안만 열립니다." 문구를 이제 이 값이 실제로 지킨다.
export const SIGNUP_DONE_COOKIE = "signup_done";
export const SIGNUP_DONE_MAX_AGE = 600;

export type SignupDoneValue = { tradeName: string; loginId: string; email: string };

export function parseSignupDone(raw: string | undefined): SignupDoneValue | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SignupDoneValue;
  } catch {
    return null; // 손상된 쿠키는 없는 것으로 취급한다(api.ts 의 getSession 과 같다).
  }
}
