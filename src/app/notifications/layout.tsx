import type { Metadata } from "next";
import { ErpRoot } from "@/components/common";

export const metadata: Metadata = {
  title: "운영 알림함 · Whale ERP",
};

// ERP 화면의 밝은 테마 · font-erp 는 ErpRoot 안에만 걸린다(DESIGN.md).
export default function NotificationsLayout({ children }: LayoutProps<"/notifications">) {
  return <ErpRoot className="min-h-[100dvh]">{children}</ErpRoot>;
}
