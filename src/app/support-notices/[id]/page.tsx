import { getEnum } from "@/lib/api";
import { getSupportNotice } from "@/lib/community";
import { SUPPORT_NOTICE_BASE } from "@/lib/community-view";
import { denied, Forbidden, idOf } from "@/components/community/inquiry-page";
import { SupportNoticeView } from "@/components/support/support-detail";

// 고객지원 공지사항 상세(#282). 보이지 않는 글(비공개 · 지움 · 기간 밖 · 노출 대상 아님)은 api 가 404 다.
export default async function SupportNoticeDetailPage({ params }: PageProps<"/support-notices/[id]">) {
  const loaded = await Promise.all([getSupportNotice(idOf((await params).id)), getEnum("NoticeType")]).catch(denied);
  if (typeof loaded === "number") return <Forbidden title="공지사항" what="공지사항을" href={SUPPORT_NOTICE_BASE} status={loaded} />;
  return <SupportNoticeView notice={loaded[0]} noticeTypes={loaded[1]} />;
}
