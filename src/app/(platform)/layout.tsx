import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminFrame } from "@/components/site/admin-frame";
import { getSession } from "@/lib/api";
import { isPlatformRole } from "@/lib/auth-routes";

// 플랫폼관리 영역. BP·가맹 계정은 처음 들어올 때 여기서 /home 으로 돌려보낸다(화면 구조도 내려보내지 않는다).
// 레이아웃은 화면 이동 때 다시 실행되지 않으므로, 그 뒤의 이동은 SessionGate 가 같은 확인을 한다.
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session && !isPlatformRole(session.roleTypeCode)) redirect("/home");
  return <AdminFrame area="platform">{children}</AdminFrame>;
}
