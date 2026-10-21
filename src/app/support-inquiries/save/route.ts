import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { authHeaders, requestRaw, SESSION_COOKIE } from "@/lib/api";
import { SESSION_EXPIRED, SUPPORT_INQUIRY_BASE } from "@/lib/community-view";
import { sameOrigin } from "@/lib/paper-request";

// 고객지원 문의 등록(#284)의 창구. 화면이 multipart(문의 유형 · 제목 · 내용 + files)를 보내면 쿠키의 접근 토큰을 붙여
// api 의 POST /support-inquiries 로 넘긴다. 첨부가 5개 · 하나에 10MB 라 서버 액션 한도를 넘어 라우트 핸들러다(공지사항 저장과 같다).
// 성공하면 { inquiryId } 를, 실패하면 화면에 보일 { messages } 를 api 와 같은 상태 코드로 준다.

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
    console.warn("문의 등록 본문을 읽지 못했습니다", e);
    return fail(400, "보낸 내용을 읽지 못했습니다. 첨부가 너무 크면 줄여서 다시 등록해 주세요");
  }

  let response: Response;
  try {
    response = await requestRaw(SUPPORT_INQUIRY_BASE, { method: "POST", headers, body: form });
  } catch (e) {
    console.error("문의 등록 연결 실패", e);
    return fail(502, SERVER_DOWN);
  }
  const body: unknown = await response.json().catch(() => null);
  if (response.ok) {
    revalidatePath(SUPPORT_INQUIRY_BASE, "layout");
    if (body) return NextResponse.json(body);
    // 등록은 됐다 — 실패로 보여 다시 누르면 같은 문의가 또 생기므로 목록에서 확인하게 한다.
    console.error("문의 등록 응답을 읽지 못했습니다", response.status);
    return fail(502, "등록했지만 결과를 읽지 못했습니다. 목록에서 등록된 문의를 확인해 주세요");
  }

  const message = (body as { message?: unknown } | null)?.message;
  const texts = Array.isArray(message) ? message.map(String) : typeof message === "string" ? [message] : [`요청이 실패했습니다 (HTTP ${response.status})`];
  // 5xx 는 Nest 영문 문구라 연결 문구로 바꾼다. 503(저장소 없음 · 오류)은 api 문장이 한글이라 그대로 둔다.
  if (response.status >= 500) console.error("문의 등록 실패", response.status, body);
  const res = fail(response.status, ...(response.status === 401 ? [SESSION_EXPIRED] : response.status >= 500 && response.status !== 503 ? [SERVER_DOWN] : texts));
  if (response.status === 401) res.cookies.delete(SESSION_COOKIE);
  return res;
}
