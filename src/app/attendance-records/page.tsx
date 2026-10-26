import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getDailyAttendance, getPeriodAttendance } from "@/lib/attendance-records-api";
import { kstToday } from "@/lib/staff-members";
import { AttendanceFilter } from "./attendance-filter";
import { addDays, editableFromOf, matchesFilter, matchesSummary, needsFix, parseAttendanceQuery, storeParams, toAttendanceSearch, weekSummary, type AttendanceQuery } from "./attendance-query";
import { DaySection, FixSection, SummarySection } from "./attendance-sections";

// 출·퇴근 현황 조회(/attendance-records, MN000025, WHALEERP-219). 데모 docs/demo/staff/attendance.html 을 공통 컴포넌트로 옮겼다 — 왼쪽 필터 7개
// (STAFF-31), 본문은 「일별 출퇴근」(하루씩) · 「근태 요약」(한 주씩) 두 칸과 아래 「보정이 필요한 기록」(기간). 점포는 상단 범위 ↔ 필터 점포다.
// 데이터는 GET /attendance-records/daily(그날) · GET /attendance-records(근태 요약의 주 · 보정 목록 기간)이고, 필터 7개는 받은 줄을 화면이
// 거른다 — 근태 요약에는 점포 · 고용형태 · 재직 상태만 걸린다(STAFF-31). 화면 상태는 주소에만 둔다.
// 보정 · 「이상 없음」 · 이력 · 출퇴근 대신 등록은 보정이 필요한 기록에 있다(WHALEERP-218 · 220).
export default async function AttendanceRecordsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = kstToday();
  const query = parseAttendanceQuery(await searchParams, today);
  const stores = storeParams(query);
  const href = (next: Partial<AttendanceQuery>) => `/attendance-records${toAttendanceSearch({ ...query, ...next }, today)}`;

  const [day, week, fix, statusLabels, reasonLabels, employmentTypeLabels] = await Promise.all([
    getDailyAttendance(stores, query.date),
    getPeriodAttendance(stores, query.week, addDays(query.week, 6)),
    getPeriodAttendance(stores, query.fixFrom, query.fixTo),
    getEnum("AttendanceDayStatus"),
    getEnum("AttendanceReviewReason"),
    getEnum("EmploymentType"),
  ]);

  return (
    <>
      <PageBar title="출·퇴근 현황 조회" />
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <AttendanceFilter query={query} today={today} statusLabels={statusLabels} reasonLabels={reasonLabels} employmentTypeLabels={employmentTypeLabels} />
        <main className="flex min-h-0 flex-1 flex-col gap-[24px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <div className="grid grid-cols-2 items-start gap-[24px]">
            <DaySection
              rows={day.items.filter((r) => matchesFilter(r, query))}
              date={query.date}
              today={today}
              hrefOfDate={(date) => href({ date })}
              statusLabels={statusLabels}
              reasonLabels={reasonLabels}
            />
            <SummarySection summary={weekSummary(week.items.filter((r) => matchesSummary(r, query)), week.weekStaff ?? [])} week={query.week} hrefOfWeek={(w) => href({ week: w })} />
          </div>
          <FixSection
            rows={fix.items.filter((r) => needsFix(r) && matchesFilter(r, query))}
            query={query}
            today={today}
            stores={stores.toString()}
            editableFrom={editableFromOf(today)}
            reasonLabels={reasonLabels}
          />
        </main>
      </div>
    </>
  );
}
