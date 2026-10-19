import type { Metadata } from "next";
import { SAMPLE_ROUTES } from "../guest-routes";
import { LoginForm } from "./login-form";
import { GuestLogin } from "./login-screen";

export const metadata: Metadata = { title: "Whale ERP · 로그인" };

export default function LoginPage() {
  return (
    <GuestLogin routes={SAMPLE_ROUTES}>
      <LoginForm />
    </GuestLogin>
  );
}
