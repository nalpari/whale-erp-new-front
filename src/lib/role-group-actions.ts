import { ApiError } from "./api";

// 권한 그룹 화면(플랫폼 권한 관리 · BP 권한 그룹 관리)의 server action 이 같이 쓰는 결과 모양과 오류 문구.

/**
 * 실패 결과. status 가 있으면 api 가 응답했다(4xx 거절 · 5xx 실패 — 저장은 한 트랜잭션이라 5xx 면 반영되지 않았다).
 * status 가 없으면 응답을 받지 못했다(연결 끊김 · 시간 초과) — 쓰기였다면 처리됐을 수도 있어, 화면은 최신 정보를 다시 받고 확인하게 한다.
 */
export type ActionFailure = { ok: false; status?: number; message: string };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFailure;

/**
 * api 오류를 화면 문구로. 이 api 들은 400(형식 · 줄 수 없는 칸 · 대체 권한) · 403(권한 · 본인 연결) · 404(없거나 지운 권한) ·
 * 409(이름 중복 · 동시 수정 · 고정 권한) 를 한국어로 알리므로 그대로 보인다. 401 은 고정 문구로, 5xx 는 상태를 실어 일반 문구로,
 * 응답을 못 받은 것은 상태 없이 — 쓰기(wrote)면 「결과를 확인하지 못했다」, 읽기면 「실패했다」로 알린다. subject 는 로그에만 쓴다.
 */
export function failureOf(error: unknown, subject: string, what: string, wrote = true): ActionFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if ([400, 403, 404, 409].includes(error.status)) return { ok: false, status: error.status, message: error.message };
    console.error(`${subject} ${what} 실패`, error);
    return { ok: false, status: error.status, message: `${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.` };
  }
  console.error(`${subject} ${what} 응답 없음`, error);
  return {
    ok: false,
    message: wrote ? `${what} 결과를 확인하지 못했습니다. 최신 정보를 다시 받았으니 처리됐는지 확인해 주세요.` : `${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
  };
}

export const validId = (id: number) => Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;

// api 가 받는 메뉴 목록 상한(ArrayMaxSize)
const MENUS_MAX = 1000;

/** 메뉴 목록이 api 로 보낼 수 있는 모양인가. 아니면 화면에 보일 실패를 돌려준다. server action 은 공개 엔드포인트라 다시 본다. */
export function menusFailure(menus: unknown): ActionFailure | null {
  if (!Array.isArray(menus)) return { ok: false, status: 400, message: "메뉴 목록이 올바르지 않습니다" };
  if (menus.length > MENUS_MAX) return { ok: false, status: 400, message: "한 번에 저장할 수 있는 메뉴 수를 넘었습니다" };
  return null;
}
