import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getPosts } from "@/lib/community";
import { hasCondition, parsePostQuery, POST_BASE } from "@/lib/community-view";
import { PostCreateButton, PostList } from "@/components/community/community-lists";
import { emptyKindOf, ListFailure, loadList } from "@/components/community/list-load";

// 커뮤니티관리 › FAQ 목록(#275, 데모 support/community-faq). 플랫폼 관리자 전용.
export default async function FaqPage({ searchParams }: PageProps<"/platform-faqs">) {
  const query = parsePostQuery(await searchParams);
  const loaded = await loadList("FAQ", () => Promise.all([query.none ? Promise.resolve({ items: [], total: 0 }) : getPosts("FAQ", query), getEnum("PostStatus")]));
  // 0건이면 조건 없이 다시 물어 빈 문구를 가른다(「등록된 …」 / 「조건에 맞는 …」)
  const empty = "data" in loaded ? await emptyKindOf(loaded.data[0].total, hasCondition(query), () => getPosts("FAQ", parsePostQuery({}))) : "filtered";
  return (
    <>
      <PageBar title="FAQ">
        <PostCreateButton kind="FAQ" />
      </PageBar>
      {"data" in loaded ? (
        <PostList kind="FAQ" items={loaded.data[0].items} total={loaded.data[0].total} query={query} statuses={loaded.data[1]} noticeTypes={[]} emptyAll={empty === "all"} />
      ) : (
        <ListFailure {...loaded} retryHref={POST_BASE.FAQ} />
      )}
    </>
  );
}
