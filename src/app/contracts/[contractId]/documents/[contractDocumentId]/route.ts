import { NextResponse, type NextRequest } from "next/server";
import { ApiError, getSession, request } from "@/lib/api";

// 종이 계약 날인본 내려받기. api 가 업무 범위를 본 뒤 주는 300초짜리 서명 주소로 보낸다 — 받으면 원래 파일 이름으로 저장된다.
// 상세 화면을 오래 열어 두어도 링크를 누를 때마다 새 주소를 받으므로 만료되지 않는다.
const isId = (raw: string) => /^[1-9][0-9]{0,9}$/.test(raw) && Number(raw) <= 2_147_483_647;

export async function GET(_req: NextRequest, ctx: RouteContext<"/contracts/[contractId]/documents/[contractDocumentId]">) {
  const { contractId, contractDocumentId } = await ctx.params;
  if (!isId(contractId) || !isId(contractDocumentId)) return NextResponse.json({ message: "파일을 찾을 수 없습니다" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "로그인이 필요합니다" }, { status: 401 });
  try {
    const { url } = await request<{ url: string }>(`/contracts/${contractId}/documents/${contractDocumentId}/download-url`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    return NextResponse.redirect(url);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    return NextResponse.json({ message: e.status >= 500 && e.status !== 503 ? "파일을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요" : e.message }, { status: e.status });
  }
}
