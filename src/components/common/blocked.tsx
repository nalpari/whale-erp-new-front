import type { ReactNode } from "react";

/** 막힌 버튼의 이유 안내. 막힌 버튼은 호버를 받지 않으므로(Button 의 disabled:pointer-events-none) 감싸는 칸에 단다. */
export function Blocked({ reason, children }: { reason?: string; children: ReactNode }) {
  return (
    <span title={reason} className="inline-flex">
      {children}
    </span>
  );
}
