import { NextResponse, type NextRequest } from "next/server";
import { authHeaders, requestRaw, SESSION_COOKIE } from "@/lib/api";
import { SESSION_EXPIRED } from "@/lib/action-failure";
import { BULK_ACTIONS, BULK_BUSY_CODE, isBulkAction, isBulkBusy, isBulkResource } from "@/lib/bulk-upload";
import { errorMessageOf } from "@/lib/download";
import { sameOrigin } from "@/lib/paper-request";

// 엑셀 일괄 등록 공통 중계(src/lib/bulk-upload.ts). 화면(BulkUploadDialog)이 /api/bulk/{자원}/{동작}을 부르면 쿠키의 접근 토큰과
// 탭 BP(브라우저가 실은 x-bp-code-id — proxy 가 숫자일 때만 남긴다)를 붙여 api 의 /{자원}/bulk-* 로 넘긴다.
//   GET  template    → GET  /{자원}/bulk-template      양식 .xlsx 를 그대로 흘려보낸다
//   POST validations → POST /{자원}/bulk-validations   multipart file → 미리보기 JSON
//   POST error-file  → POST /{자원}/bulk-error-file    multipart file → 오류 사유를 더한 .xlsx
//   POST register    → POST /{자원}/bulk               multipart file → { createdCount }
// BFF(/api/[...path])는 조회 JSON 만 열어 파일을 올리거나 받을 수 없어 따로 둔다. 자원 · 동작은 목록 안의 것만 받는다.
// 실패는 { message } 를 api 와 같은 상태로 준다 — 5xx 는 Nest 영문 문구라 연결 문구로 바꾼다(요청 몰림 503 + BULK_BUSY 만 한글 문구 · code 그대로).

const SERVER_DOWN = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

async function relay(req: NextRequest, ctx: RouteContext<"/api/bulk/[resource]/[action]">, method: "GET" | "POST") {
  const { resource, action } = await ctx.params;
  if (!isBulkResource(resource) || !isBulkAction(action) || BULK_ACTIONS[action].method !== method) return fail(404, "찾을 수 없는 경로입니다.");
  // 상태를 바꾸는 요청은 다른 출처를 막는다(서버 액션과 같은 기준). 양식 내려받기(GET)는 읽기만 한다
  if (method === "POST" && !sameOrigin(req.headers.get("origin"), req.headers.get("x-forwarded-host"), req.headers.get("host"))) return fail(403, "허용되지 않은 요청입니다.");
  const headers = await authHeaders();
  if (!headers.Authorization) return fail(401, SESSION_EXPIRED);

  let body: FormData | undefined;
  if (method === "POST") {
    let form: FormData;
    try {
      form = await req.formData();
    } catch (e) {
      console.warn("일괄 등록 본문을 읽지 못했습니다", { resource, action }, e);
      return fail(400, "보낸 파일을 읽지 못했습니다. 파일을 다시 골라 주세요.");
    }
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return fail(400, "올릴 파일을 선택해 주세요.");
    body = new FormData();
    body.append("file", file, file.name);
  }

  let response: Response;
  try {
    response = await requestRaw(`/${resource}/${BULK_ACTIONS[action].path}`, { method, headers, body });
  } catch (e) {
    console.error("일괄 등록 연결 실패", { resource, action }, e);
    return fail(502, SERVER_DOWN);
  }

  if (!response.ok) {
    const resBody: unknown = await response.json().catch(() => null);
    if (response.status >= 500) console.error("일괄 등록 api 오류", { resource, action, status: response.status }, resBody);
    // 요청 몰림(503 + BULK_BUSY)만 api 문구와 code 를 그대로 넘긴다 — 화면이 code 로 「저장 안 됨」을 확정한다. code 없는 503 은 다른 5xx 와 같다
    const busy = isBulkBusy(response.status, resBody);
    const message = response.status === 401 ? SESSION_EXPIRED : response.status >= 500 && !busy ? SERVER_DOWN : errorMessageOf(resBody, `요청이 실패했습니다 (HTTP ${response.status})`);
    const res = busy ? NextResponse.json({ message, code: BULK_BUSY_CODE }, { status: 503 }) : fail(response.status, message);
    // 토큰이 끊겼다 — 지워야 /login 이 「로그인한 채 오면 홈으로」로 되돌려 보내지 않는다(BFF 와 같다)
    if (response.status === 401) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  // 파일(양식 · 오류 파일)은 본문을 그대로, JSON(미리보기 · 등록 결과)도 그대로 흘려보낸다
  const out = new Headers({ "Cache-Control": "no-store" });
  for (const name of ["Content-Type", "Content-Disposition"]) {
    const value = response.headers.get(name);
    if (value) out.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers: out });
}

export const GET = (req: NextRequest, ctx: RouteContext<"/api/bulk/[resource]/[action]">) => relay(req, ctx, "GET");
export const POST = (req: NextRequest, ctx: RouteContext<"/api/bulk/[resource]/[action]">) => relay(req, ctx, "POST");
