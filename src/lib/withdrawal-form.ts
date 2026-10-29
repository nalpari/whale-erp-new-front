// 회원 탈퇴(마이페이지) 순수 로직 — manyfast S-JHQQNR 「회원 탈퇴」. api 를 부르는 쪽(withdrawal.ts)과
// 갈라 둔다 — api.ts 가 next/headers 를 써서 node --test 가 플레인으로 풀 수 없기 때문이다
// (my-password-form.ts 가 my-password.ts 와 갈라진 것과 같은 이유).
import { ApiError } from "./api-error.ts";

export type WithdrawEligibility = {
  bpName: string;
  adminCount: number;
  storeCount: number;
  hasInProgressContract: boolean;
};

export type WithdrawWarningBlock = string | { head: string; text: string };

/** api 가 거절한 이유를 붙일 칸. 400 만 본다 — 401 등(세션 만료 · 연결 실패)은 칸이 아니라 띠로 보인다.
 * 진행 중인 근로계약이 있어 막힌 경우도 특정 칸을 가리킬 수 없어 띠로 보인다. */
export function withdrawFormField(status: number | undefined, message: string): "currentPassword" | "reasonDetail" | null {
  if (status !== 400) return null;
  if (message.includes("현재 비밀번호가 올바르지")) return "currentPassword";
  if (message.includes("상세를 입력")) return "reasonDetail";
  return null;
}

export type WithdrawVerifyFailure = { ok: false; status?: 400 | 401; message: string };

/** 탈퇴 1단계 비밀번호 확인이 던진 것을 화면 결과로(S-JHQQNR, 2026-10-29 재영). 확인하지 못한 경우(경로가 없는 404 · 5xx ·
 * 연결 실패)는 통과가 아니라 실패다 — 비밀번호를 모르는 사람이 탈퇴 화면을 보지 않게 하는 단계라서다. */
export function withdrawVerifyFailureOf(error: unknown): WithdrawVerifyFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    // 400 은 현재 비밀번호 불일치 — api 문구(「현재 비밀번호가 올바르지 않습니다.」)를 그대로 쓴다.
    if (error.status === 400) return { ok: false, status: 400, message: error.message };
    // 429 는 @nestjs/throttler 기본 예외라 한글 문구가 없다(api 한도 10분 10번).
    if (error.status === 429) return { ok: false, message: "너무 많이 시도했습니다. 10분 뒤 다시 시도해 주세요." };
    if (error.status === 403) return { ok: false, message: error.message };
  }
  return { ok: false, message: "비밀번호를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
}

/** 탈퇴 경고 문구(데모 docs/demo/src/site.mjs 328-343줄의 근거) — 실제 값으로 바뀌는 자리를
 * eligibility 로 채운다. `<br>` 대신 `\n` 을 쓴다 — 줄바꿈을 어떻게 그릴지는 컴포넌트(withdraw-panel.tsx) 몫이다.
 * 데모의 live()(굵게+밑줄)에 해당하는 자리(BP 이름·관리자 수·점포 수)는 `**...**` 로 감싼다 — 이 파일은
 * React 를 안 쓰므로(node --test 로 돈다) 마크다운 굵게만 흉내 내고, 실제 굵게+밑줄 렌더링은 컴포넌트가
 * `**` 를 갈라 맡는다(2026-10-27 사용자 지정 — BP 이름이 눈에 띄어야 한다). */
export function withdrawWarningText(eligibility: WithdrawEligibility): WithdrawWarningBlock[] {
  const { bpName, adminCount, storeCount } = eligibility;
  return [
    `탈퇴하면 **${bpName}**의 서비스 이용이 종료됩니다. 관리자·가맹 계정 **${adminCount}개**도 함께 탈퇴되어 더 이상 로그인할 수 없습니다.`,
    {
      head: `점포 **${storeCount}개**가 모두 폐점 처리됩니다.`,
      text: `점포 보유 여부는 탈퇴를 제한하지 않습니다.\n탈퇴 처리 시 점포의 현재 운영 상태나 폐점 조건을 별도로 확인하지 않고, 운영·미운영 점포 **${storeCount}개**를 모두 폐점 처리합니다.`,
    },
    {
      head: "개인정보가 삭제됩니다.",
      text: "탈퇴 계정의 이름·연락처·이메일과 대표자의 연락처·이메일은 즉시 삭제되며, 아이디만 보관됩니다. 직원·계약·정산 정보와 변경이력은 보존 정책에 따라 보관됩니다.",
    },
    "탈퇴한 계정은 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?",
  ];
}
