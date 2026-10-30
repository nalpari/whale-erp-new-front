import { NextResponse, type NextRequest } from "next/server";
import { ApiError, authHeaders, request, SESSION_COOKIE } from "@/lib/api";
import type { DocumentNotice } from "../../document-notice";

// 계약서 파일 내려받기 — 종이 계약 날인본 · 임금계약서, 전자계약 처리 완료본 · 보낸 원본(WHALEERP-155). api 가 업무 범위를 본 뒤 주는 300초짜리 서명 주소로 보낸다 — 받으면 원래 파일 이름으로 저장된다.
// 상세 화면을 오래 열어 두어도 링크를 누를 때마다 새 주소를 받으므로 만료되지 않는다.
// 링크(<a href>)로 여는 경로라 JSON 을 주면 탭에 원문이 보인다. 실패하면 상세 화면으로 돌려보내 안내를 띄우고(?document=),
// 세션이 끊겼으면 쿠키를 지우고 로그인 화면으로 보낸다(paper/route.ts 와 같다).
const isId = (raw: string) => /^[1-9][0-9]{0,9}$/.test(raw) && Number(raw) <= 2_147_483_647;

export async function GET(req: NextRequest, ctx: RouteContext<"/contracts/[contractId]/documents/[contractDocumentId]">) {
  const { contractId, contractDocumentId } = await ctx.params;
  const back = (notice: DocumentNotice) =>
    NextResponse.redirect(new URL(isId(contractId) ? `/contracts/${contractId}?document=${notice}` : "/contracts", req.url));
  const toLogin = () => {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  };
  if (!isId(contractId) || !isId(contractDocumentId)) return back("missing");
  const headers = await authHeaders();
  if (!headers.Authorization) return toLogin();
  try {
    const { url } = await request<{ url: string }>(`/contracts/${contractId}/documents/${contractDocumentId}/download-url`, {
      headers,
    });
    return NextResponse.redirect(url);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return toLogin();
    if (e instanceof ApiError && (e.status === 403 || e.status === 404)) return back("missing");
    console.error("계약서 파일 내려받기 실패", e);
    return back(e instanceof ApiError && e.status === 503 ? "unavailable" : "failed");
  }
}
