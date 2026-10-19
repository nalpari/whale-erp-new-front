import type { Metadata } from "next";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";
import { GuestLogin } from "@/app/design/guest/login/login-screen";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · Whale ERP" };

// 로그인. 틀(왼쪽 고래 그림 · 회원가입 줄 · 직원 안내)은 Figma 「로그인전_로그인」 샘플과 같은 구현이고, 폼만 실제 로그인이다(2026-10-19).
// 약관 줄(개인정보처리방침 굵게, okf/auth.md)은 본문 바로 아래 붙는 비로그인 푸터(guest-footer.tsx)가 맡는다.
export default function LoginPage() {
  return (
    <GuestLogin routes={SITE_ROUTES}>
      <LoginForm />
    </GuestLogin>
  );
}
