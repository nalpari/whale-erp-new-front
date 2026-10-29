"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { withPeriod } from "@/lib/format";
import {
  checkLoginIdAvailable,
  createPlatformAdmin,
  deletePlatformAdmin,
  getPlatformAdminHistories,
  resetPlatformAdminPassword,
  updatePlatformAdmin,
  type CreatePlatformAdminInput,
  type PlatformAdminHistoryList,
  type UpdatePlatformAdminInput,
} from "@/lib/platform-admins";

// 등록 · 수정 · 삭제 · 비밀번호 초기화 · 이력 조회. 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// 메뉴 권한 · 마스터 보호 · 본인 보호는 api 가 동작마다 본다(403 문구가 무엇이 막혔는지 말한다).
// server action 은 공개 엔드포인트라 id 가 int4 양의 정수인지만 다시 본다. 로그인 판정도 api 가 한다 — 세션 토큰을 싣고, 없거나 끝났으면 api 가 401 을 준다.

const PATH = "/platform-admins";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; status?: number; message: string };

/**
 * api 오류를 화면 문구로 바꾼다. 이 api 는 400(형식 · 줄 수 없는 권한) · 403(마스터 보호 · 본인 보호) ·
 * 404(없거나 지운 계정) · 409(중복 · 동시 수정 · 마지막 마스터 · 이메일 없는 계정 초기화) 를 모두 한국어로 알리므로 그대로 보인다.
 * 401 은 할 일을 알 수 있게 고정 문구로, 그 밖(5xx · 연결 실패)은 일반 문구로 바꾼다.
 */
function failureOf(error: unknown, what: string): { ok: false; status?: number; message: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if ([400, 403, 404, 409].includes(error.status)) return { ok: false, status: error.status, message: withPeriod(error.message) };
  }
  console.error(`플랫폼 관리자 ${what} 실패`, error);
  return { ok: false, message: `${what}하지 못했습니다. 잠시 후 다시 시도해 주세요.` };
}

const validId = (id: number) => Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND = { ok: false as const, status: 404, message: "플랫폼 관리자 계정을 찾을 수 없습니다." };

/** 등록 · 수정 · 비밀번호 초기화가 끝났으면 목록 · 상세를 새로 받는다(삭제는 화면이 목록으로 옮기며 받는다). 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다. */
function refresh() {
  try {
    revalidatePath(PATH);
  } catch (error) {
    console.error("플랫폼 관리자 화면 갱신 실패", error);
  }
}

export async function createPlatformAdminAction(
  input: CreatePlatformAdminInput,
): Promise<ActionResult<{ adminAccountId: number; isMailSent: boolean }>> {
  try {
    const result = await createPlatformAdmin(input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

/** 아이디 중복 확인 — 등록 화면이 칸을 벗어나거나 Enter 를 칠 때 부른다. 형식은 화면이 먼저 본다. */
export async function checkLoginIdAvailableAction(loginId: string): Promise<ActionResult<{ available: boolean }>> {
  try {
    return { ok: true, available: await checkLoginIdAvailable(loginId) };
  } catch (error) {
    return failureOf(error, "아이디 확인");
  }
}

export async function updatePlatformAdminAction(id: number, input: UpdatePlatformAdminInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updatePlatformAdmin(id, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정");
  }
}

export async function deletePlatformAdminAction(id: number): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await deletePlatformAdmin(id);
    // 여기서는 화면을 다시 그리지 않는다 — ?admin=<지운 계정> 이 남은 주소로 다시 그려져 상세에 「삭제되었거나 없는 계정」 띠가
    // 잠깐 보였다. 성공하면 화면이 상세를 닫고 목록 주소로 옮기는데, 동적 화면이라 그 이동이 목록을 새로 받는다.
    return { ok: true };
  } catch (error) {
    return failureOf(error, "삭제");
  }
}

export async function resetPlatformAdminPasswordAction(id: number): Promise<ActionResult<{ isMailSent: boolean }>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    const result = await resetPlatformAdminPassword(id);
    // 초기화가 updatedAt 을 올리고 미발송 표시도 바꾼다 — 새로 받지 않으면 이어서 수정할 때 옛 updatedAt 으로 거짓 409 가 난다
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    // api 문구 「이메일이 없는 계정이라 보낼 곳이 없습니다」(409)는 화면 말투로 바꾼다 — 세 관리 화면 같다(2026-10-28 사용자 지정)
    if (error instanceof ApiError && error.status === 409 && error.message.includes("이메일이 없는 계정"))
      return { ok: false, status: 409, message: "해당 계정에는 등록된 이메일 주소가 없어 메일을 발송할 수 없습니다." };
    return failureOf(error, "비밀번호를 초기화");
  }
}

export async function getPlatformAdminHistoriesAction(id: number, page: number): Promise<ActionResult<PlatformAdminHistoryList>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getPlatformAdminHistories(id, Number.isInteger(page) && page >= 1 ? page : 1)) };
  } catch (error) {
    return failureOf(error, "이력 조회");
  }
}
