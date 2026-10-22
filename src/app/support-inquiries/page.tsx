import { PageBar } from "@/components/common";
import { bpHref, getEnum } from "@/lib/api";
import { getMyInquiries } from "@/lib/community";
import { parseSupportInquiryQuery, SUPPORT_INQUIRY_BASE } from "@/lib/community-view";
import { ListFailure, loadList } from "@/components/community/list-load";
import { MyInquiryList } from "@/components/support/support-lists";

// 고객지원 › 문의하기(#284, 메뉴 MN000036, 데모 support/inquiries). 내가 올린 문의 목록과 등록 패널.
export default async function SupportInquiriesPage({ searchParams }: PageProps<"/support-inquiries">) {
  const query = parseSupportInquiryQuery(await searchParams);
  const loaded = await loadList("문의사항", () => Promise.all([getMyInquiries(query), getEnum("InquiryStatus")]));
  return (
    <>
      <PageBar title="문의하기" />
      {"data" in loaded ? (
        <MyInquiryList items={loaded.data[0].items} total={loaded.data[0].total} query={query} statuses={loaded.data[1]} />
      ) : (
        <ListFailure {...loaded} retryHref={await bpHref(SUPPORT_INQUIRY_BASE)} />
      )}
    </>
  );
}
