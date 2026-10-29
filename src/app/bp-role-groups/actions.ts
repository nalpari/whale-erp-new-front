"use server";

import { revalidatePath } from "next/cache";
import {
  createBpRoleGroup,
  deleteBpRoleGroup,
  getBpDeletionCandidates,
  getBpRoleGroupMenus,
  getFranchiseMasterMenus,
  previewBpRoleGroupMenus,
  saveBpRoleGroupMenus,
  updateBpRoleGroup,
  type BpRoleGroupInput,
  type BpRoleGroupMenuTree,
  type CreatedBpRoleGroup,
  type DeleteBpRoleGroupInput,
  type UpdateBpRoleGroupInput,
} from "@/lib/bp-role-groups";
import type { DeletionCandidates, RevocationPreview, RoleGroupMenuCells } from "@/lib/platform-role-groups";
import { failureOf as sharedFailureOf, menusFailure, validId, type ActionFailure, type ActionResult } from "@/lib/role-group-actions";

// BP 권한 그룹 등록 · 수정 · 삭제 · 메뉴 권한 조회 · 미리보기 · 저장 · 가맹마스터 메뉴설정 보기. 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// 역할 · 본인 연결 · 기준 고정 권한 · 본인 범위 상한 · BP 소속은 api 가 동작마다 본다(문구가 무엇이 막혔는지 말한다).
// 탭 BP 는 인자로 받지 않는다 — 액션은 화면 주소(/bp/{id}/bp-role-groups)로 POST 되어 proxy 가 헤더로 싣는다(authHeaders).
// server action 은 공개 엔드포인트라 id 가 int4 양의 정수인지 · 목록 길이만 다시 본다.

const PATH = "/bp-role-groups";

const failureOf = (error: unknown, what: string, wrote = true) => sharedFailureOf(error, "BP 권한 그룹", what, wrote);
const NOT_FOUND = { ok: false, status: 404, message: "권한 그룹을 찾을 수 없습니다." } satisfies ActionFailure;

/** 저장이 끝났으면 목록 · 상세를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다. */
function refresh() {
  try {
    revalidatePath(PATH);
  } catch (error) {
    console.error("BP 권한 그룹 화면 갱신 실패", error);
  }
}

export async function createBpRoleGroupAction(input: BpRoleGroupInput): Promise<ActionResult<CreatedBpRoleGroup>> {
  try {
    const result = await createBpRoleGroup(input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

export async function updateBpRoleGroupAction(id: number, input: UpdateBpRoleGroupInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateBpRoleGroup(id, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정");
  }
}

export async function getBpDeletionCandidatesAction(id: number): Promise<ActionResult<DeletionCandidates>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getBpDeletionCandidates(id)) };
  } catch (error) {
    return failureOf(error, "삭제 대상 조회", false);
  }
}

export async function deleteBpRoleGroupAction(id: number, input: DeleteBpRoleGroupInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  if (input.replacementRoleGroupId !== undefined && !validId(input.replacementRoleGroupId)) return NOT_FOUND;
  try {
    await deleteBpRoleGroup(id, input);
    // 여기서는 다시 그리지 않는다 — ?role=<지운 그룹> 이 남은 주소로 그려지면 「찾을 수 없음」이 잠깐 보인다. 화면이 목록 주소로 옮기며 받는다.
    return { ok: true };
  } catch (error) {
    return failureOf(error, "삭제");
  }
}

export async function getBpRoleGroupMenusAction(id: number): Promise<ActionResult<BpRoleGroupMenuTree>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getBpRoleGroupMenus(id)) };
  } catch (error) {
    return failureOf(error, "메뉴 권한 조회", false);
  }
}

export async function previewBpRoleGroupMenusAction(id: number, menus: RoleGroupMenuCells[]): Promise<ActionResult<RevocationPreview>> {
  if (!validId(id)) return NOT_FOUND;
  const badMenus = menusFailure(menus);
  if (badMenus) return badMenus;
  try {
    return { ok: true, ...(await previewBpRoleGroupMenus(id, menus)) };
  } catch (error) {
    return failureOf(error, "회수 범위 확인", false);
  }
}

export async function saveBpRoleGroupMenusAction(
  id: number,
  menus: RoleGroupMenuCells[],
  updatedAt: string,
): Promise<ActionResult<{ updatedAt: string }>> {
  if (!validId(id)) return NOT_FOUND;
  const badMenus = menusFailure(menus);
  if (badMenus) return badMenus;
  try {
    const result = await saveBpRoleGroupMenus(id, menus, updatedAt);
    // 메뉴 등록 여부 · 최종수정일시가 바뀐다 — 새로 받지 않으면 이어서 권한명을 고칠 때 옛 updatedAt 으로 거짓 409 가 난다
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "메뉴 권한 저장");
  }
}

export async function getFranchiseMasterMenusAction(): Promise<ActionResult<BpRoleGroupMenuTree>> {
  try {
    return { ok: true, ...(await getFranchiseMasterMenus()) };
  } catch (error) {
    return failureOf(error, "가맹 마스터 권한 조회", false);
  }
}
