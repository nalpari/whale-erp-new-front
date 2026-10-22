import { PageBar } from "@/components/common";
import { bpHref, getEnum } from "@/lib/api";
import { getSupportNotices } from "@/lib/community";
import { parseSupportNoticeQuery, SUPPORT_NOTICE_BASE } from "@/lib/community-view";
import { ListFailure, loadList } from "@/components/community/list-load";
import { SupportNoticeList } from "@/components/support/support-lists";

// 고객지원 › 공지사항(#282, 메뉴 MN000035, 데모 support/notices). 노출 대상에 내가 든 게시 공지만 보인다.
export default async function SupportNoticesPage({ searchParams }: PageProps<"/support-notices">) {
  const query = parseSupportNoticeQuery(await searchParams);
  const loaded = await loadList("공지사항", () => Promise.all([getSupportNotices(query), getEnum("NoticeType")]));
  return (
    <>
      <PageBar title="공지사항" />
      {"data" in loaded ? (
        <SupportNoticeList items={loaded.data[0].items} total={loaded.data[0].total} query={query} noticeTypes={loaded.data[1]} />
      ) : (
        <ListFailure {...loaded} retryHref={await bpHref(SUPPORT_NOTICE_BASE)} />
      )}
    </>
  );
}
