// 내 비밀번호 변경(MY PAGE) 데이터 접근 — manyfast F-AMTDCK > S-PTWREE 「내 비밀번호 변경」.
// api(whale-erp-api auth/admin-auth.controller.ts everest 브랜치)의 openapi.json 에는 이미 실렸지만, front
// 생성 타입(api-types.generated.ts)은 api main(kabuto 기준)을 따라가므로 이 api PR 이 머지되기 전까진
// 받지 못해 타입을 손으로 적었다(my-profile.ts 와 같은 이유).
import { authHeaders, request } from "./api";

export type ChangeMyPasswordInput = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

/** POST /auth/admin/me/password-change. 현재 비밀번호를 확인한 뒤 바꾼다 — 세션은 건드리지 않는다
 * (이 기기 · 다른 기기 로그인 모두 이어진다, S-PTWREE outcome). */
export async function changeMyPassword(input: ChangeMyPasswordInput): Promise<void> {
  return request("/auth/admin/me/password-change", {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
