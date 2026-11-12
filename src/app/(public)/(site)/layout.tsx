import type { ReactNode } from "react";
import { ErpRoot } from "@/components/common";
import { GUEST_FONTS } from "@/app/design/guest/fonts";
import { GuestFooter } from "@/app/design/guest/guest-footer";
import { GuestHeader } from "@/app/design/guest/guest-header";
import { getSession } from "@/lib/api";
import { homeOf } from "@/lib/auth-routes";

// 로그인 전 화면(홈·매장운영·부가서비스·로그인·가입·찾기·공지사항·도입문의)의 틀. 카드형 틀은 두지 않는다 — 전부 상단 메뉴 + 본문 + 푸터(2026-10-12).
// 머리말·푸터는 Figma 「로그인전」 샘플(design/guest)의 것을 그대로 쓴다 — 샘플과 실제 화면이 한 구현을 공유하고 링크만 guest-routes.ts 로 가른다(2026-10-19).
// ERP 화면과 달리 페이지 전체가 세로로 스크롤한다. 최소폭은 1260px — 1280px 창에서 세로 스크롤바(15~20px)를 빼도 가로 스크롤이 생기지 않게 1280 에서 줄였다(2026-11-12 사용자 지정. 2026-11-11 엔 1280, 전엔 관리자 웹과 같은 1720px). break-keep 과 함께 design/guest/layout.tsx 와 같다.
// 입력칸은 화면 위 150px 아래에서 멈춘다(scroll-mt) — 빈 필수 칸을 브라우저가 찾아 올릴 때 칸과 「이 입력란을 작성하세요.」 말풍선이 고정 머리말(110px) 밑에 가려졌다(회원가입, 2026-11-12 사용자 지정).
// GUEST_FONTS(REM·Inter Tight·Inter 변수)를 여기서 달아야 guest 영문 표기가 Pretendard 로 떨어지지 않는다(2026-10-15 pr-review-toolkit).
export default async function SiteLayout({ children }: { children: ReactNode }) {
  // 로그인한 채 열면 머리말의 Login 자리에 「홈으로」(자기 홈)를 보인다 — 이유는 guest-header.tsx(PR #44).
  const session = await getSession();
  return (
    <ErpRoot>
      <div className={`flex min-h-[100dvh] min-w-[1260px] flex-col bg-white break-keep [&_:is(input,select,textarea)]:scroll-mt-[150px] ${GUEST_FONTS}`}>
        <GuestHeader homeHref={session ? homeOf(session.roleTypeCode) : undefined} />
        <main className="flex flex-1 flex-col">{children}</main>
        <GuestFooter />
      </div>
    </ErpRoot>
  );
}
