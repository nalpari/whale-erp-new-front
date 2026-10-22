import { NextResponse, type NextRequest } from "next/server";
import { homeOf, isPlatformRole, isPublicPath, redirectsSignedIn } from "@/lib/auth-routes";
import { BP_HEADER, bpRouteOf, stripBp } from "@/lib/bp-path";
import { answersWith401, TOO_LARGE, tooLarge } from "@/lib/paper-request";
import {
  ACCESS_TOKEN_TTL_MS,
  parseSession,
  SESSION_COOKIE,
  sessionCookie,
  type AdminRefreshResponse,
  type Session,
} from "@/lib/session";

// 쿠키만 보는 가벼운 확인(Next 16 authentication 가이드의 optimistic check). 데이터 권한은 api 가 토큰으로 다시 본다.
// - 공개 경로가 아닌데 세션이 없으면 /login
// - 접근 토큰을 받은 지 10분이 지났으면(만료 50분 전부터) 갱신해 쿠키를 다시 쓴다. 갱신이 401 이면 /login, 그 밖의 실패는 토큰이 남아 있는 동안 현재 쿠키로 계속
// - BP·가맹 계정이 플랫폼 화면에 오는 것은 주소가 아니라 SessionGate 가 탭 서비스의 메뉴로 막는다. 플랫폼 계정은 ERP 에도 들어간다(F-TLJOCK)
// - 로그인한 채 /login · /find 에 오면 자기 홈
// - 탭 BP 주소 /bp/{id}/... 는 헤더 x-bp-code-id 를 붙여 옛 경로로 rewrite 한다. BP·가맹 계정의 남의 BP 주소는 소속 BP 로 보낸다(bpRoute)
// 정책은 「갱신 토큰은 마지막 사용부터 1시간」(쓰는 동안은 끊기지 않는다). api 세션은 갱신할 때만 연장되므로,
// 만료 직전에만 갱신하면 계속 쓰던 사람도 1시간마다 끊긴다. 일찍 갱신해 마지막 요청부터 50~60분 동안 유지한다.
// 알려진 한계: 마지막 갱신 뒤 50분 넘게 서버 액션만 보내면 갱신이 없어 60분에 로그아웃된다(지금은 감수).
const REFRESH_EARLY_MS = 50 * 60_000;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let session = parseSession(req.cookies.get(SESSION_COOKIE)?.value);
  // proxyClientMaxBodySize(51MB)는 모든 경로에 걸린다 — 본문을 다 받기 전에 경로별 상한으로 막는다(paper-request.ts 의 bodyLimitOf). 업로드 창구에 길이 없이 나눠 보낸 본문도 막는다.
  // 받는 화면이 공지사항 저장은 messages, 종이 계약은 error 를 읽어 둘 다 싣는다.
  // 탭 BP 주소(/bp/{id}/contracts/paper)로 부른 창구도 그 경로의 상한을 받게 접두를 떼고 본다(toLogin 의 answersWith401 과 같다).
  if (tooLarge(stripBp(pathname), req.headers.get("content-length"), req.headers.get("transfer-encoding"))) return NextResponse.json({ error: TOO_LARGE, messages: [TOO_LARGE] }, { status: 413 });

  if (isPublicPath(pathname)) {
    // 로그인한 채 로그인 전 홈 · 로그인 · 찾기에 오면 자기 홈으로 보낸다 — 조건은 redirectsSignedIn(auth-routes.ts).
    if (session && redirectsSignedIn(pathname, req.method, session)) return NextResponse.redirect(new URL(homeOf(session.roleTypeCode), req.url));
    // 공개 화면도 들어온 탭 BP 헤더는 버린다 — 헤더는 늘 proxy 가 주소에서 정한 값이다.
    req.headers.delete(BP_HEADER);
    return NextResponse.next({ request: { headers: req.headers } });
  }
  if (!session) return toLogin(req);

  const route = bpRoute(req, session);
  if (route instanceof URL) return NextResponse.redirect(route);
  // 요청 헤더(탭 BP · 갱신한 쿠키)를 바꿔 넘긴다. /bp/{id} 주소면 옛 경로(폴더)로 rewrite 한다 — 브라우저 주소는 그대로다.
  const pass = () => (route ? NextResponse.rewrite(route.rewrite, { request: { headers: req.headers } }) : NextResponse.next({ request: { headers: req.headers } }));

  if (session.accessTokenExpiresAt - REFRESH_EARLY_MS > Date.now()) return pass();
  // 서버 액션 요청은 갱신하지 않는다. 50분 일찍 갱신하므로 토큰은 아직 유효하고, 여기서 쿠키를 쓰면
  // 액션이 쓰는 쿠키(로그아웃의 삭제)와 같은 응답에 겹쳐 로그아웃이 무시될 수 있다.
  if (req.headers.has("next-action")) return pass();

  const refreshed = await refresh(session);
  if (refreshed === "unauthorized") return toLogin(req);
  if (!refreshed) {
    // 일찍 갱신하므로 토큰은 아직 살아 있을 수 있다. api 재시작·시간 초과·429 로 로그아웃시키지 말고 다음 요청에서 다시 시도한다.
    return session.accessTokenExpiresAt > Date.now() ? pass() : toLogin(req);
  }
  session = refreshed;
  const cookie = sessionCookie(session);
  // 이 요청의 서버 컴포넌트도 새 토큰을 읽게 요청 쿠키를 바꿔 넘기고(req.cookies.set 이 req.headers 의 Cookie 를 고친다), 브라우저에는 Set-Cookie 로 준다.
  req.cookies.set(SESSION_COOKIE, cookie.value);
  const res = pass();
  res.cookies.set(cookie);
  return res;
}

/** 탭 BP 주소(/bp/{id}/...) — 판정은 bpRouteOf. 요청 헤더를 고치고 돌려준다: 보낼 주소(URL) · rewrite 할 주소 · 그대로(null). */
function bpRoute(req: NextRequest, session: Session): URL | { rewrite: URL } | null {
  const { pathname, search } = req.nextUrl;
  const route = bpRouteOf({
    pathname,
    sent: req.headers.get(BP_HEADER),
    isGet: req.method === "GET",
    isAction: req.headers.has("next-action"),
    ownBpCodeId: session.bpCodeId,
    isPlatform: isPlatformRole(session.roleTypeCode),
  });
  req.headers.delete(BP_HEADER);
  if (route.header !== null) req.headers.set(BP_HEADER, route.header);
  if (route.redirect) return new URL(route.redirect + search, req.url);
  if (!route.rewrite) return null;
  const rewrite = req.nextUrl.clone();
  rewrite.pathname = route.rewrite;
  return { rewrite };
}

// "unauthorized": 갱신 토큰이 끝나 세션이 사라짐(401). null: 그 밖의 실패(상태 코드·시간 초과·네트워크·깨진 응답).
async function refresh(session: Session): Promise<Session | "unauthorized" | null> {
  const base = process.env.API_BASE_URL;
  if (!base) {
    console.error("토큰 갱신: API_BASE_URL 이 없다");
    return null;
  }
  try {
    const r = await fetch(`${base}/auth/admin/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000), // api 가 응답하지 않아도 갱신할 때 요청이 매달리지 않게 5초에서 끊는다.
    });
    if (r.status === 401) return "unauthorized";
    if (!r.ok) {
      console.warn("토큰 갱신 실패", r.status);
      return null;
    }
    const body = (await r.json()) as AdminRefreshResponse;
    if (typeof body.accessToken !== "string") {
      console.warn("토큰 갱신: 응답에 accessToken 이 없다");
      return null; // 깨진 응답으로 쿠키를 쓰지 않는다.
    }
    return { ...session, accessToken: body.accessToken, accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS };
  } catch (e) {
    console.warn("토큰 갱신 실패", e);
    return null; // 호출한 쪽이 토큰 만료 여부로 계속할지 로그아웃할지 가른다.
  }
}

// 쿠키를 지워야 /login 의 「로그인한 채 오면 홈으로」가 다시 돌려보내지 않는다.
// BFF(/api/*)와 종이 계약 등록(/contracts/paper)은 fetch 가 부르므로 로그인 화면 HTML 대신 401 을 준다 — 화면이 받아 /login 으로 보낸다.
// 리다이렉트를 주면 fetch 가 따라가 날인본을 실은 채 /login 으로 다시 POST 하고, 화면은 로그인으로 가지 못한다(answersWith401).
function toLogin(req: NextRequest) {
  // 탭 BP 주소(/bp/{id}/contracts/paper)로 부른 창구도 같은 판정을 받게 접두를 떼고 본다.
  const res = answersWith401(stripBp(req.nextUrl.pathname))
    ? NextResponse.json({ message: "로그인이 필요합니다" }, { status: 401 })
    : NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const config = {
  // 빌드 산출물·이미지 최적화·public/ 의 파일(아이콘·favicon, 비로그인 화면이 쓰는 guest 자산, 루트의 svg 등)은 건너뛴다.
  // guest/ 가 없으면 /signup·/login 처럼 세션 없이 보는 화면에서 비주얼 그림·푸터 로고가 /login 으로 307 리다이렉트된다
  // — /design/guest 샘플은 보는 사람이 이미 로그인돼 있어 드러나지 않았다(2026-10-15).
  // 확장자 제외는 루트 한 단계 파일만 — /staff-members/1.png 같은 앞으로의 동적 경로까지 열어 두면 안 된다.
  matcher: ["/((?!_next/static|_next/image|icons/|guest/|favicon.ico|[^/]+\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
