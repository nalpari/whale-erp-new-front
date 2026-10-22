import type { Metadata } from "next";
import { connection } from "next/server";
import { InquiryForm, InquiryScreen } from "@/app/design/guest/inquiry/inquiry-form";
import { GuestPage } from "@/app/design/guest/guest-ui";
import { GuestNote } from "@/app/design/guest/notices/notice-views";
import { getEnum, request } from "@/lib/api";
import type { Codes } from "@/lib/session";
import { RetryButton } from "../notices/retry-button";
import { submitLead } from "./actions";

export const metadata: Metadata = { title: "도입문의 · Whale ERP" };

// 비로그인 도입문의(#297 · #298, S-SDMDKC). 디자인 샘플(design/guest/inquiry)과 같은 폼이고, 선택지는 api 에서 받아 접수를 보낸다.
// 선택지를 못 받으면 고를 수 없어 폼 대신 다시 시도를 둔다 — 원인은 서버 로그에 남긴다.
export default async function LeadsPage() {
  // 요청마다 그린다 — 빌드 때 api 가 없어 다시 시도 화면이 정적 페이지로 굳지 않게(terms 와 같다).
  await connection();
  const options = await Promise.all([
    request<{ codes: Codes }>("/public-code-items?groups=INDUSTRY,PLAN_PERIOD"),
    getEnum("LeadInterest"),
  ])
    .then(([{ codes }, interests]) => ({ industries: codes.INDUSTRY ?? [], periods: codes.PLAN_PERIOD ?? [], interests }))
    .catch((error: unknown) => {
      console.error("비로그인 도입문의 선택지 조회 실패", error);
      return null;
    });

  return (
    <GuestPage>
      <InquiryScreen>
        {options && options.industries.length > 0 && options.interests.length > 0 ? (
          <InquiryForm options={options} submit={submitLead} />
        ) : (
          <GuestNote action={<RetryButton />}>도입문의 화면을 불러오지 못했습니다.</GuestNote>
        )}
      </InquiryScreen>
    </GuestPage>
  );
}
