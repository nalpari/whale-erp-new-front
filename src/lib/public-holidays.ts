// 플랫폼 휴일 관리 데이터 접근(/public-holidays, 메뉴 MN000217). 조회 전용이다 — api 에 등록 · 수정 · 삭제 경로가 없다(S-DDGJKQ).
// 메뉴 조회 권한(플랫폼 계정만)은 api 가 판정한다. 화면은 권한이 없으면 공통 틀이 메뉴에서 숨기고 주소로 오면 돌려보낸다(SessionGate).
// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다.
import type { components } from "./api-types.generated";
import { authHeaders, request } from "./api";
import { publicHolidaysApiPath, type HolidayQuery } from "./public-holiday-view";

type Schemas = components["schemas"];
export type PublicHoliday = Schemas["PublicHolidayResponseDto"];
export type PublicHolidayList = Schemas["PublicHolidayListResponseDto"];

/**
 * GET /public-holidays?year=&month= — 캘린더면 그 달, 목록이면 그 해 전체(publicHolidaysApiPath). 날짜순, 페이지 없이.
 * synchronization 은 「최종 동기화」(어느 해든 마지막 성공)와 올해 · 다음 해 중 마지막 동기화가 실패한 연도다.
 */
export async function getPublicHolidays(query: HolidayQuery): Promise<PublicHolidayList> {
  return request(publicHolidaysApiPath(query), { headers: await authHeaders() });
}
