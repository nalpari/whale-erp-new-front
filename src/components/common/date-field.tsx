"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { addDays, firstOfMonth, iso, monthGrid, parse, shiftMonth } from "./date-math";
import { EASE_OUT, FIELD_BOX } from "./theme";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// useSyncExternalStore 로 브라우저에서만 읽는 값들. 바뀌는 것을 구독할 대상이 없어 해지 함수만 돌려준다.
const NO_SUBSCRIBE = () => () => {};
const HAS_POPOVER = () => "popover" in HTMLElement.prototype;

const CELL = "grid h-[32px] w-[34px] place-items-center rounded-[2px] text-[14px] transition-colors duration-150 ease-out";
const NAV = "grid size-[28px] place-items-center rounded-[2px] text-erp-label transition-colors duration-150 ease-out hover:bg-erp-thead-bg";
const FOOT = "text-[13px] transition-colors duration-150 ease-out";

// 팝업이 나중에 ErpRoot 밖(포털 등)으로 옮겨가도 글꼴·색이 깨지지 않게 여기서 다시 준다.
// 열릴 때만 4px 위에서 내려오며 나타난다(동작 줄이기 설정이면 바로 나타난다).
const POPOVER =
  `fixed m-0 w-[268px] rounded-[2px] border border-[#ebebeb] bg-white p-[16px] shadow-[0_2px_6px_rgba(40,47,55,0.08)] ` +
  `font-erp tracking-[-0.025em] text-erp-ink scheme-light ` +
  `-translate-y-[4px] opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-150 ${EASE_OUT} ` +
  `open:translate-y-0 open:opacity-100 starting:open:-translate-y-[4px] starting:open:opacity-0 ` +
  `motion-reduce:translate-y-0 motion-reduce:transition-none [&_*:focus-visible]:outline-erp-brand! [&_button]:cursor-pointer`;

// Figma Form_date. 입력칸은 직접 칠 수 있고, 달력 버튼을 누르면 날짜판이 뜬다.
// 날짜판은 popover 로 띄워 최상위 레이어에 올린다 — 필터 패널은 overflow-hidden + 세로 스크롤이라
// 보통 팝업으로 두면 268px 달력이 188px 칸 안에서 잘린다. 여닫기·바깥 클릭·Esc 는 popovertarget 이 맡는다
// (클릭 핸들러에서 togglePopover 를 부르면 바깥 클릭 닫기와 겹쳐 닫자마자 다시 열린다).
// 자리는 뜰 때와 스크롤·크기 변경 때 다시 잡는다(CSS 앵커 위치 지정은 아직 브라우저가 갈린다).
export function DateField({
  name,
  value: controlled,
  defaultValue = "",
  onChange,
  disabled,
  "aria-label": label,
}: {
  name?: string;
  disabled?: boolean;
  "aria-label"?: string;
} & (
  // 제어 모드는 고른 값을 되돌려 줄 onChange 와 짝으로만 쓸 수 있다.
  | { value: string; onChange: (value: string) => void; defaultValue?: never }
  | { value?: never; defaultValue?: string; onChange?: (value: string) => void }
)) {
  // 입력칸에 보이는 글자. 치는 도중에는 날짜가 아니므로 onChange 로 내보내지 않는다.
  const [text, setText] = useState(controlled ?? defaultValue);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => firstOfMonth(parse(defaultValue) ?? new Date()));
  // 키보드로 날짜를 옮길 때의 기준 칸. 열려 있는 동안 이 칸만 tabIndex 0 이라 Tab 한 번에 달력을 빠져나간다.
  const [cursor, setCursor] = useState(() => parse(defaultValue) ?? new Date());
  // 서버에서는 빈 값·지원함으로 그리고 브라우저에서 실제 값을 읽는다. 오늘 날짜를 서버에서 그리면
  // 빌드한 날짜가 박히고, popover 지원 여부는 서버가 알 수 없다. 둘 다 구독할 외부 변화가 없어 빈 구독이다.
  const today = useSyncExternalStore(NO_SUBSCRIBE, () => iso(new Date()), () => "");
  // popover 를 모르는 브라우저에서는 달력 버튼을 숨기고 입력칸만 남긴다(빈 판이 화면을 덮지 않게).
  const canPopover = useSyncExternalStore(NO_SUBSCRIBE, HAS_POPOVER, () => true);

  const wrap = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popId = useId();

  const selected = parse(text);
  const value = selected ? iso(selected) : "";

  // 제어 모드에서 부모가 값을 바꾸면 입력칸도 따라간다. 효과로 맞추면 한 번 더 그려야 하므로
  // 그리는 중에 바로 맞춘다(React 가 권하는 방식).
  const [synced, setSynced] = useState(controlled);
  if (controlled !== undefined && controlled !== synced) {
    setSynced(controlled);
    setText(controlled);
  }

  // 입력칸 바로 아래에 두고, 아래 공간이 모자라면 위로 뒤집는다. 화면 밖으로는 나가지 않게 민다.
  const place = () => {
    const el = pop.current;
    const anchor = wrap.current;
    if (!el || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const below = window.innerHeight - r.bottom > el.offsetHeight + 16;
    el.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - el.offsetWidth - 8))}px`;
    el.style.top = `${Math.max(8, below ? r.bottom + 6 : r.top - el.offsetHeight - 6)}px`;
  };

  useEffect(() => {
    if (!open) return;
    place();
    // 필터 패널이 스크롤하면 입력칸이 움직이므로 달력도 따라간다. capture 로 안쪽 스크롤까지 받는다.
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // 열리면 기준 칸으로 포커스를 옮긴다. 닫힐 때 트리거로 되돌리는 것은 popover 가 해 주지 않아 직접 한다.
  useEffect(() => {
    if (open) pop.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }, [open, cursor]);

  // 날짜로 읽히는 값과 빈 값만 내보낸다. 치는 도중의 "2020-0" 이 조회 조건에 실려 가면 안 된다.
  const emit = (next: string) => {
    setText(next);
    const d = parse(next);
    if (d) onChange?.(iso(d));
    else if (!next) onChange?.("");
  };

  const close = () => {
    pop.current?.hidePopover();
    trigger.current?.focus();
  };

  const pick = (d: Date) => {
    setText(iso(d));
    onChange?.(iso(d));
    setCursor(d);
    setView(firstOfMonth(d));
    close();
  };

  const move = (d: Date) => {
    setCursor(d);
    setView(firstOfMonth(d));
  };

  const onKey = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in step) move(addDays(cursor, step[e.key]));
    else if (e.key === "PageUp") move(shiftMonth(cursor, -1));
    else if (e.key === "PageDown") move(shiftMonth(cursor, 1));
    else if (e.key === "Home") move(addDays(cursor, -cursor.getDay()));
    else if (e.key === "End") move(addDays(cursor, 6 - cursor.getDay()));
    else return;
    e.preventDefault();
  };

  return (
    <div ref={wrap} className="relative">
      <input
        name={name}
        value={text}
        disabled={disabled}
        aria-label={label}
        placeholder="YYYY-MM-DD"
        onChange={(e) => emit(e.target.value)}
        onBlur={(e) => {
          // 2020/8/5 처럼 쳐도 받아 YYYY-MM-DD 로 맞춘다. 날짜로 안 읽히면 지운다 —
          // 반쯤 친 값을 그대로 두면 다음 조회에 그 값이 실려 간다.
          const d = parse(e.target.value);
          if (d) {
            setText(iso(d));
            setView(firstOfMonth(d));
          } else if (e.target.value) emit("");
        }}
        className={`${FIELD_BOX} h-[34px] ${canPopover ? "pr-[34px]" : "pr-[10px]"} pl-[10px]`}
      />
      {canPopover && (
        <button
          ref={trigger}
          type="button"
          disabled={disabled}
          popoverTarget={popId}
          aria-label={`${label ?? "날짜"} 달력 열기`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            // 여닫기는 popovertarget 이 한다. 여기서는 어느 달을 펴 둘지만 정한다.
            const d = selected ?? new Date();
            setCursor(d);
            setView(firstOfMonth(d));
          }}
          className="absolute top-0 right-0 grid h-[34px] w-[30px] place-items-center"
        >
          <Image src="/icons/calendar.svg" alt="" width={30} height={30} />
        </button>
      )}

      <div
        ref={pop}
        id={popId}
        popover="auto"
        hidden={!canPopover}
        role="dialog"
        aria-label={`${label ?? "날짜"} 선택`}
        onToggle={(e) => {
          const opened = (e.nativeEvent as ToggleEvent).newState === "open";
          setOpen(opened);
          // 바깥 클릭·Esc 로 닫히면 포커스가 body 로 떨어진다. 그때만 트리거로 되돌린다.
          if (!opened && document.activeElement === document.body) trigger.current?.focus();
        }}
        onBlur={(e) => {
          // Tab 으로 달력 밖으로 나가면 닫는다(StoreSelect·UserPop 과 같은 규칙).
          const next = e.relatedTarget as Node | null;
          if (next && next !== trigger.current && !e.currentTarget.contains(next)) pop.current?.hidePopover();
        }}
        className={POPOVER}
      >
        {/* 열렸을 때만 그린다. 늘 그려 두면 42칸이 서버에서 먼저 그려져 오늘 날짜가 빌드 시점으로 박힌다. */}
        {open && (
          <>
            <div className="flex items-center justify-between">
              <button type="button" aria-label="이전 달" onClick={() => move(shiftMonth(cursor, -1))} className={NAV}>
                {/* chevron-small.svg 는 왼쪽을 본다. 다음 달만 뒤집는다. */}
                <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} />
              </button>
              <p aria-live="polite" className="text-[15px] font-semibold text-erp-ink">
                {view.getFullYear()}년 {view.getMonth() + 1}월
              </p>
              <button type="button" aria-label="다음 달" onClick={() => move(shiftMonth(cursor, 1))} className={NAV}>
                <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="rotate-180" />
              </button>
            </div>

            <div role="grid" onKeyDown={onKey} className="mt-[12px]">
              <div role="row" className="flex">
                {WEEK.map((w, i) => (
                  <span
                    key={w}
                    role="columnheader"
                    className={`grid h-[28px] w-[34px] place-items-center text-[12px] ${i === 0 ? "text-[#e93737]" : "text-erp-label"}`}
                  >
                    {w}
                  </span>
                ))}
              </div>
              {Array.from({ length: 6 }, (_, w) => (
                <div key={w} role="row" className="flex">
                  {monthGrid(view)
                    .slice(w * 7, w * 7 + 7)
                    .map((d) => {
                      const key = iso(d);
                      const outside = d.getMonth() !== view.getMonth();
                      const isSelected = key === value;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="gridcell"
                          aria-label={`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`}
                          aria-selected={isSelected}
                          aria-current={key === today ? "date" : undefined}
                          tabIndex={key === iso(cursor) ? 0 : -1}
                          onClick={() => pick(d)}
                          className={`${CELL} ${
                            isSelected
                              ? "bg-erp-brand text-white"
                              : `hover:bg-erp-thead-bg ${key === today ? "border border-erp-brand text-erp-brand" : outside ? "text-erp-label" : "text-erp-ink"}`
                          }`}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>

            <div className="mt-[12px] flex justify-between border-t border-erp-divider pt-[12px]">
              <button
                type="button"
                onClick={() => {
                  emit("");
                  close();
                }}
                className={`${FOOT} text-erp-label hover:text-erp-ink`}
              >
                지우기
              </button>
              <button type="button" onClick={() => pick(new Date())} className={`${FOOT} text-erp-brand hover:text-erp-ink`}>
                오늘
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
