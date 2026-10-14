import type { Metadata } from "next";
import { pretendard } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whale ERP",
  description: "웨일ERP 관리자",
};

// 루트 레이아웃은 하나다. 그룹마다 <html> 을 두면 그룹을 넘나들 때 전체를 다시 불러온다(route-groups 문서 Caveats).
// 영역별 틀은 (public)/(site) · (erp) · platform 레이아웃이 맡는다.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
