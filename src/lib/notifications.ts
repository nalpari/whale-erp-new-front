// 운영 알림함 데이터 접근(/notifications). api 는 whale-erp-api `/notifications` 다 — 관리자 토큰만 받는다.
// 토큰은 authHeaders() 가 붙인다(로그인 전에는 개발용 토큰). 타입은 api 의 openapi.json 에서 만든 것을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";

type Schemas = components["schemas"];
export type NotificationItem = Schemas["NotificationItemDto"];
export type NotificationList = Schemas["NotificationListResponseDto"];

const init = async (method: string): Promise<RequestInit> => ({ method, headers: await authHeaders() });

/** GET /notifications — 내 알림 한 쪽과 미확인 건수. 종 팝오버는 pageSize 5. */
export async function getNotifications({ page = 1, pageSize = 20 } = {}): Promise<NotificationList> {
  return request(`/notifications?page=${page}&pageSize=${pageSize}`, await init("GET"));
}

/** POST /notifications/{id}/read — 읽음으로 바꾸고 갈 곳(관련 업무)을 담은 한 줄을 받는다. */
export async function readNotification(id: number): Promise<NotificationItem> {
  return request(`/notifications/${id}/read`, await init("POST"));
}

/** POST /notifications/read-all — 내 미확인 모두. */
export async function readAllNotifications(): Promise<{ updated: number }> {
  return request("/notifications/read-all", await init("POST"));
}

/** DELETE /notifications?ids= — 받은 사람별 지운 표시. 내 것이 아닌 ID 는 api 가 조용히 뺀다. */
export async function deleteNotifications(ids: number[]): Promise<void> {
  await request(`/notifications?ids=${ids.join(",")}`, await init("DELETE"));
}
