import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getLeads } from "@/lib/community";
import { COMMUNITY, parseLeadQuery } from "@/lib/community-view";
import { LeadList } from "../community-lists";
import { ListFailure, loadList } from "../list-load";

// 커뮤니티관리 › 도입문의 목록(#275, 데모 support/community-leads). 플랫폼 관리자 전용. 상세 · 답변은 #277.
export default async function LeadsPage({ searchParams }: PageProps<"/platform/community/leads">) {
  const query = parseLeadQuery(await searchParams);
  const loaded = await loadList("도입문의", () => Promise.all([getLeads(query), getEnum("InquiryAnswerStatus"), getEnum("LeadInterest")]));
  return (
    <>
      <PageBar title="도입문의" />
      {"data" in loaded ? (
        <LeadList items={loaded.data[0].items} total={loaded.data[0].total} query={query} answers={loaded.data[1]} interests={loaded.data[2]} />
      ) : (
        <ListFailure {...loaded} retryHref={`${COMMUNITY}/leads`} />
      )}
    </>
  );
}
