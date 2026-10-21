import { getEnum } from "@/lib/api";
import { getMyInquiry } from "@/lib/community";
import { SUPPORT_INQUIRY_BASE } from "@/lib/community-view";
import { denied, Forbidden, idOf } from "@/components/community/inquiry-page";
import { MyInquiryView } from "@/components/support/support-detail";

// 내 문의 상세(#284). 답변 알림 · 메일 링크가 이 주소다. 남의 문의는 api 가 404 다.
export default async function MyInquiryPage({ params }: PageProps<"/support-inquiries/[id]">) {
  const loaded = await Promise.all([getMyInquiry(idOf((await params).id)), getEnum("InquiryStatus")]).catch(denied);
  if (typeof loaded === "number") return <Forbidden title="문의하기" what="문의사항을" href={SUPPORT_INQUIRY_BASE} status={loaded} />;
  return <MyInquiryView inquiry={loaded[0]} statuses={loaded[1]} />;
}
