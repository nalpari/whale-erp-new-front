import { InquiryPage } from "@/components/community/inquiry-page";

// 문의사항 상세 · 답변(#277). 목록의 제목을 누르면 온다.
export default async function InquiryDetailPage({ params }: PageProps<"/platform-inquiries/[id]">) {
  return <InquiryPage rawId={(await params).id} />;
}
