import type { Metadata } from "next";
import { SitePage } from "../_components/site-page";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "회원가입 · Whale ERP",
};

// 회원가입. 디자인 기준은 docs/demo/src/pages/auth/signup.mjs(1팀 Figma 반영 완료본).
// 4단계 모두 끝: 기본정보(검사 포함) + 사업자정보 인증(선택, 자리표시자) + 약관동의 + 제출.
// 제출은 whale-erp-api bulbasaur 브랜치의 /auth/signup 을 실제로 부른다 — api·front 모두 아직
// main 에 안 들어가서, 서로 다른 환경에선 안 될 수 있다(src/app/auth/signup/actions.ts 참고).
// 도입문의와 같은 틀(2026-10-13 피드백) — 위에 GNB, 제목은 폼 밖 위쪽 22px, 본문 폭 860px, 아래에 푸터.
export default function SignupPage() {
  return (
    <SitePage>
      <div className="mx-auto flex w-[860px] flex-col gap-[24px] px-[24px] py-[48px]">
        <h1 className="text-[22px] font-semibold">회원가입</h1>
        <SignupForm />
      </div>
    </SitePage>
  );
}
