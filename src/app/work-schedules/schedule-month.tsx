import Link from "next/link";
import { Button } from "@/components/common";
import type { EnumValue } from "@/lib/enums";
import type { WorkScheduleList } from "@/lib/work-schedules-api";
import { addDays, addMonths, monthRange, moved, toScheduleSearch, type ScheduleQuery } from "./work-schedule-query";
import { shiftLabel } from "./work-schedule-view";

// 월간 보기(#343). 데모 schedMonth — 왼쪽에 고른 날의 근무자, 오른쪽에 달력(칸에는 인원만). 달력 6주(42일)를 한 번에 읽는다.
// 본사에게 가려진 직원은 인원에는 들고 목록에는 이름 없이 「그 밖에 n명」으로만 남는다(STAFF-39).

const HEAD = ["월", "화", "수", "목", "금", "토", "일"];
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export function ScheduleMonth({
  data,
  query,
  today,
  employmentLabels,
}: {
  data: WorkScheduleList;
  query: ScheduleQuery;
  today: string;
  employmentLabels: EnumValue[];
}) {
  const href = (next: Parameters<typeof moved>[1]) => `/work-schedules${toScheduleSearch(moved(query, next), today)}`;
  const { from } = monthRange(query.month);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(from, i));
  const countOf = (d: string) => data.days.find((x) => x.workDate === d)?.headcount ?? 0;
  const [y, m] = query.month.split("-").map(Number);
  const picked = query.day;
  const label = (code: string | null) => employmentLabels.find((e) => e.value === code)?.label ?? code ?? "";
  const workers = data.staff
    .filter((s) => !s.isMasked)
    .map((s) => ({ s, shifts: data.items.filter((it) => it.staffMemberId === s.staffMemberId && it.workDate === picked) }))
    .filter((w) => w.shifts.length > 0);
  const headcount = countOf(picked);
  const hidden = headcount - workers.length;
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
            className="grid size-[28px] place-items-center rounded-[2px] border border-erp-button-line"
          >
            ‹
          </Link>
          <b className="text-[15px] font-semibold">
            {Number(picked.slice(5, 7))}월 {Number(picked.slice(8))}일({WEEKDAY[wd]})
          </b>
          <Link
            href={href({ day: nextDay, month: nextDay.slice(0, 7) })}
            aria-label="다음 날"
            scroll={false}
            className="grid size-[28px] place-items-center rounded-[2px] border border-erp-button-line"
          >
            ›
          </Link>
        </div>
        <p className="text-[13px] text-erp-label">근무 {headcount}명</p>
        <ul className="flex flex-col text-[14px]">
          {workers.map(({ s, shifts }) => (
            <li key={s.staffMemberId} className="flex flex-col border-b border-erp-thead-line py-[6px] last:border-b-0">
              <span>
                {s.name} <span className="text-erp-muted">{label(s.employmentType)}</span>
              </span>
              <span className="text-[13px] text-erp-label">{shifts.map(shiftLabel).join(", ")}</span>
            </li>
          ))}
          {hidden > 0 && <li className="py-[6px] text-[13px] text-erp-muted">그 밖에 {hidden}명(본사 제공 동의 없음)</li>}
          {headcount === 0 && <li className="py-[6px] text-[13px] text-erp-muted">근무자가 없습니다.</li>}
        </ul>
      </section>
      <div>
        <div className="mb-[8px] flex items-center gap-[6px]">
          <Link
            href={href({ month: addMonths(query.month, -1), day: `${addMonths(query.month, -1)}-01` })}
            aria-label="이전 달"
            scroll={false}
            className="grid size-[34px] place-items-center rounded-[2px] border border-erp-button-line"
          >
            ‹
          </Link>
          <b className="min-w-[120px] text-center text-[15px] font-semibold">
            {y}년 {m}월
          </b>
          <Link
            href={href({ month: addMonths(query.month, 1), day: `${addMonths(query.month, 1)}-01` })}
            aria-label="다음 달"
            scroll={false}
            className="grid size-[34px] place-items-center rounded-[2px] border border-erp-button-line"
          >
            ›
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
