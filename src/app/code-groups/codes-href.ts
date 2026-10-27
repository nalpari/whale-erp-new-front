// 공통코드 화면의 주소. 검색(그룹 코드 · 그룹명 · 관리주체) · 고른 그룹(group)을 주소에 두어 새로 고쳐도, 링크를 보내도 같은 화면이 선다.
// 그룹 목록은 쪽을 나누지 않는다(2026-10-27 사용자 지정).
export type CodesQuery = { group?: string; groupCode?: string; groupName?: string; manageOwnerCode?: string };

export function codesHref({ group, groupCode, groupName, manageOwnerCode }: CodesQuery): string {
  const params = new URLSearchParams();
  if (groupCode) params.set("groupCode", groupCode);
  if (groupName) params.set("groupName", groupName);
  if (manageOwnerCode) params.set("manageOwnerCode", manageOwnerCode);
  if (group) params.set("group", group);
  const query = params.toString();
  return `/code-groups${query ? `?${query}` : ""}`;
}
