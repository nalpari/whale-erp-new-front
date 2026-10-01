"use client";

import Image from "next/image";

const ARROW = "flex items-center gap-[4px] transition-colors duration-150 ease-out enabled:hover:text-erp-brand disabled:text-erp-thead-text";

// 현재 페이지가 대략 가운데 오도록 최대 max 개를 고르고, 처음·끝에서는 창을 그대로 붙여 둔다.
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
  // 목록을 거른 뒤 페이지 수가 줄면 page 가 totalPages 를 넘는다. 그대로 두면 어느 번호도 현재로 보이지 않고
  // Prev 는 눌리는데 아무 일도 하지 않는다. 받은 값을 범위 안으로 가둬 쓴다.
  const current = Math.min(Math.max(Math.trunc(page), 1), totalPages);
  const go = (n: number) => {
    if (n >= 1 && n <= totalPages && n !== current) onPageChange(n);
  };

  if (totalPages < 1) return null;

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-[17px] text-[14px] font-medium">
      <button type="button" disabled={current <= 1} onClick={() => go(current - 1)} className={`${ARROW} text-erp-ink`}>
        <Image src="/icons/prev.svg" alt="" width={16} height={16} />
        Prev
      </button>
      <ol className="flex gap-[9px]">
        {visiblePages(current, totalPages, maxPages).map((n) => (
          <li key={n}>
            <button
              type="button"
              aria-current={n === current ? "page" : undefined}
              onClick={() => go(n)}
              // 지금 페이지도 같은 색 테두리를 깔아 둔다. 테두리를 빼면 페이지를 옮길 때마다 획이 생겼다 사라져 깜빡인다.
              className={`size-[38px] rounded-[2px] border border-erp-subtle transition-[background-color,border-color,color] duration-150 ease-out ${
                n === current
                  ? "bg-erp-subtle font-semibold text-erp-ink"
                  : "bg-white text-erp-muted hover:border-erp-brand hover:text-erp-ink"
              }`}
            >
              {n}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" disabled={current >= totalPages} onClick={() => go(current + 1)} className={`${ARROW} text-erp-ink`}>
        Next
        <Image src="/icons/next.svg" alt="" width={16} height={16} />
      </button>
    </nav>
  );
}
