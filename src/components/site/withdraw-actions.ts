"use server";

import { ApiError } from "@/lib/api";
import { createWithdrawal, getWithdrawEligibility, verifyCurrentPassword, type CreateWithdrawalInput } from "@/lib/withdrawal";
import { withdrawFailureOf, withdrawVerifyFailureOf, type WithdrawEligibility, type WithdrawFailure } from "@/lib/withdrawal-form";

// 회원 탈퇴(마이페이지, S-JHQQNR). password-change-actions.ts 와 같은 얇은 어댑터라 대응 테스트가 없다.

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

export type WithdrawActionResult = { ok: true } | WithdrawFailure;

/** 1단계 본인 확인 — 맞아야 탈퇴 화면으로 간다(S-JHQQNR, 2026-10-29 재영). 실패 판정은 withdrawal-form.ts 의
 * withdrawVerifyFailureOf(확인하지 못하면 넘기지 않는다, 테스트 있음). */
export async function verifyWithdrawPasswordAction(currentPassword: string): Promise<WithdrawActionResult> {
  try {
    await verifyCurrentPassword(currentPassword);
    return { ok: true };
  } catch (error) {
    // 판정한 거절(401 · 400 · 403 · 429) 말고는 화면이 모르는 실패라 서버 로그에 남긴다
    if (!(error instanceof ApiError && [400, 401, 403, 429].includes(error.status))) console.error("탈퇴 비밀번호 확인 실패", error);
    return withdrawVerifyFailureOf(error);
  }
}

export async function createWithdrawalAction(input: CreateWithdrawalInput): Promise<WithdrawActionResult> {
  try {
    await createWithdrawal(input);
    return { ok: true };
  } catch (error) {
    // 판정한 거절 말고는 화면이 모르는 실패라 서버 로그에 남긴다. 판정은 withdrawal-form.ts 의 withdrawFailureOf(테스트 있음)
    if (!(error instanceof ApiError && error.status < 500)) console.error("회원 탈퇴 실패", error);
    return withdrawFailureOf(error);
  }
}
