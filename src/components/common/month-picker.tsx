"use client";

import { useState } from "react";
import { Popup, useDropdown } from "./popup";

// 달력 제목 「2026년 11월 ▾」 — 누르면 아래로 연 · 월 고르기 판이 펼쳐진다(BP 휴일 캘린더, 2026-10-30 사용자 지정).
// 전엔 제목과 따로 연도 · 월 선택 상자 두 개를 탭 위에 두어 같은 값이 두 번 보이고 달력과 떨어져 있었다.
// 판은 위쪽에 연도(‹ 2026년 ›), 아래에 1~12월 버튼 4×3 — 고른 달은 브랜드 바탕(DESIGN 선택된 날짜와 같은 색), 오늘이 든 달은 브랜드 테두리.
// 연도만 넘겨서는 아무것도 바뀌지 않고, 달을 눌러야 이동하고 닫힌다.
export function MonthPicker({
  year,
  month,
  years,
  current,
  onPick,
}: {
  year: number;
  month: number;
  /** 고를 수 있는 연도(오름차순) — 범위 밖 연도로는 넘기지 않는다 */
  years: readonly number[];
  /** 오늘이 든 달 — 판에서 테두리로 짚어 준다 */
  current: { year: number; month: number };
  onPick: (year: number, month: number) => void;
}) {
  const { open, setOpen, close, ref, trigger, id } = useDropdown();
  // 판에서 넘겨 보는 연도 — 열 때마다 지금 보는 연도에서 시작한다
  const [shown, setShown] = useState(year);
  const at = years.indexOf(shown);
  const step = (d: -1 | 1) => setShown(years[at + d]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${year}년 ${month}월 — 연 · 월 고르기`}
        onClick={() => {
          setShown(year);
          setOpen(!open);
        }}
        // 고르는 칸으로 보이게 테두리 상자로 — 글자만 두면 누를 수 있는 줄 몰랐다(2026-10-30 사용자 지정). 테두리는 옆 화살표 · [오늘] 버튼과 같은 색, 열려 있거나 올리면 브랜드 테두리
        className={`flex h-[34px] items-center gap-[8px] rounded-[2px] border bg-white pr-[8px] pl-[12px] text-[16px] font-semibold text-erp-ink transition-[border-color] duration-150 hover:border-erp-brand ${
          open ? "border-erp-brand" : "border-erp-button-line"
        }`}
      >
        {year}년 {month}월
        {/* 열기 표시는 연회청(보조 버튼 색 erp-brand-soft) 동그라미 안 흰 화살표 — 브랜드색은 너무 진했다 — 누를 수 있는 칸으로 눈에 띄게(2026-10-30 사용자 지정, DESIGN 원형은 조작 요소에 쓴다) */}
        <span className={`ml-[2px] grid size-[20px] place-items-center rounded-full bg-erp-brand-soft transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <svg viewBox="0 0 10 6" fill="none" aria-hidden className="h-[6px] w-[10px]">
            <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {/* 떠 있는 판이라 팝업 그림자 하나만 쓴다(DESIGN 뜬 것만 그림자) */}
      <Popup id={id} open={open} motion="fold" className="left-0 w-[236px] p-[11px]! shadow-[0_2px_6px_rgba(40,47,55,0.08)]">
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center justify-between">
            <YearStep label="이전 연도" icon="prev" disabled={at <= 0} onClick={() => step(-1)} />
            <span className="text-[14px] font-semibold text-erp-ink">{shown}년</span>
            <YearStep label="다음 연도" icon="next" disabled={at < 0 || at >= years.length - 1} onClick={() => step(1)} />
          </div>
          <div className="grid grid-cols-4 gap-[6px]">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const picked = shown === year && m === month;
              const now = shown === current.year && m === current.month;
              return (
                <button
                  key={m}
                  type="button"
                  aria-current={picked ? "date" : undefined}
                  onClick={() => {
                    close();
                    if (!picked) onPick(shown, m);
                  }}
                  className={`h-[34px] rounded-[2px] border text-[14px] transition-colors duration-150 ${
                    picked
                      ? "border-erp-brand bg-erp-brand font-medium text-white"
                      : `${now ? "border-erp-brand" : "border-transparent"} text-erp-ink hover:border-erp-brand hover:bg-erp-thead-bg`
                  }`}
                >
                  {m}월
                </button>
              );
            })}
          </div>
        </div>
      </Popup>
    </div>
  );
}

function YearStep({ label, icon, disabled, onClick }: { label: string; icon: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-[28px] place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 hover:border-erp-brand disabled:opacity-40 disabled:hover:border-erp-button-line"
    >
      {/* 먹색 화살표 — 달력의 이전 · 다음 달 버튼과 같다 */}
      <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-[14px] text-erp-ink">
        <path d={icon === "prev" ? "M11 14L5 8L11 2" : "M5 14L11 8L5 2"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
