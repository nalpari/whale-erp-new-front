import { EditPostPage } from "../../post-page";

// FAQ 수정(#276). 목록의 제목을 누르면 온다.
export default async function EditFaqPage({ params }: PageProps<"/platform/community/faq/[id]">) {
  return <EditPostPage kind="FAQ" rawId={(await params).id} />;
}
