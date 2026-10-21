"use server";

import { ApiError } from "@/lib/api";
import { checkMyEmailAvailable, getMyProfile, updateMyProfile, type MyProfile, type UpdateMyProfileInput } from "@/lib/my-profile";

// 내 정보(MY PAGE) 조회 · 수정. 로그인 판정은 api 가 한다(세션 토큰이 없거나 끝났으면 401).

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; status?: number; message: string };

const unknownResult =
  (what: string) =>
  (error: unknown): { ok: false; status?: number; message: string } => {
    console.error(`내 정보 ${what} 호출 실패`, error);
    return { ok: false, status: undefined, message: `${what} 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.` };
  };

function failureOf(error: unknown, what: string): { ok: false; status?: number; message: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if ([400, 409].includes(error.status)) return { ok: false, status: error.status, message: error.message };
  }
  console.error(`내 정보 ${what} 실패`, error);
  return { ok: false, message: `${what}하지 못했습니다. 잠시 후 다시 시도해 주세요.` };
}

export async function getMyProfileAction(): Promise<ActionResult<{ profile: MyProfile }>> {
  try {
    return { ok: true, profile: await getMyProfile() };
  } catch (error) {
    return failureOf(error, "조회");
  }
}

export async function updateMyProfileAction(input: UpdateMyProfileInput): Promise<ActionResult> {
  try {
    await updateMyProfile(input);
    return { ok: true };
  } catch (error) {
    return failureOf(error, "저장");
  }
}

/** 이메일 중복 확인 — 칸을 벗어나거나 Enter 를 칠 때 부른다. 형식은 화면이 먼저 본다. */
export async function checkMyEmailAvailableAction(email: string): Promise<ActionResult<{ available: boolean }>> {
  try {
    return { ok: true, available: await checkMyEmailAvailable(email) };
  } catch (error) {
    return unknownResult("이메일 확인")(error);
  }
}
