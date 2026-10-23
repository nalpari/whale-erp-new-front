"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DateField } from "@/components/common";
import { addDays, MAX_PERIOD_DAYS } from "./attendance-query";

// 보정이 필요한 기록의 기간(데모 fixList 머리의 기간 시작 ~ 끝). 최근 3개월 안 — 바꾼 쪽은 그대로 두고 다른 쪽을 순서 · 92일 한도 안으로
// 맞춘다. 다른 조건은 주소 그대로 두고 fixFrom · fixTo 만 바꾼다.
export function FixPeriod({ from, to, today }: { from: string; to: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [, startTransition] = useTransition();
  const reach = MAX_PERIOD_DAYS - 1;
  const set = (nextFrom: string, nextTo: string, moved: "from" | "to") => {
    let f = nextFrom;
    let t = nextTo > today ? today : nextTo;
    if (moved === "from") {
      if (t < f) t = f;
      if (addDays(f, reach) < t) t = addDays(f, reach);
    } else {
      if (f > t) f = t;
      if (addDays(t, -reach) > f) f = addDays(t, -reach);
    }
    const params = new URLSearchParams(search.toString());
    params.set("fixFrom", f);
    params.set("fixTo", t);
    startTransition(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  };
  return (
    <span className="flex items-center gap-[6px]">
      <span className="w-[150px] shrink-0">
        <DateField aria-label="기간 시작" value={from} onChange={(v) => v && set(v, to, "from")} />
      </span>
      <span>~</span>
      <span className="w-[150px] shrink-0">
        <DateField aria-label="기간 끝" value={to} onChange={(v) => v && set(from, v, "to")} />
      </span>
    </span>
  );
}
