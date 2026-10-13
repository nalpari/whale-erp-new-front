import type { ReactNode } from "react";
import { AdminFrame } from "@/components/site/admin-frame";

// 플랫폼관리 영역. BP·가맹 계정은 proxy 가 /home 으로 돌려보낸다.
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <AdminFrame area="platform">{children}</AdminFrame>;
}
