import type { ReactNode } from "react";

// Figma Tops. 목록 위 줄. 왼쪽은 총 건수, 오른쪽(children)은 버튼·건수 선택 같은 동작.
export function ListToolbar({ total, children }: { total: number; children?: ReactNode }) {
  return (
    <div className="flex items-end gap-[6px]">
      <p className="flex-1 text-[14px] text-erp-ink">
        총 <b className="font-semibold">{total.toLocaleString("ko-KR")}</b> 건
      </p>
      {children}
    </div>
  );
}
