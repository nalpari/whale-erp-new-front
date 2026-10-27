"use client";

import { CodeGroupFilter, type CodeGroupSearch } from "@/components/site/code-editor/code-group-filter";
import { useUnsavedChanges } from "@/components/site/code-editor/unsaved-changes";
import { codesHref } from "./codes-href";

// 왼쪽 필터(공용 CodeGroupFilter, BP 공통코드 관리와 같다) — 검색하면 첫 쪽 · 첫 그룹으로 간다. 주소(?groupCode · ?groupName)에 둔다.
// 그룹 · 상세 코드에 저장하지 않은 변경이 있으면 이동 전에 묻는다.
// 관리주체 칸의 한글은 화면이 받은 MANAGE_OWNER(ownerLabels) — 그룹 목록과 같은 값을 쓴다
export function CodeFilter({ ownerLabels, ...search }: CodeGroupSearch & { ownerLabels: Record<string, string> }) {
  const { navigate } = useUnsavedChanges();
  return <CodeGroupFilter {...search} showOwner ownerLabels={ownerLabels} onSearch={(next) => navigate(codesHref(next))} />;
}
