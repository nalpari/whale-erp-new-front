import { Suspense, type ReactNode } from "react";
import { GuideMiniCardSlot } from "@/app/start-guide/guide-mini-card";
import { ErpRoot, PanelBackdrop } from "@/components/common";
import { AdminHeader } from "./admin-header";
import { LogoutFailedDialog } from "./logout-failed-dialog";
import { SessionExpiredDialog } from "./session-expired-dialog";
import { SessionGate } from "./session-gate";

// 로그인 후 화면의 틀 하나(ERP·플랫폼 구분 없음 — 서비스는 탭마다 SessionGate 가 정한다). 데모 ui.erpFrame 과 같다 — 화면은 100dvh 안에서 끝나고,
// 최소폭(1260)보다 좁으면 body 가 아니라 이 바깥 영역이 가로로 스크롤한다. 등록 패널(SlidePanel)이 오른쪽에 겹쳐 서도록 relative + overflow-x-clip.
// 헤더와 그 아래(PageBar + 본문)는 로그인 정보가 준비된 뒤에 그린다(SessionGate). 본문은 각 page 가 그린다.
// alarm 은 알림 종(NotificationBellSlot, 서버 컴포넌트)이다. 클라이언트 쪽에서 그려지므로 루트 레이아웃이 만들어 넘긴다.
// PanelBackdrop 은 가장 위 SlidePanel 이 closeOnBackdrop 을 켰을 때만 화면 전체(헤더 포함)를 덮는 바탕창이다(2026-10-20) —
// 패널보다 뒤에 둬야 z-index 로만이 아니라 DOM 순서로도 패널 쪽 탭 이동이 바탕창보다 먼저 온다.
// SessionExpiredDialog 는 화면을 쓰다 로그인이 끊겼을 때의 「로그인 만료」 팝업 하나다(bff() · useAction 이 알린다).
// LogoutFailedDialog 는 로그아웃이 실패했을 때의 팝업이다(signOut() 이 알린다).
export function AdminFrame({ alarm, children }: { alarm: ReactNode; children: ReactNode }) {
  return (
    <ErpRoot className="min-h-[100dvh]">
      <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
        {/* 최소폭 1260 — 플랫폼 · 웨일ERP 탭 같다(로그인 전 화면과 같은 값, 1280 창에서 세로 스크롤바를 빼도 가로 스크롤이 없다, 2026-11-16 사용자 지정).
              전엔 1720 이었고 플랫폼(front #289) · 웨일ERP 차례로 낮췄다 */}
        <div className="relative flex h-full min-w-[1260px] flex-col overflow-x-clip">
          <SessionGate header={<AdminHeader alarm={alarm} />}>
            {children}
            {/* 시작 가이드 미니 카드 — 주소를 읽으므로 Suspense 로 감싼다. 자동 띄우기가 계정 · BP · 점포를 읽어 SessionGate 안에 둔다
                (2026-11-16 — 밖에 두었더니 로그인 정보가 준비되기 전에 그려져 「SessionGate 안에서만 쓸 수 있습니다」로 화면이 멈췄다) */}
            <Suspense fallback={null}>
              <GuideMiniCardSlot />
            </Suspense>
          </SessionGate>
          <PanelBackdrop />
        </div>
      </div>
      <SessionExpiredDialog />
      <LogoutFailedDialog />
    </ErpRoot>
  );
}
