import type { Metadata } from "next";
import { GuestPage } from "../guest-ui";
import { SignUpForm } from "./sign-up-form";
import { PrivacyTerms, ServiceTerms } from "./terms";

export const metadata: Metadata = { title: "Whale ERP · 회원가입" };

// 사업자(BP 마스터) 회원가입. 항목은 기획 시안(Claude 아티팩트 「Whale ERP 회원가입」)을, 입력칸·버튼 규격은
// Figma 로그인전(8QSOuwFFBfCbFWR6RBUlps) 비로그인 폼을 따른다.
export default function SignUpPage() {
  return (
    <GuestPage>
      <section className="mx-auto flex w-[800px] flex-col gap-[40px] pt-[80px] text-guest-ink">
        <div className="flex flex-col gap-[8px]">
          <h1 className="text-[28px] leading-[1.2] font-bold">회원가입</h1>
          <p className="text-[16px] leading-[1.5]">사업자 계정을 만들고 매장 관리를 시작하세요.</p>
        </div>
        <SignUpForm terms={{ service: <ServiceTerms />, privacy: <PrivacyTerms /> }} />
      </section>
    </GuestPage>
  );
}
