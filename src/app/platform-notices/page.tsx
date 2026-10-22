import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getPosts } from "@/lib/community";
import { parsePostQuery, POST_BASE } from "@/lib/community-view";
import { PostList } from "@/components/community/community-lists";
import { ListFailure, loadList } from "@/components/community/list-load";

// 커뮤니티관리 › 공지사항 목록(#275, 데모 support/community-notices). 플랫폼 관리자 전용.
export default async function NoticesPage({ searchParams }: PageProps<"/platform-notices">) {
  const query = parsePostQuery(await searchParams);
  const loaded = await loadList("공지사항", () => Promise.all([getPosts("NOTICE", query), getEnum("PostStatus"), getEnum("NoticeType")]));
  return (
    <>
      <PageBar title="공지사항" />
      {"data" in loaded ? (
        <PostList kind="NOTICE" items={loaded.data[0].items} total={loaded.data[0].total} query={query} statuses={loaded.data[1]} noticeTypes={loaded.data[2]} />
      ) : (
        <ListFailure {...loaded} retryHref={POST_BASE.NOTICE} />
      )}
    </>
  );
}
