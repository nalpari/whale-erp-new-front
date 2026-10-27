"use client";

import { DataTable, Pagination, type Column } from "@/components/common";
import { searchedEmpty, type CodeGroupSearch } from "@/components/site/code-editor/code-group-filter";
import { CodePanel } from "@/components/site/code-editor/code-panel";
import { GuardedLink, useUnsavedChanges } from "@/components/site/code-editor/unsaved-changes";
import { useCodeLabel } from "@/components/site/code-label";
import { useCurrentBp } from "@/components/site/session-gate";
import { bpCodesHref } from "@/lib/bp-code-drafts";
import { OwnerTag } from "@/components/site/code-editor/owner-tag";
import type { BpCodeGroup } from "@/lib/bp-codes";
import { bpPath } from "@/lib/bp-path";

// 가운데 공통코드 그룹 목록 — 읽기만 한다. 그룹은 플랫폼 공통코드 관리에서만 만들고 고친다(okf/config.md).
// 이 BP 에 보이는 그룹은 사용 중인 플랫폼고정 · 플랫폼제공 전부다(api 가 거른다 — BP 적용 여부는 보지 않고, 사용중지 그룹은 빠진다).
// 아직 이 BP 에 복사되지 않은 플랫폼제공 그룹은 상세 코드가 비어 있고, 플랫폼의 [BP에 적용]이 채운다.
// 그룹 코드를 누르면 오른쪽에 그 그룹의 상세 코드가 선다(?group=). 상세 코드에 저장하지 않은 변경이 있으면 이동 전에 묻는다.
export function BpCodeGroupPanel({
  groups,
  total,
  page,
  pageSize,
  search,
  selected,
}: {
  groups: BpCodeGroup[];
  total: number;
  page: number;
  pageSize: number;
  search: CodeGroupSearch;
  selected?: string;
}) {
  const bp = useCurrentBp().bpCodeId;
  const ownerLabel = useCodeLabel("MANAGE_OWNER");
  const { navigate } = useUnsavedChanges();
  const hrefOf = (q: { page?: number; group?: string }) => bpPath(bp, bpCodesHref({ ...search, ...q }));

  const columns: Column<BpCodeGroup>[] = [
    {
      header: "그룹 코드",
      width: "w-[170px]",
      align: "left",
      cell: (g) =>
        g.groupCode === selected ? (
          <b className="font-semibold" aria-current="true">
            {g.groupCode}
          </b>
        ) : (
          <GuardedLink href={hrefOf({ page, group: g.groupCode })} className="text-erp-link hover:underline">
            {g.groupCode}
          </GuardedLink>
        ),
    },
    { header: "그룹명", align: "left", cell: (g) => g.groupName },
    { header: "관리주체", width: "w-[110px]", cell: (g) => <OwnerTag code={g.manageOwnerCode}>{ownerLabel(g.manageOwnerCode)}</OwnerTag> },
  ];

  return (
    <CodePanel title="공통코드 그룹" sub={`${total.toLocaleString("ko-KR")}개`} narrow>
      <DataTable
        // 열 이름 줄까지 고정하고 그 아래만 스크롤한다(2026-10-26 사용자 지정)
        scroll
        columns={columns}
        rows={groups}
        rowKey={(g) => g.groupCode}
        // 고른 그룹은 한 단계 어두운 바탕 + 왼쪽 브랜드색 선 — 플랫폼 메뉴 관리 트리와 같다(2026-10-27 사용자 지정)
        rowState={(g) => (g.groupCode === selected ? "current" : undefined)}
        empty={searchedEmpty(search) ?? "볼 수 있는 공통코드 그룹이 없습니다."}
      />
      <div className="pt-[14px]">
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} onPageChange={(next) => navigate(hrefOf({ page: next }))} />
      </div>
    </CodePanel>
  );
}
