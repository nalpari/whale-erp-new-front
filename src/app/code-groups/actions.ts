"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import {
  applyCodeGroupToBps,
  createCodeGroups,
  createCodeItems,
  deleteCodeItems,
  updateCodeGroups,
  updateCodeItems,
  type SaveCodeGroupsInput,
  type SaveCodeItemsInput,
} from "@/lib/codes";
import { planSave, saveInOrder, type SaveFailure, type SavePlan, type SaveResult } from "@/lib/code-save";

// 패널 저장 — 사용자 동작은 행마다가 아니라 패널마다 한 번이다(S-UQPNIH). api 는 수정(PUT, 수정 권한) · 삭제(DELETE, 삭제 권한 —
// 상세 코드만) · 등록(POST, 등록 권한)이 따로라 바뀐 기존 행이 있으면 수정, 지울 행이 있으면 삭제, 새 행이 있으면 등록을 이 순서로
// 부른다(planSave · saveInOrder). 한 단계가 실패하면 뒤 단계는 보내지 않고, 앞 단계에서 저장한 것은 남는다 — 화면은 반영된 목록 뒤에
// 새 행을 남긴다. 로그인 · 메뉴 권한은 api 가 본다 — 세션 토큰을 싣고, 없거나 끝났으면 api 가 401 을 준다.

export type { SaveResult };

const FAILED = "공통코드를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/**
 * api 오류를 화면 문구로 바꾼다. api 가 한국어 문구를 주는 400(형식) · 403(권한 · 비밀번호 변경 필요 등) · 404(없음) · 409(중복)는
 * 그대로 보인다 — 403 은 메뉴 권한 말고도 할 일이 다른 이유가 있어 고정 문구로 덮지 않는다. 401 은 고정 문구로, 그 밖(5xx · 연결 실패)은 일반 문구로.
 */
function failureOf(error: unknown, what: string, fallback: string): SaveFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status === 400 || error.status === 403 || error.status === 404 || error.status === 409) return { status: error.status, message: error.message };
  }
  console.error(`${what} 실패`, error);
  return { message: fallback };
}

/**
 * 저장이 끝났으면 화면을 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 던지지 않는다 — 던지면 화면이 「연결하지 못했다」로 보고
 * 다시 저장해 409 가 난다. 마쳤는지는 돌려준다 — 못 마쳤으면 화면이 직접 다시 받는다(router.refresh).
 */
function refresh(): boolean {
  try {
    revalidatePath("/code-groups");
    return true;
  } catch (error) {
    console.error("공통코드 화면 갱신 실패", error);
    return false;
  }
}

/** where — 서버 로그에서 어느 패널(상세 코드면 그룹 코드)인지, 실패가 앞 단계 저장 뒤인지 가른다 */
function run(plan: SavePlan, where: string): Promise<SaveResult> {
  return saveInOrder({
    ...plan,
    failureOf: (error, what) => failureOf(error, `공통코드 ${where} ${what}${what !== "수정" && plan.update ? "(수정분은 저장됨)" : ""}`, FAILED),
    refresh,
  });
}

export async function saveCodeGroupsAction(input: SaveCodeGroupsInput): Promise<SaveResult> {
  return run(planSave(input, { update: updateCodeGroups, create: createCodeGroups }), "그룹");
}

export async function saveCodeItemsAction(groupCode: string, input: SaveCodeItemsInput): Promise<SaveResult> {
  return run(
    planSave(input, {
      update: (body) => updateCodeItems(groupCode, body),
      create: (body) => createCodeItems(groupCode, body),
      remove: (body) => deleteCodeItems(groupCode, body),
    }),
    `상세 코드(${groupCode})`,
  );
}

export type ApplyResult = { ok: true; bpCount: number; itemCount: number; createdCount: number } | { ok: false; message: string };

/** BP에 적용(플랫폼제공 그룹만). BP 에 이미 있는 상세 코드는 건너뛰고 없는 것만 넣는다 — 다시 적용해도 된다. */
export async function applyCodeGroupToBpsAction(groupCode: string): Promise<ApplyResult> {
  try {
    const result = await applyCodeGroupToBps(groupCode);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, message: failureOf(error, "BP 적용", "BP에 적용하지 못했습니다. 잠시 후 다시 시도해 주세요.").message };
  }
}
