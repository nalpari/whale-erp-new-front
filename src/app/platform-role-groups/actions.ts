"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import {
  createRoleGroup,
  deleteRoleGroup,
  getDeletionCandidates,
  getRoleGroupMenus,
  previewRoleGroupMenus,
  saveRoleGroupMenus,
  updateRoleGroup,
  type CreatedRoleGroup,
  type CreateRoleGroupInput,
  type DeleteRoleGroupInput,
  type DeletionCandidates,
  type RevocationPreview,
  type RoleGroupMenuCells,
  type RoleGroupMenuTree,
  type UpdateRoleGroupInput,
} from "@/lib/platform-role-groups";

// 권한 등록 · 수정 · 삭제 · 메뉴 권한 조회 · 미리보기 · 저장. 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// 메뉴 권한 · 플랫폼 계정 여부 · 본인 연결 · 고정 권한 · 본인 범위 상한은 api 가 동작마다 본다(문구가 무엇이 막혔는지 말한다).
// server action 은 공개 엔드포인트라 id 가 int4 양의 정수인지 · 목록 길이만 다시 본다. 로그인 판정도 api 가 한다 — 세션 토큰을 싣고, 없거나 끝났으면 api 가 401 을 준다.

const PATH = "/platform-role-groups";

/**
 * 실패 결과. status 가 있으면 api 가 응답했다(4xx 거절 · 5xx 실패 — 저장은 한 트랜잭션이라 5xx 면 반영되지 않았다).
 * status 가 없으면 응답을 받지 못했다(연결 끊김 · 시간 초과) — 쓰기였다면 처리됐을 수도 있어, 화면은 최신 정보를 다시 받고 확인하게 한다.
 */
export type ActionFailure = { ok: false; status?: number; message: string };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFailure;

/**
 * api 오류를 화면 문구로. 이 api 는 400(형식 · 줄 수 없는 칸 · 대체 권한) · 403(권한 · 본인 연결) · 404(없거나 지운 권한) ·
 * 409(이름 중복 · 동시 수정 · 고정 권한) 를 한국어로 알리므로 그대로 보인다. 401 은 고정 문구로, 5xx 는 상태를 실어 일반 문구로,
 * 응답을 못 받은 것은 상태 없이 — 쓰기(wrote)면 「결과를 확인하지 못했다」, 읽기면 「실패했다」로 알린다.
 */
function failureOf(error: unknown, what: string, wrote = true): ActionFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if ([400, 403, 404, 409].includes(error.status)) return { ok: false, status: error.status, message: error.message };
    console.error(`플랫폼 권한 ${what} 실패`, error);
    return { ok: false, status: error.status, message: `${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.` };
  }
  console.error(`플랫폼 권한 ${what} 응답 없음`, error);
  return {
    ok: false,
    message: wrote ? `${what} 결과를 확인하지 못했습니다. 최신 정보를 다시 받았으니 처리됐는지 확인해 주세요.` : `${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
  };
}

const validId = (id: number) => Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND = { ok: false, status: 404, message: "권한을 찾을 수 없습니다" } satisfies ActionFailure;
// api 가 받는 메뉴 목록 상한(ArrayMaxSize)
const MENUS_MAX = 1000;
const TOO_MANY = { ok: false, status: 400, message: "한 번에 저장할 수 있는 메뉴 수를 넘었습니다" } satisfies ActionFailure;
const BAD_MENUS = { ok: false, status: 400, message: "메뉴 목록이 올바르지 않습니다" } satisfies ActionFailure;

/** 저장이 끝났으면 목록 · 상세를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다. */
function refresh() {
  try {
    revalidatePath(PATH);
  } catch (error) {
    console.error("플랫폼 권한 화면 갱신 실패", error);
  }
}

export async function createRoleGroupAction(input: CreateRoleGroupInput): Promise<ActionResult<CreatedRoleGroup>> {
  try {
    const result = await createRoleGroup(input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

export async function updateRoleGroupAction(id: number, input: UpdateRoleGroupInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateRoleGroup(id, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정");
  }
}

export async function getDeletionCandidatesAction(id: number): Promise<ActionResult<DeletionCandidates>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getDeletionCandidates(id)) };
  } catch (error) {
    return failureOf(error, "삭제 대상 조회", false);
  }
}

export async function deleteRoleGroupAction(id: number, input: DeleteRoleGroupInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  if (input.replacementRoleGroupId !== undefined && !validId(input.replacementRoleGroupId)) return NOT_FOUND;
  try {
    await deleteRoleGroup(id, input);
    // 여기서는 다시 그리지 않는다 — ?role=<지운 권한> 이 남은 주소로 그려지면 「찾을 수 없음」이 잠깐 보인다. 화면이 목록 주소로 옮기며 받는다.
    return { ok: true };
  } catch (error) {
    return failureOf(error, "삭제");
  }
}

export async function getRoleGroupMenusAction(id: number): Promise<ActionResult<RoleGroupMenuTree>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getRoleGroupMenus(id)) };
  } catch (error) {
    return failureOf(error, "메뉴 권한 조회", false);
  }
}

export async function previewRoleGroupMenusAction(id: number, menus: RoleGroupMenuCells[]): Promise<ActionResult<RevocationPreview>> {
  if (!validId(id)) return NOT_FOUND;
  if (!Array.isArray(menus)) return BAD_MENUS;
  if (menus.length > MENUS_MAX) return TOO_MANY;
  try {
    return { ok: true, ...(await previewRoleGroupMenus(id, menus)) };
  } catch (error) {
    return failureOf(error, "회수 범위 확인", false);
  }
}

export async function saveRoleGroupMenusAction(id: number, menus: RoleGroupMenuCells[], updatedAt: string): Promise<ActionResult<{ updatedAt: string }>> {
  if (!validId(id)) return NOT_FOUND;
  if (!Array.isArray(menus)) return BAD_MENUS;
  if (menus.length > MENUS_MAX) return TOO_MANY;
  try {
    const result = await saveRoleGroupMenus(id, menus, updatedAt);
    // 메뉴 등록 여부 · 최종수정일시가 바뀐다 — 새로 받지 않으면 이어서 권한명을 고칠 때 옛 updatedAt 으로 거짓 409 가 난다
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "메뉴 권한 저장");
  }
}
