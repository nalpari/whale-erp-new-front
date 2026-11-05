import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button, PageBar } from "@/components/common";
import { ApiError } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { getCopyPreview, getWorkScheduleHistories, getWorkSchedules } from "@/lib/work-schedules-api";
import { SchedulePicker, ScheduleHistory, ScheduleNoStore, WeekJump } from "./schedule-controls";
import { CopyButton, CopyPreviewPanel, type CopyPreviewResult } from "./schedule-copy";
import { NewScheduleButton, SchedulePanel } from "./schedule-form";
import { ScheduleMonth } from "./schedule-month";
import { ScheduleWeek } from "./schedule-week";
import { addDays, addMonths, historyApiSearch, mondayOf, moved, parseScheduleQuery, scheduleApiSearch, toScheduleSearch, weekRangeLabel, type ScheduleQuery } from "./work-schedule-query";

// 근무스케줄 관리(#202 · #343 · #608). 목업 docs/mockup/staff/index.html 근무스케줄 탭 · 데모 docs/demo/staff/work-schedules.html 을 공통 컴포넌트로 옮겼다.
// 데이터는 GET /work-schedules(주간 8일 — 전주 일요일 포함 · 월간 42일), GET /work-schedules/histories(근무표 아래 변경 이력),
// GET /work-schedules/copy-last-week(지난 주 복사 미리보기가 열렸을 때, #204)다. 화면 상태는 주소에만 둔다.
// 등록 · 수정 · 삭제는 오른쪽 패널(schedule-form.tsx, #203)이고, 지난 주 복사는 도구 줄 아래 미리보기다(schedule-copy.tsx).
// 배치는 데모 schedTab(2026-10-22 재영): 첫 줄 근무지 · 주 이동 | 지난 주 복사 · 근무스케줄 등록, 둘째 줄 주간 · 월간 전환, 근무표, 변경 이력.
// 주 이동 옆의 날짜 고르기 칸과 「이번 주」는 데모에 없지만 남긴다(재영).

// 데모 segment — 고른 쪽은 회색 바탕 · 굵게, 다른 쪽은 흰 바탕 · 라벨 회색(점포 목록 카드/표 전환과 같다)
// 보기 전환 — 막대(주간) · 달력(월간) 아이콘 + 글자, 사이 세로선(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 글자만)
const segment = (active: boolean) =>
  `flex h-[32px] items-center gap-[6px] px-[12px] text-[14px] transition-colors duration-150 ease-out [&+&]:border-l [&+&]:border-erp-button-line ${
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

/** 달을 옮길 때 고를 날 — 이번 달이면 오늘, 아니면 그 달 1일(schedule-month.tsx toMonth 와 같다) */
const toMonth = (month: string, today: string) => ({ month, day: month === today.slice(0, 7) ? today : `${month}-01` });

/** 본문 틀 — 도구 줄(근무지 · 주 이동 | 동작) · 주간/월간 전환 · 본문. 점포가 없어도 같은 틀에 안내만 넣는다(2026-11-05 사용자 지정) */
function ScheduleFrame({ query, today, actions, children }: { query: ScheduleQuery; today: string; actions?: ReactNode; children: ReactNode }) {
  const href = (next: ScheduleQuery) => `/work-schedules${toScheduleSearch(next, today)}`;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
      <main className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
        {/* 첫 줄은 보기 전환 · 근무지(두 보기에 공통), 둘째 줄은 그 보기의 기간 이동 · 동작 버튼. 폐점 안내는 근무지 칸 옆(2026-11-05 사용자 지정, 3팀 확인 필요 —
            전엔 근무지가 둘째 줄 맨 앞, 폐점 안내는 [지난 주 복사] · [근무스케줄 등록] 사이) */}
        <div className="flex flex-wrap items-center gap-[18px]">
        <nav aria-label="보기" className="flex shrink-0 self-start overflow-hidden rounded-[2px] border border-erp-button-line">
          <Link href={href(moved(query, { view: "week", week: mondayOf(query.day), day: query.day }))} aria-current={query.view === "week" ? "page" : undefined} className={segment(query.view === "week")} scroll={false}>
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M2 4h12M2 8h8M2 12h10" />
            </svg>
            주간 보기
          </Link>
          <Link href={href(moved(query, { view: "month", month: query.day.slice(0, 7), day: query.day }))} aria-current={query.view === "month" ? "page" : undefined} className={segment(query.view === "month")} scroll={false}>
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="2" y="3" width="12" height="11" rx="1.5" />
              <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
            </svg>
            월간 보기
          </Link>
        </nav>
        <SchedulePicker query={query} today={today} />
        </div>
        <div className="flex flex-wrap items-center gap-[6px]">
          {query.view === "week" && (
            <>
              <Link href={href(moved(query, { week: addDays(query.week, -7), day: addDays(query.day, -7) }))} aria-label="이전 주" scroll={false} className={ICON_BUTTON}>
                <Image src="/icons/prev.svg" alt="" width={16} height={16} />
              </Link>
              <span className="grid h-[34px] min-w-[190px] place-items-center rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink">
                {weekRangeLabel(query.week)}
              </span>
              <Link href={href(moved(query, { week: addDays(query.week, 7), day: addDays(query.day, 7) }))} aria-label="다음 주" scroll={false} className={ICON_BUTTON}>
                <Image src="/icons/next.svg" alt="" width={16} height={16} />
              </Link>
              <WeekJump query={query} today={today} />
              {/* 점포 상세 [변경이력]과 같은 outline — 흰 바탕 · 브랜드 테두리가 기본, 호버하면 회색 바탕(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 off) */}
              <Button variant="outline" href={href(moved(query, { week: mondayOf(today), day: today }))} scroll={false}>
                이번 주
              </Button>
            </>
          )}
          {/* 월간 보기의 달 이동도 주간처럼 근무지 줄에 둔다 — 전엔 달력 위에 따로 있었다(2026-11-05 사용자 지정, 3팀 확인 필요). 달을 옮기면 그 달 1일, 이번 달이면 오늘(ScheduleMonth toMonth 와 같다) */}
          {query.view === "month" && (
            <>
              <Link href={href(moved(query, toMonth(addMonths(query.month, -1), today)))} aria-label="이전 달" scroll={false} className={ICON_BUTTON}>
                <Image src="/icons/prev.svg" alt="" width={16} height={16} />
              </Link>
              <span className="grid h-[34px] min-w-[190px] place-items-center rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink">
                {Number(query.month.slice(0, 4))}년 {Number(query.month.slice(5, 7))}월
              </span>
              <Link href={href(moved(query, toMonth(addMonths(query.month, 1), today)))} aria-label="다음 달" scroll={false} className={ICON_BUTTON}>
                <Image src="/icons/next.svg" alt="" width={16} height={16} />
              </Link>
              <Button variant="outline" href={href(moved(query, { month: today.slice(0, 7), day: today }))} scroll={false}>
                이번 달
              </Button>
            </>
          )}
          <span className="flex-1" />
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}

export default async function WorkSchedulesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = kstToday();
  const query = parseScheduleQuery(await searchParams, today);
  if (query.storeId === null)
    return (
      <>
        <PageBar title="근무스케줄 관리" />
        <ScheduleFrame query={query} today={today}>
          <ScheduleNoStore />
        </ScheduleFrame>
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
      <SchedulePanel storeId={query.storeId}>
        {/* 제목 줄도 패널 바탕이 깔리면 inert 로 막히게 패널 안쪽(본문 쪽)에 둔다 */}
        <PageBar title="근무스케줄 관리" />
        <ScheduleFrame
          query={query}
          today={today}
          actions={
            <>
              {query.view === "week" && <CopyButton query={withStore} today={today} weekEmpty={weekEmpty} />}
              <NewScheduleButton workDate={query.day} />
            </>
          }
        >
          {copyPreview && <CopyPreviewPanel query={withStore} today={today} preview={copyPreview} />}
          {query.view === "week" ? <ScheduleWeek data={data} query={query} today={today} /> : <ScheduleMonth data={data} query={query} today={today} showMonthNav={false} fitList />}
          <ScheduleHistory query={query} today={today} data={history} staffOptions={staffOptions} />
        </ScheduleFrame>
      </SchedulePanel>
    </>
  );
}
