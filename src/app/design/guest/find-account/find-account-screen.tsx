import type { ReactNode } from "react";
import { GuestPage, GuestVisual } from "../guest-ui";

// 제목 줄. 안내 문구가 고른 탭에 따라 달라 폼(클라이언트)이 그린다.
export function FindAccountHeading({ lead }: { lead: string }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <h1 className="text-[28px] leading-[1.2] font-bold">아이디/비밀번호 찾기</h1>
      <p className="text-[16px] leading-[1.5]">{lead}</p>
    </div>
  );
}

// Figma 「아이디/비밀번호 찾기」(8QSOuwFFBfCbFWR6RBUlps · 1:1811). 로그인 화면과 같은 틀에 오른쪽 폼만 다르다.
// 실제 찾기((site)/find)와 디자인 샘플이 이 틀을 함께 쓰고, 폼과 그림 아래 문구만 각자 넣는다 — 둘 다 시안의 휴대폰 인증 대신
// 정책대로 이름 · 이메일(비밀번호는 아이디까지)이고, 샘플은 요청을 보내지 않는다(okf/auth.md 계정 찾기).
export function GuestFindAccount({ lead, children }: { lead: ReactNode; children: ReactNode }) {
  return (
    <GuestPage flush>
      <section className="grid grid-cols-2">
        {/* 시안은 Pretendard Black(900)이지만 저장소에 담은 가장 굵은 굵기가 800 이다. */}
        {/* 위 영문 「Account help」는 뺐다. 제목은 로그인 화면 제목처럼 두 줄(「기억나지 않아도 괜찮아요, / 계정을 찾아 드릴게요」)에 같은 크기 · 그라데이션(44px 800, 윗줄 70%→35% · 아랫줄 80%→36%)으로 맞춘다 — 전엔 42px 단색이라 두 화면을 오가면 달라 보였다(2026-11-12 사용자 지정). */}
        <GuestVisual
          title={
            <p className="flex flex-col gap-[4px] font-extrabold text-transparent normal-case">
              <span className="-ml-[0.03em] w-max bg-gradient-to-r from-[rgba(58,86,112,0.7)] to-[rgba(58,86,112,0.35)] bg-clip-text text-[44px] leading-[1.3] tracking-[-0.025em] whitespace-nowrap">기억나지 않아도 괜찮아요,</span>
              <span className="-ml-[0.05em] w-max bg-gradient-to-r from-[rgba(58,86,112,0.8)] to-[rgba(58,86,112,0.36)] bg-clip-text text-[44px] leading-[1.3] tracking-[-0.025em] whitespace-nowrap">계정을 찾아 드릴게요</span>
            </p>
          }
        >
          {lead}
        </GuestVisual>
        <div style={{ viewTransitionName: "guest-form" }} className="flex flex-col gap-[27px] px-[clamp(60px,10vw,200px)] py-[80px] text-guest-ink">{children}</div>
      </section>
    </GuestPage>
  );
}
