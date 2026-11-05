import { notFound } from "next/navigation";
import { PageBar } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import { redirectExpired } from "@/lib/redirect-expired";
import { getInquiry, getLead } from "@/lib/community";
import { INQUIRY_BASE, LEAD_BASE, postIdOf } from "@/lib/community-view";
import { ListFailure } from "./list-load";
import { InquiryDetailView, LeadDetailView } from "./inquiry-detail";

// 문의사항 · 도입문의 상세(#277 · #597, platform-inquiries · platform-leads 의 [id])의 서버 쪽. 없는 건은 404,
// 로그인이 끊기면(401) 로그인 화면(만료)으로 보내고 권한이 없으면(403) 안내한다. 그 밖의 실패는 error.tsx 가 받는다.

/** 경로의 id — api 의 id 범위와 같다. 밖이면 api 에 묻지 않고 404. */
export function idOf(rawId: string): number {
  const id = postIdOf(rawId);
  if (id === null) notFound();
  return id;
}

/** 404 는 화면 404 로, 401 은 로그인 화면(만료)으로, 403 은 안내하고, 나머지는 그대로 던진다. */
export function denied(error: unknown): 403 {
  if (error instanceof ApiError && error.status === 404) notFound();
  if (error instanceof ApiError && error.status === 401) redirectExpired();
  if (error instanceof ApiError && error.status === 403) return error.status;
  throw error;
}

export function Forbidden({ title, what, href }: { title: string; what: string; href: string }) {
  return (
    <>
      <PageBar title={title} />
      <ListFailure failure={`${what} 볼 권한이 없습니다.`} denied retryHref={href} />
    </>
  );
}

export async function InquiryPage({ rawId }: { rawId: string }) {
  const loaded = await Promise.all([getInquiry(idOf(rawId)), getEnum("InquiryStatus")]).catch(denied);
  if (typeof loaded === "number") return <Forbidden title="문의사항" what="문의사항을" href={INQUIRY_BASE} />;
  return <InquiryDetailView detail={loaded[0]} statuses={loaded[1]} />;
}

export async function LeadPage({ rawId }: { rawId: string }) {
  const loaded = await Promise.all([getLead(idOf(rawId)), getEnum("InquiryStatus"), getEnum("LeadInterest"), getEnum("ReplyMailResult")]).catch(denied);
  if (typeof loaded === "number") return <Forbidden title="도입문의" what="도입문의를" href={LEAD_BASE} />;
  return <LeadDetailView detail={loaded[0]} statuses={loaded[1]} interests={loaded[2]} mailResults={loaded[3]} />;
}
