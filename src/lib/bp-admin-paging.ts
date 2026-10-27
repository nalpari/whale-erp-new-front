// BP 관리자 목록의 한 쪽 건수 선택지. 클라이언트 컴포넌트도 쪽 수를 세야 해서 서버 전용(next/headers)을 부르는
// bp-admins.ts 와 떼어 둔다(platform-admin-paging.ts 와 같은 이유).
export const BP_ADMIN_PAGE_SIZES = [20, 50, 100] as const;
export type BpAdminPageSize = (typeof BP_ADMIN_PAGE_SIZES)[number];
