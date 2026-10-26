import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, DataTable, PageBar, type Column } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { getPublicHolidays, type PublicHoliday } from "@/lib/public-holidays";
import {
  calendarWeeks,
  dateKey,
  holidaysHref,
  needsAnnouncementNote,
  parseHolidayQuery,
  shiftHolidayMonth,
  WEEKDAY_HEADERS,
  weekdayOf,
  type HolidayQuery,
} from "@/lib/public-holiday-view";
import { kstToday } from "@/lib/staff-members";
import { MonthSelect, YearSelect } from "./holiday-controls";

// 플랫폼 휴일 관리(S-DDGJKQ · F-CNPWOQ). 목업 docs/mockup/system/holidays.html · 데모 docs/demo/system/holidays.html 을 공통 컴포넌트로 옮겼다.
// 조회 전용이다 — 대한민국 공식 휴일만 보이고 등록 · 수정 · 삭제, 연도별 불러오기, 휴일 구분 필터가 없다.
// 들어오면 늘 이번 달 캘린더다(SYSTEM-8). 데이터는 캘린더면 그 달(GET /public-holidays?year=&month=), 목록이면 그 해 전체(?year=)다.
// 계산값과 정부 발표값은 구분하지 않는다. 동기화가 실패했으면 값은 그대로 보이고 실패만 알린다(SYSTEM-9).

// 데모 tabs — 고른 탭은 브랜드 밑줄 · 굵게
const tab = (active: boolean) =>
  `-mb-px flex h-[42px] items-center border-b-2 px-[18px] text-[15px] transition-colors duration-150 ease-out ${
    active ? "border-erp-brand font-semibold text-erp-ink" : "border-transparent font-medium text-erp-label hover:text-erp-ink"
  }`;
// 데모 iconBtn(이전 · 다음 달) — 근무스케줄 관리의 주 이동과 같은 껍데기
const ICON_SHELL = "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white";
const ICON_BUTTON = `${ICON_SHELL} transition-[border-color] duration-150 ease-out hover:border-erp-brand`;

export default async function PublicHolidaysPage({ searchParams }: PageProps<"/public-holidays">) {
  const today = kstToday();
  const query = parseHolidayQuery(await searchParams, today);
  // 캘린더는 그 달만, 목록은 그 해 전체를 받는다
  const data = await getPublicHolidays(query.year, query.view === "calendar" ? query.month : undefined);
  const todayYear = Number(today.slice(0, 4));
  const { lastSynchronizedAt, failedYears } = data.synchronization;

  return (
    <>
      <PageBar title="플랫폼 휴일 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <main className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex flex-wrap items-center gap-[12px]">
            <YearSelect query={query} />
            {lastSynchronizedAt && <span className="text-[14px] text-erp-label">최종 동기화 {formatDateTime(lastSynchronizedAt)}</span>}
            {needsAnnouncementNote(query.year, todayYear) && <span className="text-[14px] text-erp-label">임시공휴일 · 선거일은 정부 발표 후 반영됩니다</span>}
          </div>
          {/* 동기화 대상은 올해 · 다음 해뿐이라 고른 해가 실패 목록에 있을 때만 알린다 */}
          {failedYears.includes(query.year) && (
            <div role="status" className="flex flex-col gap-[6px] rounded-[2px] border border-erp-off bg-erp-off-bg px-[18px] py-[12px] text-[14px]">
              <p className="font-semibold text-erp-off">{query.year}년 공식 휴일 동기화가 실패했습니다 — 저장된 휴일을 그대로 보여 드립니다</p>
              <p className="text-erp-ink">실패한 동기화는 휴일을 바꾸지 않았습니다. 아래 휴일은 직전 동기화 값 또는 규칙으로 계산한 값이며, 다음 정기 동기화에서 다시 맞춥니다.</p>
            </div>
          )}
          <div className="flex min-h-0 flex-col gap-[12px]">
            <nav aria-label="보기" className="flex shrink-0 border-b border-erp-bar-line">
              <Link href={holidaysHref({ ...query, view: "calendar" })} aria-current={query.view === "calendar" ? "page" : undefined} className={tab(query.view === "calendar")} scroll={false}>
                캘린더
              </Link>
              <Link href={holidaysHref({ ...query, view: "list" })} aria-current={query.view === "list" ? "page" : undefined} className={tab(query.view === "list")} scroll={false}>
                목록
              </Link>
            </nav>
            {query.view === "calendar" ? (
              <HolidayCalendar query={query} today={today} holidays={data.items} total={data.total} />
            ) : (
              <HolidayList year={query.year} holidays={data.items} total={data.total} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// 카드 안 묶음 제목 줄(데모 sectionHead) — 제목 옆에 휴일 수를 작게
function SectionHead({ title, count, children }: { title: string; count: number; children?: ReactNode }) {
  return (
    <div className="flex items-end gap-[6px]">
      <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">
        {title}
        <span className="ml-[10px] text-[14px] font-normal text-erp-label">공식 휴일 {count}일</span>
      </h2>
      {children}
    </div>
  );
}

function Legend({ mark, text }: { mark: string; text: string }) {
  return (
    <span className="flex items-center gap-[6px] text-[14px] text-erp-ink">
      <i className={`inline-block size-[10px] rounded-[2px] ${mark}`} />
      {text}
    </span>
  );
}

/** 월 캘린더. 1팀 공통 컴포넌트에 없어 표 선 · 표 머리 바탕으로 그린다. 공식 휴일만 상태 빨강으로 칠하고 토 · 일은 칠하지 않는다. */
function HolidayCalendar({ query, today, holidays, total }: { query: HolidayQuery; today: string; holidays: PublicHoliday[]; total: number }) {
  const { year, month } = query;
  // 한 날짜에 한 건이다 — 겹친 휴일은 api 가 이름을 이어 붙여 준다(예 「어린이날 · 부처님오신날」)
  const byDate = new Map(holidays.map((h) => [h.holidayDate, h]));
  const prev = shiftHolidayMonth(query, -1);
  const next = shiftHolidayMonth(query, 1);
  const thisMonth = { ...query, year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };

  return (
    <>
      <div className="flex items-center gap-[6px]">
        <Button variant="off" href={holidaysHref(thisMonth)} scroll={false}>
          오늘
        </Button>
        <MonthLink target={prev} label="이전달" icon="/icons/prev.svg" />
        <MonthLink target={next} label="다음달" icon="/icons/next.svg" />
        <MonthSelect query={query} />
      </div>
      <SectionHead title={`${year}년 ${month}월`} count={total}>
        <span className="flex gap-[18px]">
          <Legend mark="bg-erp-off" text="공식 휴일" />
          <Legend mark="border border-erp-brand" text={`오늘 ${today}`} />
        </span>
      </SectionHead>
      <table aria-label={`${year}년 ${month}월 캘린더`} className="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]">
        <thead>
          <tr className="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">
            {WEEKDAY_HEADERS.map((w) => (
              <th key={w} scope="col" className="px-[10px] text-left font-medium text-erp-thead-text">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendarWeeks(year, month).map((week, w) => (
            <tr key={w}>
              {week.map((day, i) => {
                const line = `h-[92px] border-b border-erp-thead-line p-[10px] align-top ${i ? "border-l" : ""}`;
                if (day === null) return <td key={i} className={`${line} bg-erp-thead-bg`} />;
                const key = dateKey(year, month, day);
                const holiday = byDate.get(key);
                const isToday = key === today;
                // 오늘은 휴일이어도 테두리를 씌운다 — 범례의 「오늘」을 달력에서 늘 찾을 수 있게. 글자색은 휴일이면 상태 빨강을 지킨다.
                const dayColor = holiday ? "font-semibold text-erp-off" : isToday ? "font-semibold text-erp-brand" : "text-erp-ink";
                return (
                  <td key={i} aria-current={isToday ? "date" : undefined} className={`${line} ${holiday ? "bg-erp-off-bg" : ""}`}>
                    <span className={`text-[14px] ${dayColor} ${isToday ? "inline-grid h-[24px] min-w-[24px] place-items-center rounded-[2px] border border-erp-brand px-[4px]" : ""}`}>
                      {day}
                      {isToday && <span className="sr-only"> 오늘</span>}
                    </span>
                    {holiday && (
                      <p className="mt-[6px] truncate text-[13px] font-medium text-erp-off" title={holiday.name}>
                        {holiday.name}
                      </p>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/** 이전 · 다음 달. 2000년 1월 앞 · 2100년 12월 뒤는 갈 곳이 없어 막힌 버튼으로 둔다. */
function MonthLink({ target, label, icon }: { target: HolidayQuery | null; label: string; icon: string }) {
  const img = <Image src={icon} alt="" width={16} height={16} />;
  return target ? (
    <Link href={holidaysHref(target)} aria-label={label} scroll={false} className={ICON_BUTTON}>
      {img}
    </Link>
  ) : (
    // 막힌 버튼은 호버에 반응하지 않는다 — 호버 테두리가 없는 껍데기만 쓴다
    <button type="button" aria-label={label} disabled className={`${ICON_SHELL} opacity-40`}>
      {img}
    </button>
  );
}

const LIST_COLUMNS: Column<PublicHoliday>[] = [
  {
    header: "날짜",
    width: "w-[220px]",
    cell: (h) => (
      <>
        <span className="text-erp-off">{h.holidayDate}</span> <span className="text-erp-label">({weekdayOf(h.holidayDate)})</span>
      </>
    ),
  },
  { header: "휴일명", align: "left", cell: (h) => h.name },
  { header: "비고", align: "left", cell: (h) => h.note || <span className="text-erp-muted">—</span> },
];

/** 목록 보기 — 고른 연도 한 해를 날짜순으로(SYSTEM-9). 월 이동 · 월 선택은 없다. */
function HolidayList({ year, holidays, total }: { year: number; holidays: PublicHoliday[]; total: number }) {
  return (
    <>
      <SectionHead title={`${year}년`} count={total}>
        <span className="text-[14px] text-erp-label">목록은 고른 연도 한 해를 보여 줍니다</span>
      </SectionHead>
      <DataTable columns={LIST_COLUMNS} rows={holidays} rowKey={(h) => h.publicHolidayId} />
    </>
  );
}
