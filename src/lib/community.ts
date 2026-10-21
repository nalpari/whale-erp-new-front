// 커뮤니티 관리 데이터 접근. api 경로는 화면 주소와 같다 — `/platform-notices` · `/platform-faqs` · `/platform-inquiries` · `/platform-leads`
// (WHALEERP-272 · 274 · 332). 플랫폼 관리자(PM · PA)이면서 그 메뉴 권한이 있어야 하고, 아니면 403 이다 — 토큰은 authHeaders() 가 붙인다.
// 공지사항 등록 · 수정은 첨부 때문에 multipart 라 라우트 핸들러(platform-notices/save)가 api 로 넘긴다. FAQ 는 JSON 이다(community-actions.ts).
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import { INQUIRY_BASE, LEAD_BASE, POST_BASE, queryString, type InquiryQuery, type LeadQuery, type PostKind, type PostQuery } from "./community-view";

type Schemas = components["schemas"];
export type PostList = Schemas["PostListResponseDto"];
export type PostListItem = Schemas["PostListItemDto"];
export type PostDetail = Schemas["PostResponseDto"];
export type PostBody = Schemas["CreatePostDto"];
export type UpdatePostBody = Schemas["UpdatePostDto"];
export type InquiryList = Schemas["InquiryListResponseDto"];
export type InquiryListItem = Schemas["InquiryListItemDto"];
export type LeadList = Schemas["LeadListResponseDto"];
export type LeadListItem = Schemas["LeadListItemDto"];

const init = async (method = "GET", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /platform-notices · /platform-faqs — 최근 수정일 내림차순이고 고정 글을 위로 올리지 않는다. */
export async function getPosts(kind: PostKind, q: PostQuery): Promise<PostList> {
  return request(`${POST_BASE[kind]}${queryString(q)}`, await init());
}

/** GET …/{postId} — 수정 화면이 그대로 쓴다. 노출 대상 · 첨부까지. 다른 종류의 글이면 404. */
export async function getPost(kind: PostKind, postId: number): Promise<PostDetail> {
  return request(`${POST_BASE[kind]}/${postId}`, await init());
}

/** POST /platform-faqs — FAQ 등록. JSON 만 받는다(첨부 없음). */
export async function createFaq(body: PostBody): Promise<PostDetail> {
  return request(POST_BASE.FAQ, await init("POST", body));
}

/** PUT /platform-faqs/{postId} — FAQ 수정. 읽은 updatedAt 을 함께 보내고, 그사이 누가 고쳤으면 409. */
export async function updateFaq(postId: number, body: UpdatePostBody): Promise<PostDetail> {
  return request(`${POST_BASE.FAQ}/${postId}`, await init("PUT", body));
}

/** DELETE …/{postId} — 지움 표시. 사용자에게서만 감추고 행은 남는다. 이미 지웠으면 409. */
export async function deletePost(kind: PostKind, postId: number): Promise<void> {
  await request(`${POST_BASE[kind]}/${postId}`, await init("DELETE"));
}

/** GET /platform-inquiries — 제목 · 보낸 곳 · 답변 상태로 거른다. */
export async function getInquiries(q: InquiryQuery): Promise<InquiryList> {
  return request(`${INQUIRY_BASE}${queryString(q)}`, await init());
}

/** GET /platform-leads — 답변 상태로만 거른다. */
export async function getLeads(q: LeadQuery): Promise<LeadList> {
  return request(`${LEAD_BASE}${queryString(q)}`, await init());
}
