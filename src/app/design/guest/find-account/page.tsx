import type { Metadata } from "next";
import { GuestPage, GuestVisual, TRIM } from "../guest-ui";
import { FindAccountForm } from "./find-account-form";

export const metadata: Metadata = { title: "Whale ERP · 아이디/비밀번호 찾기" };

// Figma 「아이디/비밀번호 찾기」(8QSOuwFFBfCbFWR6RBUlps · 1:1811). 로그인 화면과 같은 틀에 오른쪽 폼만 다르다.
export default function FindAccountPage() {
  return (
    <GuestPage flush>
      <section className="grid grid-cols-2">
        {/* 시안은 Pretendard Black(900)이지만 저장소에 담은 가장 굵은 굵기가 800 이다. */}
        <GuestVisual
          eyebrow="Account help"
          title={<p className={`text-[42px] leading-normal font-extrabold tracking-[-0.025em] text-[rgba(58,86,112,0.6)] ${TRIM}`}>계정을 찾아 드릴게요</p>}
        >
          가입할 때 인증한 휴대폰번호로 아이디를 확인하고,
          <br />
          비밀번호를 새로 설정할 수 있습니다.
        </GuestVisual>
        <div className="flex flex-col gap-[27px] px-[200px] py-[80px] text-guest-ink">
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-[28px] leading-[1.2] font-bold">아이디/비밀번호 찾기</h1>
            <p className="text-[16px] leading-[1.5]">관리자 계정으로 로그인 하세요.</p>
          </div>
          <FindAccountForm />
        </div>
      </section>
    </GuestPage>
  );
}
