"use client";

import Image from "next/image";
import { useState } from "react";
import { Checkbox } from "@/components/common";
import { groupByDate, targetText, weekdayName, type BpHolidayQuery } from "@/lib/bp-holiday-view";
import type { BpHolidayList } from "@/lib/bp-holidays";
import { calendarWeeks, dateKey, WEEKDAY_HEADERS } from "@/lib/public-holiday-view";
import { ScopeTag, useHolidayTypeText } from "./holiday-parts";

// 월 캘린더(데모 config/holidays.mjs monthGrid). 1팀 컴포넌트에 없어 표 선 · 표 머리 바탕으로 그린다(플랫폼 휴일 캘린더와 같은 모양).
// 공식 휴일은 상태 빨강(빨간 날짜 · 이름 · 바탕), BP 휴일은 운영 파랑 이름 칸(넘치면 말줄임, 여러 건이면 칸이 아래로 늘어난다).
// 공식 휴일은 캘린더에만 보인다 — 목록 · 상세에는 없다(CONFIG-10). 「공식 휴일 숨기기」를 켜면 지운다(2026-10-07, 이 화면 안에서만 기억).
// 날짜 칸을 누르면 그 칸을 고른 칸으로 표시하고 오른쪽에 그날 휴일을 보인다(2026-10-08). 고른 날짜는 주소(?day=)에 둔다.

export function HolidayCalendar({
  query,
  today,
  list,
  onSelectDay,
  onOpen,
}: {
  query: BpHolidayQuery;
  today: string;
  list: BpHolidayList;
  onSelectDay: (day: string) => void;
  onOpen: (bpHolidayId: number, date: string, from: HTMLElement) => void;
}) {
  const [hideOfficial, setHideOfficial] = useState(false);
  const typeText = useHolidayTypeText();
  const { year, month } = query;
  const byDate = groupByDate(list.items);
  const official = new Map(list.publicHolidays.map((h) => [h.holidayDate, h.name]));
  const selected = query.day;
  const dayRows = selected ? (byDate.get(selected) ?? []) : [];

  return (
    // 달력 아래가 카드 선에 붙지 않게 아래 여백을 둔다(데모 2026-10-08)
    <div className="flex items-start gap-[24px] pb-[24px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
        <div className="flex items-end gap-[6px]">
          <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">
            {year}년 {month}월
          </h2>
          <span className="flex flex-wrap items-center gap-[18px]">
            <Legend mark="bg-erp-off" text="공식 휴일" />
            <Legend mark="bg-erp-on" text="BP 휴일" />
            <Legend mark="border border-erp-brand" text={`선택한 날짜 · 오늘 ${today}`} />
            <Checkbox label="공식 휴일 숨기기" checked={hideOfficial} onChange={(e) => setHideOfficial(e.target.checked)} />
          </span>
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
            {calendarWeeks(year, month).map((week, w) => (
              <tr key={w}>
                {week.map((day, i) => {
                  const line = `h-[92px] border-b border-erp-thead-line p-[10px] align-top ${i ? "border-l" : ""}`;
                  if (day === null) return <td key={i} className={`${line} bg-erp-thead-bg`} />;
                  const date = dateKey(year, month, day);
                  const off = hideOfficial ? undefined : official.get(date);
                  const holidays = byDate.get(date) ?? [];
                  const isSelected = date === selected;
                  const isToday = date === today;
                  return (
                    <td
                      key={i}
                      aria-current={isToday ? "date" : undefined}
                      className={`${line} cursor-pointer transition-colors duration-150 ease-out hover:bg-erp-thead-bg ${off ? "bg-erp-off-bg" : ""} ${isSelected ? "shadow-[inset_0_0_0_2px_var(--color-erp-brand)]" : ""}`}
                      onClick={() => onSelectDay(date)}
                    >
                      {/* 칸 전체가 눌리지만 키보드로는 날짜 숫자 버튼으로 고른다 */}
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${month}월 ${day}일${isToday ? " 오늘" : ""}${off ? ` ${off}` : ""}${holidays.length ? ` BP 휴일 ${holidays.length}건` : ""}`}
                        className={`text-[14px] ${isToday ? "inline-grid h-[24px] min-w-[24px] place-items-center rounded-[2px] border border-erp-brand px-[4px] font-semibold" : ""} ${
                          off ? "font-semibold text-erp-off" : isToday ? "text-erp-brand" : "text-erp-ink"
                        }`}
                      >
                        {day}
                      </button>
                      {off && <p className="mt-[6px] truncate text-[13px] font-medium text-erp-off">{off}</p>}
                      {holidays.map((h) => (
                        <p key={h.bpHolidayId} title={h.name} className="mt-[6px] truncate rounded-[2px] bg-erp-on-bg px-[4px] py-[2px] text-[13px] font-medium text-erp-on">
                          {h.name}
                        </p>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 오른쪽 그날 칸(데모 dayView) — 범위 꼬리표 · 휴일명, 아랫줄에는 휴일 유형 · 적용 대상 */}
      <section aria-label="고른 날짜의 휴일" className="flex w-[340px] shrink-0 flex-col gap-[12px]">
        <h2 className="text-[18px] font-semibold text-erp-ink">
          {selected ? `${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8, 10))}일 (${weekdayName(selected).slice(0, 1)})` : "날짜를 고르세요"}
          {selected && <span className="ml-[10px] text-[14px] font-normal text-erp-label">{dayRows.length}건</span>}
        </h2>
        <div className="flex flex-col">
          {dayRows.length ? (
            dayRows.map((h) => (
              <button
                key={h.bpHolidayId}
                type="button"
                aria-controls="bp-holiday-detail-panel"
                onClick={(e) => onOpen(h.bpHolidayId, h.date, e.currentTarget)}
                className="flex min-h-[46px] w-full items-center gap-[10px] border-b border-erp-thead-line py-[8px] text-left transition-colors duration-150 ease-out hover:bg-erp-thead-bg"
              >
                <ScopeTag isAllStores={h.target.isAllStores} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-erp-ink">{h.name}</span>
                  <span className="truncate text-[13px] text-erp-label">
                    {typeText(h.holidayTypeCode, h.holidayRepeatTypeCode)} · {targetText(h.target)}
                  </span>
                </span>
                <Image src="/icons/next.svg" alt="" width={16} height={16} />
              </button>
            ))
          ) : (
            <p className="border-b border-erp-thead-line py-[24px] text-center text-[14px] text-erp-muted">{selected ? "등록된 휴일이 없습니다." : "캘린더에서 날짜를 누르면 그날 휴일이 보입니다."}</p>
          )}
        </div>
      </section>
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
