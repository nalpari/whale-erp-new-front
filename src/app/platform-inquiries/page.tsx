import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getInquiries } from "@/lib/community";
import { INQUIRY_BASE, parseInquiryQuery } from "@/lib/community-view";
import { InquiryList } from "@/components/community/community-lists";
import { ListFailure, loadList } from "@/components/community/list-load";

// 커뮤니티관리 › 문의사항 목록(#275, 데모 support/community-asks). 플랫폼 관리자 전용. 상세 · 답변은 #277.
export default async function InquiriesPage({ searchParams }: PageProps<"/platform-inquiries">) {
  const query = parseInquiryQuery(await searchParams);
  const loaded = await loadList("문의사항", () => Promise.all([getInquiries(query), getEnum("InquiryAnswerStatus")]));
  return (
    <>
      <PageBar title="문의사항" />
      {"data" in loaded ? (
        <InquiryList items={loaded.data[0].items} total={loaded.data[0].total} query={query} answers={loaded.data[1]} />
      ) : (
        <ListFailure {...loaded} retryHref={INQUIRY_BASE} />
      )}
    </>
  );
}
