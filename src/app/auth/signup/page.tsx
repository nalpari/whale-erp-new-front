import type { Metadata } from "next";
import { ErpRoot } from "@/components/common";
import { AuthCard, CardTitle } from "../_components/auth-card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "회원가입 · Whale ERP",
};

// 회원가입. 디자인 기준은 docs/demo/src/pages/auth/signup.mjs(1팀 Figma 반영 완료본).
// 4단계 모두 끝: 기본정보(검사 포함) + 사업자정보 인증(선택, 자리표시자) + 약관동의 + 제출.
// 제출은 whale-erp-api squirtle 브랜치의 /auth/signup 을 실제로 부른다 — api·front 모두 아직
// main 에 안 들어가서, 서로 다른 환경에선 안 될 수 있다(src/app/auth/signup/actions.ts 참고).
export default function SignupPage() {
  return (
    <ErpRoot>
      <AuthCard width="w-[860px]">
        <CardTitle title="회원가입" />
        <SignupForm />
      </AuthCard>
    </ErpRoot>
  );
}
