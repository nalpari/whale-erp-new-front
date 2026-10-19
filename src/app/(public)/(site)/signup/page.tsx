import type { Metadata } from "next";
import { getSession } from "@/lib/api";
import { homeOf } from "@/lib/auth-routes";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "회원가입 · Whale ERP",
};

// 회원가입. 위 메뉴·아래 푸터는 로그인 전 화면 틀((site)/layout.tsx)이 그린다 — 로그인 화면과 같은 틀이다.
// 모양은 1팀 비로그인 폼 규격을 쓴다 — docs/demo/src/pages/auth/signup.mjs 가 design/guest/sign-up
// (기획 시안 + Figma 폼 규격)을 기준으로 삼기로 하면서 맞췄다(2026-10-14). 제목·부제·폭(800px·pt-80)도 그대로다.
// 기본정보(검사 포함) · 사업자정보 인증(선택, api 국세청 진위확인 — biz-auth-section.tsx) · 약관동의 · 제출.
// 제출은 whale-erp-api 의 /auth/signup 을 실제로 부른다(api PR #37, bulbasaur 브랜치 — actions.ts 참고).
export default async function SignupPage() {
  // 세션이 있는 채로도 이 화면을 그대로 연다(다른 계정으로 로그인해 둔 채 새로 가입하는 경우). 그때는
  // 아래 "이미 계정이 있나요? 로그인"도 guest-header.tsx 의 Login 과 같은 문제가 있다 — 눌러도 proxy.ts의
  // "로그인한 채 /login 에 오면 자기 홈"에 걸려 설명 없이 자기 홈으로 돌아간다(2026-10-16).
  const session = await getSession();
  const loggedInHomeHref = session ? homeOf(session.roleTypeCode) : undefined;
  return (
    <section className="mx-auto flex w-[800px] flex-col gap-[40px] px-[24px] pt-[80px] pb-[48px] text-guest-ink">
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[28px] leading-[1.2] font-bold">회원가입</h1>
        <p className="text-[16px] leading-[1.5]">사업자 계정을 만들고 매장 관리를 시작하세요.</p>
      </div>
      <SignupForm loggedInHomeHref={loggedInHomeHref} />
    </section>
  );
}
