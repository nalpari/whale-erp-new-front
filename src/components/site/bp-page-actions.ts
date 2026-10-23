"use server";

import { ApiError } from "@/lib/api";
import { getBpProfile, updateBpProfile, verifyBpBusiness, type BpProfile, type UpdateBpProfileInput, type VerifyBpBusinessInput } from "@/lib/bp-profile";

// 내 정보(MY PAGE) 사업자정보 조회 · 수정 · 사업자 번호 인증. 로그인·권한 판정은 api 가 한다
// (토큰 없음·만료 401, BP 마스터가 아니면 403).

type Failure = { ok: false; status?: number; message: string };
export type BpActionResult<T = object> = ({ ok: true } & T) | Failure;

// "use server" 파일은 내보내는 함수가 전부 비동기여야 한다(my-page-actions.ts 와 같은 이유) — failureOf 는
// 내보내지 않는다.
function failureOf(error: unknown, what: string): Failure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    // 점포(stores/actions.ts)와 같은 기준 — 4xx 는 다 거절 문장이고 503 (국세청 장애)도 알려 줄 문구가 있다.
    // 전엔 429(한도 초과)가 빠져 있어, 상자가 쓰는 bizVerifyFailure 가 status 를 못 받고 "확인하지 못했습니다"
    // 기본 문구로만 떴다(코드 리뷰로 찾음, 2026-10-23 — 사용자가 재인증을 반복하다 한도(429)에 걸렸을 때 발견).
    if (error.status < 500 || error.status === 503) return { ok: false, status: error.status, message: error.message };
  }
  console.error(`사업자정보 ${what} 실패`, error);
  return { ok: false, message: `${what}하지 못했습니다. 잠시 후 다시 시도해 주세요.` };
}

export async function getBpProfileAction(): Promise<BpActionResult<{ profile: BpProfile }>> {
  try {
    return { ok: true, profile: await getBpProfile() };
  } catch (error) {
    return failureOf(error, "조회");
  }
}

export async function updateBpProfileAction(input: UpdateBpProfileInput): Promise<BpActionResult> {
  try {
    await updateBpProfile(input);
    return { ok: true };
  } catch (error) {
    return failureOf(error, "저장");
  }
}

export async function verifyBpBusinessAction(input: VerifyBpBusinessInput): Promise<BpActionResult<{ verificationToken: string }>> {
  try {
    return { ok: true, ...(await verifyBpBusiness(input)) };
  } catch (error) {
    return failureOf(error, "사업자 번호 인증");
  }
}
