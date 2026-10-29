// 파일 내려받기 응답 읽기. 엑셀 중계 경로(서버)와 엑셀 받기(클라이언트)가 함께 쓰고 node --test 가 직접 읽는다.

/** xlsx 의 Content-Type — 받은 응답이 이 형식이 아니면(로그인 페이지 HTML 등) 파일로 저장하지 않는다 */
export const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** 엑셀을 만들지 못했을 때의 공통 문구 — 중계 경로와 화면이 같이 쓴다 */
export const EXCEL_FAILED = "엑셀 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";

/** 1만 건 이상 예약 접수(202)인데 api 문구가 없을 때의 안내 — api 문구(EXCEL_SCHEDULED_MESSAGE)처럼 링크 기한까지 한 번에 말한다 */
export const EXCEL_SCHEDULED = "1만 건이 넘어 파일을 만든 뒤 등록한 이메일로 내려받기 링크를 보내 드립니다. 링크는 다 만들어진 뒤 24시간 동안 요청한 본인만 쓸 수 있습니다.";

/**
 * 엑셀 중계 경로(점포 · BP 마스터 계정 목록)가 api 응답을 화면으로 넘긴다.
 * - 200 파일: 본문을 그대로 흘려보낸다(Content-Length 를 넘겨 화면이 받은 비율을 그린다).
 * - 202 1만 건 이상 예약 접수: { excelDownloadId, rowCount, message } 를 상태와 함께 그대로 — 화면은 파일로 저장하지 않고 안내만 띄운다.
 * - 실패: { message } 와 api 상태(400 이메일 없음 등 · 409 생성 중 · 429 1분 제한 · 503 예약 생성 불가 · 403 권한).
 */
export async function relayExcelResponse(response: Response, label: string): Promise<Response> {
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    if (response.status >= 500) console.error(`${label} api 오류`, response.status, body);
    return Response.json({ message: errorMessageOf(body, EXCEL_FAILED) }, { status: response.status });
  }
  if (response.status === 202) {
    const body: unknown = await response.json().catch(() => null);
    return Response.json(body ?? { message: EXCEL_SCHEDULED }, { status: 202, headers: { "Cache-Control": "no-store" } });
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  // 압축된 응답이면 fetch 가 풀어서 주는데 Content-Length 는 압축된 크기다 — 넘기면 화면이 받은 크기와 맞지 않아 잘린 것으로 본다
  const names = response.headers.get("Content-Encoding") ? ["Content-Type", "Content-Disposition"] : ["Content-Type", "Content-Disposition", "Content-Length"];
  for (const name of names) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: 200, headers });
}

/**
 * 실패 응답 본문의 문구. Nest 오류 형식 { message } 에서 꺼내고, 검증 실패처럼 문장 배열이면 이어 붙인다. 없으면 fallback.
 */
export function errorMessageOf(body: unknown, fallback: string): string {
  const message = (body as { message?: unknown } | null)?.message;
  const text = Array.isArray(message) ? message.map(String).join(", ") : message;
  return typeof text === "string" && text.trim() ? text : fallback;
}

/**
 * Content-Disposition 의 파일 이름. RFC 5987 의 filename*=UTF-8''… 를 먼저 보고(한글 이름), 없으면 filename="…".
 * 둘 다 없거나 깨졌으면 fallback.
 */
export function fileNameOfDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim());
    } catch {
      // 잘못 인코딩된 이름 — 아래 filename 으로 넘어간다
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header)?.[1]?.trim();
  return plain || fallback;
}

/** 받은 비율(0~100, 정수). 전체 크기를 모르면 null */
export function downloadPercent(received: number, total: number): number | null {
  if (!Number.isFinite(total) || total <= 0) return null;
  return Math.min(100, Math.floor((received / total) * 100));
}
