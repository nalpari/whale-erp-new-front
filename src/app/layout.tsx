import type { Metadata } from "next";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";
import { AdminLayout } from "@/components/site/admin-layout";
import { getSession } from "@/lib/api";
import { hasLiveAccessToken } from "@/lib/auth-routes";
import { pretendard } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whale ERP",
  description: "웨일ERP 관리자",
};

// 루트 레이아웃은 하나다. 그룹마다 <html> 을 두면 그룹을 넘나들 때 전체를 다시 불러온다(route-groups 문서 Caveats).
// 로그인 전·후 틀은 AdminLayout 이 주소로 가른다 — 공개 경로면 그대로(각 경로의 레이아웃 — 로그인 전 화면은 (public)/(site)), 그 밖은 공통 틀(AdminFrame).
// 알림 종은 서버에서 읽는 컴포넌트라 여기서 만들어 넘기고, 로그인 전에는 부르지 않는다.
// 쿠키만 보지 않고 접근 토큰이 살아 있을 때만 그린다 — 로그인 전 화면(/ · /notices 등)은 proxy 가 갱신하지 않아, 끝난 로그인의 쿠키로 오면
// 종이 끝난 토큰으로 알림을 불러 401(「토큰이 유효하지 않습니다.」)을 남겼다(2026-11-12). 로그인 후 화면은 proxy 가 먼저 갱신하거나 /login 으로 보낸다.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AdminLayout alarm={hasLiveAccessToken(session) ? <NotificationBellSlot /> : null}>{children}</AdminLayout>
      </body>
    </html>
  );
}
