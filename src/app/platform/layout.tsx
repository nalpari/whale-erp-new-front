import type { Metadata } from "next";
import { ErpRoot, GlobalHeader, ServiceLinks, UserPop } from "@/components/common";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";
import { PLATFORM_MENUS } from "./platform-menus";

export const metadata: Metadata = {
  title: "Whale ERP 플랫폼 관리",
  robots: { index: false },
};

// 플랫폼 관리 화면의 틀 — 헤더 아래에 각 화면이 제목 줄(PageBar)과 본문을 둔다.
// 화면 높이 안에서 끝나고, 1720 보다 좁은 창에서는 body 가 아니라 이 바깥 영역이 가로로 스크롤한다(DESIGN.md Layout).
//
// TODO(공통 헤더): 아래 헤더 조립은 임시다. 공통 헤더 · 공통 레이아웃(메뉴 api · 로그인 사용자 · BP 선택 포함)이 나오면
// 이 GlobalHeader 조립을 통째로 그것으로 바꾸고 ./platform-menus.ts 는 지운다. 헤더는 이 파일 한 곳에서만 조립하므로
// 각 화면(page.tsx)은 고치지 않는다.
// 지금 임시인 것: 메뉴 목록(platform-menus.ts 에 직접 적음), 사용자 이름(‘플랫폼 관리자’ 고정), 로그아웃 링크(#), BP 선택(없음).
export default function PlatformLayout({ children }: LayoutProps<"/platform">) {
  return (
    <ErpRoot>
      <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
        {/* 등록 패널(SlidePanel)이 오른쪽에 겹쳐 선다. 닫혀 있을 때는 오른쪽 바깥에 서 있어 잘라 낸다. */}
        <div className="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">
          <GlobalHeader
            menus={PLATFORM_MENUS}
            right={
              <>
                <ServiceLinks />
                <NotificationBellSlot />
                <UserPop name="플랫폼 관리자" items={[{ label: "로그아웃", href: "#", danger: true }]} />
              </>
            }
          />
          {children}
        </div>
      </div>
    </ErpRoot>
  );
}
