import type { ReactNode } from "react";
import { ERP_THEME } from "./theme";

// ERP 컴포넌트를 쓰는 화면의 최상위. 밝은 테마와 font-erp 를 이 안에만 건다.
// 글꼴 자체는 여기서 불러오지 않는다 — 루트 layout 의 <html> 에 pretendard.variable(src/app/fonts.ts)이 붙어 있어야
// --font-erp 가 채워진다. 빠지면 조용히 시스템 글꼴로 떨어진다.
export function ErpRoot({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`${ERP_THEME} ${className}`}>{children}</div>;
}
