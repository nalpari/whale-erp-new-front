import type { Metadata } from "next";
import { GuestFindAccount } from "@/app/design/guest/find-account/find-account-screen";
import { FindForm } from "./find-form";

export const metadata: Metadata = { title: "아이디/비밀번호찾기" };

// 아이디·비밀번호 찾기(데모 auth/find.html · S-PHOPWY · S-EOMSRG). 틀(왼쪽 고래 그림)은 Figma 샘플과 같은 구현이고,
// 폼과 그림 아래 문구만 정책(이름·이메일, 임시 비밀번호 메일)에 맞춘다.
export default function FindPage() {
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
      <FindForm />
    </GuestFindAccount>
  );
}
