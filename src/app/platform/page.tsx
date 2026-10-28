import { PageBar } from "@/components/common";
import { NoMenuNotice } from "./no-menu-notice";

// 플랫폼은 홈이 없다 — /platform 은 헤더 순서상 첫 메뉴로 넘겨 주는 주소다(SessionGate, 2026-10-28 재영).
// 이 화면이 보이는 것은 접근할 플랫폼 메뉴가 없을 때(권한 요청 안내)와 비밀번호 강제 변경 팝업이 떠 있는 동안뿐이다.
// 다른 화면으로 직접 redirect 하지 않는다. 권한 없는 메뉴로 보내면 「이전 화면으로」가 되돌아오며 맴돈다 — 첫 메뉴는 조회 권한으로 고른다.
export default function PlatformEntry() {
  return (
    <>
      <PageBar title="플랫폼관리" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <main className="flex flex-1 items-center justify-center overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <NoMenuNotice />
        </main>
      </div>
    </>
  );
}
