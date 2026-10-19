import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GuestButton, GuestPage, GuestVisual, TRIM } from "@/app/design/guest/guest-ui";
import { HOVER } from "@/app/design/guest/theme";
import { parseSignupDone, remainingSignupDoneSeconds, SIGNUP_DONE_COOKIE } from "../signup-done-cookie";
import { Countdown } from "./countdown";

export const metadata: Metadata = {
  title: "가입 완료 · Whale ERP",
};

// 회원가입 완료(/signup/done). 위 메뉴·아래 푸터는 로그인 전 화면 틀((site)/layout.tsx)이 그린다.
// 로그인 세션이 아직 없어 상호명·아이디·이메일은 가입 성공 직후 httpOnly 쿠키로 들고 온다
// (signup-done-cookie.ts, actions.ts 참고) — URL 쿼리로 넘기던 이전 방식은 서버 로그·브라우저
// 기록에 남고, 아무 값이나 지어 넣은 주소도 진짜 완료 화면처럼 보일 수 있었다(2026-10-14 ip-code-review-claude
// 블로커#2). 쿠키가 없으면(가입하지 않고 바로 들어왔거나 10분이 지났거나 값이 깨진 경우) 로그인 화면으로 보낸다 —
// 명세 S-UUBGOD(「토큰이 만료됐으면 로그인 화면으로 보낸다」). 가입하지 않은 사람에게 「가입을 환영합니다」를 보이지 않는다.
// 가입 안내 메일은 api 가 보낸다(EMAIL_SIGNUP_DONE — 메일 설정이 없는 환경에선 건너뛴다).
// 「웨일ERP 시작하기」와 「로그인 화면」은 로그인(/login)으로 간다. 관리자 웹 로그인은 아이디의 대소문자를 구분하므로,
// 여기 보이는 아이디(api 가 소문자로 정규화한 값) 그대로 들어와야 한다.
// 모양은 docs/demo/src/pages/auth/signup-done.mjs(design/guest/sign-up/complete 를 옮긴 것)와 같다(2026-10-15).
export default async function SignupDonePage() {
  const raw = (await cookies()).get(SIGNUP_DONE_COOKIE)?.value;
  const value = parseSignupDone(raw);
  if (!value) redirect("/login");
  const { tradeName, loginId, email, issuedAt } = value;
  const remainingSeconds = remainingSignupDoneSeconds(issuedAt);

  return (
    <GuestPage flush>
      {/* 1720px 최소폭은 로그인 전 틀((site)/layout.tsx)이 건다 — 두 칸 틀 오른쪽 px-[200px] 고정 여백이 좁은 화면에서 찌그러지지 않는다(2026-10-19). */}
      <section className="grid min-h-[730px] grid-cols-2">
        <GuestVisual
          eyebrow="Business membership"
          title={<p className={`text-[42px] leading-normal font-extrabold tracking-[-0.025em] text-[rgba(58,86,112,0.6)] ${TRIM}`}>내 매장의 첫 페이지를 열어보세요</p>}
        >
          가입하고 오늘부터 바로 매장 관리를 시작하세요.
        </GuestVisual>
        <div className="flex items-center justify-center px-[200px] py-[80px] text-guest-ink">
          <div className="flex w-full flex-col items-center gap-[32px] text-center">
            <div className="flex flex-col items-center gap-[12px]">
              <h1 className="text-[28px] leading-[1.2] font-bold">가입을 환영합니다</h1>
              <p className="text-[18px] leading-[1.5] font-medium">
                {tradeName} · 아이디 {loginId}
              </p>
              <p className="text-[16px] leading-[1.5] text-[#767676]">
                가입 안내 메일을 <strong className="font-semibold text-guest-ink">{email}</strong>로 보냈습니다.
              </p>
            </div>
            <div className="grid w-[280px]">
              <GuestButton tone="navy" href="/login" arrow tall>
                웨일ERP 시작하기
              </GuestButton>
            </div>
            <p className="w-full rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy">
              이 화면은 <Countdown initialSeconds={remainingSeconds} /> 뒤에 닫힙니다.
              <br />
              시간이 지나면{" "}
              <Link href="/login" className={`font-semibold underline underline-offset-[3px] hover:text-guest-ink ${HOVER}`}>
                로그인 화면
              </Link>
              에서 가입한 아이디로 들어오세요.
            </p>
          </div>
        </div>
      </section>
    </GuestPage>
  );
}
