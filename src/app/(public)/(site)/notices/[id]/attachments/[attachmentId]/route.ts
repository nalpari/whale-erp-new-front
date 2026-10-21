import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/api";
import { postIdOf } from "@/lib/community-view";
import { getPublicNoticeDownloadUrl } from "@/lib/public-posts";

// 비로그인 공지사항 첨부 내려받기(#293). api 가 주는 300초짜리 서명 주소로 보낸다 — 받으면 원래 파일 이름으로 저장된다.
// 링크(<a href>)로 여는 경로라 누를 때마다 새 주소를 받아 상세를 오래 열어 두어도 만료되지 않는다(계약 날인본 documents/route.ts 와 같다).
// 실패하면 상세로 돌려보내 안내를 띄운다 — 글 · 첨부가 없으면 ?download=missing(로그 없음), 그 밖은 ?download=failed. 공개 api 라 토큰을 싣지 않는다.
export async function GET(req: NextRequest, ctx: RouteContext<"/notices/[id]/attachments/[attachmentId]">) {
  const { id, attachmentId } = await ctx.params;
  const postId = postIdOf(id);
  const fileId = postIdOf(attachmentId);
  if (postId === null) return NextResponse.redirect(new URL("/notices", req.url));
  const back = (notice: "missing" | "failed") => NextResponse.redirect(new URL(`/notices/${postId}?download=${notice}`, req.url));
  if (fileId === null) return back("missing");
  try {
    return NextResponse.redirect(await getPublicNoticeDownloadUrl(postId, fileId));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return back("missing");
    console.error("비로그인 공지사항 첨부 주소 조회 실패", error);
    return back("failed");
  }
}
