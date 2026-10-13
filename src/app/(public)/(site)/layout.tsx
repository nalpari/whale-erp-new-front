import type { ReactNode } from "react";
import { ErpRoot } from "@/components/common";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

// 로그인 전 화면(홈·로그인, 나중에 찾기·가입·도입문의·공지사항)의 틀. 카드형 틀은 두지 않는다 — 전부 상단 메뉴 + 본문 + 푸터(2026-10-12).
// ERP 화면과 달리 페이지 전체가 세로로 스크롤한다.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ErpRoot>
      <div className="flex min-h-[100dvh] flex-col bg-white">
        <SiteNav />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </ErpRoot>
  );
}
