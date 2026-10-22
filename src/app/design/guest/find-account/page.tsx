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
          가입할 때 등록한 이름과 이메일로 아이디를 확인하고,
          <br />
          임시 비밀번호를 메일로 받을 수 있습니다.
        </>
      }
    >
      <FindAccountForm />
    </GuestFindAccount>
  );
}
