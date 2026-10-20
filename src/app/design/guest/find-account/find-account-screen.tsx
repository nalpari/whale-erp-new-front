import type { ReactNode } from "react";
import { GuestPage, GuestVisual, TRIM } from "../guest-ui";

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
        <GuestVisual
          eyebrow="Account help"
          title={<p className={`text-[42px] leading-normal font-extrabold tracking-[-0.025em] text-[rgba(58,86,112,0.6)] ${TRIM}`}>계정을 찾아 드릴게요</p>}
        >
          {lead}
        </GuestVisual>
        <div className="flex flex-col gap-[27px] px-[200px] py-[80px] text-guest-ink">{children}</div>
      </section>
    </GuestPage>
  );
}
