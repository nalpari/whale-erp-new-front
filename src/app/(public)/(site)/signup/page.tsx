import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "회원가입 · Whale ERP",
};

// 회원가입. 위 메뉴·아래 푸터는 로그인 전 화면 틀((site)/layout.tsx)이 그린다 — 로그인 화면과 같은 틀이다.
// 4단계 모두 끝: 기본정보(검사 포함) + 사업자정보 인증(선택, 자리표시자) + 약관동의 + 제출.
// 제출은 whale-erp-api 의 /auth/signup 을 실제로 부른다(api PR #37, bulbasaur 브랜치 — actions.ts 참고).
// 제목은 폼 밖 위쪽 22px, 본문 폭 860px(2026-10-13 피드백).
export default function SignupPage() {
  return (
    <div className="mx-auto flex w-[860px] flex-col gap-[24px] px-[24px] py-[48px]">
      <h1 className="text-[22px] font-semibold">회원가입</h1>
      <SignupForm />
    </div>
  );
}
