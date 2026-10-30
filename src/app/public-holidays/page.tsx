import type { ReactNode } from "react";
import { DataTable, NoticeBand, PageBar, type Column } from "@/components/common";
import { deniedMessage, ListFailure } from "@/components/community/list-load";
import { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { getPublicHolidays, type PublicHoliday, type PublicHolidayList } from "@/lib/public-holidays";
import {
  calendarCells,
  holidaysHref,
  needsAnnouncementNote,
  parseHolidayQuery,
  showsSyncFailure,
  WEEKDAY_HEADERS,
  weekdayOf,
  type HolidayQuery,
} from "@/lib/public-holiday-view";
import { kstToday } from "@/lib/staff-members";
import { HolidayNavigation, MonthPick, MonthStep, TodayButton, ViewTab, YearSelect } from "./holiday-controls";

// 플랫폼 휴일 관리(S-DDGJKQ · F-CNPWOQ). 목업 docs/mockup/system/holidays.html · 데모 docs/demo/system/holidays.html 을 공통 컴포넌트로 옮겼다.
// 조회 전용이다 — 대한민국 공식 휴일만 보이고 등록 · 수정 · 삭제, 연도별 불러오기, 휴일 구분 필터가 없다.
// 들어오면 늘 이번 달 캘린더다(SYSTEM-8). 데이터는 캘린더면 그 달(GET /public-holidays?year=&month=), 목록이면 그 해 전체(?year=)다.
// 계산값과 정부 발표값은 구분하지 않는다. 동기화가 실패했으면 값은 그대로 보이고 실패만 알린다(SYSTEM-9).
// 화면의 판단(칸 · 안내 · api 경로)은 public-holiday-view.ts 에 두고 테스트한다. 이동 조작은 holiday-controls.tsx 다.

export default async function PublicHolidaysPage({ searchParams }: PageProps<"/public-holidays">) {
  const today = kstToday();
  const query = parseHolidayQuery(await searchParams, today);

  // 로그인 끊김(401) · 권한 없음(403)은 다시 해도 같아 다시 시도 없이 안내만 보인다(커뮤니티 목록과 같다). 그 밖의 오류는 error.tsx 가 받는다.
  let data: PublicHolidayList;
  try {
    data = await getPublicHolidays(query);
  } catch (error) {
    if (!(error instanceof ApiError && (error.status === 401 || error.status === 403))) throw error;
    return (
      <>
        <PageBar title="플랫폼 휴일 관리" />
        <ListFailure failure={deniedMessage(error.status, "플랫폼 휴일을 볼 권한이 없습니다.")} denied retryHref={holidaysHref(query)} />
      </>
    );
  }
  const { lastSynchronizedAt, failedYears } = data.synchronization;

  return (
    <>
      <PageBar title="플랫폼 휴일 관리" />
      <HolidayNavigation query={query}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
          <main className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
            {/* 연도 선택칸은 목록 보기에만 — 캘린더는 제목 줄의 「2026년 10월 ▾」에서 연 · 월을 함께 고른다(2026-10-30 사용자 지정) */}
            <div className="flex flex-wrap items-center gap-[12px]">
              {query.view === "list" && <YearSelect />}
              {lastSynchronizedAt && <span className="text-[14px] text-erp-label">최종 동기화 {formatDateTime(lastSynchronizedAt)}</span>}
              {needsAnnouncementNote(query.year, Number(today.slice(0, 4))) && <span className="text-[14px] text-erp-label">임시공휴일 · 선거일은 정부 발표 후 반영됩니다.</span>}
            </div>
            {showsSyncFailure(failedYears, query.year) && (
              // 실패 띠는 공통 NoticeBand(risk · role=alert) — 화면 낭독기가 바로 읽는다(2026-10-30 재영)
              <NoticeBand
                title={`${query.year}년 공식 휴일 동기화가 실패했습니다 — 저장된 휴일을 그대로 보여 드립니다.`}
                detail="실패한 동기화는 휴일을 바꾸지 않았습니다. 아래 휴일은 직전 동기화 값 또는 규칙으로 계산한 값이며, 다음 정기 동기화에서 다시 맞춥니다."
              />
            )}
            <div className="flex min-h-0 flex-col gap-[12px]">
              <nav aria-label="보기" className="flex shrink-0 border-b border-erp-bar-line">
                <ViewTab view="calendar">캘린더</ViewTab>
                <ViewTab view="list">목록</ViewTab>
              </nav>
              {query.view === "calendar" ? (
                <HolidayCalendar query={query} today={today} holidays={data.items} total={data.total} />
              ) : (
                <HolidayList year={query.year} holidays={data.items} total={data.total} />
              )}
            </div>
          </main>
        </div>
      </HolidayNavigation>
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

  return (
    <>
      {/* 제목 자리에 달 이동 — [2026년 10월 ●] ‹ › [오늘 · 날짜] 공식 휴일 N일, 오른쪽 범례는 「공식 휴일」 하나(BP 휴일 관리와 같다, 2026-10-30 사용자 지정 —
          전엔 [오늘] ‹ › [월] 줄 아래 「2026년 10월」 제목이 따로 있고 범례에 「오늘 날짜」가 있었다) */}
      <div className="flex items-center gap-[6px]">
        <div role="group" aria-label="달 이동" className="flex flex-1 items-center gap-[6px]">
          <MonthPick today={today} />
          <MonthStep shift={-1} />
          <MonthStep shift={1} />
          <TodayButton today={today} />
          <span className="ml-[12px] text-[14px] text-erp-label">공식 휴일 {total}일</span>
        </div>
        <Legend mark="bg-erp-off" text="공식 휴일" />
      </div>
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
          {calendarCells(year, month, holidays, today).map((week, w) => (
            <tr key={w}>
              {week.map((cell, i) => {
                const line = `h-[92px] border-b border-erp-thead-line p-[10px] align-top ${i ? "border-l" : ""}`;
                if (cell === null) return <td key={i} className={`${line} bg-erp-thead-bg`} />;
                const { day, holiday, isToday } = cell;
                // 오늘은 휴일이어도 테두리를 씌운다. 글자색은 휴일이면 상태 빨강을 지킨다.
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
  // 비어 있으면 다른 목록과 같은 짧은 「-」(2026-10-30 사용자 지정 — 전엔 긴 줄표 「—」)
  { header: "비고", align: "left", cell: (h) => h.note || <span className="text-erp-muted">-</span> },
];

/** 목록 보기 — 고른 연도 한 해를 날짜순으로(SYSTEM-9). 월 이동 · 월 선택은 없다. */
function HolidayList({ year, holidays, total }: { year: number; holidays: PublicHoliday[]; total: number }) {
  return (
    <>
      <SectionHead title={`${year}년`} count={total}>
        <span className="text-[14px] text-erp-label">선택한 연도의 공식 휴일을 모두 표시합니다.</span>
      </SectionHead>
      <DataTable columns={LIST_COLUMNS} rows={holidays} rowKey={(h) => h.publicHolidayId} />
    </>
  );
}
