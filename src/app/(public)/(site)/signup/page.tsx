import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "회원가입 · Whale ERP",
};

// 회원가입. 위 메뉴·아래 푸터는 로그인 전 화면 틀((site)/layout.tsx)이 그린다 — 로그인 화면과 같은 틀이다.
// 모양은 1팀 비로그인 폼 규격을 쓴다 — docs/demo/src/pages/auth/signup.mjs 가 design/guest/sign-up
// (기획 시안 + Figma 폼 규격)을 기준으로 삼기로 하면서 맞췄다(2026-10-14). 제목·부제·폭(800px·pt-80)도 그대로다.
// 기본정보(검사 포함) · 사업자정보 인증(선택, api 국세청 진위확인 — biz-auth-section.tsx) · 약관동의 · 제출.
// 제출은 whale-erp-api 의 /auth/signup 을 실제로 부른다(api PR #37, bulbasaur 브랜치 — actions.ts 참고).
export default function SignupPage() {
  return (
    <section className="mx-auto flex w-[800px] flex-col gap-[40px] px-[24px] pt-[80px] pb-[48px] text-guest-ink">
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[28px] leading-[1.2] font-bold">회원가입</h1>
        <p className="text-[16px] leading-[1.5]">사업자 계정을 만들고 매장 관리를 시작하세요.</p>
      </div>
      <SignupForm />
    </section>
  );
}
