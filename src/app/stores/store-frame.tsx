import type { ReactNode } from "react";
import { GlobalHeader, PageBar, ServiceLinks, StoreSelect, UserPop } from "@/components/common";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";
// 헤더 메뉴 · 사용자 메뉴는 아직 디자인 견본의 값뿐이다. 1팀 관리자 로그인 · 메뉴 권한이 생기면 그 값으로 바꾼다.
import { MENUS, STORES, USER_ITEMS } from "../design/sample";

/**
 * 점포 정보 관리 화면들의 바깥 틀 — 헤더 · 제목 줄(「점포 정보 관리」) · 본문. 화면 높이에 맞춰 두고 넘치는 내용은
 * 본문 안에서만 스크롤한다(DESIGN.md 「한 화면 규칙」). 목록은 필터 · 목록을 나란히, 상세 · 등록 · 수정은 흰 카드 하나를 둔다.
 */
export function StoreFrame({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">
        <GlobalHeader
          menus={MENUS}
          right={
            <>
              <StoreSelect options={STORES} />
              <ServiceLinks />
              <NotificationBellSlot />
              <UserPop name="정하윤 (BP 마스터)" items={USER_ITEMS} />
            </>
          }
        />
        <PageBar title="점포 정보 관리">{actions}</PageBar>
        {children}
      </div>
    </div>
  );
}

/** 상세 · 등록 · 수정의 본문 — 흰 카드 하나, 넘치면 이 안에서 스크롤한다 */
export function StoreCardBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
      <div className="flex flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">{children}</div>
    </div>
  );
}
