import type { Metadata } from "next";
import { GuestPage } from "../guest-ui";
import { InquiryForm, InquiryScreen, type LeadOptions } from "./inquiry-form";

export const metadata: Metadata = { title: "Whale ERP · 도입문의" };

// 선택지 예시. 실제 화면은 같은 값을 api(공통코드 INDUSTRY · PLAN_PERIOD, enum LeadInterest)에서 받는다.
const OPTIONS: LeadOptions = {
  industries: [
    { value: "CAFE", label: "카페·음료" },
    { value: "RESTAURANT", label: "음식점" },
    { value: "BAKERY", label: "베이커리·디저트" },
    { value: "PUB", label: "주점" },
    { value: "ETC", label: "기타" },
  ],
  interests: [
    { value: "STORE_OPERATION", label: "매장운영" },
    { value: "FINANCE", label: "재무관리" },
    { value: "FRANCHISE", label: "프랜차이즈" },
    { value: "OTHER", label: "기타" },
  ],
  periods: [
    { value: "WITHIN_1M", label: "1개월 안" },
    { value: "WITHIN_3M", label: "3개월 안" },
    { value: "WITHIN_6M", label: "6개월 안" },
    { value: "UNDECIDED", label: "아직 정하지 않음" },
  ],
};

// 도입문의. Figma 시안이 없어 항목은 목업(docs/mockup/home/inquiry.html)을, 틀·입력칸 규격은 회원가입을 따른다.
// 실제 화면 /leads 와 같은 폼이고, 샘플이라 접수 요청은 보내지 않는다.
export default function InquiryPage() {
  return (
    <GuestPage>
      <InquiryScreen>
        <InquiryForm options={OPTIONS} />
      </InquiryScreen>
    </GuestPage>
  );
}
