"use server";

import { revalidatePath } from "next/cache";
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
import { failureOf as sharedFailureOf, menusFailure, validId, type ActionFailure, type ActionResult } from "@/lib/role-group-actions";

// 권한 등록 · 수정 · 삭제 · 메뉴 권한 조회 · 미리보기 · 저장. 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// 메뉴 권한 · 플랫폼 계정 여부 · 본인 연결 · 고정 권한 · 본인 범위 상한은 api 가 동작마다 본다(문구가 무엇이 막혔는지 말한다).
// server action 은 공개 엔드포인트라 id 가 int4 양의 정수인지 · 목록 길이만 다시 본다. 로그인 판정도 api 가 한다 — 세션 토큰을 싣고, 없거나 끝났으면 api 가 401 을 준다.

const PATH = "/platform-role-groups";

const failureOf = (error: unknown, what: string, wrote = true) => sharedFailureOf(error, "플랫폼 권한", what, wrote);
const NOT_FOUND = { ok: false, status: 404, message: "권한을 찾을 수 없습니다." } satisfies ActionFailure;

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
  const badMenus = menusFailure(menus);
  if (badMenus) return badMenus;
  try {
    return { ok: true, ...(await previewRoleGroupMenus(id, menus)) };
  } catch (error) {
    return failureOf(error, "회수 범위 확인", false);
  }
}

export async function saveRoleGroupMenusAction(id: number, menus: RoleGroupMenuCells[], updatedAt: string): Promise<ActionResult<{ updatedAt: string }>> {
  if (!validId(id)) return NOT_FOUND;
  const badMenus = menusFailure(menus);
  if (badMenus) return badMenus;
  try {
    const result = await saveRoleGroupMenus(id, menus, updatedAt);
    // 메뉴 등록 여부 · 최종수정일시가 바뀐다 — 새로 받지 않으면 이어서 권한명을 고칠 때 옛 updatedAt 으로 거짓 409 가 난다
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "메뉴 권한 저장");
  }
}
