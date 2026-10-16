import type { ReactNode } from "react";

const TONE = {
  on: "min-w-[44px] bg-erp-on-bg text-erp-on",
  off: "bg-erp-off-bg text-erp-off",
  // 폐점처럼 "더는 다루지 않는" 상태 — 미운영(위험 빨강)과 달리 손댈 일이 없는 상태라 회색이다.
  closed: "bg-erp-thead-bg text-erp-sub",
};

// Figma Beage. 운영(on) / 미운영(off) / 폐점(closed) 같은 상태 표시.
export function Badge({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-[2px] px-[4px] py-[2px] text-center text-[14px] font-medium ${TONE[tone] ?? TONE.off}`}>
      {children}
    </span>
  );
}
