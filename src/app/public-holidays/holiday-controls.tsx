"use client";

import { createContext, use, useOptimistic, useTransition, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonthPicker, Select } from "@/components/common";
import { holidaysHref, moveHolidayQuery, weekdayOf, YEAR_OPTIONS, type HolidayQuery } from "@/lib/public-holiday-view";

// 플랫폼 휴일 관리의 이동 조작(목록의 연도 선택칸 · 캘린더의 연 · 월 고르기 판, 캘린더 · 목록 탭, 오늘 · 이전 · 다음 달). 화면 상태는 주소에만 둔다(public-holiday-view.ts).
// 고른 값은 서버가 새 화면을 줄 때까지 먼저 보인다(급여명세서 목록과 같다). 낙관적 상태를 HolidayNavigation 하나가 모두 나눠 가져,
// 연도를 고르고 응답 전에 월 · 탭 · 달 이동을 눌러도 앞의 선택을 잃지 않는다 — 조작마다 따로 두면 저마다 서버가 준 옛 값에서 출발한다.

type Navigation = { current: HolidayQuery; navigate: (next: HolidayQuery) => void };
const NavigationContext = createContext<Navigation | null>(null);

function useNavigation(): Navigation {
  const navigation = use(NavigationContext);
  if (!navigation) throw new Error("HolidayNavigation 안에서만 쓴다");
  return navigation;
}

export function HolidayNavigation({ query, children }: { query: HolidayQuery; children: ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: HolidayQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.push(holidaysHref(next), { scroll: false });
    });
  return <NavigationContext value={{ current, navigate }}>{children}</NavigationContext>;
}

/** 링크 클릭을 같은 이동으로 돌린다. 새 탭 열기(보조 키 · 가운데 단추)는 브라우저에 맡긴다. */
function useMove(target: HolidayQuery | null) {
  const { navigate } = useNavigation();
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (!target || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(target);
  };
}

// 연도 선택칸은 목록에만, 캘린더는 연 · 월 고르기 판(MonthPick)으로 옮긴다(S-DDGJKQ — 월 이동과 월 선택은 캘린더에만, 2026-10-30 사용자 지정).
export function YearSelect() {
  const { current, navigate } = useNavigation();
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

/** 캘린더 제목 자리의 「2026년 10월 ▾」 — 누르면 연 · 월 고르기 판(BP 휴일 관리와 같다, 2026-10-30 사용자 지정 — 전엔 월 선택칸 + 따로 제목) */
export function MonthPick({ today }: { today: string }) {
  const { current, navigate } = useNavigation();
  return (
    <MonthPicker
      year={current.year}
      month={current.month}
      years={YEAR_OPTIONS}
      current={{ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) }}
      onPick={(year, month) => navigate({ ...current, year, month })}
    />
  );
}

// 데모 tabs — 고른 탭은 브랜드 밑줄 · 굵게
const tab = (active: boolean) =>
  `-mb-px flex h-[42px] items-center border-b-2 px-[18px] text-[15px] transition-colors duration-150 ease-out ${
    active ? "border-erp-brand font-semibold text-erp-ink" : "border-transparent font-medium text-erp-label hover:text-erp-ink"
  }`;

export function ViewTab({ view, children }: { view: HolidayQuery["view"]; children: ReactNode }) {
  const { current } = useNavigation();
  const target = { ...current, view };
  const onClick = useMove(target);
  return (
    <Link href={holidaysHref(target)} onClick={onClick} aria-current={current.view === view ? "page" : undefined} className={tab(current.view === view)} scroll={false}>
      {children}
    </Link>
  );
}

/** 「오늘 · 2026-10-30(금)」 — 이번 달(한국 날짜)로. 보기는 그대로다. 좌우 화살표와 같은 흰 상자, 날짜는 작고 흐리게(BP 휴일 관리와 같다, 2026-10-30 사용자 지정) */
export function TodayButton({ today }: { today: string }) {
  const { current } = useNavigation();
  const target = moveHolidayQuery(current, { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
  const onClick = useMove(target);
  return (
    <Link href={holidaysHref(target ?? current)} onClick={onClick} scroll={false} className={`${ICON_BUTTON} w-auto! px-[14px] text-[14px] font-medium text-erp-ink`}>
      <span className="whitespace-nowrap">
        오늘<span className="ml-[6px] text-[12px] font-normal text-erp-label">· {today}({weekdayOf(today)})</span>
      </span>
    </Link>
  );
}

// 데모 iconBtn(이전 · 다음 달) — 근무스케줄 관리의 주 이동과 같은 껍데기
const ICON_SHELL = "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white";
const ICON_BUTTON = `${ICON_SHELL} transition-[border-color] duration-150 ease-out hover:border-erp-brand`;

/** 이전 · 다음 달. 해를 넘기고, 2000년 1월 앞 · 2100년 12월 뒤는 갈 곳이 없어 막힌 버튼으로 둔다. */
export function MonthStep({ shift }: { shift: -1 | 1 }) {
  const { current } = useNavigation();
  const target = moveHolidayQuery(current, { shift });
  const onClick = useMove(target);
  const label = shift < 0 ? "이전달" : "다음달";
  // 화살표는 먹색으로 — 회색 아이콘 파일은 흰 상자 위에서 잘 안 보였다(BP 휴일 관리와 같다, 2026-10-30)
  const img = (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-[16px] text-erp-ink">
      <path d={shift < 0 ? "M11 14L5 8L11 2" : "M5 14L11 8L5 2"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return target ? (
    <Link href={holidaysHref(target)} onClick={onClick} aria-label={label} scroll={false} className={ICON_BUTTON}>
      {img}
    </Link>
  ) : (
    // 막힌 버튼은 호버에 반응하지 않는다 — 호버 테두리가 없는 껍데기만 쓴다
    <button type="button" aria-label={label} disabled className={`${ICON_SHELL} opacity-40`}>
      {img}
    </button>
  );
}
