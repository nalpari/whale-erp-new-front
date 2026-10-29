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

// api 는 409 하나로 「만드는 중」과 「만들지 못함(FAILED)」을 함께 알린다 — 상태 값이 따로 없어 문구 머리로 가른다
// (api excel-exports.service.ts download). bff.ts 가 비밀번호 변경 403 을 문구 머리로 가르는 것과 같은 방식이다.
const EXCEL_FAILED_PREFIX = "엑셀 파일을 만들지 못했습니다";
// bff.ts PASSWORD_REQUIRED_MESSAGE 와 같은 문구 — 이 모듈은 node --test 가 바로 읽어 import 하지 않는다
const PASSWORD_REQUIRED_PREFIX = "비밀번호를 변경한 뒤 이용할 수 있습니다";

/**
 * api GET /excel-downloads/:id 실패를 화면 안내로. retry 는 [다시 받기]를 둘지 —
 * 404 없음 · 남의 것 · 바로 받기, 410 기한 지남, 409 만들지 못함, 403 화면 권한 잃음은 다시 해도 같으니 두지 않는다.
 * 409 만드는 중(안내 색) · 403 비밀번호 변경 필요 · 연결 실패 · 5xx 는 둔다. 비밀번호를 바꾸면 SessionGate 가 이 화면을 다시 열어
 * 바로 받는다(passwordChanged → returnPathOf) — 다시 받기는 강제 변경 팝업이 다시 뜨게 하는 길로 남겨 둔다.
 */
export function failureOf(status: number, message: string): Failure {
  if (status === 404) return { tone: "risk", title: NOT_FOUND, detail: NOT_FOUND_DETAIL, retry: false };
  if (status === 410) return { tone: "risk", title: EXPIRED, retry: false };
  if (status === 409)
    return message.startsWith(EXCEL_FAILED_PREFIX) ? { tone: "risk", title: message, retry: false } : { tone: "info", title: message, retry: true };
  if (status === 403 && message.startsWith(PASSWORD_REQUIRED_PREFIX)) return { tone: "risk", title: message, retry: true };
  if (status === 0 || status >= 500) return { tone: "risk", title: "파일 주소를 받지 못했습니다. 잠시 후 다시 시도해 주세요", retry: true };
  return { tone: "risk", title: message, retry: false };
}
