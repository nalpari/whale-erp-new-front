// 커뮤니티 관리 데이터 접근(/platform/community). api 는 whale-erp-api `/posts` · `/inquiries` · `/leads` 다(WHALEERP-272 · 274 · 332).
// 플랫폼 관리자(PM · PA)만 받고, 아니면 403 이다 — 토큰은 authHeaders() 가 붙인다.
// 공지사항 · FAQ 등록 · 수정은 첨부 때문에 multipart 라 라우트 핸들러(posts/route.ts)가 api 로 넘긴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import { queryString, type InquiryQuery, type LeadQuery, type PostKind, type PostQuery } from "./community-view";

type Schemas = components["schemas"];
export type PostList = Schemas["PostListResponseDto"];
export type PostListItem = Schemas["PostListItemDto"];
export type PostDetail = Schemas["PostResponseDto"];
export type InquiryList = Schemas["InquiryListResponseDto"];
export type InquiryListItem = Schemas["InquiryListItemDto"];
export type LeadList = Schemas["LeadListResponseDto"];
export type LeadListItem = Schemas["LeadListItemDto"];

const init = async (method = "GET"): Promise<RequestInit> => ({ method, headers: await authHeaders() });

/** GET /posts — 공지사항 또는 FAQ. 최근 수정일 내림차순이고 고정 글을 위로 올리지 않는다. */
export async function getPosts(kind: PostKind, q: PostQuery): Promise<PostList> {
  return request(`/posts${queryString({ contentType: kind, ...q })}`, await init());
}

/** GET /posts/{postId} — 수정 화면이 그대로 쓴다. 노출 대상 · 첨부까지. */
export async function getPost(postId: number): Promise<PostDetail> {
  return request(`/posts/${postId}`, await init());
}

/** DELETE /posts/{postId} — 지움 표시. 사용자에게서만 감추고 행은 남는다. 이미 지웠으면 409. */
export async function deletePost(postId: number): Promise<void> {
  await request(`/posts/${postId}`, await init("DELETE"));
}

/** GET /inquiries — 제목 · 보낸 곳 · 답변 상태로 거른다. */
export async function getInquiries(q: InquiryQuery): Promise<InquiryList> {
  return request(`/inquiries${queryString(q)}`, await init());
}

/** GET /leads — 답변 상태로만 거른다. */
export async function getLeads(q: LeadQuery): Promise<LeadList> {
  return request(`/leads${queryString(q)}`, await init());
}
