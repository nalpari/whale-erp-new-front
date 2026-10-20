import type { Metadata } from "next";
import { FindAccountForm } from "./find-account-form";
import { GuestFindAccount } from "./find-account-screen";

export const metadata: Metadata = { title: "Whale ERP · 아이디/비밀번호 찾기" };

// Figma 「아이디/비밀번호 찾기」(8QSOuwFFBfCbFWR6RBUlps · 1:1811). 틀은 find-account-screen.tsx 를 실제 찾기 화면과 함께 쓴다.
export default function FindAccountPage() {
  return (
    <GuestFindAccount
      lead={
        <>
          가입할 때 인증한 휴대폰번호로 아이디를 확인하고,
          <br />
          비밀번호를 새로 설정할 수 있습니다.
        </>
      }
    >
      <FindAccountForm />
    </GuestFindAccount>
  );
}
