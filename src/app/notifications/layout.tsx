import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "운영 알림함 · Whale ERP",
};

// 테마 · 글꼴(ErpRoot)과 머리글은 공통 틀(AdminFrame)이 씌운다. 여기서는 탭 제목만 정한다.
export default function NotificationsLayout({ children }: LayoutProps<"/notifications">) {
  return children;
}
