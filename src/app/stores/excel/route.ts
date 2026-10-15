import { errorMessageOf } from "@/lib/download";
import { getStoresExcel } from "@/lib/stores";
import { parseStoresQuery } from "../stores-query";

// 점포 목록 엑셀 내려받기 중계. 브라우저는 api 토큰을 모르므로 이 경로가 서버에서 토큰을 붙여 GET /stores/excel 을 부르고,
// 파일은 그대로 흘려보낸다(Content-Length 를 넘겨 화면이 받은 비율을 그린다). 조건은 목록 주소와 같은 쿼리를 읽는다.
// 실패는 { message } JSON 으로 — api 의 상태(400 1만 건 이상 · 429 1분 제한 · 403 권한)는 그대로, 조건이 비면 400, api 주소 설정이 없으면 500, 연결 실패는 502.
// 세션이 없으면 토큰 없이 부르므로 api 가 401 을 주고, 그 상태를 그대로 넘긴다.
const FAILED = "엑셀 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";

export async function GET(request: Request) {
  const query = parseStoresQuery(Object.fromEntries(new URL(request.url).searchParams));
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
    return Response.json({ message: FAILED }, { status: misconfigured ? 500 : 502 });
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    if (response.status >= 500) console.error("점포 엑셀 api 오류", response.status, body);
    return Response.json({ message: errorMessageOf(body, FAILED) }, { status: response.status });
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  // 압축된 응답이면 fetch 가 풀어서 주는데 Content-Length 는 압축된 크기다 — 넘기면 화면이 받은 크기와 맞지 않아 잘린 것으로 본다
  const names = response.headers.get("Content-Encoding") ? ["Content-Type", "Content-Disposition"] : ["Content-Type", "Content-Disposition", "Content-Length"];
  for (const name of names) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: 200, headers });
}
