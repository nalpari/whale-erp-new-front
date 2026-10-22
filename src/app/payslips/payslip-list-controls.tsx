"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useOptimistic, useRef, useState, useTransition } from "react";
import { Pagination, Select } from "@/components/common";
import { EASE_OUT } from "@/components/common/theme";
import { PAGE_SIZES, monthLabel, shiftMonth, type PageSize, type PayslipListQuery } from "@/lib/payslips";
import { toPayslipListSearch, withFilter } from "./payslip-list-query";

/**
 * 낙관적 쿼리로 URL 을 바꾼다 — 서버 응답 전에 한 번 더 바꿔도 앞의 변경을 잃지 않는다(직원 목록과 같은 방식).
 * 조작은 router.replace 라 기록을 쌓지 않는다.
 */
export function usePayslipListNavigation(query: PayslipListQuery) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: PayslipListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/payslips${toPayslipListSearch(next)}`, { scroll: false });
    });
  return { current, navigate };
}

// 페이지당 건수(20 · 50 · 100). 바꾸면 1쪽으로 돌아간다(직원 목록과 같다).
export function PayslipPageSize({ query }: { query: PayslipListQuery }) {
  const { current, navigate } = usePayslipListNavigation(query);
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

export function PayslipPagination({ query, totalPages }: { query: PayslipListQuery; totalPages: number }) {
  const { current, navigate } = usePayslipListNavigation(query);
  return <Pagination page={current.page} totalPages={totalPages} onPageChange={(page) => navigate({ ...current, page })} />;
}

const ICON_BUTTON =
  "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";
const POPOVER =
  `fixed m-0 w-[268px] rounded-[2px] border border-[#ebebeb] bg-white p-[16px] shadow-[0_2px_6px_rgba(40,47,55,0.08)] ` +
  `font-erp tracking-[-0.025em] text-erp-ink scheme-light ` +
  `-translate-y-[4px] opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-150 ${EASE_OUT} ` +
  `open:translate-y-0 open:opacity-100 starting:open:-translate-y-[4px] starting:open:opacity-0 ` +
  `motion-reduce:translate-y-0 motion-reduce:transition-none [&_*:focus-visible]:outline-erp-brand! [&_button]:cursor-pointer`;
const NAV = "grid size-[28px] place-items-center rounded-[2px] text-erp-label transition-colors duration-150 ease-out hover:bg-erp-thead-bg";

/**
 * 달 이동: ‹ 2026년 8월 › — 가운데를 누르면 열두 달 판(데모 weekNav month, 2026-10-02 재영). 「급여 월」 선택칸 대신이다.
 * 판은 popover 라 바깥 클릭 · Esc 로 닫힌다. 열 때 버튼 바로 아래에 둔다.
 */
export function PayslipMonthNav({ query }: { query: PayslipListQuery }) {
  const { current, navigate } = usePayslipListNavigation(query);
  const [year, setYear] = useState(() => Number(query.month.slice(0, 4)));
  const popId = useId();
  const pop = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const go = (month: string) => navigate(withFilter(current, { month }));

  return (
    <div className="flex items-center gap-[6px]">
      <button type="button" aria-label="이전 달" onClick={() => go(shiftMonth(current.month, -1))} className={ICON_BUTTON}>
        <Image src="/icons/prev.svg" alt="" width={16} height={16} />
      </button>
      <button
        ref={trigger}
        type="button"
        popoverTarget={popId}
        aria-haspopup="dialog"
        onClick={() => setYear(Number(current.month.slice(0, 4)))}
        className="h-[34px] min-w-[190px] rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink transition-[border-color] duration-150 ease-out hover:border-erp-brand"
      >
        {monthLabel(current.month)}
      </button>
      <button type="button" aria-label="다음 달" onClick={() => go(shiftMonth(current.month, 1))} className={ICON_BUTTON}>
        <Image src="/icons/next.svg" alt="" width={16} height={16} />
      </button>
      <div
        ref={pop}
        id={popId}
        popover="auto"
        role="dialog"
        aria-label="달 선택"
        onToggle={(e) => {
          if ((e.nativeEvent as ToggleEvent).newState !== "open" || !pop.current || !trigger.current) return;
          const r = trigger.current.getBoundingClientRect();
          pop.current.style.left = `${r.left}px`;
          pop.current.style.top = `${r.bottom + 6}px`;
        }}
        className={POPOVER}
      >
        <div className="flex items-center justify-between">
          <button type="button" aria-label="이전 해" onClick={() => setYear((y) => y - 1)} className={NAV}>
            <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} />
          </button>
          <p aria-live="polite" className="text-[15px] font-semibold text-erp-ink">
            {year}년
          </p>
          <button type="button" aria-label="다음 해" onClick={() => setYear((y) => y + 1)} className={NAV}>
            <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="rotate-180" />
          </button>
        </div>
        <div className="mt-[12px] grid grid-cols-4 gap-[6px]">
          {Array.from({ length: 12 }, (_, i) => {
            const month = `${year}-${String(i + 1).padStart(2, "0")}`;
            const selected = month === current.month;
            return (
              <button
                key={month}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  pop.current?.hidePopover();
                  trigger.current?.focus();
                  go(month);
                }}
                className={`h-[32px] rounded-[2px] text-[14px] transition-colors duration-150 ease-out ${
                  selected ? "bg-erp-brand text-white" : "text-erp-ink hover:bg-erp-thead-bg"
                }`}
              >
                {i + 1}월
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
