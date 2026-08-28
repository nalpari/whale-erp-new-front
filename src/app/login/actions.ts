"use server";

import { redirect } from "next/navigation";
import { ApiError, login, logout } from "@/lib/api";

export interface LoginState {
  error: string;
  /** React 19 는 액션이 끝나면 폼을 리셋한다. 다시 채워 넣으려고 돌려준다. */
  email: string;
}

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await login(email, password);
  } catch (error) {
    // 계정이 없거나 비밀번호가 틀리면 API 가 401 과 한글 메세지를 준다.
    if (error instanceof ApiError) return { error: error.message, email };
    // API 가 떠 있지 않으면 fetch 가 TypeError 를 던진다. 그 밖의 예외(환경 변수
    // 누락 같은 설정 문제)는 화면에 감추지 않고 그대로 올린다.
    if (error instanceof TypeError)
      return { error: "API 서버에 연결하지 못했습니다", email };
    throw error;
  }

  // redirect 는 내부적으로 예외를 던진다. try 안에서 부르면 위 catch 가 삼킨다.
  redirect("/items");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}
