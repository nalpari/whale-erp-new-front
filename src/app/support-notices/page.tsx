import { PageBar } from "@/components/common";
import { bpHref, getEnum } from "@/lib/api";
import { getSupportNotices } from "@/lib/community";
import { noneChecked, parseSupportNoticeQuery, SUPPORT_NOTICE_BASE } from "@/lib/community-view";
import { ListFailure, loadList } from "@/components/community/list-load";
import { SupportNoticeList } from "@/components/support/support-lists";

// 고객지원 › 공지사항(#282, 메뉴 MN000035, 데모 support/notices). 노출 대상에 내가 든 게시 공지만 보인다.
// 구분을 모두 끄면(NONE) 0건이 확실해 api 를 부르지 않는다 — 직원 목록과 같다(2026-11-05 사용자 지정)
export default async function SupportNoticesPage({ searchParams }: PageProps<"/support-notices">) {
  const query = parseSupportNoticeQuery(await searchParams);
  const none = noneChecked(query.noticeType);
  const loaded = await loadList("공지사항", () =>
    Promise.all([none ? { items: [], total: 0 } : getSupportNotices(query), getEnum("NoticeType")]),
  );
  if (!("data" in loaded))
    return (
      <>
        <PageBar title="공지사항" />
        <ListFailure {...loaded} retryHref={await bpHref(SUPPORT_NOTICE_BASE)} />
      </>
    );
  const [list, noticeTypes] = loaded.data;
  return (
    <>
      <PageBar title="공지사항" />
      <SupportNoticeList items={list.items} total={list.total} query={query} noticeTypes={noticeTypes} />
    </>
  );
}
