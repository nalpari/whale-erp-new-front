import type { ReactNode } from "react";

const TONE = {
  on: "min-w-[44px] bg-erp-on-bg text-erp-on",
  off: "bg-erp-off-bg text-erp-off",
};

// Figma Beage. 운영(on) / 미운영(off) 같은 상태 표시.
export function Badge({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-[2px] px-[4px] py-[2px] text-center text-[14px] font-medium ${TONE[tone]}`}>
      {children}
    </span>
  );
}
