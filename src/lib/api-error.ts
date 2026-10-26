// api 오류와 그 판정. next/* 를 import 하지 않는다 — node --test 가 이 파일을 직접 읽는다. 화면은 api.ts 가 다시 내보낸 것을 쓴다.

// node --test 의 타입 지우기(strip-only)는 생성자 매개변수 속성(readonly status)을 받지 않아 칸을 따로 적는다.
export class ApiError extends Error {
  readonly status: number;
  /** 검증 실패(400)의 문장 목록. 배열이 아니면 message 하나다 — 화면이 줄마다 나눠 보일 때 쓴다. */
  readonly messages: string[];
  /** 응답 본문 그대로. 409 의 code · 목록처럼 message 말고도 화면이 쓸 칸이 있다 */
  readonly body: unknown;

  constructor(status: number, message: string, messages: string[] = [message], body: unknown = null) {
    super(message);
    this.status = status;
    this.messages = messages;
    this.body = body;
  }
}

/**
 * api 가 요청을 거절한 문장(BP 를 고르지 않음 400 · 다른 BP · 권한 없음 403 · 없는 BP 404) — 다시 시도해도 같으므로 화면은 오류 화면 대신
 * 이 문장을 보인다. 거절이 아니면 null: 서버 장애 · 응답 없음 · 401, 검증 실패 400(message 가 배열 — 주소 · 계약이 어긋난 결함),
 * 라우트가 없는 404(Nest 「Cannot GET …」 — api 배포가 어긋남). 탭 BP 주소로 옮긴 화면이 함께 쓴다.
 * 계약: 이 판정을 쓰는 조회 경로에서 api 가 문자열 하나로 내는 400 은 거절 문장뿐이어야 한다 — 다른 업무 400 을 더하면 띠로 가려지므로
 * 그때는 api 가 code 를 주고 그 값으로 가른다.
 */
export function deniedMessageOf(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const validation = error.status === 400 && Array.isArray((error.body as { message?: unknown } | null)?.message);
  const noRoute = error.status === 404 && error.message.startsWith("Cannot ");
  return [400, 403, 404].includes(error.status) && !validation && !noRoute ? error.message : null;
}

/** api 오류 본문의 업무 code(예: BIRTH_DATE_NOT_JOINED). 본문이 객체가 아니거나 code 가 문자열이 아니면 undefined. */
export function codeOf(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return undefined;
  const code = (body as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}
