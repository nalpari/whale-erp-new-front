// 브라우저에서 api 를 부를 때 쓴다. /api/* (src/app/api/[...path]/route.ts)가 토큰을 붙여 대신 부른다.
import { BP_HEADER, bpOfPath } from "./bp-path";

/** api 403 「서비스 이용을 위해 비밀번호를 변경해 주세요.」를 받으면 window 에 보내는 이벤트. SessionGate 가 강제 변경 팝업을 다시 띄운다. */
export const PASSWORD_REQUIRED_EVENT = "whale-erp:password-required";
// api src/auth/access-messages.ts PASSWORD_CHANGE_REQUIRED_MESSAGE(2026-10-14)와 같은 문구 — retirement.ts 와 같다
const PASSWORD_REQUIRED_MESSAGE = "서비스 이용을 위해 비밀번호를 변경해 주세요.";

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
    throw new BffError(0, "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요");
  }
  if (response.ok) return (await response.json()) as T;
  const body: unknown = await response.json().catch(() => null);
  const message = (body as { message?: unknown } | null)?.message;
  if (response.status === 403 && typeof message === "string" && message.startsWith(PASSWORD_REQUIRED_MESSAGE))
    dispatchEvent(new Event(PASSWORD_REQUIRED_EVENT));
  throw new BffError(response.status, typeof message === "string" ? message : `요청이 실패했습니다 (HTTP ${response.status})`);
}

/**
 * 로그아웃 서버 액션을 부른다. 성공하면 서버 액션의 redirect 로 /login 에 간다.
 * 액션 자체가 실패하면(연결 끊김) 쿠키가 남아 /login 이 다시 홈으로 돌려보내므로, 이동하지 않고 알린 뒤 false 를 돌려준다.
 */
export async function signOut(logout: () => Promise<void>): Promise<boolean> {
  try {
    await logout();
    return true;
  } catch (e) {
    console.error("로그아웃 실패", e);
    alert("로그아웃하지 못했습니다. 다시 시도해 주세요");
    return false;
  }
}
