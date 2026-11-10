import type { ReactNode } from "react";
import type { GuestRoutes } from "../guest-routes";
import { GuestButton, GuestPage, GuestVisual } from "../guest-ui";

// Figma 「로그인전_로그인」(8QSOuwFFBfCbFWR6RBUlps · 1:1615). 왼쪽은 고래 그림, 오른쪽은 관리자 로그인이다.
// 푸터가 본문에 바로 붙는 화면이라 GuestPage 에 flush 를 준다.
// 실제 로그인((site)/login)과 디자인 샘플이 이 틀을 함께 쓰고, 폼만 각자 넣는다 — 실제는 서버 액션을 부르고 샘플은 요청을 보내지 않는다.
export function GuestLogin({ routes, children }: { routes: GuestRoutes; children: ReactNode }) {
  return (
    <GuestPage flush>
      <section className="grid grid-cols-2">
        <GuestVisual
          title={
            // 영문 「Welcome back to Whale ERP」 대신 「작은 불편함을 줄이는 것부터, / 더 나은 매장 운영은 시작됩니다.」 두 줄(44px 같은 크기 — 문장이 길어 칸 폭에 맞췄다), 홈과 같은 왼쪽→오른쪽 옅어지는 그라데이션. 위 「Partner office」는 뺐다(2026-11-10 사용자 지정).
            <p className="flex flex-col gap-[4px] font-extrabold text-transparent normal-case">
              <span className="-ml-[0.03em] w-max bg-gradient-to-r from-[rgba(58,86,112,0.7)] to-[rgba(58,86,112,0.35)] bg-clip-text text-[44px] leading-[1.3] tracking-[-0.025em] whitespace-nowrap">작은 불편함을 줄이는 것부터,</span>
              <span className="-ml-[0.05em] w-max bg-gradient-to-r from-[rgba(58,86,112,0.8)] to-[rgba(58,86,112,0.36)] bg-clip-text text-[44px] leading-[1.3] tracking-[-0.025em] whitespace-nowrap">더 나은 매장 운영은 시작됩니다.</span>
            </p>
          }
        >
          사장님의 매일이 조금 더 편리해지도록,
          <br />
          WHALE ERP가 함께합니다.
        </GuestVisual>
        <div className="flex flex-col gap-[27px] px-[200px] py-[80px] text-guest-ink">
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-[28px] leading-[1.2] font-bold">로그인</h1>
            <p className="text-[16px] leading-[1.5]">관리자 계정으로 로그인 하세요.</p>
          </div>
          <div className="flex flex-col gap-[24px]">
            {children}
            {/* 회원가입 줄과 직원 안내는 시안에서 간격 없이 붙어 있다. */}
            <div>
              <div className="flex items-center justify-between border-t border-[#ebebeb] py-[24.5px] text-[#111]">
                <div className="flex flex-col gap-[4px] leading-[1.4]">
                  <p className="text-[20px] font-semibold">처음 오셨나요?</p>
                  <p className="text-[16px]">아직 계정이 없으신가요?</p>
                </div>
                <GuestButton tone="line" href={routes.signUp} arrow>
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
