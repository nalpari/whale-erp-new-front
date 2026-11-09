import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getInquiries } from "@/lib/community";
import { hasCondition, INQUIRY_BASE, parseInquiryQuery } from "@/lib/community-view";
import { InquiryList } from "@/components/community/community-lists";
import { emptyKindOf, ListFailure, loadList } from "@/components/community/list-load";

// 커뮤니티관리 › 문의사항 목록(#275, 데모 support/community-asks). 플랫폼 관리자 전용. 상세 · 답변은 [id](#277).
export default async function InquiriesPage({ searchParams }: PageProps<"/platform-inquiries">) {
  const query = parseInquiryQuery(await searchParams);
  const loaded = await loadList("문의사항", () => Promise.all([query.none ? Promise.resolve({ items: [], total: 0 }) : getInquiries(query), getEnum("InquiryAnswerStatus")]));
  // 0건이면 조건 없이 다시 물어 빈 문구를 가른다(「등록된 …」 / 「조건에 맞는 …」)
  const empty = "data" in loaded ? await emptyKindOf(loaded.data[0].total, hasCondition(query), () => getInquiries(parseInquiryQuery({}))) : "filtered";
  return (
    <>
      <PageBar title="문의사항" />
      {"data" in loaded ? (
        <InquiryList items={loaded.data[0].items} total={loaded.data[0].total} query={query} answers={loaded.data[1]} emptyAll={empty === "all"} />
      ) : (
        <ListFailure {...loaded} retryHref={INQUIRY_BASE} />
      )}
    </>
  );
}
