import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, PageBar } from "@/components/common";
import { ApiError } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { getCopyPreview, getWorkScheduleHistories, getWorkSchedules } from "@/lib/work-schedules-api";
import { SchedulePicker, ScheduleHistory, WeekJump } from "./schedule-controls";
import { CopyButton, CopyPreviewPanel, type CopyPreviewResult } from "./schedule-copy";
import { NewScheduleButton, SchedulePanel } from "./schedule-form";
import { ScheduleMonth } from "./schedule-month";
import { ScheduleWeek } from "./schedule-week";
import { weekLabel } from "../staff-members/[id]/summary-view";
import { addDays, historyApiSearch, mondayOf, moved, parseScheduleQuery, scheduleApiSearch, toScheduleSearch, type ScheduleQuery } from "./work-schedule-query";

// 근무스케줄 관리(#202 · #343 · #608). 목업 docs/mockup/staff/index.html 근무스케줄 탭 · 데모 docs/demo/staff/work-schedules.html 을 공통 컴포넌트로 옮겼다.
// 데이터는 GET /work-schedules(주간 8일 — 전주 일요일 포함 · 월간 42일), GET /work-schedules/histories(근무표 아래 변경 이력),
// GET /work-schedules/copy-last-week(지난 주 복사 미리보기가 열렸을 때, #204)다. 화면 상태는 주소에만 둔다.
// 등록 · 수정 · 삭제는 오른쪽 패널(schedule-form.tsx, #203)이고, 지난 주 복사는 도구 줄 아래 미리보기다(schedule-copy.tsx).
// 배치는 데모 schedTab(2026-10-22 재영): 첫 줄 근무지 · 주 이동 | 지난 주 복사 · 근무스케줄 등록, 둘째 줄 주간 · 월간 전환, 근무표, 변경 이력.
// 주 이동 옆의 날짜 고르기 칸과 「이번 주」는 데모에 없지만 남긴다(재영).

// 데모 segment — 고른 쪽은 회색 바탕 · 굵게, 다른 쪽은 흰 바탕 · 라벨 회색(점포 목록 카드/표 전환과 같다)
const segment = (active: boolean) =>
  `flex h-[32px] items-center px-[12px] text-[14px] transition-colors duration-150 ease-out ${
    active ? "bg-erp-subtle font-semibold text-erp-ink" : "bg-white text-erp-label hover:text-erp-ink"
  }`;
// 데모 iconButton(이전 · 다음 주)
const ICON_BUTTON =
  "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";

/** 지난 주 복사 미리보기. 409(빈 주 아님 · 본사에게 가려진 직원) · 다른 4xx 는 문장을 미리보기 자리에 보이고, 5xx · 끊김은 고정 문구로 */
async function loadCopyPreview(storeId: number, weekStart: string): Promise<CopyPreviewResult> {
  try {
    return await getCopyPreview(storeId, weekStart);
  } catch (error) {
    // 로그인 만료(401)는 화면 전체의 일이라 그대로 올린다
    if (error instanceof ApiError && error.status === 401) throw error;
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) return { error: error.message };
    console.error("근무스케줄: GET /work-schedules/copy-last-week 를 받지 못했습니다", error);
    return { error: "지난 주 복사 미리보기를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요." };
  }
}

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
  const [data, history, copyPreview] = await Promise.all([
    getWorkSchedules(scheduleApiSearch(withStore)),
    // 이력을 받지 못해도 화면은 그린다 — 이력 표 안에만 안내하고 원인은 서버 로그에 남긴다(front #93 리뷰)
    getWorkScheduleHistories(historyApiSearch(withStore)).catch((error: unknown) => {
      console.error("근무스케줄: GET /work-schedules/histories 를 받지 못했습니다", error);
      return "failed" as const;
    }),
    query.copy ? loadCopyPreview(query.storeId, query.week) : Promise.resolve(null),
  ]);
  if (!data) notFound();
  // 그 주(월~일)에 근무스케줄이 한 건이라도 있으면 복사를 끈다(STAFF-13). 전주 일요일은 넘어온 근무용이라 세지 않는다
  const weekEmpty = !data.items.some((it) => it.workDate >= query.week && it.workDate <= addDays(query.week, 6));
  const staffOptions = data.staff.flatMap((s) => (s.staffMemberId !== null && s.name !== null ? [{ staffMemberId: s.staffMemberId, name: s.name }] : []));

  return (
    <>
      <PageBar title="근무스케줄 관리" />
      <SchedulePanel storeId={query.storeId}>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
          <main className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
            <div className="flex flex-wrap items-center gap-[6px]">
              <SchedulePicker query={query} today={today} />
              {query.view === "week" && (
                <>
                  <Link href={href(moved(query, { week: addDays(query.week, -7), day: addDays(query.day, -7) }))} aria-label="이전 주" scroll={false} className={ICON_BUTTON}>
                    <Image src="/icons/prev.svg" alt="" width={16} height={16} />
                  </Link>
                  <span className="grid h-[34px] min-w-[190px] place-items-center rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink">
                    {weekLabel(query.week)}
                  </span>
                  <Link href={href(moved(query, { week: addDays(query.week, 7), day: addDays(query.day, 7) }))} aria-label="다음 주" scroll={false} className={ICON_BUTTON}>
                    <Image src="/icons/next.svg" alt="" width={16} height={16} />
                  </Link>
                  <WeekJump query={query} today={today} />
                  <Button variant="off" href={href(moved(query, { week: mondayOf(today), day: today }))} scroll={false}>
                    이번 주
                  </Button>
                </>
              )}
              <span className="flex-1" />
              {query.view === "week" && <CopyButton query={withStore} today={today} weekEmpty={weekEmpty} />}
              <NewScheduleButton workDate={query.day} />
            </div>
            <nav aria-label="보기" className="flex shrink-0 self-start overflow-hidden rounded-[2px] border border-erp-button-line">
              <Link href={href(moved(query, { view: "week", week: mondayOf(query.day), day: query.day }))} aria-current={query.view === "week" ? "page" : undefined} className={segment(query.view === "week")} scroll={false}>
                주간 보기
              </Link>
              <Link href={href(moved(query, { view: "month", month: query.day.slice(0, 7), day: query.day }))} aria-current={query.view === "month" ? "page" : undefined} className={segment(query.view === "month")} scroll={false}>
                월간 보기
              </Link>
            </nav>
            {copyPreview && <CopyPreviewPanel query={withStore} today={today} preview={copyPreview} />}
            {query.view === "week" ? <ScheduleWeek data={data} query={query} today={today} /> : <ScheduleMonth data={data} query={query} today={today} />}
            <ScheduleHistory query={query} today={today} data={history} staffOptions={staffOptions} />
          </main>
        </div>
      </SchedulePanel>
    </>
  );
}
