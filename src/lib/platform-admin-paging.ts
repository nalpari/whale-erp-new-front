// 플랫폼 관리자 목록 · 이력의 한 쪽 건수. 클라이언트 컴포넌트도 쪽 수를 세야 해서 서버 전용(next/headers)을 부르는
// platform-admins.ts 와 떼어 둔다 — 거기서 값을 가져오면 클라이언트 번들에 api.ts 가 끌려 들어가 빌드가 깨진다.
export const ADMIN_PAGE_SIZE = 20;
export const HISTORY_PAGE_SIZE = 10;
