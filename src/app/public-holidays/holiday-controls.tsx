"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/common";
import { holidaysHref, YEAR_OPTIONS, type HolidayQuery } from "@/lib/public-holiday-view";

// 연도 · 월 선택칸. 고르면 바로 그 주소로 옮긴다 — 화면 상태는 주소에만 둔다(public-holiday-view.ts).
// 연도는 캘린더 · 목록이 함께 쓰고, 월은 캘린더에만 둔다(S-DDGJKQ — 월 이동과 월 선택은 캘린더에만).

/** 고른 값을 서버가 새 화면을 줄 때까지 먼저 보인다 — 아니면 api 를 부르는 동안 칸이 옛 값으로 되돌아간다(급여명세서 목록과 같다). */
function useHolidayNavigation(query: HolidayQuery) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: HolidayQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.push(holidaysHref(next), { scroll: false });
    });
  return { current, navigate };
}

export function YearSelect({ query }: { query: HolidayQuery }) {
  const { current, navigate } = useHolidayNavigation(query);
  return (
    <div className="w-[110px] shrink-0">
      <Select aria-label="연도" value={current.year} onChange={(e) => navigate({ ...current, year: Number(e.target.value) })}>
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </Select>
    </div>
  );
}

export function MonthSelect({ query }: { query: HolidayQuery }) {
  const { current, navigate } = useHolidayNavigation(query);
  return (
    <div className="w-[80px] shrink-0">
      <Select aria-label="월" value={current.month} onChange={(e) => navigate({ ...current, month: Number(e.target.value) })}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {m}월
          </option>
        ))}
      </Select>
    </div>
  );
}
