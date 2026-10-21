import { notFound } from "next/navigation";
import { PageBar } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import { getPost, type PostDetail } from "@/lib/community";
import { POST_BASE, postIdOf, type PostKind } from "@/lib/community-view";
import { deniedMessage, ListFailure } from "./list-load";
import { PostForm } from "./post-form";

// 공지사항 · FAQ 등록 · 수정 화면(platform-notices · platform-faqs 의 new · [id])이 함께 쓰는 서버 쪽. 없는 글 · 다른 종류의 글은 404(api 가 경로로 가른다),
// 로그인이 끊겼거나(401) 권한이 없으면(403) 안내. 그 밖의 실패는 error.tsx 가 받는다.

const enums = () => Promise.all([getEnum("PostStatus"), getEnum("NoticeType"), getEnum("PostAudienceType")]);

/** 401 · 403 이면 그 상태 코드를, 그 밖의 실패는 다시 던진다. */
function denied(error: unknown): 401 | 403 {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return error.status;
  throw error;
}

function Forbidden({ kind, title, status }: { kind: PostKind; title: string; status: 401 | 403 }) {
  return (
    <>
      <PageBar title={title} />
      <ListFailure failure={deniedMessage(status, "게시물을 다룰 권한이 없습니다.")} denied retryHref={POST_BASE[kind]} />
    </>
  );
}

export async function NewPostPage({ kind }: { kind: PostKind }) {
  const loaded = await enums().catch(denied);
  if (typeof loaded === "number") return <Forbidden kind={kind} status={loaded} title={kind === "NOTICE" ? "공지사항 등록" : "FAQ 등록"} />;
  const [statuses, noticeTypes, audiences] = loaded;
  return <PostForm kind={kind} statuses={statuses} noticeTypes={noticeTypes} audiences={audiences} />;
}

export async function EditPostPage({ kind, rawId }: { kind: PostKind; rawId: string }) {
  // api 의 id 범위와 같다 — 밖이면 api 에 묻지 않고 404.
  const id = postIdOf(rawId);
  if (id === null) notFound();
  const loaded = await Promise.all([
    getPost(kind, id).catch((error: unknown): PostDetail => {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }),
    enums(),
  ]).catch(denied);
  if (typeof loaded === "number") return <Forbidden kind={kind} status={loaded} title={kind === "NOTICE" ? "공지사항 수정" : "FAQ 수정"} />;
  const [detail, [statuses, noticeTypes, audiences]] = loaded;
  // 저장 · 최신 불러오기로 updatedAt 이 바뀌면 폼을 새로 그려 저장된 값으로 시작한다.
  return <PostForm key={detail.updatedAt} kind={kind} detail={detail} statuses={statuses} noticeTypes={noticeTypes} audiences={audiences} />;
}
