// BP 휴일 관리 데이터 접근(/bp-holidays, 메뉴 MN000015). api 는 whale-erp-api `/bp-holidays` 다.
// 대상 BP 는 탭 BP 헤더(X-Bp-Code-Id)다 — 화면 주소 /bp/{id}/bp-holidays 를 proxy 가 이 폴더로 rewrite 하며 싣고, authHeaders 가 넘긴다.
// 플랫폼 계정은 BP 를 골라야 하고(없으면 400) 고른 BP 를 BP 마스터처럼 다룬다. 메뉴 권한 · 점포 범위 · 상태별 동작은 api 가 판정하고
// 휴일마다 actions(canUpdate · canUpdateStores · canTerminate · canDelete · blockedReason)로 알려 준다 — 화면은 그것으로 버튼만 가린다.
// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import { BP_HOLIDAY_HISTORY_PAGE_SIZE, bpHolidaysApiPath } from "./bp-holiday-view";

type Schemas = components["schemas"];
export type BpHolidayList = Schemas["BpHolidayListResponseDto"];
export type BpHolidayDateRow = Schemas["BpHolidayDateRowResponseDto"];
export type BpHolidayDetail = Schemas["BpHolidayDetailResponseDto"];
export type BpHolidayStore = Schemas["BpHolidayStoreResponseDto"];
export type BpHolidayHistory = Schemas["BpHolidayHistoryResponseDto"];
export type BpHolidayHistoryList = Schemas["BpHolidayHistoryListResponseDto"];
export type BpHolidayActions = Schemas["BpHolidayActionsResponseDto"];
export type BpHolidayOverlaps = Schemas["BpHolidayOverlapsResponseDto"];
export type SaveBpHolidayInput = Schemas["SaveBpHolidayDto"];
export type UpdateBpHolidayInput = Schemas["UpdateBpHolidayDto"];
export type CheckBpHolidayOverlapsInput = Schemas["CheckBpHolidayOverlapsDto"];

const json = async (method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /bp-holidays?year&month — 계산한 날짜마다 한 줄(날짜순, 같은 날은 전체 점포 먼저 · 등록 순서)과 그 달의 공식 휴일. */
export async function getBpHolidays(year: number, month: number): Promise<BpHolidayList> {
  return request(bpHolidaysApiPath({ year, month }), await json("GET"));
}

/** GET /bp-holidays/{id}?date — 상세. date 는 「다음 날짜」의 기준(없으면 오늘). 없는 · 지운 · 볼 수 없는 휴일은 404. */
export async function getBpHoliday(id: number, date: string | null): Promise<BpHolidayDetail> {
  return request(`/bp-holidays/${id}${date ? `?${new URLSearchParams({ date })}` : ""}`, await json("GET"));
}

/** GET /bp-holidays/histories?from&to&page&pageSize — 이력이 생긴 날짜(한국)로 찾는다. 지운 휴일도 여기는 나온다. */
export async function getBpHolidayHistories(q: { from: string; to: string; page: number }): Promise<BpHolidayHistoryList> {
  const search = new URLSearchParams({ from: q.from, to: q.to, page: String(q.page), pageSize: String(BP_HOLIDAY_HISTORY_PAGE_SIZE) });
  return request(`/bp-holidays/histories?${search}`, await json("GET"));
}

/** POST /bp-holidays/overlaps — 저장 전 겹치는 휴일 요약. 저장은 막지 않는다(공식 휴일은 보지 않는다). */
export async function checkBpHolidayOverlaps(input: CheckBpHolidayOverlapsInput): Promise<BpHolidayOverlaps> {
  return request("/bp-holidays/overlaps", await json("POST", input));
}

/** POST /bp-holidays — 시작일은 오늘 이후. */
export async function createBpHoliday(input: SaveBpHolidayInput): Promise<{ bpHolidayId: number }> {
  return request("/bp-holidays", await json("POST", input));
}

/** PUT /bp-holidays/{id} — 양식 전체. 진행 중이면 일정 칸은 읽은 값 그대로 보내야 한다(바꾸면 409). 읽은 updatedAt 이 낡으면 409. */
export async function updateBpHoliday(id: number, input: UpdateBpHolidayInput): Promise<void> {
  await request(`/bp-holidays/${id}`, await json("PUT", input));
}

/** POST /bp-holidays/{id}/terminate — 어제(한국 날짜)로 끝낸다. 되돌리지 않는다. */
export async function terminateBpHoliday(id: number, updatedAt: string): Promise<void> {
  await request(`/bp-holidays/${id}/terminate`, await json("POST", { updatedAt }));
}

/**
 * DELETE /bp-holidays/{id}?updatedAt — 논리 삭제. 시작일이 오늘 이후인 휴일만(지난 날짜가 있으면 강제 종료).
 * 수정 · 강제 종료처럼 상세에서 읽은 updatedAt 을 쿼리로 보낸다 — 그사이 고친 휴일이면 409(api DeleteBpHolidayQueryDto).
 */
export async function deleteBpHoliday(id: number, updatedAt: string): Promise<void> {
  await request(`/bp-holidays/${id}?${new URLSearchParams({ updatedAt })}`, await json("DELETE"));
}
