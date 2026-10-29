// 엑셀 내려받기 화면(/excel-downloads/{id})의 판정. node --test 가 직접 읽으므로 import 하지 않는다.

/** 남은 기한 문구 — 「3시간 12분 남음」 · 「12분 남음」 · 「1분 안에 끝남」. 지났거나 날짜가 깨졌으면 null */
export function remainingOf(expiresAt: string, now = Date.now()): string | null {
  const left = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(left) || left <= 0) return null;
  const minutes = Math.floor(left / 60_000);
  if (minutes < 1) return "1분 안에 끝남";
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}시간 ${minutes % 60}분 남음` : `${minutes}분 남음`;
}

export const EXPIRED = "기한이 지났습니다. 목록에서 다시 요청해 주세요";

export const NOT_FOUND = "파일을 찾을 수 없습니다";
/** 남의 요청도 404 다 — 공용 PC 에서 다른 계정으로 로그인한 채 메일 링크를 연 경우를 짚어 준다 */
export const NOT_FOUND_DETAIL = "엑셀을 요청한 계정으로 로그인했는지 확인해 주세요.";

export type Failure = { tone: "risk" | "info"; title: string; detail?: string; retry: boolean };

/**
 * api GET /excel-downloads/:id 실패를 화면 안내로. retry 는 [다시 받기]를 둘지 —
 * 404 없음 · 남의 것 · 바로 받기와 410 기한 지남은 다시 해도 같으니 두지 않는다. 409 만드는 중 · 실패와 연결 실패 · 5xx 는 둔다.
 * 409 는 대개 「아직 만드는 중」이라 실패 색이 아니라 안내 색이다.
 */
export function failureOf(status: number, message: string): Failure {
  if (status === 404) return { tone: "risk", title: NOT_FOUND, detail: NOT_FOUND_DETAIL, retry: false };
  if (status === 410) return { tone: "risk", title: EXPIRED, retry: false };
  if (status === 409) return { tone: "info", title: message, retry: true };
  if (status === 0 || status >= 500) return { tone: "risk", title: "파일 주소를 받지 못했습니다. 잠시 후 다시 시도해 주세요", retry: true };
  return { tone: "risk", title: message, retry: false };
}
