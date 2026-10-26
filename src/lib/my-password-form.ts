// 내 비밀번호 변경(MY PAGE, S-PTWREE) — 화면이 api message 를 어느 칸에 붙일지만 가른다. 오류 문구 자체는
// 화면이 만들지 않고 api 의 message 를 그대로 쓴다(force-password-dialog.tsx 의 같은 규칙, 정책 PL-QSBSYY).

export type MyPasswordFormField = "current" | "newPassword" | "newPasswordConfirm";

/** api 가 거절한 이유를 붙일 칸. 400 만 본다 — 401 등(세션 만료 · 연결 실패)은 칸이 아니라 띠로 보인다.
 * "현재 비밀번호와 다른 비밀번호를 입력해 주세요."(새 비밀번호가 현재와 같음)도 "현재 비밀번호"를 담고
 * 있어, 틀린 걸 알리는 "현재 비밀번호가 올바르지 않습니다."와 정확히 가른다 — 앞은 새 비밀번호 칸 몫이다. */
export function myPasswordErrorField(status: number | undefined, message: string): MyPasswordFormField | null {
  if (status !== 400) return null;
  if (message.includes("현재 비밀번호가 올바르지")) return "current";
  if (message.includes("일치하지 않습니다")) return "newPasswordConfirm";
  // 조합·길이 · 아이디와 같음 · 허용 문자 · 현재와 같음은 모두 새 비밀번호 칸 몫이다.
  return "newPassword";
}
