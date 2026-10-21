import { notFound } from "next/navigation";
import { PageBar } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import { getInquiry, getLead } from "@/lib/community";
import { INQUIRY_BASE, LEAD_BASE } from "@/lib/community-view";
import { ListFailure } from "./list-load";
import { InquiryDetailView, LeadDetailView } from "./inquiry-detail";

// 문의사항 · 도입문의 상세(#277 · #597, platform-inquiries · platform-leads 의 [id])의 서버 쪽. 없는 건은 404, 권한이 없으면(401 · 403) 안내.
// 그 밖의 실패는 error.tsx 가 받는다.

/** 경로의 id — api 의 id 범위(1..2147483647)와 같다. 밖이면 api 에 묻지 않고 404. */
function idOf(rawId: string): number {
  const id = Number(rawId);
  if (!/^[1-9][0-9]{0,9}$/.test(rawId) || id > 2_147_483_647) notFound();
  return id;
}

/** 404 는 화면 404 로, 401 · 403 은 null(권한 안내)로, 나머지는 그대로 던진다. */
function denied(error: unknown): null {
  if (error instanceof ApiError && error.status === 404) notFound();
  if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) throw error;
  return null;
}

function Forbidden({ title, what, href }: { title: string; what: string; href: string }) {
  return (
    <>
      <PageBar title={title} />
      <ListFailure failure={`${what} 볼 권한이 없습니다.`} denied retryHref={href} />
    </>
  );
}

export async function InquiryPage({ rawId }: { rawId: string }) {
  const loaded = await Promise.all([getInquiry(idOf(rawId)), getEnum("InquiryStatus")]).catch(denied);
  if (!loaded) return <Forbidden title="문의사항" what="문의사항을" href={INQUIRY_BASE} />;
  return <InquiryDetailView detail={loaded[0]} statuses={loaded[1]} />;
}

export async function LeadPage({ rawId }: { rawId: string }) {
  const loaded = await Promise.all([getLead(idOf(rawId)), getEnum("InquiryStatus"), getEnum("LeadInterest"), getEnum("ReplyMailResult")]).catch(denied);
  if (!loaded) return <Forbidden title="도입문의" what="도입문의를" href={LEAD_BASE} />;
  return <LeadDetailView detail={loaded[0]} statuses={loaded[1]} interests={loaded[2]} mailResults={loaded[3]} />;
}
