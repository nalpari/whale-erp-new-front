"use server";

import { ApiError } from "@/lib/api";
import { createWithdrawal, getWithdrawEligibility, type CreateWithdrawalInput } from "@/lib/withdrawal";
import type { WithdrawEligibility } from "@/lib/withdrawal-form";

// 회원 탈퇴(MY PAGE, S-JHQQNR). password-change-actions.ts 와 같은 얇은 어댑터라 대응 테스트가 없다.

export type EligibilityResult = { ok: true; data: WithdrawEligibility } | { ok: false; message: string };

export async function getWithdrawEligibilityAction(): Promise<EligibilityResult> {
  try {
    const data = await getWithdrawEligibility();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, message: error.message };
    console.error("탈퇴 조건 조회 실패", error);
    return { ok: false, message: "탈퇴 조건을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

type Failure = { ok: false; status?: 400 | 401; message: string };
export type WithdrawActionResult = { ok: true } | Failure;

export async function createWithdrawalAction(input: CreateWithdrawalInput): Promise<WithdrawActionResult> {
  try {
    await createWithdrawal(input);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
      // 400 은 현재 비밀번호 불일치 · 진행 중인 근로계약 · 상세 사유 누락 — api 문구를 그대로 쓴다(화면이 만들지 않는다).
      if (error.status === 400) return { ok: false, status: 400, message: error.message };
      // 429 는 @nestjs/throttler 기본 예외라 한글 문구가 없다 — changeMyPasswordAction 과 같은 이유로 바꾼다.
      if (error.status === 429) return { ok: false, message: "너무 많이 시도했습니다. 10분 뒤 다시 시도해 주세요." };
      if (error.status < 500) return { ok: false, message: error.message };
    }
    console.error("회원 탈퇴 실패", error);
    return { ok: false, message: "회원 탈퇴 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
