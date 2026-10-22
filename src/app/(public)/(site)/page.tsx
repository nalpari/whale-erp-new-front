import { connection } from "next/server";
import { GuestHome, HomeFaqList, HomeNewsList } from "@/app/design/guest/guest-home";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";
import { getEnum } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { getPublicFaqs, getPublicNotices } from "@/lib/public-posts";

/** 홈 칸에 보일 건수 — 시안대로 질문 4 · 소식 6. */
const FAQ_COUNT = 4;
const NEWS_COUNT = 6;

/** 실패를 null 로 — 그 칸을 감추고 원인은 서버 로그에 남긴다. */
const settle = <T,>(what: string, load: Promise<T>): Promise<T | null> =>
  load.catch((error: unknown) => {
    console.error(`비로그인 홈 ${what} 조회 실패`, error);
    return null;
  });

// 로그인 전 홈(#289). Figma 「로그인전_Main」 샘플(design/guest)과 같은 구현이고 링크만 실제 경로로 건다(2026-10-19).
// 「가장 많이 묻는 질문」 · 「새로운 소식」은 비로그인 FAQ · 공지사항(api)이고, 받지 못한 칸은 감춘다. 로그인한 사람은 proxy 가 자기 홈으로 보낸다.
export default async function PublicHome() {
  // 요청마다 그린다 — 빌드 때 api 가 없어 칸이 감춰진 채 정적 페이지로 굳지 않게(terms 와 같다).
  await connection();
  const [notices, noticeTypes, faqs] = await Promise.all([
    settle("공지사항", getPublicNotices(1)),
    // 구분 한글을 못 받으면 값(영문)을 그대로 보인다 — 글은 읽을 수 있어 칸을 감추지 않는다.
    settle("공지사항 구분", getEnum("NoticeType")),
    settle("FAQ", getPublicFaqs()),
  ]);

  return (
    <GuestHome
      routes={SITE_ROUTES}
      faq={faqs && <HomeFaqList items={faqs.items.slice(0, FAQ_COUNT).map((f) => ({ key: f.postId, q: f.title, a: f.body }))} />}
      news={
        notices && (
          <HomeNewsList items={notices.items.slice(0, NEWS_COUNT)} typeLabel={(t) => labelOf(noticeTypes ?? [], t)} hrefOf={(id) => `${SITE_ROUTES.notices}/${id}`} />
        )
      }
    />
  );
}
