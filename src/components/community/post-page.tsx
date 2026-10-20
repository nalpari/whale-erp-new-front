import { notFound } from "next/navigation";
import { PageBar } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import { getPost, type PostDetail } from "@/lib/community";
import { POST_BASE, type PostKind } from "@/lib/community-view";
import { ListFailure } from "./list-load";
import { PostForm } from "./post-form";

// 공지사항 · FAQ 등록 · 수정 화면(platform-notices · platform-faqs 의 new · [id])이 함께 쓰는 서버 쪽. 없는 글 · 다른 종류의 글은 404(api 가 경로로 가른다), 권한이 없으면(401 · 403) 안내.
// 그 밖의 실패는 error.tsx 가 받는다.

const enums = () => Promise.all([getEnum("PostStatus"), getEnum("NoticeType"), getEnum("PostAudienceType")]);

function denied(error: unknown): null {
  if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) throw error;
  return null;
}

function Forbidden({ kind, title }: { kind: PostKind; title: string }) {
  return (
    <>
      <PageBar title={title} />
      <ListFailure failure="게시물을 다룰 권한이 없습니다." denied retryHref={POST_BASE[kind]} />
    </>
  );
}

export async function NewPostPage({ kind }: { kind: PostKind }) {
  const loaded = await enums().catch(denied);
  if (!loaded) return <Forbidden kind={kind} title={kind === "NOTICE" ? "공지사항 등록" : "FAQ 등록"} />;
  const [statuses, noticeTypes, audiences] = loaded;
  return <PostForm kind={kind} statuses={statuses} noticeTypes={noticeTypes} audiences={audiences} />;
}

export async function EditPostPage({ kind, rawId }: { kind: PostKind; rawId: string }) {
  const id = Number(rawId);
  // api 의 id 범위(1..2147483647)와 같다 — 밖이면 api 에 묻지 않고 404.
  if (!/^[1-9][0-9]{0,9}$/.test(rawId) || id > 2_147_483_647) notFound();
  const loaded = await Promise.all([
    getPost(kind, id).catch((error: unknown): PostDetail => {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }),
    enums(),
  ]).catch(denied);
  if (!loaded) return <Forbidden kind={kind} title={kind === "NOTICE" ? "공지사항 수정" : "FAQ 수정"} />;
  const [detail, [statuses, noticeTypes, audiences]] = loaded;
  // 저장 · 최신 불러오기로 updatedAt 이 바뀌면 폼을 새로 그려 저장된 값으로 시작한다.
  return <PostForm key={detail.updatedAt} kind={kind} detail={detail} statuses={statuses} noticeTypes={noticeTypes} audiences={audiences} />;
}
