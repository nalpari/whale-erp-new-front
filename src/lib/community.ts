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

// 문의사항 · 도입문의 상세 · 답변(#277 · #597). 바꾸는 요청은 모두 읽은 updatedAt 을 함께 보내고, 그사이 누가 저장했으면 409 다.
export type InquiryDetail = Schemas["InquiryResponseDto"];
export type LeadDetail = Schemas["LeadResponseDto"];
export type LeadReplyMail = Schemas["LeadReplyMailResponseDto"];
export type Target = "inquiry" | "lead";
const base = (target: Target) => (target === "inquiry" ? INQUIRY_BASE : LEAD_BASE);

/** GET /platform-inquiries/{id} — 답변 이력(오래된 것부터) · 첨부(이미지는 5분짜리 미리보기 주소) · 내부 메모. */
export async function getInquiry(inquiryId: number): Promise<InquiryDetail> {
  return request(`${INQUIRY_BASE}/${inquiryId}`, await init());
}

/** GET /platform-leads/{id} — 문의자 정보 · 동의 · 답변 하나 · 마지막 답변 메일 결과 · 내부 메모. */
export async function getLead(leadId: number): Promise<LeadDetail> {
  return request(`${LEAD_BASE}/${leadId}`, await init());
}

/** POST …/{id}/processing — 접수 상태에서만 처리중으로. 아니면 409. */
export async function startProcessing(target: Target, id: number): Promise<void> {
  await request(`${base(target)}/${id}/processing`, await init("POST"));
}

/** 답변 저장 — 문의사항은 POST …/replies 로 새 답변을 더하고(이력이 남음), 도입문의는 PUT …/reply 로 하나를 덮어쓴다. */
export async function saveReply(target: Target, id: number, body: string, updatedAt: string): Promise<void> {
  if (target === "inquiry") await request(`${INQUIRY_BASE}/${id}/replies`, await init("POST", { body, updatedAt }));
  else await request(`${LEAD_BASE}/${id}/reply`, await init("PUT", { reply: body, updatedAt }));
}

/** PUT …/{id}/internal-memo — 빈 글자 · 공백만이면 지운다. */
export async function saveMemo(target: Target, id: number, internalMemo: string, updatedAt: string): Promise<void> {
  await request(`${base(target)}/${id}/internal-memo`, await init("PUT", { internalMemo, updatedAt }));
}

/** DELETE /platform-leads/{id} — 상담하지 않은(상담 완료일 없는) 도입문의만. 행을 남기지 않는다. 상담을 마쳤으면 409. */
export async function deleteLead(leadId: number): Promise<void> {
  await request(`${LEAD_BASE}/${leadId}`, await init("DELETE"));
}

/** POST /platform-leads/{id}/reply-mail/resend — 저장된 답변을 다시 보낸다. SMTP 가 실패해도 200 에 FAILED. 1분 안에 또 보내면 409, 메일 설정이 없으면 503. */
export async function resendLeadReplyMail(leadId: number): Promise<LeadReplyMail> {
  return request(`${LEAD_BASE}/${leadId}/reply-mail/resend`, await init("POST"));
}
