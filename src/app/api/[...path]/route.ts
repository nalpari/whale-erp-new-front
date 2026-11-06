import { NextResponse, type NextRequest } from "next/server";
import { ApiError, bpHeader, getSession, request, SESSION_COOKIE } from "@/lib/api";

// 브라우저가 부르는 api 창구(BFF). 쿠키의 접근 토큰을 붙여 whale-erp-api 를 대신 부른다 — 토큰은 브라우저 스크립트에 나가지 않는다.
// 토큰 갱신과 세션 없음(401)은 proxy 가 먼저 처리한다.
// shortcut: 조회(GET)만 연다. 저장은 서버 액션이 한다 — 브라우저에서 BFF 로 저장할 일이 생기면 메서드를 더한다.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  // fetch 가 . · .. 를 접어 API_BASE_URL 의 경로 밖으로 나가지 않게 막는다.
  if (path.some((s) => s === "." || s === "..")) return NextResponse.json({ message: "잘못된 경로입니다." }, { status: 400 });
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  try {
    const body = await request<unknown>(`/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`, {
      // 탭 BP 는 브라우저(bff())가 주소에서 읽어 실었다 — proxy 가 숫자일 때만 남긴다
      headers: { Authorization: `Bearer ${session.accessToken}`, ...(await bpHeader()) },
    });
    return NextResponse.json(body);
  } catch (e) {
    if (!(e instanceof ApiError)) {
      console.error(e);
      return NextResponse.json({ message: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, { status: 502 });
    }
    // 5xx 는 Nest 영문 문구라 화면에 그대로 보이지 않게 연결 문구로 바꾼다(로그인 액션과 같은 규칙).
    if (e.status >= 500) console.error(e);
    const message = e.status >= 500 ? "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." : e.message;
    const res = NextResponse.json({ message }, { status: e.status });
    // 토큰이 끊겼다. 지워야 /login 이 「로그인한 채 오면 홈으로」로 되돌려 보내지 않는다.
    if (e.status === 401) res.cookies.delete(SESSION_COOKIE);
    return res;
  }
}
