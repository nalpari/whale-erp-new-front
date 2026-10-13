import type { Metadata } from "next";
import { GuestButton, GuestPage, GuestVisual, TRIM } from "../guest-ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Whale ERP · 로그인" };

// Figma 「로그인전_로그인」(8QSOuwFFBfCbFWR6RBUlps · 1:1615). 왼쪽은 고래 그림, 오른쪽은 관리자 로그인이다.
// 푸터가 본문에 바로 붙는 화면이라 GuestPage 에 flush 를 준다.
export default function LoginPage() {
  return (
    <GuestPage flush>
      <section className="grid grid-cols-2">
        <GuestVisual
          eyebrow="Partner office"
          title={
            <p className={`font-[family-name:var(--font-rem)] leading-[0.86] font-black tracking-[-0.038em] text-[rgba(58,86,112,0.6)] ${TRIM}`}>
              <span className="block text-[42px]">Welcome back to</span>
              <span className="block text-[84px]">Whale ERP</span>
            </p>
          }
        >
          오늘도 매장을 가볍게. 사업자·가맹점·플랫폼 관리자 모두 여기서 시작합니다.
          <br />
          권한에 맞는 메뉴가 자동으로 열립니다.
        </GuestVisual>
        <div className="flex flex-col gap-[27px] px-[200px] py-[80px] text-guest-ink">
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-[28px] leading-[1.2] font-bold">로그인</h1>
            <p className="text-[16px] leading-[1.5]">관리자 계정으로 로그인 하세요.</p>
          </div>
          <div className="flex flex-col gap-[24px]">
            <LoginForm />
            {/* 회원가입 줄과 직원 안내는 시안에서 간격 없이 붙어 있다. */}
            <div>
              <div className="flex items-center justify-between border-t border-[#ebebeb] py-[24.5px] text-[#111]">
                <div className="flex flex-col gap-[4px] leading-[1.4]">
                  <p className="text-[20px] font-semibold">처음 오셨나요?</p>
                  <p className="text-[16px]">아직 계정이 없으신가요?</p>
                </div>
                <GuestButton tone="line" href="/design/guest/sign-up" arrow>
                  사업자 회원가입
                </GuestButton>
              </div>
              <p className="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy">
                직원이신가요?
                <br />
                출퇴근·급여명세서는 <strong className="font-semibold">직원 전용 앱</strong>에서 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </GuestPage>
  );
}
