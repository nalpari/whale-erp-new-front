import type { Metadata } from "next";
import { GuestPage } from "../guest-ui";
import { InquiryForm } from "./inquiry-form";

export const metadata: Metadata = { title: "Whale ERP · 도입문의" };

// 도입문의. Figma 시안이 없어 항목은 목업(docs/mockup/home/inquiry.html)을, 틀·입력칸 규격은 회원가입을 따른다.
export default function InquiryPage() {
  return (
    <GuestPage>
      <section className="mx-auto flex w-[800px] flex-col gap-[40px] pt-[80px] text-guest-ink">
        <div className="flex flex-col gap-[8px]">
          <h1 className="text-[28px] leading-[1.2] font-bold">도입문의</h1>
          <p className="text-[16px] leading-[1.5]">가입하지 않아도 남기실 수 있습니다. 담당자가 확인한 뒤 알려주신 전화번호나 이메일로 회신합니다.</p>
        </div>
        <InquiryForm />
      </section>
    </GuestPage>
  );
}
