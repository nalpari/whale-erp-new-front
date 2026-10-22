"use server";

import { ApiError } from "@/lib/api";
import { getBpProfile, updateBpProfile, verifyBpBusiness, type BpProfile, type UpdateBpProfileInput, type VerifyBpBusinessInput } from "@/lib/bp-profile";

// 내 정보(MY PAGE) 사업자정보 조회 · 수정 · 사업자 번호 인증. 로그인·권한 판정은 api 가 한다
// (토큰 없음·만료 401, BP 마스터가 아니면 403).

type Failure = { ok: false; status?: 400 | 401 | 403 | 409 | 422 | 503; message: string };
export type BpActionResult<T = object> = ({ ok: true } & T) | Failure;

// "use server" 파일은 내보내는 함수가 전부 비동기여야 한다(my-page-actions.ts 와 같은 이유) — failureOf 는
// 내보내지 않는다.
function failureOf(error: unknown, what: string): Failure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status === 400 || error.status === 403 || error.status === 409 || error.status === 422 || error.status === 503)
      return { ok: false, status: error.status, message: error.message };
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
