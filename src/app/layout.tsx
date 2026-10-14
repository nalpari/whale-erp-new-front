import type { Metadata } from "next";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";
import { AdminLayout } from "@/components/site/admin-layout";
import { getSession } from "@/lib/api";
import { pretendard } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whale ERP",
  description: "웨일ERP 관리자",
};

// 루트 레이아웃은 하나다. 그룹마다 <html> 을 두면 그룹을 넘나들 때 전체를 다시 불러온다(route-groups 문서 Caveats).
// 로그인 전·후 틀은 AdminLayout 이 주소로 가른다 — 공개 경로면 그대로((public)/(site) 레이아웃이 사이트형 틀), 그 밖은 공통 틀(AdminFrame).
// 알림 종은 서버에서 읽는 컴포넌트라 여기서 만들어 넘기고, 로그인 전에는 부르지 않는다.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AdminLayout alarm={session ? <NotificationBellSlot /> : null}>{children}</AdminLayout>
      </body>
    </html>
  );
}
