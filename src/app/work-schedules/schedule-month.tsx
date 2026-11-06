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

/** hrefBase · readOnly 는 로그인 후 홈 점포 하나 화면(WHALEERP-342)이 쓴다 — readOnly 면 왼쪽 목록에 그날 근무가 있는 직원만(휴무 행 없음) */
export function ScheduleMonth({
  data,
  query,
  today,
  hrefBase = "/work-schedules",
  readOnly = false,
  showMonthNav = true,
  fitList = false,
}: {
  data: WorkScheduleList;
  query: ScheduleQuery;
  today: string;
  hrefBase?: string;
  readOnly?: boolean;
  /** 달 이동(‹ 2026년 11월 › · 이번 달)을 달력 위에 둘지 — 근무스케줄 관리는 도구 줄(근무지 줄)에 두므로 끈다(2026-11-05 사용자 지정). 홈은 그대로 */
  showMonthNav?: boolean;
  /** 고른 날 상자를 달력 높이에 맞추고 직원 목록만 상자 안에서 스크롤 — 직원이 많으면 상자가 달력보다 길어져 아래가 비었다(2026-11-05 사용자 지정, 3팀 확인 필요). 근무스케줄 관리만 켠다 */
  fitList?: boolean;
}) {
  const href = (next: Parameters<typeof moved>[1]) => `${hrefBase}${toScheduleSearch(moved(query, next), today)}`;
  const cells = monthCells(query.month);
  // 달을 옮기면 그 달 1일, 이번 달이면 오늘을 고른다(데모 initDayPlan)
  const toMonth = (month: string) => ({ month, day: month === today.slice(0, 7) ? today : `${month}-01` });
  const countOf = (d: string) => data.days.find((x) => x.workDate === d)?.headcount ?? 0;
  const [y, m] = query.month.split("-").map(Number);
  const picked = query.day;
  // 그날 받을 수 있는 직원 전원(휴무 포함, 데모 all · STAFF-29) — 주간 보기의 직원 줄과 같다
  const rows = data.staff
    .filter((s) => !s.isMasked && s.schedulableDates.includes(picked))
    .map((s) => ({ s, shifts: data.items.filter((it) => it.staffMemberId === s.staffMemberId && it.workDate === picked) }))
    .filter((r) => !readOnly || r.shifts.length > 0);
  const headcount = countOf(picked);
  const hidden = headcount - rows.filter((r) => r.shifts.length > 0).length;
  const when = picked === today ? "오늘" : picked < today ? "지난 날" : "예정";
  const prevDay = addDays(picked, -1);
  const nextDay = addDays(picked, 1);
  const wd = new Date(`${picked}T00:00:00Z`).getUTCDay();

  return (
    <div className={`grid grid-cols-[268px_minmax(0,1fr)] gap-[18px] ${fitList ? "items-stretch" : "items-start"}`}>
      {/* fitList 면 상자를 바깥 칸(달력 높이)에 절대 위치로 붙여, 목록 길이가 줄 높이를 늘리지 않게 한다 */}
      <div className={fitList ? "relative min-h-[240px]" : "contents"}>
      {/* 고른 날 상자 — 간격 단계(DESIGN 6/10/12/18)에 맞춰 안쪽 18 · 줄 사이 12, 목록 줄 위아래 10(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 14 · 8 · 8) */}
      <section aria-label="선택한 날" className={`flex flex-col gap-[12px] rounded-[2px] border border-erp-thead-line p-[18px] ${fitList ? "absolute inset-0" : ""}`}>
        {/* 날짜 줄 아래만 18 — 12 면 「근무 0명」이 날짜에 붙어 보였다(2026-11-05 사용자 지적) */}
        <div className="mb-[6px] flex items-center justify-between">
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
        {/* 근무 수 · 빈 문구는 14px 회색 — 13px 연회색은 너무 작았다(2026-11-05 사용자 지적, 3팀 확인 필요). 홈 월간 보기도 같다 */}
        <p className="text-[14px] text-erp-label">
          근무 <b className="text-erp-ink">{headcount}명</b> · {when}
        </p>
        <ul className={`flex flex-col text-[14px] ${fitList ? "min-h-0 flex-1 overflow-y-auto" : ""}`}>
          {rows.map(({ s, shifts }) => (
            <li key={s.staffMemberId} className="flex items-center gap-[8px] border-b border-erp-thead-line py-[10px] first:pt-0 last:border-b-0 last:pb-0">
              <span className="flex-1">
                {s.name} <span className="text-erp-muted">{s.jobTitle}</span>
              </span>
              <span className="text-right text-[13px] text-erp-muted">{shifts.length ? shifts.map(shiftLabel).join(", ") : "휴무"}</span>
            </li>
          ))}
          {hidden > 0 && <li className="pt-[10px] text-[14px] text-erp-label">그 밖에 {hidden}명(본사에 정보제공 미동의)</li>}
          {/* 상자 위아래 여백은 같게(18) — 첫 줄 위 · 끝 줄 아래 여백과 끝 줄 선을 없앤다. 빈 줄도 여백 없이(2026-11-05 사용자 지적) */}
          {rows.length === 0 && hidden <= 0 && <li className="text-[14px] text-erp-label">{readOnly ? "근무 없음" : "근무 가능한 직원이 없습니다."}</li>}
        </ul>
      </section>
      </div>
      <div>
        {showMonthNav && (
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
        )}
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
