"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, getSession, LOGIN_KEY_COOKIE, request, SESSION_COOKIE } from "@/lib/api";

/** 이 브라우저의 접속만 끝낸다. api 가 실패해도 쿠키는 지운다 — 나가려는 사람을 붙잡지 않는다. */
export async function logout(): Promise<void> {
  const session = await getSession();
  if (session)
    await request("/auth/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }).catch(() => undefined);
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(LOGIN_KEY_COOKIE);
  redirect("/login");
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
  if (!session) return { status: 401, message: "로그인이 필요합니다" };
  try {
    await request("/auth/admin/password-change", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return { status: 204 };
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, message: e.message };
    console.error(e);
    return { status: 0, message: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
  }
}
