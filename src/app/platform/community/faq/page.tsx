import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getPosts } from "@/lib/community";
import { parsePostQuery, POST_BASE } from "@/lib/community-view";
import { PostList } from "../community-lists";
import { ListFailure, loadList } from "../list-load";

// 커뮤니티관리 › FAQ 목록(#275, 데모 support/community-faq). 플랫폼 관리자 전용.
export default async function FaqPage({ searchParams }: PageProps<"/platform/community/faq">) {
  const query = parsePostQuery(await searchParams);
  const loaded = await loadList("FAQ", () => Promise.all([getPosts("FAQ", query), getEnum("PostStatus")]));
  return (
    <>
      <PageBar title="FAQ" />
      {"data" in loaded ? (
        <PostList kind="FAQ" items={loaded.data[0].items} total={loaded.data[0].total} query={query} statuses={loaded.data[1]} noticeTypes={[]} />
      ) : (
        <ListFailure {...loaded} retryHref={POST_BASE.FAQ} />
      )}
    </>
  );
}
