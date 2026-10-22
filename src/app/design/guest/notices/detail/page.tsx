import type { Metadata } from "next";
import { SAMPLE_ROUTES } from "../../guest-routes";
import { NoticeDetail } from "../notice-views";
import { SAMPLE_NOTICE, sampleTypeLabel } from "../notice-sample";

export const metadata: Metadata = { title: "Whale ERP · 공지사항" };

// 공지사항 상세(비로그인, #293) 샘플 — 목록의 첫 글을 연 모습. 실제 화면((public)/(site)/notices/[id])과 같은 구현이다.
export default function NoticeDetailSample() {
  return <NoticeDetail notice={SAMPLE_NOTICE} typeLabel={sampleTypeLabel} fileHref={() => "#"} listHref={SAMPLE_ROUTES.notices} />;
}
