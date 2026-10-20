// 공통코드 화면의 주소. 쪽(page) · 고른 그룹(group)을 주소에 두어 새로 고쳐도, 링크를 보내도 같은 화면이 선다.
export type CodesQuery = { page?: number; group?: string };

export function codesHref({ page, group }: CodesQuery): string {
  const params = new URLSearchParams();
  if (page && page > 1) params.set("page", String(page));
  if (group) params.set("group", group);
  const query = params.toString();
  return `/code-groups${query ? `?${query}` : ""}`;
}
