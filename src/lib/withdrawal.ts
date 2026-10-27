// 회원 탈퇴(MY PAGE) 데이터 접근 — manyfast S-JHQQNR 「회원 탈퇴」.
// api(whale-erp-api auth/admin-auth.controller.ts gligar 브랜치)에 경로가 있지만 아직 front 생성 타입
// (api-types.generated.ts)에 실리지 않아(이 api PR 이 main 에 머지되기 전) 타입을 손으로 적었다
// (my-password.ts 와 같은 이유).
// node --test 가 이 파일을 직접 읽는다. 아래 두 함수는 api.ts(next/headers 를 쓴다)를 호출 시점에만
// 들여온다 — 정적 import 로 두면 이 파일의 순수 함수만 검사하는 테스트도 next/headers 를 플레인 node
// 로 풀 수 없어 함께 깨진다. authHeaders · request 를 부르는 모양은 my-password.ts 와 같다.

export type WithdrawEligibility = {
  bpName: string;
  adminCount: number;
  storeCount: number;
  hasInProgressContract: boolean;
};

/** GET /auth/admin/me/withdraw-eligibility. 탈퇴 경고 문구를 채울 값과, 진행 중인 근로계약이 있는지를 받는다. */
export async function getWithdrawEligibility(): Promise<WithdrawEligibility> {
  const { authHeaders, request } = await import("./api.ts");
  return request("/auth/admin/me/withdraw-eligibility", { headers: await authHeaders() });
}

export type CreateWithdrawalInput = {
  currentPassword: string;
  reasonCode: string;
  reasonDetail?: string;
};

/** POST /auth/admin/me/withdraw. 현재 비밀번호를 확인한 뒤 탈퇴 처리한다. 성공하면 204. */
export async function createWithdrawal(input: CreateWithdrawalInput): Promise<void> {
  const { authHeaders, request } = await import("./api.ts");
  return request("/auth/admin/me/withdraw", {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// 탈퇴 사유 공통코드는 목 단계라 여기 둔다 — api 에 getCodes() 가 생기면 그걸로 바꾼다.
export const WITHDRAW_REASONS: { code: string; label: string }[] = [
  { code: "WD_CLOSE", label: "폐업·사업 종료" },
  { code: "WD_SWITCH", label: "다른 서비스 이용" },
  { code: "WD_COST", label: "비용 부담" },
  { code: "WD_FEATURE", label: "기능 부족" },
  { code: "WD_HARD", label: "이용이 어려움" },
  { code: "WD_INPUT", label: "직접입력" },
];

/** api 가 거절한 이유를 붙일 칸. 400 만 본다 — 401 등(세션 만료 · 연결 실패)은 칸이 아니라 띠로 보인다.
 * 진행 중인 근로계약이 있어 막힌 경우도 특정 칸을 가리킬 수 없어 띠로 보인다. */
export function withdrawFormField(status: number | undefined, message: string): "currentPassword" | "reasonDetail" | null {
  if (status !== 400) return null;
  if (message.includes("현재 비밀번호가 올바르지")) return "currentPassword";
  if (message.includes("상세를 입력")) return "reasonDetail";
  return null;
}

export type WithdrawWarningBlock = string | { head: string; text: string };

/** 탈퇴 경고 문구(데모 docs/demo/src/site.mjs 328-343줄의 근거) — 실제 값으로 바뀌는 자리를
 * eligibility 로 채운다. `<br>` 대신 `\n` 을 쓴다 — 줄바꿈을 어떻게 그릴지는 컴포넌트(Task 3) 몫이다. */
export function withdrawWarningText(eligibility: WithdrawEligibility): WithdrawWarningBlock[] {
  const { bpName, adminCount, storeCount } = eligibility;
  return [
    `탈퇴하면 ${bpName}의 서비스 이용이 종료됩니다. 동일한 BP에 속한 관리자·가맹 계정 ${adminCount}개도 함께 탈퇴되어 더 이상 로그인할 수 없습니다.`,
    {
      head: `점포 ${storeCount}개가 모두 폐점 처리됩니다`,
      text: `점포 보유 여부는 탈퇴를 제한하지 않습니다.\n탈퇴 처리 시 점포의 현재 운영 상태나 폐점 조건을 별도로 확인하지 않고, 운영·미운영 점포 ${storeCount}개를 모두 폐점 처리합니다.`,
    },
    {
      head: "개인정보가 삭제됩니다",
      text: "탈퇴 계정의 이름·연락처·이메일과 대표자의 연락처·이메일은 즉시 삭제되며, 아이디만 보관됩니다. 직원·계약·정산 정보와 변경 이력은 보존 정책에 따라 보관됩니다.",
    },
    "탈퇴한 계정은 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?",
  ];
}
