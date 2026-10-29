// 회원 탈퇴(마이페이지) 데이터 접근 — manyfast S-JHQQNR 「회원 탈퇴」.
// api(whale-erp-api auth/admin-auth.controller.ts gligar 브랜치)에 경로가 있지만 아직 front 생성 타입
// (api-types.generated.ts)에 실리지 않아(이 api PR 이 main 에 머지되기 전) 타입을 손으로 적었다
// (my-password.ts 와 같은 이유). 순수 로직(WithdrawEligibility 등)은 withdrawal-form.ts 에 갈라
// 두었다 — api.ts 가 next/headers 를 써서 node --test 가 플레인으로 풀 수 없기 때문이다. 이 파일은
// my-password.ts 처럼 api 호출 래퍼만 있어 테스트하지 않는다.
import { authHeaders, request } from "./api";
import type { WithdrawEligibility } from "./withdrawal-form";

/** GET /auth/admin/me/withdraw-eligibility. 탈퇴 경고 문구를 채울 값과, 진행 중인 근로계약이 있는지를 받는다. */
export async function getWithdrawEligibility(): Promise<WithdrawEligibility> {
  return request("/auth/admin/me/withdraw-eligibility", { headers: await authHeaders() });
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
