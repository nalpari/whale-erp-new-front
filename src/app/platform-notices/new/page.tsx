import { NewPostPage } from "@/components/community/post-page";

// 공지사항 등록(#276). 저장하면 수정 화면으로 간다.
export default function NewNoticePage() {
  return <NewPostPage kind="NOTICE" />;
}
