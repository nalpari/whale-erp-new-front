"use client";

import Image from "next/image";

const ARROW = "flex items-center gap-[4px] transition-colors duration-150 ease-out enabled:hover:text-erp-brand disabled:text-erp-thead-text";

// 현재 페이지를 가운데에 두고 최대 max 개의 번호를 고른다.
function visiblePages(page: number, totalPages: number, max: number) {
  const start = Math.max(1, Math.min(page - Math.floor(max / 2), totalPages - max + 1));
  return Array.from({ length: Math.min(max, totalPages) }, (_, i) => start + i);
}

// Figma Pagination. 번호는 최대 maxPages(기본 10)개를 현재 페이지 중심으로 보여 준다.
// 현재 페이지는 부모가 쥐고 있으므로 onPageChange 로 바꾼다.
export function Pagination({
  page,
  totalPages,
  maxPages = 10,
  onPageChange,
}: {
  page: number;
  /** 전체 건수가 아니라 전체 페이지 수 */
  totalPages: number;
  maxPages?: number;
  onPageChange: (page: number) => void;
}) {
  const go = (n: number) => {
    if (n >= 1 && n <= totalPages && n !== page) onPageChange(n);
  };

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-[17px] text-[14px] font-medium">
      <button type="button" disabled={page <= 1} onClick={() => go(page - 1)} className={`${ARROW} text-erp-ink`}>
        <Image src="/icons/prev.svg" alt="" width={16} height={16} />
        Prev
      </button>
      <ol className="flex gap-[9px]">
        {visiblePages(page, totalPages, maxPages).map((n) => (
          <li key={n}>
            <button
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => go(n)}
              className={`size-[38px] rounded-[2px] transition-[border-color,color] duration-150 ease-out ${
                n === page
                  ? "bg-erp-subtle font-semibold text-erp-ink"
                  : "border border-erp-subtle bg-white text-erp-muted hover:border-erp-brand hover:text-erp-ink"
              }`}
            >
              {n}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" disabled={page >= totalPages} onClick={() => go(page + 1)} className={`${ARROW} text-erp-ink`}>
        Next
        <Image src="/icons/next.svg" alt="" width={16} height={16} />
      </button>
    </nav>
  );
}
