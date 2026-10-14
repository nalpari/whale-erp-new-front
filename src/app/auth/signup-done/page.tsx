import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Button } from "@/components/common";
import { LoginPendingLink } from "../_components/login-pending";
import { SitePage } from "../_components/site-page";
import { parseSignupDone, SIGNUP_DONE_COOKIE } from "../signup/signup-done-cookie";

export const metadata: Metadata = {
  title: "가입 완료 · Whale ERP",
};

// 회원가입 완료. 디자인 기준은 docs/demo/src/pages/auth/signup-done.mjs.
// 로그인 세션이 아직 없어 상호명·아이디·이메일은 가입 성공 직후 httpOnly 쿠키로 들고 온다
// (signup-done-cookie.ts, signup/actions.ts 참고) — URL 쿼리로 넘기던 이전 방식은 서버 로그·브라우저
// 기록에 남고, 아무 값이나 지어 넣은 주소도 진짜 완료 화면처럼 보일 수 있었다(2026-10-14 ip-code-review-claude
// 블로커#2). 쿠키가 없으면(가입하지 않고 이 주소에 바로 들어온 경우) 상호명·아이디·이메일을 보이지 않는다.
// 가입 안내 메일은 api bulbasaur 브랜치가 실제로 보낸다(EMAIL_SIGNUP_DONE, admin-signup.service.ts) — 둘 다 아직
// main 에 안 들어가서, 서로 다른 환경에선 안 보일 수 있다(2026-10-12 확인).
// 실제 홈 화면이 아직 없어 "웨일ERP 시작하기"는 회원가입으로 보낸다 — 디자인 샘플(/design/guest)로
// 보내면 거기서 돌아올 길이 없어 막다른 길이 된다(2026-10-14 피드백). 로그인 화면도 아직 없고,
// 로그인 디자인 샘플(/design/guest/login)도 같은 이유로 보내지 않는다 — 개발 예정 안내창을 띄운다.
// 로그인 세션이 생기면 쿠키 대신 서버 쪽 값으로 바꾼다.
export default async function SignupDonePage() {
  const raw = (await cookies()).get(SIGNUP_DONE_COOKIE)?.value;
  const value = parseSignupDone(raw);
  const { tradeName, loginId, email } = value ?? {};

  return (
    <SitePage>
      {/* 회원가입과 같은 틀(2026-10-13 피드백). 가운데 카드는 쓰지 않는다. */}
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
          <Button href="/auth/signup">웨일ERP 시작하기</Button>
        </div>
        <p className="text-center text-[13px] leading-[1.6] text-erp-label">
          이 화면은 10분 동안만 열립니다.
          <br />
          시간이 지나면{" "}
          <LoginPendingLink className="text-erp-link hover:underline">로그인 화면</LoginPendingLink>
          에서 가입한 아이디로 들어오세요.
        </p>
      </div>
    </SitePage>
  );
}
