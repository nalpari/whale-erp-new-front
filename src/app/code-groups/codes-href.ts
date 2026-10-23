// 공통코드 화면의 주소. 검색(그룹 코드 · 그룹명) · 쪽(page) · 고른 그룹(group)을 주소에 두어 새로 고쳐도, 링크를 보내도 같은 화면이 선다.
export type CodesQuery = { page?: number; group?: string; groupCode?: string; groupName?: string };

export function codesHref({ page, group, groupCode, groupName }: CodesQuery): string {
  const params = new URLSearchParams();
  if (groupCode) params.set("groupCode", groupCode);
  if (groupName) params.set("groupName", groupName);
  if (page && page > 1) params.set("page", String(page));
  if (group) params.set("group", group);
  const query = params.toString();
  return `/code-groups${query ? `?${query}` : ""}`;
}
