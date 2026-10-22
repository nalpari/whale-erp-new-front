import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { getWorkScheduleHistories, getWorkSchedules } from "@/lib/work-schedules-api";
import { SchedulePicker, ScheduleHistory, WeekJump } from "./schedule-controls";
import { ScheduleMonth } from "./schedule-month";
import { ScheduleWeek } from "./schedule-week";
import { addDays, historyApiSearch, mondayOf, moved, parseScheduleQuery, scheduleApiSearch, toScheduleSearch, type ScheduleQuery } from "./work-schedule-query";

// 근무스케줄 관리(#202 · #343 · #608). 목업 docs/mockup/staff/index.html 근무스케줄 탭 · 데모 docs/demo/staff/work-schedules.html 을 공통 컴포넌트로 옮겼다.
// 데이터는 GET /work-schedules(주간 7일 · 월간 42일)와 GET /work-schedules/histories(변경 이력 패널이 열렸을 때)다. 화면 상태는 주소에만 둔다.
// 등록 · 수정 · 삭제 패널과 지난 주 복사는 다음 PR 이다(계획 문서 「PR 나눔」).

const tab = (active: boolean) =>
  `flex h-[34px] items-center rounded-[2px] border px-[16px] text-[14px] transition-colors duration-150 ease-out ${
    active ? "border-erp-brand bg-erp-brand text-white" : "border-erp-button-line bg-white text-erp-ink hover:border-erp-brand"
  }`;

export default async function WorkSchedulesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = kstToday();
  const query = parseScheduleQuery(await searchParams, today);
  const href = (next: ScheduleQuery) => `/work-schedules${toScheduleSearch(next, today)}`;

  if (query.storeId === null)
    return (
      <>
        <PageBar title="근무스케줄 관리" />
        <div className="p-[24px]">
          <SchedulePicker query={query} today={today} />
        </div>
      </>
    );

  const withStore = { ...query, storeId: query.storeId };
  const [data, history, employmentLabels] = await Promise.all([
    getWorkSchedules(scheduleApiSearch(withStore)),
    query.history ? getWorkScheduleHistories(historyApiSearch(withStore)) : Promise.resolve(null),
    getEnum("EmploymentType"),
  ]);
  if (!data) notFound();
  const staffOptions = data.staff.flatMap((s) => (s.staffMemberId !== null && s.name !== null ? [{ staffMemberId: s.staffMemberId, name: s.name }] : []));

  return (
    <>
      <PageBar title="근무스케줄 관리">
        <ScheduleHistory query={query} today={today} data={history} staffOptions={staffOptions} />
      </PageBar>
      <main className="m-[24px] flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <SchedulePicker query={query} today={today} />
          <nav aria-label="보기" className="flex gap-[6px]">
            <Link href={href(moved(query, { view: "week", week: mondayOf(query.day), day: query.day }))} aria-current={query.view === "week" ? "page" : undefined} className={tab(query.view === "week")} scroll={false}>
              주간 보기
            </Link>
            <Link href={href(moved(query, { view: "month", month: query.day.slice(0, 7), day: query.day }))} aria-current={query.view === "month" ? "page" : undefined} className={tab(query.view === "month")} scroll={false}>
              월간 보기
            </Link>
          </nav>
          {query.view === "week" && (
            <div className="flex items-center gap-[6px]">
              <Link href={href(moved(query, { week: addDays(query.week, -7), day: addDays(query.day, -7) }))} aria-label="이전 주" scroll={false} className="grid size-[34px] place-items-center rounded-[2px] border border-erp-button-line">
                ‹
              </Link>
              <b className="min-w-[180px] text-center text-[15px] font-semibold">
                {query.week} ~ {addDays(query.week, 6).slice(5)}
              </b>
              <Link href={href(moved(query, { week: addDays(query.week, 7), day: addDays(query.day, 7) }))} aria-label="다음 주" scroll={false} className="grid size-[34px] place-items-center rounded-[2px] border border-erp-button-line">
                ›
              </Link>
              <WeekJump query={query} today={today} />
              <Button variant="off" href={href(moved(query, { week: mondayOf(today), day: today }))} scroll={false}>
                이번 주
              </Button>
            </div>
          )}
          <span className="ml-auto text-[13px] text-erp-label">00~24시 · 근무일은 시작한 날</span>
        </div>
        {query.view === "week" ? (
          <ScheduleWeek data={data} query={query} today={today} />
        ) : (
          <ScheduleMonth data={data} query={query} today={today} employmentLabels={employmentLabels} />
        )}
      </main>
    </>
  );
}
