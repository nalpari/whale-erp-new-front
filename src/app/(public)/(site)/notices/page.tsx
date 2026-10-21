import type { Metadata } from "next";
import { FaqItem } from "@/app/design/guest/guest-ui";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";
import { GuestNote, NoticeRows, NoticesScreen, Pager } from "@/app/design/guest/notices/notice-views";
import { getEnum } from "@/lib/api";
import { parseSupportNoticeQuery } from "@/lib/community-view";
import { labelOf } from "@/lib/enums";
import { getFaqCategories, getPublicFaqs, getPublicNotices } from "@/lib/public-posts";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "공지사항 · FAQ · Whale ERP" };

/** 실패를 화면 안 문장으로 바꾼다 — 원인은 서버 로그에 남긴다. */
const settle = <T,>(what: string, load: Promise<T>): Promise<T | null> =>
  load.catch((error: unknown) => {
    console.error(`비로그인 ${what} 조회 실패`, error);
    return null;
  });

// 비로그인 공지사항 · FAQ(#293 · #294). Figma 「로그인전」 샘플(design/guest/notices)과 같은 구현이고 글만 api 에서 받는다.
// 공지사항은 쪽(?page)으로 나누고 페이지당 건수는 다른 목록과 같은 20건이다. FAQ 는 한 장에 모두 펼쳐 보인다(#faq 탭).
// 둘 중 하나를 받지 못해도 나머지는 보이고, 못 받은 탭에만 다시 시도를 둔다.
export default async function NoticesPage({ searchParams }: PageProps<"/notices">) {
  const { page, pageSize } = parseSupportNoticeQuery(await searchParams);
  const [notices, noticeTypes, faqs, categories] = await Promise.all([
    settle("공지사항", getPublicNotices({ page, pageSize })),
    // 구분 한글 · 카테고리 이름을 못 받으면 값(영문)을 그대로 보인다 — 글은 그대로 읽을 수 있어 화면을 막지 않는다.
    settle("공지사항 구분", getEnum("NoticeType")),
    settle("FAQ", getPublicFaqs()),
    settle("FAQ 카테고리", getFaqCategories()),
  ]);

  const noticePanel = !notices ? (
    <GuestNote action={<RetryButton />}>공지사항을 불러오지 못했습니다.</GuestNote>
  ) : (
    <>
      {notices.items.length > 0 ? (
        <NoticeRows items={notices.items} typeLabel={(t) => labelOf(noticeTypes ?? [], t)} hrefOf={(id) => `${SITE_ROUTES.notices}/${id}`} />
      ) : (
        <GuestNote>{notices.total > 0 ? "이 쪽에는 공지사항이 없습니다." : "등록된 공지사항이 없습니다."}</GuestNote>
      )}
      {notices.total > 0 && <Pager page={page} total={notices.total} pageSize={pageSize} hrefOf={(n) => (n === 1 ? SITE_ROUTES.notices : `${SITE_ROUTES.notices}?page=${n}`)} />}
    </>
  );

  const faqPanel = !faqs ? (
    <GuestNote action={<RetryButton />}>FAQ 를 불러오지 못했습니다.</GuestNote>
  ) : faqs.items.length === 0 ? (
    <GuestNote>등록된 FAQ 가 없습니다.</GuestNote>
  ) : (
    <div className="flex flex-col gap-[8px] pt-[24px]">
      {faqs.items.map((f) => (
        <FaqItem key={f.postId} q={f.title} category={f.faqCategoryCode ? labelOf(categories ?? [], f.faqCategoryCode) : undefined}>
          {f.body}
        </FaqItem>
      ))}
    </div>
  );

  return <NoticesScreen inquiryHref={SITE_ROUTES.inquiry} notices={noticePanel} faq={faqPanel} />;
}
