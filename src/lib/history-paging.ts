// 1팀 변경이력 팝업 한 쪽 건수 — 20 · 50, 처음은 20(2026-11-03 BP 휴일, 2026-11-04 BP 마스터 · 플랫폼 관리자 · BP 관리자 · 점포도 사용자 지정).
// 클라이언트 컴포넌트와 server action 이 같이 쓴다. api 는 네 이력 모두 50 까지 받는다(PageDto 200 · 점포 100).
export const HISTORY_PAGE_SIZES = [20, 50] as const;
export type HistoryPageSize = (typeof HISTORY_PAGE_SIZES)[number];
export const FIRST_HISTORY_PAGE_SIZE: HistoryPageSize = HISTORY_PAGE_SIZES[0];

/** server action 은 공개 엔드포인트라 고를 수 있는 값 밖이면 처음 값(20)으로 받는다 */
export function historyPageSizeOf(size: unknown): HistoryPageSize {
  return HISTORY_PAGE_SIZES.find((s) => s === size) ?? FIRST_HISTORY_PAGE_SIZE;
}
