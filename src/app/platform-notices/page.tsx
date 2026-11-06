import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getPosts } from "@/lib/community";
import { hasCondition, parsePostQuery, POST_BASE } from "@/lib/community-view";
import { PostCreateButton, PostList } from "@/components/community/community-lists";
import { emptyKindOf, ListFailure, loadList } from "@/components/community/list-load";

// 커뮤니티관리 › 공지사항 목록(#275, 데모 support/community-notices). 플랫폼 관리자 전용.
export default async function NoticesPage({ searchParams }: PageProps<"/platform-notices">) {
  const query = parsePostQuery(await searchParams);
  const loaded = await loadList("공지사항", () => Promise.all([query.none ? Promise.resolve({ items: [], total: 0 }) : getPosts("NOTICE", query), getEnum("PostStatus"), getEnum("NoticeType")]));
  // 0건이면 조건 없이 다시 물어 빈 문구를 가른다(「등록된 …」 / 「조건에 맞는 …」)
  const empty = "data" in loaded ? await emptyKindOf(loaded.data[0].total, hasCondition(query), () => getPosts("NOTICE", parsePostQuery({}))) : "filtered";
  return (
    <>
      <PageBar title="공지사항">
        <PostCreateButton kind="NOTICE" />
      </PageBar>
      {"data" in loaded ? (
        <PostList kind="NOTICE" items={loaded.data[0].items} total={loaded.data[0].total} query={query} statuses={loaded.data[1]} noticeTypes={loaded.data[2]} emptyAll={empty === "all"} />
      ) : (
        <ListFailure {...loaded} retryHref={POST_BASE.NOTICE} />
      )}
    </>
  );
}
