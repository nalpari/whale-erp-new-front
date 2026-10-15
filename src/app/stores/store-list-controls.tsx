"use client";

import { Pagination, Select } from "@/components/common";
import { STORE_PAGE_SIZES, type StorePageSize } from "@/lib/store-types";
import { LineIcon } from "./store-parts";
import { useStoreListNavigation } from "./store-list-navigation";
import { withStoreFilter, type StoreView } from "./stores-query";

// 목록 도구 줄의 조작 — 카드/표 전환 · 페이지당 건수 · 쪽 넘기기. 필터와 함께 StoreListNavigationProvider 의 낙관적 쿼리 하나를 나눠 써 URL 을 바꾼다(store-list-navigation.tsx).

const VIEWS: { id: StoreView; label: string; icon: "grid" | "table" }[] = [
  { id: "cards", label: "카드", icon: "grid" },
  { id: "table", label: "표", icon: "table" },
];

/** 카드 · 표 보기 전환(데모 segment). 고른 쪽은 회색 바탕 · 굵게, 다른 쪽은 흰 바탕 · 라벨 회색 */
export function StoreViewToggle() {
  const { current, navigate } = useStoreListNavigation();
  return (
    <div role="group" aria-label="보기" className="flex shrink-0 overflow-hidden rounded-[2px] border border-erp-button-line">
      {VIEWS.map((v) => {
        const on = current.view === v.id;
        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={on}
            onClick={() => !on && navigate({ ...current, view: v.id })}
            className={`flex h-[32px] items-center gap-[6px] px-[12px] text-[14px] transition-colors duration-150 ease-out ${
              on ? "bg-erp-subtle font-semibold text-erp-ink" : "bg-white text-erp-label hover:text-erp-ink"
            }`}
          >
            <LineIcon name={v.icon} size={15} />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

/** 페이지당 건수. 바꾸면 1쪽으로 돌아간다 */
export function StorePageSizeSelect() {
  const { current, navigate } = useStoreListNavigation();
  return (
    <div className="w-[80px] shrink-0">
      <Select
        aria-label="페이지당 건수"
        value={String(current.pageSize)}
        onChange={(e) => navigate(withStoreFilter(current, { pageSize: Number(e.target.value) as StorePageSize }))}
      >
        {STORE_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function StorePagination({ totalPages }: { totalPages: number }) {
  const { current, navigate } = useStoreListNavigation();
  return <Pagination page={current.page} totalPages={totalPages} onPageChange={(page) => navigate({ ...current, page })} />;
}
