"use server";

import { ApiError } from "@/lib/api";
import { changeMyPassword, type ChangeMyPasswordInput } from "@/lib/my-password";

// 내 비밀번호 변경(MY PAGE, S-PTWREE). 로그인 판정은 api 가 한다(세션 토큰이 없거나 끝났으면 401).

type Failure = { ok: false; status?: 400 | 401; message: string };
export type ActionResult = { ok: true } | Failure;

export async function changeMyPasswordAction(input: ChangeMyPasswordInput): Promise<ActionResult> {
  try {
    await changeMyPassword(input);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
      // 400 은 정책 위반 · 현재 비밀번호 불일치 · 확인 불일치 — api 문구를 그대로 쓴다(화면이 만들지 않는다).
      if (error.status === 400) return { ok: false, status: 400, message: error.message };
      // 403(탈퇴 · 강제 변경 대상) · 429(시도 한도) 등 그 밖의 api 거절도 문구를 그대로 쓴다 — 재시도해도
      // 안 풀리는데 "잠시 후 다시 시도"로 뭉개면 안 된다(route.ts 와 같은 5xx/그 밖 구분, 코드 리뷰로 찾음,
      // 2026-10-26).
      if (error.status < 500) return { ok: false, message: error.message };
    }
    console.error("비밀번호 변경 실패", error);
    return { ok: false, message: "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
