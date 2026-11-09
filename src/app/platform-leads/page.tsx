import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getLeads } from "@/lib/community";
import { hasCondition, LEAD_BASE, parseLeadQuery } from "@/lib/community-view";
import { LeadList } from "@/components/community/community-lists";
import { emptyKindOf, ListFailure, loadList } from "@/components/community/list-load";

// 커뮤니티관리 › 도입문의 목록(#275, 데모 support/community-leads). 플랫폼 관리자 전용. 상세 · 답변은 [id](#277).
export default async function LeadsPage({ searchParams }: PageProps<"/platform-leads">) {
  const query = parseLeadQuery(await searchParams);
  const loaded = await loadList("도입문의", () => Promise.all([query.none ? Promise.resolve({ items: [], total: 0 }) : getLeads(query), getEnum("InquiryAnswerStatus"), getEnum("LeadInterest")]));
  // 0건이면 조건 없이 다시 물어 빈 문구를 가른다(「등록된 …」 / 「조건에 맞는 …」)
  const empty = "data" in loaded ? await emptyKindOf(loaded.data[0].total, hasCondition(query), () => getLeads(parseLeadQuery({}))) : "filtered";
  return (
    <>
      <PageBar title="도입문의" />
      {"data" in loaded ? (
        <LeadList items={loaded.data[0].items} total={loaded.data[0].total} query={query} answers={loaded.data[1]} interests={loaded.data[2]} emptyAll={empty === "all"} />
      ) : (
        <ListFailure {...loaded} retryHref={LEAD_BASE} />
      )}
    </>
  );
}
