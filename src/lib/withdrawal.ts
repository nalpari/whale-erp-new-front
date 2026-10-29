// 회원 탈퇴(MY PAGE) 데이터 접근 — manyfast S-JHQQNR 「회원 탈퇴」.
// withdraw · withdraw-eligibility 는 생성 타입(api-types.generated.ts)에 실렸지만 password-verifications 는
// 아직 없어(api #190 머지 전) 입력 · 응답 타입을 손으로 적었다. 순수 로직(WithdrawEligibility 등)은 withdrawal-form.ts 에 갈라
// 두었다 — api.ts 가 next/headers 를 써서 node --test 가 플레인으로 풀 수 없기 때문이다. 이 파일은
// my-password.ts 처럼 api 호출 래퍼만 있어 테스트하지 않는다.
import { authHeaders, request } from "./api";
import type { WithdrawEligibility } from "./withdrawal-form";

/** GET /auth/admin/me/withdraw-eligibility. 탈퇴 경고 문구를 채울 값과, 진행 중인 근로계약이 있는지를 받는다. */
export async function getWithdrawEligibility(): Promise<WithdrawEligibility> {
  return request("/auth/admin/me/withdraw-eligibility", { headers: await authHeaders() });
}

/** POST /auth/admin/me/password-verifications. 탈퇴 화면을 열기 전 현재 비밀번호만 확인한다. 맞으면 204, 틀리면 400. */
export async function verifyCurrentPassword(currentPassword: string): Promise<void> {
  return request("/auth/admin/me/password-verifications", {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  });
}

export type CreateWithdrawalInput = {
  currentPassword: string;
  reasonCode: string;
  reasonDetail?: string;
};

/** POST /auth/admin/me/withdraw. 현재 비밀번호를 확인한 뒤 탈퇴 처리한다. 성공하면 204. */
export async function createWithdrawal(input: CreateWithdrawalInput): Promise<void> {
  return request("/auth/admin/me/withdraw", {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
