import type { ReactNode } from "react";

// 구분을 붙이는 꼬리표(관리 주체 · 적용 범위 등). 색이 없는 표 머리 바탕 · 선만 쓴다 —
// 상태를 색으로 말하는 Badge(운영 / 미운영)와 다르다.
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub">
      {children}
    </span>
  );
}
