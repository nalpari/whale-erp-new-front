// 파일 내려받기 응답 읽기. 엑셀 중계 경로(서버)와 엑셀 받기(클라이언트)가 함께 쓰고 node --test 가 직접 읽는다.

/** xlsx 의 Content-Type — 받은 응답이 이 형식이 아니면(로그인 페이지 HTML 등) 파일로 저장하지 않는다 */
export const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

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
