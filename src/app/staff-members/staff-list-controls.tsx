"use client";

import { useRouter } from "next/navigation";
import { Pagination, Select } from "@/components/common";
import { PAGE_SIZES, type PageSize, type StaffListQuery } from "@/lib/staff-members";
import { toStaffListSearch, withFilter } from "./staff-list-query";

// 페이지당 건수. 바꾸면 1쪽으로 돌아간다.
export function StaffPageSize({ query }: { query: StaffListQuery }) {
  const router = useRouter();
  return (
    <div className="w-[80px] shrink-0">
      <Select
        aria-label="페이지당 건수"
        value={String(query.pageSize)}
        onChange={(e) =>
          router.replace(`/staff-members${toStaffListSearch(withFilter(query, { pageSize: Number(e.target.value) as PageSize }))}`, {
            scroll: false,
          })
        }
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
  const router = useRouter();
  return (
    <Pagination
      page={query.page}
      totalPages={totalPages}
      onPageChange={(page) => router.replace(`/staff-members${toStaffListSearch({ ...query, page })}`)}
    />
  );
}
