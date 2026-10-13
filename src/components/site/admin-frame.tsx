import type { ReactNode } from "react";
import { ErpRoot } from "@/components/common";
import { AdminHeader } from "./admin-header";
import { SessionGate } from "./session-gate";

// ERP·플랫폼 로그인 후 화면의 틀. 데모 ui.erpFrame 과 같다 — 화면은 100dvh 안에서 끝나고,
// 1720 보다 좁으면 body 가 아니라 이 바깥 영역이 가로로 스크롤한다. 등록 패널(SlidePanel)이 오른쪽에 겹쳐 서도록 relative + overflow-x-clip.
// 헤더와 그 아래(PageBar + 본문)는 로그인 정보가 준비된 뒤에 그린다(SessionGate). 본문은 각 page 가 그린다.
export function AdminFrame({ area, children }: { area: "erp" | "platform"; children: ReactNode }) {
  return (
    <ErpRoot className="min-h-[100dvh]">
      <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
        <div className="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">
          <SessionGate area={area}>
            <AdminHeader area={area} />
            {children}
          </SessionGate>
        </div>
      </div>
    </ErpRoot>
  );
}
