"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useOptimistic, useTransition, type ReactNode } from "react";
import { Pagination, Select } from "@/components/common";
import { PAGE_SIZES, type PageSize } from "@/lib/staff-members";
import {
  SCHEDULE_PERIOD_LABELS,
  scheduleHref,
  STAFF_WORK_SCHEDULE_PERIODS,
  withScheduleFilter,
  type ScheduleQuery,
  type StaffWorkSchedulePeriod,
} from "./summary-view";

type Search = Record<string, string | string[] | undefined>;

type ScheduleNavigation = { current: ScheduleQuery; navigate: (next: ScheduleQuery) => void };

const ScheduleNavigationContext = createContext<ScheduleNavigation | null>(null);

/**
 * 근무스케줄 칸(WHALEERP-185)의 주소를 바꾸는 곳 — 다른 조회 조건은 두고 schedule 값만(scheduleHref). 칸 머리의 기간 · 건수(ScheduleFilters)와
 * 표 아래 쪽 번호(SchedulePagination)가 이 낙관적 조건 하나를 함께 쓴다 — 기간 · 건수를 바꾸고 응답 전에 쪽 번호를 눌러도 새 기간 · 건수가 남는다.
 * 쪽 번호는 기간 · 쪽 · 건수가 바뀔 때마다 다시 그려지는 Suspense 안에 있어 따로 상태를 들면 바꾼 값을 모른다 — 그래서 칸 전체(page.tsx 의 Box)를
 * 이 Provider 로 감싼다. 기록을 쌓지 않으며(replace) 스크롤도 그대로 둔다.
 */
export function ScheduleNavigationProvider({ query, search, children }: { query: ScheduleQuery; search: Search; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: ScheduleQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`${pathname}${scheduleHref(search, next)}`, { scroll: false });
    });
  return <ScheduleNavigationContext value={{ current, navigate }}>{children}</ScheduleNavigationContext>;
}

function useScheduleNavigation(): ScheduleNavigation {
  const navigation = use(ScheduleNavigationContext);
  if (!navigation) throw new Error("ScheduleNavigationProvider 안에서만 쓴다");
  return navigation;
}

/** 칸 머리의 기간(이번 주 · 최근 4주 · 최근 3개월 · 최근 1년 · 전체)과 페이지당 건수(20 · 50 · 100, 목록과 같다). 바꾸면 1쪽으로 돌아간다 */
export function ScheduleFilters() {
  const { current, navigate } = useScheduleNavigation();
  return (
    <>
      <div className="w-[120px] shrink-0">
        <Select
          aria-label="기간"
          value={current.period}
          onChange={(e) => navigate(withScheduleFilter(current, { period: e.target.value as StaffWorkSchedulePeriod }))}
        >
          {STAFF_WORK_SCHEDULE_PERIODS.map((period) => (
            <option key={period} value={period}>
              {SCHEDULE_PERIOD_LABELS[period]}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-[80px] shrink-0">
        <Select
          aria-label="페이지당 건수"
          value={String(current.pageSize)}
          onChange={(e) => navigate(withScheduleFilter(current, { pageSize: Number(e.target.value) as PageSize }))}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}

/** 표 아래 페이지 번호 */
export function SchedulePagination({ totalPages }: { totalPages: number }) {
  const { current, navigate } = useScheduleNavigation();
  return <Pagination page={current.page} totalPages={totalPages} onPageChange={(page) => navigate({ ...current, page })} />;
}
