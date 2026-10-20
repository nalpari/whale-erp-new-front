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
  type CreatedBpRoleGroup,
  type DeleteBpRoleGroupInput,
} from "@/lib/bp-role-groups";
import type { DeletionCandidates, RevocationPreview, RoleGroupMenuCells, RoleGroupMenuTree } from "@/lib/platform-role-groups";
import { failureOf as sharedFailureOf, menusFailure, validId, type ActionFailure, type ActionResult } from "@/lib/role-group-actions";

// BP 권한 그룹 등록 · 수정 · 삭제 · 메뉴 권한 조회 · 미리보기 · 저장 · 가맹마스터 보기. 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// 역할 · 본인 연결 · 기준 고정 권한 · 본인 범위 상한 · BP 소속은 api 가 동작마다 본다(문구가 무엇이 막혔는지 말한다).
// server action 은 공개 엔드포인트라 bpCodeId · id 가 int4 양의 정수인지 · 목록 길이만 다시 본다.

const PATH = "/bp-role-groups";

const failureOf = (error: unknown, what: string, wrote = true) => sharedFailureOf(error, "BP 권한 그룹", what, wrote);
const NOT_FOUND = { ok: false, status: 404, message: "권한 그룹을 찾을 수 없습니다" } satisfies ActionFailure;
const NO_BP = { ok: false, status: 400, message: "BP 를 다시 골라 주세요" } satisfies ActionFailure;

/** 저장이 끝났으면 목록 · 상세를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다. */
function refresh() {
  try {
    revalidatePath(PATH);
  } catch (error) {
    console.error("BP 권한 그룹 화면 갱신 실패", error);
  }
}

export async function createBpRoleGroupAction(bpCodeId: number, input: BpRoleGroupInput): Promise<ActionResult<CreatedBpRoleGroup>> {
  if (!validId(bpCodeId)) return NO_BP;
  try {
    const result = await createBpRoleGroup(bpCodeId, input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

export async function updateBpRoleGroupAction(bpCodeId: number, id: number, input: BpRoleGroupInput & { updatedAt: string }): Promise<ActionResult> {
  if (!validId(bpCodeId)) return NO_BP;
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateBpRoleGroup(bpCodeId, id, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정");
  }
}

export async function getBpDeletionCandidatesAction(bpCodeId: number, id: number): Promise<ActionResult<DeletionCandidates>> {
  if (!validId(bpCodeId)) return NO_BP;
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getBpDeletionCandidates(bpCodeId, id)) };
  } catch (error) {
    return failureOf(error, "삭제 대상 조회", false);
  }
}

export async function deleteBpRoleGroupAction(bpCodeId: number, id: number, input: DeleteBpRoleGroupInput): Promise<ActionResult> {
  if (!validId(bpCodeId)) return NO_BP;
  if (!validId(id)) return NOT_FOUND;
  if (input.replacementRoleGroupId !== undefined && !validId(input.replacementRoleGroupId)) return NOT_FOUND;
  try {
    await deleteBpRoleGroup(bpCodeId, id, input);
    // 여기서는 다시 그리지 않는다 — ?role=<지운 그룹> 이 남은 주소로 그려지면 「찾을 수 없음」이 잠깐 보인다. 화면이 목록 주소로 옮기며 받는다.
    return { ok: true };
  } catch (error) {
    return failureOf(error, "삭제");
  }
}

export async function getBpRoleGroupMenusAction(bpCodeId: number, id: number): Promise<ActionResult<RoleGroupMenuTree>> {
  if (!validId(bpCodeId)) return NO_BP;
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getBpRoleGroupMenus(bpCodeId, id)) };
  } catch (error) {
    return failureOf(error, "메뉴 권한 조회", false);
  }
}

export async function previewBpRoleGroupMenusAction(bpCodeId: number, id: number, menus: RoleGroupMenuCells[]): Promise<ActionResult<RevocationPreview>> {
  if (!validId(bpCodeId)) return NO_BP;
  if (!validId(id)) return NOT_FOUND;
  const badMenus = menusFailure(menus);
  if (badMenus) return badMenus;
  try {
    return { ok: true, ...(await previewBpRoleGroupMenus(bpCodeId, id, menus)) };
  } catch (error) {
    return failureOf(error, "회수 범위 확인", false);
  }
}

export async function saveBpRoleGroupMenusAction(
  bpCodeId: number,
  id: number,
  menus: RoleGroupMenuCells[],
  updatedAt: string,
): Promise<ActionResult<{ updatedAt: string }>> {
  if (!validId(bpCodeId)) return NO_BP;
  if (!validId(id)) return NOT_FOUND;
  const badMenus = menusFailure(menus);
  if (badMenus) return badMenus;
  try {
    const result = await saveBpRoleGroupMenus(bpCodeId, id, menus, updatedAt);
    // 메뉴 등록 여부 · 최종수정일시가 바뀐다 — 새로 받지 않으면 이어서 권한명을 고칠 때 옛 updatedAt 으로 거짓 409 가 난다
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "메뉴 권한 저장");
  }
}

export async function getFranchiseMasterMenusAction(bpCodeId: number): Promise<ActionResult<RoleGroupMenuTree>> {
  if (!validId(bpCodeId)) return NO_BP;
  try {
    return { ok: true, ...(await getFranchiseMasterMenus(bpCodeId)) };
  } catch (error) {
    return failureOf(error, "가맹 마스터 권한 조회", false);
  }
}
