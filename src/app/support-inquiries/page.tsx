import { PageBar } from "@/components/common";
import { bpHref, getEnum } from "@/lib/api";
import { getMyInquiries } from "@/lib/community";
import { noneChecked, parseSupportInquiryQuery, SUPPORT_INQUIRY_BASE } from "@/lib/community-view";
import { ListFailure, loadList } from "@/components/community/list-load";
import { MyInquiryList } from "@/components/support/support-lists";

// 고객지원 › 문의하기(#284, 메뉴 MN000036, 데모 support/inquiries). 내가 올린 문의 목록과 등록 패널.
// 상태를 모두 끄면(NONE) 0건이 확실해 api 를 부르지 않는다 — 직원 목록과 같다(2026-11-05 사용자 지정)
export default async function SupportInquiriesPage({ searchParams }: PageProps<"/support-inquiries">) {
  const query = parseSupportInquiryQuery(await searchParams);
  const none = noneChecked(query.status);
  const loaded = await loadList("문의사항", () =>
    Promise.all([none ? { items: [], total: 0 } : getMyInquiries(query), getEnum("InquiryStatus")]),
  );
  if (!("data" in loaded))
    return (
      <>
        <PageBar title="문의하기" />
        <ListFailure {...loaded} retryHref={await bpHref(SUPPORT_INQUIRY_BASE)} />
      </>
    );
  const [list, statuses] = loaded.data;
  return (
    <>
      <PageBar title="문의하기" />
      <MyInquiryList items={list.items} total={list.total} query={query} statuses={statuses} />
    </>
  );
}
