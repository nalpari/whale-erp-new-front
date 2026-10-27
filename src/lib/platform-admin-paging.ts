// 플랫폼 관리자 목록 · 이력의 한 쪽 건수. 클라이언트 컴포넌트도 쪽 수를 세야 해서 서버 전용(next/headers)을 부르는
// platform-admins.ts 와 떼어 둔다 — 거기서 값을 가져오면 클라이언트 번들에 api.ts 가 끌려 들어가 빌드가 깨진다.
export const ADMIN_PAGE_SIZE = 20;
/** 목록의 한 쪽 건수 선택지 — 목록 오른쪽 위 드롭다운. BP 관리자 관리와 같다(2026-10-27 사용자 지정). 첫 값이 기본이다. */
export const ADMIN_PAGE_SIZES = [ADMIN_PAGE_SIZE, 50, 100] as const;
export type AdminPageSize = (typeof ADMIN_PAGE_SIZES)[number];
export const HISTORY_PAGE_SIZE = 10;
