import type { Metadata } from "next";
import { FindForm } from "./find-form";

export const metadata: Metadata = { title: "아이디/비밀번호찾기" };

// 아이디·비밀번호 찾기(데모 auth/find.html · S-PHOPWY · S-EOMSRG). 로그인 화면과 같은 흰 카드 하나에 탭 두 개.
export default function FindPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-erp-thead-bg p-[24px] py-[72px]">
      <div className="flex w-[420px] flex-col rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
        <FindForm />
      </div>
    </div>
  );
}
