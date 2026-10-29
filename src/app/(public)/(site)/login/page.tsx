import type { Metadata } from "next";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";
import { GuestLogin } from "@/app/design/guest/login/login-screen";
import { RETURN_PARAM, returnPathOf } from "@/lib/auth-routes";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · Whale ERP" };

// 로그인. 틀(왼쪽 고래 그림 · 회원가입 줄 · 직원 안내)은 Figma 「로그인전_로그인」 샘플과 같은 구현이고, 폼만 실제 로그인이다(2026-10-19).
// 약관 줄(개인정보처리방침 굵게, okf/auth.md)은 본문 바로 아래 붙는 비로그인 푸터(guest-footer.tsx)가 맡는다.
// ?next= 는 로그인 없이 메일 링크(엑셀 내려받기)로 왔을 때 proxy 가 붙인다 — 받을 수 있는 주소만 폼에 싣는다(returnPathOf).
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const returnPath = returnPathOf((await searchParams)[RETURN_PARAM]);
  return (
    <GuestLogin routes={SITE_ROUTES}>
      <LoginForm returnPath={returnPath} />
    </GuestLogin>
  );
}
