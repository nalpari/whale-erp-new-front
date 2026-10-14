import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminFrame } from "@/components/site/admin-frame";
import { getSession } from "@/lib/api";
import { isPlatformRole } from "@/lib/auth-routes";

export const metadata: Metadata = {
  title: "Whale ERP 플랫폼 관리",
  robots: { index: false },
};

// 플랫폼 관리 화면의 틀 — 공통 틀(로그인 정보 게이트 · 공통 헤더)을 씌우고, 각 화면(page.tsx)은 제목 줄(PageBar)과 본문만 둔다.
// 플랫폼 화면은 모두 /platform 아래라 이 레이아웃 하나가 전부에 걸린다.
// BP·가맹 계정은 처음 들어올 때 여기서 /home 으로 돌려보낸다(화면 구조도 내려보내지 않는다).
// 레이아웃은 화면 이동 때 다시 실행되지 않으므로, 그 뒤의 이동은 SessionGate 가 같은 확인을 한다.
export default async function PlatformLayout({ children }: LayoutProps<"/platform">) {
  const session = await getSession();
  if (session && !isPlatformRole(session.roleTypeCode)) redirect("/home");
  return <AdminFrame area="platform">{children}</AdminFrame>;
}
