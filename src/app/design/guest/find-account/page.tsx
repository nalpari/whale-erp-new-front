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
          가입 시 등록한 정보를 입력하시면
          <br />
          아이디를 확인하거나 임시 비밀번호를 발급받을 수 있습니다.
        </>
      }
    >
      <FindAccountForm />
    </GuestFindAccount>
  );
}
