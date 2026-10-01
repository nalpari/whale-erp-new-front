import type { ReactNode } from "react";

// Figma Top2 의 Utill. 페이지 제목 줄. 서비스 바로가기는 헤더로 올라갔고, 오른쪽은 children 으로 채운다.
export function PageBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-[59px] items-center border-b border-erp-bar-line bg-white px-[24px]">
      <h1 className="flex-1 text-[22px] font-semibold text-erp-ink">{title}</h1>
      {children}
    </div>
  );
}
