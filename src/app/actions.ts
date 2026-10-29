"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, getSession, LOGIN_KEY_COOKIE, request, SESSION_COOKIE } from "@/lib/api";
import { apiHeaders } from "@/lib/forwarded-headers";

/** 이 브라우저의 접속만 끝낸다. api 가 실패해도 쿠키는 지운다 — 나가려는 사람을 붙잡지 않는다. */
async function endSession(): Promise<void> {
  const session = await getSession();
  if (session)
    await request("/auth/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).catch((e: unknown) => console.warn("로그아웃 api 실패 — api 세션은 갱신 토큰 만료(최대 1시간)까지 남는다", e));
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(LOGIN_KEY_COOKIE);
}

/** 로그아웃 — 스스로 나가든 세션이 끝나 밀려나든 로그인 화면으로 간다(2026-10-29 재영). */
export async function logout(): Promise<void> {
  await endSession();
  redirect("/login");
}

/** 회원 탈퇴를 마친 뒤의 로그아웃 — 로그인 전 홈으로 간다(S-JHQQNR, 2026-10-29 재영). */
export async function logoutAfterWithdrawal(): Promise<void> {
  await endSession();
  redirect("/");
}

/**
 * 강제 비밀번호 변경(POST /auth/admin/password-change). 약관 동의가 붙은 계정이면 isTermsAgreed 를 함께 보내 한 번에 저장한다.
 * 상태 코드와 api 문구를 그대로 돌려준다 — 400 정책 위반·약관, 401 발급 비밀번호 만료, 409 변경 대상 아님. 성공은 204.
 */
export async function changeForcedPassword(input: {
  newPassword: string;
  newPasswordConfirm: string;
  isTermsAgreed?: boolean;
}): Promise<{ status: number; message?: string }> {
  const session = await getSession();
  if (!session) return { status: 401, message: "로그인이 필요합니다." };
  try {
    await request("/auth/admin/password-change", {
      method: "POST",
      // 사용자 IP 를 넘긴다 — api 가 약관 동의 이력에 접속 IP 를 남긴다. 이유와 전제는 apiHeaders() 참고.
      headers: { Authorization: `Bearer ${session.accessToken}`, ...(await apiHeaders()) },
      body: JSON.stringify(input),
    });
    return { status: 204 };
  } catch (e) {
    // 로그인 액션과 같은 규칙 — 4xx 는 api 문구, 스로틀러 429 와 5xx 는 영어 기본 문구라 한글로 바꾼다.
    if (e instanceof ApiError && e.status === 429 && e.message.startsWith("ThrottlerException"))
      return { status: 429, message: "요청이 많습니다. 잠시 뒤 다시 시도해 주세요." };
    if (e instanceof ApiError && e.status < 500) return { status: e.status, message: e.message };
    console.error(e);
    return { status: 0, message: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }
}
