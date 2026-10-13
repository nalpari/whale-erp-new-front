// 공통코드 화면의 주소. 쪽(page) · 고른 그룹(group)을 주소에 두어 새로 고쳐도, 링크를 보내도 같은 화면이 선다.
// permission 은 로그인 전 임시 권한(current-permission.ts) — 개발 중 조회만 화면을 볼 때 주소에 남긴다.
export type CodesQuery = { page?: number; group?: string; permission?: "view" };

export function codesHref({ page, group, permission }: CodesQuery): string {
  const params = new URLSearchParams();
  if (page && page > 1) params.set("page", String(page));
  if (group) params.set("group", group);
  if (permission) params.set("permission", permission);
  const query = params.toString();
  return `/platform/system/codes${query ? `?${query}` : ""}`;
}
