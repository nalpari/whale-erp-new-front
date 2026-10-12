import Image from "next/image";
import type { ReactNode } from "react";
import { LoginPendingLink } from "./login-pending";

// 로그인 전 화면(회원가입·로그인 등) 공통 틀 — 가운데 카드 하나. docs/demo/src/public.mjs 의 authPage 와 같다.
// ERP 관리자 화면 공통 컴포넌트(src/components/common)에는 이 레이아웃이 없어 auth 전용으로 따로 둔다.
// 로고는 로그인 화면으로 가야 하지만 그 화면이 아직 없어 개발 예정 얼럿을 띄운다(login-pending.tsx).
function Brand() {
  return (
    <LoginPendingLink className="flex items-center gap-[10px] text-left">
      <Image src="/icons/logo-whale.svg" alt="" width={53} height={40} />
      <p className="leading-[1.3] text-[#252525]">
        <span className="block text-[16px] font-extrabold uppercase">Whale ERP</span>
        <span className="block text-[12px]">Management System</span>
      </p>
    </LoginPendingLink>
  );
}

export function AuthCard({ children, width = "w-[420px]" }: { children: ReactNode; width?: `w-[${number}px]` }) {
  return (
    <div className="h-[100dvh] overflow-y-auto bg-erp-thead-bg">
      <div className="flex min-h-full flex-col items-center justify-center gap-[24px] p-[24px]">
        <Brand />
        <main className={`flex ${width} flex-col gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]`}>{children}</main>
      </div>
    </div>
  );
}

export function CardTitle({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h1 className="text-[18px] font-semibold">{title}</h1>
    </div>
  );
}
