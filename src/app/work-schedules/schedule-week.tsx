import Link from "next/link";
import { Badge } from "@/components/common";
import type { WorkScheduleList } from "@/lib/work-schedules-api";
import { addDays, moved, toScheduleSearch, type ScheduleQuery } from "./work-schedule-query";
import { AssignGapButton, ScheduleBar } from "./schedule-form";
import { barOf, carryOver, coverTone, durationLabel, gapsOf, hourCells } from "./work-schedule-view";

// 주간 보기(#202 · #343, STAFF-26). 데모 schedWeek — 요일 칩 7개 → 고른 요일의 시간축 24칸(00~23시) · 직원 줄 · 근무 인원 줄 · 공백.
// 공백 줄은 근무 인원 줄 바로 아래, 범례는 맨 아래다(데모 순서). 직원 줄은 그날 받을 수 있는 직원만(휴무 포함, STAFF-29). 본사에게 가려진 직원은 줄은 두되 이름 · 막대를 비운다(STAFF-39).

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const COVER = { empty: "bg-erp-off-bg text-erp-off", alone: "bg-erp-subtle text-erp-ink", many: "bg-erp-on-bg text-erp-on" } as const;
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

export function CoverLegend() {
  const swatch = (tone: keyof typeof COVER, label: string) => (
    <span className="flex items-center gap-[6px]">
      <span className={`size-[12px] rounded-[2px] ${COVER[tone]}`} aria-hidden />
      {label}
    </span>
  );
  return (
    <div className="flex items-center gap-[18px] pt-[12px] text-[13px] text-erp-label">
      {swatch("empty", "아무도 없음")}
      {swatch("alone", "혼자 근무 · 휴게 불가")}
      {swatch("many", "2명 이상")}
    </div>
  );
}

export function ScheduleWeek({ data, query, today }: { data: WorkScheduleList; query: ScheduleQuery; today: string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(query.week, i));
  const dayOf = (d: string) => data.days.find((x) => x.workDate === d);
  const day = dayOf(query.day);
  const rows = data.staff.filter((s) => s.schedulableDates.includes(query.day));
  // 전날에서 넘어온 근무 — 공백에서 뺀다. 주간은 전주 일요일부터 받는다(weekRange)
  const carry = carryOver(data.items.filter((s) => s.workDate === addDays(query.day, -1)));
  const cells = hourCells(day?.coverage ?? []);
  const gaps = gapsOf(day?.coverage ?? [], carry);
  const gapMinutes = gaps.reduce((t, g) => t + g.minutes, 0);

  return (
    <div className="flex flex-col gap-[12px]">
      <nav aria-label="요일" className="flex gap-[6px]">
        {days.map((d, i) => {
          const picked = d === query.day;
          return (
            <Link
              key={d}
              href={`/work-schedules${toScheduleSearch(moved(query, { day: d }), today)}`}
              aria-current={picked ? "date" : undefined}
              scroll={false}
              className={`flex h-[34px] flex-1 items-center justify-center gap-[6px] rounded-[2px] border text-[14px] transition-colors duration-150 ease-out ${
                picked ? "border-erp-brand bg-erp-brand text-white" : "border-erp-button-line bg-white text-erp-ink hover:border-erp-brand"
              }`}
            >
              {WEEKDAYS[i]} {Number(d.slice(8))}
              <span className="text-[13px] opacity-70">{dayOf(d)?.headcount ?? 0}명</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col">
        <div className="flex h-[42px] items-center border-y border-erp-thead-line bg-erp-thead-bg">
          <span className="w-[140px] shrink-0 px-[10px] text-[14px] font-medium text-erp-thead-text">직원</span>
          <div className="grid flex-1 grid-cols-24 text-[12px] text-erp-thead-text" aria-hidden>
            {HOURS.map((h) => (
              <span key={h} className="truncate">
                {h}
              </span>
            ))}
          </div>
        </div>
        {rows.length === 0 && <p className="border-b border-erp-thead-line px-[10px] py-[14px] text-[14px] text-erp-label">이날 근무스케줄을 받을 수 있는 직원이 없습니다.</p>}
        {rows.map((s, i) => {
          const shifts = s.isMasked ? [] : data.items.filter((it) => it.staffMemberId === s.staffMemberId && it.workDate === query.day);
          return (
            // 가린 행은 ID 가 없어 순번으로 key 를 잡는다
            <div key={s.staffMemberId ?? `masked-${i}`} className="flex h-[46px] items-center border-b border-erp-thead-line">
              <span className="w-[140px] shrink-0 truncate px-[10px] text-[14px]">
                {s.isMasked ? <span className="text-erp-muted">—</span> : <>
                  {s.name} <span className="text-erp-muted">{s.jobTitle}</span>
                </>}
              </span>
              <div className="relative h-[34px] flex-1 rounded-[2px] bg-erp-thead-bg">
                {!s.isMasked && shifts.length === 0 && (
                  <div className="absolute inset-0 flex items-center rounded-[2px] bg-erp-subtle px-[10px] text-[13px] text-erp-muted">휴무</div>
                )}
                {shifts.map((it) => {
                  const bar = barOf(it);
                  return (
                    // 누르면 수정 패널(수정 권한이 있을 때, #203)
                    <ScheduleBar
                      key={it.workScheduleId}
                      item={it}
                      staffName={s.name ?? ""}
                      className="absolute inset-y-0 flex items-center truncate rounded-[2px] bg-erp-brand-soft px-[10px] text-[13px] text-white"
                      style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                      title={bar.label}
                    >
                      {bar.label}
                    </ScheduleBar>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="flex h-[46px] items-center border-b border-erp-thead-line">
          <span className="w-[140px] shrink-0 px-[10px] text-[14px] text-erp-label">근무 인원</span>
          <div className="grid h-[34px] flex-1 grid-cols-24 gap-px">
            {cells.map((n, h) => (
              <span key={h} className={`grid place-items-center text-[13px] font-medium ${COVER[coverTone(n)]}`} aria-label={`${HOURS[h]}시 ${n}명`}>
                {n}
              </span>
            ))}
          </div>
        </div>
        {/* 공백 줄 — 데모 gapBar 처럼 근무 인원 줄 바로 아래, 「이 시간대에 배정」은 오른쪽 끝 */}
        {day && day.headcount > 0 && (
          <div className="flex items-center gap-[6px]">
            <Badge tone={gapMinutes ? "off" : "on"}>{gapMinutes ? `공백 ${durationLabel(gapMinutes)}` : "공백 없음"}</Badge>
            <p className="text-[13px] leading-[1.6] text-erp-label">
              {gaps.length ? `${gaps.map((g) => `${g.from}-${g.to}`).join(", ")} 에 배정된 직원이 없습니다.` : "비는 시간대가 없습니다."}
            </p>
            <span className="flex-1" />
            {/* 공백마다 그 시각으로 등록을 연다 */}
            {gaps.map((g) => (
              <AssignGapButton key={g.from} workDate={query.day} startTime={g.from} endTime={g.to} label={gaps.length > 1 ? `${g.from}-${g.to} 배정` : "이 시간대에 배정"} />
            ))}
          </div>
        )}
      </div>
      <CoverLegend />
    </div>
  );
}
