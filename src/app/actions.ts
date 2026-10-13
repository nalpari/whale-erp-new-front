"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, LOGIN_KEY_COOKIE, request, SESSION_COOKIE } from "@/lib/api";

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
