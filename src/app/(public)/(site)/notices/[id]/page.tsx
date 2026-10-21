import type { Metadata } from "next";
import { GuestButton } from "@/app/design/guest/guest-ui";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";
import { GuestNote, NoticeDetail } from "@/app/design/guest/notices/notice-views";
import { ApiError, getEnum } from "@/lib/api";
import { postIdOf } from "@/lib/community-view";
import { labelOf } from "@/lib/enums";
import { getPublicNotice } from "@/lib/public-posts";
import { RetryButton } from "../retry-button";

export const metadata: Metadata = { title: "공지사항 · Whale ERP" };

const LIST = (
  <GuestButton tone="outline" href={SITE_ROUTES.notices}>
    목록
  </GuestButton>
);

// 첨부 내려받기 경로가 돌려보낸 까닭(attachments/[attachmentId]/route.ts).
const DOWNLOAD_ALERT = {
  missing: "첨부파일을 찾을 수 없습니다. 지워졌을 수 있습니다.",
  failed: "첨부파일을 받지 못했습니다. 잠시 후 다시 시도해 주세요.",
};
// 주소에서 온 값이라 정해 둔 둘만 받는다(toString 같은 다른 키가 끼지 않게).
const downloadAlert = (v: unknown) => (v === "missing" || v === "failed" ? DOWNLOAD_ALERT[v] : undefined);

function Note({ children, retry = false }: { children: string; retry?: boolean }) {
  return (
    <section className="mx-auto w-[1200px] pt-[80px] pb-[60px]">
      <GuestNote
        action={
          <div className="flex gap-[8px]">
            {retry && <RetryButton />}
            {LIST}
          </div>
        }
      >
        {children}
      </GuestNote>
    </section>
  );
}

// 비로그인 공지사항 상세(#293). 샘플(design/guest/notices/detail)과 같은 구현이다. 보이지 않는 글(비공개 · 지움 · 기간 밖 ·
// 비회원 대상 아님)은 api 가 404 를 준다. 첨부 내려받기에 실패하면 attachments 경로가 ?download=missing · failed 로 돌려보낸다.
export default async function NoticeDetailPage({ params, searchParams }: PageProps<"/notices/[id]">) {
  const postId = postIdOf((await params).id);
  if (postId === null) return <Note>찾는 공지사항이 없습니다.</Note>;
  const loaded = await Promise.all([getPublicNotice(postId), getEnum("NoticeType").catch((error: unknown) => {
      // 구분 한글을 못 받으면 값(영문)을 그대로 보인다 — 글은 읽을 수 있어 화면을 막지 않는다(목록과 같다).
      console.error("비로그인 공지사항 구분 조회 실패", error);
      return [];
    })]).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return 404 as const;
    console.error("비로그인 공지사항 상세 조회 실패", error);
    return null;
  });
  if (loaded === 404) return <Note>찾는 공지사항이 없습니다. 게시가 끝났거나 내려간 글일 수 있습니다.</Note>;
  if (!loaded) return <Note retry>공지사항을 불러오지 못했습니다.</Note>;
  const [notice, noticeTypes] = loaded;
  return (
    <NoticeDetail
      notice={notice}
      typeLabel={(t) => labelOf(noticeTypes, t)}
      fileHref={(attachmentId) => `${SITE_ROUTES.notices}/${postId}/attachments/${attachmentId}`}
      listHref={SITE_ROUTES.notices}
      alert={downloadAlert((await searchParams).download)}
    />
  );
}
