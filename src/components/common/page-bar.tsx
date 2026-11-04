import type { ReactNode } from "react";

// Figma Top2 의 Utill. 페이지 제목 줄. 서비스 바로가기는 헤더로 올라갔고, 오른쪽은 children 으로 채운다.
// titleSize — 기본 22px(Display). 문장으로 된 제목(홈 인사말)은 18px 로 줄인다(2026-11-04 사용자 지정 — 22px 는 너무 컸다)
export function PageBar({ title, titleSize = "display", children }: { title: ReactNode; titleSize?: "display" | "sentence"; children?: ReactNode }) {
  return (
    <div className="flex h-[59px] items-center border-b border-erp-bar-line bg-white px-[24px]">
      <h1 className={`flex-1 ${titleSize === "sentence" ? "text-[18px]" : "text-[22px]"} font-semibold text-erp-ink`}>{title}</h1>
      {children}
    </div>
  );
}
