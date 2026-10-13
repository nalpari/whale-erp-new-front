// 알림 템플릿 데이터 접근(/platform/notification-templates). api 는 whale-erp-api `/notification-templates` 다.
// 플랫폼 마스터 · 플랫폼 관리자만 받고, 아니면 403 이다 — 토큰은 authHeaders() 가 붙인다(로그인 전에는 개발용 토큰).
// 고치는 요청은 읽은 updatedAt 을 함께 보낸다. 그사이 누가 고쳤으면 api 가 409 로 막는다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import type { TemplateQuery } from "./notification-template-view";

type Schemas = components["schemas"];
export type TemplateList = Schemas["TemplateListResponseDto"];
export type TemplateListItem = Schemas["TemplateListItemDto"];
export type TemplateDetail = Schemas["TemplateDetailDto"];
export type CreateTemplateBody = Schemas["CreateTemplateDto"];
export type UpdateTemplateBody = Schemas["UpdateTemplateDto"];

const json = async (method: string, body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /notification-templates — 한 채널의 템플릿을 템플릿 코드 순으로 한 쪽씩. */
export async function getTemplates({ channel, page, pageSize }: TemplateQuery): Promise<TemplateList> {
  return request(`/notification-templates?channel=${channel}&page=${page}&pageSize=${pageSize}`, await json("GET"));
}

/** GET /notification-templates/{id} — 본문 · 변수 목록 · 변경 이력(최근 것부터)까지. */
export async function getTemplate(id: number): Promise<TemplateDetail> {
  return request(`/notification-templates/${id}`, await json("GET"));
}

/** POST /notification-templates — 등록. 템플릿 코드가 겹치면 409. */
export async function createTemplate(body: CreateTemplateBody): Promise<TemplateDetail> {
  return request("/notification-templates", await json("POST", body));
}

/** PUT /notification-templates/{id} — 모든 칸을 고친다. 바뀌기 전 행이 변경 이력에 남는다. */
export async function updateTemplate(id: number, body: UpdateTemplateBody): Promise<TemplateDetail> {
  return request(`/notification-templates/${id}`, await json("PUT", body));
}

/** POST /notification-templates/{id}/restore — 제목 · 본문 · 변수 목록을 기본 문구로(NOTIFY-18). 등록한 템플릿은 409. */
export async function restoreTemplate(id: number, updatedAt: string): Promise<TemplateDetail> {
  return request(`/notification-templates/${id}/restore`, await json("POST", { updatedAt }));
}

/** PATCH /notification-templates/{id}/active — 사용 / 사용 안 함. 지우는 길은 없다(운영 정책 NTF-21). */
export async function setTemplateActive(id: number, isActive: boolean, updatedAt: string): Promise<TemplateDetail> {
  return request(`/notification-templates/${id}/active`, await json("PATCH", { isActive, updatedAt }));
}
