"use client";

import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { EASE_OUT } from "./theme";
import { EMPTY_TOAST_QUEUE, onToastExpire, onToastShow, type ToastQueue } from "./toast-queue";

// 공통 토스트 — 저장 · 수정 · 삭제가 성공하면 화면 하단 가운데에 한 줄로 띄우고 3초 뒤 사라진다(2026-10-12 결정).
// 문구는 화면마다 짓지 않고 아래 셋을 쓴다. 다른 안내가 꼭 필요하면 문자열을 그대로 넘긴다.
// 화면 이동(저장 후 상세로 가기 등)을 해도 남도록 ErpRoot 가 한 번만 둔다 — 화면은 useToast() 로 부르기만 한다.
export const TOAST_MESSAGE = {
  saved: "저장되었습니다.",
  updated: "수정되었습니다.",
  deleted: "삭제되었습니다.",
} as const;

export type ToastKind = keyof typeof TOAST_MESSAGE;

const SHOW_MS = 3000;
/** 다음 토스트를 띄우기 전에 앞의 것이 닫히는 시간(닫힘 전환 150ms) — 문구만 바뀌면 새 안내인 줄 모른다 */
const GAP_MS = 150;

const ToastContext = createContext<((kind: ToastKind | string) => void) | null>(null);

/** 토스트를 띄우는 함수. `toast("saved")` · `toast("updated")` · `toast("deleted")`. */
export function useToast() {
  const show = use(ToastContext);
  if (!show) throw new Error("useToast 는 ErpRoot(ToastProvider) 안에서만 쓴다");
  return show;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 지금 떠 있는(또는 곧 뜰) 문구와 그 뒤에 기다리는 문구 — 차례 판정은 toast-queue.ts
  const queue = useRef<ToastQueue>(EMPTY_TOAST_QUEUE);
  // 내려갈 때 기다리던 타이머를 지운다
  useEffect(() => () => clearTimeout(timer.current), []);

  const present = (text: string) => {
    setMessage(text);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const { state, next } = onToastExpire(queue.current);
      queue.current = state;
      setOpen(false);
      if (next !== null) timer.current = setTimeout(() => present(next), GAP_MS);
    }, SHOW_MS);
  };

  // 떠 있는 동안 다른 문구가 오면 앞의 것이 3초를 다 채운 뒤 차례로 띄운다(저장 뒤 「점포 목록이 변경되었습니다.」 등, 2026-10-29).
  // 같은 문구 · 이미 기다리는 문구의 처리는 onToastShow 를 본다.
  const show = (kind: ToastKind | string) => {
    const text = kind in TOAST_MESSAGE ? TOAST_MESSAGE[kind as ToastKind] : kind;
    const { state, present: now } = onToastShow(queue.current, text);
    queue.current = state;
    if (now) present(text);
  };

  return (
    <ToastContext value={show}>
      {children}
      {/* 늘 마운트해 두고 전환으로 여닫는다. 떠 있는 것이라 팝업 그림자 하나를 쓴다(DESIGN.md Elevation). */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-[24px] left-1/2 z-[100] -translate-x-1/2 rounded-[2px] bg-erp-nav px-[24px] py-[12px] text-[14px] font-medium whitespace-nowrap text-white shadow-[0_2px_6px_rgba(40,47,55,0.08)] transition-[opacity,translate,visibility] ${EASE_OUT} motion-reduce:transition-none ${
          open ? "visible translate-y-0 opacity-100 duration-200" : "invisible translate-y-[6px] opacity-0 duration-150"
        }`}
      >
        {message}
      </div>
    </ToastContext>
  );
}
