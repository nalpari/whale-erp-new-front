import type { Metadata } from "next";
import { TermsLink } from "@/components/site/terms-link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · Whale ERP" };

// 로그인(데모 auth/login.html). 사이트형 틀 안에 흰 카드 하나. 카드 아래 약관 줄은 로그인 화면에만 있다 — 개인정보처리방침을 굵게(okf/auth.md 약관).
export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[24px] bg-erp-thead-bg p-[24px] py-[72px]">
      <div className="flex w-[420px] flex-col rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
        <LoginForm />
      </div>
      <footer className="flex flex-col items-center gap-[6px] text-[12px] text-erp-label">
        <nav aria-label="약관 및 정책" className="flex gap-[12px]">
          <TermsLink kind="use">이용약관</TermsLink>
          <TermsLink kind="policy">
            <b className="font-semibold text-erp-ink">개인정보처리방침</b>
          </TermsLink>
        </nav>
        <p>
          <b className="font-semibold">WHALE ERP</b> Copyright © Interplug Corp. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
