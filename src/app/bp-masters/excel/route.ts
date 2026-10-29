import { getBpMastersExcel } from "@/lib/bp-masters";
import { EXCEL_FAILED, relayExcelResponse } from "@/lib/download";
import { parseBpMastersQuery } from "../bp-masters-href";

// BP 마스터 계정 목록 엑셀 내려받기 중계(점포 엑셀 stores/excel/route.ts 와 같은 방식). 브라우저는 api 토큰을 모르므로
// 이 경로가 서버에서 토큰을 붙여 GET /bp-masters/excel 을 부르고 응답을 넘긴다(relayExcelResponse). 조건은 목록 주소와 같은 쿼리를 읽는다.
// 1만 건 미만은 파일, 이상은 202 예약 접수 JSON, 실패는 { message } 와 api 상태다. api 주소 설정이 없으면 500, 연결 실패는 502.

export async function GET(request: Request) {
  const { searchType, keyword, statuses, verification, statusNone } = parseBpMastersQuery(Object.fromEntries(new URL(request.url).searchParams));
  // 계정상태를 셋 다 껐으면(status=NONE) 받을 것이 없다 — 화면 버튼은 0건이라 막히지만, 주소로 직접 와도 전체를 내려보내지 않는다
  if (statusNone) return Response.json({ message: "받을 BP 가 없습니다." }, { status: 400 });

  let response: Response;
  try {
    response = await getBpMastersExcel({ searchType, keyword, statuses, verification });
  } catch (error) {
    const misconfigured = error instanceof Error && error.message.includes("API_BASE_URL");
    console.error(misconfigured ? "BP 엑셀 — api 주소 설정 없음" : "BP 엑셀 api 연결 실패", error);
    return Response.json({ message: EXCEL_FAILED }, { status: misconfigured ? 500 : 502 });
  }
  return relayExcelResponse(response, "BP 엑셀");
}
