import type { components } from "@/lib/api-types.generated";

// 공지사항 목록 · 상세 샘플의 예시 글. 글은 목업(docs/mockup/home/notices.html)의 예시이고, 모양은 api 응답과 같다 —
// 샘플은 api 를 부르지 않으므로 구분 한글도 여기 둔다(실제 화면은 api enum NoticeType 에서 받는다).
type Schemas = components["schemas"];

const TYPE_LABEL: Record<Schemas["NoticeType"], string> = { MAINTENANCE: "점검", FEATURE: "기능", TERMS: "약관", GENERAL: "안내" };
export const sampleTypeLabel = (type: Schemas["NoticeType"]) => TYPE_LABEL[type];

const post = (postId: number, noticeType: Schemas["NoticeType"], title: string, postedDate: string, isPinned = false): Schemas["PublishedPostResponseDto"] => ({
  contentType: "NOTICE",
  noticeType,
  postId,
  title,
  body: "",
  faqCategoryCode: null,
  isPinned,
  postedDate,
});

export const SAMPLE_NOTICES = [
  post(1, "MAINTENANCE", "9월 정기 점검 안내 (09-14 02:00~05:00)", "2026-09-05", true),
  post(2, "FEATURE", "근로계약 전자날인 기능이 열렸습니다", "2026-09-01"),
  post(3, "TERMS", "개인정보처리방침 개정 안내", "2026-08-25"),
  post(4, "GENERAL", "WHALE ERP 1차 오픈 일정 안내", "2026-08-19"),
];

/** 목록의 첫 글을 연 상세. */
export const SAMPLE_NOTICE = {
  ...SAMPLE_NOTICES[0],
  body: `9월 14일(일) 새벽 2시부터 5시까지 정기 점검이 있습니다.
점검 시간에는 관리자 웹과 직원 전용 앱을 모두 사용할 수 없습니다.
직원 근무 앱의 출퇴근 등록은 점검 중에도 기기에 기록되고 점검이 끝나면 자동으로 반영됩니다.
점검이 일찍 끝나면 공지 없이 서비스를 재개합니다.`,
  attachments: [
    { postAttachmentId: 1, fileType: "PDF", fileName: "9월_정기점검_안내.pdf", sizeBytes: 184 * 1024 },
    { postAttachmentId: 2, fileType: "PNG", fileName: "점검_시간표.png", sizeBytes: 96 * 1024 },
  ] satisfies Schemas["PostAttachmentDto"][],
};
