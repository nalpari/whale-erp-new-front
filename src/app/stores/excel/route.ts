import { EXCEL_FAILED, relayExcelResponse } from "@/lib/download";
import { getStoresExcel } from "@/lib/stores";
import { parseStoresQuery, scopeTypeMismatch, storeListQueryOf, withDefaultStatuses } from "../stores-query";

// 점포 목록 엑셀 내려받기 중계. 브라우저는 api 토큰을 모르므로 이 경로가 서버에서 토큰과 탭 BP(proxy 가 /bp/{id}/stores/excel 에서 넣은
// 헤더 — 화면은 이 주소로 부른다)를 붙여 GET /stores/excel 을 부르고 응답을 넘긴다(relayExcelResponse). 조건은 목록 주소와 같은 쿼리를 읽는다.
// 1만 건 미만은 파일, 이상은 202 예약 접수 JSON, 실패는 { message } 와 api 상태다. 조건이 비면 400, api 주소 설정이 없으면 500, 연결 실패는 502.
// 세션이 없으면 토큰 없이 부르므로 api 가 401 을 주고, 그 상태를 그대로 넘긴다.

export async function GET(request: Request) {
  // 화면이 점포상태를 늘 적어 보낸다(storesExcelHref). 없으면 기본값(폐점 제외)이다
  const parsed = withDefaultStatuses(parseStoresQuery(Object.fromEntries(new URL(request.url).searchParams)), false);
  if (scopeTypeMismatch(parsed)) return Response.json({ message: "상단 범위와 고른 점포유형이 겹치지 않습니다" }, { status: 400 });
  const query = storeListQueryOf(parsed);
  if (!query.statuses.length || !query.storeTypes.length) {
    return Response.json({ message: "점포상태 · 점포유형을 하나 이상 골라 주세요" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await getStoresExcel(query);
  } catch (error) {
    // 설정 오류(API_BASE_URL 없음)와 연결 실패를 로그에서 가른다 — 사용자에게는 같은 안내다
    const misconfigured = error instanceof Error && error.message.includes("API_BASE_URL");
    console.error(misconfigured ? "점포 엑셀 — api 주소 설정 없음" : "점포 엑셀 api 연결 실패", error);
    return Response.json({ message: EXCEL_FAILED }, { status: misconfigured ? 500 : 502 });
  }
  return relayExcelResponse(response, "점포 엑셀");
}
