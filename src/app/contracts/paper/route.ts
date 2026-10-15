import { NextResponse, type NextRequest } from "next/server";
import { getSession, requestRaw, SESSION_COOKIE } from "@/lib/api";
import { inProgressOf } from "../new/contract-form-model";

// 종이 계약 등록(CTR-23)의 창구. 화면이 multipart(data = 근로계약서 JSON, employmentContract 필수 · wageContract 선택)를 보내면
// 쿠키의 접근 토큰을 붙여 api 의 POST /contracts/paper(이어 쓰기면 contractId 를 실어 PUT /contracts/:contractId/paper)로 넘긴다.
// 서버 액션이 아니라 라우트 핸들러인 것은 본문 크기 때문이다 — 날인본은 하나에 10MB 라 서버 액션 한도(next.config 6MB)를 넘는다.
// 성공하면 { ok: true }, 실패하면 화면에 보일 { error, inProgress? } 를 api 와 같은 상태 코드로 준다(같은 점포 진행 중 계약은 409 CONTRACT_IN_PROGRESS).

const SERVER_DOWN = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요";
// 경로에 넣는 id — 1..2147483647 정수만. 화면 밖에서 직접 부를 수 있어 api 의 다른 경로로 새지 않게 막는다.
const isContractId = (raw: string) => /^[1-9][0-9]{0,9}$/.test(raw) && Number(raw) <= 2_147_483_647;

// 상태를 바꾸는 라우트 핸들러라 다른 출처의 요청은 막는다. 쿠키 sameSite lax 는 교차 사이트만 막고, 같은 등록 도메인의 다른 서브도메인은 막지 못한다
// (서버 액션이면 Next 가 하는 검사). 앞단 프록시가 Host 를 바꾸면 x-forwarded-host 를 본다 — Next 서버 액션과 같은 기준.
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "허용되지 않은 요청입니다" }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "보낸 내용을 읽지 못했습니다" }, { status: 400 });
  }
  const contractId = form.get("contractId");
  form.delete("contractId");
  if (contractId !== null && (typeof contractId !== "string" || !isContractId(contractId)))
    return NextResponse.json({ error: "근로계약을 찾을 수 없습니다" }, { status: 404 });

  let response: Response;
  try {
    response = await requestRaw(contractId ? `/contracts/${contractId}/paper` : "/contracts/paper", {
      method: contractId ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: form,
    });
  } catch (e) {
    console.error("종이 계약 등록 연결 실패", e);
    return NextResponse.json({ error: SERVER_DOWN }, { status: 502 });
  }
  if (response.ok) return NextResponse.json({ ok: true });

  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: unknown } | null)?.message;
  const text = Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : null;
  // 5xx 는 Nest 영문 문구라 연결 문구로 바꾼다(BFF 와 같은 규칙). 503(저장소 설정 없음)은 api 문장이 한글이라 그대로 둔다.
  const error = response.status >= 500 && response.status !== 503 ? SERVER_DOWN : (text ?? `요청이 실패했습니다 (HTTP ${response.status})`);
  if (response.status >= 500) console.error("종이 계약 등록 실패", response.status, body);
  const inProgress = response.status === 409 ? inProgressOf(body) : undefined;
  const res = NextResponse.json(inProgress ? { error, inProgress } : { error }, { status: response.status });
  // 토큰이 끊겼다. 지워야 /login 이 「로그인한 채 오면 홈으로」로 되돌려 보내지 않는다(BFF 와 같다).
  if (response.status === 401) res.cookies.delete(SESSION_COOKIE);
  return res;
}
