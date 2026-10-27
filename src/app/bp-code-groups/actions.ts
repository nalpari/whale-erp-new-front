"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { createBpCodeItems, deleteBpCodeItems, updateBpCodeItems, type SaveCodeItemsInput } from "@/lib/bp-codes";
import { planSave, saveInOrder, savedNote, type SaveFailure, type SaveResult } from "@/lib/code-save";

// 상세 코드 패널 저장 — 플랫폼 공통코드와 같은 순서다(수정 PUT → 삭제 DELETE → 등록 POST, planSave · saveInOrder). 한 단계가 실패하면
// 뒤 단계는 보내지 않고, 앞 단계에서 저장한 것은 남는다 — 화면은 반영된 목록 뒤에 새 행을 남긴다.
// 탭 BP 는 인자로 받지 않는다 — 액션은 화면 주소(/bp/{id}/bp-code-groups)로 POST 되어 proxy 가 헤더로 싣는다(authHeaders).
// 플랫폼고정 · 사용중지 · 없는 그룹(404), 플랫폼 사용자, 메뉴 권한은 api 가 본다(문구가 무엇이 막혔는지 말한다. api 2026-10-27 변경 뒤 — 그전 api 는 플랫폼고정 그룹을 보내고 저장은 409).

export type { SaveResult };

const PATH = "/bp-code-groups";
const FAILED = "상세 코드를 저장하지 못했습니다. 잠시 후 다시 저장해 주세요.";

/**
 * api 오류를 화면 문구로 바꾼다. api 가 한국어 문구를 주는 400(형식 · BP 를 고르지 않음) · 403(권한 · 다른 BP · 플랫폼 사용자) ·
 * 404(없는 · 보이지 않는 그룹 — 플랫폼고정 · 사용중지 포함 · 없는 코드) · 409(중복. api 변경 전에는 플랫폼고정 그룹도 409)는 그대로 보인다. 401 은 고정 문구로, 그 밖(5xx · 연결 실패)은 일반 문구로.
 */
function failureOf(error: unknown, what: string): SaveFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if ([400, 403, 404, 409].includes(error.status)) return { status: error.status, message: error.message };
  }
  console.error(`${what} 실패`, error);
  return { message: FAILED };
}

/** 저장이 끝났으면 화면을 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 던지지 않고 마쳤는지만 돌려준다 — 못 마쳤으면 화면이 직접 다시 받는다. */
function refresh(): boolean {
  try {
    revalidatePath(PATH);
    return true;
  } catch (error) {
    console.error("BP 공통코드 화면 갱신 실패", error);
    return false;
  }
}

/** server action 은 공개 엔드포인트라 그룹 코드 형식 · 행 수(api 상한 500)만 다시 본다 — 나머지 검사는 api 가 한다. */
const GROUP_CODE = /^[A-Z][A-Z0-9_]{0,19}$/;
const MAX_ROWS = 500;

export async function saveBpCodeItemsAction(groupCode: string, input: SaveCodeItemsInput): Promise<SaveResult> {
  // deletes 가 없는 요청(삭제가 생기기 전 화면 등)은 지울 것이 없는 것으로 본다. 행 목록이 배열이 아니면 400 으로 돌려보낸다.
  const deletes = input.deletes ?? [];
  if (!GROUP_CODE.test(groupCode) || [input.updates, input.creates, deletes].some((rows) => !Array.isArray(rows) || rows.length > MAX_ROWS))
    return {
      ok: false,
      anySaved: false,
      saved: [],
      failed: "수정",
      skipped: [],
      refreshed: false,
      status: 400,
      message: "저장할 내용이 올바르지 않습니다. 화면을 새로 고친 뒤 다시 저장해 주세요.",
    };
  const where = `BP 상세 코드(${groupCode})`;
  return saveInOrder({
    ...planSave(
      { ...input, deletes },
      {
        update: (body) => updateBpCodeItems(groupCode, body),
        create: (body) => createBpCodeItems(groupCode, body),
        remove: (body) => deleteBpCodeItems(groupCode, body),
      },
    ),
    failureOf: (error, what, saved) => failureOf(error, `${where} ${what}${savedNote(saved)}`),
    refresh,
  });
}
