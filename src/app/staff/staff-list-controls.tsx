"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { Pagination, Select } from "@/components/common";
import { PAGE_SIZES, type PageSize, type StaffListQuery } from "@/lib/staff-members";
import { toStaffListSearch, withFilter } from "./staff-list-query";

/**
 * 낙관적 쿼리로 URL 을 바꾼다 — 같은 컴포넌트 안에서는 서버 응답 전에 한 번 더 바꿔도 앞의 변경을 잃지 않는다(필터와
 * 같은 방식). 필터 · 건수 · 쪽은 각자 낙관적 쿼리를 들고 있어, 서로 다른 조작을 응답 전에 섞으면 앞의 것이 사라질 수 있다.
 */
function useStaffListNavigation(query: StaffListQuery) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: StaffListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/staff${toStaffListSearch(next)}`, { scroll: false });
    });
  return { current, navigate };
}

// 페이지당 건수. 바꾸면 1쪽으로 돌아간다.
export function StaffPageSize({ query }: { query: StaffListQuery }) {
  const { current, navigate } = useStaffListNavigation(query);
  return (
    <div className="w-[80px] shrink-0">
      <Select
        aria-label="페이지당 건수"
        value={String(current.pageSize)}
        onChange={(e) => navigate(withFilter(current, { pageSize: Number(e.target.value) as PageSize }))}
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function StaffPagination({ query, totalPages }: { query: StaffListQuery; totalPages: number }) {
  const { current, navigate } = useStaffListNavigation(query);
  return <Pagination page={current.page} totalPages={totalPages} onPageChange={(page) => navigate({ ...current, page })} />;
}
