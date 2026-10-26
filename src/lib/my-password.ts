// 내 비밀번호 변경(MY PAGE) 데이터 접근 — manyfast F-AMTDCK > S-PTWREE 「내 비밀번호 변경」.
// api(whale-erp-api auth/admin-auth.controller.ts)에 경로가 있지만 아직 openapi.json 에 실리지 않아
// 타입을 손으로 적었다(my-profile.ts 와 같은 이유).
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
