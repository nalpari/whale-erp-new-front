"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { createMenu, moveMenu, updateMenu, type CreatedMenu, type CreateMenuInput, type MoveMenuInput, type UpdateMenuInput } from "@/lib/platform-menus";

// 메뉴 등록 · 수정 · 옮기기. 실패하면 화면이 입력값(옮기기는 트리)을 그대로 두고 문구만 보인다.
// 메뉴 권한 · 플랫폼 계정 여부 · 3단계 · 자기 하위 · URL 겹침은 api 가 동작마다 본다(문구가 무엇이 막혔는지 말한다).
// server action 은 공개 엔드포인트라 id 가 int4 양의 정수인지 · 자리가 api 범위 안인지만 다시 본다. 로그인 판정도 api 가 한다.

const PATH = "/platform-menus";

/**
 * 실패 결과. status 가 있으면 api 가 거절했거나 처리하지 못했다(4xx · 500 — 쓰기는 한 트랜잭션이라 반영되지 않았다).
 * status 가 없으면 처리됐는지 모른다 — 응답을 받지 못했거나(연결 끊김 · 시간 초과) 앞단이 502 · 503 · 504 를 줬다(api 는 이미
 * 커밋했을 수 있다). 화면은 최신 정보를 다시 받고 확인하게 한다 — 등록은 양식을 닫아 같은 메뉴를 두 번 만들지 않는다.
 */
export type ActionFailure = { ok: false; status?: number; message: string };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFailure;

/**
 * api 오류를 화면 문구로. 이 api 는 400(형식 · 상위 · 3단계 · 자기 하위) · 403(권한) · 404(없거나 지운 메뉴 · 서비스) ·
 * 409(URL 겹침 · 동시 수정 · 코드 소진)를 한국어로 알리므로 그대로 보인다. 401 은 고정 문구로, 그 밖의 5xx 는 상태를 실어 일반 문구로,
 * 응답을 못 받았거나 502 · 503 · 504 면 상태 없이 「결과를 확인하지 못했다」로 알린다.
 */
function failureOf(error: unknown, what: string): ActionFailure {
  if (error instanceof ApiError && ![502, 503, 504].includes(error.status)) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if ([400, 403, 404, 409].includes(error.status)) return { ok: false, status: error.status, message: error.message };
    console.error(`플랫폼 메뉴 ${what} 실패`, error);
    return { ok: false, status: error.status, message: `${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.` };
  }
  console.error(`플랫폼 메뉴 ${what} 결과 모름`, error);
  return { ok: false, message: `${what} 결과를 확인하지 못했습니다. 최신 정보를 다시 받았으니 처리됐는지 확인해 주세요.` };
}

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND = { ok: false, status: 404, message: "메뉴를 찾을 수 없습니다" } satisfies ActionFailure;
const BAD_SPOT = { ok: false, status: 400, message: "옮길 자리가 올바르지 않습니다" } satisfies ActionFailure;
// api MovePlatformMenuDto 의 index 상한
const INDEX_MAX = 10_000;

/** 저장이 끝났으면 트리 · 상세 · 탭의 메뉴 수를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다. */
function refresh() {
  try {
    revalidatePath(PATH);
  } catch (error) {
    console.error("플랫폼 메뉴 화면 갱신 실패", error);
  }
}

export async function createMenuAction(input: CreateMenuInput): Promise<ActionResult<CreatedMenu>> {
  if (input.parentMenuId != null && !validId(input.parentMenuId)) return NOT_FOUND;
  try {
    const result = await createMenu(input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

export async function updateMenuAction(id: number, input: UpdateMenuInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateMenu(id, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "저장");
  }
}

export async function moveMenuAction(id: number, input: MoveMenuInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  if (input.parentMenuId !== null && !validId(input.parentMenuId)) return BAD_SPOT;
  if (!Number.isInteger(input.index) || input.index < 0 || input.index > INDEX_MAX) return BAD_SPOT;
  try {
    await moveMenu(id, { parentMenuId: input.parentMenuId, index: input.index });
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "메뉴 이동 저장");
  }
}
