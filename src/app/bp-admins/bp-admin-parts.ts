// BP 관리자 패널들이 같이 쓰는 작은 조각. 띠 · 칸 문구는 side-parts, 확인창의 대상 목록 · 막힌 버튼 안내는 플랫폼 관리자 것을 쓴다.

/**
 * server action 호출 자체가 거절됐을 때(응답을 못 받음). 요청이 서버에 닿지 않았다는 뜻은 아니다 — 받는 도중 끊겼거나
 * 배포가 어긋났을 수 있어, 이미 처리됐을 수도 있다고 말한다(platform-admins/admin-parts.tsx 와 같다).
 */
export const unknownResult = (what: string) => (error: unknown) => {
  console.error(`BP 관리자 ${what} 호출 실패`, error);
  return {
    ok: false as const,
    status: undefined,
    message: `${what} 결과를 확인하지 못했습니다. 화면을 새로 받았으니 처리됐는지 확인한 뒤 다시 시도해 주세요.`,
  };
};
