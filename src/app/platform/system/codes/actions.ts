"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import {
  applyCodeGroupToBps,
  saveCodeGroups,
  saveCodeItems,
  type SaveCodeGroupsInput,
  type SaveCodeItemsInput,
} from "@/lib/codes";

// 패널 저장. 행마다가 아니라 패널마다 한 번이다(S-UQPNIH). 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// TODO(로그인): 권한(등록·수정)은 api 가 다시 본다. 로그인이 생기면 여기서도 세션을 확인한다.

/** 실패면 status 로 가른다 — 409(중복)는 화면이 그 칸 아래에 붙이고, 그 밖은 표 위 띠로 알린다. */
export type SaveResult = { ok: true } | { ok: false; status?: number; message: string };

const FAILED = "공통코드를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/**
 * api 오류를 화면 문구로 바꾼다. api 가 한국어 문구를 주는 400(형식) · 404(없음) · 409(중복)만 그대로 보이고,
 * 401 · 403 은 사용자가 할 일을 알 수 있게 고정 문구로, 그 밖(5xx · 다른 4xx · 연결 실패)은 일반 문구로 바꾼다.
 */
function failureOf(error: unknown, what: string, fallback: string): { status?: number; message: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) return { status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status === 403) return { status: 403, message: `${what} 권한이 없습니다.` };
    if (error.status === 400 || error.status === 404 || error.status === 409) return { status: error.status, message: error.message };
  }
  console.error(`${what} 실패`, error);
  return { message: fallback };
}

async function run(save: () => Promise<void>): Promise<SaveResult> {
  try {
    await save();
  } catch (error) {
    return { ok: false, ...failureOf(error, "공통코드 저장", FAILED) };
  }
  revalidatePath("/platform/system/codes");
  return { ok: true };
}

export async function saveCodeGroupsAction(input: SaveCodeGroupsInput): Promise<SaveResult> {
  return run(() => saveCodeGroups(input));
}

export async function saveCodeItemsAction(groupCode: string, input: SaveCodeItemsInput): Promise<SaveResult> {
  return run(() => saveCodeItems(groupCode, input));
}

export type ApplyResult = { ok: true; bpCount: number; itemCount: number; createdCount: number } | { ok: false; message: string };

/** BP에 적용(플랫폼제공 그룹만). BP 에 이미 있는 상세 코드는 건너뛰고 없는 것만 넣는다 — 다시 적용해도 된다. */
export async function applyCodeGroupToBpsAction(groupCode: string): Promise<ApplyResult> {
  try {
    const result = await applyCodeGroupToBps(groupCode);
    revalidatePath("/platform/system/codes");
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, message: failureOf(error, "BP 적용", "BP에 적용하지 못했습니다. 잠시 후 다시 시도해 주세요.").message };
  }
}
