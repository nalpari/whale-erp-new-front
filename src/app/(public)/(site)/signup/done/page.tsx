import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/common";
import { parseSignupDone, SIGNUP_DONE_COOKIE } from "../signup-done-cookie";

export const metadata: Metadata = {
  title: "가입 완료 · Whale ERP",
};

// 회원가입 완료(/signup/done). 위 메뉴·아래 푸터는 로그인 전 화면 틀((site)/layout.tsx)이 그린다.
// 로그인 세션이 아직 없어 상호명·아이디·이메일은 가입 성공 직후 httpOnly 쿠키로 들고 온다
// (signup-done-cookie.ts, actions.ts 참고) — URL 쿼리로 넘기던 이전 방식은 서버 로그·브라우저
// 기록에 남고, 아무 값이나 지어 넣은 주소도 진짜 완료 화면처럼 보일 수 있었다(2026-10-14 ip-code-review-claude
// 블로커#2). 쿠키가 없으면(가입하지 않고 이 주소에 바로 들어온 경우) 상호명·아이디·이메일을 보이지 않는다.
// 가입 안내 메일은 api 가 보낸다(EMAIL_SIGNUP_DONE — 메일 설정이 없는 환경에선 건너뛴다).
// 「웨일ERP 시작하기」와 「로그인 화면」은 로그인(/login)으로 간다. 관리자 웹 로그인은 아이디의 대소문자를 구분하므로,
// 여기 보이는 아이디(api 가 소문자로 정규화한 값) 그대로 들어와야 한다.
export default async function SignupDonePage() {
  const raw = (await cookies()).get(SIGNUP_DONE_COOKIE)?.value;
  const value = parseSignupDone(raw);
  const { tradeName, loginId, email } = value ?? {};

  return (
    <div className="mx-auto flex w-[420px] flex-col gap-[24px] py-[96px]">
      <div className="flex flex-col items-center gap-[10px] text-center">
        <h1 className="text-[22px] font-semibold">회원가입이 완료되었습니다</h1>
        {tradeName || loginId ? (
          <p className="text-[14px]">
            {tradeName}
            {tradeName && loginId ? " · " : ""}
            {loginId ? `아이디 ${loginId}` : ""}
          </p>
        ) : null}
        {email ? (
          <p className="text-[13px] text-erp-label">
            가입 안내 메일을 <b className="font-semibold text-erp-ink">{email}</b> 로 보냈습니다.
          </p>
        ) : null}
      </div>
      <div className="grid">
        <Button href="/login">웨일ERP 시작하기</Button>
      </div>
      <p className="text-center text-[13px] leading-[1.6] text-erp-label">
        이 화면은 10분 동안만 열립니다.
        <br />
        시간이 지나면{" "}
        <Link href="/login" className="text-erp-link hover:underline">
          로그인 화면
        </Link>
        에서 가입한 아이디로 들어오세요.
      </p>
    </div>
  );
}
