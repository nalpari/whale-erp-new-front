// 비로그인 공지사항 · FAQ(#293 · #294). 로그인 없이 열리는 공개 api `/public-notices` · `/public-faqs` 라 토큰을 싣지 않는다.
// 노출 대상에 비회원(GUEST)이 든 게시 글만 오고, 거르는 것은 api 다. 응답 모양은 고객지원(SupportPost)과 같다.
import type { components } from "./api-types.generated";
import { request } from "./api";
import { queryString, type ListQuery } from "./community-view";
import type { Codes } from "./session";

type Schemas = components["schemas"];
export type PublicPost = Schemas["PublishedPostResponseDto"];
export type PublicPostList = Schemas["PublishedPostListResponseDto"];
export type PublicNotice = Schemas["PublishedPostDetailResponseDto"];

export const PUBLIC_NOTICE_BASE = "/public-notices";

/** GET /public-notices — 상단 고정 먼저, 나머지는 게시일 내림차순. */
export async function getPublicNotices(q: ListQuery): Promise<PublicPostList> {
  return request(`${PUBLIC_NOTICE_BASE}${queryString(q)}`);
}

/** GET /public-notices/{postId} — 첨부까지. 이전 · 다음 글은 없다. 보이지 않는 글이면 404. */
export async function getPublicNotice(postId: number): Promise<PublicNotice> {
  return request(`${PUBLIC_NOTICE_BASE}/${postId}`);
}

/** GET /public-notices/{postId}/attachments/{id}/download-url — 300초짜리 서명 주소. 받으면 원래 파일 이름으로 저장된다. */
export async function getPublicNoticeDownloadUrl(postId: number, attachmentId: number): Promise<string> {
  return (await request<Schemas["DownloadUrlResponseDto"]>(`${PUBLIC_NOTICE_BASE}/${postId}/attachments/${attachmentId}/download-url`)).url;
}

/** FAQ 를 한 번에 받는 건수 — api 최대(200). 아코디언 한 장으로 보이고 페이지를 나누지 않는다. */
const FAQ_PAGE_SIZE = 200;

/** GET /public-faqs — 펼쳐 읽으므로 답변 본문까지 싣는다. */
// ponytail: 200건 넘는 FAQ 는 잘린다 — 넘으면 FAQ 에도 페이지 번호를 단다.
export async function getPublicFaqs(): Promise<PublicPostList> {
  return request(`/public-faqs?pageSize=${FAQ_PAGE_SIZE}`);
}

/** GET /public-code-items?groups=FAQ_CATEGORY — 비로그인은 로그인 정보의 공통코드가 없어 공개 api 로 받는다. */
export async function getFaqCategories(): Promise<Codes[string]> {
  return (await request<{ codes: Codes }>("/public-code-items?groups=FAQ_CATEGORY")).codes.FAQ_CATEGORY ?? [];
}
