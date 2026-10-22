import { EditPostPage } from "@/components/community/post-page";

// FAQ 수정(#276). 목록의 제목을 누르면 온다.
export default async function EditFaqPage({ params }: PageProps<"/platform-faqs/[id]">) {
  return <EditPostPage kind="FAQ" rawId={(await params).id} />;
}
