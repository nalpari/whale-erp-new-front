import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { authHeaders, requestRaw, SESSION_COOKIE } from "@/lib/api";
import { POST_BASE, postIdOf, SESSION_EXPIRED } from "@/lib/community-view";
import { sameOrigin } from "@/lib/paper-request";

// 공지사항 등록 · 수정(#276)의 창구. 화면이 multipart(api 의 텍스트 칸 + files, 수정이면 postId)를 보내면 쿠키의 접근 토큰을 붙여
// api 의 POST /platform-notices(postId 가 있으면 PUT /platform-notices/:postId)로 넘긴다. FAQ 는 첨부가 없어 서버 액션(JSON)이다.
// 서버 액션이 아니라 라우트 핸들러인 것은 본문 크기 때문이다 — 첨부가 5개 · 하나에 10MB 라 서버 액션 한도(next.config 6MB)를 넘는다(종이 계약 등록과 같다).
// 성공하면 api 상세를 그대로, 실패하면 화면에 보일 { messages } 를 api 와 같은 상태 코드로 준다.

const SERVER_DOWN = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요";
const fail = (status: number, ...messages: string[]) => NextResponse.json({ messages }, { status });

export async function POST(req: NextRequest) {
  // 상태를 바꾸는 라우트 핸들러라 다른 출처의 요청은 막는다(서버 액션과 같은 기준, lib/paper-request.ts).
  if (!sameOrigin(req.headers.get("origin"), req.headers.get("x-forwarded-host"), req.headers.get("host"))) return fail(403, "허용되지 않은 요청입니다");
  const headers = await authHeaders();
  if (!headers.Authorization) return fail(401, SESSION_EXPIRED);
  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    // 본문이 proxy 한도(next.config proxyClientMaxBodySize)를 넘어 잘려도 여기로 온다.
    console.warn("공지사항 저장 본문을 읽지 못했습니다", e);
    return fail(400, "보낸 내용을 읽지 못했습니다. 첨부가 너무 크면 줄여서 다시 저장해 주세요");
  }
  const rawId = form.get("postId");
  form.delete("postId");
  // 경로에 넣는 id — 화면 밖에서 직접 부를 수 있어 api 의 다른 경로로 새지 않게 막는다.
  const postId = rawId === null ? null : postIdOf(rawId);
  if (rawId !== null && postId === null) return fail(404, "게시물을 찾을 수 없습니다");

  let response: Response;
  try {
    response = await requestRaw(postId ? `${POST_BASE.NOTICE}/${postId}` : POST_BASE.NOTICE, { method: postId ? "PUT" : "POST", headers, body: form });
  } catch (e) {
    console.error("공지사항 저장 연결 실패", e);
    return fail(502, SERVER_DOWN);
  }
  const body: unknown = await response.json().catch(() => null);
  if (response.ok) {
    // 목록 · 수정 화면을 모두 새로 그리게 한다(수정은 [id] 동적 경로라 layout 단위로 비운다).
    revalidatePath(POST_BASE.NOTICE, "layout");
    if (body) return NextResponse.json(body);
    // 저장은 됐는데 상세를 읽지 못했다 — 실패로 보여 다시 누르면 같은 공지가 또 생기므로 목록에서 확인하게 한다.
    console.error("공지사항 저장 응답을 읽지 못했습니다", response.status);
    return fail(502, "저장했지만 결과를 읽지 못했습니다. 목록에서 저장된 내용을 확인해 주세요");
  }

  const message = (body as { message?: unknown } | null)?.message;
  const texts = Array.isArray(message) ? message.map(String) : typeof message === "string" ? [message] : [`요청이 실패했습니다 (HTTP ${response.status})`];
  // 5xx 는 Nest 영문 문구라 연결 문구로 바꾼다(BFF 와 같은 규칙). 503(저장소 없음 · 저장 지연 · 첨부 저장 실패)은 api 문장이 한글이라 그대로 둔다.
  if (response.status >= 500) console.error("공지사항 저장 실패", response.status, body);
  const res = fail(response.status, ...(response.status === 401 ? [SESSION_EXPIRED] : response.status >= 500 && response.status !== 503 ? [SERVER_DOWN] : texts));
  // 토큰이 끊겼다. 지워야 /login 이 「로그인한 채 오면 홈으로」로 되돌려 보내지 않는다(BFF 와 같다).
  if (response.status === 401) res.cookies.delete(SESSION_COOKIE);
  return res;
}
