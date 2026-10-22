"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useId, useLayoutEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { EASE_OUT } from "@/components/common/theme";
import { addDays, mondayOf } from "../../work-schedules/work-schedule-query";
import { shiftYearMonth, weekHref, weekLabel, weekMonthOf, weekRowLabel, weekRowsOf, yearMonthLabel } from "./summary-view";

type Search = Record<string, string | string[] | undefined>;

// 급여명세서 목록의 달 넘김(payslip-list-controls.tsx PayslipMonthNav) · 공통 DateField 와 같은 모양이다.
const ICON_BUTTON =
  "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";
const POPOVER =
  `fixed m-0 w-[268px] rounded-[2px] border border-[#ebebeb] bg-white p-[16px] shadow-[0_2px_6px_rgba(40,47,55,0.08)] ` +
  `font-erp tracking-[-0.025em] text-erp-ink scheme-light ` +
  `-translate-y-[4px] opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-150 ${EASE_OUT} ` +
  `open:translate-y-0 open:opacity-100 starting:open:-translate-y-[4px] starting:open:opacity-0 ` +
  `motion-reduce:translate-y-0 motion-reduce:transition-none [&_*:focus-visible]:outline-erp-brand! [&_button]:cursor-pointer`;
const NAV = "grid size-[28px] place-items-center rounded-[2px] text-erp-label transition-colors duration-150 ease-out hover:bg-erp-thead-bg";
const FOOT = "text-[13px] transition-colors duration-150 ease-out";
const WEEK_MON = ["월", "화", "수", "목", "금", "토", "일"];

/**
 * 근무스케줄 칸 머리의 주 넘김(데모 staff-parts.mjs weekNav · erp.js initWeeks). ‹ 이전 주 · 가운데 「2026년 10-19 ~ 10-25」 · 다음 주 ›.
 * 가운데를 누르면 주 선택 달력(popover) — 그 달에 목요일이 드는 주들을 「N주」 줄로 보이고, 줄을 누르면 그 주로 옮기고 닫는다. ‹ › 로 달만 바꾸면
 * 고른 주는 그대로다. 주소의 week(월요일)를 바꾼다 — 기록을 쌓지 않고(replace) 스크롤도 그대로 둔다. 응답 전에 다시 눌러도 앞의 이동을 잃지 않게
 * 낙관적 주를 쓴다. today 는 서버의 kstToday() — 이번 주를 정하고 이번 주면 주소에서 뺀다.
 */
export function WeekNav({ monday, search, today }: { monday: string; search: Search; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(monday);
  const go = (next: string) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`${pathname}${weekHref(search, next, today)}`, { scroll: false });
    });

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => weekMonthOf(monday));
  const popId = useId();
  const pop = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // 버튼 아래 6px 가운데, 화면 끝에서 8px 안쪽(데모 initWeeks place). 그리기 전에 자리를 잡아 처음 열 때 (0,0) 에 빈 상자가 한 번 비치지 않게 한다
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = pop.current;
      const anchor = trigger.current;
      if (!el || !anchor) return;
      const r = anchor.getBoundingClientRect();
      el.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - el.offsetWidth / 2, window.innerWidth - el.offsetWidth - 8))}px`;
      el.style.top = `${r.bottom + 6}px`;
    };
    place();
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    // 열면 지금 주 줄로 포커스를 옮긴다
    pop.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const pick = (next: string) => {
    pop.current?.hidePopover();
    trigger.current?.focus();
    go(next);
  };

  return (
    <span className="flex items-center gap-[6px]">
      <button type="button" aria-label="이전 주" onClick={() => go(addDays(current, -7))} className={ICON_BUTTON}>
        <Image src="/icons/prev.svg" alt="" width={16} height={16} />
      </button>
      <button
        ref={trigger}
        type="button"
        popoverTarget={popId}
        aria-haspopup="dialog"
        aria-expanded={open}
        // 여닫기는 popovertarget 이 한다. 여기서는 어느 달을 펴 둘지만 정한다(지금 주의 목요일이 든 달)
        onClick={() => setMonth(weekMonthOf(current))}
        className="h-[34px] min-w-[190px] rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink transition-[border-color] duration-150 ease-out hover:border-erp-brand"
      >
        {weekLabel(current)}
      </button>
      <button type="button" aria-label="다음 주" onClick={() => go(addDays(current, 7))} className={ICON_BUTTON}>
        <Image src="/icons/next.svg" alt="" width={16} height={16} />
      </button>
      <div
        ref={pop}
        id={popId}
        popover="auto"
        role="dialog"
        aria-label="주 선택"
        onToggle={(e) => {
          const opened = (e.nativeEvent as ToggleEvent).newState === "open";
          setOpen(opened);
          // 바깥 클릭 · Esc 로 닫히면 포커스가 body 로 떨어진다. 그때만 버튼으로 되돌린다
          if (!opened && document.activeElement === document.body) trigger.current?.focus();
        }}
        onBlur={(e) => {
          // Tab 으로 달력 밖으로 나가면 닫는다(DateField 와 같은 규칙)
          const next = e.relatedTarget as Node | null;
          if (next && next !== trigger.current && !e.currentTarget.contains(next)) pop.current?.hidePopover();
        }}
        className={POPOVER}
      >
        {/* 열렸을 때만 그린다 */}
        {open && (
          <>
            <div className="flex items-center justify-between">
              <button type="button" aria-label="이전 달" onClick={() => setMonth((m) => shiftYearMonth(m, -1))} className={NAV}>
                {/* chevron-small.svg 는 왼쪽을 본다. 다음 달만 뒤집는다 */}
                <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} />
              </button>
              <p aria-live="polite" className="text-[15px] font-semibold text-erp-ink">
                {yearMonthLabel(month)}
              </p>
              <button type="button" aria-label="다음 달" onClick={() => setMonth((m) => shiftYearMonth(m, 1))} className={NAV}>
                <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="rotate-180" />
              </button>
            </div>
            <div className="mt-[12px] flex text-[12px] text-erp-label">
              <span className="w-[54px]" />
              {WEEK_MON.map((w) => (
                <span key={w} className="grid h-[28px] w-[26px] place-items-center">
                  {w}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-[2px]">
              {weekRowsOf(month).map((row, i) => {
                const selected = row.monday === current;
                return (
                  <button
                    key={row.monday}
                    type="button"
                    aria-pressed={selected}
                    aria-label={weekRowLabel(month, i + 1, row.monday)}
                    onClick={() => pick(row.monday)}
                    className={`flex w-full items-center rounded-[2px] text-[14px] transition-colors duration-150 ease-out ${
                      selected ? "bg-erp-brand text-white" : "text-erp-ink hover:bg-erp-thead-bg"
                    }`}
                  >
                    <span className="w-[54px] text-[13px] font-semibold">{i + 1}주</span>
                    {row.days.map((d) => (
                      <span key={d.date} className={`grid h-[32px] w-[26px] place-items-center ${!selected && !d.inMonth ? "text-erp-label" : ""}`}>
                        {d.day}
                      </span>
                    ))}
                  </button>
                );
              })}
            </div>
            <div className="mt-[12px] flex justify-end border-t border-erp-divider pt-[12px]">
              <button type="button" onClick={() => pick(mondayOf(today))} className={`${FOOT} text-erp-brand hover:text-erp-ink`}>
                이번 주
              </button>
            </div>
          </>
        )}
      </div>
    </span>
  );
}
