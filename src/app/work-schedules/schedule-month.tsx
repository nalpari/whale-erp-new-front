import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/common";
import type { WorkScheduleList } from "@/lib/work-schedules-api";
import { addDays, addMonths, monthCells, moved, toScheduleSearch, type ScheduleQuery } from "./work-schedule-query";
import { shiftLabel } from "./work-schedule-view";

// 월간 보기(#343). 데모 schedMonth · erp.js initDayPlan — 왼쪽에 고른 날의 재직자(근무 시각 · 휴무), 오른쪽에 달력(칸에는 인원만).
// 달력 6주(42일)를 한 번에 읽고, 그리기는 그 달이 걸친 주만 한다. 본사에게 가려진 직원은 인원에는 들고 목록에는 이름 없이 「그 밖에 n명」으로만 남는다(STAFF-39).

const HEAD = ["월", "화", "수", "목", "금", "토", "일"];
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const ICON_BUTTON =
  "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";
const DAY_BUTTON = "grid size-[28px] place-items-center rounded-[2px] border border-erp-button-line";

export function ScheduleMonth({
  data,
  query,
  today,
}: {
  data: WorkScheduleList;
  query: ScheduleQuery;
  today: string;
}) {
  const href = (next: Parameters<typeof moved>[1]) => `/work-schedules${toScheduleSearch(moved(query, next), today)}`;
  const cells = monthCells(query.month);
  // 달을 옮기면 그 달 1일, 이번 달이면 오늘을 고른다(데모 initDayPlan)
  const toMonth = (month: string) => ({ month, day: month === today.slice(0, 7) ? today : `${month}-01` });
  const countOf = (d: string) => data.days.find((x) => x.workDate === d)?.headcount ?? 0;
  const [y, m] = query.month.split("-").map(Number);
  const picked = query.day;
  // 그날 받을 수 있는 직원 전원(휴무 포함, 데모 all · STAFF-29) — 주간 보기의 직원 줄과 같다
  const rows = data.staff
    .filter((s) => !s.isMasked && s.schedulableDates.includes(picked))
    .map((s) => ({ s, shifts: data.items.filter((it) => it.staffMemberId === s.staffMemberId && it.workDate === picked) }));
  const headcount = countOf(picked);
  const hidden = headcount - rows.filter((r) => r.shifts.length > 0).length;
  const when = picked === today ? "오늘" : picked < today ? "지난 날" : "예정";
  const prevDay = addDays(picked, -1);
  const nextDay = addDays(picked, 1);
  const wd = new Date(`${picked}T00:00:00Z`).getUTCDay();

  return (
    <div className="grid grid-cols-[268px_minmax(0,1fr)] items-start gap-[18px]">
      <section aria-label="고른 날" className="flex flex-col gap-[8px] rounded-[2px] border border-erp-thead-line p-[14px]">
        <div className="flex items-center justify-between">
          <Link
            href={href({ day: prevDay, month: prevDay.slice(0, 7) })}
            aria-label="이전 날"
            scroll={false}
            className={DAY_BUTTON}
          >
            <Image src="/icons/prev.svg" alt="" width={7} height={12} />
          </Link>
          <b className="text-[15px] font-semibold">
            {Number(picked.slice(5, 7))}월 {Number(picked.slice(8))}일 ({WEEKDAY[wd]})
          </b>
          <Link
            href={href({ day: nextDay, month: nextDay.slice(0, 7) })}
            aria-label="다음 날"
            scroll={false}
            className={DAY_BUTTON}
          >
            <Image src="/icons/next.svg" alt="" width={7} height={12} />
          </Link>
        </div>
        <p className="text-[13px] text-erp-label">
          근무 <b className="text-erp-ink">{headcount}명</b> · {when}
        </p>
        <ul className="flex flex-col text-[14px]">
          {rows.map(({ s, shifts }) => (
            <li key={s.staffMemberId} className="flex items-center gap-[8px] border-b border-erp-thead-line py-[8px]">
              <span className="flex-1">
                {s.name} <span className="text-erp-muted">{s.jobTitle}</span>
              </span>
              <span className="text-right text-[13px] text-erp-muted">{shifts.length ? shifts.map(shiftLabel).join(", ") : "휴무"}</span>
            </li>
          ))}
          {hidden > 0 && <li className="py-[8px] text-[13px] text-erp-muted">그 밖에 {hidden}명(본사 제공 동의 없음)</li>}
          {rows.length === 0 && hidden <= 0 && <li className="py-[8px] text-[13px] text-erp-muted">근무 없음</li>}
        </ul>
      </section>
      <div>
        <div className="mb-[8px] flex items-center gap-[6px]">
          <Link
            href={href(toMonth(addMonths(query.month, -1)))}
            aria-label="이전 달"
            scroll={false}
            className={ICON_BUTTON}
          >
            <Image src="/icons/prev.svg" alt="" width={16} height={16} />
          </Link>
          <b className="min-w-[120px] text-center text-[15px] font-semibold">
            {y}년 {m}월
          </b>
          <Link
            href={href(toMonth(addMonths(query.month, 1)))}
            aria-label="다음 달"
            scroll={false}
            className={ICON_BUTTON}
          >
            <Image src="/icons/next.svg" alt="" width={16} height={16} />
          </Link>
          <Button variant="off" href={href({ month: today.slice(0, 7), day: today })} scroll={false}>
            이번 달
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[2px] border border-erp-thead-line bg-erp-thead-line">
          {HEAD.map((d, i) => (
            <div key={d} className={`bg-erp-thead-bg py-[6px] text-center text-[13px] ${i === 5 ? "text-erp-on" : i === 6 ? "text-erp-off" : "text-erp-thead-text"}`}>
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d.slice(0, 7) !== query.month)
              return (
                <div key={d} className="min-h-[64px] bg-erp-thead-bg px-[8px] py-[6px] text-[13px] text-erp-muted">
                  {Number(d.slice(8))}
                </div>
              );
            const tone = i % 7 === 5 ? "text-erp-on" : i % 7 === 6 ? "text-erp-off" : "";
            const isPicked = d === picked;
            return (
              <Link
                key={d}
                href={href({ day: d })}
                aria-current={isPicked ? "date" : undefined}
                scroll={false}
                className={`flex min-h-[64px] flex-col items-start gap-[4px] px-[8px] py-[6px] text-left transition-colors duration-150 ease-out hover:bg-erp-on-bg ${
                  isPicked ? "bg-erp-on-bg shadow-[inset_0_0_0_2px_var(--color-erp-on)]" : "bg-white"
                }`}
              >
                <b className={`text-[13px] font-semibold ${tone}`}>{Number(d.slice(8))}</b>
                <span className="inline-block rounded-[2px] bg-erp-subtle px-[4px] py-[2px] text-center text-[14px] font-medium whitespace-nowrap text-erp-ink">
                  {countOf(d)}명
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
