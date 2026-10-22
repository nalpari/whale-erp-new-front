import { PageBar } from "@/components/common";
import { bpHref } from "@/lib/api";
import { getSupportFaqs } from "@/lib/community";
import { parseSupportFaqQuery, SUPPORT_FAQ_BASE } from "@/lib/community-view";
import { ListFailure, loadList } from "@/components/community/list-load";
import { SupportFaqList } from "@/components/support/support-lists";

// 고객지원 › FAQ(#283, 메뉴 MN000043, 데모 support/faq). 노출 대상에 내가 든 게시 FAQ 만, 답변은 목록에서 펼친다.
export default async function SupportFaqsPage({ searchParams }: PageProps<"/support-faqs">) {
  const query = parseSupportFaqQuery(await searchParams);
  const loaded = await loadList("FAQ", () => getSupportFaqs(query));
  return (
    <>
      <PageBar title="FAQ" />
      {"data" in loaded ? <SupportFaqList items={loaded.data.items} total={loaded.data.total} query={query} /> : <ListFailure {...loaded} retryHref={await bpHref(SUPPORT_FAQ_BASE)} />}
    </>
  );
}
