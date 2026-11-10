// 브라우저에서 api 를 부를 때 쓴다. /api/* (src/app/api/[...path]/route.ts)가 토큰을 붙여 대신 부른다.
import { BP_HEADER, bpOfPath } from "./bp-path";
import { notifySessionExpired } from "./session-expiry";

/** api 403 「서비스 이용을 위해 비밀번호를 변경해 주세요.」를 받으면 window 에 보내는 이벤트. SessionGate 가 강제 변경 팝업을 다시 띄운다. */
export const PASSWORD_REQUIRED_EVENT = "whale-erp:password-required";
// api src/auth/access-messages.ts PASSWORD_CHANGE_REQUIRED_MESSAGE(2026-10-14)와 같은 문구 — retirement.ts 와 같다
const PASSWORD_REQUIRED_MESSAGE = "서비스 이용을 위해 비밀번호를 변경해 주세요.";
/** api ACCOUNT_UNAVAILABLE_MESSAGE 와 같은 문구 — 사용중지 · 탈퇴 계정의 403. 받으면 로그아웃한다(SessionGate). */
const ACCOUNT_UNAVAILABLE_MESSAGE = "사용할 수 없는 계정입니다. 관리자에게 문의해 주세요.";

export class BffError extends Error {
  constructor(
    /** 0 은 연결 실패 */
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function bff<T>(path: string): Promise<T> {
  let response: Response;
  try {
    // 탭 BP 는 브라우저 주소(/bp/{id})에서 읽는다 — rewrite 와 상관없이 주소창의 값이다. 없으면 api 가 소속 BP 로 동작한다.
    const bp = bpOfPath(location.pathname);
    response = await fetch(`/api${path}`, { cache: "no-store", headers: bp === null ? undefined : { [BP_HEADER]: String(bp) } });
  } catch (e) {
    console.warn("BFF 연결 실패", path, e); // 오프라인·중단 등 원인은 화면 문구에 안 보이므로 남긴다
    throw new BffError(0, "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  }
  if (response.ok) return (await response.json()) as T;
  // 로그인이 끊겼다(proxy · BFF 가 쿠키를 지웠다) — 「로그인 만료」 팝업 하나를 띄운다. 부른 화면은 아래 BffError 로 지금처럼 실패를 받는다.
  if (response.status === 401) notifySessionExpired();
  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: unknown } | null)?.message;
  if (response.status === 403 && typeof message === "string" && message.startsWith(PASSWORD_REQUIRED_MESSAGE))
    dispatchEvent(new Event(PASSWORD_REQUIRED_EVENT));
  throw new BffError(response.status, typeof message === "string" ? message : `요청이 실패했습니다 (HTTP ${response.status})`);
}

/** 비밀번호 강제 변경 전이라는 403 인가 — 바꾸면 풀리는 거절이라 맞추기를 멈추지 않는다(SessionGate). */
export const isPasswordRequired = (e: unknown): boolean =>
  e instanceof BffError && e.status === 403 && e.message.startsWith(PASSWORD_REQUIRED_MESSAGE);

/** 계정을 쓸 수 없게 됐다는 403 인가(사용중지 · 탈퇴) — 권한 없음 403 과 가른다. */
export const isAccountUnavailable = (e: unknown): boolean =>
  e instanceof BffError && e.status === 403 && e.message.startsWith(ACCOUNT_UNAVAILABLE_MESSAGE);

// 로그아웃 호출(signOut)은 node --test 로 시험하려고 sign-out.ts 에 두고 여기서 다시 내보낸다.
export { signOut } from "./sign-out.ts";
