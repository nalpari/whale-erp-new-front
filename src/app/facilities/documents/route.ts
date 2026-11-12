import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { authHeaders, requestRaw, SESSION_COOKIE } from "@/lib/api";
import { SESSION_EXPIRED } from "@/lib/action-failure";
import { sameOrigin } from "@/lib/paper-request";
import { DOCUMENT_KINDS, type FacilityDocumentKind } from "../facility-form-model";

// 시설물 · 장비 문서 올리기 · 바꾸기 창구. 화면이 multipart(facilityId · kind · file)를 보내면 쿠키의 접근 토큰과 탭 BP(proxy 가 실은
// X-Bp-Code-Id)를 붙여 api 의 PUT /facilities/:id/documents/:kind 로 넘긴다. 등록 화면은 등록 응답의 facilityId 로 종류마다 한 번씩 부른다.
// 서버 액션이 아니라 라우트 핸들러인 것은 본문 크기 때문이다 — 문서가 10MB 까지라 서버 액션 한도(next.config 6MB)를 넘는다(공지사항 저장과 같다).
// 화면은 탭 BP 주소(/bp/{id}/facilities/documents)로 불러야 proxy 가 헤더를 싣는다. 성공하면 204, 실패하면 { messages } 를 api 와 같은 상태 코드로 준다.

const SERVER_DOWN = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
const fail = (status: number, ...messages: string[]) => NextResponse.json({ messages }, { status });
const idOf = (v: FormDataEntryValue | null) => (typeof v === "string" && /^[1-9]\d{0,9}$/.test(v) && Number(v) <= 2_147_483_647 ? Number(v) : null);

export async function POST(req: NextRequest) {
  // 상태를 바꾸는 라우트 핸들러라 다른 출처의 요청은 막는다(서버 액션과 같은 기준, lib/paper-request.ts)
  if (!sameOrigin(req.headers.get("origin"), req.headers.get("x-forwarded-host"), req.headers.get("host"))) return fail(403, "허용되지 않은 요청입니다.");
  const headers = await authHeaders();
  if (!headers.Authorization) return fail(401, SESSION_EXPIRED);
  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    // 본문이 proxy 한도(paper-request.ts 의 bodyLimitOf)를 넘어 잘려도 여기로 온다
    console.warn("시설물 문서 본문을 읽지 못했습니다", e);
    return fail(400, "보낸 파일을 읽지 못했습니다. 10MB 이하 파일인지 확인해 주세요.");
  }
  // 경로에 넣는 값 — 화면 밖에서 직접 부를 수 있어 api 의 다른 경로로 새지 않게 막는다
  const facilityId = idOf(form.get("facilityId"));
  const kind = form.get("kind");
  const file = form.get("file");
  if (facilityId === null) return fail(404, "시설물·장비를 찾을 수 없습니다.");
  if (typeof kind !== "string" || !DOCUMENT_KINDS.includes(kind as FacilityDocumentKind)) return fail(404, "문서 종류를 찾을 수 없습니다.");
  if (!(file instanceof File) || file.size === 0) return fail(400, "올릴 파일을 선택해 주세요.");

  const body = new FormData();
  body.append("file", file, file.name);
  let response: Response;
  try {
    response = await requestRaw(`/facilities/${facilityId}/documents/${kind}`, { method: "PUT", headers, body });
  } catch (e) {
    console.error("시설물 문서 올리기 연결 실패", { facilityId, kind }, e);
    return fail(502, SERVER_DOWN);
  }
  if (response.ok) {
    // 저장은 끝났다 — 화면 갱신이 실패해도 성공으로 돌려준다(서버 액션 refresh 와 같다). 실패로 알리면 저장된 문서를 「반영 못 함」으로 센다
    try {
      revalidatePath("/facilities", "layout");
    } catch (error) {
      console.error("시설물 화면 갱신 실패", { facilityId, kind }, error);
    }
    return new NextResponse(null, { status: 204 });
  }

  const resBody: unknown = await response.json().catch(() => null);
  const message = (resBody as { message?: unknown } | null)?.message;
  const texts = Array.isArray(message) ? message.map(String) : typeof message === "string" ? [message] : [`요청이 실패했습니다 (HTTP ${response.status})`];
  // 5xx 는 Nest 영문 문구라 연결 문구로 바꾼다. 503(저장소 없음)은 api 문장이 한글이라 그대로 둔다
  if (response.status >= 500) console.error("시설물 문서 올리기 실패", { facilityId, kind, status: response.status }, resBody);
  const res = fail(response.status, ...(response.status === 401 ? [SESSION_EXPIRED] : response.status >= 500 && response.status !== 503 ? [SERVER_DOWN] : texts));
  // 토큰이 끊겼다 — 지워야 /login 이 「로그인한 채 오면 홈으로」로 되돌려 보내지 않는다(BFF 와 같다)
  if (response.status === 401) res.cookies.delete(SESSION_COOKIE);
  return res;
}
