import type { ReactNode } from "react";
import { ErpRoot } from "@/components/common";
import { GUEST_FONTS } from "@/app/design/guest/fonts";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

// 로그인 전 화면(홈·로그인·가입, 나중에 찾기·도입문의·공지사항)의 틀. 카드형 틀은 두지 않는다 — 전부 상단 메뉴 + 본문 + 푸터(2026-10-12).
// ERP 화면과 달리 페이지 전체가 세로로 스크롤한다. GUEST_FONTS(REM·Inter Tight·Inter 변수)를 여기서 달아야
// guest 영문 표기(가입 완료의 "BUSINESS MEMBERSHIP" 등)가 Pretendard 로 떨어지지 않는다 — design/guest/layout.tsx
// 가 샘플에서 쓰는 것과 같은 변수를, 이 틀도 비로그인 화면이라 그대로 받는다(2026-10-15 pr-review-toolkit).
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ErpRoot>
      <div className={`flex min-h-[100dvh] flex-col bg-white ${GUEST_FONTS}`}>
        <SiteNav />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
      </div>
    </ErpRoot>
  );
}
