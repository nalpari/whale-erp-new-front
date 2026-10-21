import { EditPostPage } from "@/components/community/post-page";

// 공지사항 수정(#276). 목록의 제목을 누르면 온다.
export default async function EditNoticePage({ params }: PageProps<"/platform-notices/[id]">) {
  return <EditPostPage kind="NOTICE" rawId={(await params).id} />;
}
