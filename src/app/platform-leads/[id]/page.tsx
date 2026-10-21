import { LeadPage } from "@/components/community/inquiry-page";

// 도입문의 상세 · 답변 · 답변 메일 다시 보내기(#277 · #597). 목록의 문의자를 누르면 온다.
export default async function LeadDetailPage({ params }: PageProps<"/platform-leads/[id]">) {
  return <LeadPage rawId={(await params).id} />;
}
