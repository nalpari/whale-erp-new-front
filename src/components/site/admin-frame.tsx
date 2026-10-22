import type { ReactNode } from "react";
import { ErpRoot, PanelBackdrop } from "@/components/common";
import { AdminHeader } from "./admin-header";
import { SessionGate } from "./session-gate";

// 로그인 후 화면의 틀 하나(ERP·플랫폼 구분 없음 — 서비스는 탭마다 SessionGate 가 정한다). 데모 ui.erpFrame 과 같다 — 화면은 100dvh 안에서 끝나고,
// 1720 보다 좁으면 body 가 아니라 이 바깥 영역이 가로로 스크롤한다. 등록 패널(SlidePanel)이 오른쪽에 겹쳐 서도록 relative + overflow-x-clip.
// 헤더와 그 아래(PageBar + 본문)는 로그인 정보가 준비된 뒤에 그린다(SessionGate). 본문은 각 page 가 그린다.
// alarm 은 알림 종(NotificationBellSlot, 서버 컴포넌트)이다. 클라이언트 쪽에서 그려지므로 루트 레이아웃이 만들어 넘긴다.
// PanelBackdrop 은 가장 위 SlidePanel 이 closeOnBackdrop 을 켰을 때만 화면 전체(헤더 포함)를 덮는 바탕창이다(2026-10-20) —
// 패널보다 뒤에 둬야 z-index 로만이 아니라 DOM 순서로도 패널 쪽 탭 이동이 바탕창보다 먼저 온다.
export function AdminFrame({ alarm, children }: { alarm: ReactNode; children: ReactNode }) {
  return (
    <ErpRoot className="min-h-[100dvh]">
      <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
        <div className="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">
          <SessionGate header={<AdminHeader alarm={alarm} />}>{children}</SessionGate>
          <PanelBackdrop />
        </div>
      </div>
    </ErpRoot>
  );
}
