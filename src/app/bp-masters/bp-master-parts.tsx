import { Badge } from "@/components/common";
import type { BpMasterStatus } from "@/lib/bp-masters";

// BP 마스터 계정 화면들이 같이 쓰는 작은 조각. 실패 띠 · 칸 오류 · 대상 목록 · 막힘 안내는 플랫폼 관리자 화면의 것을 그대로 쓴다(admin-parts.tsx).

/** BP 상태 배지 — 사용(파랑) · 미사용(빨강) · 탈퇴(회색, 더는 다루지 않는 상태). 글자를 함께 둬 색만으로 말하지 않는다. */
export function BpStatusBadge({ status }: { status: BpMasterStatus }) {
  if (status === "ACTIVE") return <Badge tone="on">사용</Badge>;
  if (status === "INACTIVE") return <Badge tone="off">미사용</Badge>;
  return <Badge tone="closed">탈퇴</Badge>;
}

/**
 * server action 호출 자체가 거절됐을 때(응답을 못 받음). 받는 도중 끊겼거나 배포가 어긋났을 수 있어, 이미 처리됐을 수도 있다고 말한다
 * (다시 누르면 중복 등록 409 · 메일 두 번이 날 수 있다).
 */
export const unknownResult = (what: string) => (error: unknown) => {
  console.error(`BP 마스터 계정 ${what} 호출 실패`, error);
  return {
    ok: false as const,
    status: undefined,
    message: `${what} 결과를 확인하지 못했습니다. 화면을 새로 받았으니 처리됐는지 확인한 뒤 다시 시도해 주세요.`,
  };
};

/** 탈퇴 BP 에서 지워진 값 — 이름 · 연락처 · 이메일 */
export const WITHDRAWN_TEXT = "탈퇴로 삭제됨";
