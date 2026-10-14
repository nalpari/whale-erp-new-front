"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Checkbox, FilterPanel, FilterSection, Pagination, SearchField } from "@/components/common";
import type { EnumValue } from "@/lib/enums";
import { toSearch, type ListQuery } from "./contract-list";

// 필터와 페이지는 주소 쿼리에 둔다. 서버 페이지가 그 쿼리로 목록을 다시 받아 그린다.
function useGo() {
  const router = useRouter();
  const pathname = usePathname();
  return (q: ListQuery) => router.push(`${pathname}${toSearch(q)}`);
}

export function ContractFilters({ query, statuses }: { query: ListQuery; statuses: EnumValue[] }) {
  const go = useGo();
  const [storeName, setStoreName] = useState(query.storeName);
  const [staffMemberName, setStaffMemberName] = useState(query.staffMemberName);
  // 상태를 하나도 고르지 않은 주소는 「전체」다. 화면에서는 모두 켜진 것으로 보인다.
  const checked = query.status.length ? query.status : statuses.map((s) => s.value);

  // 거르는 조건이 바뀌면 첫 페이지로 간다.
  const apply = (next: Partial<ListQuery>) => go({ ...query, storeName, staffMemberName, ...next, page: 1 });

  const toggle = (value: string, on: boolean) => {
    const next = on ? [...checked, value] : checked.filter((v) => v !== value);
    // 마지막 하나는 끄지 않는다. 빈 목록은 「전체」로 읽혀 끈 것과 반대가 된다.
    if (next.length === 0) return;
    // 다 켜면 쿼리에서 빼 「전체」로 둔다. 새 상태가 생겨도 전체에 들어간다.
    apply({ status: next.length === statuses.length ? [] : statuses.map((s) => s.value).filter((v) => next.includes(v)) });
  };

  return (
    <FilterPanel
      onReset={() => {
        setStoreName("");
        setStaffMemberName("");
        go({ page: 1, storeName: "", staffMemberName: "", status: [] });
      }}
    >
      <FilterSection label="점포" tight>
        <SearchField
          placeholder="점포명"
          aria-label="점포"
          value={storeName}
          onValueChange={setStoreName}
          onSearch={(v) => apply({ storeName: v.trim() })}
        />
      </FilterSection>
      <FilterSection label="직원" tight>
        <SearchField
          placeholder="이름"
          aria-label="이름"
          value={staffMemberName}
          onValueChange={setStaffMemberName}
          onSearch={(v) => apply({ staffMemberName: v.trim() })}
        />
      </FilterSection>
      <FilterSection label="상태" last>
        {statuses.map((s) => (
          <Checkbox
            key={s.value}
            label={s.label}
            checked={checked.includes(s.value)}
            onChange={(e) => toggle(s.value, e.target.checked)}
          />
        ))}
      </FilterSection>
    </FilterPanel>
  );
}

export function ContractPagination({ query, totalPages }: { query: ListQuery; totalPages: number }) {
  const go = useGo();
  return <Pagination page={query.page} totalPages={totalPages} onPageChange={(page) => go({ ...query, page })} />;
}
