import type { ReactNode } from "react";
import { ERP_THEME } from "./theme";

// ERP 컴포넌트를 쓰는 화면의 최상위. 밝은 테마와 Pretendard 를 이 안에만 적용한다.
export function ErpRoot({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`${ERP_THEME} ${className}`}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        precedence="default"
      />
      {children}
    </div>
  );
}
