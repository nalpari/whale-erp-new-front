"use client";

import { createContext, use, useRef, useState, type ReactNode } from "react";
import { EASE_OUT } from "./theme";

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

  // 연달아 띄우면 문구만 바꾸고 3초를 처음부터 다시 센다.
  const show = (kind: ToastKind | string) => {
    setMessage(kind in TOAST_MESSAGE ? TOAST_MESSAGE[kind as ToastKind] : kind);
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), SHOW_MS);
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
