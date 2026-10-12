import type { ReactNode } from "react";

// 칸 둘을 위쪽에 맞춰 나란히(도움말 줄 수가 달라도 입력칸이 어긋나지 않게). docs/demo/src/public.mjs 의 row 와 같다.
// 공통 컴포넌트 FormRow(src/components/common/form.tsx)는 items-start 가 없어 auth 전용으로 따로 둔다.
export function Row({ children }: { children: ReactNode }) {
  return <div className="flex w-full items-start gap-[6px]">{children}</div>;
}
