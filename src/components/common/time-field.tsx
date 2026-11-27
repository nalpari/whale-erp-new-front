"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { POPOVER } from "./date-field";
import { colonizeTime, isTime, pad, parseTime } from "./date-math";
import { FIELD_BOX } from "./theme";

const NO_SUBSCRIBE = () => () => {};
const HAS_POPOVER = () => "popover" in HTMLElement.prototype;

const HOURS = Array.from({ length: 24 }, (_, h) => pad(h));
/** 판에서 고르는 분은 1분 단위(00~59)다(2026-11-27 사용자 지정 — 전엔 5분 단위). */
const MINUTES = Array.from({ length: 60 }, (_, m) => pad(m));

const COL = "flex h-[200px] w-[56px] flex-col gap-[2px] overflow-y-auto overscroll-contain pr-[2px] [scrollbar-width:thin]";
const CELL = "grid h-[30px] w-full shrink-0 place-items-center rounded-[2px] text-[14px] tabular-nums transition-colors duration-150 ease-out";
const FOOT = "text-[13px] transition-colors duration-150 ease-out";

// 시간 입력칸(2026-11-27 사용자 지정 — 네이티브 <input type="time"> 은 칸 안 시 · 분 조각을 하나씩 눌러 바꿔야 해 다루기 어려웠다).
// DateField 처럼 직접 칠 수도 있고(0930 · 9:30 · 9.30 → 09:30, 덜 친 1~3자리는 시각으로 채우지 않는다), 시계 버튼을 누르면 시 · 분 두 열 판에서 고를 수 있다.
// 판은 DateField 와 같은 popover 모양이다. 시를 고르면 분이 없을 때 00분으로 채우고, 분을 고르면 닫는다(시가 비었으면 시를 고를 때까지 연 채 기다린다).
// 값은 네이티브 시간 칸과 같은 HH:MM(24시간)이다. 치는 중에는 다 친 값만 내보내고, 칸을 벗어날 때 시간으로 읽히면 HH:MM 으로 맞춘다.
// 읽히지 않으면 지우지 않고 친 글자를 그대로 내보낸다 — 쓰는 쪽의 저장 검사(「시 · 분까지 입력해 주세요」)가 잡게.
export function TimeField({
  value: controlled,
  defaultValue = "",
  onChange,
  disabled,
  name,
  "aria-label": label,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  /** 있으면 제어 모드 — 고른 값은 onChange 로 받는다. 없으면 defaultValue 로 시작한다(디자인 견본 등) */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
}) {
  const [text, setText] = useState(controlled ?? defaultValue);
  const [open, setOpen] = useState(false);
  // 시 · 분 목록에서 방향키로 옮겨 간 칸 — Tab 정지점(tabIndex 0)은 이 칸이다. 판을 열 때마다 비우고, 비면 고른 칸(없으면 첫 칸).
  const [cursor, setCursor] = useState<{ hour: string | null; minute: string | null }>({ hour: null, minute: null });
  // 시가 비어 있을 때 먼저 고른 분 — 시를 09 로 채워 닫지 않고, 판을 연 채 시를 고르면 함께 넣고 닫는다(PR #341 재영 리뷰).
  const [pendingMinute, setPendingMinute] = useState<string | null>(null);
  const canPopover = useSyncExternalStore(NO_SUBSCRIBE, HAS_POPOVER, () => true);

  const wrap = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popId = useId();

  // 부모가 값을 바꾸면 칸도 따라간다(DateField 와 같은 방식).
  const [synced, setSynced] = useState(controlled);
  if (controlled !== undefined && controlled !== synced) {
    setSynced(controlled);
    setText(controlled);
  }

  const current = isTime(text) ? text : parseTime(text);
  const [hour, minute] = current ? current.split(":") : [null, null];

  // 칸 바로 아래, 모자라면 위로(DateField 와 같다).
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
    // 고른 시 · 분이 줄 가운데에 오게 맞춘다
    pop.current?.querySelectorAll<HTMLElement>('[aria-selected="true"]').forEach((el) => el.scrollIntoView({ block: "center" }));
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // 치는 중에는 다 친 HH:MM 과 빈 값만 내보낸다 — 덜 친 값이 부모로 가면 제어 모드가 칸을 덮어쓴다.
  const emit = (next: string) => {
    setText(next);
    if (isTime(next)) onChange?.(next);
    else if (!next) onChange?.("");
  };

  // 친 값을 HH:MM 으로 맞춰 내보낸다 — 칸을 벗어날 때와 Enter 를 누를 때 같다(Enter 로 바로 제출해도 화면에 보이는 값이 넘어가게).
  // 값이 그대로면 내보내지 않는다(쓰는 쪽이 서버 거절 문장을 지우지 않게).
  const commit = (raw: string) => {
    const t = parseTime(raw);
    if (t) {
      setText(t);
      if (t !== controlled) onChange?.(t);
    } else if (raw && raw !== controlled) {
      // 시간으로 안 읽히면 지우지 않고 그대로 넘겨 저장 검사가 알리게 한다 — 조용히 지우면 넣으려던 시각이 사라진다.
      onChange?.(raw);
    }
  };

  // 시 · 분 목록은 목록마다 Tab 한 번으로 들어가고(고른 칸, 없으면 첫 칸), 안에서는 위 · 아래 · Home · End 로 옮긴다.
  const moveInList = (list: "hour" | "minute") => (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const options = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]')];
    const at = options.indexOf(document.activeElement as HTMLButtonElement);
    const last = options.length - 1;
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? last : e.key === "ArrowDown" ? Math.min(last, at + 1) : Math.max(0, at - 1);
    e.preventDefault();
    const target = options[next];
    if (!target) return;
    target.focus();
    target.scrollIntoView({ block: "nearest" });
    const value = target.dataset.value ?? null;
    setCursor((c) => ({ ...c, [list]: value }));
  };
  const hourStop = cursor.hour ?? hour ?? HOURS[0];
  const shownMinute = pendingMinute ?? minute;
  const minuteStop = cursor.minute ?? shownMinute ?? MINUTES[0];

  const set = (next: string, closeAfter: boolean) => {
    setText(next);
    onChange?.(next);
    if (closeAfter) {
      pop.current?.hidePopover();
      trigger.current?.focus();
    }
  };

  return (
    <div ref={wrap} className="relative">
      <input
        name={name}
        value={text}
        disabled={disabled}
        inputMode="numeric"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        placeholder="HH:MM"
        onChange={(e) => emit(colonizeTime(e.target.value))}
        // 9:05 · 9.05 · 0905 처럼 쳐도 HH:MM 으로 맞춘다(덜 친 1~3자리는 그대로 넘겨 저장 검사가 막는다)
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
        }}
        className={`${FIELD_BOX} h-[34px] ${canPopover ? "pr-[34px]" : "pr-[10px]"} pl-[10px] tabular-nums`}
      />
      {canPopover && (
        <button
          ref={trigger}
          type="button"
          disabled={disabled}
          popoverTarget={popId}
          aria-label={`${label ?? "시간"} 고르기`}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="absolute top-0 right-0 grid h-[34px] w-[30px] place-items-center text-erp-label disabled:opacity-40"
        >
          {/* 시계 — 달력 버튼 자리 · 크기에 맞춘 선 그림(색은 erp-label 회색) */}
          <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-[15px]">
            <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 4.75V8l2.25 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <div
        ref={pop}
        id={popId}
        popover="auto"
        hidden={!canPopover}
        role="dialog"
        aria-label={`${label ?? "시간"} 선택`}
        onToggle={(e) => {
          const opened = (e.nativeEvent as ToggleEvent).newState === "open";
          setOpen(opened);
          if (opened) setCursor({ hour: null, minute: null });
          if (!opened) setPendingMinute(null);
          if (!opened && document.activeElement === document.body) trigger.current?.focus();
        }}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && next !== trigger.current && !e.currentTarget.contains(next)) pop.current?.hidePopover();
        }}
        className={`${POPOVER} w-[164px]!`}
      >
        {open && (
          <>
            <div className="flex gap-[8px]">
              <div className="flex flex-col gap-[6px]">
                <p className="text-center text-[12px] text-erp-label">시</p>
                <div role="listbox" aria-label="시" className={COL} onKeyDown={moveInList("hour")}>
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      role="option"
                      data-value={h}
                      tabIndex={h === hourStop ? 0 : -1}
                      aria-selected={h === hour}
                      onClick={() => {
                        const m = pendingMinute ?? minute;
                        setPendingMinute(null);
                        set(`${h}:${m ?? "00"}`, pendingMinute !== null);
                      }}
                      className={`${CELL} ${h === hour ? "bg-erp-brand text-white" : "text-erp-ink hover:bg-erp-thead-bg"}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-[6px]">
                <p className="text-center text-[12px] text-erp-label">분</p>
                <div role="listbox" aria-label="분" className={COL} onKeyDown={moveInList("minute")}>
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="option"
                      data-value={m}
                      tabIndex={m === minuteStop ? 0 : -1}
                      aria-selected={m === shownMinute}
                      onClick={() => {
                        if (hour === null) setPendingMinute(m);
                        else set(`${hour}:${m}`, true);
                      }}
                      className={`${CELL} ${m === shownMinute ? "bg-erp-brand text-white" : "text-erp-ink hover:bg-erp-thead-bg"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-[12px] flex justify-between border-t border-erp-divider pt-[12px]">
              <button type="button" onClick={() => set("", true)} className={`${FOOT} text-erp-label hover:text-erp-ink`}>
                지우기
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  set(`${pad(now.getHours())}:${pad(now.getMinutes())}`, true);
                }}
                className={`${FOOT} text-erp-brand hover:text-erp-ink`}
              >
                지금
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
