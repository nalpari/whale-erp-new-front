"use client";

import { CodeGroupFilter, type CodeGroupSearch } from "@/components/site/code-editor/code-group-filter";
import { useUnsavedChanges } from "@/components/site/code-editor/unsaved-changes";
import { useCurrentBp } from "@/components/site/session-gate";
import { bpCodesHref } from "@/lib/bp-code-drafts";
import { bpPath } from "@/lib/bp-path";

// 왼쪽 필터(공용 CodeGroupFilter) — 검색하면 첫 쪽 · 첫 그룹으로 간다. 주소(?groupCode · ?groupName)에 둔다.
// 상세 코드에 저장하지 않은 변경이 있으면 이동 전에 묻는다.
export function BpCodeFilter(search: CodeGroupSearch) {
  const bp = useCurrentBp().bpCodeId;
  const { navigate } = useUnsavedChanges();
  return <CodeGroupFilter {...search} onSearch={(next) => navigate(bpPath(bp, bpCodesHref(next)))} />;
}
