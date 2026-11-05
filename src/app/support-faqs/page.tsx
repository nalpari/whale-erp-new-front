import { PageBar } from "@/components/common";
import { bpHref } from "@/lib/api";
import { getSupportFaqs } from "@/lib/community";
import { noneChecked, parseSupportFaqQuery, SUPPORT_FAQ_BASE } from "@/lib/community-view";
import { ListFailure, loadList } from "@/components/community/list-load";
import { SupportFaqList } from "@/components/support/support-lists";

// 고객지원 › FAQ(#283, 메뉴 MN000043, 데모 support/faq). 노출 대상에 내가 든 게시 FAQ 만, 답변은 목록에서 펼친다.
// 카테고리를 모두 끄면(NONE) 0건이 확실해 api 를 부르지 않는다 — 직원 목록과 같다(2026-11-05 사용자 지정)
export default async function SupportFaqsPage({ searchParams }: PageProps<"/support-faqs">) {
  const query = parseSupportFaqQuery(await searchParams);
  const none = noneChecked(query.faqCategoryCode);
  const loaded = await loadList("FAQ", () => (none ? Promise.resolve({ items: [], total: 0 }) : getSupportFaqs(query)));
  if (!("data" in loaded))
    return (
      <>
        <PageBar title="FAQ" />
        <ListFailure {...loaded} retryHref={await bpHref(SUPPORT_FAQ_BASE)} />
      </>
    );
  return (
    <>
      <PageBar title="FAQ" />
      <SupportFaqList items={loaded.data.items} total={loaded.data.total} query={query} />
    </>
  );
}
