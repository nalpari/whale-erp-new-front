import type { ReactNode } from "react";
import { AdminFrame } from "@/components/site/admin-frame";

// 웨일ERP(BP) 영역. 로그인 확인은 여기서 하지 않는다 — proxy 가 한다.
export default function ErpLayout({ children }: { children: ReactNode }) {
  return <AdminFrame area="erp">{children}</AdminFrame>;
}
